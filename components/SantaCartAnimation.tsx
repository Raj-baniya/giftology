import React, { useEffect, useState } from 'react';

export const SantaCartAnimation = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleCartAdd = () => {
      setIsVisible(true);
      // Hide after animation completes
      setTimeout(() => setIsVisible(false), 4000);
    };

    window.addEventListener('itemAddedToCart', handleCartAdd);
    return () => window.removeEventListener('itemAddedToCart', handleCartAdd);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <style>
        {`
          @keyframes santa-sleigh-ride {
            0% {
              transform: translateX(-200%) translateY(0) scale(0.8);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            50% {
              transform: translateX(50vw) translateY(-30px) scale(1);
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateX(150vw) translateY(-60px) scale(0.8);
              opacity: 0;
            }
          }
        `}
      </style>

      {/* Santa Sleigh Animation */}
      <div
        className="fixed bottom-32 left-0 z-[10000] pointer-events-none"
        style={{
          animation: 'santa-sleigh-ride 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
        }}
      >
        <img
          src="/santa-sleigh-v2.png"
          alt="Santa's Sleigh"
          className="w-64 h-auto"
          style={{
            filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3))',
            mixBlendMode: 'multiply'
          }}
        />
      </div>
    </>
  );
};
