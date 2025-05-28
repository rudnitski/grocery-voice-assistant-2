import { makeChatCompletion, parseJsonResponse } from './openai-service';
import { GROCERY_EXTRACTION_PROMPT } from '../prompts/grocery-prompts';

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

// GROCERY_EXTRACTION_PROMPT is now imported from '../prompts/grocery-prompts'

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
 * @param usualGroceries - The user's usual grocery list
 * @returns An array of grocery items with their quantities
 */
export const extractGroceryItems = async (
  transcript: string, 
  usualGroceries: string = ''
): Promise<Array<{item: string; quantity: number}>> => {
  if (!transcript || typeof transcript !== 'string') {
    logger.error('Invalid transcript provided', { transcript });
    throw new Error('Invalid transcript provided');
  }

  try {
    // Replace the placeholder with actual groceries
    // Create a modified prompt with usual groceries
    let promptWithGroceries = GROCERY_EXTRACTION_PROMPT.replace(
      '{USUAL_GROCERIES}',
      usualGroceries || 'No usual groceries provided'
    );
    
    logger.info('Processing transcript with usual groceries', { hasUsualGroceries: !!usualGroceries });
    
    // Use the generic OpenAI service to make the request
    const result = await makeChatCompletion(
      promptWithGroceries,
      transcript,
      {
        model: "gpt-4o",
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
      
      // Log each item for better visibility
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
