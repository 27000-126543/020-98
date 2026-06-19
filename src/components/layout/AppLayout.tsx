import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { ToastContainer } from '@/components/ui/Toast';

export const AppLayout = () => {
  return (
    <div className="h-full flex flex-col bg-ink-50">
      <TopBar />
      <main className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
};
