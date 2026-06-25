import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const PAGE_FALLBACK = (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 text-accent animate-spin" />
  </div>
);

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto animate-fade-in">
          <Suspense fallback={PAGE_FALLBACK}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
