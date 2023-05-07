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

backend/deploy.sh
frontend/deploy.sh

echo -e "${CYAN_BOLD}\nDeploying infrastructure...\n${NC}"
cdk/deploy.sh
