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
 * - Semantic matching with OpenAI's GPT-4o for natural language understanding
 * - Quantity accuracy verification
 * - Comprehensive scoring and reporting
 * 
 * @module eval-criteria
 */

import { 
  compareItemsSemantically, 
  SemanticComparisonResult,
  meetsConfidenceThreshold,
  sanitizeItemName 
} from './semantic-comparison';
import { Measurement } from '../../lib/types/grocery-types';

/**
 * Type definitions for grocery items
 * 
 * These interfaces define the expected structure of grocery data
 * both for LLM outputs and expected test case outputs.
 */

/**
 * Represents a single grocery item with its quantity and optional action
 * 
 * @property item - The name of the grocery item (string)
 * @property quantity - The amount of the item (number)
 * @property action - The action to perform: 'add', 'remove', or 'modify' (optional, defaults to 'add')
 */
export interface GroceryItem {
  item: string;
  quantity: number;
  action?: 'add' | 'remove' | 'modify';
  measurement?: Measurement;
}

/**
 * Represents a collection of grocery items
 * 
 * @property items - Array of GroceryItem objects
 */
export interface GroceryItems {
  items: GroceryItem[];
}

/**
 * Results of various evaluation checks
 * 
 * This comprehensive structure contains the results of all evaluation criteria
 * and detailed information about matched and mismatched items.
 */
export interface EvaluationResults {
  isValidJson: boolean;
  conformsToSchema: boolean;
  hasCorrectItems: boolean;
  hasCorrectQuantities: boolean;
  hasExtraItems: boolean;
  hasMissingItems: boolean;
  score: number;
  details: {
    correctItems: string[];
    incorrectItems: { item: string, expected: number, actual: number }[];
    extraItems: string[];
    missingItems: string[];
    totalExpectedItems: number;
    totalActualItems: number;
    matchScore: number;
  };
}

/**
 * Check if a string is valid JSON
 * 
 * This function attempts to parse a string as JSON and returns whether
 * the operation was successful. Implements evaluation criterion FR3.1.
 * 
 * @param jsonString The string to check for JSON validity
 * @returns Boolean indicating whether the string is valid JSON
 */
