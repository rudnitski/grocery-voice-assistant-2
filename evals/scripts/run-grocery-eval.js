"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTestCases = loadTestCases;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const grocery_service_1 = require("../../lib/services/grocery-service");
const eval_criteria_1 = require("../utils/eval-criteria");
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
    const options = {
        noUsualGroceries: false,
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--usual-groceries-path' || arg === '-u') {
            options.usualGroceriesPath = args[++i];
        }
        else if (arg === '--no-usual-groceries') {
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
function getUsualGroceries(options) {
    if (options.noUsualGroceries) {
        console.log('Running without usual groceries list (--no-usual-groceries flag set)');
        return '';
    }
    if (options.usualGroceriesPath) {
        try {
            const customList = fs.readFileSync(options.usualGroceriesPath, 'utf-8');
            console.log(`Using custom usual groceries list from: ${options.usualGroceriesPath}`);
            return customList;
        }
        catch (error) {
            console.error(`Error reading usual groceries file: ${options.usualGroceriesPath}`);
            console.error(`Falling back to default usual groceries list. Error: ${error.message}`);
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
function loadTestCases(filePath = TEST_DATA_PATH) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.trim().split('\n');
        const testCases = [];
        for (const line of lines) {
            if (line.trim() === '')
                continue;
            try {
                const rawFullTestCase = JSON.parse(line);
                const rawTestCaseItem = rawFullTestCase.item;
                if (!rawTestCaseItem || typeof rawTestCaseItem.utterance !== 'string' || typeof rawTestCaseItem.expect_json !== 'string') {
                    console.warn(`Skipping malformed test case line: ${line}`);
                    continue;
                }
                const expectedOutput = JSON.parse(rawTestCaseItem.expect_json);
                testCases.push({
                    utterance: rawTestCaseItem.utterance,
                    expectedOutput: expectedOutput,
                });
            }
            catch (e) {
                console.warn(`Failed to parse line into a valid test case: ${line}. Error: ${e.message}`);
            }
        }
        return testCases;
    }
    catch (error) {
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
        errors: [],
        evaluations: []
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
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('LLM request timed out after 30 seconds')), 30000);
            });
            // Pass the usualGroceries list to extractGroceryItems with timeout protection
            const llmResult = await Promise.race([
                (0, grocery_service_1.extractGroceryItems)(testCase.utterance, usualGroceries),
                timeoutPromise
            ]);
            console.log('LLM Result:', JSON.stringify(llmResult, null, 2));
            // Format LLM result to match GroceryItems interface
            // The extractGroceryItems now returns a direct array, so we need to wrap it in an object
            const actualOutput = { items: llmResult };
            // Evaluate the LLM output against the expected output with semantic matching always enabled
            const evaluation = await (0, eval_criteria_1.evaluateGroceryOutput)(actualOutput, testCase.expectedOutput, {
                enableSemanticComparison: true, // Always enable semantic comparison
                exactMatchesOnly: false, // Allow semantic matches
                usualGroceries: usualGroceries // Pass usual groceries for context
            });
            // Create structured output to collect in stats
            const passed = evaluation.score >= 0.5; // Threshold for passing
            // Record this evaluation in our stats for the summary table
            stats.evaluations.push({
                utterance: testCase.utterance,
                score: evaluation.score,
                passed: passed
            });
            // Output evaluation results with side-by-side comparison
            console.log((0, eval_criteria_1.formatEvaluationResults)(evaluation, actualOutput, testCase.expectedOutput));
            // Add colorful test result with visual indicators
            const scoreStr = (evaluation.score * 100).toFixed(1);
            if (passed) {
                console.log(`\n\x1b[42m\x1b[30m TEST RESULT: PASSED \x1b[0m \x1b[32m(Score: ${scoreStr}%)\x1b[0m ✅`);
            }
            else {
                console.log(`\n\x1b[41m\x1b[37m TEST RESULT: FAILED \x1b[0m \x1b[31m(Score: ${scoreStr}%)\x1b[0m ❌`);
            }
            if (passed) {
                stats.success++;
            }
            else {
                stats.failures++;
            }
        }
        catch (error) {
            stats.failures++;
            // Classify the error type for better handling and reporting
            let errorType = 'unknown';
            const errorMessage = error.message || 'Unknown error';
            if (errorMessage.includes('timed out')) {
                errorType = 'timeout';
            }
            else if (errorMessage.includes('API') || errorMessage.includes('key')) {
                errorType = 'api_error';
            }
            else if (errorMessage.includes('parse') || errorMessage.includes('JSON')) {
                errorType = 'parsing_error';
            }
            // Record detailed error information
            const evaluationError = {
                type: errorType,
                message: errorMessage,
                utterance: testCase.utterance,
                originalError: error
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
        let scoreFormatted;
        if (score >= 80) {
            scoreFormatted = `\x1b[32m${score.toFixed(1)}%\x1b[0m`;
        }
        else if (score >= 50) {
            scoreFormatted = `\x1b[33m${score.toFixed(1)}%\x1b[0m`;
        }
        else {
            scoreFormatted = `\x1b[31m${score.toFixed(1)}%\x1b[0m`;
        }
        // Generate notes based on results
        let notes = '';
        if (evalItem.score === 1) {
            notes = 'Perfect match';
        }
        else if (evalItem.score > 0.7) {
            notes = 'Minor issues';
        }
        else if (evalItem.score > 0.3) {
            notes = 'Partial match';
        }
        else {
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
        const errorTypeCounts = {};
        stats.errors.forEach((error) => {
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
    }
    else if (successRate >= 70) {
        console.log('Status: GOOD - The model is performing adequately but has room for improvement.');
    }
    else if (successRate >= 50) {
        console.log('Status: FAIR - The model is performing below expectations. Consider prompt improvements.');
    }
    else {
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
