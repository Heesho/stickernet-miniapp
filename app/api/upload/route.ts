import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PINATA_JWT = process.env.PINATA_JWT;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const pinataFormData = new FormData();
    pinataFormData.append('file', file);

    // Create standardized name: TYPE_originalname_TIMESTAMP
    // This helps identify the file type and when it was uploaded
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    const baseName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const standardizedName = `IMG_${baseName}_${timestamp}.${fileExtension}`;
    
    const metadata = JSON.stringify({
      name: standardizedName,
      keyvalues: {
        app: 'stickernet',
        type: 'board_image',
        originalName: file.name,
        timestamp: timestamp.toString()
      }
    });
    pinataFormData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    pinataFormData.append('pinataOptions', options);

    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', pinataFormData, {
      maxBodyLength: Infinity,
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
      }
    });

    return NextResponse.json({ 
      ipfsHash: res.data.IpfsHash,
      pinSize: res.data.PinSize,
      timestamp: res.data.Timestamp
    });
  } catch (error: any) {
    console.error('Upload error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.response?.data || error.message },
      { status: 500 }
    );
  }
}