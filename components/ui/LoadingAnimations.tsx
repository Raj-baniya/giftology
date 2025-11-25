import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    color = '#E94E77'
}) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16'
    };

    return (
        <div className="flex items-center justify-center">
            <div
                className={`${sizeClasses[size]} border-4 border-gray-200 border-t-transparent rounded-full animate-spin`}
                style={{ borderTopColor: color }}
            />
        </div>
    );
};

export const PulsingDots: React.FC = () => {
    return (
        <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
    );
};

export const BouncingBalls: React.FC = () => {
    return (
        <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
    );
};

export const GradientSpinner: React.FC = () => {
    return (
        <div className="flex items-center justify-center">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-accent to-primary animate-gradient animate-spin"
                    style={{
                        clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)',
                        opacity: 0.8
                    }}
                />
                <div className="absolute inset-2 bg-white rounded-full" />
            </div>
        </div>
    );
};
