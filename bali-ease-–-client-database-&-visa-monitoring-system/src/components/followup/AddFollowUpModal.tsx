import React, { useState, useEffect } from 'react';
import { X, PhoneCall, Save, Calendar, User, Clock } from 'lucide-react';
import { VisaClient } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getTodayWITAString } from '../../utils/dateUtils';

interface AddFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClient?: VisaClient | null;
}

export const AddFollowUpModal: React.FC<AddFollowUpModalProps> = ({
  isOpen,
  onClose,
  defaultClient,
}) => {
  const { clients, addFollowUp, getMasterOptions } = useData();
  const { userProfile, currentUser } = useAuth();

  const followUpStatusOptions = getMasterOptions('statusFollowUp');

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>(getTodayWITAString());
  const [csName, setCsName] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (defaultClient) {
      setSelectedClientId(defaultClient.id);
      setStatus(defaultClient.statusFollowUp || followUpStatusOptions[0] || 'Sudah Follow-up');
    } else if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
      setStatus(followUpStatusOptions[0] || 'Sudah Follow-up');
    }
  }, [defaultClient, clients, isOpen]);

  useEffect(() => {
    setCsName(userProfile?.displayName || currentUser?.email || 'CS Agent');
    setFollowUpDate(getTodayWITAString());
    setRemark('');
    setNextFollowUpDate('');
    if (!status && followUpStatusOptions.length > 0) {
      setStatus(followUpStatusOptions[0]);
    }
  }, [isOpen, userProfile, currentUser, followUpStatusOptions.length]);

  if (!isOpen) return null;

  const currentClient = clients.find((c) => c.id === selectedClientId) || defaultClient;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert('Pilih client yang di-follow-up.');
      return;
    }
    if (!remark.trim()) {
      alert('Remark (catatan follow-up) wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      await addFollowUp({
        clientId: selectedClientId,
        followUpDate,
        status,
        remark: remark.trim(),
        nextFollowUpDate: nextFollowUpDate || undefined,
      });
      onClose();
    } catch (err: any) {
      console.error('Follow-up save error:', err);
      alert('Gagal menyimpan follow-up: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] rounded-xl shadow-2xl border border-[#D6C3A2] w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#133D3D] text-[#FFFFFF] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D6C3A2]/20 rounded-lg text-[#D6C3A2]">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#FDF7EB]">Tambah Catatan Follow-up</h3>
              <p className="text-xs text-[#D6C3A2]">Catatan interaksi client dan jadwal follow-up berikutnya</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#D6C3A2] hover:text-[#FFFFFF] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Target Client */}
          <div>
            <label className="block text-xs font-semibold text-[#133D3D] mb-1">
              Client Terkait *
            </label>
            {defaultClient ? (
              <div className="p-2.5 bg-[#FDF7EB] border border-[#D6C3A2] rounded-lg font-medium text-[#133D3D] flex items-center justify-between">
                <span>{defaultClient.namaClient}</span>
                <span className="font-mono text-[11px] text-gray-600 bg-white px-2 py-0.5 rounded-sm border border-[#D6C3A2]">
                  {defaultClient.noPassport} ({defaultClient.service})
                </span>
              </div>
            ) : (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.namaClient} - {c.noPassport} ({c.service})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Tanggal Follow-up */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                Tanggal Follow-up *
              </label>
              <input
                type="date"
                required
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              />
            </div>

            {/* Nama CS */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                Nama CS *
              </label>
              <input
                type="text"
                required
                value={csName}
                onChange={(e) => setCsName(e.target.value)}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Status Follow-up */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                Status Follow-up *
              </label>
              <select
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              >
                {followUpStatusOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Next Follow-up Date (optional) */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                Next Follow-up (Opsional)
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              />
            </div>
          </div>

          {/* Remark */}
          <div>
            <label className="block text-xs font-semibold text-[#133D3D] mb-1">
              Remark / Catatan Hasil Kontak *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Contoh: Client sudah dihubungi via WA, konfirmasi perpanjangan ITAS minggu depan..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
            />
          </div>

          <div className="flex justify-end items-center gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#133D3D] text-[#FDF7EB] text-xs font-semibold rounded-lg hover:bg-[#0d2a2a] transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
