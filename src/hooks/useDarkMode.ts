import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
export function useDarkMode() {
  const [isDark, setIsDark] = useLocalStorage('giftology_theme_dark', false);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);
  return [isDark, setIsDark] as const;
}
