#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";
import { InfraPipelineStack } from "../lib/infra-pipeline-stack";
import { AppBuildStack } from "../lib/app-build-stack";

// TODO: not sure how to inject these (because the execution is in CodePipeline / CodeBuild)
const AWS_ACCOUNT_ID = "849431480570";
const AWS_DEFAULT_REGION = "ap-southeast-2";

// GitHub PAT has permissions "admin:repo_hook, public_repo"; secret recommended to be manually created; e.g.:
// aws secretsmanager create-secret --name 'github-token' --secret-string 'ghp_abcdef...'
// aws codebuild import-source-credentials --token ghp_abcdef... --server-type GITHUB --auth-type PERSONAL_ACCESS_TOKEN --should-overwrite
const GITHUB_TOKEN_SECRET_NAME = "github-token";
const GITHUB_OWNER = "initialed85";
const GITHUB_REPO = "github-cdk-testing";
const GITHUB_BRANCH = "master";

const app = new cdk.App();

const INFRA_PIPELINE_STACK_ID = "InfraPipelineStack";
const APP_BUILD_STACK_ID = "AppBuildStack";

const stackProps = {
  env: {
    account: AWS_ACCOUNT_ID,
    region: AWS_DEFAULT_REGION,
  },
  githubTokenSecretName: GITHUB_TOKEN_SECRET_NAME,
  githubOwner: GITHUB_OWNER,
  githubRepo: GITHUB_REPO,
  githubBranch: GITHUB_BRANCH,
};

// the InfraPipelineStack is the root stack that keeps the infra in sync w/ the master branch of this repo
// we need to manually deploy it once and after that it'll keep itself in sync using GitHub webhooks
const infraPipelineStack = new InfraPipelineStack(
  app,
  INFRA_PIPELINE_STACK_ID,
  stackProps
);

// the AppBuildStack is the stack that builds the app and deploys it to S3
const appBuildStack = new AppBuildStack(app, APP_BUILD_STACK_ID, stackProps);

infraPipelineStack.pipeline.addStage(appBuildStack);
