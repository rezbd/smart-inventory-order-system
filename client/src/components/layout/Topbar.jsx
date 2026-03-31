import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/dashboard':          { title: 'Dashboard',     sub: 'System overview & live metrics' },
  '/orders':             { title: 'Orders',        sub: 'Manage and track customer orders' },
  '/products':           { title: 'Products',      sub: 'Catalog management' },
  '/categories':         { title: 'Categories',    sub: 'Product groupings' },
  '/inventory/restock':  { title: 'Restock Queue', sub: 'Low-stock products requiring attention' },
};

export default function Topbar() {
  const { pathname } = useLocation();
  const isOrderDetail = pathname.startsWith('/orders/') && pathname !== '/orders';
  const pageKey  = isOrderDetail ? null : pathname;
  const pageMeta = PAGE_TITLES[pageKey] || { title: 'Order Detail', sub: 'Full order breakdown' };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6 flex-shrink-0 shadow-inset-top">
      <div>
        <h1 className="font-display font-700 text-base text-bright leading-tight">
          {pageMeta.title}
        </h1>
        <p className="text-dim text-[11px] font-mono">{pageMeta.sub}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse-dot" />
          <span className="text-xs font-mono text-dim">LIVE</span>
        </div>
        <div className="text-right">
          <p className="text-bright text-xs font-mono">{timeStr}</p>
          <p className="text-muted text-[10px] font-mono">{dateStr}</p>
        </div>
      </div>
    </header>
  );
}