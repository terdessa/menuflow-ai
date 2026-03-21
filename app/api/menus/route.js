import { NextResponse } from 'next/server';
import {
  attachSessionCookie,
  clearMenusForOwner,
  createMenuForOwner,
  createSessionId,
  getSessionIdFromRequest,
  listMenusForOwner,
} from '@/lib/server/menu-store';

const withSession = (request) => {
  const existing = getSessionIdFromRequest(request);
  return {
    sessionId: existing || createSessionId(),
    isNew: !existing,
  };
};

export async function GET(request) {
  try {
    const { sessionId, isNew } = withSession(request);
    const menus = await listMenusForOwner(sessionId);
    const response = NextResponse.json({ menus });
    if (isNew) {
      attachSessionCookie(response, sessionId);
    }
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to load menus' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { sessionId, isNew } = withSession(request);
    const payload = await request.json();
    const menu = await createMenuForOwner(sessionId, payload);
    const response = NextResponse.json({ menu }, { status: 201 });
    if (isNew) {
      attachSessionCookie(response, sessionId);
    }
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to save menu' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { sessionId, isNew } = withSession(request);
    const deletedMenus = await clearMenusForOwner(sessionId);
    const response = NextResponse.json({ deletedMenus });
    if (isNew) {
      attachSessionCookie(response, sessionId);
    }
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to clear menus' },
      { status: 500 }
    );
  }
}
