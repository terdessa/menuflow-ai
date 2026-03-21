'use client';

import { useState } from 'react';
import Image from 'next/image';
import ProgressiveIcons from './ProgressiveIcons';

export default function MenuCard({ dish, currency, showImages = true }) {
  const [showNutrition, setShowNutrition] = useState(false);

  const formatPrice = (price) => {
    const currencySymbol = currency?.symbol || '$';
    return `${currencySymbol}${price?.toFixed(2) || '0.00'}`;
  };

  const nutritionItems = getNutritionItems(dish?.nutritionPer100g);

  return (
    <div className="group animate-fade-in rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-sm transition-all hover:shadow-md">
      {/* Image Section */}
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

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[var(--foreground)]">{dish.name}</h3>
          <span className="text-lg font-bold text-[var(--primary)] whitespace-nowrap">
            {formatPrice(dish.price)}
          </span>
        </div>

        {dish.ingredients && (
          <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
            {dish.ingredients}
          </p>
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

        {/* Icons - Progressive Loading */}
        {dish.icons && dish.icons.length > 0 && (
          <ProgressiveIcons icons={dish.icons} />
        )}
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
  ]
    .map((item) => {
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
