import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Spark {
    id: number;
    x: number;
    y: number;
}

interface ClickSparkProps {
    color?: string;
    count?: number;
}

export const ClickSpark: React.FC<ClickSparkProps> = ({
    color = '#E94E77',
    count = 8
}) => {
    const [sparks, setSparks] = useState<Spark[]>([]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const newSpark: Spark = {
                id: Date.now() + Math.random(),
                x: e.clientX,
                y: e.clientY,
            };

            setSparks(prev => [...prev, newSpark]);

            // Remove spark after animation
            setTimeout(() => {
                setSparks(prev => prev.filter(spark => spark.id !== newSpark.id));
            }, 1000);
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            <AnimatePresence>
                {sparks.map(spark => (
                    <div
                        key={spark.id}
                        className="absolute"
                        style={{
                            left: spark.x,
                            top: spark.y,
                        }}
                    >
                        {Array.from({ length: count }).map((_, i) => {
                            const angle = (360 / count) * i;
                            const distance = 40 + Math.random() * 20;

                            return (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 rounded-full"
                                    style={{
                                        backgroundColor: color,
                                        boxShadow: `0 0 4px ${color}`,
                                    }}
                                    initial={{
                                        x: 0,
                                        y: 0,
                                        scale: 0,
                                        opacity: 1,
                                    }}
                                    animate={{
                                        x: Math.cos((angle * Math.PI) / 180) * distance,
                                        y: Math.sin((angle * Math.PI) / 180) * distance,
                                        scale: [0, 1.5, 0],
                                        opacity: [1, 1, 0],
                                    }}
                                    transition={{
                                        duration: 0.6,
                                        ease: [0.23, 1, 0.32, 1],
                                    }}
                                />
                            );
                        })}

                        {/* Center burst */}
                        <motion.div
                            className="absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2"
                            style={{
                                backgroundColor: color,
                                boxShadow: `0 0 10px ${color}`,
                            }}
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: [0, 1.5, 0], opacity: [1, 0.5, 0] }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

// Enhanced version with multiple colors
export const RainbowClickSpark: React.FC = () => {
    const [sparks, setSparks] = useState<Spark[]>([]);
    const colors = ['#E94E77', '#FFD700', '#00CED1', '#FF69B4', '#7B68EE', '#FF6347'];

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const newSpark: Spark = {
                id: Date.now() + Math.random(),
                x: e.clientX,
                y: e.clientY,
            };

            setSparks(prev => [...prev, newSpark]);

            setTimeout(() => {
                setSparks(prev => prev.filter(spark => spark.id !== newSpark.id));
            }, 1000);
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            <AnimatePresence>
                {sparks.map(spark => (
                    <div
                        key={spark.id}
                        className="absolute"
                        style={{
                            left: spark.x,
                            top: spark.y,
                        }}
                    >
                        {Array.from({ length: 12 }).map((_, i) => {
                            const angle = (360 / 12) * i;
                            const distance = 40 + Math.random() * 20;
                            const color = colors[i % colors.length];

                            return (
                                <motion.div
                                    key={i}
                                    className="absolute w-1.5 h-1.5 rounded-full"
                                    style={{
                                        backgroundColor: color,
                                        boxShadow: `0 0 6px ${color}`,
                                    }}
                                    initial={{
                                        x: 0,
                                        y: 0,
                                        scale: 0,
                                        opacity: 1,
                                    }}
                                    animate={{
                                        x: Math.cos((angle * Math.PI) / 180) * distance,
                                        y: Math.sin((angle * Math.PI) / 180) * distance,
                                        scale: [0, 1.5, 0],
                                        opacity: [1, 1, 0],
                                    }}
                                    transition={{
                                        duration: 0.6,
                                        ease: [0.23, 1, 0.32, 1],
                                    }}
                                />
                            );
                        })}

                        {/* Rainbow center burst */}
                        <motion.div
                            className="absolute w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2"
                            style={{
                                background: 'linear-gradient(45deg, #E94E77, #FFD700, #00CED1, #FF69B4)',
                                boxShadow: '0 0 15px rgba(233, 78, 119, 0.8)',
                            }}
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: [0, 1.5, 0], opacity: [1, 0.5, 0] }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};
