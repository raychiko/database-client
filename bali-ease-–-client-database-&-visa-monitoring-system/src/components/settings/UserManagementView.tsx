import React, { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, Key, Plus, RefreshCw, CheckCircle } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, UserRole } from '../../types';
import { formatDateTimeDisplay } from '../../utils/dateUtils';

export const UserManagementView: React.FC = () => {
  const { currentUser, userProfile: myProfile, recordAudit } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Add User State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('CS');
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleRoleChange = async (targetUser: UserProfile, role: UserRole) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', targetUser.uid), {
        role,
        updatedAt: new Date().toISOString(),
      });

      if (role === 'ADMIN') {
        await setDoc(doc(db, 'admins', targetUser.uid), {
          email: targetUser.email,
          createdAt: new Date().toISOString(),
        });
      }

      await recordAudit(
        'USER_ROLE_CHANGE',
        targetUser.displayName || targetUser.email,
        `Role changed to ${role}`
      );
    } catch (err: any) {
      alert('Gagal mengubah role: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setActionLoading(true);
    try {
      const pseudoUid = 'staff_' + Date.now();
      const profile: UserProfile = {
        uid: pseudoUid,
        email: newEmail.trim().toLowerCase(),
        displayName: newName.trim() || newEmail.split('@')[0],
        role: newRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', pseudoUid), profile);

      if (newRole === 'ADMIN') {
        await setDoc(doc(db, 'admins', pseudoUid), {
          email: profile.email,
          createdAt: new Date().toISOString(),
        });
      }

      await recordAudit('USER_ROLE_CHANGE', profile.displayName, `Registered new staff as ${newRole}`);
      setIsAddingUser(false);
      setNewEmail('');
      setNewName('');
    } catch (err: any) {
      alert('Gagal membuat akun staf: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Header Info */}
      <div className="bg-white p-4 rounded-xl border border-[#D6C3A2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-sm text-[#133D3D]">
            Manajemen Pengguna & Hak Akses (RBAC)
          </h4>
          <p className="text-gray-500 text-[11px] mt-0.5">
            Admin memiliki akses penuh termasuk Master Data, Import/Export, dan User Management. CS hanya memiliki akses operasional database dan follow-up.
          </p>
        </div>

        <button
          onClick={() => setIsAddingUser(true)}
          className="px-3.5 py-2 bg-[#133D3D] text-[#FDF7EB] font-semibold rounded-lg hover:bg-[#0d2a2a] transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Tambah Staf Baru
        </button>
      </div>

      {/* Add User Modal / Box */}
      {isAddingUser && (
        <form
          onSubmit={handleCreateUser}
          className="bg-[#FDF7EB] p-4 rounded-xl border border-[#D6C3A2] space-y-3"
        >
          <h5 className="font-bold text-xs text-[#133D3D]">Daftarkan Profil Staf Bali Ease</h5>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Email Pengguna
              </label>
              <input
                type="email"
                required
                placeholder="nama@baliease.com atau gmail"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#D6C3A2] rounded-md bg-white text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Sera / Trisna"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-[#D6C3A2] rounded-md bg-white text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Role Akses
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-[#D6C3A2] rounded-md bg-white text-xs focus:outline-none font-bold"
              >
                <option value="CS">Customer Service (CS)</option>
                <option value="ADMIN">Administrator (ADMIN)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingUser(false)}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-900"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-1.5 bg-[#133D3D] text-[#FDF7EB] font-semibold rounded-md hover:bg-[#0d2a2a] transition-colors"
            >
              Simpan Profil Staf
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-[#D6C3A2] shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#133D3D] text-[#FFFFFF] font-semibold">
            <tr>
              <th className="px-4 py-3 w-12 text-center">No</th>
              <th className="px-4 py-3">Nama Pengguna</th>
              <th className="px-4 py-3">Email Akun</th>
              <th className="px-4 py-3">Role Saat Ini</th>
              <th className="px-4 py-3">Waktu Terdaftar</th>
              <th className="px-4 py-3 text-right">Ubah Hak Akses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  {loading ? 'Memuat daftar pengguna...' : 'Belum ada data pengguna.'}
                </td>
              </tr>
            ) : (
              users.map((u, index) => {
                const isMe = u.uid === currentUser?.uid;
                return (
                  <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center font-mono text-gray-400 font-semibold">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{u.displayName || 'Staf'}</span>
                        {isMe && (
                          <span className="px-1.5 py-0.5 rounded-sm text-[9px] bg-[#133D3D] text-white font-medium">
                            Anda
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'ADMIN'
                            ? 'bg-[#133D3D] text-[#FDF7EB]'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDateTimeDisplay(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          disabled={actionLoading || u.role === 'ADMIN'}
                          onClick={() => handleRoleChange(u, 'ADMIN')}
                          className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-colors ${
                            u.role === 'ADMIN'
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-white text-[#133D3D] border-[#133D3D] hover:bg-[#FDF7EB]'
                          }`}
                        >
                          Set Admin
                        </button>
                        <button
                          disabled={actionLoading || u.role === 'CS'}
                          onClick={() => handleRoleChange(u, 'CS')}
                          className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-colors ${
                            u.role === 'CS'
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                          }`}
                        >
                          Set CS
                        </button>
                      </div>
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
