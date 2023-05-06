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

echo -e "${RED_BOLD}\nDestroying infrastructure...\n${NC}"
cd "${DIR}/cdk"
cdk destroy
