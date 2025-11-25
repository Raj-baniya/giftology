import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Wrapper component for smooth page transitions
 * Adds fade-in and slide-up animation when page loads
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

/**
 * Stagger children animation wrapper
 * Each child will animate in sequence
 */
export const StaggerContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className = ''
}) => {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                visible: {
                    transition: {
                        staggerChildren: 0.1
                    }
                }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

/**
 * Individual stagger item
 */
export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className = ''
}) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

/**
 * Scale-in animation component
 */
export const ScaleIn: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
    children,
    className = '',
    delay = 0
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

/**
 * Slide-in from direction
 */
export const SlideIn: React.FC<{
    children: React.ReactNode;
    className?: string;
    direction?: 'left' | 'right' | 'up' | 'down';
    delay?: number;
}> = ({
    children,
    className = '',
    direction = 'up',
    delay = 0
}) => {
        const directions = {
            left: { x: -50, y: 0 },
            right: { x: 50, y: 0 },
            up: { x: 0, y: 50 },
            down: { x: 0, y: -50 }
        };

        return (
            <motion.div
                initial={{ opacity: 0, ...directions[direction] }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay, ease: 'easeOut' }}
                className={className}
            >
                {children}
            </motion.div>
        );
    };
