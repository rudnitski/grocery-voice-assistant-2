#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
  echo -e "${YELLOW}Usage: $0 <eval_id> <json_config_file>${NC}"
  echo -e "  ${YELLOW}<eval_id>${NC}: The OpenAI evaluation ID (e.g., eval_1234567890)"
  echo -e "  ${YELLOW}<json_config_file>${NC}: Path to the JSON configuration file"
  exit 1
}

echo -e "${BLUE}=== OpenAI Evaluation Runner ===${NC}\n"

# Check if OPENAI_EVALS_KEY is set
if [ -z "$OPENAI_EVALS_KEY" ]; then
  echo -e "${RED}Error: OPENAI_EVALS_KEY environment variable is not set.${NC}"
  echo -e "Please set it with: ${YELLOW}export OPENAI_EVALS_KEY=your_key_here${NC}"
  exit 1
fi

# Check if both parameters are provided
if [ $# -lt 2 ]; then
  echo -e "${RED}Error: Both evaluation ID and JSON config file are required.${NC}"
  show_usage
fi

# Get parameters from command line
EVAL_ID=$1
JSON_FILE=$2

# Validate eval ID
if [ -z "$EVAL_ID" ]; then
  echo -e "${RED}Error: Evaluation ID cannot be empty.${NC}"
  show_usage
fi

# Check if file exists
if [ ! -f "$JSON_FILE" ]; then
  echo -e "${RED}Error: File '$JSON_FILE' does not exist.${NC}"
  exit 1
fi

echo -e "${BLUE}Running evaluation with:${NC}"
echo -e "  ${YELLOW}Eval ID:${NC} $EVAL_ID"
echo -e "  ${YELLOW}Config:${NC} $JSON_FILE\n"

# Run the curl command
echo -e "${BLUE}Sending request to OpenAI...${NC}"
RESPONSE=$(curl -s https://api.openai.com/v1/evals/$EVAL_ID/runs \
  -X POST \
  -H "Authorization: Bearer $OPENAI_EVALS_KEY" \
  -H "Content-Type: application/json" \
  -d @"$JSON_FILE")

# Extract run ID if available
if command -v jq &> /dev/null; then
  RUN_ID=$(echo "$RESPONSE" | jq -r '.id // "No ID found"')
  STATUS=$(echo "$RESPONSE" | jq -r '.status // "unknown"')
else
  RUN_ID=$(echo "$RESPONSE" | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
  STATUS=$(echo "$RESPONSE" | grep -o '"status": "[^"]*"' | head -1 | cut -d'"' -f4)
fi

# Check if we got a valid response
if [[ "$RUN_ID" == run_* ]]; then
  echo -e "\n${GREEN}Evaluation started successfully!${NC}"
  echo -e "${YELLOW}Run ID:${NC} $RUN_ID"
  echo -e "${YELLOW}Status:${NC} $STATUS"
else
  echo -e "\n${RED}Failed to submit evaluation request. Response:${NC}"
  echo "$RESPONSE"
  exit 1
fi
