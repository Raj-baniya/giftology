
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './ui/Icons';
import { Link } from 'react-router-dom';
import { Product } from '../types';

interface AIProductAssistantProps {
    products: Product[];
}

type Step = 'RELATION' | 'AGE' | 'VIBE' | 'LOADING' | 'RESULTS';

export const AIProductAssistant: React.FC<AIProductAssistantProps> = ({ products }) => {
    const [step, setStep] = useState<Step>('RELATION');
    const [answers, setAnswers] = useState({
        relation: '',
        age: '',
        vibe: [] as string[]
    });
    const [recommendations, setRecommendations] = useState<(Product & { matchPercent: number })[]>([]);

    const RELATIONS = [
        { id: 'partner', label: 'Partner', icon: Icons.Heart },
        { id: 'parent', label: 'Parent', icon: Icons.User },
        { id: 'friend', label: 'Friend', icon: Icons.Users },
        { id: 'kid', label: 'Child', icon: Icons.Sparkles },
        { id: 'sibling', label: 'Sibling', icon: Icons.Smile }, // Assuming Smile icon exists or fallback
        { id: 'colleague', label: 'Colleague', icon: Icons.Briefcase } // Assuming Briefcase or fallback
    ];

    const AGES = [
        { id: 'kid', label: 'Kid (0-12)' },
        { id: 'teen', label: 'Teen (13-19)' },
        { id: 'adult', label: 'Adult (20-50)' },
        { id: 'senior', label: 'Senior (50+)' }
    ];

    const VIBES = [
        'Creative', 'Techie', 'Fashionista', 'Homebody',
        'Romantic', 'Playful', 'Professional', 'Foodie'
    ];

    const handleNext = () => {
        if (step === 'RELATION') setStep('AGE');
        else if (step === 'AGE') setStep('VIBE');
        else if (step === 'VIBE') findGifts();
    };

    const findGifts = async () => {
        setStep('LOADING');

        // Simulate thinking
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Intelligent Scoring Logic
        const scoredProducts = products.map(product => {
            let score = 0;
            const textToSearch = `${product.name} ${product.description} ${product.category} ${product.subcategory || ''}`.toLowerCase();

            // Relation Matches
            if (answers.relation === 'partner' && (textToSearch.includes('love') || textToSearch.includes('romantic') || textToSearch.includes('couple'))) score += 3;
            if (answers.relation === 'kid' && (product.category === 'for-kids' || textToSearch.includes('toy'))) score += 5;
            if (answers.relation === 'colleague' && (product.category === 'corporate-gifts' || textToSearch.includes('desk') || textToSearch.includes('pen'))) score += 4;

            // Age Matches
            if (answers.age === 'kid' && product.category === 'for-kids') score += 3;
            if (answers.age === 'senior' && (textToSearch.includes('shawl') || textToSearch.includes('health') || textToSearch.includes('classic'))) score += 2;

            // Vibe Matches (Keywords)
            answers.vibe.forEach(v => {
                const keyword = v.toLowerCase();
                if (textToSearch.includes(keyword)) score += 2;

                // Associative Logic
                if (keyword === 'techie' && (textToSearch.includes('digital') || textToSearch.includes('smart') || textToSearch.includes('watch'))) score += 3;
                if (keyword === 'creative' && (textToSearch.includes('art') || textToSearch.includes('kit') || textToSearch.includes('diy'))) score += 3;
                if (keyword === 'homebody' && (textToSearch.includes('decor') || textToSearch.includes('mug') || textToSearch.includes('candle'))) score += 3;
                if (keyword === 'fashionista' && (textToSearch.includes('wear') || textToSearch.includes('jewelry') || textToSearch.includes('bag'))) score += 3;
            });

            return { product, score };
        });

        const sortedMatches = scoredProducts
            .sort((a, b) => b.score - a.score)
            .slice(0, 4);

        const finalRecommendations = sortedMatches.map(m => {
            // Calculate a stable percentage based on score (min 85%, max 99%)
            const basePercent = 85;
            const boost = Math.min(14, m.score * 2);
            return {
                ...m.product,
                matchPercent: basePercent + boost
            };
        });

        // Fallback
        if (finalRecommendations.length < 4) {
            const filling = products
                .filter(p => p.trending && !finalRecommendations.find(fr => fr.id === p.id))
                .slice(0, 4 - finalRecommendations.length)
                .map(p => ({
                    ...p,
                    matchPercent: 80 + Math.floor(Math.random() * 5) // Still stable because it's set once in state
                }));
            finalRecommendations.push(...filling);
        }

        setRecommendations(finalRecommendations);
        setStep('RESULTS');
    };

    const reset = () => {
        setAnswers({ relation: '', age: '', vibe: [] });
        setStep('RELATION');
    };

    return (
        <section className="pt-6 pb-20 relative z-10">
            <div className="max-w-4xl mx-auto px-4">
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1A1A2E] to-[#16213e] border border-[#F4E6D0]/20 shadow-2xl p-1 min-h-[500px] flex flex-col">
                    {/* BUBBLES ANIMATION (Background) */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute bg-[#FFD700]/5 rounded-full"
                                initial={{ top: "100%", left: `${Math.random() * 100}%`, width: 50 + Math.random() * 100, height: 50 + Math.random() * 100 }}
                                animate={{ top: "-20%" }}
                                transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, ease: "linear" }}
                            />
                        ))}
                    </div>

                    <div className="relative bg-[#0f1021]/90 backdrop-blur-xl rounded-[1.3rem] flex-1 p-6 md:p-10 flex flex-col items-center justify-center text-center">

                        <AnimatePresence mode="wait">
                            {step === 'RELATION' && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-2xl">
                                    <Icons.Sparkles className="w-10 h-10 text-[#FFD700] mx-auto mb-4 animate-bounce" />
                                    <h2 className="text-3xl md:text-4xl font-bold text-[#F4E6D0] mb-2 font-serif">Who are we spoiling today?</h2>
                                    <p className="text-[#F4E6D0]/60 mb-8">Pick the lucky person!</p>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {RELATIONS.map((rel) => {
                                            const Icon = rel.icon || Icons.User;
                                            return (
                                                <button
                                                    key={rel.id}
                                                    onClick={() => { setAnswers({ ...answers, relation: rel.id }); setTimeout(handleNext, 300); }}
                                                    className={`p-6 rounded-xl border transition-all duration-300 flex flex-col items-center gap-3 group
                                                        ${answers.relation === rel.id
                                                            ? 'bg-[#FFD700] border-[#FFD700] text-black scale-105 shadow-xl font-black'
                                                            : 'bg-[#1A1A2E]/80 border-[#F4E6D0]/10 text-white hover:border-[#FFD700]/50 hover:bg-[#FFD700]/10 shadow-sm'}`}
                                                >
                                                    <Icon className={`w-8 h-8 ${answers.relation === rel.id ? 'text-black' : 'text-[#FFD700]'}`} />
                                                    <span className={`font-bold text-sm tracking-wide ${answers.relation === rel.id ? 'text-black' : 'text-white'}`}>{rel.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {step === 'AGE' && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-xl">
                                    <h2 className="text-3xl font-bold text-[#F4E6D0] mb-2 font-serif">How old are they?</h2>
                                    <p className="text-[#F4E6D0]/60 mb-8">Just a ballpark!</p>

                                    <div className="space-y-3">
                                        {AGES.map((age) => (
                                            <button
                                                key={age.id}
                                                onClick={() => { setAnswers({ ...answers, age: age.id }); setTimeout(handleNext, 300); }}
                                                className={`w-full p-4 rounded-xl border text-left flex justify-between items-center transition-all duration-300
                                                    ${answers.age === age.id
                                                        ? 'bg-[#FFD700] border-[#FFD700] text-black shadow-lg scale-105'
                                                        : 'bg-[#1A1A2E] border-[#F4E6D0]/10 text-[#F4E6D0] hover:border-[#FFD700]/50 hover:bg-[#FFD700]/10'}`}
                                            >
                                                <span className={`font-medium text-lg ${answers.age === age.id ? 'text-black' : 'text-[#F4E6D0]'}`}>{age.label}</span>
                                                {answers.age === age.id && <Icons.CheckCircle className="w-6 h-6" />}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => setStep('RELATION')} className="mt-8 text-sm text-[#F4E6D0]/50 hover:text-[#FFD700] underline">Back</button>
                                </motion.div>
                            )}

                            {step === 'VIBE' && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-2xl">
                                    <h2 className="text-3xl font-bold text-[#F4E6D0] mb-2 font-serif">What's their vibe?</h2>
                                    <p className="text-[#F4E6D0]/60 mb-8">Select all that apply!</p>

                                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                                        {VIBES.map((vibe) => {
                                            const isSelected = answers.vibe.includes(vibe);
                                            return (
                                                <button
                                                    key={vibe}
                                                    onClick={() => {
                                                        const newVibes = isSelected
                                                            ? answers.vibe.filter(v => v !== vibe)
                                                            : [...answers.vibe, vibe];
                                                        setAnswers({ ...answers, vibe: newVibes });
                                                    }}
                                                    className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-300
                                                        ${isSelected
                                                            ? 'bg-[#FFD700] border-[#FFD700] text-black shadow-[0_0_15px_rgba(255,215,0,0.4)] scale-110'
                                                            : 'bg-[#1A1A2E] border-[#F4E6D0]/20 text-[#F4E6D0] hover:border-[#FFD700]/50'}`}
                                                >
                                                    {vibe}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        disabled={answers.vibe.length === 0}
                                        className="px-10 py-4 bg-[#FFD700] text-black font-bold rounded-xl hover:bg-[#ffe55c] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] scale-100 hover:scale-105 active:scale-95"
                                    >
                                        Find the Perfect Gift
                                    </button>
                                    <div className="mt-4">
                                        <button onClick={() => setStep('AGE')} className="text-sm text-[#F4E6D0]/50 hover:text-[#FFD700] underline">Back</button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 'LOADING' && (
                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="w-20 h-20 border-4 border-[#F4E6D0]/10 border-t-[#FFD700] rounded-full mx-auto mb-6"
                                    />
                                    <h3 className="text-2xl font-bold text-[#F4E6D0] animate-pulse">Consulting the Gift Spirits...</h3>
                                </motion.div>
                            )}

                            {step === 'RESULTS' && (
                                <motion.div key="results" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-2xl md:text-3xl font-bold text-[#F4E6D0] text-left font-serif">
                                            For your <span className="text-[#FFD700]">{answers.relation}</span> ({answers.age})
                                        </h2>
                                        <button onClick={reset} className="text-sm text-[#F4E6D0]/60 hover:text-white flex items-center gap-1 border border-[#F4E6D0]/20 px-3 py-1 rounded-full hover:bg-white/10 transition-colors">
                                            <Icons.RefreshCw className="w-3 h-3" /> Start Over
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {recommendations.map((product, idx) => (
                                            <motion.div
                                                key={product.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                            >
                                                <Link to={`/product/${product.slug}`} className="group block h-full">
                                                    <div className="bg-[#1A1A2E] rounded-xl overflow-hidden border border-[#F4E6D0]/10 hover:border-[#FFD700] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(255,215,0,0.2)] h-full flex flex-col">
                                                        <div className="aspect-square relative overflow-hidden">
                                                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs text-[#FFD700] font-bold">
                                                                {product.matchPercent}% Match
                                                            </div>
                                                        </div>
                                                        <div className="p-4 flex flex-col flex-1 text-left">
                                                            <h4 className="text-[#F4E6D0] font-medium line-clamp-2 mb-2 group-hover:text-white">{product.name}</h4>
                                                            <div className="mt-auto pt-2 border-t border-[#F4E6D0]/5 flex justify-between items-center">
                                                                <span className="text-green-500 font-bold">₹{product.sale_price || product.price}</span>
                                                                <Icons.ArrowRight className="w-4 h-4 text-[#F4E6D0]/50 group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
};
