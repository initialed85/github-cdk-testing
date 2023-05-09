#!/usr/bin/env node

import * as cdk from "aws-cdk-lib";
import { InfraPipelineStack } from "../lib/infra-pipeline-stack";

// TODO: not sure how to inject these (because the execution is in CodePipeline / CodeBuild)
const AWS_ACCOUNT_ID = "849431480570";
const AWS_DEFAULT_REGION = "ap-southeast-2";

// GitHub PAT has permissions "admin:repo_hook, public_repo"; secret recommended to be manually created; e.g.:
// aws secretsmanager create-secret --name 'github-token' --secret-string 'ghp_abcdef...'
const GITHUB_TOKEN_SECRET_NAME = "github-token";
const GITHUB_REPO = "initialed85/github-cdk-testing";
const GITHUB_BRANCH = "master";

const app = new cdk.App();

const INFRA_PIPELINE_STACK_ID = "InfraPipelineStack";

// the PipelineStack is the root stack that keeps the infra in sync w/ the master branch of this repo
// we need to manually deploy it once and after that it'll keep itself in sync using GitHub webhooks
const infraPipelineStack = new InfraPipelineStack(
  app,
  INFRA_PIPELINE_STACK_ID,
  {
    env: {
      account: AWS_ACCOUNT_ID,
      region: AWS_DEFAULT_REGION,
    },
    githubTokenSecretName: GITHUB_TOKEN_SECRET_NAME,
    githubRepo: GITHUB_REPO,
    githubBranch: GITHUB_BRANCH,
  }
);
