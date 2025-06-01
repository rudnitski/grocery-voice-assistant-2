/**
 * Grocery Parsing Evaluation Script
 * 
 * This script evaluates the performance of the grocery parsing LLM on various test cases.
 * It uses the same prompt and schema as the main application, ensuring consistency.
 * 
 * Features:
 * - Loads test cases from JSONL file
 * - Passes usual groceries list to the LLM (configurable)
 * - Evaluates LLM output against expected output
 * - Provides detailed evaluation reports
 * 
 * Usage:
 * ```
 * # Run with default settings
 * npx tsc --esModuleInterop --target es2020 --module commonjs evals/scripts/run-grocery-eval.ts evals/utils/eval-criteria.ts
 * node evals/scripts/run-grocery-eval.js
 * 
 * # Run with custom usual groceries file
 * node evals/scripts/run-grocery-eval.js --usual-groceries-path ./path/to/groceries.txt
 * 
 * # Run without usual groceries
 * node evals/scripts/run-grocery-eval.js --no-usual-groceries
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractGroceryItems } from '../../lib/services/grocery-service';
import { 
  evaluateGroceryOutput, 
  formatEvaluationResults, 
  isValidJson,
  conformsToSchema,
  GroceryItems
} from '../utils/eval-criteria';

/**
 * Error classification system for better error handling and reporting
 */

// Define error types to better classify and handle errors
type ErrorType = 'api_error' | 'timeout' | 'parsing_error' | 'unknown';

/**
 * Structured representation of evaluation errors
 * Allows for better categorization and reporting of errors
 */
interface EvaluationError {
  type: ErrorType;      // Classified error type
  message: string;      // Human-readable error message
  utterance: string;    // The test case utterance that caused the error
  originalError?: Error; // Original error object for debugging
}

/**
 * Type definitions
 * We use the interfaces from eval-criteria.ts for consistency
 * between our test data and evaluation logic
 */

/**
 * Test case data structures
 */

/**
 * Represents a single raw test case item as read from a line in the .jsonl file
 * Contains the utterance and expected JSON output (as a string)
 */
interface RawTestCaseItem {
  utterance: string;     // The grocery request text to process
  expect_json: string;   // The expected output as a stringified JSON
}

/**
 * Represents the full structure of a single line in the .jsonl file
 * Wraps the RawTestCaseItem in an 'item' property
 */
interface RawFullTestCase {
    item: RawTestCaseItem;
}

/**
 * Represents a processed test case ready for evaluation
 * The expect_json has been parsed into a GroceryItems object
 */
export interface ProcessedTestCase {
  utterance: string;             // The grocery request text to process
  expectedOutput: GroceryItems;  // The parsed expected output
}

/**
 * Configuration constants
 */

// Path to the test data file containing grocery test cases
const TEST_DATA_PATH = path.join(__dirname, '..', 'data', 'grocery_test_data.jsonl');

// Default usual groceries list for testing purposes (empty for now)
const DEFAULT_USUAL_GROCERIES = ``;

/**
 * Parses command-line arguments to get configuration options
 * Supports the following options:
 * --usual-groceries-path, -u: Path to a file containing the usual groceries list
 * --no-usual-groceries: Run without using a usual groceries list
 * --enable-semantic-comparison: Enable semantic comparison for evaluation
 * 
 * @returns Configuration options for the evaluation
 */
function parseArgs() {
  const args = process.argv.slice(2);
  interface CommandLineOptions {
    usualGroceriesPath?: string;
    noUsualGroceries: boolean;
  }
  const options: CommandLineOptions = {
    noUsualGroceries: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--usual-groceries-path' || arg === '-u') {
      options.usualGroceriesPath = args[++i];
    } else if (arg === '--no-usual-groceries') {
      options.noUsualGroceries = true;
    }
  }

  return options;
}

/**
 * Gets the usual groceries list based on configuration options
 * Logic:
 * 1. If noUsualGroceries is true, return empty string
 * 2. If usualGroceriesPath is provided, try to read from that file
 * 3. If reading fails or no path is provided, use the default list
 * 
 * @param options Configuration options from command line arguments
 * @returns The usual groceries list as a string
 */
