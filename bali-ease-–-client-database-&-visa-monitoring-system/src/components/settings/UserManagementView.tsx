import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Plus,
  Key,
  Edit2,
  Trash2,
  Lock,
  CheckCircle,
  AlertCircle,
  X,
  UserCheck,
  UserX,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { UserProfile } from '../../types';
import { formatDateTimeDisplay } from '../../utils/dateUtils';

export const UserManagementView: React.FC = () => {
  const {
    createCSUser,
    updateCSUser,
    toggleUserStatus,
    deleteCSUser,
    recordAudit,
    currentUser,
  } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Create CS Modal
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Reset Password Modal
  const [resetModalUser, setResetModalUser] = useState<UserProfile | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetConfirmVal, setResetConfirmVal] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUserId, setEditUserId] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete User Confirmation Modal
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'users');
      }
    );
    return () => unsub();
  }, []);

  const handleOpenAddUser = () => {
    // Generate next available CS ID (e.g. CS001, CS002...)
    const csList = users.filter((u) => u.userId?.startsWith('CS'));
    const nextNum = csList.length + 1;
    const padded = String(nextNum).padStart(3, '0');
    setNewUserId(`CS${padded}`);
    setNewDisplayName('');
    setNewPassword('');
    setConfirmPassword('');
    setModalError(null);
    setIsAddingUser(true);
  };

  const handleCreateCS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) {
      setModalError('User ID CS wajib diisi.');
      return;
    }
    if (!newDisplayName.trim()) {
      setModalError('Nama CS wajib diisi.');
      return;
    }
    if (!newPassword) {
      setModalError('Password wajib diisi.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setModalError('Konfirmasi password tidak cocok.');
      return;
    }
    if (newPassword.length < 6) {
      setModalError('Password minimal 6 karakter.');
      return;
    }

    setActionLoading(true);
    setModalError(null);
    try {
      await createCSUser({
        userId: newUserId.trim().toUpperCase(),
        displayName: newDisplayName.trim(),
        password: newPassword,
        status: 'active',
      });
      setIsAddingUser(false);
    } catch (err: any) {
      setModalError(err.message || 'Gagal membuat akun CS.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const confirmText = newStatus === 'inactive'
      ? `Nonaktifkan akun ${user.displayName}? CS ini tidak akan bisa login ke sistem.`
      : `Aktifkan kembali akun ${user.displayName}?`;
    if (!window.confirm(confirmText)) return;

    try {
      await toggleUserStatus(user.uid, newStatus);
    } catch (err: any) {
      alert('Gagal mengubah status akun: ' + err.message);
    }
  };

  const handleOpenResetPassword = (user: UserProfile) => {
    setResetModalUser(user);
    setResetPasswordVal('');
    setResetConfirmVal('');
    setResetError(null);
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    if (!resetPasswordVal) {
      setResetError('Password baru wajib diisi.');
      return;
    }
    if (resetPasswordVal !== resetConfirmVal) {
      setResetError('Konfirmasi password tidak cocok.');
      return;
    }
    if (resetPasswordVal.length < 6) {
      setResetError('Password minimal 6 karakter.');
      return;
    }

    setResetLoading(true);
    setResetError(null);
    try {
      await updateCSUser(resetModalUser.uid, {}, resetPasswordVal);
      await recordAudit('UPDATE_CS_USER', resetModalUser.displayName, 'Reset CS password');
      alert(`Password untuk ${resetModalUser.displayName} berhasil diperbarui!`);
      setResetModalUser(null);
    } catch (err: any) {
      setResetError(err.message || 'Gagal mereset password.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleOpenEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditUserId(user.userId || '');
    setEditDisplayName(user.displayName || '');
    setEditStatus(user.status || 'active');
    setEditPassword('');
    setEditConfirmPassword('');
    setEditError(null);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const cleanUserId = editUserId.trim().toUpperCase();
    const cleanName = editDisplayName.trim();

    if (!cleanUserId) {
      setEditError('User ID CS wajib diisi.');
      return;
    }
    if (!cleanName) {
      setEditError('Nama lengkap CS wajib diisi.');
      return;
    }

    // Check duplicate userId
    const duplicate = users.find(
      (u) => u.uid !== editingUser.uid && (u.userId || '').toUpperCase() === cleanUserId
    );
    if (duplicate) {
      setEditError(`User ID "${cleanUserId}" sudah digunakan oleh ${duplicate.displayName}.`);
      return;
    }

    if (editPassword) {
      if (editPassword.length < 6) {
        setEditError('Password baru minimal 6 karakter.');
        return;
      }
      if (editPassword !== editConfirmPassword) {
        setEditError('Konfirmasi password baru tidak cocok.');
        return;
      }
    }

    setEditLoading(true);
    setEditError(null);
    try {
      await updateCSUser(
        editingUser.uid,
        {
          userId: cleanUserId,
          displayName: cleanName,
          status: editStatus,
        },
        editPassword ? editPassword : undefined
      );
      await recordAudit(
        'UPDATE_CS_USER',
        cleanName,
        `Updated CS profile (${cleanUserId})${editPassword ? ' and changed password' : ''}`
      );
      setEditingUser(null);
    } catch (err: any) {
      setEditError(err.message || 'Gagal menyimpan perubahan pengguna.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;
    if (
      deletingUser.uid === currentUser?.uid ||
      deletingUser.role === 'ADMIN' ||
      deletingUser.email === 'raychiko83@gmail.com'
    ) {
      alert('Akun Administrator tidak dapat dihapus.');
      setDeletingUser(null);
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteCSUser(deletingUser.uid);
      await recordAudit(
        'USER_ROLE_CHANGE',
        deletingUser.displayName || deletingUser.uid,
        `Deleted CS user account (${deletingUser.userId || 'CS'})`
      );
      setDeletingUser(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus pengguna.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6C3A2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#133D3D]" />
            <h3 className="font-bold text-[#133D3D] text-sm">
              User Management (Kelola Pengguna)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#133D3D]/10 text-[#133D3D]">
              {users.length} Akun
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Buat akun CS dengan User ID unik & Password terenkripsi salt+hash. Atur status aktif/nonaktif dan reset password staf.
          </p>
        </div>

        <button
          onClick={handleOpenAddUser}
          className="px-4 py-2.5 bg-[#133D3D] text-[#FDF7EB] text-xs font-semibold rounded-xl hover:bg-[#0d2a2a] transition-colors flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#D6C3A2]" />
          <span>Buat Akun CS Baru</span>
        </button>
      </div>

      {/* Add CS User Modal */}
      {isAddingUser && (
        <div className="bg-[#FDF7EB] p-6 rounded-2xl border border-[#D6C3A2] shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#D6C3A2]/40 pb-3">
            <div>
              <h4 className="font-bold text-sm text-[#133D3D]">
                Pendaftaran Akun Customer Service (CS) Baru
              </h4>
              <p className="text-gray-500 text-xs">
                User ID dan password akan digunakan CS untuk login ke sistem Bali Ease.
              </p>
            </div>
            <button
              onClick={() => setIsAddingUser(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {modalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{modalError}</span>
            </div>
          )}

          <form onSubmit={handleCreateCS} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  User ID CS <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: CS001, CS002"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D] focus:border-[#133D3D] font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Lengkap CS <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sera / Trisna"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D] focus:border-[#133D3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D] focus:border-[#133D3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Konfirmasi Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D] focus:border-[#133D3D]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-[#133D3D] text-[#FDF7EB] text-xs font-bold rounded-xl hover:bg-[#0d2a2a] transition-all flex items-center gap-2 disabled:opacity-50 shadow-xs"
              >
                <CheckCircle className="w-4 h-4 text-[#D6C3A2]" />
                {actionLoading ? 'Mendaftarkan...' : 'Daftarkan Akun CS'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#D6C3A2] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-[#133D3D]">
                <Key className="w-5 h-5" />
                <h4 className="font-bold text-sm">Reset Password CS</h4>
              </div>
              <button
                onClick={() => setResetModalUser(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Ubah password login untuk akun{' '}
              <strong className="text-gray-900">
                {resetModalUser.displayName} ({resetModalUser.userId || resetModalUser.email})
              </strong>.
            </p>

            {resetError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleSaveResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ulangi password baru"
                  value={resetConfirmVal}
                  onChange={(e) => setResetConfirmVal(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2 bg-[#133D3D] text-[#FDF7EB] text-xs font-bold rounded-xl hover:bg-[#0d2a2a] transition-all disabled:opacity-50"
                >
                  {resetLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-[#D6C3A2] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-[#133D3D]">
                <Edit2 className="w-5 h-5" />
                <h4 className="font-bold text-sm">Edit Data Pengguna CS</h4>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Perbarui identitas, User ID, status aktif, atau ganti password akun CS ini.
            </p>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    User ID CS <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editUserId}
                    onChange={(e) => setEditUserId(e.target.value.toUpperCase())}
                    placeholder="Contoh: CS001"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D] font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nama Lengkap CS <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="Nama lengkap staf"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Status Akun
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    onClick={() => setEditStatus('active')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer select-none text-xs font-semibold ${
                      editStatus === 'active'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editStatus"
                      checked={editStatus === 'active'}
                      onChange={() => setEditStatus('active')}
                      className="text-emerald-600 focus:ring-emerald-600"
                    />
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Aktif</span>
                  </label>

                  <label
                    onClick={() => setEditStatus('inactive')}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer select-none text-xs font-semibold ${
                      editStatus === 'inactive'
                        ? 'border-rose-600 bg-rose-50 text-rose-900'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="editStatus"
                      checked={editStatus === 'inactive'}
                      onChange={() => setEditStatus('inactive')}
                      className="text-rose-600 focus:ring-rose-600"
                    />
                    <UserX className="w-4 h-4 text-rose-600" />
                    <span>Nonaktif</span>
                  </label>
                </div>
              </div>

              <div className="p-3.5 bg-[#FDF7EB] rounded-xl border border-[#D6C3A2]/60 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#133D3D]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Ganti Password Akun (Opsional)</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Kosongkan bila Anda tidak ingin mengubah password akun ini.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Password Baru
                    </label>
                    <input
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type="password"
                      placeholder="Ulangi password baru"
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 bg-[#133D3D] text-[#FDF7EB] text-xs font-bold rounded-xl hover:bg-[#0d2a2a] transition-all disabled:opacity-50 shadow-xs"
                >
                  {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-rose-300 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900">Hapus Akun Pengguna CS</h4>
                <p className="text-xs text-gray-500">Konfirmasi tindakan permanen</p>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun pengguna{' '}
              <strong className="text-gray-900 font-bold">
                {deletingUser.displayName} ({deletingUser.userId || 'CS'})
              </strong>?
              Pengguna ini tidak akan bisa login lagi ke sistem Bali Ease.
            </p>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-all disabled:opacity-50 shadow-xs flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleteLoading ? 'Menghapus...' : 'Ya, Hapus Pengguna'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-[#D6C3A2] shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#133D3D] text-[#FFFFFF] font-semibold">
            <tr>
              <th className="px-4 py-3.5 w-12 text-center">No</th>
              <th className="px-4 py-3.5">User ID</th>
              <th className="px-4 py-3.5">Nama Pengguna</th>
              <th className="px-4 py-3.5">Role</th>
              <th className="px-4 py-3.5 text-center">Status Akun</th>
              <th className="px-4 py-3.5">Login Terakhir</th>
              <th className="px-4 py-3.5 text-right">Aksi & Keamanan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-400">
                  {loading ? 'Memuat daftar pengguna...' : 'Belum ada pengguna terdaftar.'}
                </td>
              </tr>
            ) : (
              users.map((u, index) => {
                const isMe = u.uid === currentUser?.uid;
                const isAdminRole = u.role === 'ADMIN';
                const isActive = u.status === 'active';

                return (
                  <tr key={u.uid} className="hover:bg-[#FDF7EB]/40 transition-colors">
                    <td className="px-4 py-3.5 text-center font-mono text-gray-400 font-semibold">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-[#133D3D]">
                      {u.userId || (isAdminRole ? 'ADMIN' : '-')}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{u.displayName || 'Staf'}</span>
                        {isMe && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#133D3D] text-white font-medium">
                            Anda
                          </span>
                        )}
                      </div>
                      {u.email && (
                        <div className="text-[10px] text-gray-400 font-normal font-mono">
                          {u.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isAdminRole
                            ? 'bg-[#133D3D] text-[#FDF7EB]'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={isMe || isAdminRole}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                        } ${isMe || isAdminRole ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                        title={isMe || isAdminRole ? 'Akun Anda / Admin Utama' : 'Klik untuk mengubah status'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                        {isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 font-mono text-[11px]">
                      {u.lastLogin ? formatDateTimeDisplay(u.lastLogin) : 'Belum pernah login'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {!isAdminRole ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
                            title="Edit Data Pengguna"
                          >
                            <Edit2 className="w-3 h-3 text-blue-600" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleOpenResetPassword(u)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
                            title="Reset Password"
                          >
                            <Key className="w-3 h-3 text-[#133D3D]" />
                            <span>Reset Password</span>
                          </button>
                          <button
                            onClick={() => {
                              setDeletingUser(u);
                              setDeleteError(null);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">
                          {isMe ? 'Akun Anda' : 'Admin Utama (Protected)'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
