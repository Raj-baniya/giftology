import React from 'react';

export const SpaceBackground = () => {
    return (
        <div className="space-background">
            <div className="space-aurora animate-aurora"></div>
            <div className="space-noise"></div>
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="star animate-sparkle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            width: `${Math.random() * 2 + 1}px`,
                            height: `${Math.random() * 2 + 1}px`,
                            background: '#F4E6D0',
                            opacity: 0.6,
                            animationDuration: `${Math.random() * 3 + 2}s`,
                            animationDelay: `${Math.random() * 2}s`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
};
