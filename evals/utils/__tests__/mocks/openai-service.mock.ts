/**
 * Mock implementation of the OpenAI service for testing
 */

import { ChatCompletion } from 'openai/resources';

// Store mock semantic comparison responses
export const mockResponses: { [key: string]: any } = {};

// Reset mock responses
export function resetMockResponses() {
  for (const key in mockResponses) {
    delete mockResponses[key];
  }
}

// Helper to find a matching response
function findMatchingResponse(content: string): any {
  // Try to find an exact match first
  if (mockResponses[content]) {
    return mockResponses[content];
  }
  
  // Extract the items being compared from the prompt
  const extractedItem = content.match(/EXTRACTED ITEM: (.*?)(\n|$)/)?.[1]?.trim() || '';
  const expectedItem = content.match(/EXPECTED ITEM: (.*?)(\n|$)/)?.[1]?.trim() || '';
  
  // Generate comparison keys to try
  const comparisonKeys = [];
  if (extractedItem && expectedItem) {
    comparisonKeys.push(`${extractedItem} vs ${expectedItem}`);
    comparisonKeys.push(`${extractedItem}_vs_${expectedItem}`);
  }
  
  // Check if we have matches for any of these keys
  for (const key of comparisonKeys) {
    if (mockResponses[key]) {
      return mockResponses[key];
    }
  }
  
  // Try individual items
  if (extractedItem && mockResponses[`EXTRACTED ITEM: ${extractedItem}`]) {
    return mockResponses[`EXTRACTED ITEM: ${extractedItem}`];
  }
  
  // Otherwise try to find a substring match
  for (const key in mockResponses) {
    if (content.includes(key)) {
      return mockResponses[key];
    }
  }
  
  // Default response if no match found
  return {
    isMatch: false,
    confidence: 0.0,
    reasoning: "No mock response configured for this input"
  };
}

// Interface for semantic comparison mock responses
interface SemanticComparisonMockResponse {
  isMatch: boolean;
  confidence: number;
  reasoning: string;
}

// Mock the OpenAI client
export const mockOpenAIClient = {
  chat: {
    completions: {
      create: jest.fn().mockImplementation(async (options) => {
        // Get the content from the messages
        const userMessage = options.messages.find((msg: {role: string, content: string}) => msg.role === 'user');
        const content = userMessage ? userMessage.content : '';
        
        // Find a matching response
        const mockResponse = findMatchingResponse(content);
        
        return {
          id: 'mock-completion-id',
          object: 'chat.completion',
          created: Date.now(),
          model: 'gpt-4o',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: JSON.stringify(mockResponse)
              },
              finish_reason: 'stop'
            }
          ]
        } as ChatCompletion;
      })
    }
  }
};

// Mock of the getOpenAIClient function
export const getOpenAIClient = jest.fn(() => mockOpenAIClient);
