import { useState } from 'react';
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (e) { return initialValue; }
  });
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valToStore);
      window.localStorage.setItem(key, JSON.stringify(valToStore));
    } catch (e) { console.warn(e); }
  };
  return [storedValue, setValue] as const;
}
