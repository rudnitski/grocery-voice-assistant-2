import { NextRequest, NextResponse } from 'next/server';
import { extractGroceryItems } from '@/lib/services/grocery-service';
import logger from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  logger.info('Received API request', { url: request.url });
  
  try {
    const requestBody = await request.json();
    logger.info('Request body received', { requestBody });
    
    const { transcript, usualGroceries } = requestBody;
    logger.debug("📝 Received transcript:", transcript);
    
    if (usualGroceries) {
      logger.debug("🛒 Received usual groceries list", { length: usualGroceries.length });
    }
    
    if (!transcript || typeof transcript !== 'string') {
      logger.info('Invalid transcript provided');
      return NextResponse.json({ error: 'Invalid transcript provided' }, { status: 400 });
    }

    // Use the extractGroceryItems function from our service with usual groceries
    const items = await extractGroceryItems(transcript, usualGroceries);
    
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
