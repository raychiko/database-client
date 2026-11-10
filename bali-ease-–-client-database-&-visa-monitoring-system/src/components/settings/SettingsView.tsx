import React, { useState } from 'react';
import {
  Settings,
  Compass,
  Sliders,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  History,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GeneralSettings } from './GeneralSettings';
import { VisaServicesSettings } from './VisaServicesSettings';
import { ReminderSettingsView } from './ReminderSettingsView';
import { UserManagementView } from './UserManagementView';
import { UserAccessManagementView } from './UserAccessManagementView';
import { DataManagementSettings } from './DataManagementSettings';
import { AuditLogView } from './AuditLogView';

type SettingsTab =
  | 'general'
  | 'services'
  | 'reminders'
  | 'users'
  | 'access'
  | 'data'
  | 'audit';

export const SettingsView: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const tabs: {
    key: SettingsTab;
    label: string;
    icon: React.ElementType;
    adminOnly?: boolean;
    csAllowed?: boolean;
  }[] = [
    { key: 'general', label: '1. General Settings', icon: Settings, csAllowed: true },
    { key: 'services', label: '2. Visa Services', icon: Compass, csAllowed: hasPermission('canEditReminderSettings') },
    { key: 'reminders', label: '3. Reminder Settings', icon: Sliders, csAllowed: hasPermission('canEditReminderSettings') },
    { key: 'users', label: '4. User Management', icon: Users, adminOnly: true },
    { key: 'access', label: '5. User Access Management', icon: ShieldCheck, adminOnly: true },
    { key: 'data', label: '6. Data Management', icon: FileSpreadsheet, csAllowed: hasPermission('canExportExcel') || hasPermission('canImportExcel') },
    { key: 'audit', label: '7. Activity Log', icon: History, adminOnly: true },
  ];

  return (
    <div className="space-y-5">
      {/* Settings Navigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-[#D6C3A2] shadow-xs flex flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isRestricted = tab.adminOnly && !isAdmin;

          if (isRestricted) return null;

          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all select-none ${
                isSelected
                  ? 'bg-[#133D3D] text-[#FDF7EB] shadow-xs'
                  : 'text-gray-600 hover:text-[#133D3D] hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'services' && <VisaServicesSettings />}
        {activeTab === 'reminders' && <ReminderSettingsView />}
        {activeTab === 'users' && (isAdmin ? <UserManagementView /> : null)}
        {activeTab === 'access' && (isAdmin ? <UserAccessManagementView /> : null)}
        {activeTab === 'data' && <DataManagementSettings />}
        {activeTab === 'audit' && (isAdmin ? <AuditLogView /> : null)}
      </div>
    </div>
  );
};
