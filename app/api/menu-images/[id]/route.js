import { NextResponse } from 'next/server';
import { getMenuImage } from '@/lib/server/menu-store';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const image = await getMenuImage(id);

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return new NextResponse(image.buffer, {
      headers: {
        'Content-Type': image.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to load image' },
      { status: 500 }
    );
  }
}
