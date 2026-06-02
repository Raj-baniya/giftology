export const announceToScreenReader = (msg: string) => {
  const el = document.getElementById('aria-live-announcer');
  if (el) el.textContent = msg;
};
