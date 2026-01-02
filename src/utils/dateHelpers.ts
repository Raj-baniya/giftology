export const formatDate = (d: Date | string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
