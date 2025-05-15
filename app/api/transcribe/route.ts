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
    const requestFormData = await request.formData();
    const audioFile = requestFormData.get('file') as File;
    const model = requestFormData.get('model') as string || 'gpt-4o-mini';
    
    if (!audioFile) {
      logger.error('No audio file provided', { requestFormData });
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    
    logger.info('Transcribing audio file', { 
      fileName: audioFile.name, 
      fileSize: audioFile.size, 
      fileType: audioFile.type,
      model: model
    });
    
    try {
      // Get the OpenAI API key from environment variables
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key is not configured');
      }
      
      // Get the audio data
      const audioBytes = await audioFile.arrayBuffer();
      
      // Create a FormData object to send directly to OpenAI API
      const formData = new FormData();
      formData.append('file', new Blob([audioBytes]), 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'json');
      
      // Make a direct fetch request to the OpenAI API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }
      
      const transcription = await response.json();
      
      logger.info('Transcription completed successfully');
      
      // Return the transcription
      return NextResponse.json({ text: transcription.text });
    } catch (openaiError: any) {
      // Log the detailed error
      logger.error('OpenAI API error', { 
        error: openaiError, 
        message: openaiError.message,
        response: openaiError.response?.data
      });
      
      // Return a detailed error response
      return NextResponse.json({ 
        error: 'Transcription failed', 
        details: openaiError.message,
        apiResponse: openaiError.response?.data || 'No additional details'
      }, { status: 500 });
    }
    
    // This section is replaced by the try/catch block above
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
