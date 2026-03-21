import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

function getSQL() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured');
  }
  return neon(process.env.DATABASE_URL);
}

function mapRowToMenu(row) {
  return {
    id: row.id,
    savedAt: row.saved_at,
    restaurantName: row.restaurant_name || '',
    location: row.location || '',
    language: row.language || '',
    menu: row.menu,
  };
}

export async function GET(request, { params }) {
  try {
    const sql = getSQL();
    const { id } = await params;
    const rows = await sql`SELECT * FROM menus WHERE id = ${id}`;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    return NextResponse.json(mapRowToMenu(rows[0]));
  } catch (error) {
    console.error('GET /api/menus/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const sql = getSQL();
    const { id } = await params;
    const body = await request.json();
    const { menu } = body;

    const rows = await sql`
      UPDATE menus SET menu = ${JSON.stringify(menu)} WHERE id = ${id} RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    return NextResponse.json(mapRowToMenu(rows[0]));
  } catch (error) {
    console.error('PUT /api/menus/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update menu' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const sql = getSQL();
    const { id } = await params;
    const rows = await sql`DELETE FROM menus WHERE id = ${id} RETURNING *`;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    return NextResponse.json(mapRowToMenu(rows[0]));
  } catch (error) {
    console.error('DELETE /api/menus/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete menu' },
      { status: 500 }
    );
  }
}
