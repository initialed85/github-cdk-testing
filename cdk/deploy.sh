#!/usr/bin/env bash

set -e

# change to the directory of this script
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pushd "${DIR}" >/dev/null 2>&1 || exit 1

# return calling directory on exit
function cleanup() {
  popd >/dev/null 2>&1
}
trap cleanup EXIT

if [[ "${CI}" == "true" ]]; then
  if ! command -v aws >/dev/null 2>&1; then
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install || true
  fi

  if ! command -v jq >/dev/null 2>&1; then
    sudo apt-get install -y jq
  fi

  ./build.sh
  npm install -g aws-cdk@2.78.0
fi

source ../.env.sh

cdk deploy --require-approval=never --outputs-file=outputs.json "${@}"

if [[ "${*}" == "--all" ]]; then
  echo -e "${CYAN_BOLD}\nDeploying backend artifacts\n${NC}"
  if ! bucket_name=$(jq -r ".Dependencies.artifactBucketbucketName" ./outputs.json); then
    echo "error: failed to get artifact bucket name from outputs.json; may have broken expected interface?"
    exit 1
  fi

  bucket_path="s3://${bucket_name}/${GIT_DESCRIBE}/cdk/outputs.json"

  aws s3 cp ./outputs.json "${bucket_path}"
fi

echo -e "${CYAN_BOLD}Outputs:\n${NC}"
jq . ./outputs.json
