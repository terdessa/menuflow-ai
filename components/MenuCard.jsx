'use client';

import { useState } from 'react';
import Image from 'next/image';
import ProgressiveIcons from './ProgressiveIcons';

export default function MenuCard({ dish, currency, showImages = true }) {
  const formatPrice = (price) => {
    const currencySymbol = currency?.symbol || '$';
    return `${currencySymbol}${price?.toFixed(2) || '0.00'}`;
  };

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

        {/* Icons - Progressive Loading */}
        {dish.icons && dish.icons.length > 0 && (
          <ProgressiveIcons icons={dish.icons} />
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
