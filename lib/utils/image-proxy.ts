/**
 * Utility to proxy Discord images through our API
 * Discord CDN URLs expire and are IP-restricted, so we need to proxy them
 */
import { getIPFSUrl } from '@/lib/pinata';

export function getProxiedImageUrl(originalUrl: string): string {
  // If no URL provided, return empty string
  if (!originalUrl) return '';
  
  // Handle IPFS URLs
  if (originalUrl.startsWith('ipfs://') || originalUrl.startsWith('Qm') || originalUrl.includes('/ipfs/')) {
    return getIPFSUrl(originalUrl);
  }
  
  // Check if it's a Discord URL that needs proxying
  const needsProxy = originalUrl.includes('discord') || 
                     originalUrl.includes('discordapp');
  
  // If it doesn't need proxy, return original URL
  if (!needsProxy) return originalUrl;
  
  // In development, Discord URLs might work directly
  if (process.env.NODE_ENV === 'development') {
    // Still proxy in development for consistency
    return `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
  }
  
  // In production, always proxy Discord URLs
  return `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Check if URL is from Discord
 */
export function isDiscordUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('discord') || url.includes('discordapp');
}