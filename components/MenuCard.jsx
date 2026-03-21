'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import ProgressiveIcons from './ProgressiveIcons';

const SPICE_LABELS = {
  none: 'No spice',
  mild: 'Mild',
  medium: 'Medium',
  hot: 'Hot',
  'very-hot': 'Very Hot',
};

const SPICE_COLORS = {
  none: 'bg-emerald-500',
  mild: 'bg-yellow-400',
  medium: 'bg-orange-500',
  hot: 'bg-red-500',
  'very-hot': 'bg-red-600',
};

const ChevronDown = ({ open }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
  >
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const AlertTriangle = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
  </svg>
);

function getPersonalizationLabel(status) {
  if (status === 'avoid') return 'Avoid';
  if (status === 'caution') return 'Caution';
  return 'Match';
}

function getPersonalizationTone(status) {
  if (status === 'avoid') return 'bg-[var(--danger-muted)] text-red-400';
  if (status === 'caution') return 'bg-[var(--warning-muted)] text-amber-400';
  return 'bg-[var(--success-muted)] text-emerald-400';
}

export default function MenuCard({
  dish,
  sectionName,
  currency,
  showImages = true,
  staggerClass = '',
}) {
  const [showAllergens, setShowAllergens] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const formatPrice = (price) => {
    const currencySymbol = currency?.symbol || '$';
    return `${currencySymbol}${price?.toFixed(2) || '0.00'}`;
  };

  const filterProperties = dish.filterProperties || {};
  const spiceLevel = filterProperties.spiceLevel;
  const allergens = Array.isArray(filterProperties.allergies)
    ? filterProperties.allergies
    : [];
  const dietaryTags = [];
  if (filterProperties.isVegetarian) dietaryTags.push('Vegetarian');
  if (filterProperties.isVegan) dietaryTags.push('Vegan');
  if (filterProperties.isGlutenFree) dietaryTags.push('GF');
  if (filterProperties.isHalal) dietaryTags.push('Halal');
  if (filterProperties.isPescatarian) dietaryTags.push('Pesc.');

  const isTaggableSection = sectionName !== 'Drinks' && sectionName !== 'Desserts';
  const displayIcons = Array.isArray(dish.icons)
    ? dish.icons.filter((icon) => icon !== 'allergen-warning')
    : [];
  const nutritionItems = getNutritionItems(dish?.nutritionPer100g);
  const personalization = dish.personalization || null;

  return (
    <div
      ref={cardRef}
      className={`overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] transition-all duration-300 hover:border-[var(--border-hover)] ${
        isVisible ? 'animate-fade-in-up' : 'opacity-0'
      } ${staggerClass}`}
    >
      {/* Hero Image */}
      {showImages && (
        <div className="relative aspect-square w-full overflow-hidden bg-[var(--surface)]">
          {dish.imageUrl ? (
            <DishImage imageUrl={dish.imageUrl} alt={dish.name} />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--card-bg)] to-transparent" />
          {/* Personalization badge overlay */}
          {personalization && (
            <div className="absolute top-2 right-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getPersonalizationTone(personalization.status)}`}>
                {getPersonalizationLabel(personalization.status)} {personalization.score}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="space-y-2 px-3 pt-2 pb-3">
        <div>
          <h3 className="text-sm font-semibold leading-tight text-[var(--foreground)] line-clamp-2">
            {dish.name}
          </h3>
          <span className="text-sm font-bold text-[var(--primary)]">
            {formatPrice(dish.price)}
          </span>
        </div>

        {/* Personalization reasons */}
        {personalization?.reasons?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {personalization.reasons.map((reason) => (
              <span
                key={reason}
                className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[9px] text-[var(--text-muted)]"
              >
                {reason}
              </span>
            ))}
          </div>
        )}

        {/* Tags Row */}
        {isTaggableSection && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${SPICE_COLORS[spiceLevel] || SPICE_COLORS.none}`} />
              {SPICE_LABELS[spiceLevel] || SPICE_LABELS.none}
            </span>
            {dietaryTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {dish.ingredients && (
          <p className="line-clamp-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
            {dish.ingredients}
          </p>
        )}

        {/* Expandable: Allergens */}
        {isTaggableSection && (
          <button
            type="button"
            onClick={() => setShowAllergens((v) => !v)}
            className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-[var(--surface)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--card-bg-hover)]"
          >
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-secondary)]">
              <span className="text-[var(--danger)]"><AlertTriangle /></span>
              Allergens
              {allergens.length > 0 && (
                <span className="rounded-full bg-[var(--danger-muted)] px-1 py-0.5 text-[9px] font-semibold text-[var(--danger)]">
                  {allergens.length}
                </span>
              )}
            </span>
            <ChevronDown open={showAllergens} />
          </button>
        )}

        {showAllergens && (
          <div className="animate-expand rounded-lg border border-red-500/20 bg-[var(--danger-muted)] px-2 py-2">
            {allergens.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {allergens.map((allergen) => (
                  <span
                    key={allergen}
                    className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400"
                  >
                    {allergen}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-[var(--text-muted)]">
                No common allergens identified.
              </p>
            )}
          </div>
        )}

        {/* Expandable: Nutrition */}
        {nutritionItems.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowNutrition((v) => !v)}
              className="flex w-full cursor-pointer items-center justify-between rounded-lg bg-[var(--surface)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--card-bg-hover)]"
            >
              <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                Nutrition
              </span>
              <ChevronDown open={showNutrition} />
            </button>

            {showNutrition && (
              <div className="animate-expand grid grid-cols-2 gap-1">
                {nutritionItems.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-lg px-2 py-1.5 text-center ${item.toneClass}`}
                  >
                    <p className="text-[9px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      {item.label}
                    </p>
                    <p className="text-[11px] font-semibold text-[var(--foreground)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {displayIcons.length > 0 && <ProgressiveIcons icons={displayIcons} />}
      </div>
    </div>
  );
}

function getNutritionItems(nutritionPer100g) {
  if (!nutritionPer100g) return [];

  return [
    { label: 'Cal', metric: 'calories', value: formatNutritionValue(nutritionPer100g.calories, 'kcal', 0) },
    { label: 'Protein', metric: 'protein', value: formatNutritionValue(nutritionPer100g.protein, 'g', 1) },
    { label: 'Carbs', metric: 'carbs', value: formatNutritionValue(nutritionPer100g.carbs, 'g', 1) },
    { label: 'Fat', metric: 'fat', value: formatNutritionValue(nutritionPer100g.fat, 'g', 1) },
  ].map((item) => {
    const numericValue = nutritionPer100g[item.metric];
    const hasValue = typeof numericValue === 'number' && Number.isFinite(numericValue);
    const level = item.metric === 'calories' ? null : getNutritionLevel(item.metric, numericValue);

    return {
      ...item,
      value: item.value ?? '--',
      level,
      toneClass: getNutritionToneClass(item.metric, level, hasValue),
    };
  });
}

function formatNutritionValue(value, unit, decimals) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const formatted = decimals === 0 ? Math.round(value).toString() : value.toFixed(decimals);
  return `${formatted}${unit}`;
}

function getNutritionLevel(metric, value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'mid';
  const thresholds = {
    calories: { low: 120, high: 240 },
    protein: { low: 5, high: 15 },
    carbs: { low: 10, high: 25 },
    fat: { low: 3, high: 17.5 },
  };
  const t = thresholds[metric];
  if (!t) return 'mid';
  if (value < t.low) return 'low';
  if (value >= t.high) return 'high';
  return 'mid';
}

function getNutritionToneClass(metric, level, hasValue) {
  if (!hasValue) return 'bg-[var(--surface)]';
  if (metric === 'calories' || metric === 'carbs') return 'bg-[var(--surface)]';

  if (metric === 'fat') {
    if (level === 'low') return 'bg-[var(--success-muted)]';
    if (level === 'high') return 'bg-[var(--danger-muted)]';
    return 'bg-[var(--surface)]';
  }

  if (level === 'low') return 'bg-[var(--danger-muted)]';
  if (level === 'high') return 'bg-[var(--success-muted)]';
  return 'bg-[var(--surface)]';
}

function DishImage({ imageUrl, alt }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[var(--surface)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
      </div>
    );
  }

  return (
    <>
      {!imageLoaded && (
        <div className="absolute inset-0 skeleton" />
      )}
      <Image
        src={imageUrl}
        alt={alt}
        fill
        unoptimized
        sizes="(max-width: 768px) 50vw, 336px"
        className={`object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageFailed(true);
          setImageLoaded(false);
        }}
      />
    </>
  );
}
