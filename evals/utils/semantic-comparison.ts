/**
 * Semantic Comparison Service for Grocery Items
 * 
 * This service uses the OpenAI API to compare grocery items semantically,
 * determining if two differently named items refer to the same product.
 */

import OpenAI from 'openai';
import { getOpenAIClient } from '../../lib/services/openai-service';

/**
 * Prompt template for semantic comparison of grocery items
 * Placeholders:
 * - {EXTRACTED_ITEM}: The item extracted by the LLM
 * - {EXPECTED_ITEM}: The expected item from the test case
 * - {USUAL_GROCERIES}: The user's usual groceries list (optional)
 */
export const SEMANTIC_COMPARISON_PROMPT = `You are a semantic comparison expert focusing on grocery items. Your task is to determine if two grocery item descriptions refer to the same product, even if they are phrased differently.

EXTRACTED ITEM: {EXTRACTED_ITEM}
EXPECTED ITEM: {EXPECTED_ITEM}

USUAL GROCERIES LIST (for context):
{USUAL_GROCERIES}

Consider things like:
- Different wording for the same item (e.g., "tomato sauce" vs "pasta sauce")
- Different qualifiers that don't change the core item (e.g., "organic milk" vs "milk")
- Order of words (e.g., "red apples" vs "apples red")
- Spelling variations or typos
- Cultural or regional naming differences

If qualifiers significantly change the item (e.g., "almond milk" vs "regular milk"), then they should NOT be considered the same item.

Respond with a JSON object that has these properties:
- isMatch: boolean indicating whether the items refer to the same product
- confidence: number between 0 and 1 indicating your confidence
- reasoning: brief explanation of your decision

Example response format:
{
  "isMatch": true,
  "confidence": 0.95,
  "reasoning": "Both terms refer to the same product (tomatoes) despite different qualifiers."
}`;

/**
 * Result of a semantic comparison between two grocery items
 */
export interface SemanticComparisonResult {
  /** Whether the items are considered the same product semantically */
  isMatch: boolean;
  
  /** Confidence score between 0 and 1 */
  confidence: number;
  
  /** Explanation of why the items match or don't match */
  reasoning: string;
}

/**
 * Cache entry for semantic comparisons to avoid redundant API calls
 */
interface CacheEntry {
  /** Key used for the cache (combination of extracted and expected items) */
  key: string;
  
  /** Result of the semantic comparison */
  result: SemanticComparisonResult;
  
  /** Timestamp when the entry was created */
  timestamp: number;
}

/**
 * Cache statistics for monitoring and debugging
 */
export interface CacheStats {
  /** Total number of entries in the cache */
  size: number;
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Number of cache entries that were expired and removed */
  expirations: number;
}

/**
 * Simple in-memory cache for semantic comparison results
 */
const comparisonCache: Map<string, CacheEntry> = new Map();

/**
 * Cache timeout in milliseconds (24 hours by default)
 */
let CACHE_TIMEOUT_MS = 24 * 60 * 60 * 1000;

/**
 * Cache statistics
 */
const cacheStats: CacheStats = {
  size: 0,
  hits: 0,
  misses: 0,
  expirations: 0
};

/**
 * Set the cache timeout in milliseconds
 * @param timeoutMs Timeout in milliseconds
 */
export function setCacheTimeout(timeoutMs: number): void {
  if (timeoutMs < 0) {
    throw new Error('Cache timeout must be non-negative');
  }
  CACHE_TIMEOUT_MS = timeoutMs;
}

/**
 * Get the current cache timeout in milliseconds
 * @returns The current cache timeout
 */
export function getCacheTimeout(): number {
  return CACHE_TIMEOUT_MS;
}

/**
 * Clear the entire cache
 */
export function clearCache(): void {
  comparisonCache.clear();
  cacheStats.size = 0;
  console.log('[Semantic Comparison] Cache cleared');
}

/**
 * Get current cache statistics
 * @returns Current cache statistics
 */
export function getCacheStats(): CacheStats {
  // Update size to reflect the current state
  cacheStats.size = comparisonCache.size;
  return { ...cacheStats };
}

/**
 * Check if a valid cache entry exists for the given key
 * @param key The cache key to check
 * @returns The cached result or null if not found or expired
 */
function checkCache(key: string): SemanticComparisonResult | null {
  const entry = comparisonCache.get(key);
  
  if (!entry) {
    cacheStats.misses++;
    return null;
  }
  
  // Check if the entry has expired
  const now = Date.now();
  if (now - entry.timestamp > CACHE_TIMEOUT_MS) {
    comparisonCache.delete(key);
    cacheStats.expirations++;
    cacheStats.misses++;
    return null;
  }
  
  // Valid cache hit
  cacheStats.hits++;
  return entry.result;
}