function getUsualGroceries(options: ReturnType<typeof parseArgs>): string {
  if (options.noUsualGroceries) {
    console.log('Running without usual groceries list (--no-usual-groceries flag set)');
    return '';
  }

  if (options.usualGroceriesPath) {
    try {
      const customList = fs.readFileSync(options.usualGroceriesPath, 'utf-8');
      console.log(`Using custom usual groceries list from: ${options.usualGroceriesPath}`);
      return customList;
    } catch (error) {
      console.error(`Error reading usual groceries file: ${options.usualGroceriesPath}`);
      console.error(`Falling back to default usual groceries list. Error: ${(error as Error).message}`);
    }
  }

  console.log('Using default usual groceries list');
  return DEFAULT_USUAL_GROCERIES;
}

/**
 * Loads and parses test cases from the grocery_test_data.jsonl file
 * 
 * File format:
 * Each line in the file is expected to be a JSON object containing an 'item' field,
 * which in turn has 'utterance' and 'expect_json' (a stringified JSON).
 * 
 * Example line:
 * { "item": { "utterance": "Две пачки овсяного печенья", "expect_json": "{\"items\": [{\"item\": \"овсяное печенье\", \"quantity\": 2}]}" } }
 * 
 * @param filePath The path to the .jsonl test data file (defaults to TEST_DATA_PATH)
 * @returns An array of ProcessedTestCase objects with parsed expected outputs
 */
export function loadTestCases(filePath: string = TEST_DATA_PATH): ProcessedTestCase[] {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.trim().split('\n');
    const testCases: ProcessedTestCase[] = [];

    for (const line of lines) {
      if (line.trim() === '') continue;

      try {
        const rawFullTestCase: RawFullTestCase = JSON.parse(line);
        const rawTestCaseItem = rawFullTestCase.item;

        if (!rawTestCaseItem || typeof rawTestCaseItem.utterance !== 'string' || typeof rawTestCaseItem.expect_json !== 'string') {
          console.warn(`Skipping malformed test case line: ${line}`);
          continue;
        }

        const expectedOutput: GroceryItems = JSON.parse(rawTestCaseItem.expect_json);
        
        testCases.push({
          utterance: rawTestCaseItem.utterance,
          expectedOutput: expectedOutput,
        });
      } catch (e) {
        console.warn(`Failed to parse line into a valid test case: ${line}. Error: ${(e as Error).message}`);
      }
    }
    return testCases;
  } catch (error) {
    console.error(`Failed to read or process test data file at ${filePath}:`, error);
    return []; // Return empty array or throw, depending on desired error handling
  }
}

