package test

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/blmayer/awslambdarpc/client"
	"io"
	"log"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"
)

var (
	lambdaServerPort int64
)

func init() {
	var err error

	rawLambdaServerPort := strings.TrimSpace(os.Getenv("_LAMBDA_SERVER_PORT"))

	lambdaServerPort, err = strconv.ParseInt(rawLambdaServerPort, 10, 64)
	if err != nil {
		log.Panic(
			fmt.Errorf(
				"_LAMBDA_SERVER_PORT=%#+v unset / empty / couldn't be parsed as an integer",
				rawLambdaServerPort,
			),
		)
	}
}

// RunLambdaHandler spawns a goroutine to run the given handler as a Lambda (listening on _LAMBDA_SERVER_PORT)
func RunLambdaHandler(ctx context.Context, handler any) func() {
	lambdaCtx, lambdaCancel := context.WithCancel(ctx)

	go func() {
		lambda.StartWithContext(lambdaCtx, handler)
	}()

	runtime.Gosched()

	return lambdaCancel
}

// RunLambdaHandlerWithTimeout calls RunLambdaHandler with a context.Context that cancels after the given timeout
func RunLambdaHandlerWithTimeout(handler any, timeout time.Duration) func() {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	RunLambdaHandler(ctx, handler)

	return cancel
}

// InvokeLambda calls client.Invoke against localhost:_LAMBDA_SERVER_PORT and expects it to behave like a Lambda
func InvokeLambda(request any, timeout time.Duration) (any, error) {
	requestJSON, err := json.Marshal(request)
	if err != nil {
		return nil, err
	}

	requestBase64 := base64.StdEncoding.EncodeToString(requestJSON)

	albTargetGroupRequest := events.ALBTargetGroupRequest{
		Body:            requestBase64,
		IsBase64Encoded: true,
	}

	albTargetGroupRequestJSON, err := json.Marshal(albTargetGroupRequest)
	if err != nil {
		return nil, err
	}

	responseBase64, err := client.Invoke(
		fmt.Sprintf("localhost:%v", lambdaServerPort),
		albTargetGroupRequestJSON,
		timeout,
	)
	if err != nil {
		return nil, err
	}

	decoder := base64.NewDecoder(
		base64.StdEncoding,
		bytes.NewReader(bytes.Trim(responseBase64, "\"")),
	)

	responseJSON, err := io.ReadAll(decoder)
	if err != nil {
		responseJSON = responseBase64 // possibly not Base64 encoded; assume it's JSON
	}

	var response any

	err = json.Unmarshal(responseJSON, &response)
	if err != nil {
		return nil, err
	}

	return response, nil
}
