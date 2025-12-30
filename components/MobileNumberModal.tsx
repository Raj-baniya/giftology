import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './ui/Icons';
import { submitContactMessage } from '../services/supabaseService';

export const MobileNumberModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(''); // New state for feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('We Value Your Feedback'); // Dynamic title



  // Listen for custom event to open modal
  useEffect(() => {
    const handleOpenModal = (event: any) => {
      setIsOpen(true);
      if (event.detail?.title) {
        setTitle(event.detail.title);
      } else {
        setTitle('We Value Your Feedback');
      }
    };

    window.addEventListener('openFeedbackModal', handleOpenModal);
    return () => window.removeEventListener('openFeedbackModal', handleOpenModal);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Email Normalization
    let finalEmail = email.trim();
    if (finalEmail && !finalEmail.includes('@')) {
      finalEmail += '@gmail.com';
      setEmail(finalEmail);
    }

    if (!message.trim()) {
      setError('Please enter your feedback message.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to Supabase
      const result = await submitContactMessage({
        name,
        email: finalEmail,
        phone: mobileNumber,
        message: message,
        source: 'feedback_modal'
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to submit feedback.');
      }

      // Success
      sessionStorage.setItem('mobile_submitted', 'true');
      setIsOpen(false);
      alert('Thank you for your feedback!');

      // Reset form
      setName('');
      setMobileNumber('');
      setEmail('');
      setMessage('');

    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('mobile_submitted', 'true'); // Don't show again this session
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <Icons.X className="w-6 h-6" />
            </button>

            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icons.MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-900">{title}</h2>
                <p className="text-gray-500 mt-2 text-sm">
                  Help us improve Giftology! Verify your details to send us your thoughts.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                  <Icons.AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <Icons.User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mobile Number</label>
                  <div className="relative">
                    <Icons.Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Icons.Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Your Feedback</label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all h-24 resize-none"
                    placeholder="Tell us what you think..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Submit Feedback</span>
                      <Icons.ArrowRight className="w-5 h-5" />
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
