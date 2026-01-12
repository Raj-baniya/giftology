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
        <div className="min-h-screen bg-background py-12 px-4 relative overflow-hidden text-charcoal">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-4xl mx-auto relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-8 border border-charcoal/5 shadow-xl">
                        <Icons.Sparkles className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="font-serif font-black text-4xl md:text-6xl text-charcoal mb-4 uppercase tracking-[0.2em]">
                        AI Gift Guide
                    </h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">
                        The art of selection, simplified by intelligence
                    </p>
                </motion.div>

                {/* Progress Bar */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-3 ml-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Step {currentStep + 1} of {questions.length}
                        </span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                            {Math.round(progress)}% Experience
                        </span>
                    </div>
                    <div className="h-1 bg-charcoal/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary"
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
                    className="bg-white rounded-[3rem] border border-charcoal/5 p-8 md:p-14 mb-10 shadow-2xl relative overflow-hidden group"
                >
                    <div className="flex items-center gap-6 mb-12 relative z-10">
                        <div className="w-16 h-16 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-center">
                            <currentQuestion.icon className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="font-serif font-black text-2xl md:text-4xl text-charcoal uppercase tracking-wider">
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
                                className={`p-8 rounded-[2rem] border transition-all text-left flex items-center gap-6 group/btn ${answers[currentQuestion.id] === option.value
                                    ? 'border-primary bg-primary/5 shadow-md'
                                    : 'border-charcoal/5 bg-gray-50 hover:border-primary/30 hover:bg-white'
                                    }`}
                            >
                                <span className="text-4xl">{option.icon}</span>
                                <span className={`font-black uppercase tracking-[0.15em] text-xs ${answers[currentQuestion.id] === option.value
                                    ? 'text-charcoal'
                                    : currentQuestion.id === 'budget'
                                        ? 'text-green-600'
                                        : 'text-gray-400 group-hover/btn:text-charcoal'}`}>
                                    {option.label}
                                </span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mb-16 px-4">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 text-gray-400 hover:text-charcoal disabled:opacity-0 transition-all font-black uppercase tracking-widest text-[10px]"
                    >
                        <Icons.ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>

                    {isComplete && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            onClick={handleGetRecommendations}
                            disabled={isLoading}
                            className="flex items-center gap-3 px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    <span>Curating Gifts...</span>
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
                        className="mt-12 bg-white/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-charcoal/5 shadow-xl"
                    >
                        <h3 className="font-black text-[10px] text-gray-400 mb-8 uppercase tracking-[0.2em] flex items-center gap-3">
                            <Icons.CheckCircle className="w-4 h-4 text-primary" />
                            Curated Preferences
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {questions.map((q) => {
                                const answer = answers[q.id];
                                if (!answer) return null;
                                const option = q.options.find(o => o.value === answer);
                                return (
                                    <div key={q.id} className="text-center p-4 bg-white rounded-2xl border border-charcoal/5 shadow-sm">
                                        <div className="text-3xl mb-3">{option?.icon}</div>
                                        <div className="text-[10px] text-gray-400 mb-1 font-black uppercase tracking-widest">{q.question.replace('?', '').toUpperCase()}</div>
                                        <div className="text-[10px] font-black text-charcoal uppercase tracking-widest">{option?.label}</div>
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
