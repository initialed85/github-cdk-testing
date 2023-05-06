#!/usr/bin/env bash

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pushd "${DIR}" >/dev/null 2>&1 || exit 1

function cleanup() {
  popd >/dev/null 2>&1
}
trap cleanup EXIT

source ./.env.sh

print_environment

./test.sh

./build.sh

echo -e "${CYAN_BOLD}\nDeploying infrastructure...\n${NC}"
cd "${DIR}/cdk"
cdk deploy --require-approval=never --outputs-file=outputs.json

echo -e "${CYAN_BOLD}Outputs:\n${NC}"
jq <./outputs.json
