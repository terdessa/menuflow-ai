'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { getPreferences, savePreferences } from '@/lib/storage';
import { DIET_TYPES, ALLERGIES, CURRENCIES, LANGUAGES, SPICE_TOLERANCE, ALCOHOL_TYPES, IMAGE_STYLES, DISH_CATEGORIES, SPEED_PREFERENCES, COOKING_STYLES, PORTION_SHARING, TASTE_PREFERENCES, MEAT_PREFERENCES } from '@/lib/constants';

const DEFAULT_PREFERENCES = {
  dietTypes: [],
  customDietTypes: '',
  allergies: [],
  customAllergies: '',
  likedIngredients: '',
  dislikedIngredients: '',
  currency: 'GBP',
  language: 'en',
  spiceTolerance: 'medium',
  alcoholEnabled: true,
  alcoholTypes: ['wine', 'beer', 'cocktail', 'prosecco', 'spirits', 'champagne', 'sake', 'cider'],
  imagesEnabled: true,
  imageStyle: 'detailed',
  imageCategories: ['starters', 'mains', 'desserts', 'drinks', 'soups', 'salads'],
  speedPreference: 'normal',
  cookingStyles: [],
  portionSharing: 'alone',
  tastePreferences: [],
  meatPreferences: [],
  customInstructions: '',
};

