import { useState, useEffect } from 'react';
export function useWindowDimensions() {
  const [dims, setDims] = useState({ width: window.innerWidth, height: window.innerHeight, isMobile: window.innerWidth < 768 });
  useEffect(() => {
    const onResize = () => setDims({ width: window.innerWidth, height: window.innerHeight, isMobile: window.innerWidth < 768 });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return dims;
}
