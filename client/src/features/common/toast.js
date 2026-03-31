// Lightweight toast — no external lib needed
const show = (message, type = 'info') => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const el = document.createElement('div');
  const colors = {
    success: 'border-emerald/40 text-emerald bg-emerald/10',
    error:   'border-rose/40   text-rose   bg-rose/10',
    info:    'border-amber/40  text-amber  bg-amber/10',
  };

  el.className = `
    flex items-start gap-3 px-4 py-3 rounded border font-mono text-sm
    shadow-panel backdrop-blur-sm animate-fade-up
    ${colors[type] || colors.info}
  `.trim().replace(/\s+/g, ' ');

  el.textContent = message;
  container.appendChild(el);

  setTimeout(() => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(-8px)';
    el.style.transition = 'all 0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, 4000);
};

export const toast = {
  success: (msg) => show(msg, 'success'),
  error:   (msg) => show(msg, 'error'),
  info:    (msg) => show(msg, 'info'),
};