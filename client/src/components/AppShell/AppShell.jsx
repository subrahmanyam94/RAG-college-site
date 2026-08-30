import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppShell({ children, currentPath }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F0] text-slate-800 selection:bg-orange-500 selection:text-white">
      <Navbar onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentPath={currentPath} />

        <main className="flex-1 flex flex-col overflow-y-auto bg-[#FAF7F0]">
          {children}
        </main>
      </div>
    </div>
  );
}
