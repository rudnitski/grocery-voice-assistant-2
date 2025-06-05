import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/services/openai-service';
import logger from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  logger.info('Received audio transcription request');
  
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    
    if (!audioFile) {
      logger.error('No audio file provided', null);
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    
    logger.info('Processing audio file', { 
      fileName: audioFile.name, 
      fileSize: audioFile.size, 
      fileType: audioFile.type
    });

    try {
      // Get OpenAI client
      const openai = getOpenAIClient();
      
      // Get the audio data as an ArrayBuffer
      const arrayBuffer = await audioFile.arrayBuffer();
      
      // Create a form for the OpenAI API
      const form = new FormData();
      
      // Create a new File object from the ArrayBuffer
      // This works in both environments
      const file = new File(
        [arrayBuffer], 
        audioFile.name, 
        { type: audioFile.type }
      );
      
      // Add the file to the FormData
      form.append('file', file);
      form.append('model', 'whisper-1');
      form.append('response_format', 'json');
      
      logger.info('Sending transcription request to OpenAI');
      
      // Create a fetch request to OpenAI directly
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: form,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('OpenAI API error', { status: response.status, error: errorText });
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      
      const transcription = await response.json();
      logger.info('Transcription successful');
      
      return NextResponse.json({ text: transcription.text });
      
    } catch (apiError: any) {
      // Log the complete error object
      logger.error('OpenAI API error', apiError);
      
      // Extract useful error information
      let errorMessage = 'Unknown error';
      let errorDetails = {};
      
      if (apiError instanceof Error) {
        errorMessage = apiError.message;
        errorDetails = {
          name: apiError.name,
          stack: apiError.stack,
        };
        
        // Try to extract more details from OpenAI error response
        if ('response' in apiError && apiError.response) {
          const response = apiError.response as Record<string, any>;
          if (response && typeof response === 'object' && 'data' in response) {
            errorDetails = { ...errorDetails, response: response.data };
          }
        }
      }
      
      return NextResponse.json({
        error: 'Failed to transcribe audio',
        message: errorMessage,
        details: errorDetails
      }, { status: 500 });
    }
    
  } catch (error) {
    logger.error('Request processing error', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      error: 'Failed to process request', 
      details: errorMessage 
    }, { status: 500 });
  }
}