export default function ProfilePage() {
  const [preferences, setPreferences] = useState(() => {
    const stored = getPreferences();
    return stored ? { ...DEFAULT_PREFERENCES, ...stored } : DEFAULT_PREFERENCES;
  });
  const [saved, setSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleDietToggle = (diet) => {
    const newDietTypes = preferences.dietTypes.includes(diet)
      ? preferences.dietTypes.filter((d) => d !== diet)
      : [...preferences.dietTypes, diet];
    setPreferences({ ...preferences, dietTypes: newDietTypes });
    setSaved(false);
  };

  const handleAllergyToggle = (allergy) => {
    const newAllergies = preferences.allergies.includes(allergy)
      ? preferences.allergies.filter((a) => a !== allergy)
      : [...preferences.allergies, allergy];
    setPreferences({ ...preferences, allergies: newAllergies });
    setSaved(false);
  };

  const handleSave = () => {
    savePreferences(preferences);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedCurrency = CURRENCIES.find((c) => c.value === preferences.currency);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold">Your Preferences</h2>
          <p className="text-[var(--text-secondary)]">
            Set your default preferences that will be used across all menus
          </p>
        </div>

        <div className="space-y-8">
          {/* BASIC SETUP SECTION */}
          <div>
            <h2 className="mb-6 text-2xl font-bold">Basic Setup</h2>
            <div className="space-y-8">
              {/* Diet / Lifestyle */}
              <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-semibold">Diet / Lifestyle</h3>
                <p className="mb-4 text-sm text-[var(--text-secondary)]">
                  Select all that apply
                </p>
                <div className="mb-4 flex flex-wrap gap-3">
                  {DIET_TYPES.map((diet) => (
                    <button
                      key={diet.value}
                      onClick={() => handleDietToggle(diet.value)}
                      className={`rounded-full px-5 py-2.5 font-medium transition-all ${
                        preferences.dietTypes.includes(diet.value)
                          ? 'bg-[var(--primary)] text-white shadow-md'
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
                    value={preferences.customDietTypes}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        customDietTypes: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    Enter additional diet or lifestyle preferences separated by commas
                  </p>
                </div>
              </section>

              {/* Allergies */}
              <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-semibold">Allergies</h3>
                <div className="mb-4 flex flex-wrap gap-3">
                  {ALLERGIES.map((allergy) => (
                    <button
                      key={allergy.value}
                      onClick={() => handleAllergyToggle(allergy.value)}
                      className={`rounded-full px-5 py-2.5 font-medium transition-all ${
                        preferences.allergies.includes(allergy.value)
                          ? 'bg-red-500 text-white shadow-md'
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
                    value={preferences.customAllergies}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        customAllergies: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    Enter additional allergies separated by commas
                  </p>
                </div>
              </section>

              {/* Home Currency */}
              <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-semibold">Home Currency</h3>
                <select
                  value={preferences.currency}
                  onChange={(e) =>
                    setPreferences({ ...preferences, currency: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr.value} value={curr.value}>
                      {curr.label}
                    </option>
                  ))}
                </select>
                {selectedCurrency && (
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Prices will be displayed in {selectedCurrency.label} by default
                  </p>
                )}
              </section>

              {/* Language Preference */}
              <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-semibold">Menu Language</h3>
                <select
                  value={preferences.language}
                  onChange={(e) =>
                    setPreferences({ ...preferences, language: e.target.value })
                  }
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Menus will be translated into this language by default
                </p>
              </section>

              {/* Spice Tolerance */}
              <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
                <h3 className="mb-4 text-xl font-semibold">Spice Tolerance</h3>
                <p className="mb-4 text-sm text-[var(--text-secondary)]">
                  Select your preferred spice level
                </p>
                <div className="flex flex-wrap gap-3">
                  {SPICE_TOLERANCE.map((level) => (
                    <button
                      key={level.value}
                      onClick={() =>
                        setPreferences({
                          ...preferences,
                          spiceTolerance: level.value,
                        })
                      }
                      className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-medium transition-all ${
                        preferences.spiceTolerance === level.value
                          ? `${level.color} text-white shadow-md`
                          : 'bg-[var(--border)] text-[var(--foreground)] hover:opacity-80'
                      }`}
                    >
                      <span>{level.emoji}</span>
                      <span>{level.label}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-sm text-[var(--text-secondary)]">
                  Dishes will be recommended based on your spice tolerance
                </p>
              </section>
            </div>
          </div>

          {/* ADVANCED PERSONALIZATION SECTION */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mb-6 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-[var(--border)]/50"
            >
              <span className="text-xl text-[var(--text-secondary)] transition-transform">
                {showAdvanced ? '▼' : '▶'}
              </span>
              <h2 className="text-2xl font-bold">Advanced Personalization</h2>
            </button>

            {showAdvanced && (
              <div className="space-y-8 animate-fade-in">
                {/* Food Preferences */}
                <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
                  <h3 className="mb-4 text-xl font-semibold">Food Preferences</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Ingredients you like
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., tomatoes, basil, cheese"
                        value={preferences.likedIngredients}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            likedIngredients: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Ingredients you dislike
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., cilantro, olives, anchovies"
                        value={preferences.dislikedIngredients}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            dislikedIngredients: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      />
                    </div>
                  </div>
                </section>

                {/* Alcohol Preference */}
                <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">Alcohol</h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Enable to see alcoholic drinks
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const newEnabled = !preferences.alcoholEnabled;
                        setPreferences({
                          ...preferences,
                          alcoholEnabled: newEnabled,
                          alcoholTypes: newEnabled
                            ? ALCOHOL_TYPES.map((type) => type.value)
                            : [],
                        });
                      }}
                      className={`relative h-8 w-14 rounded-full transition-colors ${
                        preferences.alcoholEnabled ? 'bg-purple-500' : 'bg-[var(--border)]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition-transform ${
                          preferences.alcoholEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {preferences.alcoholEnabled && (
                    <>
                      <p className="mb-2 text-sm text-[var(--text-secondary)]">
                        Select your preferred drink types
                      </p>
                      <p className="mb-4 text-xs text-[var(--text-secondary)] italic">
                        All types are enabled by default
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {ALCOHOL_TYPES.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => {
                              const newTypes = preferences.alcoholTypes.includes(type.value)
                                ? preferences.alcoholTypes.filter((t) => t !== type.value)
                                : [...preferences.alcoholTypes, type.value];
                              setPreferences({
                                ...preferences,
                                alcoholTypes: newTypes,
                              });
                            }}
                            className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-medium transition-all ${
                              preferences.alcoholTypes.includes(type.value)
                                ? 'bg-purple-500 text-white shadow-md'
                                : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-purple-500/10'
                            }`}
                          >
                            <span>{type.emoji}</span>
                            <span>{type.label}</span>
                          </button>
                        ))}
                      </div>
                      <p className="mt-4 text-sm text-[var(--text-secondary)]">
                        Drinks will be filtered based on your selection
                      </p>
                    </>
                  )}
                </section>

                {/* Image Preferences */}
                <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">Dish Images</h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Enable to show dish images on menus
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setPreferences({
                          ...preferences,
                          imagesEnabled: !preferences.imagesEnabled,
                        })
                      }
                      className={`relative h-8 w-14 rounded-full transition-colors ${
                        preferences.imagesEnabled ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition-transform ${
                          preferences.imagesEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {preferences.imagesEnabled && (
                    <>
                      <p className="mb-4 text-sm text-[var(--text-secondary)]">
                        Choose your preferred image style
                      </p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {IMAGE_STYLES.map((style) => (
                          <button
                            key={style.value}
                            onClick={() =>
                              setPreferences({
                                ...preferences,
                                imageStyle: style.value,
                              })
                            }
                            className={`group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all ${
                              preferences.imageStyle === style.value
                                ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                                : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                            }`}
                          >
                            {/* Placeholder for example image */}
                            <div className="mb-3 aspect-video w-full overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200">
                              <div className="flex h-full items-center justify-center text-4xl opacity-50">
                                {style.emoji}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{style.emoji}</span>
                              <span className="font-semibold">{style.label}</span>
                            </div>
                            {preferences.imageStyle === style.value && (
                              <div className="absolute right-2 top-2 h-5 w-5 rounded-full bg-[var(--primary)] flex items-center justify-center">
                                <span className="text-xs text-white">✓</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="mt-6">
                        <p className="mb-4 text-sm font-semibold">
                          Generate images for:
                        </p>
                        <p className="mb-3 text-xs text-[var(--text-secondary)] italic">
                          All categories are selected by default
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {DISH_CATEGORIES.map((category) => (
                            <button
                              key={category.value}
                              onClick={() => {
                                const newCategories = preferences.imageCategories.includes(
                                  category.value
                                )
                                  ? preferences.imageCategories.filter(
                                      (c) => c !== category.value
                                    )
                                  : [...preferences.imageCategories, category.value];
                                setPreferences({
                                  ...preferences,
                                  imageCategories: newCategories,
                                });
                              }}
                              className={`flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-all ${
                                preferences.imageCategories.includes(category.value)
                                  ? 'bg-[var(--primary)] text-white shadow-md'
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
                </section>

                {/* Meat Preferences */}
                <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
                  <h3 className="mb-4 text-xl font-semibold">Meat Preferences</h3>
                  <p className="mb-4 text-sm text-[var(--text-secondary)]">
                    Select all that apply
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {MEAT_PREFERENCES.map((meat) => (
                      <button
                        key={meat.value}
                        onClick={() => {
                          const newMeats = preferences.meatPreferences.includes(
                            meat.value
                          )
                            ? preferences.meatPreferences.filter(
                                (m) => m !== meat.value
                              )
                            : [...preferences.meatPreferences, meat.value];
                          setPreferences({
                            ...preferences,
                            meatPreferences: newMeats,
                          });
                        }}
                        className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-medium transition-all ${
                          preferences.meatPreferences.includes(meat.value)
                            ? 'bg-red-500 text-white shadow-md'
                            : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-red-500/10'
                        }`}
                      >
                        <span>{meat.emoji}</span>
                        <span>{meat.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-[var(--text-secondary)]">
                    Dishes will be recommended based on your meat preferences
                  </p>
                </section>

                {/* Taste Preferences */}
                <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
                  <h3 className="mb-4 text-xl font-semibold">Taste Preferences</h3>
                  <p className="mb-4 text-sm text-[var(--text-secondary)]">
                    Select all that apply
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {TASTE_PREFERENCES.map((taste) => (
                      <button
                        key={taste.value}
                        onClick={() => {
                          const newTastes = preferences.tastePreferences.includes(
                            taste.value
                          )
                            ? preferences.tastePreferences.filter(
                                (t) => t !== taste.value
                              )
                            : [...preferences.tastePreferences, taste.value];
                          setPreferences({
                            ...preferences,
                            tastePreferences: newTastes,
                          });
                        }}
                        className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-medium transition-all ${
                          preferences.tastePreferences.includes(taste.value)
                            ? 'bg-pink-500 text-white shadow-md'
                            : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-pink-500/10'
                        }`}
                      >
                        <span>{taste.emoji}</span>
                        <span>{taste.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-[var(--text-secondary)]">
                    Dishes will be recommended based on your taste preferences
                  </p>
                </section>

                {/* Cooking Style Preferences */}
                <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
                  <h3 className="mb-4 text-xl font-semibold">Cooking Style Preferences</h3>
                  <p className="mb-4 text-sm text-[var(--text-secondary)]">
                    Select all that apply
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {COOKING_STYLES.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => {
                          const newStyles = preferences.cookingStyles.includes(
                            style.value
                          )
                            ? preferences.cookingStyles.filter(
                                (s) => s !== style.value
                              )
                            : [...preferences.cookingStyles, style.value];
                          setPreferences({
                            ...preferences,
                            cookingStyles: newStyles,
                          });
                        }}
                        className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-medium transition-all ${
                          preferences.cookingStyles.includes(style.value)
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-amber-500/10'
                        }`}
                      >
                        <span>{style.emoji}</span>
                        <span>{style.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-[var(--text-secondary)]">
                    Dishes will be recommended based on your cooking style preferences
                  </p>
                </section>

                {/* Speed Preference */}
                <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
                  <h3 className="mb-4 text-xl font-semibold">Speed Preference</h3>
                  <p className="mb-4 text-sm text-[var(--text-secondary)]">
                    Select your preferred meal timing
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {SPEED_PREFERENCES.map((speed) => (
                      <button
                        key={speed.value}
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            speedPreference: speed.value,
                          })
                        }
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 px-5 py-4 font-medium transition-all ${
                          preferences.speedPreference === speed.value
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-md'
                            : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                        }`}
                      >
                        <span className="text-3xl">{speed.emoji}</span>
                        <span className="font-semibold">{speed.label}</span>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {speed.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Portion Sharing */}
                <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
                  <h3 className="mb-4 text-xl font-semibold">Portion Sharing</h3>
                  <p className="mb-4 text-sm text-[var(--text-secondary)]">
                    How many people are eating together?
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {PORTION_SHARING.map((portion) => (
                      <button
                        key={portion.value}
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            portionSharing: portion.value,
                          })
                        }
                        className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-medium transition-all ${
                          preferences.portionSharing === portion.value
                            ? 'bg-indigo-500 text-white shadow-md'
                            : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-indigo-500/10'
                        }`}
                      >
                        <span>{portion.emoji}</span>
                        <span>{portion.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-[var(--text-secondary)]">
                    Portion sizes and sharing dishes will be recommended accordingly
                  </p>
                </section>

                {/* Custom Instructions */}
                <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
                  <h3 className="mb-4 text-xl font-semibold">Custom Instructions</h3>
                  <p className="mb-4 text-sm text-[var(--text-secondary)]">
                    Add any specific preferences or instructions not covered above
                  </p>
                  <textarea
                    value={preferences.customInstructions}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        customInstructions: e.target.value,
                      })
                    }
                    placeholder="e.g., prefer organic ingredients, avoid deep-fried foods, prefer local produce, no MSG, prefer smaller portions..."
                    rows={5}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--text-secondary)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 resize-none"
                  />
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    These instructions will be considered when recommending dishes
                  </p>
                </section>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className={`rounded-lg px-6 py-3 font-semibold text-white transition-all ${
                saved
                  ? 'bg-green-500'
                  : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-md hover:shadow-lg'
              }`}
            >
              {saved ? '✓ Saved!' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </main>
      <Navigation />
    </div>
  );
}
