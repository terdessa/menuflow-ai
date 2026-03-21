'use client';

import { useState, useEffect } from 'react';
import DishIcon from './DishIcon';

export default function ProgressiveIcons({ icons = [] }) {
  const [visibleIcons, setVisibleIcons] = useState([]);

  // Deduplicate icons while preserving order
  const deduplicateIcons = (iconArray) => {
    if (!Array.isArray(iconArray)) return [];
    const seen = new Set();
    return iconArray.filter((icon) => {
      if (seen.has(icon)) return false;
      seen.add(icon);
      return true;
    });
  };

  useEffect(() => {
    // Deduplicate icons first
    const uniqueIcons = deduplicateIcons(icons);

    // Progressive icon loading - icons appear one by one
    if (uniqueIcons.length === 0) {
      setVisibleIcons([]);
      return;
    }

    setVisibleIcons([]); // Reset visible icons when icons change
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < uniqueIcons.length) {
        setVisibleIcons((prev) => {
          // Additional check to prevent duplicates in state
          if (prev.includes(uniqueIcons[currentIndex])) {
            return prev;
          }
          return [...prev, uniqueIcons[currentIndex]];
        });
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 150); // 150ms delay between each icon

    return () => clearInterval(interval);
  }, [icons]);

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {visibleIcons.map((iconType, index) => (
        <DishIcon
          key={`icon-${iconType}-${index}`}
          type={iconType}
          className="animate-fade-in"
        />
      ))}
    </div>
  );
}

