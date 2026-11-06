import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Plus,
  Eye,
  Search,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatDateDisplay, getTodayWITAString } from '../../utils/dateUtils';
import { VisaClient, FollowUpRecord } from '../../types';
import { AddFollowUpModal } from './AddFollowUpModal';
import { ClientDetailModal } from '../database/ClientDetailModal';

export const FollowUpManagementView: React.FC = () => {
  const { clients, followUps, getMasterOptions } = useData();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [targetClient, setTargetClient] = useState<VisaClient | null>(null);

  const [viewingDetailClient, setViewingDetailClient] = useState<VisaClient | null>(null);
  const [selectedHistoryClientId, setSelectedHistoryClientId] = useState<string | null>(null);

  const followUpStatusOptions = getMasterOptions('statusFollowUp');
  const todayWITA = getTodayWITAString();

  // Upcoming scheduled Next Follow-up tasks for CS
  const upcomingTasks = useMemo(() => {
    return clients
      .filter((c) => c.nextFollowUpDate && c.nextFollowUpDate >= todayWITA)
      .sort((a, b) => (a.nextFollowUpDate || '').localeCompare(b.nextFollowUpDate || ''));
  }, [clients, todayWITA]);

  // Clients list for Follow-up table
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (statusFilter && c.statusFollowUp !== statusFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const pass = (c.noPassport || '').toLowerCase();
        const name = (c.namaClient || '').toLowerCase();
        if (!pass.includes(query) && !name.includes(query)) return false;
      }
      return true;
    });
  }, [clients, statusFilter, searchTerm]);

  // Follow-up history for selected client
  const clientHistoryRecords = useMemo(() => {
    if (!selectedHistoryClientId) return [];
    return followUps.filter((f) => f.clientId === selectedHistoryClientId);
  }, [followUps, selectedHistoryClientId]);

  const historyClient = clients.find((c) => c.id === selectedHistoryClientId);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Tasks for CS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Next Follow-up Scheduled Tasks */}
        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-[#D6C3A2] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#133D3D]" />
              <h3 className="font-bold text-sm text-[#133D3D]">
                Daftar Jadwal Next Follow-up ({upcomingTasks.length})
              </h3>
            </div>
            <span className="text-[11px] text-gray-500 font-medium">Prioritas Kontak CS</span>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              Tidak ada jadwal next follow-up yang tertunda untuk hari ini ke depan.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto mt-2">
              {upcomingTasks.slice(0, 6).map((client) => {
                const isToday = client.nextFollowUpDate === todayWITA;
                return (
                  <div
                    key={client.id}
                    className="py-2.5 flex items-center justify-between hover:bg-[#FDF7EB]/40 px-2 rounded-lg transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isToday
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {isToday ? 'Hari Ini' : formatDateDisplay(client.nextFollowUpDate)}
                      </span>
                      <div>
                        <span className="font-bold text-gray-900 block">{client.namaClient}</span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {client.noPassport} • {client.service}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-600 italic max-w-[200px] truncate hidden sm:block">
                        {client.remark}
                      </span>
                      <button
                        onClick={() => {
                          setTargetClient(client);
                          setIsFollowUpModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-[#133D3D] text-[#FDF7EB] rounded-md text-[11px] font-semibold hover:bg-[#0d2a2a] transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <PhoneCall className="w-3 h-3" />
                        Hubungi
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Breakdown Box */}
        <div className="bg-[#133D3D] text-[#FFFFFF] p-5 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs text-[#D6C3A2] font-semibold tracking-wider uppercase block">
              Follow-up Overview
            </span>
            <div className="text-3xl font-extrabold text-[#FDF7EB] mt-1">{clients.length} Clients</div>
            <p className="text-xs text-[#D6C3A2]/80 mt-1">
              Catatan follow-up tersimpan permanen sebagai riwayat historis tanpa menghapus data sebelumnya.
            </p>
          </div>

          <div className="pt-4 border-t border-[#D6C3A2]/30 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/10 p-2 rounded-lg">
              <span className="text-[10px] text-[#D6C3A2] block">Belum Follow-up</span>
              <span className="text-lg font-bold">
                {clients.filter((c) => !c.statusFollowUp || c.statusFollowUp === 'Belum Follow-up').length}
              </span>
            </div>
            <div className="bg-white/10 p-2 rounded-lg">
              <span className="text-[10px] text-[#D6C3A2] block">Sudah Follow-up</span>
              <span className="text-lg font-bold">
                {clients.filter((c) => c.statusFollowUp === 'Sudah Follow-up').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#D6C3A2] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari client atau passport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-[#D6C3A2] rounded-lg text-xs bg-[#FDF7EB]/30 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-[#133D3D]">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[#D6C3A2] rounded-md px-2.5 py-1.5 text-xs bg-white text-gray-800 focus:outline-none"
          >
            <option value="">Semua Status Follow-up</option>
            {followUpStatusOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setTargetClient(null);
              setIsFollowUpModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-[#133D3D] text-[#FDF7EB] rounded-lg text-xs font-semibold hover:bg-[#0d2a2a] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Follow-up
          </button>
        </div>
      </div>

      {/* Main Follow-up Table (Section 8 columns) */}
      <div className="bg-white rounded-xl border border-[#D6C3A2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#133D3D] text-[#FFFFFF] font-medium">
              <tr>
                <th className="px-3 py-3 w-12 text-center">No</th>
                <th className="px-3 py-3 font-semibold">Nama Client</th>
                <th className="px-3 py-3 font-semibold">No Passport</th>
                <th className="px-3 py-3">Service</th>
                <th className="px-3 py-3">Staypermit</th>
                <th className="px-3 py-3 font-semibold">Status Follow-up</th>
                <th className="px-3 py-3">Last Follow-up</th>
                <th className="px-3 py-3 font-semibold">Next Follow-up</th>
                <th className="px-3 py-3 min-w-[160px]">Remark</th>
                <th className="px-3 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-gray-400">
                    Tidak ada client yang cocok dengan filter follow-up.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client, idx) => (
                  <tr key={client.id} className="hover:bg-[#FDF7EB]/40 transition-colors text-gray-800">
                    <td className="px-3 py-2.5 text-center font-mono text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-900">{client.namaClient}</td>
                    <td className="px-3 py-2.5 font-mono font-medium text-blue-900 bg-blue-50/50">
                      {client.noPassport}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">{client.service}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-800">
                      {formatDateDisplay(client.staypermit)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold ${
                          client.statusFollowUp === 'Sudah Follow-up'
                            ? 'bg-emerald-100 text-emerald-800'
                            : client.statusFollowUp === 'Menunggu Balasan'
                            ? 'bg-amber-100 text-amber-800'
                            : client.statusFollowUp === 'Tidak Merespons'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {client.statusFollowUp || 'Belum Follow-up'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 font-medium">
                      {formatDateDisplay(client.lastFollowUpDate)}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-[#133D3D]">
                      {client.nextFollowUpDate ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#133D3D]" />
                          {formatDateDisplay(client.nextFollowUpDate)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 py-2.5 max-w-[220px] truncate text-gray-600" title={client.remark}>
                      {client.remark || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          title="Lihat Riwayat Follow-up"
                          onClick={() => setSelectedHistoryClientId(client.id)}
                          className="p-1.5 text-gray-600 hover:text-[#133D3D] hover:bg-white rounded-md transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Tambah Catatan Follow-up"
                          onClick={() => {
                            setTargetClient(client);
                            setIsFollowUpModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-[#133D3D] text-[#FDF7EB] hover:bg-[#0d2a2a] text-[11px] font-semibold rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <PhoneCall className="w-3 h-3" />
                          Follow-up
                        </button>
                        <button
                          title="Detail Client"
                          onClick={() => setViewingDetailClient(client)}
                          className="p-1.5 text-blue-600 hover:text-blue-900 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-up History Modal / Drawer for Client */}
      {selectedHistoryClientId && historyClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-[#D6C3A2] w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-[#133D3D] text-[#FFFFFF] px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#FDF7EB]">
                  Riwayat Follow-up: {historyClient.namaClient}
                </h3>
                <p className="text-xs text-[#D6C3A2]">
                  Passport: {historyClient.noPassport} • Layanan: {historyClient.service}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryClientId(null)}
                className="text-[#D6C3A2] hover:text-white"
              >
                Tutup
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-700">
                  Total Interaksi: {clientHistoryRecords.length}
                </span>
                <button
                  onClick={() => {
                    setTargetClient(historyClient);
                    setIsFollowUpModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-[#133D3D] text-[#FDF7EB] text-xs font-semibold rounded-lg hover:bg-[#0d2a2a] transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Catatan Baru
                </button>
              </div>

              {clientHistoryRecords.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  Belum ada catatan riwayat follow-up untuk client ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {clientHistoryRecords.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-[#FDF7EB]/40 rounded-xl border border-[#D6C3A2]/60 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#133D3D]">{formatDateDisplay(item.followUpDate)}</span>
                          <span className="text-gray-400">•</span>
                          <span className="font-semibold text-gray-700">CS: {item.userName}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-gray-800 bg-white p-2.5 rounded-lg border border-gray-100 leading-relaxed">
                        {item.remark}
                      </p>
                      {item.nextFollowUpDate && (
                        <div className="flex items-center gap-1 text-[11px] text-blue-800 pt-1 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Jadwal Berikutnya: {formatDateDisplay(item.nextFollowUpDate)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Follow-up Modal */}
      <AddFollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setTargetClient(null);
        }}
        defaultClient={targetClient}
      />

      {/* Client Detail Modal */}
      <ClientDetailModal
        isOpen={!!viewingDetailClient}
        onClose={() => setViewingDetailClient(null)}
        client={viewingDetailClient}
      />
    </div>
  );
};
