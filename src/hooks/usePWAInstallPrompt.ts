import { useState, useEffect } from 'react';
export function usePWAInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setPromptEvent(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  return promptEvent;
}
