import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { imageUrls } = await request.json();

    if (!Array.isArray(imageUrls)) {
      return NextResponse.json(
        { error: 'imageUrls must be an array' },
        { status: 400 }
      );
    }

    const imagesDir = path.join(process.cwd(), 'public', 'menu-images');
    const results = {
      deleted: [],
      missing: [],
      skipped: [],
    };

    imageUrls.forEach((url) => {
      if (typeof url !== 'string') {
        results.skipped.push(url);
        return;
      }

      // Only allow deletions inside /menu-images to avoid arbitrary file access
      const marker = '/menu-images/';
      if (!url.includes(marker)) {
        results.skipped.push(url);
        return;
      }

      const filename = url.split(marker)[1];
      if (!filename || filename.includes('..')) {
        results.skipped.push(url);
        return;
      }

      const filePath = path.join(imagesDir, filename);

      // Safety check: ensure final path is within imagesDir
      if (!filePath.startsWith(imagesDir)) {
        results.skipped.push(url);
        return;
      }

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          results.deleted.push(url);
        } catch {
          results.skipped.push(url);
        }
      } else {
        results.missing.push(url);
      }
    });

    return NextResponse.json({ ok: true, ...results });
  } catch (error) {
    console.error('Error deleting menu images:', error);
    return NextResponse.json(
      { error: 'Failed to delete images', details: error.message },
      { status: 500 }
    );
  }
}
