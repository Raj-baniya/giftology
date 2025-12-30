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
        <div className="min-h-screen bg-transparent py-12 px-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E60000]/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-4xl mx-auto relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-white/5 backdrop-blur-xl rounded-full mb-8 border border-white/10 shadow-[0_0_30px_rgba(230,0,0,0.2)]">
                        <Icons.Sparkles className="w-12 h-12 text-[#E60000] drop-shadow-[0_0_10px_rgba(230,0,0,0.5)]" />
                    </div>
                    <h1 className="font-black text-4xl md:text-6xl text-white mb-4 uppercase tracking-[0.2em]">
                        AI Gift Guide
                    </h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs italic">
                        Answer a few questions and let our AI find the perfect gift
                    </p>
                </motion.div>

                {/* Progress Bar */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-3 ml-1">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            Question {currentStep + 1} of {questions.length}
                        </span>
                        <span className="text-[10px] font-black text-[#E60000] uppercase tracking-widest animate-pulse">
                            {Math.round(progress)}% Complete
                        </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#E60000] to-red-900 shadow-[0_0_10px_rgba(230,0,0,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 p-8 md:p-14 mb-10 shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#E60000]/5 blur-3xl rounded-full pointer-events-none group-hover:bg-[#E60000]/10 transition-all duration-700"></div>

                    <div className="flex items-center gap-6 mb-12 relative z-10">
                        <div className="w-16 h-16 bg-[#E60000]/10 border border-[#E60000]/20 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(230,0,0,0.1)]">
                            <currentQuestion.icon className="w-8 h-8 text-[#E60000]" />
                        </div>
                        <h2 className="font-black text-2xl md:text-4xl text-white uppercase tracking-wider">
                            {currentQuestion.question}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                        {currentQuestion.options.map((option) => (
                            <motion.button
                                key={option.value}
                                onClick={() => handleAnswer(currentQuestion.id, option.value)}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-8 rounded-[2rem] border-2 transition-all text-left flex items-center gap-6 group/btn ${answers[currentQuestion.id] === option.value
                                    ? 'border-[#E60000] bg-[#E60000]/10 shadow-[0_0_20px_rgba(230,0,0,0.2)]'
                                    : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                    }`}
                            >
                                <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{option.icon}</span>
                                <span className={`font-black uppercase tracking-[0.15em] text-xs ${answers[currentQuestion.id] === option.value ? 'text-white' : 'text-gray-400 group-hover/btn:text-white'}`}>{option.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mb-16">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 px-8 py-3 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-black uppercase tracking-widest text-[10px]"
                    >
                        <Icons.ChevronLeft className="w-4 h-4" />
                        Back
                    </button>

                    {isComplete && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            onClick={handleGetRecommendations}
                            disabled={isLoading}
                            className="flex items-center gap-3 px-10 py-5 bg-[#E60000] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-[#ff0000] transition-all shadow-[0_0_30px_rgba(230,0,0,0.3)] hover:shadow-[0_0_40px_rgba(230,0,0,0.5)] active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    <span>Finding Perfect Gifts...</span>
                                </>
                            ) : (
                                <>
                                    <Icons.Sparkles className="w-4 h-4" />
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
                        className="mt-12 bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl"
                    >
                        <h3 className="font-black text-[10px] text-white mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                            <Icons.CheckCircle className="w-4 h-4 text-[#E60000]" />
                            Selected Preferences
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {questions.map((q) => {
                                const answer = answers[q.id];
                                if (!answer) return null;
                                const option = q.options.find(o => o.value === answer);
                                return (
                                    <div key={q.id} className="text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="text-3xl mb-3 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">{option?.icon}</div>
                                        <div className="text-[10px] text-gray-500 mb-1 font-black uppercase tracking-widest">{q.question.replace('?', '').toUpperCase()}</div>
                                        <div className="text-[10px] font-black text-white uppercase tracking-widest">{option?.label}</div>
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
