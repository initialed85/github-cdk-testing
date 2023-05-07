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
  ./build.sh
  npm install -g aws-cdk@2.78.0
fi

source ../.env.sh
print_environment

# TODO: download backend artifacts from S3
# TODO: download frontend artifacts from S3

cdk deploy --require-approval=never --outputs-file=outputs.json

echo -e "${CYAN_BOLD}Outputs:\n${NC}"
cat ./outputs.json
