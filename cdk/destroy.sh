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

cdk destroy --force "${@}"
