import React, { useState } from 'react';
import { Sliders, Plus, Edit2, Save, X, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ReminderSetting } from '../../types';

export const ReminderSettingsView: React.FC = () => {
  const { reminderSettings, addReminderSetting, updateReminderSetting, getMasterOptions } = useData();

  const serviceOptions = getMasterOptions('service');

  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState('');
  const [newDays, setNewDays] = useState<number>(60);

  const [editingItem, setEditingItem] = useState<ReminderSetting | null>(null);
  const [editDays, setEditDays] = useState<number>(60);
  const [loading, setLoading] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.trim()) return;
    setLoading(true);
    try {
      await addReminderSetting(newService.trim(), Number(newDays));
      setIsAdding(false);
      setNewService('');
      setNewDays(60);
    } catch (err: any) {
      alert('Gagal menambah setting reminder: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setLoading(true);
    try {
      await updateReminderSetting(editingItem.id, Number(editDays), editingItem.isActive);
      setEditingItem(null);
    } catch (err: any) {
      alert('Gagal memperbarui setting reminder: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (item: ReminderSetting) => {
    try {
      await updateReminderSetting(item.id, item.daysBeforeExpiry, !item.isActive);
    } catch (err: any) {
      alert('Gagal mengubah status: ' + err.message);
    }
  };

  return (
    <div className="space-y-5 text-xs">
      <div className="bg-white p-4 rounded-xl border border-[#D6C3A2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-sm text-[#133D3D]">
            Pengaturan Periode Stay Permit Reminder Per Service
          </h4>
          <p className="text-gray-500 text-[11px] mt-0.5">
            Tentukan jumlah hari sebelum tanggal expired (H-N) agar client otomatis mulai muncul di menu Stay Permit Reminder.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-3.5 py-2 bg-[#133D3D] text-[#FDF7EB] font-semibold rounded-lg hover:bg-[#0d2a2a] transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Tambah Aturan Service
        </button>
      </div>

      {/* Add New Service Form */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-[#FDF7EB] p-4 rounded-xl border border-[#D6C3A2] space-y-3"
        >
          <h5 className="font-bold text-xs text-[#133D3D]">Tambah Aturan Reminder Baru</h5>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Pilih atau Ketik Service
              </label>
              <input
                type="text"
                required
                placeholder="contoh: Golden Visa / E33F"
                list="service-datalist"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                className="w-full px-3 py-2 border border-[#D6C3A2] rounded-md bg-white text-xs focus:outline-none"
              />
              <datalist id="service-datalist">
                {serviceOptions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Reminder Dimulai (Hari Sebelum Expired)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                required
                value={newDays}
                onChange={(e) => setNewDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#D6C3A2] rounded-md bg-white text-xs focus:outline-none font-bold"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#133D3D] text-[#FDF7EB] font-semibold rounded-md hover:bg-[#0d2a2a] transition-colors text-xs"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 text-xs"
              >
                Batal
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Reminder Table */}
      <div className="bg-white rounded-xl border border-[#D6C3A2] shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#133D3D] text-[#FFFFFF] font-semibold">
            <tr>
              <th className="px-4 py-3 w-12 text-center">No</th>
              <th className="px-4 py-3">Jenis Service</th>
              <th className="px-4 py-3">Mulai Muncul Reminder (Hari Sebelum Expired)</th>
              <th className="px-4 py-3 text-center">Status Reminder</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reminderSettings.map((item, index) => {
              const isEditing = editingItem?.id === item.id;
              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-center font-mono text-gray-400 font-semibold">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#133D3D] text-sm">
                    {item.service}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={editDays}
                          onChange={(e) => setEditDays(Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-[#133D3D] rounded-md text-xs font-bold focus:outline-none"
                        />
                        <span className="text-xs text-gray-500">Hari (H-{editDays})</span>
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 bg-[#FDF7EB] border border-[#D6C3A2] rounded-md text-xs text-[#133D3D]">
                        {item.daysBeforeExpiry} Hari (H-{item.daysBeforeExpiry})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                        item.isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-gray-100 text-gray-500 border border-gray-300'
                      }`}
                    >
                      {item.isActive ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-700" />
                          <span>Aktif</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-gray-400" />
                          <span>Nonaktif</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={handleSaveEdit}
                          className="p-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="p-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setEditDays(item.daysBeforeExpiry);
                        }}
                        className="px-2.5 py-1 text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-md font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Ubah Hari
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
