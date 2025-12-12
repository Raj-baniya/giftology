import React, { useEffect, useState } from 'react';

export const SnowEffect = () => {
  const [snowflakes, setSnowflakes] = useState<any[]>([]);

  useEffect(() => {
    // Generate snowflakes with more variation
    const flakes = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: Math.random() * 10 + 10,
      animationDelay: Math.random() * 5,
      opacity: Math.random() * 0.6 + 0.3,
      size: Math.random() * 8 + 3,
      drift: Math.random() * 100 - 50
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <>
      <style>
        {snowflakes.map((flake) => `
          @keyframes snowfall-${flake.id} {
            0% {
              transform: translateY(-10vh) translateX(0) rotate(0deg);
            }
            100% {
              transform: translateY(110vh) translateX(${flake.drift}px) rotate(360deg);
            }
          }
        `).join('\n')}
      </style>
      <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute bg-white rounded-full"
            style={{
              left: `${flake.left}%`,
              top: '-20px',
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              opacity: flake.opacity,
              animation: `snowfall-${flake.id} ${flake.animationDuration}s linear infinite`,
              animationDelay: `${flake.animationDelay}s`,
              boxShadow: '0 0 3px rgba(255, 255, 255, 0.8)',
            }}
          />
        ))}
      </div>
    </>
  );
};
