import React, { useState } from 'react';
import {
  LogIn,
  Shield,
  Users,
  Lock,
  User,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginView: React.FC = () => {
  const { loginWithAdminEmail, loginWithCSUserId } = useAuth();

  const [activeTab, setActiveTab] = useState<'ADMIN' | 'CS'>('ADMIN');

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // CS form state
  const [csUserId, setCsUserId] = useState('');
  const [csPassword, setCsPassword] = useState('');
  const [showCsPassword, setShowCsPassword] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      setErrorMsg('Email Admin wajib diisi.');
      return;
    }
    if (!adminPassword) {
      setErrorMsg('Password wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithAdminEmail(adminEmail, adminPassword, rememberMe);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login Admin gagal. Silakan periksa kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleCSSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csUserId.trim()) {
      setErrorMsg('User ID CS wajib diisi.');
      return;
    }
    if (!csPassword) {
      setErrorMsg('Password wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithCSUserId(csUserId, csPassword);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login CS gagal. Periksa User ID dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF7EB] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#D6C3A2] shadow-xl overflow-hidden">
        {/* Brand Header */}
        <div className="bg-[#133D3D] text-[#FFFFFF] p-7 text-center relative overflow-hidden">
          <img
            src="/assets/aistudio/Bali_Ease_NEW_FIX_FULL_59b40849.png"
            alt="Bali Ease - Visa & KITAS Specialist"
            className="h-20 w-auto object-contain rounded-2xl mx-auto mb-2.5 shadow-md border border-[#D6C3A2]/30"
          />
          <p className="text-[11px] text-[#D6C3A2] font-semibold uppercase tracking-wider">
            PT Bali Terang Bersinar
          </p>
          <p className="text-xs text-white/90 mt-1 font-medium">
            Client Database & Visa Monitoring System
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#D6C3A2]/40 bg-[#FDF7EB]/60">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ADMIN');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'ADMIN'
                ? 'border-[#133D3D] text-[#133D3D] bg-white'
                : 'border-transparent text-gray-500 hover:text-[#133D3D]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('CS');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'CS'
                ? 'border-[#133D3D] text-[#133D3D] bg-white'
                : 'border-transparent text-gray-500 hover:text-[#133D3D]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>CS Login</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-7 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {activeTab === 'ADMIN' ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="nama@baliease.com atau raychiko83@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D] focus:border-[#133D3D]"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D] focus:border-[#133D3D]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    title={showAdminPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showAdminPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-gray-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-[#133D3D] focus:ring-[#133D3D] h-4 w-4"
                  />
                  <span className="font-medium">Ingat Saya (Remember Me)</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#133D3D] text-[#FDF7EB] font-bold rounded-xl hover:bg-[#0e2c2c] transition-all flex items-center justify-center gap-2 shadow-sm text-xs disabled:opacity-50 cursor-pointer"
              >
                <Shield className="w-4 h-4 text-[#D6C3A2]" />
                {loading ? 'Memverifikasi Autentikasi...' : 'Masuk sebagai Admin'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCSSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  User ID CS
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={csUserId}
                    onChange={(e) => setCsUserId(e.target.value.toUpperCase())}
                    placeholder="Contoh: CS001, CS002"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D] focus:border-[#133D3D] uppercase tracking-wider font-mono font-bold"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Masukkan User ID yang diberikan oleh Administrator.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showCsPassword ? 'text' : 'password'}
                    value={csPassword}
                    onChange={(e) => setCsPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D] focus:border-[#133D3D]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCsPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    title={showCsPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showCsPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#133D3D] text-[#FDF7EB] font-bold rounded-xl hover:bg-[#0e2c2c] transition-all flex items-center justify-center gap-2 shadow-sm text-xs disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-[#D6C3A2]" />
                {loading ? 'Memverifikasi Autentikasi...' : 'Masuk sebagai CS'}
              </button>
            </form>
          )}

          {/* System Security Badges */}
          <div className="pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Autentikasi aman terintegrasi dengan Firebase Authentication</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Sesi terenkripsi & tersimpan secara aman di browser</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
