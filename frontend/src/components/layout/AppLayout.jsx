import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import { Toaster } from 'src/components/ui/sonner';
import Sidebar from './Sidebar';
import AICommandCentre from '../AICommandCentre';

import { Bot } from 'lucide-react';

export default function AppLayout() {
  const [showCommandCentre, setShowCommandCentre] = useState(false);
  const [showFloatingBot, setShowFloatingBot] = useState(false);

  useEffect(() => {
    setShowFloatingBot(true);
  }, []);

  return (
    <div className="flex">
      <Sidebar onOpenCommandCentre={() => setShowCommandCentre(true)} />
      <main className="ml-[260px] min-h-screen bg-gray-50 p-6 w-full">
        <Outlet />
      </main>

      {showFloatingBot && (
        <button
          onClick={() => setShowCommandCentre(true)}
          className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#0fd4b4] text-white shadow-lg flex items-center justify-center hover:bg-[#0bbfa1] transition-colors z-30"
        >
          <Bot size={24} />
        </button>
      )}

      {showCommandCentre && (
        <AICommandCentre onClose={() => setShowCommandCentre(false)} />
      )}

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
