const VARIANTS = {
  // Order statuses
  Pending:   'bg-amber/10   text-amber   border-amber/30',
  Confirmed: 'bg-sky/10     text-sky     border-sky/30',
  Shipped:   'bg-violet/10  text-violet  border-violet/30',
  Delivered: 'bg-emerald/10 text-emerald border-emerald/30',
  Cancelled: 'bg-rose/10    text-rose    border-rose/30',
  // Stock statuses
  Active:       'bg-emerald/10 text-emerald border-emerald/30',
  'Out of Stock': 'bg-rose/10  text-rose    border-rose/30',
  // Generic
  info:    'bg-sky/10     text-sky     border-sky/30',
  warning: 'bg-amber/10   text-amber   border-amber/30',
  danger:  'bg-rose/10    text-rose    border-rose/30',
  success: 'bg-emerald/10 text-emerald border-emerald/30',
};

export default function Badge({ label, variant }) {
  const cls = VARIANTS[variant] || VARIANTS[label] || 'bg-muted/20 text-soft border-muted/30';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-mono font-500 uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}