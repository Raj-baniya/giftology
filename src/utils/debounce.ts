export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
