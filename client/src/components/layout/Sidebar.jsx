import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/authStore';

const NAV = [
  {
    label: 'OPERATIONS',
    items: [
      { to: '/dashboard', icon: '▦', label: 'Dashboard' },
      { to: '/orders',    icon: '◈', label: 'Orders' },
    ],
  },
  {
    label: 'CATALOG',
    items: [
      { to: '/products',   icon: '⬡', label: 'Products' },
      { to: '/categories', icon: '◻', label: 'Categories' },
    ],
  },
  {
    label: 'INVENTORY',
    items: [
      { to: '/inventory/restock', icon: '↑', label: 'Restock Queue' },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-60 flex-shrink-0 bg-surface border-r border-border flex flex-col shadow-panel">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 bg-amber rounded flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
            <rect x="2" y="3" width="9" height="9" rx="1" fill="#0a0a0c" />
            <rect x="13" y="3" width="9" height="9" rx="1" fill="#0a0a0c" opacity="0.6" />
            <rect x="2" y="14" width="9" height="7" rx="1" fill="#0a0a0c" opacity="0.6" />
            <rect x="13" y="14" width="9" height="7" rx="1" fill="#0a0a0c" />
          </svg>
        </div>
        <span className="font-display font-700 text-base text-bright tracking-tight">
          StockCommand
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV.map((group) => (
          <div key={group.label}>
            <p className="px-2 mb-2 text-[10px] font-mono text-muted uppercase tracking-[0.15em]">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-display font-500 transition-all duration-150 ${
                        isActive
                          ? 'bg-amber/10 text-amber border border-amber/20'
                          : 'text-dim hover:text-soft hover:bg-panel'
                      }`
                    }
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded bg-amber/20 border border-amber/30 flex items-center justify-center flex-shrink-0">
            <span className="text-amber text-xs font-mono font-500">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-bright text-xs font-display font-600 truncate">{user?.name}</p>
            <p className="text-muted text-[10px] font-mono truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-xs font-mono text-dim hover:text-rose transition-colors px-1 py-1"
        >
          → Sign out
        </button>
      </div>
    </aside>
  );
}