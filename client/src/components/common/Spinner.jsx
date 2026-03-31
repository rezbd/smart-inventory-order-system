export default function Spinner({ size = 'md', className = '' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size];
  return (
    <div className={`${sz} ${className} border-2 border-border border-t-amber rounded-full animate-spin`} />
  );
}