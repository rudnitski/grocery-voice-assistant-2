/**
 * Utility functions for file handling, especially for API requests
 */

import { Readable } from 'stream';

/**
 * Creates a file-like object from a buffer that's compatible with OpenAI's API
 * This is necessary because the standard File API isn't available in Node.js
 * 
 * @param buffer - The buffer containing the file data
 * @param filename - The name of the file
 * @param contentType - The MIME type of the file
 * @returns A file-like object compatible with OpenAI's API
 */
export function fileFromBuffer(buffer: Buffer, filename: string, contentType: string) {
  // Create a readable stream from the buffer
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null); // Signal the end of the stream
  
  // Add properties to make it compatible with OpenAI's expected file format
  return {
    name: filename,
    data: buffer,
    stream: () => stream,
    type: contentType,
    size: buffer.length,
  };
}
