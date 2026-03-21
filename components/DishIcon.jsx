'use client';

import { ICON_TYPES } from '@/lib/constants';

const iconConfig = {
  [ICON_TYPES.ALLERGEN_WARNING]: {
    label: 'Contains allergens',
    emoji: '⚠️',
    color: 'bg-red-100 text-red-700',
  },
  [ICON_TYPES.RECOMMENDED]: {
    label: 'Recommended for you',
    emoji: '⭐',
    color: 'bg-purple-100 text-purple-700',
  },
};

export default function DishIcon({ type, className = '' }) {
  const config = iconConfig[type];
  if (!config) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${config.color} ${className}`}
      title={config.label}
    >
      <span>{config.emoji}</span>
      <span className="hidden sm:inline">{config.label}</span>
    </span>
  );
}
