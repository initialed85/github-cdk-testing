#!/usr/bin/env bash

set -e -x

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pushd "${DIR}" >/dev/null 2>&1 || exit 1

function cleanup() {
  popd >/dev/null 2>&1
}
trap cleanup EXIT

ENVIRONMENT=${ENVIRONMENT:-${USER}LocalGitHubActions}
export ENVIRONMENT

source ./.env.sh
export AWS_ACCOUNT_ID
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_DEFAULT_REGION

echo -e "${CYAN_BOLD}\nRunning GitHub Actions locally...\n${NC}"

mkdir -p /tmp/artifacts
rm -fr /tmp/artifacts/*

set +e
act \
  --container-architecture linux/amd64 \
  --artifact-server-path /tmp/artifacts/ \
  --env ENVIRONMENT="${ENVIRONMENT}" \
  --env AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}" \
  --env AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
  --secret AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
  --env AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION}" \
  "${@}"
retval=${?}

./destroy.sh "${ENVIRONMENT}GitHubCdkTesting" --force

if [[ ${retval} -ne 0 ]]; then
  echo -e "${RED_BOLD}\nerror: GitHub Actions local run failed\n${NC}"
  exit ${retval}
fi

exit ${retval}
