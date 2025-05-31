"use strict";
/**
 * Grocery Parsing Evaluation Criteria
 *
 * This module defines the evaluation criteria and metrics used to assess the performance
 * of the grocery parsing LLM. It provides a framework for comparing LLM outputs against
 * expected outputs and calculating accuracy scores.
 *
 * Key features:
 * - JSON validity checking
 * - Schema conformance verification
 * - Item matching with case-insensitive comparison
 * - Quantity accuracy verification
 * - Comprehensive scoring and reporting
 *
 * @module eval-criteria
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidJson = isValidJson;
exports.conformsToSchema = conformsToSchema;
exports.evaluateGroceryOutput = evaluateGroceryOutput;
exports.formatEvaluationResults = formatEvaluationResults;
/**
 * Check if a string is valid JSON
 *
 * This function attempts to parse a string as JSON and returns whether
 * the operation was successful. Implements evaluation criterion FR3.1.
 *
 * @param jsonString The string to check for JSON validity
 * @returns Boolean indicating whether the string is valid JSON
 */
function isValidJson(jsonString) {
    if (typeof jsonString !== 'string')
        return false;
    try {
        JSON.parse(jsonString);
        return true;
    }
    catch (error) {
        return false;
    }
}
/**
 * Check if an object conforms to the grocery items schema
 *
 * Verifies that an object has the expected structure for grocery items:
 * - Has an 'items' property that is an array
 * - Each item in the array has 'item' (string) and 'quantity' (number) properties
 * - If present, 'action' must be one of: 'add', 'remove', or 'modify'
 *
 * Implements evaluation criterion FR3.2.
 *
 * @param obj The object to check against the schema
 * @returns Boolean indicating whether the object conforms to the schema
 */
function conformsToSchema(obj) {
    // Must be an object with an 'items' property that is an array
    if (typeof obj !== 'object' || obj === null || !Array.isArray(obj.items)) {
        return false;
    }
    // Each item must have the required properties with the correct types
    for (const item of obj.items) {
        if (typeof item !== 'object' || item === null) {
            return false;
        }
        if (typeof item.item !== 'string' || item.item.trim() === '') {
            return false;
        }
        if (typeof item.quantity !== 'number' || isNaN(item.quantity)) {
            return false;
        }
        // If action is present, it must be one of the allowed values
        if (item.action !== undefined &&
            !['add', 'remove', 'modify'].includes(item.action)) {
            return false;
        }
    }
    return true;
}
/**
 * Compare LLM output with expected output and calculate accuracy metrics
 *
 * This function performs the core evaluation by comparing the actual LLM output
 * against the expected output. It checks for:
 * - Item matching (FR3.4): Are all expected items present? (case-insensitive)
 * - Quantity matching (FR3.4): Do the quantities match for matched items?
 * - Extra items: Does the LLM output contain items not in the expected output?
 * - Missing items: Are any expected items missing from the LLM output?
 *
 * It also calculates an overall score based on these metrics.
 *
 * @param actual The actual output from the LLM (should conform to GroceryItems schema)
 * @param expected The expected output from the test case
 * @returns Detailed evaluation results including scores and item lists
 */
