/**
 * Basic tests for the mock OpenAI service
 */

import { mockOpenAIClient, mockResponses, resetMockResponses } from './openai-service.mock';

describe('Mock OpenAI Client', () => {
  beforeEach(() => {
    resetMockResponses();
  });

  test('should return mocked responses when configured', async () => {
    // Set up a mock response and clear any existing mocks
    resetMockResponses();
    mockOpenAIClient.chat.completions.create.mockClear();
    
    mockResponses['compare test items'] = {
      isMatch: true,
      confidence: 0.9,
      reasoning: 'Test reasoning'
    };

    // Mock API call with content that contains the key
    const response = await mockOpenAIClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Compare items' },
        { role: 'user', content: 'Please compare test items for me' }
      ],
      response_format: { type: 'json_object' }
    });

    // Verify the response
    expect(response.choices[0].message.content).toBeTruthy();
    const content = JSON.parse(response.choices[0].message.content);
    expect(content.isMatch).toBe(true);
    expect(content.confidence).toBe(0.9);
    expect(content.reasoning).toBe('Test reasoning');
  });

  test('should return default response for unknown queries', async () => {
    // Mock API call with no configured response
    const response = await mockOpenAIClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Compare items' },
        { role: 'user', content: 'unknown query' }
      ],
      response_format: { type: 'json_object' }
    });

    // Verify the default response
    expect(response.choices[0].message.content).toBeTruthy();
    const content = JSON.parse(response.choices[0].message.content);
    expect(content.isMatch).toBe(false);
  });
});
