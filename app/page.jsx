'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MenuCard from '@/components/MenuCard';
import FilterPanel from '@/components/FilterPanel';
import Navigation from '@/components/Navigation';
import { getPreferences, saveMenu, getMenuById } from '@/lib/storage';
import { MENU_SECTIONS, ICON_TYPES, CURRENCIES } from '@/lib/constants';

const DEFAULT_FILTERS = {
  allergies: [],
  customAllergies: '',
  excludeIngredients: [],
  spiceTolerance: 'medium',
};

const getInitialFilters = (storedPreferences) => {
  if (!storedPreferences) {
    return DEFAULT_FILTERS;
  }

  return {
    ...DEFAULT_FILTERS,
    allergies: storedPreferences.allergies || [],
    customAllergies: storedPreferences.customAllergies || '',
    excludeIngredients: storedPreferences.dislikedIngredients
      ? storedPreferences.dislikedIngredients.split(',').map((i) => i.trim())
      : [],
    spiceTolerance: storedPreferences.spiceTolerance || 'medium',
  };
};

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const [preferences] = useState(() => getPreferences());
  const [menu, setMenu] = useState(null);
  const [filters, setFilters] = useState(() => getInitialFilters(getPreferences()));
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentMenuId, setCurrentMenuId] = useState(null);
  const shareUrl = currentMenuId ? `/menu/${currentMenuId}` : '';

  const hasMissingImages = (menuData) =>
    Boolean(
      menuData &&
      Object.values(menuData).some(
        (dishes) => Array.isArray(dishes) && dishes.some((dish) => !dish?.imageUrl)
      )
    );

  useEffect(() => {
    const menuId = searchParams.get('menu');
    if (!menuId) {
      return;
    }

    void (async () => {
      try {
        const savedMenu = await getMenuById(menuId);
        if (!savedMenu?.menu) return;

        setCurrentMenuId(savedMenu.id || menuId);
        setMenu(savedMenu.menu);
      } catch (error) {
        console.error('Failed to load saved menu:', error);
      }
    })();
  }, [searchParams]);

  useEffect(() => {
    if (!currentMenuId || !hasMissingImages(menu)) {
      return;
    }

    const interval = setInterval(() => {
      void (async () => {
        try {
          const refreshedMenu = await getMenuById(currentMenuId);
          if (refreshedMenu?.menu) {
            setMenu(refreshedMenu.menu);
          }
        } catch (error) {
          console.error('Failed to refresh menu images:', error);
        }
      })();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentMenuId, menu]);

  useEffect(() => {
    if (uploadedFiles.length > 0 && !menu) {
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append('images', file);
      });

      fetch('/api/process-menu', {
        method: 'POST',
        body: formData,
      })
        .then(async (response) => {
          if (!response.ok) {
            let errorMessage = `API error: ${response.statusText}`;
            try {
              const errorData = await response.json();
              if (errorData?.details) {
                errorMessage = errorData.details;
              } else if (errorData?.error) {
                errorMessage = errorData.error;
              }
            } catch {
              // Keep the status text fallback when the body is not JSON.
            }
            throw new Error(errorMessage);
          }
          return response.json();
        })
        .then((data) => {
          if (data.error) {
            throw new Error(data.error);
          }

          const normalizedMenu = data.menu || {};

          MENU_SECTIONS.forEach((section) => {
            if (!normalizedMenu[section]) {
              normalizedMenu[section] = [];
            }
          });

          return saveMenu({
            restaurantName: 'Uploaded Menu',
            location: 'Unknown',
            language: 'English',
            menu: normalizedMenu,
          }).then((saved) => {
            if (saved?.id) {
              setCurrentMenuId(saved.id);
            }

            setMenu(saved?.menu || normalizedMenu);
            setUploading(false);
          });
        })
        .catch((error) => {
          console.error('Error processing menu:', error);
          alert(`Failed to process menu: ${error.message}`);
          setUploading(false);
          setUploadedFiles([]);
        });
    }
  }, [uploadedFiles, menu]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setUploading(true);
      setUploadedFiles(files);
      setMenu(null);
      setCurrentMenuId(null);
    }
  };

  const handleResetFilters = () => {
    const stored = getPreferences();
    if (stored) {
      setFilters({
        ...DEFAULT_FILTERS,
        allergies: stored.allergies || [],
        customAllergies: stored.customAllergies || '',
        excludeIngredients: stored.dislikedIngredients
          ? stored.dislikedIngredients.split(',').map((i) => i.trim())
          : [],
        spiceTolerance: stored.spiceTolerance || 'medium',
      });
    } else {
      setFilters(DEFAULT_FILTERS);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const filteredMenu = menu ? filterMenu(menu, filters) : null;
  const selectedCurrency = CURRENCIES.find((c) => c.value === 'GBP');

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      <main className="mx-auto max-w-7xl px-4 py-8">
        {!menu && (
          <div className="mb-8">
            <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--card-bg)] p-12 text-center">
              <input
                type="file"
                id="menu-upload"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="menu-upload"
                className="cursor-pointer"
              >
                <div className="mb-4 text-6xl">📸</div>
                <h2 className="mb-2 text-2xl font-bold">
                  Upload Menu Photos
                </h2>
                <p className="mb-4 text-[var(--text-secondary)]">
                  Upload one or more photos of your menu
                </p>
                <button
                  onClick={() => document.getElementById('menu-upload').click()}
                  className="rounded-lg bg-[var(--primary)] px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-[var(--primary-hover)] hover:shadow-lg"
                >
                  Choose Files
                </button>
              </label>
              {uploading && (
                <div className="mt-4">
                  <div className="mx-auto h-2 w-64 overflow-hidden rounded-full bg-[var(--border)]">
                    <div className="h-full w-full animate-pulse bg-[var(--primary)]" />
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Processing menu...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {menu && (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Menu</h2>
              <div className="flex flex-wrap items-center gap-3">
                {shareUrl && (
                  <Link
                    href={shareUrl}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--border)]"
                  >
                    Shareable Page
                  </Link>
                )}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 font-medium transition-colors hover:bg-[var(--border)]"
                >
                  <span>🔍</span>
                  Filters
                </button>
              </div>
            </div>

            {currentMenuId && hasMissingImages(menu) && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Shareable page is live now. Dish images are still being generated in the
                background and will appear here automatically.
              </div>
            )}

            <div className="space-y-8">
              {MENU_SECTIONS.map((sectionName) => {
                const dishes = filteredMenu[sectionName] || [];
                if (dishes.length === 0) return null;

                return (
                  <section key={sectionName} className="animate-fade-in">
                    <h3 className="mb-4 text-xl font-semibold text-[var(--foreground)]">
                      {sectionName}
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {dishes.map((dish, index) => (
                        <MenuCard
                          key={`${sectionName}-${index}-${dish.imageUrl || 'no-image'}`}
                          dish={dish}
                          sectionName={sectionName}
                          currency={selectedCurrency}
                          showImages
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}

        <FilterPanel
          preferences={preferences}
          onFilterChange={handleFilterChange}
          onClose={() => setIsFilterOpen(false)}
          onReset={handleResetFilters}
          isOpen={isFilterOpen}
        />
      </main>
      <Navigation />
    </div>
  );
}

function filterMenu(menu, filters) {
  const filtered = {};

  Object.keys(menu).forEach((section) => {
    filtered[section] = menu[section].filter((dish) => {
      const filterProps = dish.filterProperties || {};

      if (filters.allergies.length > 0) {
        if (filterProps.allergies && filterProps.allergies.length > 0) {
          const hasMatchingAllergen = filters.allergies.some((allergy) =>
            filterProps.allergies.includes(allergy)
          );
          if (hasMatchingAllergen) return false;
        }

        const hasAllergenWarning = dish.icons?.includes(
          ICON_TYPES.ALLERGEN_WARNING
        );
        if (hasAllergenWarning) return false;
      }

      if (filters.excludeIngredients.length > 0) {
        const ingredients = dish.ingredients?.toLowerCase() || '';
        const hasExcluded = filters.excludeIngredients.some((excluded) =>
          ingredients.includes(excluded.toLowerCase())
        );
        if (hasExcluded) return false;
      }

      if (filters.spiceTolerance && filterProps.spiceLevel) {
        const spiceLevels = ['none', 'mild', 'medium', 'hot', 'very-hot'];
        const userSpiceIndex = spiceLevels.indexOf(filters.spiceTolerance);
        const dishSpiceIndex = spiceLevels.indexOf(filterProps.spiceLevel);
        if (dishSpiceIndex > userSpiceIndex) return false;
      }

      return true;
    });
  });

  return filtered;
}
