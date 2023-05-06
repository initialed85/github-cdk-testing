package main

import (
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/initialed85/github-cdk-testing/backend/pkg/handlers/root_handler"
)

// main is the entrypoint for the root_handler.HandleRequest lambda handler
func main() {
	lambda.Start(root_handler.HandleRequest)
}