function evaluateGroceryOutput(actual, expected) {
    // Default results structure
    const results = {
        isValidJson: true, // Assume this check was done before calling this function
        conformsToSchema: conformsToSchema(actual),
        hasCorrectItems: false,
        hasCorrectQuantities: false,
        hasExtraItems: false,
        hasMissingItems: false,
        score: 0,
        details: {
            correctItems: [],
            incorrectItems: [],
            extraItems: [],
            missingItems: [],
            totalExpectedItems: expected.items.length,
            totalActualItems: actual && actual.items ? actual.items.length : 0,
            matchScore: 0
        }
    };
    // If it doesn't conform to the schema, return early with minimal evaluation
    if (!results.conformsToSchema) {
        return results;
    }
    // Create maps for easier lookup
    const expectedMap = new Map();
    expected.items.forEach(item => {
        expectedMap.set(item.item.toLowerCase(), item.quantity);
    });
    const actualMap = new Map();
    actual.items.forEach((item) => {
        actualMap.set(item.item.toLowerCase(), item.quantity);
    });
    // Check for correct, extra, and missing items
    for (const [item, expectedQuantity] of expectedMap.entries()) {
        if (actualMap.has(item)) {
            const actualQuantity = actualMap.get(item);
            if (actualQuantity === expectedQuantity) {
                results.details.correctItems.push(item);
            }
            else {
                results.details.incorrectItems.push({
                    item,
                    expected: expectedQuantity,
                    actual: actualQuantity
                });
            }
        }
        else {
            results.details.missingItems.push(item);
        }
    }
    // Check for extra items in the actual output
    for (const item of actualMap.keys()) {
        if (!expectedMap.has(item)) {
            results.details.extraItems.push(item);
        }
    }
    // Set boolean flags based on the comparisons
    results.hasCorrectItems = results.details.correctItems.length > 0;
    results.hasCorrectQuantities = results.details.incorrectItems.length === 0;
    results.hasExtraItems = results.details.extraItems.length > 0;
    results.hasMissingItems = results.details.missingItems.length > 0;
    // Calculate match score (percentage of correct items)
    const totalCorrect = results.details.correctItems.length;
    const totalExpected = expected.items.length;
    results.details.matchScore = totalExpected > 0
        ? totalCorrect / totalExpected
        : 0;
    // Overall score calculation
    // If all items match perfectly and there are no extra or incorrect items, score is 100%
    // Otherwise, calculate based on weights and penalties
    if (results.details.matchScore === 1 &&
        results.details.extraItems.length === 0 &&
        results.details.incorrectItems.length === 0) {
        // Perfect match - all expected items are present and correct, no extra items
        results.score = 1.0; // 100%
    }
    else {
        // Not a perfect match - calculate weighted score
        // 70% weight for correct items, 30% penalty for extra/incorrect items
        const correctItemsScore = results.details.matchScore * 0.7;
        // Penalize for extra and incorrect items, but not below 0
        const extraItemsPenalty = Math.min(0.15, (results.details.extraItems.length / Math.max(1, totalExpected)) * 0.15);
        const incorrectItemsPenalty = Math.min(0.15, (results.details.incorrectItems.length / Math.max(1, totalExpected)) * 0.15);
        results.score = Math.max(0, Math.min(1, correctItemsScore - extraItemsPenalty - incorrectItemsPenalty));
    }
    return results;
}
/**
 * Formats evaluation results into a readable string
 *
 * Converts the structured evaluation results into a human-readable
 * text report with sections for overall score, basic checks, item statistics,
 * and detailed item lists.
 *
 * @param results The evaluation results to format
 * @param actual The actual output from the LLM
 * @param expected The expected output from the test case
 * @returns A formatted string representation of the results
 */
