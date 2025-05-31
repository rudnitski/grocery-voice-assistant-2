"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractGroceryItems = void 0;
const openai_service_1 = require("./openai-service");
const grocery_prompts_1 = require("../prompts/grocery-prompts");
// Simple logger for tracking API requests
const logger = {
    info: (message, data) => {
        const timestamp = new Date().toISOString();
        console.log(`[INFO] ${timestamp} - ${message}`, data ? data : '');
    },
    error: (message, error) => {
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
                    "description": "A list of items with their quantities and actions.",
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
                            },
                            "action": {
                                "type": "string",
                                "enum": ["add", "remove", "modify"],
                                "description": "The action to perform on the item: add, remove, or modify."
                            }
                        },
                        "required": [
                            "item",
                            "quantity",
                            "action"
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
const extractGroceryItems = async (transcript, usualGroceries = '') => {
    if (!transcript || typeof transcript !== 'string') {
        logger.error('Invalid transcript provided', { transcript });
        throw new Error('Invalid transcript provided');
    }
    try {
        // Replace the placeholder with actual groceries
        // Create a modified prompt with usual groceries
        let promptWithGroceries = grocery_prompts_1.GROCERY_EXTRACTION_PROMPT.replace('{USUAL_GROCERIES}', usualGroceries || 'No usual groceries provided');
        logger.info('Processing transcript with usual groceries', { hasUsualGroceries: !!usualGroceries });
        // Use the generic OpenAI service to make the request
        const result = await (0, openai_service_1.makeChatCompletion)(promptWithGroceries, transcript, {
            model: "gpt-4o",
            responseFormat: GROCERY_RESPONSE_FORMAT,
            temperature: 0,
            maxTokens: 2048
        });
        // Parse the JSON string from OpenAI
        try {
            const parsedResult = (0, openai_service_1.parseJsonResponse)(result);
            // Determine actual items array (handle different response formats)
            let items;
            if (Array.isArray(parsedResult)) {
                // Direct array format
                items = parsedResult;
                logger.info('Response is a direct array');
            }
            else if (parsedResult.items && Array.isArray(parsedResult.items)) {
                // Object with items array
                items = parsedResult.items;
                logger.info('Response is an object with items array');
            }
            else {
                // Try to find any array property in the response
                const arrayProps = Object.keys(parsedResult).filter(key => Array.isArray(parsedResult[key]));
                if (arrayProps.length > 0) {
                    items = parsedResult[arrayProps[0]];
                    logger.info(`Found array in property: ${arrayProps[0]}`);
                }
                else {
                    // Last resort: if it's an object with item/quantity, wrap it in an array
                    if (parsedResult.item && (parsedResult.quantity !== undefined)) {
                        // Default to 'add' action if not specified
                        const item = {
                            item: parsedResult.item,
                            quantity: parsedResult.quantity,
                            action: parsedResult.action || 'add'
                        };
                        items = [item];
                        logger.info('Response is a single item object, wrapping in array');
                    }
                    else {
                        items = [];
                        logger.info('Could not find any valid items array in response');
                    }
                }
            }
            // Ensure all items have an action (default to 'add')
            items = items.map(item => ({
                ...item,
                action: item.action || 'add'
            }));
            // Log each item for better visibility
            logger.info(`Found ${items.length} grocery items:`);
            items.forEach((item, index) => {
                logger.info(`Item ${index + 1}:`, item);
            });
            return items;
        }
        catch (e) {
            logger.error('Failed to parse OpenAI response as JSON', { result, error: e });
            throw new Error('Invalid response format from AI');
        }
    }
    catch (error) {
        logger.error('Error processing transcript', error);
        // Determine if it's an OpenAI API error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to process transcript: ${errorMessage}`);
    }
};
exports.extractGroceryItems = extractGroceryItems;
