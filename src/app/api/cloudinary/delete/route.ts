import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const { publicId, resourceType = 'image' } = await req.json();

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 });
    }

    console.log(`Attempting to delete Cloudinary asset: ${publicId} (${resourceType})`);

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });

    if (result.result === 'ok' || result.result === 'not_found') {
      return NextResponse.json({ success: true, result });
    } else {
      console.error('Cloudinary deletion failed:', result);
      return NextResponse.json({ error: 'Cloudinary deletion failed', result }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in Cloudinary delete API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
