import React from 'react';

export const LightRays = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
            {/* Base Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-purple-50" />

            {/* Light Rays Container */}
            <div className="absolute inset-0">
                {/* Main Light Source - Top Center */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
                    {/* Ray 1 */}
                    <div
                        className="absolute top-0 left-1/2 w-1 h-full origin-top opacity-20"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(251, 113, 133, 0.4) 0%, rgba(251, 113, 133, 0.2) 30%, transparent 70%)',
                            transform: 'translateX(-50%) rotate(-30deg)',
                            filter: 'blur(20px)',
                        }}
                    />

                    {/* Ray 2 */}
                    <div
                        className="absolute top-0 left-1/2 w-1 h-full origin-top opacity-20"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(192, 132, 252, 0.4) 0%, rgba(192, 132, 252, 0.2) 30%, transparent 70%)',
                            transform: 'translateX(-50%) rotate(-15deg)',
                            filter: 'blur(20px)',
                        }}
                    />

                    {/* Ray 3 */}
                    <div
                        className="absolute top-0 left-1/2 w-1 h-full origin-top opacity-20"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(251, 113, 133, 0.4) 0%, rgba(251, 113, 133, 0.2) 30%, transparent 70%)',
                            transform: 'translateX(-50%) rotate(0deg)',
                            filter: 'blur(20px)',
                        }}
                    />

                    {/* Ray 4 */}
                    <div
                        className="absolute top-0 left-1/2 w-1 h-full origin-top opacity-20"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(192, 132, 252, 0.4) 0%, rgba(192, 132, 252, 0.2) 30%, transparent 70%)',
                            transform: 'translateX(-50%) rotate(15deg)',
                            filter: 'blur(20px)',
                        }}
                    />

                    {/* Ray 5 */}
                    <div
                        className="absolute top-0 left-1/2 w-1 h-full origin-top opacity-20"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(251, 113, 133, 0.4) 0%, rgba(251, 113, 133, 0.2) 30%, transparent 70%)',
                            transform: 'translateX(-50%) rotate(30deg)',
                            filter: 'blur(20px)',
                        }}
                    />

                    {/* Ray 6 - Wider */}
                    <div
                        className="absolute top-0 left-1/2 w-2 h-full origin-top opacity-15"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(251, 113, 133, 0.5) 0%, rgba(251, 113, 133, 0.2) 25%, transparent 60%)',
                            transform: 'translateX(-50%) rotate(-22deg)',
                            filter: 'blur(30px)',
                        }}
                    />

                    {/* Ray 7 - Wider */}
                    <div
                        className="absolute top-0 left-1/2 w-2 h-full origin-top opacity-15"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(192, 132, 252, 0.5) 0%, rgba(192, 132, 252, 0.2) 25%, transparent 60%)',
                            transform: 'translateX(-50%) rotate(22deg)',
                            filter: 'blur(30px)',
                        }}
                    />

                    {/* Animated Ray 1 */}
                    <div
                        className="absolute top-0 left-1/2 w-1.5 h-full origin-top animate-pulse"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(251, 113, 133, 0.6) 0%, rgba(251, 113, 133, 0.3) 20%, transparent 50%)',
                            transform: 'translateX(-50%) rotate(-8deg)',
                            filter: 'blur(25px)',
                            animationDuration: '4s',
                            opacity: 0.25,
                        }}
                    />

                    {/* Animated Ray 2 */}
                    <div
                        className="absolute top-0 left-1/2 w-1.5 h-full origin-top animate-pulse"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(192, 132, 252, 0.6) 0%, rgba(192, 132, 252, 0.3) 20%, transparent 50%)',
                            transform: 'translateX(-50%) rotate(8deg)',
                            filter: 'blur(25px)',
                            animationDuration: '3s',
                            animationDelay: '1s',
                            opacity: 0.25,
                        }}
                    />
                </div>

                {/* Top Glow */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(251, 113, 133, 0.3) 0%, rgba(192, 132, 252, 0.2) 40%, transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                />
            </div>
        </div>
    );
};
