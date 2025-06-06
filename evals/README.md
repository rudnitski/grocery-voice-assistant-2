# Grocery Parsing Evaluation Framework

This directory contains the evaluation framework for testing and benchmarking the grocery parsing LLM used in the Grocery Voice Assistant application.

## Overview

The evaluation framework is designed to assess how well the LLM extracts grocery items and quantities from user utterances. It implements a comprehensive set of evaluation criteria and provides detailed reporting of the results.

## Key Features

- **Test Data Management**: Uses JSONL files for easy test case creation and extension
- **LLM Invocation**: Uses the same prompt and schema as the main application
- **Usual Groceries Support**: Tests the impact of the usual groceries feature on accuracy
- **Semantic Item Comparison**: Uses OpenAI GPT-4o to intelligently match items that are semantically similar but textually different
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
    - `semantic-comparison.ts`: Semantic grocery item comparison service using OpenAI GPT-4o

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

The evaluation framework implements the following criteria:

1. **Item Presence**: Checks if expected items are found in the output
2. **No Extra Items**: Verifies that no unexpected items are in the output
3. **Action Matching**: Ensures that the action (add, remove, modify) matches for each item
4. **Quantity Matching**: Verifies that quantities match for found items
5. **Measurement Accuracy**: Validates that measurements (value, unit, type) are correctly parsed and normalized
6. **Overall Accuracy**: Calculates an overall score based on correct items, wrong quantities/measurements, and extra/missing items

## Measurement Testing

The evaluation framework includes comprehensive testing for measurement parsing and normalization across multiple languages and formats:

### Measurement Test Cases

- **Metric Units**: Tests for gram (g), kilogram (kg), milliliter (mL), and liter (L) in various formats
- **Imperial Units**: Tests for ounce (oz), pound (lb), fluid ounce (fl oz), and cup measurements
- **Multilingual Support**: Tests units in English, Spanish, French, German, and Italian
- **Format Variations**: Tests decimal separators (dot/comma), fractions, and various unit formats
- **Edge Cases**: Tests unusual formats, text between numbers and units, and prefixes

### Measurement Evaluation

The evaluation checks several aspects of measurement handling:

1. **Unit Recognition**: Correctly identifying the measurement unit from various formats and languages
2. **Value Parsing**: Accurately extracting the numeric value, including fractions and decimals
3. **Type Classification**: Properly classifying measurements as weight, volume, or count
4. **Normalization**: Converting units to their canonical form (e.g., "grammes" → "g")

### Known Limitations

See the [measurement limitations documentation](./.windsurf/rules/measurement-limitations.md) for details on current limitations and edge cases.

## Semantic Item Comparison

The evaluation framework includes an advanced semantic comparison system that goes beyond exact string matching to identify when grocery items are semantically equivalent. This feature uses OpenAI's GPT-4o model to understand the context and meaning of grocery items.

### How Semantic Comparison Works

1. **Initial Matching**: The system first attempts exact string matching (case-insensitive) for maximum efficiency
2. **Semantic Analysis**: If no exact match is found, the system uses GPT-4o to compare items semantically
3. **Context Awareness**: The comparison includes the user's usual groceries list to provide context about preferred brands and specific items
4. **Confidence Scoring**: Each semantic match includes a confidence score (0.0-1.0) and reasoning

### Examples of Semantic Matches

- "chocolate milk" ↔ "milk chocolate" (word order variation)
- "green apples" ↔ "apples" (qualifier matching)
- "куриное филе" ↔ "филе куриное" (Russian word order)
- "творожок" ↔ "творожок «савушкин»" (brand context from usual groceries)

### Configuration

- **Confidence Threshold**: Default 0.75 (can be adjusted in semantic-comparison.ts)
- **Caching**: Results are cached to minimize API calls and improve performance
- **Timeout Settings**: Cache timeout can be configured for different testing scenarios

### Performance Considerations

- The system uses intelligent caching to minimize OpenAI API calls
- Exact matches bypass the API entirely for optimal performance
- Cache statistics are available for monitoring API usage during evaluations

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
- The semantic comparison service (`evals/utils/semantic-comparison.ts`)
- OpenAI API access for LLM invocation and semantic comparison

---

For questions or issues, please contact the development team.
