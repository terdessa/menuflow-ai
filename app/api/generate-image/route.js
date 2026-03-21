import { NextResponse } from 'next/server';
import { generateImageDataUrl } from '@/lib/server/generate-menu-images';
import { loadServerEnv } from '@/lib/serverEnv';

export const runtime = 'nodejs';
loadServerEnv();

export async function POST(request) {
  try {
    const { dishName, ingredients, imageStyle = 'detailed', type = 'dish' } = await request.json();

    if (!dishName) {
      return NextResponse.json(
        { error: 'Dish name is required' },
        { status: 400 }
      );
    }

    try {
      const imageDataUrl = await generateImageDataUrl({
        dishName,
        ingredients,
        imageStyle,
        type,
      });

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
