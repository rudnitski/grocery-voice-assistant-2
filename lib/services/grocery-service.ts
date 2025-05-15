import { makeChatCompletion, parseJsonResponse } from './openai-service';

// Simple logger for tracking API requests
const logger = {
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp} - ${message}`, data ? data : '');
  },
  error: (message: string, error: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} - ${message}`, error);
  }
};

/**
 * The grocery extraction prompt
 */
const GROCERY_EXTRACTION_PROMPT = `
You are a data extraction assistant for a grocery shopping app.

Your task: Extract only real grocery items (food, beverages, common household goods) and their quantities from the transcript below. The transcript may be in any language - do NOT translate the items, keep them in the original language.

Instructions:
- Output a valid JSON ARRAY of objects.
- Each object must have exactly two properties:
  - "item": the name of the grocery item in singular form (string) in the ORIGINAL LANGUAGE.
  - "quantity": the amount, either a number or a descriptive string (e.g., "1", "1 liter", "500 грамм").
- Only include things people actually buy in a grocery store.
- Ignore words, numbers, or phrases that are not typical grocery items.
- Do NOT include objects that are not real groceries or household goods.
- DO NOT translate the items to English - keep them in the original language of the transcript.

Rules:
- Respond with JSON array ONLY. No explanations or extra text.
- If the transcript does not specify a quantity, assume "1".
- Convert plural item names to singular form when possible.
- If your response must be empty, respond with an empty array [].

Example valid items in different languages:
English: "milk", "eggs", "toilet paper", "chicken breast"
Russian: "молоко", "яйца", "туалетная бумага", "куриная грудка"
Spanish: "leche", "huevos", "papel higiénico", "pechuga de pollo"
`;

/**
 * The response format for grocery extraction
 */
const GROCERY_RESPONSE_FORMAT = {
  "type": "json_schema",
  "json_schema": {
    "name": "inventory",
    "strict": true,
    "schema": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "description": "A list of items with their quantities.",
          "items": {
            "type": "object",
            "properties": {
              "item": {
                "type": "string",
                "description": "The name of the item."
              },
              "quantity": {
                "type": "number",
                "description": "The quantity of the item."
              }
            },
            "required": [
              "item",
              "quantity"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "items"
      ],
      "additionalProperties": false
    }
  }
};

/**
 * Extract grocery items from a transcript using OpenAI
 * @param transcript - The transcript to extract items from
 * @returns An array of grocery items with their quantities
 */
export const extractGroceryItems = async (transcript: string): Promise<Array<{item: string; quantity: number}>> => {
  if (!transcript || typeof transcript !== 'string') {
    logger.error('Invalid transcript provided', { transcript });
    throw new Error('Invalid transcript provided');
  }

  try {
    // Use the generic OpenAI service to make the request
    const result = await makeChatCompletion(
      GROCERY_EXTRACTION_PROMPT,
      transcript,
      {
        model: "gpt-4o-mini",
        responseFormat: GROCERY_RESPONSE_FORMAT,
        temperature: 0,
        maxTokens: 2048
      }
    );
    
    // Parse the JSON string from OpenAI
    try {
      const parsedResult = parseJsonResponse(result);
      
      // Determine actual items array (handle different response formats)
      let items: Array<{item: string; quantity: number}>;
      
      if (Array.isArray(parsedResult)) {
        // Direct array format
        items = parsedResult;
        logger.info('Response is a direct array');
      } else if (parsedResult.items && Array.isArray(parsedResult.items)) {
        // Object with items array
        items = parsedResult.items;
        logger.info('Response is an object with items array');
      } else {
        // Try to find any array property in the response
        const arrayProps = Object.keys(parsedResult).filter(key => Array.isArray(parsedResult[key]));
        
        if (arrayProps.length > 0) {
          items = parsedResult[arrayProps[0]];
          logger.info(`Found array in property: ${arrayProps[0]}`);
        } else {
          // Last resort: if it's an object with item/quantity, wrap it in an array
          if (parsedResult.item && (parsedResult.quantity !== undefined)) {
            items = [parsedResult];
            logger.info('Response is a single item object, wrapping in array');
          } else {
            items = [];
            logger.info('Could not find any valid items array in response');
          }
        }
      }
      
      // Log each individual item for better visibility
      logger.info(`Found ${items.length} grocery items:`);
      items.forEach((item, index) => {
        logger.info(`Item ${index + 1}:`, item);
      });
      
      return items;
    } catch (e) {
      logger.error('Failed to parse OpenAI response as JSON', { result, error: e });
      throw new Error('Invalid response format from AI');
    }
  } catch (error) {
    logger.error('Error processing transcript', error);
    
    // Determine if it's an OpenAI API error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to process transcript: ${errorMessage}`);
  }
};
