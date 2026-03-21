'use client';

import { useState } from 'react';
import Image from 'next/image';
import ProgressiveIcons from './ProgressiveIcons';

const SPICE_LABELS = {
  none: 'No spice',
  mild: 'Mild',
  medium: 'Medium',
  hot: 'Hot',
  'very-hot': 'Very Hot',
};

const SPICE_STYLES = {
  none: 'bg-green-100 text-green-800',
  mild: 'bg-yellow-100 text-yellow-800',
  medium: 'bg-orange-100 text-orange-800',
  hot: 'bg-red-100 text-red-800',
  'very-hot': 'bg-red-200 text-red-900',
};

const SPICE_EMOJIS = {
  none: '🟢',
  mild: '🟡',
  medium: '🟠',
  hot: '🔴',
  'very-hot': '🌶️',
};

export default function MenuCard({
  dish,
  sectionName,
  currency,
  showImages = true,
}) {
  const [showAllergens, setShowAllergens] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);

  const formatPrice = (price) => {
    const currencySymbol = currency?.symbol || '$';
    return `${currencySymbol}${price?.toFixed(2) || '0.00'}`;
  };

  const filterProperties = dish.filterProperties || {};
  const spiceLevel = filterProperties.spiceLevel;
  const allergens = Array.isArray(filterProperties.allergies)
    ? filterProperties.allergies
    : [];
  const isTaggableSection =
    sectionName !== 'Drinks' && sectionName !== 'Desserts';
  const displayIcons = Array.isArray(dish.icons)
    ? dish.icons.filter((icon) => icon !== 'allergen-warning')
    : [];
  const nutritionItems = getNutritionItems(dish?.nutritionPer100g);

  return (
    <div className="group animate-fade-in rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-sm transition-all hover:shadow-md">
      {showImages && (
        <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg bg-[var(--border)]">
          {dish.imageUrl ? (
            <DishImage imageUrl={dish.imageUrl} alt={dish.name} />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--primary)]"></div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[var(--foreground)]">{dish.name}</h3>
          <span className="text-lg font-bold whitespace-nowrap text-[var(--primary)]">
            {formatPrice(dish.price)}
          </span>
        </div>

        {dish.ingredients && (
          <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">
            {dish.ingredients}
          </p>
        )}

        {isTaggableSection && (
          <div className="flex flex-wrap gap-2 pt-1">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                SPICE_STYLES[spiceLevel] || SPICE_STYLES.none
              }`}
            >
              <span className="mr-1.5">
                {SPICE_EMOJIS[spiceLevel] || SPICE_EMOJIS.none}
              </span>
              <span>{SPICE_LABELS[spiceLevel] || SPICE_LABELS.none}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAllergens((value) => !value)}
              className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
            >
              Possible Allergens
            </button>
          </div>
        )}

        {isTaggableSection && showAllergens && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-900">
            <p className="mb-2 font-medium">Possible Allergens</p>
            {allergens.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allergens.map((allergen) => (
                  <span
                    key={allergen}
                    className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-red-700"
                  >
                    {allergen}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-red-800">
                No common allergens identified from the available menu text.
              </p>
            )}
          </div>
        )}

        {nutritionItems.length > 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)]/70 p-3">
            <button
              type="button"
              onClick={() => setShowNutrition((prev) => !prev)}
              className="flex w-full items-center justify-between text-left"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                Approx. per 100g
              </p>
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                {showNutrition ? 'Hide' : 'Show'}
              </span>
            </button>
            {showNutrition && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {nutritionItems.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-md border px-2 py-2 text-center ${item.toneClass}`}
                  >
                    <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {displayIcons.length > 0 && <ProgressiveIcons icons={displayIcons} />}
      </div>
    </div>
  );
}

function getNutritionItems(nutritionPer100g) {
  if (!nutritionPer100g) return [];

  return [
    {
      label: 'Calories',
      metric: 'calories',
      value: formatNutritionValue(nutritionPer100g.calories, 'kcal', 0),
    },
    {
      label: 'Protein',
      metric: 'protein',
      value: formatNutritionValue(nutritionPer100g.protein, 'g', 1),
    },
    {
      label: 'Carbs',
      metric: 'carbs',
      value: formatNutritionValue(nutritionPer100g.carbs, 'g', 1),
    },
    {
      label: 'Fat',
      metric: 'fat',
      value: formatNutritionValue(nutritionPer100g.fat, 'g', 1),
    },
  ].map((item) => {
    const numericValue = nutritionPer100g[item.metric];
    const hasValue = typeof numericValue === 'number' && Number.isFinite(numericValue);
    const level =
      item.metric === 'calories' ? null : getNutritionLevel(item.metric, numericValue);

    return {
      ...item,
      value: item.value ?? '--',
      level,
      toneClass: getNutritionToneClass(item.metric, level, hasValue),
    };
  });
}

function formatNutritionValue(value, unit, decimals) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const formatted =
    decimals === 0 ? Math.round(value).toString() : value.toFixed(decimals);

  return `${formatted}${unit}`;
}

function getNutritionLevel(metric, value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'mid';
  }

  const thresholds = {
    calories: { low: 120, high: 240 },
    protein: { low: 5, high: 15 },
    carbs: { low: 10, high: 25 },
    fat: { low: 3, high: 17.5 },
  };

  const metricThresholds = thresholds[metric];
  if (!metricThresholds) {
    return 'mid';
  }

  if (value < metricThresholds.low) {
    return 'low';
  }

  if (value >= metricThresholds.high) {
    return 'high';
  }

  return 'mid';
}

function getNutritionToneClass(metric, level, hasValue) {
  if (!hasValue) {
    return 'border-slate-200 bg-slate-50/90';
  }

  if (metric === 'calories' || metric === 'carbs') {
    return 'border-slate-200 bg-slate-50/90';
  }

  if (metric === 'fat') {
    if (level === 'low') {
      return 'border-emerald-200 bg-emerald-50/90';
    }

    if (level === 'high') {
      return 'border-red-200 bg-red-50/90';
    }

    return 'border-slate-200 bg-white/95';
  }

  if (level === 'low') {
    return 'border-red-200 bg-red-50/90';
  }

  if (level === 'high') {
    return 'border-emerald-200 bg-emerald-50/90';
  }

  return 'border-slate-200 bg-white/95';
}

function DishImage({ imageUrl, alt }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <>
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--border)]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--border)] border-t-[var(--primary)]"></div>
        </div>
      )}
      <Image
        src={imageUrl}
        alt={alt}
        fill
        unoptimized
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageFailed(true);
          setImageLoaded(false);
        }}
      />
    </>
  );
}
