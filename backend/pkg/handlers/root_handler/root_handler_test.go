package root_handler

import (
	"encoding/json"
	"github.com/initialed85/github-cdk-testing/backend/internal"
	"github.com/initialed85/github-cdk-testing/backend/pkg/test"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"testing"
	"time"
)

func TestHandleRequest(t *testing.T) {
	getPayload := func() any {
		return map[string]any{
			"hello": "world",
		}
	}

	//
	// given
	//

	cancel := test.RunLambdaHandlerWithTimeout(HandleRequest, time.Second*5)
	defer cancel()

	//
	// when
	//

	response, err := test.InvokeLambda(getPayload(), time.Second*4)
	require.Nilf(t, err, "test.InvokeLambda failed because %v", err)

	//
	// then
	//

	bodyJSON, ok := response.(map[string]any)["body"]
	require.Truef(
		t,
		ok,
		"failed to extract body from response=%v", internal.UnsafeGetJSONString(response),
	)

	var body any
	err = json.Unmarshal([]byte(bodyJSON.(string)), &body)
	require.Nilf(t, err, "failed to unmarshal bodyJSON=%v because %v", bodyJSON, err)

	request, ok := body.(map[string]any)["request"]
	require.Truef(t, ok, "failed to extract request from body=%#+v", body)

	assert.Equal(
		t,
		map[string]interface{}{
			"body":            "eyJoZWxsbyI6IndvcmxkIn0=",
			"httpMethod":      "",
			"isBase64Encoded": true,
			"path":            "",
			"requestContext": map[string]interface{}{
				"elb": map[string]interface{}{
					"targetGroupArn": "",
				},
			},
		},
		request,
	)
}
