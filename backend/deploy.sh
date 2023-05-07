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

source ../.env.sh

if [[ "${CI}" == "true" ]]; then
  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
  unzip awscliv2.zip
  sudo ./aws/install || true
  sudo apt-get install -y jq
fi

if ! test -e ../cdk/outputs.json; then
  echo "error: failed to find outputs.json; may need initial deploy / local deploy for sync"
  ls -al ../cdk
  exit 1
fi

echo -e "${CYAN_BOLD}\nDeploying backend artifacts\n${NC}"
if ! bucket_name=$(jq -r ".Dependencies.artifactBucketbucketName" ../cdk/outputs.json); then
  echo "error: failed to get artifact bucket name from outputs.json; may need initial deploy / local deploy for sync"
  cat ../cdk/outputs.json
  exit 1
fi

bucket_path="s3://${bucket_name}/${GIT_DESCRIBE}/backend/bin.zip"

cd ./bin
zip -r bin.zip .
aws s3 cp ./bin.zip "${bucket_path}"
