'use client';

export default function SkeletonLoader({ className = '' }) {
  return (
    <div
      className={`skeleton rounded-2xl ${className}`}
      style={{ minHeight: '200px' }}
    />
  );
}
