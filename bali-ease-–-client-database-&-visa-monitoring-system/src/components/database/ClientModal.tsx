import React, { useState, useEffect } from 'react';
import { X, Save, User, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';
import { VisaClient } from '../../types';
import { useData } from '../../context/DataContext';
import { getTodayWITAString, normalizeDateString } from '../../utils/dateUtils';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: VisaClient | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, client }) => {
  const { addClient, updateClient, getMasterOptions, clients } = useData();

  const rekananOptions = getMasterOptions('rekanan');
  const imigrasiOptions = getMasterOptions('imigrasi');
  const serviceOptions = getMasterOptions('service');
  const statusOptions = getMasterOptions('status');
  const followUpOptions = getMasterOptions('statusFollowUp');

  const [formData, setFormData] = useState({
    date: getTodayWITAString(),
    rekanan: rekananOptions[0] || 'Internal Bali Ease',
    imigrasi: imigrasiOptions[0] || 'Ngurah Rai (Kanim Denpasar)',
    service: serviceOptions[0] || 'Altus ITAS',
    namaClient: '',
    noPermohonan: '',
    noPassport: '',
    status: statusOptions[0] || 'Active',
    staypermit: '',
    evisa: '',
    sponsor: '',
    statusFollowUp: followUpOptions[0] || 'Belum Follow-up',
    remark: '',
  });

  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setFormData({
        date: client.date || getTodayWITAString(),
        rekanan: client.rekanan || rekananOptions[0] || '',
        imigrasi: client.imigrasi || imigrasiOptions[0] || '',
        service: client.service || serviceOptions[0] || '',
        namaClient: client.namaClient || '',
        noPermohonan: client.noPermohonan || '',
        noPassport: client.noPassport || '',
        status: client.status || statusOptions[0] || '',
        staypermit: client.staypermit || '',
        evisa: client.evisa || '',
        sponsor: client.sponsor || '',
        statusFollowUp: client.statusFollowUp || followUpOptions[0] || '',
        remark: client.remark || '',
      });
      setDuplicateWarning(null);
    } else {
      setFormData({
        date: getTodayWITAString(),
        rekanan: rekananOptions[0] || 'Internal Bali Ease',
        imigrasi: imigrasiOptions[0] || 'Ngurah Rai (Kanim Denpasar)',
        service: serviceOptions[0] || 'Altus ITAS',
        namaClient: '',
        noPermohonan: '',
        noPassport: '',
        status: statusOptions[0] || 'Active',
        staypermit: '',
        evisa: '',
        sponsor: '',
        statusFollowUp: followUpOptions[0] || 'Belum Follow-up',
        remark: '',
      });
      setDuplicateWarning(null);
    }
  }, [client, isOpen, rekananOptions.length, serviceOptions.length]);

  if (!isOpen) return null;

  const handlePassportChange = (val: string) => {
    const clean = val.trim();
    setFormData((prev) => ({ ...prev, noPassport: clean }));
    if (clean && (!client || client.noPassport !== clean)) {
      const existing = clients.filter(
        (c) => c.noPassport.trim().toUpperCase() === clean.toUpperCase() && c.id !== client?.id
      );
      if (existing.length > 0) {
        setDuplicateWarning(
          `Nomor passport ini sudah digunakan oleh ${existing[0].namaClient} (${existing.length} permohonan lain). Satu passport boleh memiliki permohonan berbeda.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaClient.trim()) {
      alert('Nama Client wajib diisi.');
      return;
    }
    if (!formData.noPassport.trim()) {
      alert('No Passport wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      if (client) {
        await updateClient(client.id, formData);
      } else {
        await addClient(formData);
      }
      onClose();
    } catch (err: any) {
      console.error('Save failed:', err);
      alert('Gagal menyimpan data client: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] rounded-xl shadow-2xl border border-[#D6C3A2] w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#133D3D] text-[#FFFFFF] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D6C3A2]/20 rounded-lg text-[#D6C3A2]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[#FDF7EB]">
                {client ? 'Edit Data Client Visa' : 'Tambah Client Visa Baru'}
              </h3>
              <p className="text-xs text-[#D6C3A2]">Formulir database operasional visa Bali Ease</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#D6C3A2] hover:text-[#FFFFFF] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {duplicateWarning && (
            <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs">
              <AlertCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                Date (Tanggal Entri) *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              />
            </div>

            {/* Rekanan */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                Rekanan
              </label>
              <select
                value={formData.rekanan}
                onChange={(e) => setFormData({ ...formData, rekanan: e.target.value })}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              >
                {rekananOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Imigrasi */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                Kantor Imigrasi
              </label>
              <select
                value={formData.imigrasi}
                onChange={(e) => setFormData({ ...formData, imigrasi: e.target.value })}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              >
                {imigrasiOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Service */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                Service (Layanan Visa) *
              </label>
              <select
                required
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              >
                {serviceOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Nama Client */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                Nama Client *
              </label>
              <input
                type="text"
                required
                placeholder="Nama lengkap client"
                value={formData.namaClient}
                onChange={(e) => setFormData({ ...formData, namaClient: e.target.value })}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              />
            </div>

            {/* No Passport */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                No Passport * (Teks/Preserve 0)
              </label>
              <input
                type="text"
                required
                placeholder="contoh: E01234567"
                value={formData.noPassport}
                onChange={(e) => handlePassportChange(e.target.value)}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 font-mono font-medium focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* No Permohonan */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                No Permohonan
              </label>
              <input
                type="text"
                placeholder="Nomor permohonan imigrasi"
                value={formData.noPermohonan}
                onChange={(e) => setFormData({ ...formData, noPermohonan: e.target.value })}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                Status Visa
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Staypermit Expiry Date */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                Staypermit (Masa Berlaku Expired)
              </label>
              <input
                type="date"
                value={formData.staypermit}
                onChange={(e) => setFormData({ ...formData, staypermit: e.target.value })}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* EVISA */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                EVISA
              </label>
              <input
                type="text"
                placeholder="Nomor e-visa"
                value={formData.evisa}
                onChange={(e) => setFormData({ ...formData, evisa: e.target.value })}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              />
            </div>

            {/* Sponsor */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                Sponsor / Penjamin
              </label>
              <input
                type="text"
                placeholder="Nama sponsor atau PT"
                value={formData.sponsor}
                onChange={(e) => setFormData({ ...formData, sponsor: e.target.value })}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              />
            </div>

            {/* Status Follow-up */}
            <div>
              <label className="block text-xs font-semibold text-[#133D3D] mb-1">
                Status Follow-up
              </label>
              <select
                value={formData.statusFollowUp}
                onChange={(e) => setFormData({ ...formData, statusFollowUp: e.target.value })}
                className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
              >
                {followUpOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Remark */}
          <div>
            <label className="block text-xs font-semibold text-[#133D3D] mb-1">
              Remark (Catatan Operasional)
            </label>
            <textarea
              rows={2}
              placeholder="Catatan dokumen, kontak, instruksi khusus..."
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              className="w-full text-xs border border-[#D6C3A2] rounded-lg p-2.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-100">
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
              className="px-6 py-2.5 bg-[#133D3D] text-[#FDF7EB] text-xs font-semibold rounded-lg hover:bg-[#0d2a2a] transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan...' : client ? 'Simpan Perubahan' : 'Tambah Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