function formatEvaluationResults(results, actual, expected) {
    let output = '\x1b[1m\x1b[44m\x1b[37m === Evaluation Results === \x1b[0m\n';
    // Overall score with color based on score value
    const scoreValue = results.score * 100;
    const scoreColor = scoreValue >= 90 ? '\x1b[32m' : // Green for excellent
        scoreValue >= 70 ? '\x1b[33m' : // Yellow for good
            '\x1b[31m'; // Red for poor
    output += `Overall Score: ${scoreColor}${scoreValue.toFixed(1)}%\x1b[0m\n`;
    // Basic checks with color
    output += `Valid JSON: ${results.isValidJson ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}\n`;
    output += `Conforms to Schema: ${results.conformsToSchema ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}\n`;
    // Side-by-side comparison of expected vs actual results
    if (expected && actual) {
        output += '\n\x1b[1m\x1b[44m\x1b[37m === Side-by-Side Comparison === \x1b[0m\n';
        output += '\x1b[1mExpected (Left) vs Actual (Right):\x1b[0m\n';
        // Format the items as aligned columns
        const expectedItems = expected.items || [];
        const actualItems = actual.items || [];
        // Determine the max items to show
        const maxItems = Math.max(expectedItems.length, actualItems.length);
        for (let i = 0; i < maxItems; i++) {
            const expectedItem = i < expectedItems.length ?
                `"${expectedItems[i].item}" (${expectedItems[i].quantity})` :
                '---';
            const actualItem = i < actualItems.length ?
                `"${actualItems[i].item}" (${actualItems[i].quantity})` :
                '---';
            // Highlight differences with colors
            let comparison = '';
            let itemColor = '';
            if (i < expectedItems.length && i < actualItems.length) {
                if (expectedItems[i].item.toLowerCase() === actualItems[i].item.toLowerCase() &&
                    expectedItems[i].quantity === actualItems[i].quantity) {
                    comparison = ' \x1b[32m✓ MATCH\x1b[0m';
                    itemColor = '\x1b[32m'; // Green for match
                }
                else if (expectedItems[i].item.toLowerCase() === actualItems[i].item.toLowerCase()) {
                    comparison = ' \x1b[33m⚠️ QUANTITY MISMATCH\x1b[0m';
                    itemColor = '\x1b[33m'; // Yellow for quantity mismatch
                }
                else {
                    comparison = ' \x1b[31m❌ ITEM MISMATCH\x1b[0m';
                    itemColor = '\x1b[31m'; // Red for item mismatch
                }
            }
            // Number each line and add colors to items
            output += `\x1b[36m${i + 1}.\x1b[0m ${itemColor}${expectedItem}\x1b[0m`.padEnd(36) +
                `| ${itemColor}${actualItem}\x1b[0m`.padEnd(36) +
                `${comparison}\n`;
        }
        output += '\n';
    }
    // Item statistics with color-coded headers and values
    output += `\n\x1b[1m\x1b[44m\x1b[37m Item Statistics \x1b[0m\n`;
    // Calculate match score percentage for color coding
    const matchPercentage = results.details.matchScore * 100;
    const matchColor = matchPercentage === 100 ? '\x1b[32m' : // Green for perfect
        matchPercentage >= 70 ? '\x1b[33m' : // Yellow for good
            '\x1b[31m'; // Red for poor
    // Color wrong quantities, extra and missing items in red if there are any
    const wrongQtyColor = results.details.incorrectItems.length > 0 ? '\x1b[31m' : '\x1b[37m';
    const extraItemsColor = results.details.extraItems.length > 0 ? '\x1b[31m' : '\x1b[37m';
    const missingItemsColor = results.details.missingItems.length > 0 ? '\x1b[31m' : '\x1b[37m';
    output += `- \x1b[36mExpected Items:\x1b[0m ${results.details.totalExpectedItems}\n`;
    output += `- \x1b[36mActual Items:\x1b[0m ${results.details.totalActualItems}\n`;
    output += `- \x1b[36mCorrect Items:\x1b[0m ${matchColor}${results.details.correctItems.length} (${matchPercentage.toFixed(1)}%)\x1b[0m\n`;
    output += `- \x1b[36mItems with Wrong Quantity:\x1b[0m ${wrongQtyColor}${results.details.incorrectItems.length}\x1b[0m\n`;
    output += `- \x1b[36mExtra Items:\x1b[0m ${extraItemsColor}${results.details.extraItems.length}\x1b[0m\n`;
    output += `- \x1b[36mMissing Items:\x1b[0m ${missingItemsColor}${results.details.missingItems.length}\x1b[0m\n`;
    // Detailed item lists with color
    if (results.details.correctItems.length > 0) {
        output += `\n\x1b[32m✓ Correct Items:\x1b[0m \x1b[32m${results.details.correctItems.join(', ')}\x1b[0m\n`;
    }
    if (results.details.incorrectItems.length > 0) {
        output += `\n\x1b[33m⚠️ Items with Wrong Quantity:\x1b[0m\n`;
        results.details.incorrectItems.forEach(item => {
            output += `- \x1b[33m${item.item}:\x1b[0m Expected \x1b[36m${item.expected}\x1b[0m, Got \x1b[31m${item.actual}\x1b[0m\n`;
        });
    }
    if (results.details.extraItems.length > 0) {
        output += `\n\x1b[31m❌ Extra Items:\x1b[0m \x1b[31m${results.details.extraItems.join(', ')}\x1b[0m\n`;
    }
    if (results.details.missingItems.length > 0) {
        output += `\n\x1b[31m❌ Missing Items:\x1b[0m \x1b[31m${results.details.missingItems.join(', ')}\x1b[0m\n`;
    }
    return output;
}
