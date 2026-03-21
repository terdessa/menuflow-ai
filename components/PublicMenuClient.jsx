'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);

const LoaderIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
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
  const [activeSection, setActiveSection] = useState(null);
  const sectionRefs = useRef({});
  const tabsRef = useRef(null);
  const currency = CURRENCIES.find((item) => item.value === menuRecord?.currency) || CURRENCIES.find((item) => item.value === 'GBP');
  const isPersonalized = Boolean(activeProfileToken);

  const availableSections = MENU_SECTIONS.filter(
    (name) => (menuRecord.menu?.[name] || []).length > 0
  );

  useEffect(() => {
    if (availableSections.length > 0 && !activeSection) {
      setActiveSection(availableSections[0]);
    }
  }, [availableSections, activeSection]);

  useEffect(() => {
    if (profile) return;
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
    if (!activeProfileToken) return;
    void fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileToken: activeProfileToken }),
    }).catch((error) => {
      console.error('Failed to persist active profile token:', error);
    });
  }, [activeProfileToken]);

  useEffect(() => {
    if (!menuId || !hasMissingImages(menuRecord?.menu)) return;

    const interval = setInterval(() => {
      void (async () => {
        try {
          const updatedMenu = await getMenuById(menuId);
          if (updatedMenu?.menu) {
            setMenuRecord((current) => {
              const baseRecord = { ...(current || {}), ...updatedMenu };
              if (!isPersonalized || !linkedProfile) return baseRecord;
              const personalized = personalizeMenu(updatedMenu.menu, linkedProfile);
              return { ...baseRecord, menu: personalized.menu };
            });
          }
        } catch (error) {
          console.error('Failed to refresh public menu:', error);
        }
      })();
    }, 3000);

    return () => clearInterval(interval);
  }, [menuId, menuRecord, linkedProfile, isPersonalized]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.dataset.section);
          }
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
    );

    for (const name of availableSections) {
      const el = sectionRefs.current[name];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [availableSections]);

  const scrollToSection = useCallback((sectionName) => {
    const el = sectionRefs.current[sectionName];
    if (el) {
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (!activeSection || !tabsRef.current) return;
    const activeTab = tabsRef.current.querySelector(`[data-tab="${activeSection}"]`);
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeSection]);

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

  let cardIndex = 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
                {isPersonalized ? 'Personalized Menu' : 'Shared Menu'}
              </p>
              <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
                {menuRecord.restaurantName || 'Restaurant Menu'}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                {menuRecord.location && menuRecord.location !== 'Unknown' && (
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon />
                    {menuRecord.location}
                  </span>
                )}
                {menuRecord.language && menuRecord.language !== 'auto' && menuRecord.language !== 'Auto' && (
                  <span>{menuRecord.language}</span>
                )}
                {menuRecord.createdAt && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon />
                    {new Date(menuRecord.createdAt).toLocaleDateString()}
                  </span>
                )}
                {hasMissingImages(menuRecord.menu) && (
                  <span className="inline-flex items-center gap-1 text-[var(--primary)]">
                    <LoaderIcon />
                    Generating images...
                  </span>
                )}
              </div>
            </div>
            {!isPersonalized && (
              <button
                type="button"
                onClick={() => setIsPersonalizeOpen(true)}
                className="shrink-0 cursor-pointer rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
              >
                Personalize
              </button>
            )}
          </div>

          {isPersonalized && currentSummary && (
            <div className="mt-3 rounded-lg bg-[var(--success-muted)] px-3 py-2 text-xs text-emerald-400">
              <span className="font-semibold text-emerald-300">
                {linkedProfile?.display_name || currentSummary.profileLabel}
              </span>
              {' \u2014 '}
              {currentSummary.safeCount} matches, {currentSummary.cautionCount} caution, {currentSummary.avoidCount} avoid
            </div>
          )}
        </div>

        {availableSections.length > 1 && (
          <div className="mx-auto max-w-2xl px-4 pb-2">
            <nav
              ref={tabsRef}
              className="hide-scrollbar flex gap-1.5 overflow-x-auto"
            >
              {availableSections.map((name) => (
                <button
                  key={name}
                  data-tab={name}
                  onClick={() => scrollToSection(name)}
                  className={`cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    activeSection === name
                      ? 'bg-[var(--primary)] text-white shadow-md shadow-[var(--primary-glow)]'
                      : 'bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--card-bg-hover)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {name}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Personalize Panel */}
      {isPersonalizeOpen && (
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <div className="animate-slide-in rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-lg">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--foreground)]">Personalize This Menu</h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Enter your Telegram profile code to see personalized recommendations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPersonalizeOpen(false)}
                className="cursor-pointer rounded-full p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={profileTokenInput}
                onChange={(event) =>
                  setProfileTokenInput(
                    event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                  )
                }
                placeholder="Profile code"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]"
              />
              <button
                type="button"
                onClick={() => void handlePersonalize()}
                disabled={linkingProfile}
                className="cursor-pointer shrink-0 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-60"
              >
                {linkingProfile ? '...' : 'Go'}
              </button>
            </div>
            {profileError && (
              <p className="mt-2 text-xs text-[var(--danger)]">{profileError}</p>
            )}
            {telegramLink && (
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                No code?{' '}
                <a href={telegramLink} className="text-[var(--primary)] underline">
                  Get one from our Telegram bot
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Menu Content */}
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-8">
          {availableSections.map((sectionName) => {
            const dishes = menuRecord.menu?.[sectionName] || [];

            return (
              <section
                key={sectionName}
                ref={(el) => { sectionRefs.current[sectionName] = el; }}
                data-section={sectionName}
              >
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    {sectionName}
                  </h2>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                  <span className="text-xs text-[var(--text-muted)]">
                    {dishes.length} {dishes.length === 1 ? 'dish' : 'dishes'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {dishes.map((dish, index) => {
                    const staggerClass = `stagger-${Math.min(++cardIndex, 8)}`;
                    return (
                      <MenuCard
                        key={`${sectionName}-${index}-${dish.name}`}
                        dish={dish}
                        sectionName={sectionName}
                        currency={currency}
                        showImages
                        staggerClass={staggerClass}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-12 border-t border-[var(--border)] pt-6 pb-8 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Powered by <span className="font-medium text-[var(--primary)]">MenuFlow AI</span>
          </p>
        </div>
      </main>
    </div>
  );
}
