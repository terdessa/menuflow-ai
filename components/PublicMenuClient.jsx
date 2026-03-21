'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MenuCard from '@/components/MenuCard';
import { MENU_SECTIONS, CURRENCIES } from '@/lib/constants';
import { getMenuById } from '@/lib/storage';

const hasMissingImages = (menuData) =>
  Boolean(
    menuData &&
    Object.values(menuData).some(
      (dishes) => Array.isArray(dishes) && dishes.some((dish) => !dish?.imageUrl)
    )
  );

export default function PublicMenuClient({ menuId, initialMenuRecord }) {
  const [menuRecord, setMenuRecord] = useState(initialMenuRecord);
  const currency = CURRENCIES.find((item) => item.value === 'GBP');

  useEffect(() => {
    if (!menuId || !hasMissingImages(menuRecord?.menu)) {
      return;
    }

    const interval = setInterval(() => {
      void (async () => {
        try {
          const updatedMenu = await getMenuById(menuId);
          if (updatedMenu?.menu) {
            setMenuRecord(updatedMenu);
          }
        } catch (error) {
          console.error('Failed to refresh public menu:', error);
        }
      })();
    }, 3000);

    return () => clearInterval(interval);
  }, [menuId, menuRecord]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              Shared Menu
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
          </div>
          <Link
            href="/"
            className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)]"
          >
            Scan another menu
          </Link>
        </div>

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
