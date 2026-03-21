'use client';

import { useState, useEffect } from 'react';
import { ALLERGIES, SPICE_TOLERANCE } from '@/lib/constants';

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
      return prefs.dislikedIngredients
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item);
    }
    return [];
  };

  const buildFilters = (prefs) => ({
    allergies: prefs?.allergies || [],
    customAllergies: prefs?.customAllergies || '',
    excludeIngredients: getExcludeIngredients(prefs),
    spiceTolerance: prefs?.spiceTolerance || 'medium',
  });

  const [filters, setFilters] = useState(buildFilters(preferences));

  useEffect(() => {
    // Sync the local draft when saved preferences change outside the panel.
    setFilters(buildFilters(preferences));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences]);

  const updateFilters = (nextFilters) => {
    setFilters(nextFilters);
    onFilterChange(nextFilters);
  };

  const handleAllergyToggle = (allergy) => {
    const newAllergies = filters.allergies.includes(allergy)
      ? filters.allergies.filter((item) => item !== allergy)
      : [...filters.allergies, allergy];
    updateFilters({ ...filters, allergies: newAllergies });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-xl animate-fade-in">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold">Filters</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onReset && (
              <button
                onClick={() => {
                  const resetFilters = buildFilters(preferences);
                  updateFilters(resetFilters);
                  onReset();
                }}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border)]"
              >
                Reset
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--border)]"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="mb-3 text-lg font-semibold">Allergies</h3>
            <div className="mb-4 flex flex-wrap gap-3">
              {ALLERGIES.map((allergy) => (
                <button
                  key={allergy.value}
                  onClick={() => handleAllergyToggle(allergy.value)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                    filters.allergies.includes(allergy.value)
                      ? 'bg-red-500 text-white'
                      : 'bg-[var(--border)] text-[var(--foreground)] hover:bg-red-500/10'
                  }`}
                >
                  {allergy.label}
                </button>
              ))}
            </div>
            <label className="mb-2 block text-sm font-medium">
              Additional Allergies
            </label>
            <input
              type="text"
              placeholder="e.g., shellfish, sesame, sulfites"
              value={filters.customAllergies}
              onChange={(e) =>
                updateFilters({ ...filters, customAllergies: e.target.value })
              }
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold">Spice Tolerance</h3>
            <div className="flex flex-wrap gap-3">
              {SPICE_TOLERANCE.map((level) => (
                <button
                  key={level.value}
                  onClick={() =>
                    updateFilters({ ...filters, spiceTolerance: level.value })
                  }
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                    filters.spiceTolerance === level.value
                      ? `${level.color} text-white`
                      : 'bg-[var(--border)] text-[var(--foreground)] hover:opacity-80'
                  }`}
                >
                  <span>{level.emoji}</span>
                  <span>{level.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-semibold">Food Preferences</h3>
            <label className="mb-2 block text-sm font-medium">
              Ingredients to Exclude
            </label>
            <input
              type="text"
              placeholder="e.g., onions, garlic, mushrooms"
              value={filters.excludeIngredients.join(', ')}
              onChange={(e) =>
                updateFilters({
                  ...filters,
                  excludeIngredients: e.target.value
                    .split(',')
                    .map((item) => item.trim())
                    .filter((item) => item),
                })
              }
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
