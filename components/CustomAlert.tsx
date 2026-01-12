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
    // Scroll Lock Effect
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Prevent mobile touch scrolling on body
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [isOpen]);

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
                        className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100vh', width: '100vw' }}
                    >
                        {/* Alert Modal */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 0 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 0 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden relative"
                        >
                            {/* Gradient Header */}
                            <div className={`h-1 bg-gradient-to-r ${getColor()}`} />

                            <div className="p-8 text-center flex flex-col items-center justify-center">
                                {/* Icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                    className="flex justify-center mb-6 bg-white/5 p-4 rounded-full border border-white/5"
                                >
                                    {getIcon()}
                                </motion.div>

                                {/* Title */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="font-black text-xl text-white uppercase tracking-wider mb-3"
                                >
                                    {title}
                                </motion.h2>

                                {/* Message */}
                                <motion.p
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-gray-400 text-sm font-medium leading-relaxed mb-8"
                                    dangerouslySetInnerHTML={{ __html: message }}
                                />

                                {/* Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex gap-3 w-full"
                                >
                                    {cancelText && (
                                        <button
                                            onClick={onClose}
                                            className="flex-1 px-4 py-3 bg-white/5 text-gray-400 border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                                        >
                                            {cancelText}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleConfirm}
                                        className={`flex-1 px-4 py-3 bg-gradient-to-r ${getColor()} text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all`}
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

    const showAlert = React.useCallback((
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
    }, []);

    const closeAlert = React.useCallback(() => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return {
        alertState,
        showAlert,
        closeAlert
    };
};
