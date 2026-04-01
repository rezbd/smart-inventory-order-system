import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar  from './Topbar';

export default function AppLayout() {
  return (
    <div
      style={{ height: '100vh', width: '100vw', display: 'flex', overflow: 'hidden' }}
      className="bg-void"
    >
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <Sidebar />

      {/* ── Right column ────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar — fixed height, never scrolls */}
        <Topbar />

        {/* Main content — this is the ONLY thing that scrolls */}
        <main
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
          className="p-6"
        >
          <Outlet />
        </main>

        {/* Toast container — pinned to bottom-right of the right column */}
        <div
          id="toast-container"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right:  '1.5rem',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            width: '20rem',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}