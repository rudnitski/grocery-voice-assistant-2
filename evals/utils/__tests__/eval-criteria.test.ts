/**
 * Integration tests for the evaluation system with semantic comparison
 */

import { evaluateGroceryOutput, formatEvaluationResults, GroceryItems } from '../eval-criteria';
import * as semanticComparisonService from '../semantic-comparison';
import { mockOpenAIClient, mockResponses, resetMockResponses } from './mocks/openai-service.mock';

// Mock the OpenAI service
jest.mock('../../../lib/services/openai-service', () => ({
  getOpenAIClient: jest.fn(() => mockOpenAIClient)
}));

describe('Evaluation System with Semantic Comparison', () => {
  // Reset mocks and cache before each test
  beforeEach(() => {
    // Reset all mock responses between tests
    resetMockResponses();
    semanticComparisonService.clearCache();
    mockOpenAIClient.chat.completions.create.mockClear();
    jest.clearAllMocks();
  });

  describe('evaluateGroceryOutput', () => {
    test('should correctly evaluate with exact matches', async () => {
      const actual: GroceryItems = { 
        items: [
          { item: 'apples', quantity: 3, action: 'add', measurement: undefined },
          { item: 'milk', quantity: 1, action: 'add', measurement: undefined }
        ] 
      };
      
      const expected: GroceryItems = { 
        items: [
          { item: 'apples', quantity: 3, action: 'add', measurement: undefined },
          { item: 'milk', quantity: 1, action: 'add', measurement: undefined }
        ] 
      };
      
      const result = await evaluateGroceryOutput(actual, expected, { enableSemanticComparison: false });
      
      expect(result.score).toBe(1.0); // Perfect score
      expect(result.details.correctItems.length).toBe(2); // Both items matched exactly
      expect(result.details.missingItems.length).toBe(0); 
      expect(result.details.extraItems.length).toBe(0);
      expect(result.semanticMatches.count).toBe(0); // No semantic matches when disabled
    });

    test('should use semantic comparison when enabled', async () => {
      // Set up mock response for "tomato sauce" vs "pasta sauce"
      mockResponses['tomato sauce vs pasta sauce'] = {
        isMatch: true,
        confidence: 0.85,
        reasoning: 'Both refer to a sauce commonly used for pasta dishes.'
      };
      
      // Make sure this exact text is in the user message for the mock to work
      mockResponses['EXTRACTED ITEM: tomato sauce'] = {
        isMatch: true,
        confidence: 0.85,
        reasoning: 'Both refer to a sauce commonly used for pasta dishes.'
      };
      
      const actual: GroceryItems = { 
        items: [
          { item: 'tomato sauce', quantity: 1, action: 'add', measurement: undefined },
          { item: 'milk', quantity: 1, action: 'add', measurement: undefined }
        ] 
      };
      
      const expected: GroceryItems = { 
        items: [
          { item: 'pasta sauce', quantity: 1, action: 'add', measurement: undefined },
          { item: 'milk', quantity: 1, action: 'add', measurement: undefined }
        ] 
      };
      
      const result = await evaluateGroceryOutput(actual, expected, { 
        enableSemanticComparison: true 
      });
      
      expect(result.score).toBeGreaterThanOrEqual(0.9); // High score with semantic match
      expect(result.details.correctItems.length).toBe(2); // Both items count as correct (exact + semantic)
      expect(result.semanticMatches.count).toBe(1); // Semantic match for sauce
      // Verify first semantic match item
      const semanticMatchKey = result.semanticMatches.items[0];
      // The key might be just the item name in the implementation
      expect(semanticMatchKey).toBeTruthy();
      expect(result.semanticMatches.confidenceScores[semanticMatchKey]).toBe(0.85);
    });

    test('should respect confidence threshold for semantic matches', async () => {
      // Set up mock responses
      mockResponses['fruit juice vs orange juice'] = {
        isMatch: true,
        confidence: 0.6, // Below default threshold of 0.8
        reasoning: 'While fruit juice is a category that includes orange juice, they are not the same specific product.'
      };
      
      // Make sure this exact text is in the user message for the mock to work
      mockResponses['EXTRACTED ITEM: fruit juice'] = {
        isMatch: true,
        confidence: 0.6, // Below default threshold of 0.8
        reasoning: 'While fruit juice is a category that includes orange juice, they are not the same specific product.'
      };
      
      const actual: GroceryItems = { 
        items: [
          { item: 'fruit juice', quantity: 1, action: 'add' }
        ] 
      };
      
      const expected: GroceryItems = { 
        items: [
          { item: 'orange juice', quantity: 1, action: 'add' }
        ] 
      };
      
      // First test with default threshold (should not match)
      const resultDefault = await evaluateGroceryOutput(actual, expected, { 
        enableSemanticComparison: true 
      });
      
      expect(resultDefault.semanticMatches.count).toBe(0); // No semantic matches
      expect(resultDefault.details.extraItems.length).toBe(1); // Counted as extra item
      expect(resultDefault.details.missingItems.length).toBe(1); // Original still missing
      
      // Change threshold and test again
      const originalThreshold = semanticComparisonService.getConfidenceThreshold();
      semanticComparisonService.setConfidenceThreshold(0.5);
      
      const resultLowerThreshold = await evaluateGroceryOutput(actual, expected, { 
        enableSemanticComparison: true 
      });
      
      expect(resultLowerThreshold.semanticMatches.count).toBe(1); // Now matches
      expect(resultLowerThreshold.details.extraItems.length).toBe(0);
      expect(resultLowerThreshold.details.missingItems.length).toBe(0);
      
      // Restore original threshold
      semanticComparisonService.setConfidenceThreshold(originalThreshold);
    });

    test('should handle quantity mismatches with semantic matches', async () => {
      // Set up mock response for apples
      mockResponses['green apples vs apples'] = {
        isMatch: true,
        confidence: 0.9,
        reasoning: 'Green apples are a type of apple, with the qualifier not changing the core item.'
      };
      
      // Make sure this exact text is in the user message for the mock to work
      mockResponses['EXTRACTED ITEM: green apples'] = {
        isMatch: true,
        confidence: 0.9,
        reasoning: 'Green apples are a type of apple, with the qualifier not changing the core item.'
      };
      
      const actual: GroceryItems = { 
        items: [
          { item: 'green apples', quantity: 5, action: 'add' }
        ] 
      };
      
      const expected: GroceryItems = { 
        items: [
          { item: 'apples', quantity: 3, action: 'add' }
        ] 
      };
      
      const result = await evaluateGroceryOutput(actual, expected, { 
        enableSemanticComparison: true 
      });
      
      expect(result.semanticMatches.count).toBe(1);
      expect(result.details.incorrectItems.length).toBe(1);
      // Check quantity mismatch in incorrectItems
      const mismatchedItem = result.details.incorrectItems.find(item => item.item === 'green apples' || item.item === 'apples');
      expect(mismatchedItem).toBeDefined();
      if (mismatchedItem) {
        expect(mismatchedItem.expected).toBe(3);
        expect(mismatchedItem.actual).toBe(5);
      }
    });

    test('should handle Russian items with different word order', async () => {
      // Set up mock for Russian items with different word order
      mockResponses['куриное филе vs филе куриное'] = {
        isMatch: true,
        confidence: 0.99,
        reasoning: 'These phrases refer to the same product (chicken fillet) with only a difference in word order.'
      };
      
      // Make sure this exact text is in the user message for the mock to work
      mockResponses['EXTRACTED ITEM: куриное филе'] = {
        isMatch: true,
        confidence: 0.99,
        reasoning: 'These phrases refer to the same product (chicken fillet) with only a difference in word order.'
      };
      
      const actual: GroceryItems = { 
        items: [
          { item: 'куриное филе', quantity: 2, action: 'add' }
        ] 
      };
      
      const expected: GroceryItems = { 
        items: [
          { item: 'филе куриное', quantity: 2, action: 'add' }
        ] 
      };
      
      const result = await evaluateGroceryOutput(actual, expected, { 
        enableSemanticComparison: true 
      });
      
      expect(result.semanticMatches.count).toBe(1);
      // Find the confidence score for the Russian item semantic match
      const russianMatchKey = result.semanticMatches.items[0];
      // The key might be just one of the item names in the implementation
      expect(russianMatchKey).toBeTruthy();
      expect(result.semanticMatches.confidenceScores[russianMatchKey]).toBe(0.99);
      expect(result.score).toBeGreaterThanOrEqual(0.95); // Should be a high score
    });

    test('should include usual groceries context when provided', async () => {
      const usualGroceries = 'творожок «Савушкин»\nмолоко\nяйца';
      
      // Set up mock for brand specificity with usual groceries context
      mockResponses['творожок vs творожок «савушкин»'] = {
        isMatch: true,
        confidence: 0.95,
        reasoning: 'Based on the usual groceries list, when the user mentions "творожок" they likely mean the specific brand "Савушкин".'
      };
      
      // Make sure this exact text is in the user message for the mock to work
      mockResponses['EXTRACTED ITEM: творожок'] = {
        isMatch: true,
        confidence: 0.95,
        reasoning: 'Based on the usual groceries list, when the user mentions "творожок" they likely mean the specific brand "Савушкин".'
      };
      
      const actual: GroceryItems = { 
        items: [
          { item: 'творожок', quantity: 1, action: 'add' }
        ] 
      };
      
      const expected: GroceryItems = { 
        items: [
          { item: 'творожок «Савушкин»', quantity: 1, action: 'add' }
        ] 
      };
      
      const result = await evaluateGroceryOutput(actual, expected, { 
        enableSemanticComparison: true,
        usualGroceries
      });
      
      expect(result.semanticMatches.count).toBe(1);
      // Find the confidence score for the творожок semantic match
      const tvorozhokMatchKey = result.semanticMatches.items[0];
      // The key might be just one of the item names in the implementation
      expect(tvorozhokMatchKey).toBeTruthy();
      expect(result.semanticMatches.confidenceScores[tvorozhokMatchKey]).toBe(0.95);
      
      // Verify the API was called with usual groceries in the prompt
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining(usualGroceries)
            })
          ])
        })
      );
    });
  });

  describe('formatEvaluationResults', () => {
    test('should include semantic matching status in the report', async () => {
      // Set up mock for sauce comparison
      mockResponses['tomato sauce vs pasta sauce'] = {
        isMatch: true,
        confidence: 0.85,
        reasoning: 'Both refer to a sauce commonly used for pasta dishes.'
      };
      
      // Make sure this exact text is in the user message for the mock to work
      mockResponses['EXTRACTED ITEM: tomato sauce'] = {
        isMatch: true,
        confidence: 0.85,
        reasoning: 'Both refer to a sauce commonly used for pasta dishes.'
      };
      
      const actual: GroceryItems = { 
        items: [
          { item: 'tomato sauce', quantity: 2, action: 'add', measurement: undefined },
          { item: 'milk', quantity: 1, action: 'add', measurement: undefined }
        ] 
      };
      
      const expected: GroceryItems = { 
        items: [
          { item: 'pasta sauce', quantity: 2, action: 'add', measurement: undefined },
          { item: 'milk', quantity: 1, action: 'add', measurement: undefined }
        ] 
      };
      
      const evaluationResult = await evaluateGroceryOutput(actual, expected, { 
        enableSemanticComparison: true 
      });
      
      const formattedResult = formatEvaluationResults(evaluationResult, actual, expected);
      
      // Check if the report contains key semantic matching information
      expect(formattedResult.includes('Semantic Matching:')).toBeTruthy();
      expect(formattedResult.includes('Enabled')).toBeTruthy();
      expect(formattedResult.includes('Semantic Matches:')).toBeTruthy();
      expect(formattedResult.includes('1')).toBeTruthy();
      expect(formattedResult.includes('SEMANTIC MATCH')).toBeTruthy();
      expect(formattedResult.includes('Both refer to a sauce commonly used for pasta dishes')).toBeTruthy();
      expect(formattedResult).toContain('85%'); // Confidence percentage
    });

    test('should not include semantic information when disabled', async () => {
      const actual: GroceryItems = { 
        items: [
          { item: 'apples', quantity: 3, action: 'add' }
        ] 
      };
      
      const expected: GroceryItems = { 
        items: [
          { item: 'apples', quantity: 3, action: 'add' }
        ] 
      };
      
      const evaluationResult = await evaluateGroceryOutput(actual, expected, { 
        enableSemanticComparison: false 
      });
      
      const formattedResult = formatEvaluationResults(evaluationResult, actual, expected);
      
      // Should not contain semantic match details
      expect(formattedResult).not.toContain('Semantic Matches:');
      expect(formattedResult).not.toContain('=== Semantic Match Details ===');
    });
  });
});