export function isValidJson(jsonString: string): boolean {
  if (typeof jsonString !== 'string') return false;
  
  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
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
export function conformsToSchema(obj: any): boolean {
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
 * Extended evaluation results interface that includes semantic match information
 */
export interface ExtendedEvaluationResults extends EvaluationResults {
  semanticMatches: {
    items: string[];
    count: number;
    confidenceScores: Record<string, number>;
    reasonings: Record<string, string>;
  };
  semanticEnabled: boolean;
  exactMatchesOnly: boolean;
}

/**
 * Evaluation results for action-based operations
 * 
 * This structure contains the results specific to evaluating
 * action-based operations (add, remove, modify).
 */
export interface ActionEvaluationResults {
  // Overall action accuracy
  totalActionAccuracy: number;
  
  // Per-action type accuracy
  addAccuracy: number;
  removeAccuracy: number;
  modifyAccuracy: number;
  
  // Detailed action counts
  actionCounts: {
    expected: {
      add: number;
      remove: number;
      modify: number;
    };
    actual: {
      add: number;
      remove: number;
      modify: number;
    };
    correct: {
      add: number;
      remove: number;
      modify: number;
    };
  };
  
  // Specific errors by action type
  actionErrors: {
    wrongAction: Array<{
      item: string;
      expectedAction: string;
      actualAction: string;
    }>;
    missingAction: Array<{
      item: string;
      expectedAction: string;
    }>;
  };
}

/**
 * Extended evaluation results that includes action evaluation
 */
export interface ExtendedEvaluationResultsWithActions extends ExtendedEvaluationResults {
  actionResults?: ActionEvaluationResults;
}

/**
 * Evaluate action-based operations
 * 
 * This function evaluates how well the LLM handles different action types:
 * - add: Adding new items to the list
 * - remove: Removing items from the list
 * - modify: Changing quantities of existing items
 * 
 * @param actual The actual output from the LLM
 * @param expected The expected output from the test case
 * @param semanticComparisonResults Detailed results from semantic comparison
 * @returns Detailed action evaluation results
 */
export function evaluateActions(
  actual: GroceryItems,
  expected: GroceryItems,
  semanticComparisonResults: {
    items: string[];
    confidenceScores: Record<string, number>;
    reasonings: Record<string, string>;
  } = { items: [], confidenceScores: {}, reasonings: {} }
): ActionEvaluationResults {
  const results: ActionEvaluationResults = {
    totalActionAccuracy: 0,
    addAccuracy: 0,
    removeAccuracy: 0,
    modifyAccuracy: 0,
    actionCounts: {
      expected: { add: 0, remove: 0, modify: 0 },
      actual: { add: 0, remove: 0, modify: 0 },
      correct: { add: 0, remove: 0, modify: 0 }
    },
    actionErrors: {
      wrongAction: [],
      missingAction: []
    }
  };
  
  // Count expected actions
  expected.items.forEach(item => {
    const action = item.action || 'add';
    results.actionCounts.expected[action]++;
  });
  
  // Count actual actions
  actual.items.forEach(item => {
    const action = item.action || 'add';
    results.actionCounts.actual[action]++;
  });
  
  // Create maps for easier lookup (case-insensitive)
  const expectedMap = new Map<string, GroceryItem>();
  expected.items.forEach(item => {
    expectedMap.set(item.item.toLowerCase(), item);
  });
  
  const actualMap = new Map<string, GroceryItem>();
  actual.items.forEach(item => {
    actualMap.set(item.item.toLowerCase(), item);
  });
  
  // Create a bidirectional mapping between expected and actual items based on semantic matches
  const semanticMatchMap = new Map<string, string>();
  const reverseSemanticMatchMap = new Map<string, string>();
  
  // First, add exact matches to the semantic match map
  for (const expectedItem of expected.items) {
    const expectedItemLower = expectedItem.item.toLowerCase();
    for (const actualItem of actual.items) {
      const actualItemLower = actualItem.item.toLowerCase();
      
      if (actualItemLower === expectedItemLower) {
        semanticMatchMap.set(expectedItemLower, actualItemLower);
        reverseSemanticMatchMap.set(actualItemLower, expectedItemLower);
        break;
      }
    }
  }
  
  // Then add semantic matches for items that don't have exact matches
  for (const expectedItem of expected.items) {
    const expectedItemLower = expectedItem.item.toLowerCase();
    
    // Skip if we already have an exact match
    if (semanticMatchMap.has(expectedItemLower)) continue;
    
    // Check if this expected item has semantic matches
    if (semanticComparisonResults.items.includes(expectedItemLower)) {
      // Find the best semantic match among actual items
      let bestMatch: { actualItem: string; confidence: number } | null = null;
      
      for (const actualItem of actual.items) {
        const actualItemLower = actualItem.item.toLowerCase();
        
        // Skip if this actual item is already matched to another expected item
        if (reverseSemanticMatchMap.has(actualItemLower)) continue;
        
        const result = compareItemsForSemanticEquivalence(
          actualItem.item,
          expectedItem.item,
          semanticComparisonResults
        );
        
        if (result.isMatch && result.confidence && 
            (!bestMatch || result.confidence > bestMatch.confidence)) {
          bestMatch = {
            actualItem: actualItemLower,
            confidence: result.confidence
          };
        }
      }
      
      // If we found a match, add it to our maps
      if (bestMatch) {
        semanticMatchMap.set(expectedItemLower, bestMatch.actualItem);
        reverseSemanticMatchMap.set(bestMatch.actualItem, expectedItemLower);
      }
    }
  }
  
  // Evaluate each expected item
  expected.items.forEach(expectedItem => {
    const expectedKey = expectedItem.item.toLowerCase();
    const expectedAction = expectedItem.action || 'add';
    
    // Check if we have this item in actual (either exact match or semantic match)
    let actualItem: GroceryItem | undefined;
    
    if (actualMap.has(expectedKey)) {
      // Direct match by name
      actualItem = actualMap.get(expectedKey);
    } else if (semanticMatchMap.has(expectedKey)) {
      // Semantic match
      const matchedActualKey = semanticMatchMap.get(expectedKey)!;
      actualItem = actualMap.get(matchedActualKey);
    }
    
    if (actualItem) {
      const actualAction = actualItem.action || 'add';
      
      // Check if action matches
      if (expectedAction === actualAction) {
        // For modify and add actions, check if quantity also matches
        if (expectedAction === 'remove' || expectedItem.quantity === actualItem.quantity) {
          results.actionCounts.correct[expectedAction as 'add' | 'remove' | 'modify']++;
        }
      } else {
        results.actionErrors.wrongAction.push({
          item: expectedItem.item,
          expectedAction,
          actualAction
        });
      }
    } else {
      // Item is missing entirely
      results.actionErrors.missingAction.push({
        item: expectedItem.item,
        expectedAction
      });
    }
  });
  
  // Calculate accuracies
  const calculateAccuracy = (correct: number, expected: number): number => {
    return expected > 0 ? (correct / expected) * 100 : 100;
  };
  
  results.addAccuracy = calculateAccuracy(
    results.actionCounts.correct.add,
    results.actionCounts.expected.add
  );
  
  results.removeAccuracy = calculateAccuracy(
    results.actionCounts.correct.remove,
    results.actionCounts.expected.remove
  );
  
  results.modifyAccuracy = calculateAccuracy(
    results.actionCounts.correct.modify,
    results.actionCounts.expected.modify
  );
  
  // Calculate total accuracy
  const totalCorrect = results.actionCounts.correct.add + 
                      results.actionCounts.correct.remove + 
                      results.actionCounts.correct.modify;
  const totalExpected = results.actionCounts.expected.add + 
                       results.actionCounts.expected.remove + 
                       results.actionCounts.expected.modify;
  
  results.totalActionAccuracy = calculateAccuracy(totalCorrect, totalExpected);
  
  return results;
}

/**
 * Helper function to compare items for semantic equivalence
 * 
 * @param actualItem The actual item from the LLM output
 * @param expectedItem The expected item from the test case
 * @param semanticComparisonResults The semantic comparison results
 * @returns An object indicating if the items match semantically
 */
function compareItemsForSemanticEquivalence(
  actualItem: string,
  expectedItem: string,
  semanticComparisonResults: {
    items: string[];
    confidenceScores: Record<string, number>;
    reasonings: Record<string, string>;
  }
): { isMatch: boolean; confidence?: number } {
  // Normalize both items for comparison
  const normalizedActual = sanitizeItemName(actualItem).toLowerCase();
  const normalizedExpected = sanitizeItemName(expectedItem).toLowerCase();
  
  // Check for exact match first
  if (normalizedActual === normalizedExpected) {
    return { isMatch: true, confidence: 1.0 };
  }
  
  // Check if the expected item has semantic matches
  if (semanticComparisonResults.items.includes(normalizedExpected)) {
    // Get the confidence score for this match
    const confidence = semanticComparisonResults.confidenceScores[normalizedExpected] || 0;
    
    // Use the semantic comparison results to determine if these items match
    // This is a simplified check - in a real implementation, we would need to
    // check if the actual item is specifically matched with this expected item
    if (confidence >= 0.7) { // Using a threshold of 0.7 for high confidence
      return { isMatch: true, confidence };
    }
  }
  
  return { isMatch: false };
}

/**
 * Compare LLM output with expected output and calculate accuracy metrics
 * 
 * This function performs the core evaluation by comparing the actual LLM output
 * against the expected output. It checks for:
 * - Item matching (FR3.4): Are all expected items present? (case-insensitive)
 * - Semantic matching: Are items semantically equivalent even if named differently?
 * - Quantity matching (FR3.4): Do the quantities match for matched items?
 * - Extra items: Does the LLM output contain items not in the expected output?
 * - Missing items: Are any expected items missing from the LLM output?
 * 
 * It also calculates an overall score based on these metrics.
 * 
 * @param actual The actual output from the LLM (should conform to GroceryItems schema)
 * @param expected The expected output from the test case
 * @param options Additional options for evaluation
 * @param options.enableSemanticComparison Whether to use semantic comparison (default: true)
 * @param options.exactMatchesOnly If true, only use exact string matching (default: false)
 * @param options.usualGroceries The user's usual groceries for additional context in semantic matching
 * @returns Detailed evaluation results including scores and item lists
 */
export async function evaluateGroceryOutput(
  actual: GroceryItems | any,
  expected: GroceryItems,
  options: {
    enableSemanticComparison?: boolean;
    exactMatchesOnly?: boolean;
    usualGroceries?: string;
    testCase?: number;
  } = {}
): Promise<ExtendedEvaluationResultsWithActions> {
  // Debug logging for the red/green apple test case
  const hasRedApple = expected.items.some(item => item.item.toLowerCase() === 'red apple');
  const hasGreenApple = expected.items.some(item => item.item.toLowerCase() === 'green apple');
  
  if (hasRedApple && hasGreenApple) {
    console.log('\n\n=== DEBUG: RED/GREEN APPLE TEST CASE ===');
    console.log('Expected items:', JSON.stringify(expected.items, null, 2));
    console.log('Actual items:', JSON.stringify(actual.items, null, 2));
  }
  // Process options with defaults
  const { 
    enableSemanticComparison = true,
    exactMatchesOnly = false,
    usualGroceries = ''
  } = options;
  
  // Default results structure with semantic fields
  const results: ExtendedEvaluationResultsWithActions = {
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
    },
    // Add semantic match information
    semanticMatches: {
      items: [],
      count: 0,
      confidenceScores: {},
      reasonings: {}
    },
    semanticEnabled: enableSemanticComparison,
    exactMatchesOnly: exactMatchesOnly
  };
  
  // If it doesn't conform to the schema, return early with minimal evaluation
  if (!results.conformsToSchema) {
    return results;
  }
  
  // Create maps for easier lookup
  const expectedMap = new Map<string, number>();
  expected.items.forEach(item => {
    expectedMap.set(item.item.toLowerCase(), item.quantity);
  });
  
  const actualMap = new Map<string, number>();
  actual.items.forEach((item: GroceryItem) => {
    actualMap.set(item.item.toLowerCase(), item.quantity);
  });
  
  // Create lists to track unmatched items for semantic comparison
  const unmatchedExpectedItems: Map<string, number> = new Map(expectedMap);
  const unmatchedActualItems: Map<string, { item: string, quantity: number }> = new Map();
  
  // First pass: check for exact matches to avoid unnecessary API calls
  for (const [expectedItem, expectedQuantity] of expectedMap.entries()) {
    if (actualMap.has(expectedItem)) {
      // Exact match found
      const actualQuantity = actualMap.get(expectedItem)!;
      
      if (actualQuantity === expectedQuantity) {
        results.details.correctItems.push(expectedItem);
      } else {
        results.details.incorrectItems.push({
          item: expectedItem,
          expected: expectedQuantity,
          actual: actualQuantity
        });
      }
      
      // Remove matched items from the unmatched lists
      unmatchedExpectedItems.delete(expectedItem);
    }
  }
  
  // Create map of unmatched actual items with original case-preserved names
  actual.items.forEach((item: GroceryItem) => {
    const itemLower = item.item.toLowerCase();
    if (!expectedMap.has(itemLower) || unmatchedExpectedItems.has(itemLower)) {
      unmatchedActualItems.set(itemLower, { 
        item: item.item, // Preserve original case
        quantity: item.quantity 
      });
    }
  });
  
  // Second pass: if semantic matching is enabled, try to match remaining items semantically
  if (enableSemanticComparison && !exactMatchesOnly && unmatchedExpectedItems.size > 0 && unmatchedActualItems.size > 0) {
    // For each unmatched expected item, try to find a semantic match in unmatched actual items
    for (const [expectedItemLower, expectedQuantity] of unmatchedExpectedItems.entries()) {
      // Skip further processing if already matched
      if (!unmatchedExpectedItems.has(expectedItemLower)) continue;
      
      // Get the original expected item name from the test case for better prompting
      const originalExpectedItem = expected.items.find(
        item => item.item.toLowerCase() === expectedItemLower
      )?.item || expectedItemLower;
      
      // Try to find a semantic match among unmatched actual items
      const semanticMatches: { actualItem: string, result: SemanticComparisonResult }[] = [];
      
      // Process all potential semantic matches
      await Promise.all(Array.from(unmatchedActualItems.keys()).map(async (actualItemLower) => {
        const actualItemData = unmatchedActualItems.get(actualItemLower)!;
        const originalActualItem = actualItemData.item;
        
        // Compare items semantically
        const result = await compareItemsSemantically(
          originalActualItem,
          originalExpectedItem,
          usualGroceries
        );
        
        // If it's a match with sufficient confidence, add to potential matches
        if (meetsConfidenceThreshold(result)) {
          semanticMatches.push({
            actualItem: actualItemLower,
            result
          });
        }
      }));
      
      // If we found semantic matches, use the one with highest confidence
      if (semanticMatches.length > 0) {
        // Sort matches by confidence score (highest first)
        semanticMatches.sort((a, b) => b.result.confidence - a.result.confidence);
        const bestMatch = semanticMatches[0];
        
        // Get actual item data
        const actualItemData = unmatchedActualItems.get(bestMatch.actualItem)!;
        const actualQuantity = actualItemData.quantity;
        
        // Store the semantic match information
        results.semanticMatches.items.push(expectedItemLower);
        results.semanticMatches.confidenceScores[expectedItemLower] = bestMatch.result.confidence;
        results.semanticMatches.reasonings[expectedItemLower] = bestMatch.result.reasoning;
        
        // Check if quantities match
        if (actualQuantity === expectedQuantity) {
          // Add to correct items, but mark it as a semantic match
          results.details.correctItems.push(expectedItemLower);
        } else {
          // Quantities don't match
          results.details.incorrectItems.push({
            item: expectedItemLower,
            expected: expectedQuantity,
            actual: actualQuantity
          });
        }
        
        // Remove matched items from unmatched lists
        unmatchedExpectedItems.delete(expectedItemLower);
        unmatchedActualItems.delete(bestMatch.actualItem);
      }
    }
    
    // Update semantic match count
    results.semanticMatches.count = results.semanticMatches.items.length;
  }
  
  // Add remaining unmatched expected items to missing items
  for (const missingItem of unmatchedExpectedItems.keys()) {
    results.details.missingItems.push(missingItem);
  }
  
  // Add remaining unmatched actual items to extra items
  for (const [actualItemLower, actualItemData] of unmatchedActualItems.entries()) {
    results.details.extraItems.push(actualItemLower);
  }
  
  // Set boolean flags based on the comparisons
  results.hasCorrectItems = results.details.correctItems.length > 0;
  results.hasCorrectQuantities = results.details.incorrectItems.length === 0;
  results.hasExtraItems = results.details.extraItems.length > 0;
  results.hasMissingItems = results.details.missingItems.length > 0;
  
  // Calculate match score (percentage of correct items)
  const totalCorrect = results.details.correctItems.length;
  const totalExpected = expected.items.length;
  const semanticMatches = results.semanticMatches.count;
  
  // Update match score based on exact and semantic matches
  results.details.matchScore = totalExpected > 0 
    ? totalCorrect / totalExpected 
    : 0;
  
  // Evaluate action-based operations
  const actionResults = evaluateActions(actual, expected, results.semanticMatches);
  results.actionResults = actionResults;
  
  // Overall score calculation
  // If all items match perfectly and there are no extra or incorrect items, score is 100%
  // Otherwise, calculate based on weights and penalties
  
  if (results.details.matchScore === 1 && 
      results.details.extraItems.length === 0 && 
      results.details.incorrectItems.length === 0) {
    // Perfect match - all expected items are present and correct, no extra items
    results.score = 1.0; // 100%
  } else {
    // Not a perfect match - calculate weighted score
    // 70% weight for correct items, 30% penalty for extra/incorrect items
    const correctItemsScore = results.details.matchScore * 0.7;
    
    // Penalize for extra and incorrect items, but not below 0
    const extraItemsPenalty = Math.min(
      0.15, 
      (results.details.extraItems.length / Math.max(1, totalExpected)) * 0.15
    );
    
    const incorrectItemsPenalty = Math.min(
      0.15, 
      (results.details.incorrectItems.length / Math.max(1, totalExpected)) * 0.15
    );
    
    // Calculate the final score
    results.score = Math.max(0, Math.min(1, 
      correctItemsScore - extraItemsPenalty - incorrectItemsPenalty
    ));
    
    // Add a small semantic matching bonus (max 10%) for proper use of semantic understanding
    // Only if semantic matching is enabled and we found some semantic matches
    if (enableSemanticComparison && semanticMatches > 0) {
      // Calculate the ratio of semantic matches to total correct items
      const semanticRatio = semanticMatches / Math.max(1, totalCorrect);
      // Apply a bonus (maximum of 0.1 or 10% of the score) based on semantic matches
      const semanticBonus = Math.min(0.1, semanticRatio * 0.1);
      
      // Add the bonus to the score, not exceeding 1.0
      results.score = Math.min(1.0, results.score + semanticBonus);
    }
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
export function formatEvaluationResults(
  results: EvaluationResults | ExtendedEvaluationResultsWithActions, 
  actual?: GroceryItems, 
  expected?: GroceryItems
): string {
  // Debug logging for red/green apple test case
  if (expected && actual) {
    const hasRedApple = expected.items.some(item => item.item.toLowerCase().includes('red apple'));
    const hasGreenApple = expected.items.some(item => item.item.toLowerCase().includes('green apple'));
    
    if (hasRedApple && hasGreenApple) {
      console.log('\n\n=== DEBUG: RED/GREEN APPLE TEST CASE IN FORMAT FUNCTION ===');
      console.log('Expected items:', JSON.stringify(expected.items, null, 2));
      console.log('Actual items:', JSON.stringify(actual.items, null, 2));
      
      // Check if we have the specific test case with the side-by-side comparison issue
      const redAppleExpected = expected.items.find(item => item.item.toLowerCase().includes('red apple'));
      const greenAppleExpected = expected.items.find(item => item.item.toLowerCase().includes('green apple'));
      const redAppleActual = actual.items.find(item => item.item.toLowerCase().includes('red apple'));
      const greenAppleActual = actual.items.find(item => item.item.toLowerCase().includes('green apple'));
      
      if (redAppleExpected && greenAppleExpected && redAppleActual && greenAppleActual) {
        console.log('\nThis is the test case with the side-by-side comparison issue!');
        console.log('Red apple expected:', JSON.stringify(redAppleExpected));
        console.log('Green apple expected:', JSON.stringify(greenAppleExpected));
        console.log('Red apple actual:', JSON.stringify(redAppleActual));
        console.log('Green apple actual:', JSON.stringify(greenAppleActual));
      }
    }
  }
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
  
  // Add semantic matching information if available
  const extendedResults = results as ExtendedEvaluationResultsWithActions;
  if ('semanticMatches' in extendedResults) {
    output += `\nSemantic Matching: ${extendedResults.semanticEnabled ? '\x1b[32mEnabled\x1b[0m' : '\x1b[33mDisabled\x1b[0m'}\n`;
    
    if (extendedResults.semanticEnabled && !extendedResults.exactMatchesOnly) {
      // Show semantic match statistics
      const semanticCount = extendedResults.semanticMatches.count;
      output += `Semantic Matches: ${semanticCount > 0 ? '\x1b[32m' : '\x1b[33m'}${semanticCount}\x1b[0m items\n`;
      
      // Show details of semantic matches if there are any
      if (semanticCount > 0) {
        output += '\n\x1b[1m\x1b[44m\x1b[37m === Semantic Match Details === \x1b[0m\n';
        for (const item of extendedResults.semanticMatches.items) {
          const confidence = extendedResults.semanticMatches.confidenceScores[item];
          const reasoning = extendedResults.semanticMatches.reasonings[item];
          
          // Format confidence with color based on confidence level
          const confidenceColor = confidence >= 0.9 ? '\x1b[32m' : // Green for high confidence
                                confidence >= 0.8 ? '\x1b[33m' : // Yellow for medium confidence
                                '\x1b[31m'; // Red for low confidence
          
          output += `\x1b[1m"${item}"\x1b[0m matched with ${confidenceColor}${(confidence * 100).toFixed(1)}%\x1b[0m confidence\n`;
          output += `  Reasoning: ${reasoning}\n\n`;
        }
      }
    } else if (extendedResults.exactMatchesOnly) {
      output += `\x1b[33mExact matches only mode: Semantic matching not applied\x1b[0m\n`;
    }
  }
  
  // Add action-based operation evaluation results
  if ('actionResults' in extendedResults) {
    const actionResults = extendedResults.actionResults!;
    
    output += `\nAction-Based Operations:\n`;
    output += `  Total Action Accuracy: ${actionResults.totalActionAccuracy.toFixed(1)}%\n`;
    output += `  Add Accuracy: ${actionResults.addAccuracy.toFixed(1)}%\n`;
    output += `  Remove Accuracy: ${actionResults.removeAccuracy.toFixed(1)}%\n`;
    output += `  Modify Accuracy: ${actionResults.modifyAccuracy.toFixed(1)}%\n`;
    
    if (actionResults.actionErrors.wrongAction.length > 0) {
      output += `\nWrong Actions:\n`;
      actionResults.actionErrors.wrongAction.forEach(error => {
        output += `  - ${error.item}: Expected ${error.expectedAction}, Got ${error.actualAction}\n`;
      });
    }
    
    if (actionResults.actionErrors.missingAction.length > 0) {
      output += `\nMissing Actions:\n`;
      actionResults.actionErrors.missingAction.forEach(error => {
        output += `  - ${error.item}: Expected ${error.expectedAction}\n`;
      });
    }
  }
  
  // Side-by-side comparison of expected vs actual results
  if (expected && actual) {
    output += '\n\x1b[1m\x1b[44m\x1b[37m === Side-by-Side Comparison === \x1b[0m\n';
    output += '\x1b[1mExpected (Left) vs Actual (Right):\x1b[0m\n';
    
    // Format the items as aligned columns
    const expectedItems = expected.items || [];
    const actualItems = actual.items || [];
    
    // Create a Map of actual items, keyed by their sanitized item name
    const actualItemsMap = new Map<string, {
      item: GroceryItem;
      index: number;
      matched: boolean;
    }>();
    
    actualItems.forEach((item, index) => {
      actualItemsMap.set(item.item.toLowerCase(), {
        item,
        index,
        matched: false
      });
    });
    
    // Check for semantic matches if available
    const extendedResults = results as ExtendedEvaluationResultsWithActions;
    const semanticMatchMap = new Map<string, string>();
    
    if ('semanticMatches' in extendedResults && extendedResults.semanticMatches) {
      // Build a map of expected item names to their semantic matches in actual items
      for (const expectedItemName of extendedResults.semanticMatches.items) {
        // Find the best semantic match for this expected item
        let bestMatch: { actualItemName: string; confidence: number } | null = null;
        
        for (const [actualItemName, actualItemData] of actualItemsMap.entries()) {
          // Skip items that are already matched exactly by name
          if (actualItemName === expectedItemName) continue;
          
          // Check if this is a semantic match with confidence score
          if (extendedResults.semanticMatches.confidenceScores[expectedItemName]) {
            // Compare these two items specifically
            const confidence = extendedResults.semanticMatches.confidenceScores[expectedItemName];
            
            // If this is the best match so far, remember it
            if (!bestMatch || confidence > bestMatch.confidence) {
              bestMatch = {
                actualItemName,
                confidence
              };
            }
          }
        }
        
        // If we found a match, add it to our map
        if (bestMatch) {
          semanticMatchMap.set(expectedItemName, bestMatch.actualItemName);
        }
      }
    }
    
    // Counter for line numbers
    let lineNumber = 1;
    
    // Debug logging for red/green apple test case
    const hasRedApple = expectedItems.some(item => item.item.toLowerCase() === 'red apple');
    const hasGreenApple = expectedItems.some(item => item.item.toLowerCase() === 'green apple');
    
    if (hasRedApple && hasGreenApple) {
      console.log('\n\n=== DEBUG: RED/GREEN APPLE TEST CASE IN SIDE-BY-SIDE COMPARISON ===');
      console.log('Expected items:', JSON.stringify(expectedItems, null, 2));
      console.log('Actual items:', JSON.stringify(actualItems, null, 2));
      console.log('Semantic match map:', JSON.stringify(Array.from(semanticMatchMap.entries()), null, 2));
      console.log('Actual items map:', JSON.stringify(Array.from(actualItemsMap.entries()).map(([key, value]) => {
        return [key, { item: value.item, matched: value.matched }];
      }), null, 2));
    }
    
  // First, iterate through expected items and find their matches
    for (const expectedItem of expectedItems) {
      const expectedLower = expectedItem.item.toLowerCase();
      const expectedQty = expectedItem.quantity;
      const expectedFormatted = `"${expectedItem.item}" (${expectedItem.quantity})`;
      
      // Try to find a match in actual items
      // First check for exact match by name AND action
      let actualItemData = null;
      let matchType = 'exact';
      
      // Look for an exact match with the same action type
      for (const [itemName, itemData] of actualItemsMap.entries()) {
        if (itemName === expectedLower && itemData.item.action === expectedItem.action && !itemData.matched) {
          actualItemData = itemData;
          break;
        }
      }
      
      // If no exact match with same action, look for any exact match by name
      if (!actualItemData) {
        actualItemData = actualItemsMap.get(expectedLower);
      }
      
      // If no exact match, check for semantic match
      if (!actualItemData && semanticMatchMap.has(expectedLower)) {
        const semanticMatchName = semanticMatchMap.get(expectedLower);
        if (semanticMatchName) {
          actualItemData = actualItemsMap.get(semanticMatchName);
          matchType = 'semantic';
        }
      }
      
      // Format the actual item or show as missing
      let actualFormatted = '---';
      let comparison = '';
      let itemColor = '';
      
      if (actualItemData) {
        // Mark this actual item as matched so we don't show it again later
        actualItemData.matched = true;
        
        const actualItem = actualItemData.item;
        const actualQty = actualItem.quantity;
        actualFormatted = `"${actualItem.item}" (${actualItem.quantity})`;
        
        // Determine the comparison result and color
        if (matchType === 'exact' && expectedQty === actualQty) {
          // Exact match with matching quantities
          comparison = ' \x1b[32m✓ EXACT MATCH\x1b[0m';
          itemColor = '\x1b[32m'; // Green for match
        } else if (matchType === 'semantic' && expectedQty === actualQty) {
          // Semantic match with matching quantities
          const confidence = extendedResults.semanticMatches.confidenceScores[expectedLower];
          comparison = ` \x1b[36m✓ SEMANTIC MATCH (${(confidence * 100).toFixed(0)}%)\x1b[0m`;
          itemColor = '\x1b[36m'; // Cyan for semantic match
        } else if (matchType === 'exact') {
          comparison = ' \x1b[33m⚠️ QUANTITY MISMATCH\x1b[0m';
          itemColor = '\x1b[33m'; // Yellow for quantity mismatch
        } else if (matchType === 'semantic') {
          // Semantic match but quantity mismatch
          const confidence = extendedResults.semanticMatches.confidenceScores[expectedLower];
          comparison = ` \x1b[33m⚠️ SEMANTIC MATCH (${(confidence * 100).toFixed(0)}%) BUT QUANTITY MISMATCH\x1b[0m`;
          itemColor = '\x1b[33m'; // Yellow for quantity mismatch
        }
      } else {
        // No match found - this is a missing item
        comparison = ' \x1b[31m✗ MISSING ITEM\x1b[0m';
        itemColor = '\x1b[31m'; // Red for missing
      }
      
      // Number each line and add colors to items
      output += `\x1b[36m${lineNumber}.\x1b[0m ${itemColor}${expectedFormatted}\x1b[0m`.padEnd(36) + 
               `| ${itemColor}${actualFormatted}\x1b[0m`.padEnd(36) + 
               `${comparison}\n`;
      
      lineNumber++;
    }
    
    // Now show any remaining actual items that weren't matched (extra items)
    for (const [actualItemName, actualItemData] of actualItemsMap.entries()) {
      if (!actualItemData.matched) {
        const actualItem = actualItemData.item;
        const actualFormatted = `"${actualItem.item}" (${actualItem.quantity})`;
        
        // Format as an extra item
        output += `\x1b[36m${lineNumber}.\x1b[0m ---`.padEnd(36) + 
                 `| \x1b[31m${actualFormatted}\x1b[0m`.padEnd(36) + 
                 ` \x1b[31m✗ EXTRA ITEM\x1b[0m\n`;
        
        lineNumber++;
      }
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
