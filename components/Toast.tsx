import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './ui/Icons';

interface ToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
    type?: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastProps> = ({
    message,
    isVisible,
    onClose,
    duration = 3000,
    type = 'success'
}) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    }[type];

    const Icon = {
        success: Icons.CheckCircle,
        error: Icons.XCircle,
        info: Icons.Info
    }[type];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.3 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                    className="fixed bottom-20 md:bottom-8 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none"
                >
                    <div className={`${bgColor} text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 max-w-[90vw] md:max-w-md pointer-events-auto`}>
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="font-medium text-sm truncate">{message}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
