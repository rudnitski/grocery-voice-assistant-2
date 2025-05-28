#!/bin/bash

# Check if a config file is provided
if [ $# -lt 1 ]; then
  echo "Usage: $0 <path-to-config-json>"
  exit 1
fi

CONFIG_FILE=$1

# Check if the config file exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: Config file '$CONFIG_FILE' does not exist."
  exit 1
fi

# Check if OPENAI_EVALS_KEY is set
if [ -z "$OPENAI_EVALS_KEY" ]; then
  echo "Error: OPENAI_EVALS_KEY environment variable is not set."
  exit 1
fi

# Make the API call and extract just the ID from the response
RESPONSE=$(curl -s https://api.openai.com/v1/evals \
  -H "Authorization: Bearer $OPENAI_EVALS_KEY" \
  -H "Content-Type: application/json" \
  -d @"$CONFIG_FILE")

# Extract just the eval ID using jq (if available) or grep as fallback
if command -v jq &> /dev/null; then
  EVAL_ID=$(echo "$RESPONSE" | jq -r '.id')
else
  EVAL_ID=$(echo "$RESPONSE" | grep -o '"id": "[^"]*"' | cut -d'"' -f4)
fi

# Check if we got a valid ID
if [[ "$EVAL_ID" == eval_* ]]; then
  echo "$EVAL_ID"
else
  echo "Error creating evaluation. Full response:"
  echo "$RESPONSE"
  exit 1
fi
