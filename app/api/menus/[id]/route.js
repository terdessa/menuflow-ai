import { after, NextResponse } from 'next/server';
import {
  attachSessionCookie,
  createSessionId,
  deleteMenuForOwner,
  getPublicMenu,
  getSessionIdFromRequest,
  updateMenuForOwner,
} from '@/lib/server/menu-store';
import {
  generateMissingImagesForMenu,
  menuHasMissingImages,
} from '@/lib/server/generate-menu-images';

const withSession = (request) => {
  const existing = getSessionIdFromRequest(request);
  return {
    sessionId: existing || createSessionId(),
    isNew: !existing,
  };
};

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const menu = await getPublicMenu(id);
    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    if (menuHasMissingImages(menu.menu) && menu.imageGenerationStatus !== 'in_progress') {
      after(async () => {
        try {
          await generateMissingImagesForMenu(id, 'detailed');
        } catch (error) {
          console.error('Failed to resume menu image generation:', error);
        }
      });
    }

    return NextResponse.json({ menu });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to load menu' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { sessionId, isNew } = withSession(request);
    const { id } = await params;
    const payload = await request.json();
    const menu = await updateMenuForOwner(id, sessionId, payload);

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    const response = NextResponse.json({ menu });
    if (isNew) {
      attachSessionCookie(response, sessionId);
    }
    return response;
  } catch (error) {
    const status = error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to update menu' },
      { status }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { sessionId, isNew } = withSession(request);
    const { id } = await params;
    const menu = await deleteMenuForOwner(id, sessionId);

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    const response = NextResponse.json({ menu });
    if (isNew) {
      attachSessionCookie(response, sessionId);
    }
    return response;
  } catch (error) {
    const status = error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to delete menu' },
      { status }
    );
  }
}
