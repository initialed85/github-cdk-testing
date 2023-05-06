package root_handler

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/initialed85/github-cdk-testing/backend/internal"
	"io"
)

// HandleRequest is a Lambda handler for internal.GetCallingContext
func HandleRequest(ctx context.Context, request events.ALBTargetGroupRequest) (events.ALBTargetGroupResponse, error) {
	var err error

	getErrorResponse := func(err error) (events.ALBTargetGroupResponse, error) {
		return events.ALBTargetGroupResponse{
			StatusCode:        500,
			StatusDescription: "500 Internal Server Error",
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body:            fmt.Sprintf("{\"error\": %#+v}", err.Error()),
			IsBase64Encoded: false,
		}, nil
	}

	body := []byte(request.Body)
	if request.IsBase64Encoded {
		decoder := base64.NewDecoder(base64.StdEncoding, bytes.NewBuffer(body))
		b, err := io.ReadAll(decoder)
		if err != nil {
			return getErrorResponse(err)
		}

		body = b
	}

	b, err := internal.GetJSON(internal.GetCallingContext(ctx, request))
	if err != nil {
		if err != nil {
			return getErrorResponse(err)
		}
	}

	return events.ALBTargetGroupResponse{
		StatusCode:        200,
		StatusDescription: "200 OK",
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body:            string(b),
		IsBase64Encoded: false,
	}, nil
}
