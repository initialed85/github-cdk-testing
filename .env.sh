#!/usr/bin/env bash

set -e

if [[ "${SKIP_SOURCE_ENV}" == "1" ]]; then
  return 0
fi

CYAN_BOLD="\033[1;96m"
RED_BOLD="\033[1;91m"
NC="\033[0m"

export CYAN_BOLD
export RED_BOLD
export NC

#
# setup
#

_LAMBDA_SERVER_PORT=${_LAMBDA_SERVER_PORT:-8080}
export _LAMBDA_SERVER_PORT

CI=${CI:-true}
export CI

AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity | jq -r .Account)}
if [[ "${AWS_ACCOUNT_ID}" == "" ]]; then
  echo -e "error: AWS_ACCOUNT_ID empty or unset"
  exit 1
fi
export AWS_ACCOUNT_ID

AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-$(aws configure get default.aws_access_key_id)}
if [[ "${AWS_ACCESS_KEY_ID}" == "" ]]; then
  echo -e "error: AWS_ACCESS_KEY_ID empty or unset"
  exit 1
fi
export AWS_ACCESS_KEY_ID

AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-$(aws configure get default.aws_secret_access_key)}
if [[ "${AWS_SECRET_ACCESS_KEY}" == "" ]]; then
  echo -e "error: AWS_SECRET_ACCESS_KEY empty or unset"
  exit 1
fi
export AWS_SECRET_ACCESS_KEY

AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-$(aws configure get default.region)}
if [[ "${AWS_DEFAULT_REGION}" == "" ]]; then
  echo -e "error: AWS_DEFAULT_REGION empty or unset"
  exit 1
fi
export AWS_DEFAULT_REGION

ENVIRONMENT=${ENVIRONMENT}
if [[ "${ENVIRONMENT}" == "" ]]; then
  echo -e "error: ENVIRONMENT empty or unset"
  exit 1
fi
export ENVIRONMENT

REALLY_DEPLOY_TO_PROD=${REALLY_DEPLOY_TO_PROD:-}
export REALLY_DEPLOY_TO_PROD

GIT_DESCRIBE=$(git describe --all --long --always --dirty --broken)
export GIT_DESCRIBE

GIT_COMMIT_HASH=$(git rev-parse --verify HEAD)
export GIT_COMMIT_HASH

function print_environment() {
  echo -e "${CYAN_BOLD}Environment:\n${NC}"
  echo -e "CI=${CI}"
  echo -e "_LAMBDA_SERVER_PORT=${_LAMBDA_SERVER_PORT}"
  echo -e "AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}"
  echo -e "AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}"
  echo -e "AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}"
  echo -e "AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION}"
  echo -e "ENVIRONMENT=${ENVIRONMENT}"
  echo -e "REALLY_DEPLOY_TO_PROD=${REALLY_DEPLOY_TO_PROD}"
  echo -e "GIT_DESCRIBE=${GIT_DESCRIBE}"
  echo -e "GIT_COMMIT_HASH=${GIT_COMMIT_HASH}"
}

SKIP_SOURCE_ENV=1
export SKIP_SOURCE_ENV
