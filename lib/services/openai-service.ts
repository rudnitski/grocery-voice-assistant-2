import OpenAI from 'openai';

// Simple logger function for tracking API requests and responses
const logger = {
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp} - ${message}`, data ? data : '');
  },
  error: (message: string, error: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} - ${message}`, error);
    if (error instanceof Error) {
      console.error(`[ERROR] ${timestamp} - Stack:`, error.stack);
    }
  },
  warn: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] ${timestamp} - ${message}`, data ? data : '');
  }
};

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

/**
 * Initialize the OpenAI client with the provided API key
 * @param apiKey - The OpenAI API key
 * @returns The initialized OpenAI client
 */
export const initializeOpenAI = (apiKey: string | undefined): OpenAI => {
  if (!apiKey) {
    logger.error('No API key provided', new Error('API key is undefined'));
    throw new Error('OpenAI API key is required');
  }

  try {
    openaiClient = new OpenAI({
      apiKey: apiKey,
      timeout: 30000,
      maxRetries: 2,
    });
    logger.info('OpenAI client initialized successfully');
    return openaiClient;
  } catch (error) {
    logger.error('Failed to initialize OpenAI client', error);
    throw new Error('OpenAI client initialization failed');
  }
};

/**
 * Get the OpenAI client, initializing it if necessary
 * @returns The OpenAI client
 */
export const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    return initializeOpenAI(apiKey);
  }
  return openaiClient;
};

/**
 * Generic function to make a chat completion request to OpenAI
 * @param systemPrompt - The system prompt to use
 * @param userMessage - The user message to send
 * @param options - Additional options for the request
 * @returns The response from OpenAI
 */
export const makeChatCompletion = async (
  systemPrompt: string,
  userMessage: string,
  options?: {
    model?: string;
    temperature?: number;
    responseFormat?: any;
    maxTokens?: number;
  }
) => {
  if (!userMessage) {
    throw new Error('User message is required');
  }

  try {
    const openai = getOpenAIClient();
    
    logger.info('Sending request to OpenAI');
    const completion = await openai.chat.completions.create({
      model: options?.model || "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      response_format: options?.responseFormat ? { type: "json_object" } : undefined,
      temperature: options?.temperature ?? 0,
      max_tokens: options?.maxTokens ?? 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    const result = completion.choices[0].message.content || '';
    logger.info('Received response from OpenAI', { responseId: completion.id });
    return result;
  } catch (error) {
    logger.error('Error making chat completion request', error);
    throw error;
  }
};

/**
 * Parse a JSON response from OpenAI
 * @param jsonString - The JSON string to parse
 * @returns The parsed JSON object
 */
export const parseJsonResponse = (jsonString: string): any => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logger.error('Failed to parse JSON response', error);
    throw new Error('Invalid JSON response');
  }
};

/**
 * Transcribe audio using OpenAI's API
 * @param audioBlob - The audio blob to transcribe
 * @returns The transcribed text
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    logger.info('Preparing to transcribe audio');
    
    // Create a FormData object to send the audio file
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'gpt-4o-mini');
    
    // Send the request to the API endpoint
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Transcription API error', { status: response.status, error: errorText });
      throw new Error(`Transcription API error: ${response.status}`);
    }
    
    const data = await response.json();
    logger.info('Transcription completed successfully');
    
    return data.text || '';
  } catch (error) {
    logger.error('Error transcribing audio', error);
    throw error;
  }
};

/**
 * Process a transcript to extract grocery items
 * This is a client-side friendly version that calls the API endpoint
 * @param transcript - The transcript to process
 * @param usualGroceries - Optional list of usual groceries to aid in recognition
 * @returns Object containing the extracted grocery items and the raw JSON response
 */
// Define the structure of items as returned by the /api/parse_groceries endpoint
export interface ApiGroceryItem {
  item: string; // Name of the item as returned by AI
  quantity: number;
  action: 'add' | 'remove' | 'modify' | string; // AI can send various actions
  id?: string; // Optional ID from AI
  unit?: string; // Optional unit from AI
  [key: string]: any; // Allow other dynamic properties from AI
}

export const processTranscriptClient = async (
  transcript: string, 
  usualGroceries?: string
): Promise<{
  items: ApiGroceryItem[];
  rawResponse: string;
}> => {
  try {
    const response = await fetch('/api/parse_groceries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transcript, usualGroceries }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store the raw JSON response
    const rawResponse = JSON.stringify(data, null, 2);
    
    let originalApiItems: ApiGroceryItem[] = [];
    if (data && data.items && Array.isArray(data.items)) {
      originalApiItems = data.items;
    }
    // The VoiceRecorder component will now handle parsing this raw structure from rawResponse
    
    return {
      items: originalApiItems,
      rawResponse
    };
  } catch (error) {
    console.error('Error processing transcript:', error);
    throw error;
  }
};
