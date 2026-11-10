import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  CheckCircle,
  XCircle,
  RotateCcw,
  Save,
  CheckSquare,
  Square,
  AlertCircle,
  Eye,
  FileSpreadsheet,
  Edit,
  Trash2,
  Lock,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, CSPermissions, DEFAULT_CS_PERMISSIONS } from '../../types';

export const UserAccessManagementView: React.FC = () => {
  const { updateCSPermissions, recordAudit, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [currentPermissions, setCurrentPermissions] = useState<CSPermissions>(DEFAULT_CS_PERMISSIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
        });
        setUsers(list);
        setLoading(false);

        // Auto select first CS user if not selected
        if (!selectedUserId && list.length > 0) {
          const firstCS = list.find((u) => u.role === 'CS') || list[0];
          if (firstCS) {
            setSelectedUserId(firstCS.uid);
            setCurrentPermissions(firstCS.permissions || DEFAULT_CS_PERMISSIONS);
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'users');
      }
    );
    return () => unsub();
  }, []);

  const selectedUser = users.find((u) => u.uid === selectedUserId);

  const handleSelectUser = (uid: string) => {
    setSelectedUserId(uid);
    setSaveSuccess(false);
    setErrorMsg(null);
    const u = users.find((item) => item.uid === uid);
    if (u) {
      setCurrentPermissions(u.permissions || DEFAULT_CS_PERMISSIONS);
    }
  };

  const togglePermission = (key: keyof CSPermissions) => {
    setSaveSuccess(false);
    setCurrentPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectAll = () => {
    setSaveSuccess(false);
    const allTrue: CSPermissions = {
      canViewDashboard: true,
      canViewDatabase: true,
      canViewReminders: true,
      canViewFollowUp: true,
      canViewSettings: true,

      canCreateClient: true,
      canEditClient: true,
      canDeleteClient: true,
      canExportExcel: true,
      canImportExcel: true,

      canEditVisaStatus: true,
      canEditExpiryDate: true,
      canEditPassportNo: true,
      canEditSponsor: true,
      canEditService: true,
      canAddFollowUp: true,
      canEditReminderSettings: true,
      canManageUsers: true,
    };
    setCurrentPermissions(allTrue);
  };

  const handleDeselectAll = () => {
    setSaveSuccess(false);
    const allFalse: CSPermissions = {
      canViewDashboard: false,
      canViewDatabase: false,
      canViewReminders: false,
      canViewFollowUp: false,
      canViewSettings: false,

      canCreateClient: false,
      canEditClient: false,
      canDeleteClient: false,
      canExportExcel: false,
      canImportExcel: false,

      canEditVisaStatus: false,
      canEditExpiryDate: false,
      canEditPassportNo: false,
      canEditSponsor: false,
      canEditService: false,
      canAddFollowUp: false,
      canEditReminderSettings: false,
      canManageUsers: false,
    };
    setCurrentPermissions(allFalse);
  };

  const handleResetToDefault = () => {
    setSaveSuccess(false);
    setCurrentPermissions(DEFAULT_CS_PERMISSIONS);
  };

  const handleSavePermissions = async () => {
    if (!selectedUserId || !selectedUser) return;
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);
    try {
      await updateCSPermissions(selectedUserId, currentPermissions);
      await recordAudit(
        'PERMISSION_CHANGE',
        `${selectedUser.displayName} (${selectedUser.userId || selectedUser.email})`,
        'Updated granular CS permissions matrix'
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan hak akses.');
    } finally {
      setSaving(false);
    }
  };

  const csUsers = users.filter((u) => u.role === 'CS');

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6C3A2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#133D3D]" />
            <h3 className="font-bold text-[#133D3D] text-sm">
              User Access Management (Hak Akses Granular CS)
            </h3>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Konfigurasi hak akses menu, izin operasi data, dan pembatasan editing field untuk masing-masing akun Customer Service.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
          >
            Pilih Semua
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
          >
            Batalkan Semua
          </button>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Default CS
          </button>
        </div>
      </div>

      {/* Select User Selector */}
      <div className="bg-[#FDF7EB] p-4 rounded-2xl border border-[#D6C3A2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-[#133D3D] shrink-0">
            Pilih Akun CS:
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => handleSelectUser(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold bg-white border border-[#D6C3A2] rounded-xl focus:ring-2 focus:ring-[#133D3D] text-[#133D3D]"
          >
            {users.map((u) => (
              <option key={u.uid} value={u.uid}>
                {u.userId ? `[${u.userId}] ` : ''}{u.displayName} ({u.role}) - {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
              </option>
            ))}
          </select>
        </div>

        {selectedUser && (
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="font-semibold text-gray-500">Status Akun:</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedUser.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {selectedUser.status === 'active' ? 'Aktif' : 'Nonaktif'}
            </span>
            <span className="text-gray-400">|</span>
            <span className="font-mono text-gray-600 font-bold">
              ID: {selectedUser.userId || selectedUser.email}
            </span>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Hak akses untuk <strong>{selectedUser?.displayName}</strong> berhasil disimpan dan segera berlaku!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Permissions Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Section A: Modul & Menu */}
        <div className="bg-white p-5 rounded-2xl border border-[#D6C3A2] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-[#133D3D]">
            <Eye className="w-4 h-4 text-emerald-800" />
            <h4 className="font-bold text-xs">A. Akses Menu & Modul</h4>
          </div>
          <div className="space-y-3">
            {[
              { key: 'canViewDashboard' as keyof CSPermissions, label: 'Akses Dashboard', desc: 'Melihat ringkasan statistik dan grafik' },
              { key: 'canViewDatabase' as keyof CSPermissions, label: 'Akses Visa Database', desc: 'Melihat tabel daftar klien visa' },
              { key: 'canViewReminders' as keyof CSPermissions, label: 'Akses Stay Permit Reminder', desc: 'Melihat monitoring masa berlaku' },
              { key: 'canViewFollowUp' as keyof CSPermissions, label: 'Akses Follow-up Management', desc: 'Melihat riwayat tindak lanjut CS' },
              { key: 'canViewSettings' as keyof CSPermissions, label: 'Akses Settings (Terbatas)', desc: 'Melihat menu pengaturan' },
            ].map((item) => (
              <label
                key={item.key}
                onClick={() => togglePermission(item.key)}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition select-none"
              >
                <input
                  type="checkbox"
                  checked={!!currentPermissions[item.key]}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-[#133D3D] focus:ring-[#133D3D] h-4 w-4"
                />
                <div>
                  <div className="text-xs font-bold text-gray-800">{item.label}</div>
                  <div className="text-[11px] text-gray-500">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Section B: Operasi Data */}
        <div className="bg-white p-5 rounded-2xl border border-[#D6C3A2] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-[#133D3D]">
            <FileSpreadsheet className="w-4 h-4 text-emerald-800" />
            <h4 className="font-bold text-xs">B. Operasi Data Client</h4>
          </div>
          <div className="space-y-3">
            {[
              { key: 'canCreateClient' as keyof CSPermissions, label: 'Menambah Data Client Baru', desc: 'Formulir input data visa baru' },
              { key: 'canEditClient' as keyof CSPermissions, label: 'Mengedit Data Client', desc: 'Memperbarui data klien yang ada' },
              { key: 'canDeleteClient' as keyof CSPermissions, label: 'Menghapus Data Client', desc: 'Hapus data dari Visa Database' },
              { key: 'canExportExcel' as keyof CSPermissions, label: 'Export Data ke Excel (.xlsx)', desc: 'Download laporan spreadsheet' },
              { key: 'canImportExcel' as keyof CSPermissions, label: 'Import Data dari Excel (.xlsx)', desc: 'Unggah data massal dari file' },
            ].map((item) => (
              <label
                key={item.key}
                onClick={() => togglePermission(item.key)}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition select-none"
              >
                <input
                  type="checkbox"
                  checked={!!currentPermissions[item.key]}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-[#133D3D] focus:ring-[#133D3D] h-4 w-4"
                />
                <div>
                  <div className="text-xs font-bold text-gray-800">{item.label}</div>
                  <div className="text-[11px] text-gray-500">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Section C: Field Level Control */}
        <div className="bg-white p-5 rounded-2xl border border-[#D6C3A2] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-[#133D3D]">
            <Edit className="w-4 h-4 text-emerald-800" />
            <h4 className="font-bold text-xs">C. Hak Akses Kolom / Tindakan Tertentu</h4>
          </div>
          <div className="space-y-3">
            {[
              { key: 'canEditVisaStatus' as keyof CSPermissions, label: 'Mengubah Status Visa', desc: 'Otorisasi ubah status proses visa' },
              { key: 'canEditExpiryDate' as keyof CSPermissions, label: 'Mengubah Stay Permit / Expired Date', desc: 'Mengedit tanggal habis berlaku' },
              { key: 'canEditPassportNo' as keyof CSPermissions, label: 'Mengubah Nomor Passport', desc: 'Koreksi nomor identitas passport' },
              { key: 'canEditSponsor' as keyof CSPermissions, label: 'Mengubah Sponsor Client', desc: 'Mengubah nama sponsor penjamin' },
              { key: 'canEditService' as keyof CSPermissions, label: 'Mengubah Layanan Visa (Service)', desc: 'Mengganti jenis produk visa' },
              { key: 'canAddFollowUp' as keyof CSPermissions, label: 'Menambah Catatan Follow-up', desc: 'Mencatat riwayat follow-up klien' },
              { key: 'canEditReminderSettings' as keyof CSPermissions, label: 'Mengubah Pengaturan Reminder', desc: 'Ubah ambang hari peringatan' },
              { key: 'canManageUsers' as keyof CSPermissions, label: 'Mengelola Pengguna Lain', desc: 'Akses User Management (Admin)' },
            ].map((item) => (
              <label
                key={item.key}
                onClick={() => togglePermission(item.key)}
                className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition select-none"
              >
                <input
                  type="checkbox"
                  checked={!!currentPermissions[item.key]}
                  onChange={() => {}}
                  className="mt-0.5 rounded text-[#133D3D] focus:ring-[#133D3D] h-4 w-4"
                />
                <div>
                  <div className="text-xs font-bold text-gray-800">{item.label}</div>
                  <div className="text-[11px] text-gray-500">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#D6C3A2] shadow-xs flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Mengatur hak akses untuk akun:{' '}
          <strong className="text-[#133D3D]">
            {selectedUser?.displayName} ({selectedUser?.userId || selectedUser?.email})
          </strong>
        </div>

        <button
          onClick={handleSavePermissions}
          disabled={saving || !selectedUserId}
          className="px-6 py-2.5 bg-[#133D3D] text-[#FDF7EB] font-bold text-xs rounded-xl hover:bg-[#0d2a2a] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-[#D6C3A2]" />
          <span>{saving ? 'Menyimpan...' : 'Simpan Hak Akses'}</span>
        </button>
      </div>
    </div>
  );
};