/**
 * Add a result to the cache
 * @param key The cache key
 * @param result The result to cache
 */
function addToCache(key: string, result: SemanticComparisonResult): void {
  // Check if this is a new entry or updating an existing one
  const isNewEntry = !comparisonCache.has(key);
  
  comparisonCache.set(key, {
    key,
    result,
    timestamp: Date.now()
  });
  
  // Update size statistic
  if (isNewEntry) {
    cacheStats.size = comparisonCache.size;
  }
  
  // Log cache operation for debugging
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Semantic Comparison] Cache ${isNewEntry ? 'add' : 'update'}: ${key}`);
  }
}

/**
 * Sanitize a grocery item name by removing extra whitespace, punctuation, etc.
 * @param itemName The raw grocery item name
 * @returns A sanitized version of the name
 */
export function sanitizeItemName(itemName: string): string {
  if (!itemName) return '';
  
  // Convert to lowercase
  let sanitized = itemName.toLowerCase();
  
  // Remove extra whitespace
  sanitized = sanitized.trim().replace(/\s+/g, ' ');
  
  // Remove common punctuation that doesn't affect meaning
  sanitized = sanitized.replace(/[.,;:!?'"-]+/g, '');
  
  // Remove common filler words that don't affect the item identity
  const fillerWords = ['a', 'an', 'the', 'some', 'few', 'little'];
  fillerWords.forEach(word => {
    // Replace the word only if it's a whole word (surrounded by spaces or at start/end)
    sanitized = sanitized.replace(new RegExp(`(^|\\s)${word}(\\s|$)`, 'g'), ' ');
  });
  
  // Trim again and return
  return sanitized.trim();
}

/**
 * Normalize a grocery item name while preserving essential qualifiers
 * This is different from sanitization as it maintains important distinctions
 * @param itemName The grocery item name to normalize
 * @returns A normalized version of the name
 */
export function normalizeItemName(itemName: string): string {
  if (!itemName) return '';
  
  // First apply basic sanitization
  let normalized = sanitizeItemName(itemName);
  
  // Standardize some common variations
  // Example: Convert plural forms to singular for common items
  const pluralMappings: Record<string, string> = {
    'apples': 'apple',
    'oranges': 'orange',
    'bananas': 'banana',
    'tomatoes': 'tomato',
    // Add more as needed
  };
  
  // Only apply exact word matches to avoid changing words like "pineapples"
  Object.entries(pluralMappings).forEach(([plural, singular]) => {
    // Replace only if it's the exact word
    if (normalized === plural) {
      normalized = singular;
    }
    // Or if it has qualifiers (e.g., "red apples" -> "red apple")
    normalized = normalized.replace(new RegExp(`(\\s)${plural}$`), `$1${singular}`);
  });
  
  return normalized;
}

/**
 * Generate a cache key for a comparison between two items
 * @param extractedItem The extracted item from the LLM
 * @param expectedItem The expected item from the test case
 * @returns A unique key for the cache
 */
function generateCacheKey(extractedItem: string, expectedItem: string): string {
  // Sanitize the items (don't normalize, as we want to preserve qualifiers for cache keys)
  const sanitizedExtracted = sanitizeItemName(extractedItem);
  const sanitizedExpected = sanitizeItemName(expectedItem);
  
  // Create a consistent key regardless of order
  const items = [sanitizedExtracted, sanitizedExpected].sort();
  return items.join('::');
}

/**
 * Maximum number of retry attempts for API calls
 */
const MAX_RETRIES = 3;

/**
 * Base delay for exponential backoff in milliseconds
 */
const BASE_DELAY_MS = 1000;

/**
 * Default confidence threshold for considering items a match
 * A value between 0 and 1, where 1 means 100% confidence required
 */
let CONFIDENCE_THRESHOLD = 0.8;

/**
 * Set the confidence threshold for determining valid matches
 * @param threshold Threshold value between 0 and 1
 */
export function setConfidenceThreshold(threshold: number): void {
  if (threshold < 0 || threshold > 1) {
    throw new Error('Confidence threshold must be between 0 and 1');
  }
  CONFIDENCE_THRESHOLD = threshold;
}

/**
 * Get the current confidence threshold
 * @returns The current confidence threshold
 */
export function getConfidenceThreshold(): number {
  return CONFIDENCE_THRESHOLD;
}

/**
 * Check if a semantic comparison result meets the confidence threshold
 * @param result The semantic comparison result to check
 * @returns True if the result is a match and meets the confidence threshold
 */
export function meetsConfidenceThreshold(result: SemanticComparisonResult): boolean {
  return result.isMatch && result.confidence >= CONFIDENCE_THRESHOLD;
}

/**
 * Compare two grocery items semantically using the OpenAI API
 * 
 * @param extractedItem The item extracted by the LLM
 * @param expectedItem The expected item from the test case
 * @param usualGroceries Optional list of usual groceries for context
 * @returns A promise resolving to a semantic comparison result
 */
export async function compareItemsSemantically(
  extractedItem: string,
  expectedItem: string,
  usualGroceries: string = ''
): Promise<SemanticComparisonResult> {
  // Sanitize inputs to ensure consistent comparison and caching
  const sanitizedExtracted = sanitizeItemName(extractedItem);
  const sanitizedExpected = sanitizeItemName(expectedItem);
  
  // Check the cache first
  const cacheKey = generateCacheKey(extractedItem, expectedItem);
  const cachedResult = checkCache(cacheKey);
  
  if (cachedResult) {
    console.log(`[Semantic Comparison] Cache hit for "${sanitizedExtracted}" vs "${sanitizedExpected}"`);
    return cachedResult;
  }
  
  console.log(`[Semantic Comparison] Comparing "${sanitizedExtracted}" vs "${sanitizedExpected}"`);
  
  // Try an exact match after sanitization (not normalization) to avoid unnecessary API calls
  // This is in line with preserving item distinctions like "red apples" vs "green apples"
  if (sanitizedExtracted === sanitizedExpected) {
    const exactMatchResult: SemanticComparisonResult = {
      isMatch: true,
      confidence: 1.0,
      reasoning: 'Exact match after sanitization'
    };
    
    // Cache the result
    addToCache(cacheKey, exactMatchResult);
    return exactMatchResult;
  }
  
  // If we have qualifiers that are important for distinction (per memory about grocery-list-modification)
  // we should check if these might be different items with similar names
  const extractedWords = sanitizedExtracted.split(' ');
  const expectedWords = sanitizedExpected.split(' ');
  
  // If one is a subset of the other but they're not identical (e.g., "apples" vs "red apples")
  // we should use semantic comparison to determine if they're the same in this context
  
  // Prepare the prompt with the original items (not sanitized) to maintain all context
  // and the usual groceries list
  const prompt = SEMANTIC_COMPARISON_PROMPT
    .replace('{EXTRACTED_ITEM}', extractedItem)
    .replace('{EXPECTED_ITEM}', expectedItem)
    .replace('{USUAL_GROCERIES}', usualGroceries || 'No usual groceries provided');
  
  // Try to get a response with retry logic
  let result: SemanticComparisonResult | null = null;
  let attempt = 0;
  
  while (attempt < MAX_RETRIES && !result) {
    try {
      // Get the OpenAI client
      const openai = getOpenAIClient();
      
      // Make the API call
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,  // Low temperature for more consistent results
        max_tokens: 300    // Limit response size
      });
      
      // Extract and parse the response
      const content = response.choices[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]) as SemanticComparisonResult;
          
          // Validate the result has the expected structure
          if (typeof result.isMatch !== 'boolean' || 
              typeof result.confidence !== 'number' || 
              typeof result.reasoning !== 'string') {
            throw new Error('Invalid response format');
          }
          
          // Ensure confidence is between 0 and 1
          if (result.confidence < 0 || result.confidence > 1) {
            result.confidence = Math.max(0, Math.min(1, result.confidence));
          }
          
          // Cache the result
          addToCache(cacheKey, result);
          
        } catch (e) {
          const parseError = e as Error;
          console.error('[Semantic Comparison] Failed to parse response:', parseError);
          throw new Error(`Failed to parse response: ${parseError.message}`);
        }
      } else {
        throw new Error('No JSON object found in the response');
      }
      
    } catch (e) {
      const error = e as Error;
      attempt++;
      
      if (attempt >= MAX_RETRIES) {
        console.error(`[Semantic Comparison] Failed after ${MAX_RETRIES} attempts:`, error);
        throw new Error(`Semantic comparison failed: ${error.message}`);
      }
      
      // Exponential backoff
      const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(`[Semantic Comparison] Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // This shouldn't happen due to the error handling above, but just in case
  if (!result) {
    throw new Error('Failed to get a valid comparison result');
  }
  
  // Before returning, log whether this meets the confidence threshold
  // This information can be used by consumers of this API to make decisions
  const meets = meetsConfidenceThreshold(result);
  console.log(`[Semantic Comparison] Result: ${result.isMatch ? 'MATCH' : 'NO MATCH'} with confidence ${result.confidence.toFixed(2)} (threshold: ${CONFIDENCE_THRESHOLD})`);
  console.log(`[Semantic Comparison] Meets threshold: ${meets}, Reasoning: ${result.reasoning}`);
  
  return result;
}
