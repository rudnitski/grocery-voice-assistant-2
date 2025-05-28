#!/bin/bash

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Grocery Parsing Evaluation Runner ===${NC}\n"

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Load environment variables from .env.local
if [ -f "$PROJECT_ROOT/.env.local" ]; then
  echo -e "${GREEN}Loading environment variables from .env.local...${NC}"
  # Use the load-env.sh script
  source "$PROJECT_ROOT/load-env.sh"
else
  echo -e "${RED}Error: .env.local file not found in project root.${NC}"
  exit 1
fi

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
  echo -e "${RED}Error: OPENAI_API_KEY environment variable is not set.${NC}"
  echo -e "Please check your .env.local file."
  exit 1
fi

echo -e "${GREEN}OpenAI API key loaded successfully.${NC}"

# Process command line arguments
USUAL_GROCERIES_ARG=""
if [ "$1" == "--no-usual-groceries" ]; then
  USUAL_GROCERIES_ARG="--no-usual-groceries"
  echo -e "${YELLOW}Running without usual groceries list.${NC}"
elif [ "$1" == "--usual-groceries-path" ] || [ "$1" == "-u" ]; then
  if [ -z "$2" ]; then
    echo -e "${RED}Error: Path to usual groceries file not provided.${NC}"
    echo -e "Usage: $0 --usual-groceries-path <path_to_file>"
    exit 1
  fi
  USUAL_GROCERIES_ARG="--usual-groceries-path $2"
  echo -e "${YELLOW}Using custom usual groceries from: $2${NC}"
else
  echo -e "${YELLOW}Using default usual groceries list.${NC}"
fi

# Check if the JS files exist, compile if needed
if [ ! -f "$PROJECT_ROOT/evals/scripts/run-grocery-eval.js" ] || [ ! -f "$PROJECT_ROOT/evals/utils/eval-criteria.js" ]; then
  echo -e "${YELLOW}Compiled JavaScript files not found. Compiling TypeScript...${NC}"
  echo -e "Running: tsc --esModuleInterop --target es2020 --module commonjs $PROJECT_ROOT/evals/scripts/run-grocery-eval.ts $PROJECT_ROOT/evals/utils/eval-criteria.ts"
  
  npx tsc --esModuleInterop --target es2020 --module commonjs "$PROJECT_ROOT/evals/scripts/run-grocery-eval.ts" "$PROJECT_ROOT/evals/utils/eval-criteria.ts"
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}TypeScript compilation failed.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}TypeScript compilation successful.${NC}"
fi

# Run the evaluation
echo -e "\n${BLUE}Running grocery parsing evaluation...${NC}"
echo -e "Command: node $PROJECT_ROOT/evals/scripts/run-grocery-eval.js $USUAL_GROCERIES_ARG"

node "$PROJECT_ROOT/evals/scripts/run-grocery-eval.js" $USUAL_GROCERIES_ARG

# Check if the evaluation was successful
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}Evaluation completed successfully.${NC}"
else
  echo -e "\n${RED}Evaluation failed with error code $?.${NC}"
  exit 1
fi
