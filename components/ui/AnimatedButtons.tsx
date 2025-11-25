import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
    variant = 'primary',
    size = 'md',
    children,
    icon,
    iconPosition = 'right',
    fullWidth = false,
    className = '',
    ...props
}) => {
    const baseClasses = 'font-bold rounded-full smooth-transition hover-lift btn-animated flex items-center justify-center gap-2';

    const variantClasses = {
        primary: 'bg-black text-white hover:bg-gray-800',
        secondary: 'bg-primary text-white hover:bg-[#E94E77]',
        outline: 'bg-transparent border-2 border-black text-black hover:bg-black hover:text-white',
        ghost: 'bg-transparent text-black hover:bg-gray-100'
    };

    const sizeClasses = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg'
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
            {...props}
        >
            {icon && iconPosition === 'left' && <span className="smooth-transition">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="smooth-transition">{icon}</span>}
        </motion.button>
    );
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'primary' | 'danger';
}

export const AnimatedIconButton: React.FC<IconButtonProps> = ({
    icon,
    size = 'md',
    variant = 'default',
    className = '',
    ...props
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12'
    };

    const variantClasses = {
        default: 'hover:bg-gray-100 text-gray-700',
        primary: 'hover:bg-primary/10 text-primary',
        danger: 'hover:bg-red-50 text-red-500'
    };

    return (
        <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full flex items-center justify-center smooth-transition ${className}`}
            {...props}
        >
            {icon}
        </motion.button>
    );
};

interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
    icon,
    className = '',
    ...props
}) => {
    return (
        <motion.button
            whileHover={{ scale: 1.1, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
            whileTap={{ scale: 0.9 }}
            className={`w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center animate-float ${className}`}
            {...props}
        >
            {icon}
        </motion.button>
    );
};

interface PulseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export const PulseButton: React.FC<PulseButtonProps> = ({
    children,
    className = '',
    ...props
}) => {
    return (
        <motion.button
            animate={{
                scale: [1, 1.05, 1],
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
            }}
            whileTap={{ scale: 0.95 }}
            className={`px-8 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-full shadow-lg hover-glow ${className}`}
            {...props}
        >
            {children}
        </motion.button>
    );
};
