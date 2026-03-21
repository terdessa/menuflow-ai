'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import MenuCard from '@/components/MenuCard';
import FilterPanel from '@/components/FilterPanel';
import Navigation from '@/components/Navigation';
import { getPreferences, saveMenu, getMenuById, updateSavedMenu } from '@/lib/storage';
import { MENU_SECTIONS, ICON_TYPES, CURRENCIES } from '@/lib/constants';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const [preferences, setPreferences] = useState(null);
  const [menu, setMenu] = useState(null);
  const [filters, setFilters] = useState({
    dietTypes: [],
    customDietTypes: '',
    allergies: [],
    customAllergies: '',
    excludeIngredients: [],
    currency: 'GBP',
    language: 'en',
    spiceTolerance: 'medium',
    alcoholEnabled: true,
    alcoholTypes: ['wine', 'beer', 'cocktail', 'prosecco', 'spirits', 'champagne', 'sake', 'cider'],
    imagesEnabled: true,
    imageStyle: 'detailed',
    imageCategories: ['starters', 'mains', 'desserts', 'drinks', 'soups', 'salads'],
    speedPreference: 'normal',
    texturePreferences: [],
    cookingStyles: [],
    portionSharing: 'alone',
    tastePreferences: [],
    meatPreferences: [],
    customInstructions: '',
    showImages: true,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentMenuId, setCurrentMenuId] = useState(null);

  // Generate images for all menu items in parallel
  // menuIdOverride ensures we persist URLs to the correct saved menu
  const generateImagesForMenu = (menuData, imageStyle, menuIdOverride = null) => {
    try {
      if (!menuData) return;
      const targetMenuId = menuIdOverride || currentMenuId;

      // Collect all dishes that need images
      const dishesToGenerate = [];

      Object.keys(menuData).forEach((section) => {
        if (Array.isArray(menuData[section])) {
          menuData[section].forEach((dish, index) => {
            if (!dish.imageUrl) {
              dishesToGenerate.push({ dish, section, index });
            }
          });
        }
      });

      if (dishesToGenerate.length === 0) {
        console.log('No dishes need image generation - all images ready');
        return;
      }

      // Rate limiting: use NEXT_PUBLIC_IMAGE_GEN_RPM (requests per minute), default 20
      const rateLimitPerMinute = Number(process.env.NEXT_PUBLIC_IMAGE_GEN_RPM) || 20;
      const delayBetweenRequestsMs =
        rateLimitPerMinute > 0 ? Math.floor(60000 / rateLimitPerMinute) : 0;

      console.log(
        `Generating ${dishesToGenerate.length} images with spacing ${delayBetweenRequestsMs}ms (rpm=${rateLimitPerMinute})`
      );

      // Generate all images in parallel
      const imagePromises = dishesToGenerate.map(({ dish, section, index }, promiseIndex) => {
        const startDelay = delayBetweenRequestsMs * promiseIndex;

        return new Promise((resolve) => {
          setTimeout(async () => {
            try {
              const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  dishName: dish.name,
                  ingredients: dish.ingredients,
                  imageStyle: imageStyle,
                  type: section && section.toLowerCase().includes('drink') ? 'drink' : 'dish',
                }),
              });

              if (!response.ok) {
                throw new Error(`Failed to generate image for ${dish.name}`);
              }

              const data = await response.json();
              resolve({
                section,
                index,
                imageUrl: data.imageUrl,
              });
            } catch (error) {
              console.error(`Error generating image for ${dish.name}:`, error);
              resolve(null);
            }
          }, startDelay);
        });
      });

      // Process images as they complete - update each dish individually
      imagePromises.forEach((promise, promiseIndex) => {
        promise
          .then((result) => {
            if (result && result.imageUrl) {
              // Update menu state with the new image URL immediately
              setMenu((prevMenu) => {
                if (!prevMenu || !prevMenu[result.section]) {
                  console.warn('Menu state not ready for update', result);
                  return prevMenu;
                }

                // Create a completely new menu object to ensure React detects the change
                const updatedMenu = {};
                Object.keys(prevMenu).forEach((section) => {
                  updatedMenu[section] = prevMenu[section].map((dish, idx) => {
                    if (section === result.section && idx === result.index) {
                      // Create new dish object with imageUrl
                      return { ...dish, imageUrl: result.imageUrl };
                    }
                    return dish;
                  });
                });

                console.log(`✅ Image generated for: ${dishesToGenerate[promiseIndex].dish.name}`, result.imageUrl);
                // Persist updated menu if we have an id
                if (targetMenuId) {
                  updateSavedMenu(targetMenuId, updatedMenu);
                }
                return updatedMenu;
              });
            }
          })
          .catch((error) => {
            console.error(`Error generating image for ${dishesToGenerate[promiseIndex].dish.name}:`, error);
          });
      });
    } catch (error) {
      console.error('Image generation batch failed:', error);
    }
  };

  useEffect(() => {
    const stored = getPreferences();
    if (stored) {
      setPreferences(stored);
      setFilters({
        dietTypes: stored.dietTypes || [],
        customDietTypes: stored.customDietTypes || '',
        allergies: stored.allergies || [],
        customAllergies: stored.customAllergies || '',
        excludeIngredients: stored.dislikedIngredients
          ? stored.dislikedIngredients.split(',').map((i) => i.trim())
          : [],
        currency: stored.currency || 'GBP',
        language: stored.language || 'en',
        spiceTolerance: stored.spiceTolerance || 'medium',
        alcoholEnabled: stored.alcoholEnabled !== undefined ? stored.alcoholEnabled : true,
        alcoholTypes: stored.alcoholTypes || ['wine', 'beer', 'cocktail', 'prosecco', 'spirits', 'champagne', 'sake', 'cider'],
        imagesEnabled: stored.imagesEnabled !== undefined ? stored.imagesEnabled : true,
        imageStyle: stored.imageStyle || 'detailed',
        imageCategories: stored.imageCategories || ['starters', 'mains', 'desserts', 'drinks', 'soups', 'salads'],
        speedPreference: stored.speedPreference || 'normal',
        texturePreferences: stored.texturePreferences || [],
        cookingStyles: stored.cookingStyles || [],
        portionSharing: stored.portionSharing || 'alone',
        tastePreferences: stored.tastePreferences || [],
        meatPreferences: stored.meatPreferences || [],
        customInstructions: stored.customInstructions || '',
        showImages: true,
      });
    }

    // Check if we should load a saved menu from URL
    const menuId = searchParams.get('menu');
    if (menuId) {
      const savedMenu = getMenuById(menuId);
      if (savedMenu && savedMenu.menu) {
        setCurrentMenuId(menuId);
        setMenu(savedMenu.menu);

        // Generate images for saved menu only if some are missing
        const currentPrefs = getPreferences();
        const hasMissingImages = Object.keys(savedMenu.menu || {}).some((section) =>
          (savedMenu.menu?.[section] || []).some((dish) => !dish.imageUrl)
        );
        if (currentPrefs?.imagesEnabled !== false && hasMissingImages) {
          setTimeout(() => {
            generateImagesForMenu(
              savedMenu.menu,
              currentPrefs?.imageStyle || 'detailed',
              menuId
            );
          }, 100);
        }
      }
    }
  // generateImagesForMenu intentionally closes over the latest menu id for background image updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Process uploaded images through API
  useEffect(() => {
    if (uploadedFiles.length > 0 && !menu) {
      setUploading(true);

      // Upload images to API
      const formData = new FormData();
      uploadedFiles.forEach((file) => {
        formData.append('images', file);
      });

      fetch('/api/process-menu', {
        method: 'POST',
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.error) {
            throw new Error(data.error);
          }

          // Normalize menu data structure
          const normalizedMenu = data.menu || {};

          // Ensure all sections exist
          MENU_SECTIONS.forEach((section) => {
            if (!normalizedMenu[section]) {
              normalizedMenu[section] = [];
            }
          });

          // Auto-save menu
          const saved = saveMenu({
            restaurantName: 'Uploaded Menu',
            location: 'Unknown',
            language: 'English',
            menu: normalizedMenu,
          });
          const savedMenuId = saved?.id || null;
          if (saved?.id) {
            setCurrentMenuId(saved.id);
          }

          // Set menu first - show immediately without waiting for images
          setMenu(normalizedMenu);
          setUploading(false);

          // Generate images asynchronously in the background
          // Images will update individually as they complete
          setTimeout(() => {
            const currentPrefs = getPreferences();
            if (currentPrefs?.imagesEnabled !== false) {
              // Generate images using the normalized menu we just set
              generateImagesForMenu(
                normalizedMenu,
                currentPrefs?.imageStyle || 'detailed',
                savedMenuId
              );
            }
          }, 100);
        })
        .catch((error) => {
          console.error('Error processing menu:', error);
          alert(`Failed to process menu: ${error.message}`);
          setUploading(false);
          setUploadedFiles([]); // Reset to allow retry
        });
    }
  // generateImagesForMenu intentionally stays out of deps to avoid retriggering uploads on re-render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFiles, menu]);


  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setUploadedFiles(files);
      setMenu(null); // Reset menu to trigger new load
    }
  };

  const handleResetFilters = () => {
    const stored = getPreferences();
    if (stored) {
      setFilters({
        dietTypes: stored.dietTypes || [],
        customDietTypes: stored.customDietTypes || '',
        allergies: stored.allergies || [],
        customAllergies: stored.customAllergies || '',
        excludeIngredients: stored.dislikedIngredients
          ? stored.dislikedIngredients.split(',').map((i) => i.trim())
          : [],
        currency: stored.currency || 'GBP',
        language: stored.language || 'en',
        spiceTolerance: stored.spiceTolerance || 'medium',
        alcoholEnabled: stored.alcoholEnabled !== undefined ? stored.alcoholEnabled : true,
        alcoholTypes: stored.alcoholTypes || ['wine', 'beer', 'cocktail', 'prosecco', 'spirits', 'champagne', 'sake', 'cider'],
        imagesEnabled: stored.imagesEnabled !== undefined ? stored.imagesEnabled : true,
        imageStyle: stored.imageStyle || 'detailed',
        imageCategories: stored.imageCategories || ['starters', 'mains', 'desserts', 'drinks', 'soups', 'salads'],
        speedPreference: stored.speedPreference || 'normal',
        texturePreferences: stored.texturePreferences || [],
        cookingStyles: stored.cookingStyles || [],
        portionSharing: stored.portionSharing || 'alone',
        tastePreferences: stored.tastePreferences || [],
        meatPreferences: stored.meatPreferences || [],
        customInstructions: stored.customInstructions || '',
        showImages: true,
      });
    } else {
      // Reset to defaults if no preferences stored
      setFilters({
        dietTypes: [],
        customDietTypes: '',
        allergies: [],
        customAllergies: '',
        excludeIngredients: [],
        currency: 'GBP',
        language: 'en',
        spiceTolerance: 'medium',
        alcoholEnabled: true,
        alcoholTypes: ['wine', 'beer', 'cocktail', 'prosecco', 'spirits', 'champagne', 'sake', 'cider'],
        imagesEnabled: true,
        imageStyle: 'detailed',
        imageCategories: ['starters', 'mains', 'desserts', 'drinks', 'soups', 'salads'],
        speedPreference: 'normal',
        texturePreferences: [],
        cookingStyles: [],
        portionSharing: 'alone',
        tastePreferences: [],
        meatPreferences: [],
        customInstructions: '',
        showImages: true,
      });
    }
  };

  const handleFilterChange = (newFilters) => {
    const imagesJustEnabled = !filters.imagesEnabled && newFilters.imagesEnabled;

    setFilters(newFilters);

    // If images were just enabled, generate images for current menu
    if (imagesJustEnabled && newFilters.showImages && menu) {
      // Check if any dishes are missing images
      const hasMissingImages = Object.keys(menu).some((section) =>
        menu[section].some((dish) => !dish.imageUrl)
      );

      if (hasMissingImages) {
        generateImagesForMenu(menu, newFilters.imageStyle, currentMenuId);
      }
    }
  };

  const filteredMenu = menu ? filterMenu(menu, filters) : null;
  const selectedCurrency = CURRENCIES.find((c) => c.value === filters.currency);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Upload Section */}
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
                  className="rounded-lg bg-[var(--primary)] px-6 py-3 font-semibold text-white transition-all hover:bg-[var(--primary-hover)] shadow-md hover:shadow-lg"
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

        {/* Menu Display */}
        {menu && (
          <>
            {/* Controls */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Menu</h2>
              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 font-medium hover:bg-[var(--border)] transition-colors"
              >
                <span>🔍</span>
                Filters
              </button>
            </div>

            {/* Menu Sections */}
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
                          currency={selectedCurrency}
                          showImages={filters.imagesEnabled && filters.showImages}
                          imageStyle={filters.imageStyle}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}

        {/* Filter Panel */}
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

// Filter menu based on user preferences
function filterMenu(menu, filters) {
  const filtered = {};

  Object.keys(menu).forEach((section) => {
    filtered[section] = menu[section].filter((dish) => {
      const filterProps = dish.filterProperties || {};

      // Filter by diet types (multiple selection)
      if (filters.dietTypes.length > 0) {
        // If omnivore is selected, show all dishes
        if (filters.dietTypes.includes('omnivore')) {
          // Omnivore shows everything, so no filtering needed
        } else {
          // Check if dish matches any of the selected diet types
          const matchesDiet = filters.dietTypes.some((dietType) => {
            // First check filterProperties from API
            if (filterProps.dietTypes && filterProps.dietTypes.includes(dietType)) {
              return true;
            }
            // Fallback to icons for backward compatibility
            const hasMatchingIcon = dish.icons?.some((icon) => {
              if (dietType === 'vegan') return icon === ICON_TYPES.VEGAN || icon === 'vegan';
              if (dietType === 'vegetarian') return icon === ICON_TYPES.VEGETARIAN || icon === 'vegetarian';
              if (dietType === 'pescatarian') return icon === ICON_TYPES.PESCATARIAN || icon === 'pescatarian';
              if (dietType === 'halal') return icon === ICON_TYPES.HALAL || icon === 'halal';
              if (dietType === 'gluten-free') return icon === ICON_TYPES.GLUTEN_FREE || icon === 'gluten-free';
              if (dietType === 'sugar-free') return icon === ICON_TYPES.SUGAR_FREE || icon === 'sugar-free';
              return false;
            });
            return hasMatchingIcon;
          });
          if (!matchesDiet) return false;
        }
      }

      // Filter by allergies
      if (filters.allergies.length > 0) {
        // Check filterProperties from API
        if (filterProps.allergies && filterProps.allergies.length > 0) {
          const hasMatchingAllergen = filters.allergies.some((allergy) =>
            filterProps.allergies.includes(allergy)
          );
          if (hasMatchingAllergen) return false;
        }
        // Fallback to allergen warning icon
        const hasAllergenWarning = dish.icons?.includes(
          ICON_TYPES.ALLERGEN_WARNING
        );
        if (hasAllergenWarning) return false;
      }

      // Filter by excluded ingredients
      if (filters.excludeIngredients.length > 0) {
        const ingredients = dish.ingredients?.toLowerCase() || '';
        const hasExcluded = filters.excludeIngredients.some((excluded) =>
          ingredients.includes(excluded.toLowerCase())
        );
        if (hasExcluded) return false;
      }

      // Filter by spice tolerance
      if (filters.spiceTolerance && filterProps.spiceLevel) {
        const spiceLevels = ['none', 'mild', 'medium', 'hot', 'very-hot'];
        const userSpiceIndex = spiceLevels.indexOf(filters.spiceTolerance);
        const dishSpiceIndex = spiceLevels.indexOf(filterProps.spiceLevel);
        if (dishSpiceIndex > userSpiceIndex) return false;
      }

      // Filter by alcohol
      if (!filters.alcoholEnabled && filterProps.alcoholType) {
        return false;
      }
      if (filters.alcoholEnabled && filters.alcoholTypes.length > 0 && filterProps.alcoholType) {
        if (!filters.alcoholTypes.includes(filterProps.alcoholType)) {
          return false;
        }
      }

      // Filter by cooking styles
      if (filters.cookingStyles.length > 0 && filterProps.cookingStyle) {
        if (!filters.cookingStyles.includes(filterProps.cookingStyle)) {
          return false;
        }
      }

      // Filter by taste preferences
      if (filters.tastePreferences.length > 0 && filterProps.tasteProfile) {
        const hasMatchingTaste = filters.tastePreferences.some((taste) =>
          filterProps.tasteProfile.includes(taste)
        );
        if (!hasMatchingTaste) return false;
      }

      // Filter by texture preferences
      if (filters.texturePreferences.length > 0 && filterProps.texture) {
        if (!filters.texturePreferences.includes(filterProps.texture)) {
          return false;
        }
      }

      // Filter by meat preferences
      if (filters.meatPreferences.length > 0 && filterProps.meatType) {
        if (!filters.meatPreferences.includes(filterProps.meatType)) {
          return false;
        }
      }

      return true;
    });
  });

  return filtered;
}
