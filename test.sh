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

ENVIRONMENT="${ENVIRONMENT:-dev}"

source ./.env.sh

#
# test
#

echo -e "${CYAN_BOLD}\n\nRunning backend tests...\n${NC}"
cd "${DIR}/backend"
go test -v ./...

echo -e "${CYAN_BOLD}\n\nRunning frontend tests...${NC}"
cd "${DIR}/frontend"
npm run test

echo -e "${CYAN_BOLD}\n\nRunning infrastructure tests...${NC}"
cd "${DIR}/cdk"
npm run test
