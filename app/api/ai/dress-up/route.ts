import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '@/lib/db';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'jjxqmy0y',
  api_key: process.env.CLOUDINARY_API_KEY || '886873781174789',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'QlSdL3UnqOvs5qeBgZ2bEfILD9I',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, prompt, presetId } = body;

    if (!image || !prompt) {
      return NextResponse.json({ error: 'Image and prompt are required' }, { status: 400 });
    }

    // 1. Sanitize prompt for Cloudinary AI Generative Replace format
    const cleanedPrompt = prompt
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');

    console.log(`[AI Dress-Up] Processing prompt: "${cleanedPrompt}"`);

    // 2. Upload base64 image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(image, {
      folder: 'photo_studio_dress_up',
      resource_type: 'image',
    });

    const publicId = uploadResult.public_id;
    console.log(`[AI Dress-Up] Uploaded image public_id: ${publicId}`);

    // 3. Generate AI Generative Replace Transformation URL
    // Format: e_gen_replace:from_clothes;to_formal_suit
    const targetAttire = cleanedPrompt || 'formal black blazer with white shirt';
    const transformedUrl = cloudinary.url(publicId, {
      effect: `gen_replace:from_clothes;to_${targetAttire}`,
      secure: true,
    });

    console.log(`[AI Dress-Up] Fetching transformed AI URL: ${transformedUrl}`);

    // 4. Fetch transformed image & convert to base64 data URL
    const response = await fetch(transformedUrl);

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const base64Transformed = Buffer.from(buffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const resultDataUrl = `data:${contentType};base64,${base64Transformed}`;

      return NextResponse.json({
        success: true,
        image: resultDataUrl,
        message: '✨ AI Generative Suit Transformation Complete!',
      });
    } else {
      console.warn(`[AI Dress-Up] Cloudinary returned status ${response.status}. Retrying alternate target...`);
      // Retry with simplified attire target
      const altUrl = cloudinary.url(publicId, {
        effect: `gen_replace:from_clothing;to_formal black blazer`,
        secure: true,
      });

      const altRes = await fetch(altUrl);
      if (altRes.ok) {
        const buffer = await altRes.arrayBuffer();
        const base64Transformed = Buffer.from(buffer).toString('base64');
        const contentType = altRes.headers.get('content-type') || 'image/jpeg';
        const resultDataUrl = `data:${contentType};base64,${base64Transformed}`;

        return NextResponse.json({
          success: true,
          image: resultDataUrl,
          message: '✨ AI Generative Suit Applied!',
        });
      }
    }

    // Fallback if AI transform failed
    return NextResponse.json({
      success: false,
      message: 'AI Transformation unavailable for this photo. Using precision suit fitting.',
      presetId: presetId || 'female_black_blazer',
    });

  } catch (error: any) {
    console.error('Dress-up AI Error:', error);
    return NextResponse.json({
      error: 'Failed to process AI dress-up request',
      details: error?.message || 'Unknown error',
    }, { status: 500 });
  }
}
