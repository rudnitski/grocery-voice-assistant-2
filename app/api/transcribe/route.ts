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
    
    // Get the audio data as a Buffer
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // For OpenAI API in Node.js environment, we need to use a different approach
    // Create a proper file object for the OpenAI API
    const apiFormData = new FormData();
    
    // Create a proper File object that OpenAI API expects
    const file = new File([buffer], 'audio.webm', { type: audioFile.type });
    apiFormData.append('file', file);
    apiFormData.append('model', 'whisper-1');
    apiFormData.append('response_format', 'json');
    
    // Make a direct fetch request to the OpenAI API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: apiFormData,
    });
    
    if (!response.ok) {
      let errorDetails = 'Unknown error';
      try {
        // Try to parse the error as JSON first
        const errorJson = await response.json();
        errorDetails = JSON.stringify(errorJson);
        logger.error('OpenAI API error', { status: response.status, error: errorJson });
      } catch (e) {
        // If not JSON, get as text
        const errorText = await response.text();
        errorDetails = errorText;
        logger.error('OpenAI API error', { status: response.status, error: errorText });
      }
      
      // Return a more detailed error response to the client
      return NextResponse.json({ 
        error: 'Transcription failed', 
        details: `OpenAI API error: ${response.status}`, 
        apiResponse: errorDetails 
      }, { status: 500 });
    }
    
    const transcription = await response.json();
    logger.info('Transcription completed successfully');
    
    // Return the transcription
    return NextResponse.json({ text: transcription.text });
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
