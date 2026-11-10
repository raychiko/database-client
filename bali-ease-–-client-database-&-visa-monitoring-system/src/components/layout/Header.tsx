import React, { useState, useEffect } from 'react';
import {
  Clock,
  LogOut,
  LogIn,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getTodayWITAString } from '../../utils/dateUtils';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSidebarOpen, onToggleSidebar }) => {
  const { currentUser, userProfile, isAdmin, isCS, loginWithGoogle, logout, setUserRole } = useAuth();
  const [witaTime, setWitaTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const timeStr = new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Makassar',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(new Date());
        setWitaTime(timeStr);
      } catch {
        setWitaTime('');
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = getTodayWITAString();

  return (
    <header className="bg-white border-b border-[#D6C3A2] px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs sticky top-0 z-20">
      {/* Left: Sidebar Toggle Button + Logo + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Geser tutup sidebar ke kiri' : 'Buka menu sidebar'}
          className="p-2 text-[#133D3D] hover:bg-[#FDF7EB] border border-[#D6C3A2] rounded-xl transition-all shadow-2xs flex items-center justify-center cursor-pointer active:scale-95"
          aria-label="Toggle Navigation"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5 text-[#133D3D]" />
          ) : (
            <PanelLeftOpen className="w-5 h-5 text-[#133D3D]" />
          )}
        </button>

        <img
          src="/assets/aistudio/Bali_Ease_NEW_FIX_FULL_59b40849.png"
          alt="Bali Ease Logo"
          className="h-9 w-9 object-contain rounded-lg bg-[#133D3D] p-0.5 border border-[#D6C3A2] shadow-xs"
        />

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[#133D3D] tracking-tight leading-tight">
              Bali Ease
            </h1>
            <span className="text-[10px] bg-[#D6C3A2]/20 text-[#133D3D] font-bold px-2 py-0.5 rounded-full border border-[#D6C3A2]/40 hidden sm:inline-block">
              PT Bali Terang Bersinar
            </span>
          </div>
          <p className="text-[11px] text-gray-500 font-medium hidden md:block">
            Visa & KITAS Specialist • Client Database & Monitoring
          </p>
        </div>
      </div>

      {/* Right Controls: WITA Time, Role switch, User Info */}
      <div className="flex items-center gap-3">
        {/* WITA Live Clock Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#FDF7EB] border border-[#D6C3A2] rounded-lg text-xs text-[#133D3D]">
          <Clock className="w-3.5 h-3.5 text-[#133D3D]" />
          <span className="font-semibold">{todayStr}</span>
          <span className="font-mono text-gray-500">{witaTime} WITA</span>
        </div>

        {/* User Info & Role Switcher */}
        {currentUser ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Role Toggle (Admin <-> CS) for verification and testing */}
            <div className="flex items-center bg-[#FDF7EB] p-0.5 rounded-lg border border-[#D6C3A2]">
              <button
                onClick={() => setUserRole('ADMIN')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  isAdmin
                    ? 'bg-[#133D3D] text-[#FDF7EB] shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Beralih ke mode Admin"
              >
                ADMIN
              </button>
              <button
                onClick={() => setUserRole('CS')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  isCS
                    ? 'bg-[#133D3D] text-[#FDF7EB] shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Beralih ke mode CS"
              >
                CS
              </button>
            </div>

            {/* Profile pill */}
            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-[#133D3D] text-[#FDF7EB] flex items-center justify-center font-bold text-xs uppercase shadow-2xs border border-[#D6C3A2]">
                {userProfile?.displayName ? userProfile.displayName.charAt(0) : 'U'}
              </div>
              <div className="hidden xl:block text-left">
                <span className="text-xs font-bold text-gray-900 block leading-tight">
                  {userProfile?.userId ? `[${userProfile.userId}] ` : ''}{userProfile?.displayName || currentUser.email}
                </span>
                <span className="text-[10px] text-gray-500 font-mono block">
                  {userProfile?.userId ? `ID: ${userProfile.userId}` : currentUser.email}
                </span>
              </div>

              <button
                onClick={logout}
                title="Keluar"
                className="p-1.5 text-gray-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="px-4 py-2 bg-[#133D3D] text-[#FDF7EB] text-xs font-bold rounded-lg hover:bg-[#0d2a2a] transition-colors flex items-center gap-2 shadow-xs"
          >
            <LogIn className="w-4 h-4" />
            Login Akun
          </button>
        )}
      </div>
    </header>
  );
};
