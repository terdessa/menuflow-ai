'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { getSavedMenus, deleteMenuById, clearSavedMenus } from '@/lib/storage';

export default function SavedMenusPage() {
  const router = useRouter();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const savedMenus = await getSavedMenus();
        setMenus(savedMenus);
      } catch (error) {
        console.error('Failed to load menus', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleOpenMenu = (menuId) => {
    router.push(`/menu/${menuId}`);
  };

  const handleDeleteMenu = async (menuId) => {
    await deleteMenuById(menuId);
    setMenus((prev) => prev.filter((m) => m.id !== menuId));
  };

  const handleDeleteAll = async () => {
    await clearSavedMenus();
    setMenus([]);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <h2 className="mb-2 text-3xl font-bold">Saved Menus</h2>
            <p className="text-[var(--text-secondary)]">
              Your previously scanned menus
            </p>
          </div>
          {menus.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
            >
              Clear all
            </button>
          )}
        </div>

        {loading ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-12 text-center">
            <p className="text-[var(--text-secondary)]">Loading menus...</p>
          </div>
        ) : menus.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-12 text-center">
            <div className="mb-4 text-6xl">📋</div>
            <h3 className="mb-2 text-xl font-semibold">No saved menus yet</h3>
            <p className="mb-6 text-[var(--text-secondary)]">
              Upload a menu to get started
            </p>
            <button
              onClick={() => router.push('/')}
              className="rounded-lg bg-[var(--primary)] px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-[var(--primary-hover)] hover:shadow-lg"
            >
              Upload Menu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="group animate-fade-in cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm transition-all hover:shadow-md"
                onClick={() => handleOpenMenu(menu.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="mb-1 text-xl font-semibold">
                      {menu.restaurantName || 'Restaurant Menu'}
                    </h3>
                    {menu.location && (
                      <p className="mb-2 text-sm text-[var(--text-secondary)]">
                        📍 {menu.location}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                      {menu.language && (
                        <span>🌐 {menu.language}</span>
                      )}
                      {menu.publicUrl && (
                        <span className="truncate">🔗 {menu.publicUrl}</span>
                      )}
                      {menu.menu && (
                        <span>
                          🍽️{' '}
                          {Object.values(menu.menu).reduce(
                            (acc, dishes) => acc + dishes.length,
                            0
                          )}{' '}
                          dishes
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const publicUrl = `${window.location.origin}${menu.publicUrl || `/menu/${menu.id}`}`;
                        try {
                          await navigator.clipboard.writeText(publicUrl);
                        } catch (error) {
                          console.error('Failed to copy link', error);
                        }
                      }}
                      className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--border)]"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMenu(menu.id);
                      }}
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                    >
                      Delete
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenMenu(menu.id);
                      }}
                      className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
                    >
                      Open →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Navigation />
    </div>
  );
}
