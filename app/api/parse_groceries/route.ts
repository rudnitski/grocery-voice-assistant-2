import { NextRequest, NextResponse } from 'next/server';
import { extractGroceryItems } from '@/lib/services/grocery-service';

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
  logger.info('Received API request', { url: request.url });
  
  try {
    const requestBody = await request.json();
    logger.info('Request body received', { requestBody });
    
    const { transcript } = requestBody;
    console.log("📝 Received transcript:", transcript);
    
    if (!transcript || typeof transcript !== 'string') {
      logger.info('Invalid transcript provided');
      return NextResponse.json({ error: 'Invalid transcript provided' }, { status: 400 });
    }

    // Use the extractGroceryItems function from our service
    const items = await extractGroceryItems(transcript);
    
    // Log the results
    logger.info(`Found ${items.length} grocery items`);
    
    // Return the response
    return NextResponse.json({ items });
  } catch (error) {
    logger.error('Error processing transcript', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = 500;
    
    return NextResponse.json({ 
      error: 'Failed to process transcript', 
      details: errorMessage 
    }, { status: statusCode });
  }
}
