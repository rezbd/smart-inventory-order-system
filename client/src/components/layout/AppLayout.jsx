import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar  from './Topbar';

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-void overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <div
        id="toast-container"
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-80 pointer-events-none"
      />
    </div>
  );
}