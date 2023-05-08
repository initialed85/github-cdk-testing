#!/usr/bin/env node

import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline";

// TODO: not sure how to inject these (because they run in CodePipeline)
const AWS_ACCOUNT_ID = "849431480570";
const AWS_DEFAULT_REGION = "ap-southeast-2";

// GitHub PAT has permissions "admin:repo_hook, public_repo"; secret recommended to be manually created; e.g.:
// aws secretsmanager create-secret --name 'github-token' --secret-string 'ghp_abcdef...'
const GITHUB_TOKEN_SECRET_NAME = "github-token";
const GITHUB_REPO = "initialed85/github-cdk-testing";
const GITHUB_BRANCH = "master";

const PIPELINE_ID = "Pipeline";

const app = new cdk.App();

// we "cdk deploy" this once and then it automatically deploys on commit
// this repo; ref.: https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html
const pipelineStack = new PipelineStack(app, PIPELINE_ID, {
  env: {
    account: AWS_ACCOUNT_ID,
    region: AWS_DEFAULT_REGION,
  },
  githubTokenSecretName: GITHUB_TOKEN_SECRET_NAME,
  githubRepo: GITHUB_REPO,
  githubBranch: GITHUB_BRANCH,
});
