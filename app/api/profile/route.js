import { NextResponse } from 'next/server';
import {
  attachProfileCookie,
  getProfileTokenFromRequest,
  getTelegramUserByProfileToken,
} from '@/lib/telegram';

const serializeProfile = (profile) => {
  if (!profile) return null;

  return {
    profile_token: profile.profile_token,
    display_name: profile.display_name || `Telegram ${profile.chat_id}`,
    allergies: [...(profile.allergies || []), ...(profile.custom_allergies || [])],
    spice_tolerance: profile.spice_tolerance || 'medium',
    diet_preference:
      profile.diet_type === 'none' || !profile.diet_type ? 'omnivore' : profile.diet_type,
    exclude_ingredients: profile.exclude_ingredients || [],
  };
};

export async function GET(request) {
  try {
    const profileToken = getProfileTokenFromRequest(request);
    if (!profileToken) {
      return NextResponse.json({ profile: null });
    }

    const profile = await getTelegramUserByProfileToken(profileToken);
    return NextResponse.json({ profile: serializeProfile(profile) });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to load profile' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { profileToken } = await request.json();
    if (!profileToken) {
      return NextResponse.json({ error: 'Profile token is required' }, { status: 400 });
    }

    const profile = await getTelegramUserByProfileToken(profileToken);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const response = NextResponse.json({
      profile: serializeProfile(profile),
    });
    attachProfileCookie(response, profile.profile_token);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to link profile' },
      { status: 500 }
    );
  }
}
