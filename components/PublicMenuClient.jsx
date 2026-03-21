'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MenuCard from '@/components/MenuCard';
import { MENU_SECTIONS, CURRENCIES } from '@/lib/constants';
import { getMenuById } from '@/lib/storage';
import { personalizeMenu } from '@/lib/server/personalization';

const hasMissingImages = (menuData) =>
  Boolean(
    menuData &&
    Object.values(menuData).some(
      (dishes) => Array.isArray(dishes) && dishes.some((dish) => !dish?.imageUrl)
    )
  );

export default function PublicMenuClient({
  menuId,
  initialMenuRecord,
  profile = null,
  personalizationSummary = null,
  activeProfileToken = null,
}) {
  const router = useRouter();
  const [menuRecord, setMenuRecord] = useState(initialMenuRecord);
  const [linkedProfile, setLinkedProfile] = useState(profile);
  const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false);
  const [profileTokenInput, setProfileTokenInput] = useState('');
  const [profileError, setProfileError] = useState('');
  const [linkingProfile, setLinkingProfile] = useState(false);
  const currency = CURRENCIES.find((item) => item.value === 'GBP');
  const isPersonalized = Boolean(activeProfileToken);

  useEffect(() => {
    if (profile) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch('/api/profile', { cache: 'no-store' });
        const data = await response.json();
        if (data?.profile?.profile_token) {
          setLinkedProfile(data.profile);
        }
      } catch (error) {
        console.error('Failed to load current profile:', error);
      }
    })();
  }, [profile]);

  useEffect(() => {
    if (!activeProfileToken) {
      return;
    }

    void fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileToken: activeProfileToken }),
    }).catch((error) => {
      console.error('Failed to persist active profile token:', error);
    });
  }, [activeProfileToken]);

  useEffect(() => {
    if (!menuId || !hasMissingImages(menuRecord?.menu)) {
      return;
    }

    const interval = setInterval(() => {
      void (async () => {
        try {
          const updatedMenu = await getMenuById(menuId);
          if (updatedMenu?.menu) {
            setMenuRecord((current) => {
              const baseRecord = {
                ...(current || {}),
                ...updatedMenu,
              };

              if (!isPersonalized || !linkedProfile) {
                return baseRecord;
              }

              const personalized = personalizeMenu(updatedMenu.menu, linkedProfile);
              return {
                ...baseRecord,
                menu: personalized.menu,
              };
            });
          }
        } catch (error) {
          console.error('Failed to refresh public menu:', error);
        }
      })();
    }, 3000);

    return () => clearInterval(interval);
  }, [menuId, menuRecord, linkedProfile, isPersonalized]);

  const currentSummary =
    isPersonalized && linkedProfile
      ? personalizeMenu(menuRecord.menu, linkedProfile).summary
      : personalizationSummary;
  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const telegramLink = telegramBotUsername
    ? `https://t.me/${telegramBotUsername}?start=connect_${menuId}`
    : null;

  const handlePersonalize = async () => {
    if (linkedProfile?.profile_token) {
      router.push(`/menu/${menuId}/p/${linkedProfile.profile_token}`);
      return;
    }

    if (!profileTokenInput.trim()) {
      setProfileError('Enter your profile code from Telegram.');
      return;
    }

    setLinkingProfile(true);
    setProfileError('');

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileToken: profileTokenInput }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to link profile');
      }

      const profileData = data.profile;
      setLinkedProfile(profileData);
      router.push(`/menu/${menuId}/p/${profileData.profile_token}`);
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setLinkingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              {isPersonalized ? 'Personalized Menu' : 'Shared Menu'}
            </p>
            <h1 className="mb-2 text-4xl font-bold">
              {menuRecord.restaurantName || 'Restaurant Menu'}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
              {menuRecord.location && <span>📍 {menuRecord.location}</span>}
              {menuRecord.language && <span>🌐 {menuRecord.language}</span>}
              {menuRecord.createdAt && (
                <span>
                  Saved {new Date(menuRecord.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {hasMissingImages(menuRecord.menu) && (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                Images are still being generated in the background.
              </p>
            )}
            {isPersonalized && currentSummary && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                <p className="font-semibold">
                  Personalized for {linkedProfile?.display_name || currentSummary.profileLabel}
                </p>
                <p className="mt-1">
                  {currentSummary.safeCount} great matches, {currentSummary.cautionCount} caution items,
                  {` ${currentSummary.avoidCount} dishes to avoid.`}
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {!isPersonalized && (
              <button
                type="button"
                onClick={() => setIsPersonalizeOpen(true)}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
              >
                Personalize for me
              </button>
            )}
          </div>
        </div>

        {isPersonalizeOpen && (
          <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-lg">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Personalize This Menu</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Use your Telegram profile code to open your own personalized version of this menu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPersonalizeOpen(false)}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[var(--text-secondary)]"
              >
                Close
              </button>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={profileTokenInput}
                onChange={(event) =>
                  setProfileTokenInput(
                    event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                  )
                }
                placeholder="Enter your Telegram profile code"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => void handlePersonalize()}
                disabled={linkingProfile}
                className="rounded-lg bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-60"
              >
                {linkingProfile ? 'Linking...' : 'Open personalized menu'}
              </button>
            </div>
            {profileError && (
              <p className="mt-3 text-sm text-red-600">{profileError}</p>
            )}
            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)]/70 p-4 text-sm text-[var(--text-secondary)]">
              <p className="font-medium text-[var(--foreground)]">Need a profile code?</p>
              <p className="mt-1">
                Open our Telegram bot, finish your preference setup, and it will give you your personal code.
              </p>
              {telegramLink && (
                <a
                  href={telegramLink}
                  className="mt-3 inline-flex rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)]"
                >
                  Open Telegram bot
                </a>
              )}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {MENU_SECTIONS.map((sectionName) => {
            const dishes = menuRecord.menu?.[sectionName] || [];
            if (dishes.length === 0) return null;

            return (
              <section key={sectionName}>
                <h2 className="mb-4 text-xl font-semibold">{sectionName}</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dishes.map((dish, index) => (
                    <MenuCard
                      key={`${sectionName}-${index}-${dish.name}`}
                      dish={dish}
                      sectionName={sectionName}
                      currency={currency}
                      showImages
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
