#!/usr/bin/env node

import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline";
import { getEnvironment } from "../lib/helpers";

const AWS_ACCOUNT_ID: string = getEnvironment("AWS_ACCOUNT_ID");
const AWS_DEFAULT_REGION: string = getEnvironment("AWS_DEFAULT_REGION");

const PIPELINE_ID = "Pipeline";

// GitHub PAT has permissions "admin:repo_hook, public_repo"; secret recommended to be manually created; e.g.:
// aws secretsmanager create-secret --name 'github-token' --secret-string 'ghp_abcdef...'
const GITHUB_TOKEN_SECRET_NAME = "github-token";

const app = new cdk.App();

// the PipelineStack is aware of our GitHub PAT and sets up some magic to then seamlessly stay in sync with commits to
// this repo; ref.: https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html
const pipelineStack = new PipelineStack(app, PIPELINE_ID, {
  env: {
    account: AWS_ACCOUNT_ID,
    region: AWS_DEFAULT_REGION,
  },
  githubTokenSecretName: GITHUB_TOKEN_SECRET_NAME,
});
