import React, { useState } from 'react';
import { Database, Sliders, Users, History, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MasterDataSettings } from './MasterDataSettings';
import { ReminderSettingsView } from './ReminderSettingsView';
import { UserManagementView } from './UserManagementView';
import { AuditLogView } from './AuditLogView';

export const SettingsView: React.FC = () => {
  const { isAdmin } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'master' | 'reminders' | 'users' | 'audit'>('master');

  return (
    <div className="space-y-5">
      {/* Settings Navigation Tabs */}
      <div className="bg-white p-2 rounded-xl border border-[#D6C3A2] shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('master')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
            activeSubTab === 'master'
              ? 'bg-[#133D3D] text-[#FDF7EB] shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Master Data</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reminders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
            activeSubTab === 'reminders'
              ? 'bg-[#133D3D] text-[#FDF7EB] shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Reminder Settings</span>
        </button>

        {isAdmin ? (
          <>
            <button
              onClick={() => setActiveSubTab('users')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSubTab === 'users'
                  ? 'bg-[#133D3D] text-[#FDF7EB] shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </button>

            <button
              onClick={() => setActiveSubTab('audit')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                activeSubTab === 'audit'
                  ? 'bg-[#133D3D] text-[#FDF7EB] shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Log</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 text-[11px] text-gray-400 italic">
            <Lock className="w-3.5 h-3.5" />
            <span>User Management & Audit Log khusus Admin</span>
          </div>
        )}
      </div>

      {/* Sub Tab Contents */}
      <div>
        {activeSubTab === 'master' && <MasterDataSettings />}
        {activeSubTab === 'reminders' && <ReminderSettingsView />}
        {activeSubTab === 'users' && (isAdmin ? <UserManagementView /> : null)}
        {activeSubTab === 'audit' && (isAdmin ? <AuditLogView /> : null)}
      </div>
    </div>
  );
};
