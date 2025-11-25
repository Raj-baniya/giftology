import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedGradientBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden">
            {/* Animated gradient blobs */}
            <motion.div
                className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
                animate={{
                    x: [0, -100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
                animate={{
                    x: [-100, 100, -100],
                    y: [-50, 50, -50],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Base gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50" />
        </div>
    );
};

export const ParticleBackground: React.FC = () => {
    const particles = Array.from({ length: 20 }, (_, i) => i);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
            {particles.map((i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-40"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        x: [0, Math.random() * 20 - 10, 0],
                        scale: [1, 1.5, 1],
                        opacity: [0.2, 0.6, 0.2],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 4,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
};

export const DeliveryCarAnimation: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
    return (
        <div className="relative w-full h-32 md:h-40 overflow-hidden bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-2xl">
            {/* Road */}
            <div className="absolute bottom-0 w-full h-2 bg-gray-800">
                <motion.div
                    className="h-full bg-yellow-400"
                    style={{ width: '20%' }}
                    animate={{ x: ['0%', '500%'] }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            </div>

            {/* Delivery Car */}
            <motion.div
                className="absolute bottom-4"
                initial={{ x: '-100%' }}
                animate={{ x: '120%' }}
                transition={{
                    duration: 8,
                    ease: "easeInOut",
                    onComplete: onComplete
                }}
            >
                <svg width="120" height="80" viewBox="0 0 120 80" fill="none" className="drop-shadow-lg">
                    {/* Car body */}
                    <rect x="10" y="35" width="80" height="30" rx="5" fill="#E94E77" />
                    <rect x="70" y="20" width="30" height="15" rx="3" fill="#E94E77" />

                    {/* Windows */}
                    <rect x="75" y="23" width="10" height="10" rx="2" fill="#87CEEB" opacity="0.7" />
                    <rect x="88" y="23" width="10" height="10" rx="2" fill="#87CEEB" opacity="0.7" />

                    {/* Wheels */}
                    <motion.circle
                        cx="30"
                        cy="65"
                        r="8"
                        fill="#2D2D2D"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                    />
                    <circle cx="30" cy="65" r="4" fill="#999" />

                    <motion.circle
                        cx="70"
                        cy="65"
                        r="8"
                        fill="#2D2D2D"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                    />
                    <circle cx="70" cy="65" r="4" fill="#999" />

                    {/* Package icon */}
                    <rect x="20" y="42" width="15" height="15" rx="2" fill="#FFF" opacity="0.9" />
                    <line x1="27.5" y1="42" x2="27.5" y2="57" stroke="#E94E77" strokeWidth="2" />
                    <line x1="20" y1="49.5" x2="35" y2="49.5" stroke="#E94E77" strokeWidth="2" />
                </svg>

                {/* Smoke/dust effect */}
                <motion.div
                    className="absolute -bottom-2 -left-4 w-8 h-8 bg-gray-400 rounded-full opacity-30 blur-md"
                    animate={{
                        scale: [0, 1.5, 0],
                        opacity: [0.3, 0.1, 0]
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeOut"
                    }}
                />
            </motion.div>

            {/* House destination */}
            <motion.div
                className="absolute right-4 bottom-8"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
            >
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                    {/* House */}
                    <path d="M10 30 L30 15 L50 30 L50 55 L10 55 Z" fill="#8B4513" />
                    <rect x="15" y="35" width="30" height="20" fill="#D2691E" />
                    <path d="M5 30 L30 10 L55 30" stroke="#654321" strokeWidth="2" fill="none" />

                    {/* Door */}
                    <rect x="25" y="42" width="10" height="13" rx="1" fill="#654321" />
                    <circle cx="32" cy="48" r="1" fill="#FFD700" />

                    {/* Windows */}
                    <rect x="18" y="38" width="6" height="6" rx="1" fill="#87CEEB" opacity="0.7" />
                    <rect x="36" y="38" width="6" height="6" rx="1" fill="#87CEEB" opacity="0.7" />

                    {/* Roof details */}
                    <circle cx="30" cy="25" r="2" fill="#FFD700" />
                </svg>
            </motion.div>

            {/* Floating hearts */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute text-2xl"
                    style={{
                        left: `${20 + i * 15}%`,
                        bottom: '20%'
                    }}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{
                        opacity: [0, 1, 0],
                        y: [0, -40, -80],
                        scale: [0.5, 1, 0.5]
                    }}
                    transition={{
                        duration: 3,
                        delay: 2 + i * 0.3,
                        ease: "easeOut"
                    }}
                >
                    💝
                </motion.div>
            ))}
        </div>
    );
};
