"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTranscriptClient = exports.transcribeAudio = exports.parseJsonResponse = exports.makeChatCompletion = exports.getOpenAIClient = exports.initializeOpenAI = void 0;
const openai_1 = __importDefault(require("openai"));
// Simple logger function for tracking API requests and responses
const logger = {
    info: (message, data) => {
        const timestamp = new Date().toISOString();
        console.log(`[INFO] ${timestamp} - ${message}`, data ? data : '');
    },
    error: (message, error) => {
        const timestamp = new Date().toISOString();
        console.error(`[ERROR] ${timestamp} - ${message}`, error);
        if (error instanceof Error) {
            console.error(`[ERROR] ${timestamp} - Stack:`, error.stack);
        }
    },
    warn: (message, data) => {
        const timestamp = new Date().toISOString();
        console.warn(`[WARN] ${timestamp} - ${message}`, data ? data : '');
    }
};
// Initialize OpenAI client
let openaiClient = null;
/**
 * Initialize the OpenAI client with the provided API key
 * @param apiKey - The OpenAI API key
 * @returns The initialized OpenAI client
 */
const initializeOpenAI = (apiKey) => {
    if (!apiKey) {
        logger.error('No API key provided', new Error('API key is undefined'));
        throw new Error('OpenAI API key is required');
    }
    try {
        openaiClient = new openai_1.default({
            apiKey: apiKey,
            timeout: 30000,
            maxRetries: 2,
        });
        logger.info('OpenAI client initialized successfully');
        return openaiClient;
    }
    catch (error) {
        logger.error('Failed to initialize OpenAI client', error);
        throw new Error('OpenAI client initialization failed');
    }
};
exports.initializeOpenAI = initializeOpenAI;
/**
 * Get the OpenAI client, initializing it if necessary
 * @returns The OpenAI client
 */
const getOpenAIClient = () => {
    if (!openaiClient) {
        const apiKey = process.env.OPENAI_API_KEY;
        return (0, exports.initializeOpenAI)(apiKey);
    }
    return openaiClient;
};
exports.getOpenAIClient = getOpenAIClient;
/**
 * Generic function to make a chat completion request to OpenAI
 * @param systemPrompt - The system prompt to use
 * @param userMessage - The user message to send
 * @param options - Additional options for the request
 * @returns The response from OpenAI
 */
const makeChatCompletion = async (systemPrompt, userMessage, options) => {
    if (!userMessage) {
        throw new Error('User message is required');
    }
    try {
        const openai = (0, exports.getOpenAIClient)();
        logger.info('Sending request to OpenAI');
        const completion = await openai.chat.completions.create({
            model: options?.model || "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            response_format: options?.responseFormat,
            temperature: options?.temperature ?? 0,
            max_completion_tokens: options?.maxTokens ?? 2048,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        });
        const result = completion.choices[0].message.content || '';
        logger.info('Received response from OpenAI', { responseId: completion.id });
        return result;
    }
    catch (error) {
        logger.error('Error making chat completion request', error);
        throw error;
    }
};
exports.makeChatCompletion = makeChatCompletion;
/**
 * Parse a JSON response from OpenAI
 * @param jsonString - The JSON string to parse
 * @returns The parsed JSON object
 */
const parseJsonResponse = (jsonString) => {
    try {
        return JSON.parse(jsonString);
    }
    catch (error) {
        logger.error('Failed to parse JSON response', error);
        throw new Error('Invalid JSON response');
    }
};
exports.parseJsonResponse = parseJsonResponse;
/**
 * Transcribe audio using OpenAI's API
 * @param audioBlob - The audio blob to transcribe
 * @returns The transcribed text
 */
const transcribeAudio = async (audioBlob) => {
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
    }
    catch (error) {
        logger.error('Error transcribing audio', error);
        throw error;
    }
};
exports.transcribeAudio = transcribeAudio;
const processTranscriptClient = async (transcript, usualGroceries) => {
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
        let originalApiItems = [];
        if (data && data.items && Array.isArray(data.items)) {
            originalApiItems = data.items;
        }
        // The VoiceRecorder component will now handle parsing this raw structure from rawResponse
        return {
            items: originalApiItems,
            rawResponse
        };
    }
    catch (error) {
        console.error('Error processing transcript:', error);
        throw error;
    }
};
exports.processTranscriptClient = processTranscriptClient;
