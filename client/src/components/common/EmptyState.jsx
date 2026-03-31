export default function EmptyState({ icon = '◻', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl text-muted mb-4">{icon}</div>
      <h3 className="font-display font-600 text-bright text-base mb-1">{title}</h3>
      {description && <p className="text-dim text-sm font-mono mb-5 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}