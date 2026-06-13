#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
node --test *.test.js
node static-check.mjs
