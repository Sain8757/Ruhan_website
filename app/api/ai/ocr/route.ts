import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // 1. Fetch API Keys from Settings
    const setting = await prisma.shopSettings.findUnique({ where: { key: 'geminiApiKeys' } });
    let apiKeys: string[] = [];
    try {
      if (setting?.value) {
        apiKeys = JSON.parse(setting.value);
      }
    } catch (e) {
      console.error("Error parsing API keys from settings", e);
    }

    // 2. Fallback Simulator if no keys are provided
    if (apiKeys.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({ 
        success: true, 
        message: 'Simulator Mode: No API keys configured. Returning mock data.',
        data: {
          name: "Ramesh Kumar",
          mobile: "9876543210", 
          address: "123, Model Town, Delhi - 110009",
          aadhaarNumber: "1234 5678 9012",
          panNumber: "ABCDE1234F"
        } 
      });
    }

    // 3. Prepare Image for Gemini API
    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = file.type;

    const requestPayload = {
      contents: [{
        parts: [
          {
            text: "Extract the name, mobile number, address, aadhaar number, and PAN number from this ID card. Return ONLY a valid JSON object with keys: name, mobile, address, aadhaarNumber, panNumber. If a field is not found, leave it empty."
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        response_mime_type: "application/json"
      }
    };

    // 4. API Key Rotation Logic
    let lastError = null;

    for (let i = 0; i < apiKeys.length; i++) {
      const currentKey = apiKeys[i];
      
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload)
        });

        if (response.status === 429) {
          console.warn(`[AI Rotation] Key #${i + 1} hit quota limit (429). Switching to next key...`);
          lastError = new Error("Quota exceeded");
          continue; // Try next key
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[AI Rotation] Key #${i + 1} failed with status ${response.status}`, errorText);
          lastError = new Error(`API Error: ${response.status}`);
          continue; // Try next key (might be a bad key)
        }

        const data = await response.json();
        const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textResult) throw new Error("Empty response from AI");
        
        // Parse the JSON strictly
        const parsedData = JSON.parse(textResult);

        return NextResponse.json({
          success: true,
          message: `Processed successfully using Key #${i + 1}`,
          data: {
            name: parsedData.name || "",
            mobile: parsedData.mobile || "",
            address: parsedData.address || "",
            aadhaarNumber: parsedData.aadhaarNumber || "",
            panNumber: parsedData.panNumber || ""
          }
        });

      } catch (err: any) {
        console.error(`[AI Rotation] Exception with Key #${i + 1}:`, err);
        lastError = err;
        // Continue to next key
      }
    }

    // 5. If all keys fail
    return NextResponse.json({ 
      error: 'All configured API keys failed or exceeded quota. Please check Settings.' 
    }, { status: 500 });

  } catch (error) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
