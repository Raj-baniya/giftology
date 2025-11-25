import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedCardProps {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: 'lift' | 'glow' | 'scale' | 'tilt' | 'none';
    delay?: number;
    onClick?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
    children,
    className = '',
    hoverEffect = 'lift',
    delay = 0,
    onClick
}) => {
    const hoverEffects = {
        lift: {
            y: -8,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
        },
        glow: {
            boxShadow: '0 0 20px rgba(244, 194, 194, 0.6)'
        },
        scale: {
            scale: 1.05
        },
        tilt: {
            rotateY: 5,
            rotateX: 5
        },
        none: {}
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={hoverEffects[hoverEffect]}
            onClick={onClick}
            className={`bg-white rounded-xl shadow-md smooth-transition ${onClick ? 'cursor-pointer' : ''} ${className}`}
        >
            {children}
        </motion.div>
    );
};

interface ProductCardProps {
    imageUrl: string;
    title: string;
    price: number;
    marketPrice?: number;
    badge?: string;
    onClick?: () => void;
    onAddToCart?: () => void;
    className?: string;
}

export const AnimatedProductCard: React.FC<ProductCardProps> = ({
    imageUrl,
    title,
    price,
    marketPrice,
    badge,
    onClick,
    onAddToCart,
    className = ''
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}
            onClick={onClick}
            className={`bg-white rounded-xl overflow-hidden shadow-md smooth-transition cursor-pointer ${className}`}
        >
            <div className="relative aspect-square overflow-hidden group">
                <motion.img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                />
                {badge && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
                        {badge}
                    </div>
                )}
            </div>

            <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{title}</h3>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl font-bold text-gray-900">₹{price}</span>
                    {marketPrice && marketPrice > price && (
                        <span className="text-sm text-gray-400 line-through">₹{marketPrice}</span>
                    )}
                </div>

                {onAddToCart && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart();
                        }}
                        className="w-full bg-[#E94E77] text-white py-2 rounded-lg font-bold smooth-transition hover:bg-[#D63D65]"
                    >
                        Add to Cart
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    className?: string;
}

export const AnimatedFeatureCard: React.FC<FeatureCardProps> = ({
    icon,
    title,
    description,
    className = ''
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className={`bg-white p-6 rounded-xl shadow-md smooth-transition hover:shadow-xl ${className}`}
        >
            <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 smooth-transition"
            >
                {icon}
            </motion.div>
            <h3 className="font-bold text-xl mb-2 text-gray-900">{title}</h3>
            <p className="text-gray-600 leading-relaxed">{description}</p>
        </motion.div>
    );
};

interface TestimonialCardProps {
    quote: string;
    author: string;
    role?: string;
    avatar?: string;
    className?: string;
}

export const AnimatedTestimonialCard: React.FC<TestimonialCardProps> = ({
    quote,
    author,
    role,
    avatar,
    className = ''
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
            className={`bg-white p-6 rounded-xl shadow-md smooth-transition ${className}`}
        >
            <div className="text-4xl text-primary mb-4">"</div>
            <p className="text-gray-700 italic mb-6 leading-relaxed">{quote}</p>
            <div className="flex items-center gap-3">
                {avatar && (
                    <img src={avatar} alt={author} className="w-12 h-12 rounded-full object-cover" />
                )}
                <div>
                    <p className="font-bold text-gray-900">{author}</p>
                    {role && <p className="text-sm text-gray-500">{role}</p>}
                </div>
            </div>
        </motion.div>
    );
};
