import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './ui/Icons';

interface CustomAlertProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    confirmText?: string;
    onConfirm?: () => void;
    cancelText?: string;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    onConfirm,
    cancelText
}) => {
    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onClose();
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <Icons.CheckCircle className="w-16 h-16 text-green-500" />;
            case 'error':
                return <Icons.XCircle className="w-16 h-16 text-red-500" />;
            case 'warning':
                return <Icons.AlertTriangle className="w-16 h-16 text-yellow-500" />;
            default:
                return <Icons.Info className="w-16 h-16 text-blue-500" />;
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success':
                return 'from-green-500 to-emerald-500';
            case 'error':
                return 'from-red-500 to-rose-500';
            case 'warning':
                return 'from-yellow-500 to-orange-500';
            default:
                return 'from-blue-500 to-cyan-500';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Alert Modal */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
                        >
                            {/* Gradient Header */}
                            <div className={`h-2 bg-gradient-to-r ${getColor()}`} />

                            <div className="p-8 text-center">
                                {/* Icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                    className="flex justify-center mb-6"
                                >
                                    {getIcon()}
                                </motion.div>

                                {/* Title */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="font-serif text-2xl font-bold text-gray-900 mb-3"
                                >
                                    {title}
                                </motion.h2>

                                {/* Message */}
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-gray-600 text-base leading-relaxed mb-8"
                                >
                                    {message}
                                </motion.p>

                                {/* Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex gap-3"
                                >
                                    {cancelText && (
                                        <button
                                            onClick={onClose}
                                            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-bold hover:bg-gray-200 transition-colors"
                                        >
                                            {cancelText}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleConfirm}
                                        className={`flex-1 px-6 py-3 bg-gradient-to-r ${getColor()} text-white rounded-full font-bold hover:shadow-lg transition-all`}
                                    >
                                        {confirmText}
                                    </button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// Hook for easy alert usage
export const useCustomAlert = () => {
    const [alertState, setAlertState] = React.useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
        confirmText?: string;
        onConfirm?: () => void;
        cancelText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const showAlert = (
        title: string,
        message: string,
        type: 'success' | 'error' | 'warning' | 'info' = 'info',
        options?: {
            confirmText?: string;
            onConfirm?: () => void;
            cancelText?: string;
        }
    ) => {
        setAlertState({
            isOpen: true,
            title,
            message,
            type,
            ...options
        });
    };

    const closeAlert = () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
    };

    return {
        alertState,
        showAlert,
        closeAlert
    };
};
