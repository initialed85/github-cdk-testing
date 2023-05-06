package internal

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/aws/aws-lambda-go/lambdacontext"
	"os"
	"runtime"
)

type CallingContext struct {
	Hostname      string                       `json:"hostname"`
	CPUs          int                          `json:"cpus"`
	Environ       []string                     `json:"environ"`
	Pid           int                          `json:"pid"`
	Executable    string                       `json:"executable"`
	Args          []string                     `json:"args"`
	LambdaContext *lambdacontext.LambdaContext `json:"lambda_context"`
	Request       any                          `json:"request"`
}

// GetCallingContext returns a CallingContext for the provided request with context about this process
func GetCallingContext(ctx context.Context, request any) CallingContext {
	hostname, _ := os.Hostname()
	executable, _ := os.Executable()
	lambdaContext, _ := lambdacontext.FromContext(ctx)

	return CallingContext{
		Hostname: hostname,
		CPUs:     runtime.NumCPU(),

		Environ:       os.Environ(),
		Pid:           os.Getpid(),
		Executable:    executable,
		Args:          os.Args,
		LambdaContext: lambdaContext,
		Request:       request,
	}
}

// GetJSON returns a JSON representation of the provided object
func GetJSON(object any) ([]byte, error) {
	return json.Marshal(object)
}

// GetFormattedJSON is the same as GetJSON but with formatting
func GetFormattedJSON(object any) ([]byte, error) {
	return json.MarshalIndent(object, "", "    ")
}

// UnsafeGetJSONString returns a JSON representation of the provided object or a JSON error message on failure to do so
func UnsafeGetJSONString(object any) string {
	bytes, err := GetJSON(object)
	if err != nil {
		bytes, _ = GetJSON(
			struct {
				Error string `json:"__error"`
			}{
				Error: fmt.Errorf("failed to marshal %#+v because %v", object, err).Error(),
			},
		)
	}

	return string(bytes)
}

// UnsafeGetFormattedJSONString is the same as UnsafeGetJSONString but with formatting
func UnsafeGetFormattedJSONString(object any) string {
	bytes, err := GetFormattedJSON(object)
	if err != nil {
		bytes, _ = GetFormattedJSON(
			struct {
				Error string `json:"__error"`
			}{
				Error: fmt.Errorf("failed to marshal %#+v because %v", object, err).Error(),
			},
		)
	}

	return string(bytes)
}
