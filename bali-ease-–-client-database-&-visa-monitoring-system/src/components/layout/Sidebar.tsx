import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Bell,
  PhoneCall,
  Settings,
  ShieldCheck,
  ChevronLeft,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onToggle,
}) => {
  const { userProfile, isAdmin } = useAuth();
  const { activeReminders, clients } = useData();

  const reminderCount = activeReminders.length;
  const pendingFollowUpCount = clients.filter(
    (c) => !c.statusFollowUp || c.statusFollowUp === 'Belum Follow-up'
  ).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'database',
      label: 'Visa Database',
      icon: FileSpreadsheet,
      badge: clients.length > 0 ? clients.length : null,
    },
    {
      id: 'reminders',
      label: 'Stay Permit Reminder',
      icon: Bell,
      badge: reminderCount > 0 ? reminderCount : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'followup',
      label: 'Follow-up Management',
      icon: PhoneCall,
      badge: pendingFollowUpCount > 0 ? pendingFollowUpCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop overlay when sidebar is open on small screens */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container with smooth sliding animation */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen bg-[#133D3D] text-[#FFFFFF] flex flex-col justify-between shrink-0 border-r border-[#0d2a2a] shadow-xl transition-all duration-300 ease-in-out select-none ${
          isOpen
            ? 'w-64 translate-x-0'
            : '-translate-x-full lg:-ml-64 w-64'
        }`}
      >
        {/* Top Logo & App Title */}
        <div className="overflow-y-auto overflow-x-hidden flex-1">
          <div className="p-3.5 border-b border-white/10 flex items-center justify-between gap-2 bg-[#0e2c2c]/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/assets/aistudio/Bali_Ease_NEW_FIX_FULL_59b40849.png"
                alt="Bali Ease"
                className="h-10 w-10 object-contain rounded-lg bg-[#133D3D] border border-[#D6C3A2]/40 p-0.5 shadow-xs shrink-0"
              />
              <div className="min-w-0">
                <h2 className="font-bold text-xs tracking-wide text-[#FDF7EB] uppercase truncate">
                  Bali Ease
                </h2>
                <p className="text-[10px] text-[#D6C3A2] tracking-wider truncate font-medium">
                  PT Bali Terang Bersinar
                </p>
              </div>
            </div>

            {/* Collapse toggle button inside sidebar header */}
            <button
              onClick={onToggle}
              title="Tutup Menu (Geser ke kiri)"
              className="p-1.5 text-[#D6C3A2] hover:text-[#FFFFFF] hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5 hidden lg:block" />
              <X className="w-5 h-5 lg:hidden" />
            </button>
          </div>

          {/* Proportional Brand Card */}
          <div className="px-4 py-3 border-b border-white/5 bg-[#0e2c2c]/20 text-center">
            <img
              src="/assets/aistudio/Bali_Ease_NEW_FIX_FULL_59b40849.png"
              alt="Bali Ease - Visa & KITAS Specialist"
              className="h-14 w-auto max-w-[150px] object-contain mx-auto rounded-lg drop-shadow-xs"
            />
            <p className="text-[10px] text-[#D6C3A2]/90 mt-1 font-medium tracking-tight">
              Visa & KITAS Specialist
            </p>
          </div>

          {/* Navigation Menu */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-[#D6C3A2]/70 uppercase">
              Menu Utama
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    // On mobile, close sidebar after selecting tab
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#D6C3A2] text-[#133D3D] shadow-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#133D3D]' : 'text-[#D6C3A2]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isActive
                          ? 'bg-[#133D3D] text-[#FDF7EB]'
                          : item.badgeColor || 'bg-white/20 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer User Role Info */}
        <div className="p-3.5 m-2.5 bg-white/5 rounded-xl border border-white/10 text-xs shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D6C3A2]" />
            <span className="font-semibold text-[#FDF7EB] text-[11px]">Hak Akses Aktif</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-300">Role Anda:</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                isAdmin ? 'bg-[#D6C3A2] text-[#133D3D]' : 'bg-amber-400 text-[#133D3D]'
              }`}
            >
              {userProfile?.role || (isAdmin ? 'ADMIN' : 'CS')}
            </span>
          </div>
          <p className="text-[9px] text-gray-400 mt-1.5 leading-snug line-clamp-2">
            {isAdmin
              ? 'Hak akses penuh admin (CRUD database, import/export, master data, reminder, audit).'
              : 'Hak akses CS (Input database, follow-up, pantau reminder).'}
          </p>
        </div>
      </aside>
    </>
  );
};
