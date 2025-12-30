import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './ui/Icons';
import { supabase } from '../services/supabaseClient';

interface GuestLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    productName?: string;
}

export const GuestLeadModal = ({ isOpen, onClose, onSuccess, productName }: GuestLeadModalProps) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) {
            setError('Please fill in all fields.');
            return;
        }

        // Basic phone validation (10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
            setError('Please enter a valid 10-digit phone number.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error: dbError } = await supabase
                .from('guest_leads')
                .insert([{
                    name: name.trim(),
                    phone: phone.trim(),
                    product_interest: productName,
                    created_at: new Date().toISOString()
                }]);

            if (dbError) throw dbError;

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Lead capture error:', err);
            // Fallback: If table doesn't exist, proceed anyway (don't block user)
            if (err.code === '42P01') {
                console.warn('guest_leads table missing, proceeding forcefully.');
                onSuccess();
                onClose();
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
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
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-serif font-bold text-gray-900">Quick Details</h2>
                                    <p className="text-sm text-gray-500 mt-1">Please provide your details to continue.</p>
                                </div>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <Icons.X className="w-5 h-5" />
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                    <Icons.X className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                        placeholder="John Doe"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                        placeholder="9876543210"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Continue
                                            <Icons.ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
