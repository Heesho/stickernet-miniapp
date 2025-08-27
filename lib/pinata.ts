import axios from 'axios';

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

export async function uploadToPinata(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        app: 'stickernet',
        timestamp: Date.now().toString()
      }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: Infinity,
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      }
    });

    return res.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw new Error('Failed to upload file to IPFS');
  }
}

export async function uploadJSONToPinata(json: object, name: string): Promise<string> {
  try {
    const response = await fetch('/api/upload-json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ json, name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const data = await response.json();
    return data.ipfsHash;
  } catch (error) {
    console.error('Error uploading JSON to Pinata:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
}

export function getIPFSUrl(hash: string): string {
  if (!hash) return '';
  if (hash.startsWith('http')) return hash;
  if (hash.startsWith('ipfs://')) {
    return `${PINATA_GATEWAY}/ipfs/${hash.replace('ipfs://', '')}`;
  }
  return `${PINATA_GATEWAY}/ipfs/${hash}`;
}

export function extractIPFSHash(url: string): string {
  if (!url) return '';
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', '');
  }
  const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
  return match ? match[1] : url;
}

// Create board metadata following NFT standard
export interface BoardMetadata {
  name: string;
  symbol: string;
  description?: string;
  image: string; // IPFS URL of the image
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export async function uploadBoardMetadata(metadata: BoardMetadata): Promise<string> {
  try {
    // Create a unique, standardized name: SYMBOL_metadata_TIMESTAMP
    // This ensures uniqueness and makes it easy to identify in Pinata dashboard
    const timestamp = Date.now();
    const metadataName = `${metadata.symbol.toUpperCase()}_metadata_${timestamp}`;
    return await uploadJSONToPinata(metadata, metadataName);
  } catch (error) {
    console.error('Error uploading board metadata:', error);
    throw new Error('Failed to upload board metadata to IPFS');
  }
}