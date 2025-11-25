import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from '../components/ui/Icons';
import { ParticleBackground } from '../components/AnimatedBackgrounds';

export const GiftGuide = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const questions = [
        {
            id: 'recipient',
            question: "Who are you buying a gift for?",
            icon: Icons.Users,
            options: [
                { value: 'him', label: 'For Him', icon: '👨' },
                { value: 'her', label: 'For Her', icon: '👩' },
                { value: 'kids', label: 'For Kids', icon: '👶' },
                { value: 'couple', label: 'For Couple', icon: '💑' },
                { value: 'family', label: 'For Family', icon: '👨‍👩‍👧‍👦' },
            ]
        },
        {
            id: 'occasion',
            question: "What's the occasion?",
            icon: Icons.Calendar,
            options: [
                { value: 'birthday', label: 'Birthday', icon: '🎂' },
                { value: 'anniversary', label: 'Anniversary', icon: '💍' },
                { value: 'wedding', label: 'Wedding', icon: '💒' },
                { value: 'graduation', label: 'Graduation', icon: '🎓' },
                { value: 'housewarming', label: 'Housewarming', icon: '🏠' },
                { value: 'just-because', label: 'Just Because', icon: '💝' },
            ]
        },
        {
            id: 'budget',
            question: "What's your budget?",
            icon: Icons.DollarSign,
            options: [
                { value: '0-500', label: 'Under ₹500', icon: '💰' },
                { value: '500-1000', label: '₹500 - ₹1000', icon: '💰💰' },
                { value: '1000-2500', label: '₹1000 - ₹2500', icon: '💰💰💰' },
                { value: '2500-5000', label: '₹2500 - ₹5000', icon: '💎' },
                { value: '5000+', label: 'Above ₹5000', icon: '💎💎' },
            ]
        },
        {
            id: 'personality',
            question: "What describes them best?",
            icon: Icons.Heart,
            options: [
                { value: 'adventurous', label: 'Adventurous', icon: '🏔️' },
                { value: 'homebody', label: 'Homebody', icon: '🏡' },
                { value: 'creative', label: 'Creative', icon: '🎨' },
                { value: 'tech-savvy', label: 'Tech Savvy', icon: '💻' },
                { value: 'foodie', label: 'Foodie', icon: '🍕' },
                { value: 'fashionable', label: 'Fashionable', icon: '👗' },
            ]
        }
    ];

    const handleAnswer = (questionId: string, value: string) => {
        setAnswers({ ...answers, [questionId]: value });

        if (currentStep < questions.length - 1) {
            setTimeout(() => setCurrentStep(currentStep + 1), 300);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleGetRecommendations = () => {
        setIsLoading(true);

        // Build search query based on answers
        const params = new URLSearchParams();

        if (answers.recipient) {
            params.append('category', answers.recipient);
        }

        // Simulate AI processing
        setTimeout(() => {
            navigate(`/shop?${params.toString()}`);
        }, 1500);
    };

    const currentQuestion = questions[currentStep];
    const progress = ((currentStep + 1) / questions.length) * 100;
    const isComplete = currentStep === questions.length - 1 && answers[currentQuestion.id];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 py-12 px-4 relative">
            <ParticleBackground />
            <div className="max-w-4xl mx-auto relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-6 shadow-lg">
                        <Icons.Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        AI Gift Guide
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Answer a few questions and let our AI find the perfect gift
                    </p>
                </motion.div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-700">
                            Question {currentStep + 1} of {questions.length}
                        </span>
                        <span className="text-sm font-bold text-purple-600">
                            {Math.round(progress)}% Complete
                        </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 mb-8"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <currentQuestion.icon className="w-6 h-6 text-purple-600" />
                        </div>
                        <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900">
                            {currentQuestion.question}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((option) => (
                            <motion.button
                                key={option.value}
                                onClick={() => handleAnswer(currentQuestion.id, option.value)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-6 rounded-2xl border-2 transition-all text-left ${answers[currentQuestion.id] === option.value
                                    ? 'border-purple-500 bg-purple-50 shadow-lg'
                                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-4xl">{option.icon}</span>
                                    <span className="font-bold text-lg text-gray-900">{option.label}</span>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Icons.ChevronLeft className="w-5 h-5" />
                        <span className="font-bold">Back</span>
                    </button>

                    {isComplete && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={handleGetRecommendations}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-lg hover:shadow-xl transition-all disabled:opacity-70"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                    <span>Finding Perfect Gifts...</span>
                                </>
                            ) : (
                                <>
                                    <Icons.Sparkles className="w-5 h-5" />
                                    <span>Get Recommendations</span>
                                </>
                            )}
                        </motion.button>
                    )}
                </div>

                {/* Summary */}
                {Object.keys(answers).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-200"
                    >
                        <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                            <Icons.CheckCircle className="w-5 h-5 text-green-500" />
                            Your Selections
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {questions.map((q) => {
                                const answer = answers[q.id];
                                if (!answer) return null;
                                const option = q.options.find(o => o.value === answer);
                                return (
                                    <div key={q.id} className="text-center">
                                        <div className="text-2xl mb-1">{option?.icon}</div>
                                        <div className="text-xs text-gray-500 mb-1">{q.question.replace('?', '')}</div>
                                        <div className="text-sm font-bold text-gray-900">{option?.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
