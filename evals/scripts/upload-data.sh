#!/bin/bash

# Check if a data file is provided
if [ $# -lt 1 ]; then
  echo "Usage: $0 <path-to-data-file>"
  exit 1
fi

DATA_FILE=$1

# Check if the data file exists
if [ ! -f "$DATA_FILE" ]; then
  echo "Error: Data file '$DATA_FILE' does not exist."
  exit 1
fi

# Check if OPENAI_EVALS_KEY is set
if [ -z "$OPENAI_EVALS_KEY" ]; then
  echo "Error: OPENAI_EVALS_KEY environment variable is not set."
  exit 1
fi

# Make the API call and extract just the ID from the response
RESPONSE=$(curl -s https://api.openai.com/v1/files \
  -H "Authorization: Bearer $OPENAI_EVALS_KEY" \
  -F purpose="evals" \
  -F file="@$DATA_FILE")

# Extract just the file ID using jq (if available) or grep as fallback
if command -v jq &> /dev/null; then
  FILE_ID=$(echo "$RESPONSE" | jq -r '.id')
else
  FILE_ID=$(echo "$RESPONSE" | grep -o '"id": "[^"]*"' | cut -d'"' -f4)
fi

# Check if we got a valid ID
if [[ "$FILE_ID" == file-* ]]; then
  echo "$FILE_ID"
else
  echo "Error uploading data file. Full response:"
  echo "$RESPONSE"
  exit 1
fi
