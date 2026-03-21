'use client';

import { ICON_TYPES } from '@/lib/constants';

const iconConfig = {
  [ICON_TYPES.VEGAN]: {
    label: 'Vegan',
    emoji: '🌱',
    color: 'bg-green-100 text-green-700',
  },
  [ICON_TYPES.VEGETARIAN]: {
    label: 'Vegetarian',
    emoji: '🥗',
    color: 'bg-emerald-100 text-emerald-700',
  },
  [ICON_TYPES.PESCATARIAN]: {
    label: 'Pescatarian',
    emoji: '🐟',
    color: 'bg-cyan-100 text-cyan-700',
  },
  [ICON_TYPES.HALAL]: {
    label: 'Halal',
    emoji: '🕌',
    color: 'bg-blue-100 text-blue-700',
  },
  [ICON_TYPES.GLUTEN_FREE]: {
    label: 'Gluten-free',
    emoji: '🌾',
    color: 'bg-amber-100 text-amber-700',
  },
  [ICON_TYPES.SUGAR_FREE]: {
    label: 'Sugar-free',
    emoji: '🍬',
    color: 'bg-pink-100 text-pink-700',
  },
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

