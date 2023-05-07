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

if [[ "${CI}" != "true" ]]; then
  SKIP_SOURCE_ENV=1
  export SKIP_SOURCE_ENV
  source ../.env.sh
  print_environment
else
  source ../.env.sh
  print_environment
  GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go mod download
fi

GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -x -o bin/root_handler cmd/root_handler/main.go
