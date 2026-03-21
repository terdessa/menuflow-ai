import { notFound } from 'next/navigation';
import PublicMenuClient from '@/components/PublicMenuClient';
import { getPublicMenu } from '@/lib/server/menu-store';
import { getTelegramUserByProfileToken } from '@/lib/telegram';
import { personalizeMenu } from '@/lib/server/personalization';

export const dynamic = 'force-dynamic';

export default async function PersonalizedMenuPage({ params }) {
  const { id, token } = await params;
  const menuRecord = await getPublicMenu(id);
  const profile = await getTelegramUserByProfileToken(token);

  if (!menuRecord || !profile) {
    notFound();
  }

  const personalized = personalizeMenu(menuRecord.menu, profile);

  return (
    <PublicMenuClient
      menuId={id}
      initialMenuRecord={{
        ...menuRecord,
        menu: personalized.menu,
      }}
      profile={{
        profile_token: profile.profile_token,
        display_name: profile.display_name || `Telegram ${profile.chat_id}`,
        allergies: [...(profile.allergies || []), ...(profile.custom_allergies || [])],
        spice_tolerance: profile.spice_tolerance || 'medium',
        diet_preference:
          profile.diet_type === 'none' || !profile.diet_type ? 'omnivore' : profile.diet_type,
        exclude_ingredients: profile.exclude_ingredients || [],
      }}
      personalizationSummary={personalized.summary}
      activeProfileToken={profile.profile_token}
    />
  );
}
