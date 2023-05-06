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

echo -e "${CYAN_BOLD}\n\nBuilding backend artifacts...\n${NC}"
cd "${DIR}/backend"
mkdir -p ./bin
rm -fr ./bin/*
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -x -o bin/root_handler cmd/root_handler/main.go

echo -e "${CYAN_BOLD}\n\nBuilding frontend artifacts...${NC}"
cd "${DIR}/frontend"
mkdir -p ./build
rm -fr ./build/*
npm run build
