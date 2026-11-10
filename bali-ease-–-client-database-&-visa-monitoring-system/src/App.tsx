/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { VisaDatabaseView } from './components/database/VisaDatabaseView';
import { StayPermitReminderView } from './components/reminders/StayPermitReminderView';
import { FollowUpManagementView } from './components/followup/FollowUpManagementView';
import { SettingsView } from './components/settings/SettingsView';
import { ClientDetailModal } from './components/database/ClientDetailModal';
import { VisaClient } from './types';

import { LoginView } from './components/auth/LoginView';

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<VisaClient | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF7EB] flex flex-col items-center justify-center space-y-4">
        <img
          src="/assets/aistudio/Bali_Ease_NEW_FIX_FULL_59b40849.png"
          alt="Bali Ease"
          className="w-20 h-20 object-contain rounded-2xl shadow-xl animate-pulse mx-auto"
        />
        <div className="text-center">
          <h2 className="text-base font-bold text-[#133D3D]">Bali Ease</h2>
          <p className="text-xs text-gray-500 mt-1">Menghubungkan ke Cloud Firestore...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#FDF7EB] flex overflow-x-hidden">
      {/* Sidebar Navigation (Collapsible with slide to left) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateToTab={setActiveTab}
              onOpenClientDetail={(c) => setSelectedClientForDetail(c)}
            />
          )}

          {activeTab === 'database' && <VisaDatabaseView />}

          {activeTab === 'reminders' && <StayPermitReminderView />}

          {activeTab === 'followup' && <FollowUpManagementView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Client Detail Modal */}
      <ClientDetailModal
        isOpen={!!selectedClientForDetail}
        onClose={() => setSelectedClientForDetail(null)}
        client={selectedClientForDetail}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}
