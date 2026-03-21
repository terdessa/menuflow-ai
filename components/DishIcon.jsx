'use client';

import { ICON_TYPES } from '@/lib/constants';

const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
  </svg>
);

const iconConfig = {
  [ICON_TYPES.ALLERGEN_WARNING]: {
    label: 'Contains allergens',
    icon: AlertIcon,
    color: 'bg-[var(--danger-muted)] text-red-400',
  },
  [ICON_TYPES.RECOMMENDED]: {
    label: 'Recommended',
    icon: StarIcon,
    color: 'bg-[var(--primary-glow)] text-[var(--primary)]',
  },
};

export default function DishIcon({ type, className = '' }) {
  const config = iconConfig[type];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${config.color} ${className}`}
      title={config.label}
    >
      <Icon />
      <span className="hidden sm:inline">{config.label}</span>
    </span>
  );
}
