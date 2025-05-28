#!/usr/bin/env bash
#
# Load all KEY=VALUE pairs from .env.local into the current shell session.
# Works in bash and zsh.

set -o allexport   # automatically export all sourced variables
if [ -f ".env.local" ]; then
  # shellcheck disable=SC1090
  source .env.local
else
  echo "⚠️  .env.local not found in $(pwd)"
fi
set +o allexport