#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo 'Usage: yarn deploy s3://bucket/prefix' >&2
  exit 2
fi

case "$1" in
  s3://?*) ;;
  *)
    echo 'Set an S3 destination such as s3://bucket/prefix' >&2
    exit 2
    ;;
esac

command -v aws >/dev/null
export YAML_CONFIG="${YAML_CONFIG:-configurations/default/env.yml}"
yarn build
aws s3 sync dist/ "$1"
