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
  const formatPrice = (price) => {
    const currencySymbol = currency?.symbol || '$';
    return `${currencySymbol}${price?.toFixed(2) || '0.00'}`;
  };

  const [showAllergens, setShowAllergens] = useState(false);
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

        {/* Icons - Progressive Loading */}
        {displayIcons.length > 0 && (
          <ProgressiveIcons icons={displayIcons} />
        )}
      </div>
    </div>
  );
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
