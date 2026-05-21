import { useState } from 'react';
export function useAsyncAction<T>(action: () => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const execute = async () => {
    setLoading(true); setError(null);
    try { const res = await action(); return res; }
    catch (err: any) { setError(err); throw err; }
    finally { setLoading(false); }
  };
  return { execute, loading, error };
}
