#!/usr/bin/env bash

set -e

CYAN_BOLD="\033[1;96m"
RED_BOLD="\033[1;91m"
NC="\033[0m"

export CYAN_BOLD
export RED_BOLD
export NC

function print_environment() {
  echo -e "${CYAN_BOLD}\nEnvironment:\n${NC}"
  echo -e "_LAMBDA_SERVER_PORT=${_LAMBDA_SERVER_PORT}"
  echo -e "CI=${CI}"
  echo -e "AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}"
  echo -e "AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}"
  echo -e "AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}"
  echo -e "AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION}"
  echo -e "GIT_REF=${GIT_REF}"
  echo -e "GIT_TAG=${GIT_TAG}"
  echo -e "GIT_DESCRIBE=${GIT_DESCRIBE}"
  echo -e "GIT_COMMIT_HASH=${GIT_COMMIT_HASH}"
  echo -e "ENVIRONMENT=${ENVIRONMENT}"
  echo -e "REALLY_DEPLOY_TO_PROD=${REALLY_DEPLOY_TO_PROD}"
  echo -e ""
}

_LAMBDA_SERVER_PORT=${_LAMBDA_SERVER_PORT:-8080}
export _LAMBDA_SERVER_PORT

CI=${CI:-}
export CI

if [[ "${SKIP_AWS_AND_GIT_INTERACTIONS}" != "1" ]]; then
  AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity | jq -r .Account)}
  if [[ "${AWS_ACCOUNT_ID}" == "" ]]; then
    echo -e "error: AWS_ACCOUNT_ID empty or unset"
    exit 1
  fi

  AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-$(aws configure get default.aws_access_key_id)}
  if [[ "${AWS_ACCESS_KEY_ID}" == "" ]]; then
    echo -e "error: AWS_ACCESS_KEY_ID empty or unset"
    exit 1
  fi

  AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-$(aws configure get default.aws_secret_access_key)}
  if [[ "${AWS_SECRET_ACCESS_KEY}" == "" ]]; then
    echo -e "error: AWS_SECRET_ACCESS_KEY empty or unset"
    exit 1
  fi

  AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION:-$(aws configure get default.region)}
  if [[ "${AWS_DEFAULT_REGION}" == "" ]]; then
    echo -e "error: AWS_DEFAULT_REGION empty or unset"
    exit 1
  fi

  GIT_REF=${GIT_REF:-$(git rev-parse --symbolic-full-name HEAD)}

  GIT_TAG="${GIT_TAG}"
  if [[ "${GIT_TAG}" == "" ]] && git describe --tags --match 'v*.*.*' >/dev/null 2>&1; then
    GIT_TAG=$(git describe --tags --match 'v*.*.*')
  fi

  GIT_DESCRIBE=${GIT_DESCRIBE:-$(git describe --all --long --always --dirty --broken)}

  GIT_COMMIT_HASH=${GIT_COMMIT_HASH:-$(git rev-parse --verify HEAD)}
else
  ENVIRONMENT="${ENVIRONMENT:-dev}"
fi

export AWS_ACCOUNT_ID
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION
export GIT_REF
export GIT_TAG
export GIT_DESCRIBE
export GIT_COMMIT_HASH

ENVIRONMENT=${ENVIRONMENT}
if [[ "${ENVIRONMENT}" == "" ]]; then
  if [[ "${CI}" == "true" ]]; then
    if [[ "${GIT_TAG}" != "" ]]; then
      ENVIRONMENT="prod"
      REALLY_DEPLOY_TO_PROD="yes_really_deploy_to_prod"
    elif [[ "${GIT_REF}" == "refs/heads/master" ]]; then
      ENVIRONMENT="staging"
    fi
  else
    ENVIRONMENT="dev-${USER}"
  fi
fi

REALLY_DEPLOY_TO_PROD=${REALLY_DEPLOY_TO_PROD:-}
export REALLY_DEPLOY_TO_PROD

if [[ "${ENVIRONMENT}" == "" ]]; then
  print_environment
  echo -e "\nerror: ENVIRONMENT empty or unset"
  exit 1
fi
export ENVIRONMENT

SKIP_AWS_AND_GIT_INTERACTIONS=1
export SKIP_AWS_AND_GIT_INTERACTIONS
