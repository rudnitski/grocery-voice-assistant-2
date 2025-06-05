"use strict";
/**
 * Grocery Service - Enhanced with List Modification Support
 *
 * This service provides functionality for extracting grocery items from user transcripts
 * and handling various operations on grocery lists (add, remove, modify).
 *
 * Key Features:
 * 1. Extract grocery items with their quantities and actions from natural language
 * 2. Process list modifications through various action types:
 *    - add: Add new items or increase quantity of existing items
 *    - remove: Remove items from the list
 *    - modify: Change the quantity of existing items
 * 3. Support for conversational patterns where users might add items and then change
 *    their mind in the same utterance
 * 4. Multi-language support (English, Russian, etc.)
 *
 * Usage Example:
 * ```typescript
 * // 1. Extract grocery items with actions from a transcript
 * const newItems = await extractGroceryItems("We need milk and bread, actually remove milk");
 *
 * // 2. Process these actions against an existing grocery list
 * const updatedList = processGroceryActions(currentGroceryList, newItems);
 * ```
 *
 * The system will automatically handle the appropriate actions based on the natural
 * language processing of the user's intentions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractGroceryItems = exports.processGroceryActions = void 0;
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
    "type": "json_object",
    "json_schema": {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
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
                        },
                        "measurement": {
                            "oneOf": [
                                {
                                    "type": "object",
                                    "properties": {
                                        "value": {
                                            "type": "number"
                                        },
                                        "unit": {
                                            "type": "string"
                                        }
                                    },
                                    "required": ["value", "unit"]
                                },
                                { "type": "null" }
                            ]
                        }
                    },
                    "required": ["item", "quantity", "action", "measurement"]
                }
            }
        },
        "required": ["items"]
    }
};
/**
 * Process grocery items based on their action types (add, remove, modify)
 * @param currentList - The current grocery list
 * @param newItems - New items with actions to be applied
 * @returns The updated grocery list after applying all actions
 */
const processGroceryActions = (currentList, newItems) => {
    // Create a copy of the current list to avoid mutating the original
    const updatedList = [...currentList];
    // Process each new item based on its action
    newItems.forEach(newItem => {
        const action = newItem.action || 'add'; // Default to 'add' if not specified
        // Find if the item already exists in the list (case-insensitive comparison)
        const existingItemIndex = updatedList.findIndex(item => item.item.toLowerCase() === newItem.item.toLowerCase());
        switch (action) {
            case 'add':
                // If item exists, update its quantity, otherwise add it
                if (existingItemIndex >= 0) {
                    updatedList[existingItemIndex].quantity += newItem.quantity;
                    logger.info(`Updated quantity for existing item: ${newItem.item}`, {
                        oldQuantity: updatedList[existingItemIndex].quantity - newItem.quantity,
                        newQuantity: updatedList[existingItemIndex].quantity
                    });
                }
                else {
                    updatedList.push({
                        ...newItem,
                        action: 'add' // Ensure action is explicitly set
                    });
                    logger.info(`Added new item: ${newItem.item}`, { quantity: newItem.quantity });
                }
                break;
            case 'remove':
                // Remove the item if it exists
                if (existingItemIndex >= 0) {
                    updatedList.splice(existingItemIndex, 1);
                    logger.info(`Removed item: ${newItem.item}`);
                }
                else {
                    logger.info(`Attempted to remove non-existent item: ${newItem.item}`);
                }
                break;
            case 'modify':
                // Modify the quantity of an existing item
                if (existingItemIndex >= 0) {
                    logger.info(`Modified quantity for item: ${newItem.item}`, {
                        oldQuantity: updatedList[existingItemIndex].quantity,
                        newQuantity: newItem.quantity
                    });
                    updatedList[existingItemIndex].quantity = newItem.quantity;
                }
                else {
                    // If item doesn't exist, add it as a new item
                    updatedList.push({
                        ...newItem,
                        action: 'add', // Change action to 'add' since we're adding it
                        measurement: newItem.measurement || null // Ensure measurement is always present
                    });
                    logger.info(`Added new item (from modify action): ${newItem.item}`, { quantity: newItem.quantity });
                }
                break;
            default:
                logger.error(`Unknown action type: ${action}`, { item: newItem });
        }
    });
    return updatedList;
};
exports.processGroceryActions = processGroceryActions;
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
            // With the updated schema, we expect a direct array response
            let items;
            if (Array.isArray(parsedResult)) {
                // Direct array format (expected with new schema)
                items = parsedResult;
                logger.info('Response is a direct array');
            }
            else if (parsedResult.items && Array.isArray(parsedResult.items)) {
                // Object with items array (for backward compatibility)
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
                        // Default to 'add' action if not specified and null measurement if not present
                        const item = {
                            item: parsedResult.item,
                            quantity: parsedResult.quantity,
                            action: parsedResult.action || 'add',
                            measurement: parsedResult.measurement || null
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
            // Ensure all items have an action (default to 'add') and measurement (null if not present)
            items = items.map(item => ({
                ...item,
                action: item.action || 'add',
                measurement: item.measurement || null
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
