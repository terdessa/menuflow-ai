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

export async function GET() {
  try {
    const sql = getSQL();
    const rows = await sql`SELECT * FROM menus ORDER BY saved_at DESC`;
    return NextResponse.json(rows.map(mapRowToMenu));
  } catch (error) {
    console.error('GET /api/menus error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch menus' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const { restaurantName, location, language, menu } = body;

    const id = crypto.randomUUID();

    await sql`
      INSERT INTO menus (id, restaurant_name, location, language, menu)
      VALUES (${id}, ${restaurantName || ''}, ${location || ''}, ${language || ''}, ${JSON.stringify(menu)})
    `;

    return NextResponse.json({
      id,
      restaurantName: restaurantName || '',
      location: location || '',
      language: language || '',
      menu,
    });
  } catch (error) {
    console.error('POST /api/menus error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save menu' },
      { status: 500 }
    );
  }
}