// Main execution block
async function main() {
  console.log('Loading test cases...');
  const testCases = loadTestCases();

  if (testCases.length === 0) {
    console.log('No test cases loaded or an error occurred.');
    return;
  }
  console.log(`Successfully loaded ${testCases.length} test cases.\n`);

  // Parse command-line arguments
  const options = parseArgs();
  // Get the usual groceries list based on configuration
  const usualGroceries = getUsualGroceries(options);
  
  // Display configuration information
  console.log('\n\x1b[1m\x1b[44m\x1b[37m === Configuration === \x1b[0m');
  console.log(`Semantic Comparison: \x1b[32mEnabled\x1b[0m`); // Always enabled
  console.log(`Usual Groceries: ${options.noUsualGroceries ? '\x1b[33mDisabled\x1b[0m' : '\x1b[32mEnabled\x1b[0m'}`);
  if (options.usualGroceriesPath) {
    console.log(`Using custom usual groceries from: ${options.usualGroceriesPath}`);
  }
  console.log(''); // Empty line for better readability

  // Statistics to track success/failure rates
  const stats = {
    total: testCases.length,
    success: 0,
    failures: 0,
    errors: [] as EvaluationError[],
    evaluations: [] as {
      utterance: string;
      score: number;
      passed: boolean;
    }[]
  };

  console.log('Processing test cases with LLM...');
  for (let index = 0; index < testCases.length; index++) {
    const testCase = testCases[index];
    // Add a prominent visual separator for each test case with color
    console.log('\n' + '\x1b[36m' + '='.repeat(80) + '\x1b[0m');
    console.log(`\x1b[1m\x1b[36mTEST CASE #${index + 1}:\x1b[0m "${testCase.utterance}"`);
    console.log('\x1b[36m' + '='.repeat(80) + '\x1b[0m');
    try {
      // Use Promise.race to implement timeout handling
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('LLM request timed out after 30 seconds')), 30000);
      });

      // Pass the usualGroceries list to extractGroceryItems with timeout protection
      const llmResult = await Promise.race([
        extractGroceryItems(testCase.utterance, usualGroceries),
        timeoutPromise
      ]);

      console.log('LLM Result:', JSON.stringify(llmResult, null, 2));
      
      // Format LLM result to match GroceryItems interface
      const actualOutput: GroceryItems = { items: llmResult };
      
      // Evaluate the LLM output against the expected output with semantic matching always enabled
      const evaluation = await evaluateGroceryOutput(
        actualOutput,
        testCase.expectedOutput as GroceryItems,
        {
          enableSemanticComparison: true,  // Always enable semantic comparison
          exactMatchesOnly: false,        // Allow semantic matches
          usualGroceries: usualGroceries  // Pass usual groceries for context
        }
      );
      
      // Create structured output to collect in stats
      const passed = evaluation.score >= 0.5; // Threshold for passing
      
      // Record this evaluation in our stats for the summary table
      stats.evaluations.push({
        utterance: testCase.utterance,
        score: evaluation.score,
        passed: passed
      });
      
      // Output evaluation results with side-by-side comparison
      console.log(formatEvaluationResults(evaluation, actualOutput, testCase.expectedOutput));
      
      // Add colorful test result with visual indicators
      const scoreStr = (evaluation.score * 100).toFixed(1);
      if (passed) {
        console.log(`\n\x1b[42m\x1b[30m TEST RESULT: PASSED \x1b[0m \x1b[32m(Score: ${scoreStr}%)\x1b[0m ✅`);
      } else {
        console.log(`\n\x1b[41m\x1b[37m TEST RESULT: FAILED \x1b[0m \x1b[31m(Score: ${scoreStr}%)\x1b[0m ❌`);
      }
      
      if (passed) {
        stats.success++;
      } else {
        stats.failures++;
      }
    } catch (error) {
      stats.failures++;
      
      // Classify the error type for better handling and reporting
      let errorType: ErrorType = 'unknown';
      const errorMessage = (error as Error).message || 'Unknown error';
      
      if (errorMessage.includes('timed out')) {
        errorType = 'timeout';
      } else if (errorMessage.includes('API') || errorMessage.includes('key')) {
        errorType = 'api_error';
      } else if (errorMessage.includes('parse') || errorMessage.includes('JSON')) {
        errorType = 'parsing_error';
      }
      
      // Record detailed error information
      const evaluationError: EvaluationError = {
        type: errorType,
        message: errorMessage,
        utterance: testCase.utterance,
        originalError: error as Error
      };
      
      stats.errors.push(evaluationError);
      
      // Log error with appropriate context
      console.error(`Error processing utterance "${testCase.utterance}" [${errorType}]:`, errorMessage);
      
      // For non-API errors that might be transient, we could implement retry logic here
      // For this implementation, we'll just continue to the next test case
    }
  }
  
  // Calculate average score for completed evaluations
  let avgScore = 0;
  const completedEvals = stats.evaluations.length;
  if (completedEvals > 0) {
    // Calculate the average of all evaluation scores
    const totalScore = stats.evaluations.reduce((sum, evalItem) => sum + evalItem.score, 0);
    avgScore = totalScore / completedEvals;
    console.log(`Calculated avgScore: ${avgScore} from ${completedEvals} evaluations`);
  }

  // Calculate success rate
  const successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;

  // Print results in a nice table format
  console.log('\n=== Test Results Summary Table ===');
  
  // Draw table header
  console.log('╔════╦══════════════════════════════════════╦═══════════╦═══════════╦═════════════════════════════╗');
  console.log('║ #  ║ Test Case                           ║ Status    ║ Score     ║ Notes                       ║');
  console.log('╠════╬══════════════════════════════════════╬═══════════╬═══════════╬═════════════════════════════╣');
  
  // Draw table rows for each evaluation
  for (let i = 0; i < stats.evaluations.length; i++) {
    const evalItem = stats.evaluations[i];
    
    // Format the utterance to fit in the column (truncate if needed)
    const utterance = evalItem.utterance.substring(0, 28) + (evalItem.utterance.length > 28 ? '...' : '');
    
    // Get the status with formatting
    const status = evalItem.passed ? '\x1b[32mPASSED\x1b[0m' : '\x1b[31mFAILED\x1b[0m';
    
    // Get score with formatting (green for high scores, yellow for medium, red for low)
    const score = evalItem.score * 100;
    let scoreFormatted: string;
    if (score >= 80) {
      scoreFormatted = `\x1b[32m${score.toFixed(1)}%\x1b[0m`;
    } else if (score >= 50) {
      scoreFormatted = `\x1b[33m${score.toFixed(1)}%\x1b[0m`;
    } else {
      scoreFormatted = `\x1b[31m${score.toFixed(1)}%\x1b[0m`;
    }
    
    // Generate notes based on results
    let notes = '';
    if (evalItem.score === 1) {
      notes = 'Perfect match';
    } else if (evalItem.score > 0.7) {
      notes = 'Minor issues';
    } else if (evalItem.score > 0.3) {
      notes = 'Partial match';
    } else {
      notes = 'Significant mismatch';
    }
    
    // Print the row with proper padding for ANSI color codes
    // Note: ANSI codes don't count as visible width in console
    const paddedStatus = status.padEnd(status.includes('PASSED') ? 15 : 14); // Account for ANSI codes
    const paddedScore = scoreFormatted.padEnd(19); // Account for ANSI codes
    
    console.log(`║ ${(i + 1).toString().padEnd(2)} ║ ${utterance.padEnd(36)} ║ ${paddedStatus} ║ ${paddedScore} ║ ${notes.padEnd(27)} ║`);
  }
  
  // Draw table footer
  console.log('╚════╩══════════════════════════════════════╩═══════════╩═══════════╩═════════════════════════════╝');
  
  // Print summary statistics
  console.log('\n=== Summary Statistics ===');
  console.log('╔═══════════════════╦═══════════════╗');
  console.log('║ Metric            ║ Value         ║');
  console.log('╠═══════════════════╬═══════════════╣');
  console.log(`║ Total Test Cases  ║ ${stats.total.toString().padEnd(13)} ║`);
  console.log(`║ Passed            ║ ${stats.success.toString().padEnd(13)} ║`);
  console.log(`║ Failed            ║ ${stats.failures.toString().padEnd(13)} ║`);
  console.log(`║ Errors            ║ ${stats.errors.length.toString().padEnd(13)} ║`);
  
  // Format percentages with proper padding
  const successRateStr = `${successRate.toFixed(1)}%`;
  const avgScoreStr = `${(avgScore * 100).toFixed(1)}%`;
  
  console.log(`║ Success Rate      ║ ${successRateStr.padEnd(13)} ║`);
  console.log(`║ Average Score     ║ ${avgScoreStr.padEnd(13)} ║`);
  console.log('╚═══════════════════╩═══════════════╝');
  
  // Print error summary if there are errors
  if (stats.errors.length > 0) {
    // Group errors by type
    const errorTypeCounts: Record<string, EvaluationError[]> = {};
    stats.errors.forEach((error: EvaluationError) => {
      if (!errorTypeCounts[error.type]) {
        errorTypeCounts[error.type] = [];
      }
      errorTypeCounts[error.type].push(error);
    });
    
    console.log('\n=== Error Summary ===');
    Object.entries(errorTypeCounts).forEach(([type, errors]) => {
      console.log(`${type}: ${errors.length} occurrences`);
      if (errors.length > 0) {
        console.log(`  Example: ${errors[0].message}`);
      }
    });
  }
  
  // Provide an overall assessment
  console.log('\n=== Overall Assessment ===');
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 90) {
    console.log('Status: EXCELLENT - The model is performing very well on grocery parsing tasks.');
  } else if (successRate >= 70) {
    console.log('Status: GOOD - The model is performing adequately but has room for improvement.');
  } else if (successRate >= 50) {
    console.log('Status: FAIR - The model is performing below expectations. Consider prompt improvements.');
  } else {
    console.log('Status: POOR - The model is not performing well. Significant improvements are needed.');
  }
  console.log('\nFinished processing all test cases.');
}

if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error in main execution:', error);
    process.exit(1);
  });
}
