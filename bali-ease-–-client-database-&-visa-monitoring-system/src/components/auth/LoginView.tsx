import React, { useState } from 'react';
import { Compass, LogIn, Shield, Users, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginView: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login error:', err);
      const code = err.code || err.message || '';
      if (code.includes('popup-blocked')) {
        setErrorMsg('Jendela pop-up login diblokir oleh browser Anda. Harap izinkan pop-up (Allow pop-ups) untuk situs ini lalu coba lagi.');
      } else if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
        setErrorMsg('Jendela login ditutup sebelum proses autentikasi selesai. Silakan klik tombol di bawah untuk mencoba kembali.');
      } else if (code.includes('api-key-not-valid')) {
        setErrorMsg('Kunci API baru saja selesai dipropagasi oleh Google Cloud. Silakan klik "Sign in with Google" untuk melanjutkan.');
      } else {
        setErrorMsg(err.message || 'Gagal masuk dengan Google. Silakan coba kembali.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF7EB] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#D6C3A2] shadow-xl overflow-hidden">
        {/* Brand Header */}
        <div className="bg-[#133D3D] text-[#FFFFFF] p-8 text-center relative overflow-hidden">
          <img
            src="/assets/aistudio/Bali_Ease_NEW_FIX_FULL_59b40849.png"
            alt="Bali Ease - Visa & KITAS Specialist"
            className="h-24 w-auto object-contain rounded-2xl mx-auto mb-3 shadow-md border border-[#D6C3A2]/30"
          />
          <p className="text-xs text-[#D6C3A2] font-semibold uppercase tracking-wider mt-1">
            PT Bali Terang Bersinar
          </p>
          <p className="text-xs text-white/80 mt-1.5 font-medium">
            Client Database & Visa Monitoring System
          </p>
        </div>

        {/* Login Body */}
        <div className="p-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-sm font-bold text-[#133D3D]">Masuk ke Sistem Operasional</h2>
            <p className="text-xs text-gray-500">
              Gunakan akun Google yang terdaftar untuk mengakses database dan pemantauan Stay Permit.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-[#133D3D] text-[#FDF7EB] font-bold rounded-xl hover:bg-[#0d2a2a] transition-all flex items-center justify-center gap-3 shadow-md disabled:opacity-50 text-xs"
            >
              <LogIn className="w-4 h-4 text-[#D6C3A2]" />
              {loading ? 'Menghubungkan...' : 'Sign in with Google'}
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Database terenkripsi dan tersimpan permanen di Cloud Firestore</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Monitoring otomatis batas Stay Permit (Asia/Makassar WITA)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Dukungan penuh Import & Export spreadsheet Excel (.xlsx)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
