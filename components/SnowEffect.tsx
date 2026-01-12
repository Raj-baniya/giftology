import React, { useEffect, useState } from 'react';

export const SnowEffect = () => {
  // Mobile check (simple user agent check for initial render, or just default to low count)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const flakeCount = isMobile ? 15 : 30; // Reduced from 50

  const snowflakes = Array.from({ length: flakeCount }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDuration: Math.random() * 5 + 5 + 's', // Slower, 5-10s
    animationDelay: Math.random() * 5 + 's',
    opacity: Math.random() * 0.5 + 0.3,
    size: Math.random() * 4 + 2 + 'px' // Smaller flakes
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute bg-white rounded-full animate-snowfall"
          style={{
            left: `${flake.left}%`,
            top: '-10px',
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
          }}
        />
      ))}
    </div>
  );
};
