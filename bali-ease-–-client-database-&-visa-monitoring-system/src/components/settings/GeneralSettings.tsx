import React, { useState, useEffect } from 'react';
import { Settings, Clock, Globe, Shield, Database, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { MasterCategory } from '../../types';
import { getTodayWITAString } from '../../utils/dateUtils';

export const GeneralSettings: React.FC = () => {
  const { masterData, addMasterItem, updateMasterItem, deleteMasterItem } = useData();
  const { isAdmin } = useAuth();

  const [activeCategory, setActiveCategory] = useState<MasterCategory>('rekanan');
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Live WITA Clock
  const [witaTime, setWitaTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const str = new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Makassar',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(new Date());
        setWitaTime(str);
      } catch {
        setWitaTime(new Date().toTimeString());
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const categories: { key: MasterCategory; label: string; desc: string }[] = [
    { key: 'rekanan', label: 'Rekanan / Agent', desc: 'Daftar agen atau partner rekanan Bali Ease' },
    { key: 'imigrasi', label: 'Kantor Imigrasi', desc: 'Kantor Imigrasi pengurusan visa (contoh: Ngurah Rai, Denpasar)' },
    { key: 'status', label: 'Status Visa', desc: 'Tahapan status permohonan visa' },
    { key: 'statusFollowUp', label: 'Status Follow-up', desc: 'Status respon dan follow-up client visa' },
  ];

  const currentItems = masterData.filter((item) => item.category === activeCategory);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    setLoading(true);
    try {
      await addMasterItem(activeCategory, newValue.trim(), newValue.trim());
      setNewValue('');
    } catch (err: any) {
      alert('Gagal menambah data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editValue.trim()) return;
    setLoading(true);
    try {
      await updateMasterItem(id, editValue.trim(), editValue.trim());
      setEditingId(null);
      setEditValue('');
    } catch (err: any) {
      alert('Gagal mengubah data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, val: string) => {
    if (!window.confirm(`Hapus opsi "${val}" dari master data?`)) return;
    setLoading(true);
    try {
      await deleteMasterItem(id);
    } catch (err: any) {
      alert('Gagal menghapus data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Information Card */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6C3A2] shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-[#133D3D]/10 text-[#133D3D]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#133D3D] text-sm">
              Informasi Umum & Konfigurasi Sistem
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">
              Bali Ease Client Database & Visa Monitoring System (PT Bali Terang Bersinar)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Timezone Info */}
          <div className="p-4 rounded-xl bg-[#FDF7EB] border border-[#D6C3A2]/60">
            <div className="flex items-center gap-2 text-xs font-bold text-[#133D3D] mb-1">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>Zona Waktu Operasional</span>
            </div>
            <p className="text-xs text-gray-700 font-medium">
              Asia/Makassar (WITA, UTC+8)
            </p>
            <div className="text-[11px] font-mono text-[#133D3D] font-bold mt-2 bg-white px-2.5 py-1.5 rounded-lg border border-[#D6C3A2]/40">
              {witaTime || 'WITA Clock'}
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5">
              Seluruh kalkulasi tanggal kedaluwarsa stay permit dan audit log disinkronkan dengan waktu WITA.
            </p>
          </div>

          {/* Database Info */}
          <div className="p-4 rounded-xl bg-[#FDF7EB] border border-[#D6C3A2]/60">
            <div className="flex items-center gap-2 text-xs font-bold text-[#133D3D] mb-1">
              <Database className="w-4 h-4 text-emerald-700" />
              <span>Penyimpanan Firestore</span>
            </div>
            <p className="text-xs text-gray-700 font-medium">
              Status: <span className="text-emerald-700 font-bold">Terhubung Permanen</span>
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Database Cloud Firestore aman, realtime, dan data tersimpan permanen di cloud.
            </p>
          </div>

          {/* Security & Access */}
          <div className="p-4 rounded-xl bg-[#FDF7EB] border border-[#D6C3A2]/60">
            <div className="flex items-center gap-2 text-xs font-bold text-[#133D3D] mb-1">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span>Keamanan & Hak Akses</span>
            </div>
            <p className="text-xs text-gray-700 font-medium">
              Role-Based Access Control (RBAC)
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Admin memiliki hak penuh, sementara Customer Service (CS) diatur hak aksesnya secara granular.
            </p>
          </div>
        </div>
      </div>

      {/* Master Data Dropdown Manager */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6C3A2] shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-[#133D3D] text-sm">
            Master Data Pilihan Dropdown
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">
            Kelola opsi dropdown untuk formulir registrasi dan update visa client.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 pt-1 border-b border-gray-100 pb-3">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === c.key
                  ? 'bg-[#133D3D] text-[#FDF7EB] shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Add New Master Option Form */}
        {isAdmin && (
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              placeholder={`Tambah opsi ${categories.find((c) => c.key === activeCategory)?.label}...`}
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#133D3D]"
            />
            <button
              type="submit"
              disabled={loading || !newValue.trim()}
              className="px-4 py-2 bg-[#133D3D] text-[#FDF7EB] text-xs font-semibold rounded-xl hover:bg-[#0e2c2c] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </form>
        )}

        {/* List of Current Master Options */}
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
          {currentItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">
              Belum ada opsi master data untuk kategori ini.
            </div>
          ) : (
            currentItems.map((item, index) => {
              const isEditing = editingId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xs font-mono text-gray-400 w-6 text-center">
                      {index + 1}
                    </span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="px-2.5 py-1 text-xs border border-[#133D3D] rounded-lg bg-white flex-1 focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs font-semibold text-gray-800">
                        {item.value}
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Simpan"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100 rounded-lg transition"
                          >
                            Batal
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setEditValue(item.value);
                            }}
                            className="p-1.5 text-gray-500 hover:text-[#133D3D] hover:bg-gray-100 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.value)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
