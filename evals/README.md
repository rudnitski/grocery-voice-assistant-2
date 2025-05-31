# Grocery Parsing Evaluation Framework

This directory contains the evaluation framework for testing and benchmarking the grocery parsing LLM used in the Grocery Voice Assistant application.

## Overview

The evaluation framework is designed to assess how well the LLM extracts grocery items and quantities from user utterances. It implements a comprehensive set of evaluation criteria and provides detailed reporting of the results.

## Key Features

- **Test Data Management**: Uses JSONL files for easy test case creation and extension
- **LLM Invocation**: Uses the same prompt and schema as the main application
- **Usual Groceries Support**: Tests the impact of the usual groceries feature on accuracy
- **Comprehensive Evaluation**: Implements multiple evaluation criteria with detailed metrics
- **Detailed Reporting**: Provides both per-test-case and aggregate results

## Directory Structure

- `evals/`
  - `data/`: Contains test data files
    - `grocery_test_data.jsonl`: Test cases with utterances and expected outputs
  - `scripts/`: Contains evaluation scripts
    - `run-grocery-eval.ts`: Main evaluation script
    - `grocery-eval-run.json`: Configuration for OpenAI Evals (deprecated)
  - `utils/`: Utility functions for evaluation
    - `eval-criteria.ts`: Evaluation criteria and metrics

## Usage

### Prerequisites

- Node.js (v16+)
- TypeScript
- OpenAI API key in your `.env.local` file (already set up in this project)

### Running the Evaluation

#### Option 1: Using the Shell Script (Recommended)

We've created a convenient shell script that automatically loads environment variables, compiles TypeScript if needed, and runs the evaluation:

```bash
# Run with default usual groceries list
./evals/scripts/run-grocery-eval.sh

# Run with a custom usual groceries list
./evals/scripts/run-grocery-eval.sh --usual-groceries-path ./path/to/groceries.txt

# Run without usual groceries
./evals/scripts/run-grocery-eval.sh --no-usual-groceries
```

#### Option 2: Using npm Scripts

You can also use the npm scripts defined in `package.json`:

```bash
# One-step command to compile and run
npm run eval

# Or step by step
npm run eval:compile  # Compile TypeScript
npm run eval:run      # Run the evaluation
```

For this option, make sure your environment variables are loaded:

```bash
source ./load-env.sh  # Load environment variables before running
```

#### Option 3: Manual Steps

If you need more control, you can run the individual commands:

1. **Load environment variables**:
   ```bash
   source ./load-env.sh
   ```

2. **Compile the TypeScript files**:
   ```bash
   npx tsc --esModuleInterop --target es2020 --module commonjs evals/scripts/run-grocery-eval.ts evals/utils/eval-criteria.ts
   ```

3. **Run the evaluation**:
   ```bash
   node evals/scripts/run-grocery-eval.js
   ```

### Command Line Options

- `--usual-groceries-path` or `-u`: Path to a custom usual groceries list file
  ```bash
  ./evals/scripts/run-grocery-eval.sh --usual-groceries-path ./path/to/groceries.txt
  ```

- `--no-usual-groceries`: Run without using a usual groceries list
  ```bash
  ./evals/scripts/run-grocery-eval.sh --no-usual-groceries
  ```

## Test Cases

The test cases are stored in `evals/data/grocery_test_data.jsonl`. Each line in this file represents a single test case with the following structure, now including an `action` field for each item:

```json
{
  "item": {
    "utterance": "Две пачки овсяного печенья, пять яблок. Удали овсяное печенье и сделай яблок три штуки.",
    "expect_json": "{\"items\": [{\"item\": \"овсяное печенье\", \"quantity\": 0, \"action\": \"remove\"}, {\"item\": \"яблоко\", \"quantity\": 3, \"action\": \"modify\"}]}"
  }
}
```

The `action` field can be `"add"`, `"remove"`, or `"modify"`.

The test cases cover a variety of scenarios, including:
- Basic grocery extraction (additions)
- Item removal
- Item quantity modification
- Complex utterances involving multiple actions
- Misspelled or mispronounced items
- Ambiguous items requiring usual groceries for resolution
- Alternative forms or plurals
- Unusual phrasings

## Evaluation Criteria

The evaluation uses the following criteria:

1. **JSON Validity**: Checks if the LLM output is valid JSON
2. **Schema Conformance**: Verifies that the output has the expected structure. This includes ensuring each item has an `item` (string) and `quantity` (number), and if an `action` field is present, it must be one of `'add'`, `'remove'`, or `'modify'`.
3. **Item Matching**: Checks if all expected items are present (case-insensitive)
4. **Quantity Matching**: Verifies that quantities match for found items
5. **Overall Accuracy**: Calculates an overall score based on correct items, wrong quantities, and extra/missing items

## Interpreting Results

The evaluation script produces a detailed report with:

- **Per-Test Results**: For each test case, shows:
  - Evaluation metrics
  - Correct, incorrect, extra, and missing items
  - Test pass/fail status

- **Evaluation Summary**: Shows:
  - Total test cases run
  - Success and failure counts
  - Average score
  - API/processing errors

- **Overall Assessment**: Provides a qualitative assessment of the model's performance:
  - Excellent (90%+ success rate)
  - Good (70-89% success rate)
  - Fair (50-69% success rate)
  - Poor (<50% success rate)

## Extending the Framework

### Adding New Test Cases

To add new test cases, simply append new JSON objects to `evals/data/grocery_test_data.jsonl` using the same structure as existing test cases.

### Modifying Evaluation Criteria

The evaluation criteria are defined in `evals/utils/eval-criteria.ts`. You can modify the scoring algorithm or add new criteria by editing this file.

## Dependencies

This evaluation framework depends on:
- The core grocery service (`lib/services/grocery-service.ts`)
- The grocery prompt (`lib/prompts/grocery-prompts.ts`)
- OpenAI API access for LLM invocation

---

For questions or issues, please contact the development team.
