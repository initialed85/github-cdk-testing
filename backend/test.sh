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
source ../.env.sh

if [[ "${CI}" == "true" ]]; then
  go mod download
fi

go test -v ./...
