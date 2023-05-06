#!/usr/bin/env node

import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { GitHubCdkTestingStack } from "../lib/git-hub-cdk-testing-stack";

const getEnvironment = (key: string): string => {
  const value: string | undefined = process?.env[key]
    ?.trim()
    .toLowerCase()
    .replace("_", "-");

  if (value === undefined || value.trim() === "") {
    throw new Error(`${key} env var is empty or unset`);
  }

  return value;
};

const AWS_ACCOUNT_ID: string = getEnvironment("AWS_ACCOUNT_ID");
const AWS_DEFAULT_REGION: string = getEnvironment("AWS_DEFAULT_REGION");
const ENVIRONMENT: string = getEnvironment("ENVIRONMENT");

const PROD: string = "prod";
const PROD_GUARD: string = "yes_really_deploy_to_prod";
if (ENVIRONMENT === PROD && process.env.REALLY_DEPLOY_TO_PROD !== PROD_GUARD) {
  throw new Error(
    `ENVIRONMENT is prod and REALLY_DEPLOY_TO_PROD is not set to "${PROD_GUARD}"`
  );
}

const BASE_IDENTIFIER: string = "GitHubCdkTesting";
const IDENTIFIER: string = `${ENVIRONMENT}${BASE_IDENTIFIER}`;

const app = new cdk.App();

const gitHubCdkTestingStack = new GitHubCdkTestingStack(app, IDENTIFIER, {
  env: {
    account: AWS_ACCOUNT_ID,
    region: AWS_DEFAULT_REGION,
  },
});
