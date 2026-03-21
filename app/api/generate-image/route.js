import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { dishName, ingredients, imageStyle = 'detailed', type = 'dish' } = await request.json();

    if (!dishName) {
      return NextResponse.json(
        { error: 'Dish name is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NANOBANANA_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'NANOBANANA_API_KEY or GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const model = process.env.NANOBANANA_MODEL || 'gemini-2.5-flash-image';

    // Create a prompt for image generation
    // Note: Gemini can generate images, but for now we'll use a placeholder approach
    // In production, you might use a dedicated image generation API like DALL-E, Midjourney, or Stable Diffusion

    const styleDescriptions = {
      minimalistic: 'flat icon, simple, clean',
      simple: 'casual restaurant photo, ambient indoor light, natural colors, unretouched',
      detailed: 'candid restaurant snapshot, ambient indoor light, natural colors, unretouched, slight imperfections'
    };

    const styleDesc = styleDescriptions[imageStyle] || styleDescriptions.simple;

    // Short “accuracy hint”
    const ingredientsText = ingredients ? `; key ingredients: ${ingredients}` : '';

    // Shared scene: same table + composition + landscape intent
    const sharedScene =
      'same rustic wooden restaurant table with consistent wood grain; centered composition; wide landscape framing; fully visible main subject; no cropping; shallow depth of field';

    // Shared constraints
    const sharedConstraints =
      'no people, no hands; no text, no watermark; not studio-lit; not advertisement; not perfect styling; avoid hyperreal, HDR';

    // Subject-specific blocks
    const subjectBlock =
      type === 'drink'
        ? 'single drink only; one glass or cup centered; fully visible glass; no food; no extra glasses; minimal props'
        : 'single dish only; one plate or bowl centered; fully visible plate; no other food; no drinks; no extra plates; minimal props';

    const imagePrompt =
      `${dishName}${ingredientsText}; ${styleDesc}; ${sharedScene}; ${subjectBlock}; ${sharedConstraints}`;

    // Generate image using Google GenAI (single retry on failure)
    try {
      console.log(`Generating image for: ${dishName} with prompt: ${imagePrompt}`);

      const ai = new GoogleGenAI({ apiKey });
      const maxAttempts = 2;
      const baseDelayMs = 600;
      const jitterMs = 600;

      const generateOnce = async () => {
        const response = await ai.models.generateContent({
          model,
          contents: imagePrompt,
          config: {
            // optional, but common if you only want an image back
            responseModalities: ["Image"],
            imageConfig: {
              aspectRatio: "16:9", // landscape
              // imageSize: "2K" // only for gemini-3-pro-image-preview
            }
          }
        });

        let imageBuffer = null;
        let mimeType = 'image/png';
        if (response.candidates && response.candidates[0] && response.candidates[0].content) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              console.log('🖼️  Found image data (format:', part.inlineData.mimeType || 'unknown', ')');
              const imageData = part.inlineData.data;
              mimeType = part.inlineData.mimeType || mimeType;
              imageBuffer = Buffer.from(imageData, 'base64');
              console.log('✅ Image decoded from base64, size:', imageBuffer.length, 'bytes');
              break;
            }
          }
        }

        if (!imageBuffer) {
          throw new Error('No image data in API response');
        }

        return { imageBuffer, mimeType };
      };

      let imageBuffer = null;
      let mimeType = 'image/png';
      let lastError = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const generated = await generateOnce();
          imageBuffer = generated.imageBuffer;
          mimeType = generated.mimeType;
          break;
        } catch (err) {
          lastError = err;
          console.error(`Attempt ${attempt} failed:`, err.message);
          if (attempt < maxAttempts) {
            const delay = baseDelayMs + Math.floor(Math.random() * jitterMs);
            await new Promise((res) => setTimeout(res, delay));
          }
        }
      }

      if (!imageBuffer) {
        throw lastError || new Error('Image generation failed');
      }

      const imageDataUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

      return NextResponse.json({
        imageUrl: imageDataUrl,
        generated: true,
      });
    } catch (fetchError) {
      console.error('Error generating image with Google GenAI:', fetchError);

      return NextResponse.json(
        { error: 'Failed to generate image', details: fetchError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image', details: error.message },
      { status: 500 }
    );
  }
}
