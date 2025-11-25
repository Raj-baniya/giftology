import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for scroll-based reveal animations
 * Elements will animate in when they come into view
 */
export const useScrollReveal = (threshold = 0.1) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    // Once revealed, stop observing
                    if (ref.current) {
                        observer.unobserve(ref.current);
                    }
                }
            },
            {
                threshold,
                rootMargin: '50px',
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [threshold]);

    return { ref, isVisible };
};
