import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PINATA_JWT = process.env.PINATA_JWT;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { json, name } = body;

    if (!json || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const data = {
      pinataContent: json,
      pinataMetadata: {
        name,
        keyvalues: {
          app: 'stickernet',
          timestamp: Date.now().toString()
        }
      }
    };

    const res = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });

    return NextResponse.json({ ipfsHash: res.data.IpfsHash });
  } catch (error: any) {
    console.error('Error uploading JSON to Pinata:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload JSON to IPFS' },
      { status: 500 }
    );
  }
}