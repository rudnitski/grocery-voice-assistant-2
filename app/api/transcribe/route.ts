import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/services/openai-service';

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

export async function POST(request: NextRequest) {
  logger.info('Received audio transcription request');
  
  try {
    // Get the OpenAI client
    const openai = getOpenAIClient();
    
    // Get the form data from the request
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    const model = formData.get('model') as string || 'gpt-4o-mini';
    
    if (!audioFile) {
      logger.error('No audio file provided', { formData });
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    
    logger.info('Transcribing audio file', { 
      fileName: audioFile.name, 
      fileSize: audioFile.size, 
      fileType: audioFile.type,
      model: model
    });
    
    // Create a File object that OpenAI can accept
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a temporary file path
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    const tempFilePath = path.join(os.tmpdir(), `recording-${Date.now()}.webm`);
    
    // Write the buffer to a temporary file
    fs.writeFileSync(tempFilePath, buffer);
    
    try {
      // Call the OpenAI transcription API with the file path
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-1", // OpenAI's transcription model
        // No language specified to allow automatic language detection
        response_format: "json",
      });
      
      logger.info('Transcription completed successfully');
      
      // Return the transcription
      return NextResponse.json({ text: transcription.text });
    } finally {
      // Clean up the temporary file
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
          logger.info(`Temporary file ${tempFilePath} deleted`);
        }
      } catch (cleanupError) {
        logger.error('Error cleaning up temporary file', cleanupError);
      }
    }
  } catch (error) {
    logger.error('Error transcribing audio', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = 500;
    
    return NextResponse.json({ 
      error: 'Failed to transcribe audio', 
      details: errorMessage 
    }, { status: statusCode });
  }
}
