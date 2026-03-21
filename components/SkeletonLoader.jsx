'use client';

export default function SkeletonLoader({ className = '' }) {
  return (
    <div
      className={`skeleton rounded-lg bg-[var(--border)] ${className}`}
      style={{ minHeight: '200px' }}
    />
  );
}

