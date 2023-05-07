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

SKIP_AWS_AND_GIT_INTERACTIONS=1
export SKIP_AWS_AND_GIT_INTERACTIONS

source ./.env.sh

echo -e "${CYAN_BOLD}\n\nBuilding backend artifacts...\n${NC}"
backend/build.sh

echo -e "${CYAN_BOLD}\n\nBuilding frontend artifacts...${NC}"
frontend/build.sh

echo -e "${CYAN_BOLD}\nBuilding infrastructure artifacts...${NC}"
cdk/build.sh
