import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { ChatView } from './components/Chat/ChatView';
import { WorkspaceView } from './components/Workspace/WorkspaceView';
import { AdminPanel } from './components/Admin/AdminPanel';
import { PricingModal } from './components/Subscription/PricingModal';
import { SettingsModal } from './components/Settings/SettingsModal';

function MainApp() {
  const [activeView, setActiveView] = useState<'chat' | 'workspace' | 'admin'>('chat');
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  const handleOpenInWorkspace = (code: string, language: string) => {
    setActiveView('workspace');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#030407] text-gray-100 font-sans overflow-hidden">
      {/* Header Bar */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
      />

      {/* Main Body View */}
      <main className="flex-1 flex overflow-hidden">
        {activeView === 'chat' && (
          <ChatView
            onOpenPricing={() => setIsPricingOpen(true)}
            onOpenInWorkspace={handleOpenInWorkspace}
            isSidebarOpenMobile={isSidebarOpenMobile}
            setIsSidebarOpenMobile={setIsSidebarOpenMobile}
          />
        )}

        {activeView === 'workspace' && (
          <WorkspaceView onBackToChat={() => setActiveView('chat')} />
        )}

        {activeView === 'admin' && (
          <AdminPanel onBackToChat={() => setActiveView('chat')} />
        )}
      </main>

      {/* Modals */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenPricing={() => setIsPricingOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
