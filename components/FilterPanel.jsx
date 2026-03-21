'use client';

import { useState, useEffect } from 'react';
import { DIET_TYPES, ALLERGIES, CURRENCIES, LANGUAGES, SPICE_TOLERANCE, ALCOHOL_TYPES, IMAGE_STYLES, DISH_CATEGORIES, SPEED_PREFERENCES, TEXTURE_PREFERENCES, COOKING_STYLES, PORTION_SHARING, TASTE_PREFERENCES, MEAT_PREFERENCES } from '@/lib/constants';

export default function FilterPanel({
  preferences,
  onFilterChange,
  onClose,
  onReset,
  isOpen,
}) {
  const getExcludeIngredients = (prefs) => {
    if (prefs?.excludeIngredients) return prefs.excludeIngredients;
    if (prefs?.dislikedIngredients) {
      return prefs.dislikedIngredients.split(',').map((i) => i.trim()).filter((i) => i);
    }
    return [];
  };

  const [filters, setFilters] = useState({
    dietTypes: preferences?.dietTypes || [],
    customDietTypes: preferences?.customDietTypes || '',
    allergies: preferences?.allergies || [],
    customAllergies: preferences?.customAllergies || [],
    excludeIngredients: getExcludeIngredients(preferences),
    currency: preferences?.currency || 'GBP',
    language: preferences?.language || 'en',
    spiceTolerance: preferences?.spiceTolerance || 'medium',
    alcoholEnabled: preferences?.alcoholEnabled !== undefined ? preferences.alcoholEnabled : true,
    alcoholTypes: preferences?.alcoholTypes || ['wine', 'beer', 'cocktail', 'prosecco', 'spirits', 'champagne', 'sake', 'cider'],
    imagesEnabled: preferences?.imagesEnabled !== undefined ? preferences.imagesEnabled : true,
    imageStyle: preferences?.imageStyle || 'detailed',
    imageCategories: preferences?.imageCategories || ['starters', 'mains', 'desserts', 'drinks', 'soups', 'salads'],
    speedPreference: preferences?.speedPreference || 'normal',
    texturePreferences: preferences?.texturePreferences || [],
    cookingStyles: preferences?.cookingStyles || [],
    portionSharing: preferences?.portionSharing || 'alone',
    tastePreferences: preferences?.tastePreferences || [],
    meatPreferences: preferences?.meatPreferences || [],
    customInstructions: preferences?.customInstructions || '',
    showImages: true,
  });

  useEffect(() => {
    if (preferences) {
      // Sync local draft state when saved preferences are loaded.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilters({
        dietTypes: preferences.dietTypes || [],
        customDietTypes: preferences.customDietTypes || '',
        allergies: preferences.allergies || [],
        customAllergies: preferences.customAllergies || [],
        excludeIngredients: getExcludeIngredients(preferences),
        currency: preferences.currency || 'GBP',
        language: preferences.language || 'en',
        spiceTolerance: preferences.spiceTolerance || 'medium',
        alcoholEnabled: preferences.alcoholEnabled !== undefined ? preferences.alcoholEnabled : true,
        alcoholTypes: preferences.alcoholTypes || ['wine', 'beer', 'cocktail', 'prosecco', 'spirits', 'champagne', 'sake', 'cider'],
        imagesEnabled: preferences.imagesEnabled !== undefined ? preferences.imagesEnabled : true,
        imageStyle: preferences.imageStyle || 'detailed',
        imageCategories: preferences.imageCategories || ['starters', 'mains', 'desserts', 'drinks', 'soups', 'salads'],
        speedPreference: preferences.speedPreference || 'normal',
        texturePreferences: preferences.texturePreferences || [],
        cookingStyles: preferences.cookingStyles || [],
        portionSharing: preferences.portionSharing || 'alone',
        tastePreferences: preferences.tastePreferences || [],
        meatPreferences: preferences.meatPreferences || [],
        customInstructions: preferences.customInstructions || '',
        showImages: true,
      });
    }
  }, [preferences]);

  const handleDietToggle = (diet) => {
    const newDietTypes = filters.dietTypes.includes(diet)
      ? filters.dietTypes.filter((d) => d !== diet)
      : [...filters.dietTypes, diet];
    const newFilters = { ...filters, dietTypes: newDietTypes };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleAllergyToggle = (allergy) => {
    const newAllergies = filters.allergies.includes(allergy)
      ? filters.allergies.filter((a) => a !== allergy)
      : [...filters.allergies, allergy];
    const newFilters = { ...filters, allergies: newAllergies };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleExcludeIngredientsChange = (e) => {
    const ingredients = e.target.value
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i);
    const newFilters = { ...filters, excludeIngredients: ingredients };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCurrencyChange = (e) => {
    const newFilters = { ...filters, currency: e.target.value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-xl animate-fade-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Filters</h2>
          {onReset && (
            <button
              onClick={() => {
                // Reset internal state first
                const resetFilters = {
                  dietTypes: preferences?.dietTypes || [],
                  customDietTypes: preferences?.customDietTypes || '',
                  allergies: preferences?.allergies || [],
                  customAllergies: preferences?.customAllergies || [],
                  excludeIngredients: getExcludeIngredients(preferences),
                  currency: preferences?.currency || 'GBP',
                  language: preferences?.language || 'en',
                  spiceTolerance: preferences?.spiceTolerance || 'medium',
                  alcoholEnabled: preferences?.alcoholEnabled !== undefined ? preferences.alcoholEnabled : true,
                  alcoholTypes: preferences?.alcoholTypes || ['wine', 'beer', 'cocktail', 'prosecco', 'spirits', 'champagne', 'sake', 'cider'],
                  imagesEnabled: preferences?.imagesEnabled !== undefined ? preferences.imagesEnabled : true,
                  imageStyle: preferences?.imageStyle || 'detailed',
                  imageCategories: preferences?.imageCategories || ['starters', 'mains', 'desserts', 'drinks', 'soups', 'salads'],
                  speedPreference: preferences?.speedPreference || 'normal',
                  texturePreferences: preferences?.texturePreferences || [],
                  cookingStyles: preferences?.cookingStyles || [],
                  portionSharing: preferences?.portionSharing || 'alone',
                  tastePreferences: preferences?.tastePreferences || [],
                  meatPreferences: preferences?.meatPreferences || [],
                  customInstructions: preferences?.customInstructions || '',
                  showImages: true,
                };
                setFilters(resetFilters);
                onFilterChange(resetFilters);
                // Also call parent's reset handler
                onReset();
              }}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)]"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-8">
          {/* Diet Type */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Diet Type</label>
            <p className="mb-3 text-xs text-[var(--text-secondary)]">
              Select all that apply
            </p>
            <div className="mb-4 flex flex-wrap gap-3">
              {DIET_TYPES.map((diet) => (
                <button
                  key={diet.value}
                  onClick={() => handleDietToggle(diet.value)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${filters.dietTypes.includes(diet.value)
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-[var(--primary)]/10'
                    }`}
                >
                  {diet.label}
                </button>
              ))}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Additional Diet / Lifestyle Preferences
              </label>
              <input
                type="text"
                placeholder="e.g., keto, paleo, low-carb"
                value={filters.customDietTypes}
                onChange={(e) => {
                  const newFilters = { ...filters, customDietTypes: e.target.value };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              />
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                Enter additional diet or lifestyle preferences separated by commas
              </p>
            </div>
          </div>

          {/* Allergies */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Allergies</label>
            <div className="mb-4 flex flex-wrap gap-3">
              {ALLERGIES.map((allergy) => (
                <button
                  key={allergy.value}
                  onClick={() => handleAllergyToggle(allergy.value)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${filters.allergies.includes(allergy.value)
                    ? 'bg-red-500 text-white'
                    : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-red-500/10'
                    }`}
                >
                  {allergy.label}
                </button>
              ))}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Additional Allergies
              </label>
              <input
                type="text"
                placeholder="e.g., shellfish, sesame, sulfites"
                value={filters.customAllergies}
                onChange={(e) => {
                  const newFilters = { ...filters, customAllergies: e.target.value };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                Enter additional allergies separated by commas
              </p>
            </div>
          </div>

          {/* Exclude Ingredients */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Ingredients to Exclude
            </label>
            <input
              type="text"
              placeholder="e.g., onions, garlic, mushrooms"
              value={filters.excludeIngredients.join(', ')}
              onChange={handleExcludeIngredientsChange}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Currency</label>
            <select
              value={filters.currency}
              onChange={handleCurrencyChange}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr.value} value={curr.value}>
                  {curr.label}
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Menu Language</label>
            <select
              value={filters.language}
              onChange={(e) => {
                const newFilters = { ...filters, language: e.target.value };
                setFilters(newFilters);
                onFilterChange(newFilters);
              }}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              Translate menu into this language
            </p>
          </div>

          {/* Spice Tolerance */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Spice Tolerance</label>
            <p className="mb-3 text-xs text-[var(--text-secondary)]">
              Select your preferred spice level
            </p>
            <div className="flex flex-wrap gap-3">
              {SPICE_TOLERANCE.map((level) => (
                <button
                  key={level.value}
                  onClick={() => {
                    const newFilters = { ...filters, spiceTolerance: level.value };
                    setFilters(newFilters);
                    onFilterChange(newFilters);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${filters.spiceTolerance === level.value
                    ? `${level.color} text-white`
                    : 'bg-[var(--border)] text-[var(--foreground)] hover:opacity-80'
                    }`}
                >
                  <span>{level.emoji}</span>
                  <span>{level.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Alcohol Preference */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <label className="block text-sm font-semibold">Alcohol</label>
                <p className="text-xs text-[var(--text-secondary)]">
                  Enable to see alcoholic drinks
                </p>
              </div>
              <button
                onClick={() => {
                  const newEnabled = !filters.alcoholEnabled;
                  const newFilters = {
                    ...filters,
                    alcoholEnabled: newEnabled,
                    alcoholTypes: newEnabled
                      ? ALCOHOL_TYPES.map((type) => type.value)
                      : [],
                  };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                className={`relative h-6 w-11 rounded-full transition-colors ${filters.alcoholEnabled ? 'bg-purple-500' : 'bg-[var(--border)]'
                  }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${filters.alcoholEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
            {filters.alcoholEnabled && (
              <>
                <p className="mb-1 text-xs text-[var(--text-secondary)]">
                  Select your preferred drink types
                </p>
                <p className="mb-3 text-xs text-[var(--text-secondary)] italic">
                  All types are enabled by default
                </p>
                <div className="flex flex-wrap gap-3">
                  {ALCOHOL_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        const newTypes = filters.alcoholTypes.includes(type.value)
                          ? filters.alcoholTypes.filter((t) => t !== type.value)
                          : [...filters.alcoholTypes, type.value];
                        const newFilters = { ...filters, alcoholTypes: newTypes };
                        setFilters(newFilters);
                        onFilterChange(newFilters);
                      }}
                      className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${filters.alcoholTypes.includes(type.value)
                        ? 'bg-purple-500 text-white'
                        : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-purple-500/10'
                        }`}
                    >
                      <span>{type.emoji}</span>
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Image Preferences */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <label className="block text-sm font-semibold">Dish Images</label>
                <p className="text-xs text-[var(--text-secondary)]">
                  Enable to show dish images on menus
                </p>
              </div>
              <button
                onClick={() => {
                  const newFilters = { ...filters, imagesEnabled: !filters.imagesEnabled };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                className={`relative h-6 w-11 rounded-full transition-colors ${filters.imagesEnabled ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                  }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${filters.imagesEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
            {filters.imagesEnabled && (
              <>
                <p className="mb-3 text-xs text-[var(--text-secondary)]">
                  Choose your preferred image style
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {IMAGE_STYLES.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => {
                        const newFilters = { ...filters, imageStyle: style.value };
                        setFilters(newFilters);
                        onFilterChange(newFilters);
                      }}
                      className={`group relative overflow-hidden rounded-lg border-2 p-2 text-left transition-all ${filters.imageStyle === style.value
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                        : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                        }`}
                    >
                      {/* Placeholder for example image */}
                      <div className="mb-2 aspect-video w-full overflow-hidden rounded bg-gradient-to-br from-gray-100 to-gray-200">
                        <div className="flex h-full items-center justify-center text-2xl opacity-50">
                          {style.emoji}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{style.emoji}</span>
                        <span className="text-xs font-medium">{style.label}</span>
                      </div>
                      {filters.imageStyle === style.value && (
                        <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-[var(--primary)] flex items-center justify-center">
                          <span className="text-[10px] text-white">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold">
                    Generate images for:
                  </p>
                  <p className="mb-2 text-xs text-[var(--text-secondary)] italic">
                    All categories are selected by default
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {DISH_CATEGORIES.map((category) => (
                      <button
                        key={category.value}
                        onClick={() => {
                          const newCategories = filters.imageCategories.includes(
                            category.value
                          )
                            ? filters.imageCategories.filter(
                              (c) => c !== category.value
                            )
                            : [...filters.imageCategories, category.value];
                          const newFilters = { ...filters, imageCategories: newCategories };
                          setFilters(newFilters);
                          onFilterChange(newFilters);
                        }}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all whitespace-nowrap ${filters.imageCategories.includes(category.value)
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-[var(--primary)]/10'
                          }`}
                      >
                        <span>{category.emoji}</span>
                        <span>{category.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Speed Preference */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Speed Preference</label>
            <p className="mb-3 text-xs text-[var(--text-secondary)]">
              Select your preferred meal timing
            </p>
            <div className="flex flex-wrap gap-3">
              {SPEED_PREFERENCES.map((speed) => (
                <button
                  key={speed.value}
                  onClick={() => {
                    const newFilters = { ...filters, speedPreference: speed.value };
                    setFilters(newFilters);
                    onFilterChange(newFilters);
                  }}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 px-4 py-3 text-xs font-medium transition-all ${filters.speedPreference === speed.value
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                    : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                    }`}
                >
                  <span className="text-xl">{speed.emoji}</span>
                  <span className="font-semibold">{speed.label}</span>
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    {speed.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Texture Preferences */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Texture Preferences</label>
            <p className="mb-3 text-xs text-[var(--text-secondary)]">
              Select all that apply
            </p>
            <div className="flex flex-wrap gap-3">
              {TEXTURE_PREFERENCES.map((texture) => (
                <button
                  key={texture.value}
                  onClick={() => {
                    const newTextures = filters.texturePreferences.includes(
                      texture.value
                    )
                      ? filters.texturePreferences.filter(
                        (t) => t !== texture.value
                      )
                      : [...filters.texturePreferences, texture.value];
                    const newFilters = { ...filters, texturePreferences: newTextures };
                    setFilters(newFilters);
                    onFilterChange(newFilters);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${filters.texturePreferences.includes(texture.value)
                    ? 'bg-teal-500 text-white'
                    : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-teal-500/10'
                    }`}
                >
                  <span>{texture.emoji}</span>
                  <span>{texture.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cooking Style Preferences */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Cooking Style Preferences</label>
            <p className="mb-3 text-xs text-[var(--text-secondary)]">
              Select all that apply
            </p>
            <div className="flex flex-wrap gap-3">
              {COOKING_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => {
                    const newStyles = filters.cookingStyles.includes(
                      style.value
                    )
                      ? filters.cookingStyles.filter(
                        (s) => s !== style.value
                      )
                      : [...filters.cookingStyles, style.value];
                    const newFilters = { ...filters, cookingStyles: newStyles };
                    setFilters(newFilters);
                    onFilterChange(newFilters);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${filters.cookingStyles.includes(style.value)
                    ? 'bg-amber-500 text-white'
                    : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-amber-500/10'
                    }`}
                >
                  <span>{style.emoji}</span>
                  <span>{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Portion Sharing */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Portion Sharing</label>
            <p className="mb-3 text-xs text-[var(--text-secondary)]">
              How many people are eating together?
            </p>
            <div className="flex flex-wrap gap-3">
              {PORTION_SHARING.map((portion) => (
                <button
                  key={portion.value}
                  onClick={() => {
                    const newFilters = { ...filters, portionSharing: portion.value };
                    setFilters(newFilters);
                    onFilterChange(newFilters);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${filters.portionSharing === portion.value
                    ? 'bg-indigo-500 text-white'
                    : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-indigo-500/10'
                    }`}
                >
                  <span>{portion.emoji}</span>
                  <span>{portion.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Taste Preferences */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Taste Preferences</label>
            <p className="mb-3 text-xs text-[var(--text-secondary)]">
              Select all that apply
            </p>
            <div className="flex flex-wrap gap-3">
              {TASTE_PREFERENCES.map((taste) => (
                <button
                  key={taste.value}
                  onClick={() => {
                    const newTastes = filters.tastePreferences.includes(
                      taste.value
                    )
                      ? filters.tastePreferences.filter(
                        (t) => t !== taste.value
                      )
                      : [...filters.tastePreferences, taste.value];
                    const newFilters = { ...filters, tastePreferences: newTastes };
                    setFilters(newFilters);
                    onFilterChange(newFilters);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${filters.tastePreferences.includes(taste.value)
                    ? 'bg-pink-500 text-white'
                    : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-pink-500/10'
                    }`}
                >
                  <span>{taste.emoji}</span>
                  <span>{taste.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Meat Preferences */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Meat Preferences</label>
            <p className="mb-3 text-xs text-[var(--text-secondary)]">
              Select all that apply
            </p>
            <div className="flex flex-wrap gap-3">
              {MEAT_PREFERENCES.map((meat) => (
                <button
                  key={meat.value}
                  onClick={() => {
                    const newMeats = filters.meatPreferences.includes(
                      meat.value
                    )
                      ? filters.meatPreferences.filter(
                        (m) => m !== meat.value
                      )
                      : [...filters.meatPreferences, meat.value];
                    const newFilters = { ...filters, meatPreferences: newMeats };
                    setFilters(newFilters);
                    onFilterChange(newFilters);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${filters.meatPreferences.includes(meat.value)
                    ? 'bg-red-500 text-white'
                    : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-red-500/10'
                    }`}
                >
                  <span>{meat.emoji}</span>
                  <span>{meat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Custom Instructions</label>
            <p className="mb-3 text-xs text-[var(--text-secondary)]">
              Add any specific preferences or instructions not covered above
            </p>
            <textarea
              value={filters.customInstructions}
              onChange={(e) => {
                const newFilters = { ...filters, customInstructions: e.target.value };
                setFilters(newFilters);
                onFilterChange(newFilters);
              }}
              placeholder="e.g., prefer organic ingredients, avoid deep-fried foods, prefer local produce, no MSG, prefer smaller portions..."
              rows={4}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-secondary)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 resize-none"
            />
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              These instructions will be considered when recommending dishes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
