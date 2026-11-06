import React, { useState } from 'react';
import { Database, Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { MasterCategory, MasterDataItem } from '../../types';

export const MasterDataSettings: React.FC = () => {
  const { masterData, addMasterItem, updateMasterItem, deleteMasterItem } = useData();

  const [activeTab, setActiveTab] = useState<MasterCategory>('service');
  const [newValue, setNewValue] = useState<string>('');
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [itemToDelete, setItemToDelete] = useState<MasterDataItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const categories: { key: MasterCategory; label: string; desc: string }[] = [
    { key: 'service', label: 'Service (Layanan Visa)', desc: 'Pilihan layanan visa seperti Altus ITAS, ITAS, KITAP, E33F' },
    { key: 'rekanan', label: 'Rekanan', desc: 'Daftar agen, partner, atau sumber permohonan' },
    { key: 'imigrasi', label: 'Imigrasi', desc: 'Kantor Imigrasi tujuan proses visa' },
    { key: 'status', label: 'Status Visa', desc: 'Status proses permohonan visa' },
    { key: 'statusFollowUp', label: 'Status Follow-up', desc: 'Status tahapan follow-up CS' },
  ];

  const currentItems = masterData.filter((m) => m.category === activeTab);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    setLoading(true);
    try {
      await addMasterItem(activeTab, newValue.trim(), newValue.trim());
      setNewValue('');
    } catch (err: any) {
      alert('Gagal menambah master data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem || !editingValue.trim()) return;
    setLoading(true);
    try {
      await updateMasterItem(editingItem.id, editingValue.trim(), editingValue.trim());
      setEditingItem(null);
      setEditingValue('');
    } catch (err: any) {
      alert('Gagal memperbarui master data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setLoading(true);
    try {
      await deleteMasterItem(itemToDelete.id);
      setItemToDelete(null);
    } catch (err: any) {
      alert('Gagal menghapus master data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#D6C3A2] pb-3">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => {
              setActiveTab(cat.key);
              setEditingItem(null);
            }}
            className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
              activeTab === cat.key
                ? 'bg-[#133D3D] text-[#FDF7EB] shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-[#D6C3A2]/50'
            }`}
          >
            {cat.label} ({masterData.filter((m) => m.category === cat.key).length})
          </button>
        ))}
      </div>

      {/* Category Description & Add Form */}
      <div className="bg-white p-4 rounded-xl border border-[#D6C3A2] shadow-xs space-y-3">
        <div>
          <h4 className="font-bold text-sm text-[#133D3D]">
            Kelola Dropdown {categories.find((c) => c.key === activeTab)?.label}
          </h4>
          <p className="text-gray-500 text-[11px] mt-0.5">
            {categories.find((c) => c.key === activeTab)?.desc}
          </p>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 pt-2">
          <input
            type="text"
            required
            placeholder={`Tambah pilihan baru untuk ${categories.find((c) => c.key === activeTab)?.label}...`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="flex-1 px-3 py-2 border border-[#D6C3A2] rounded-lg text-xs bg-[#FDF7EB]/20 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
          />
          <button
            type="submit"
            disabled={loading || !newValue.trim()}
            className="px-4 py-2 bg-[#133D3D] text-[#FDF7EB] font-semibold rounded-lg hover:bg-[#0d2a2a] transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Pilihan
          </button>
        </form>
      </div>

      {/* Items List Table */}
      <div className="bg-white rounded-xl border border-[#D6C3A2] shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#133D3D] text-[#FFFFFF] font-semibold">
            <tr>
              <th className="px-4 py-3 w-12 text-center">No</th>
              <th className="px-4 py-3">Nama Opsi / Value</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-400">
                  Belum ada opsi untuk kategori ini.
                </td>
              </tr>
            ) : (
              currentItems.map((item, index) => {
                const isEditingThis = editingItem?.id === item.id;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-center font-mono text-gray-400 font-semibold">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      {isEditingThis ? (
                        <div className="flex items-center gap-2 max-w-md">
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="flex-1 px-2.5 py-1 border border-[#133D3D] rounded-md text-xs focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={handleUpdate}
                            className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="p-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span>{item.label}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {!isEditingThis && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setEditingValue(item.label);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit Pilihan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-md transition-colors"
                            title="Hapus Pilihan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Item Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full border border-rose-300 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-bold text-sm text-gray-900">Hapus Opsi Master Data?</h4>
            </div>
            <p className="text-gray-600 text-xs">
              Hapus pilihan <span className="font-bold text-gray-900">"{itemToDelete.label}"</span>?
              Data client lama yang sudah memakai opsi ini tidak akan rusak.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 font-medium"
              >
                Batal
              </button>
              <button
                disabled={loading}
                onClick={handleDelete}
                className="px-4 py-1.5 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
