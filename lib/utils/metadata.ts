import { getIPFSUrl } from '@/lib/pinata';
import type { BoardMetadata } from '@/lib/pinata';

/**
 * Fetches metadata from an IPFS URL or returns a default structure for direct image URLs
 */
export async function fetchBoardMetadata(uri: string, retries = 2): Promise<BoardMetadata | null> {
  if (!uri) return null;

  try {
    // Convert IPFS URI to gateway URL if needed
    const url = getIPFSUrl(uri);
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Check if this is likely a JSON metadata URL by trying to fetch it
    const response = await fetch(url, { 
      signal: controller.signal,
      mode: 'cors',
      cache: 'force-cache'
    });
    clearTimeout(timeoutId);
    
    const contentType = response.headers.get('content-type');
    
    // If it's JSON, parse and return it
    if (contentType?.includes('application/json')) {
      const metadata = await response.json();
      return metadata as BoardMetadata;
    }
    
    // If it's an image, return a basic metadata structure
    if (contentType?.includes('image/')) {
      return {
        name: '',
        symbol: '',
        image: url,
        description: undefined
      };
    }
    
    // Try parsing as JSON anyway (some IPFS gateways don't set content-type correctly)
    try {
      const text = await response.text();
      const metadata = JSON.parse(text);
      return metadata as BoardMetadata;
    } catch {
      // If all else fails, assume it's an image URL
      return {
        name: '',
        symbol: '',
        image: url,
        description: undefined
      };
    }
  } catch (error) {
    // Retry logic for transient failures
    if (retries > 0 && error instanceof Error && error.name !== 'AbortError') {
      console.warn(`Retrying metadata fetch for: ${uri}, attempts left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return fetchBoardMetadata(uri, retries - 1);
    }
    
    // Log more specific error information
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('Metadata fetch timeout for:', uri);
      } else {
        console.warn('Error fetching metadata for:', uri, error.message);
      }
    } else {
      console.warn('Unknown error fetching metadata for:', uri);
    }
    
    // Return the URL as an image in case of error
    return {
      name: '',
      symbol: '',
      image: getIPFSUrl(uri),
      description: undefined
    };
  }
}

/**
 * Extracts the image URL from metadata or returns the URL directly
 */
export async function getImageFromMetadata(uri: string): Promise<string> {
  if (!uri) return '';
  
  const metadata = await fetchBoardMetadata(uri);
  return metadata?.image || uri;
}