import React, { useState } from 'react';
import AppShell from '../components/AppShell/AppShell';
import ChatHistorySidebar from '../components/ChatHistorySidebar/ChatHistorySidebar';
import ChatWindow from '../components/ChatWindow/ChatWindow';

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AppShell currentPath="/chat">
      <div className="flex-1 flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Chat History Session Sidebar */}
        <ChatHistorySidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Chat Interface */}
        <ChatWindow />
      </div>
    </AppShell>
  );
}
