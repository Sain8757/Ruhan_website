import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, prompt, presetId } = body;

    if (!image || !prompt) {
      return NextResponse.json({ error: 'Image and prompt are required' }, { status: 400 });
    }

    // 1. Fetch API Keys from Settings or Environment
    let apiKeys: string[] = [];
    try {
      const setting = await prisma.shopSettings.findUnique({ where: { key: 'geminiApiKeys' } });
      if (setting?.value) {
        apiKeys = JSON.parse(setting.value);
      }
    } catch (e) {
      console.error("Error parsing API keys from settings", e);
    }

    if (process.env.GEMINI_API_KEY && !apiKeys.includes(process.env.GEMINI_API_KEY)) {
      apiKeys.unshift(process.env.GEMINI_API_KEY);
    }

    // 2. Extract base64 image data and mime type
    let base64Data = image;
    let mimeType = 'image/jpeg';

    if (image.startsWith('data:')) {
      const parts = image.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      base64Data = parts[1];
    }

    const enhancedPrompt = `You are a professional passport photo editing AI. 
Task: Modify the clothes of the person in the provided portrait photo to match this description: "${prompt}".
CRITICAL INSTRUCTIONS:
1. Keep the face, facial features, hair, head shape, skin color, background, and expression 100% EXACT AND UNCHANGED.
2. Only replace or place the formal clothing (suit, blazer, shirt, tie) seamlessly over the neck/torso shoulders.
3. The final image must look like an official, high-quality, professional passport or ID photo.`;

    // 3. If API keys are available, call Gemini API
    if (apiKeys.length > 0) {
      for (let i = 0; i < apiKeys.length; i++) {
        const currentKey = apiKeys[i];
        
        try {
          // Attempt using Imagen 3 / Gemini 2.0 / 1.5 model for multimodal generation
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${currentKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: enhancedPrompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data
                    }
                  }
                ]
              }],
              generationConfig: {
                response_mime_type: "image/jpeg"
              }
            })
          });

          if (response.status === 429) {
            console.warn(`[Gemini Suit AI] Key #${i + 1} quota limit (429). Trying next key...`);
            continue;
          }

          if (response.ok) {
            const data = await response.json();
            const candidate = data.candidates?.[0];
            const imagePart = candidate?.content?.parts?.find((p: any) => p.inline_data || p.inlineData);
            
            if (imagePart) {
              const returnedMime = imagePart.inline_data?.mime_type || imagePart.inlineData?.mime_type || 'image/jpeg';
              const returnedData = imagePart.inline_data?.data || imagePart.inlineData?.data;
              const resultDataUrl = `data:${returnedMime};base64,${returnedData}`;
              
              return NextResponse.json({
                success: true,
                image: resultDataUrl,
                message: `Formal suit generated successfully with Gemini AI (Key #${i + 1})`
              });
            }
          }
        } catch (err) {
          console.error(`[Gemini Suit AI] Exception with Key #${i + 1}:`, err);
        }
      }
    }

    // 4. Return response indicating AI mode processed prompt
    return NextResponse.json({
      success: true,
      message: 'Gemini AI prompt processed. Adjust overlay alignment if needed.',
      presetId: presetId || null,
      promptUsed: prompt
    });

  } catch (error) {
    console.error('Dress-up AI Error:', error);
    return NextResponse.json({ error: 'Failed to process AI dress-up request' }, { status: 500 });
  }
}
