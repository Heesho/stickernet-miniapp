import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const PINATA_JWT = process.env.PINATA_JWT;

export async function POST(request: NextRequest) {
  // Check if PINATA_JWT is configured
  if (!PINATA_JWT) {
    console.error('PINATA_JWT environment variable is not set');
    return NextResponse.json(
      { error: 'Server configuration error - Pinata not configured' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('No file provided in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Log file details for debugging
    console.log('File upload attempt:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Check if file is actually a file
    if (!(file instanceof File)) {
      console.error('Invalid file object:', file);
      return NextResponse.json({ error: 'Invalid file format' }, { status: 400 });
    }

    // Handle HEIC files from iOS
    const isHEIC = file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic';
    if (isHEIC) {
      console.log('HEIC file detected from iOS');
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
        // Don't set Content-Type, let axios handle it for FormData
      },
      timeout: 60000, // 60 second timeout for large files
    });

    return NextResponse.json({ 
      ipfsHash: res.data.IpfsHash,
      pinSize: res.data.PinSize,
      timestamp: res.data.Timestamp
    });
  } catch (error: any) {
    console.error('Upload error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload file';
    if (error.response?.status === 413) {
      errorMessage = 'File is too large';
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication failed with Pinata';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Upload timeout - file may be too large or connection is slow';
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    );
  }
}