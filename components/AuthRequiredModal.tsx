import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icons } from './ui/Icons';

interface AuthRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
}

export const AuthRequiredModal = ({ isOpen, onClose, message = "Please login to continue." }: AuthRequiredModalProps) => {
    const navigate = useNavigate();

    const handleLogin = () => {
        onClose();
        navigate('/login');
    };

    const handleSignup = () => {
        onClose();
        navigate('/login?mode=signup');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                    >
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icons.Lock className="w-8 h-8" />
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
                            <p className="text-gray-600 mb-8">{message}</p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleLogin}
                                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                                >
                                    Log In
                                </button>
                                <button
                                    onClick={handleSignup}
                                    className="w-full py-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-bold rounded-xl transition-all active:scale-95"
                                >
                                    Sign Up
                                </button>
                            </div>

                            <button
                                onClick={onClose}
                                className="mt-6 text-sm text-gray-400 hover:text-gray-600 font-medium"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
