import { useState, useEffect } from 'react';
export function useCountdownTimer(targetTime: number) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, targetTime - Date.now()));
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(Math.max(0, targetTime - Date.now())), 1000);
    return () => clearInterval(timer);
  }, [targetTime]);
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  return { hours, minutes, seconds, expired: timeLeft === 0 };
}
