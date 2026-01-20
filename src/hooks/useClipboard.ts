import { useState } from 'react';
import { copyToClipboard } from '../utils/copyToClipboard';
export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), timeout); }
    return ok;
  };
  return { copied, copy };
}
