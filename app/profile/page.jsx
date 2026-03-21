'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { getPreferences, savePreferences } from '@/lib/storage';
import { ALLERGIES, SPICE_TOLERANCE } from '@/lib/constants';

const DEFAULT_PREFERENCES = {
  allergies: [],
  customAllergies: '',
  likedIngredients: '',
  dislikedIngredients: '',
  spiceTolerance: 'medium',
};

export default function ProfilePage() {
  const [preferences, setPreferences] = useState(() => {
    const stored = getPreferences();
    return stored ? { ...DEFAULT_PREFERENCES, ...stored } : DEFAULT_PREFERENCES;
  });
  const [saved, setSaved] = useState(false);

  const handleAllergyToggle = (allergy) => {
    const newAllergies = preferences.allergies.includes(allergy)
      ? preferences.allergies.filter((item) => item !== allergy)
      : [...preferences.allergies, allergy];
    setPreferences({ ...preferences, allergies: newAllergies });
    setSaved(false);
  };

  const handleSave = () => {
    savePreferences(preferences);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold">Your Preferences</h2>
          <p className="text-[var(--text-secondary)]">
            Set only the preferences that affect menu filtering and interpretation.
          </p>
        </div>

        <div className="space-y-8">
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
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold">Spice Tolerance</h3>
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
          </section>

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

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className={`rounded-lg px-6 py-3 font-semibold text-white transition-all ${
                saved
                  ? 'bg-green-500'
                  : 'bg-[var(--primary)] shadow-md hover:bg-[var(--primary-hover)] hover:shadow-lg'
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
