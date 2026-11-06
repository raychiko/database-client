import React, { useState, useMemo } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Eye,
  PhoneCall,
  Calendar,
  Info,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatDateDisplay, getTodayWITAString } from '../../utils/dateUtils';
import { VisaClient, StayPermitReminderItem } from '../../types';
import { ClientDetailModal } from '../database/ClientDetailModal';
import { AddFollowUpModal } from '../followup/AddFollowUpModal';

export const StayPermitReminderView: React.FC = () => {
  const { activeReminders, reminderSettings } = useData();

  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'urgent' | 'warning' | 'normal'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('');

  const [viewingClient, setViewingClient] = useState<VisaClient | null>(null);
  const [followUpClient, setFollowUpClient] = useState<VisaClient | null>(null);

  const todayWITA = getTodayWITAString();

  const filteredReminders = useMemo(() => {
    return activeReminders.filter((item) => {
      if (urgencyFilter !== 'all' && item.urgency !== urgencyFilter) return false;
      if (serviceFilter && item.client.service !== serviceFilter) return false;
      return true;
    });
  }, [activeReminders, urgencyFilter, serviceFilter]);

  const urgentCount = activeReminders.filter((r) => r.urgency === 'urgent').length;
  const warningCount = activeReminders.filter((r) => r.urgency === 'warning').length;
  const normalCount = activeReminders.filter((r) => r.urgency === 'normal').length;

  return (
    <div className="space-y-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Active Reminder */}
        <div className="bg-white p-4 rounded-xl border border-[#D6C3A2] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider">
              Total Reminder Aktif
            </span>
            <div className="text-2xl font-bold text-[#133D3D] mt-1">{activeReminders.length}</div>
            <span className="text-[10px] text-gray-400">Dalam threshold setting</span>
          </div>
          <div className="p-3 bg-[#FDF7EB] text-[#133D3D] rounded-xl border border-[#D6C3A2]">
            <Bell className="w-5 h-5" />
          </div>
        </div>

        {/* Urgent (1-7 Days) */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === 'urgent' ? 'all' : 'urgent')}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            urgencyFilter === 'urgent'
              ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-400'
              : 'bg-white border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase text-rose-700 tracking-wider">
                Urgent (1 - 7 Hari)
              </span>
              <div className="text-2xl font-bold text-rose-900 mt-1">{urgentCount}</div>
              <span className="text-[10px] text-rose-600">Perlu tindakan segera</span>
            </div>
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Warning (8-30 Days) */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === 'warning' ? 'all' : 'warning')}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            urgencyFilter === 'warning'
              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400'
              : 'bg-white border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase text-amber-700 tracking-wider">
                Warning (8 - 30 Hari)
              </span>
              <div className="text-2xl font-bold text-amber-900 mt-1">{warningCount}</div>
              <span className="text-[10px] text-amber-600">Follow-up persiapan</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Normal (>30 Days) */}
        <div
          onClick={() => setUrgencyFilter(urgencyFilter === 'normal' ? 'all' : 'normal')}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            urgencyFilter === 'normal'
              ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-400'
              : 'bg-white border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase text-emerald-700 tracking-wider">
                Normal (&gt; 30 Hari)
              </span>
              <div className="text-2xl font-bold text-emerald-900 mt-1">{normalCount}</div>
              <span className="text-[10px] text-emerald-600">Dalam masa pantau</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Logic & Timezone Explanation Card */}
      <div className="bg-[#FDF7EB] p-4 rounded-xl border border-[#D6C3A2] text-xs text-[#133D3D] flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 mt-0.5 text-[#133D3D]" />
        <div className="space-y-1">
          <div className="font-semibold text-sm">
            Aturan Sistem Stay Permit Reminder Bali Ease (WITA - Asia/Makassar)
          </div>
          <p className="text-gray-700 leading-relaxed">
            Hari ini (WITA): <span className="font-mono font-bold text-gray-900">{todayWITA}</span>.
            Client otomatis masuk daftar reminder saat memasuki periode threshold yang diatur per jenis service
            (contoh: Altus ITAS H-80). Pada tanggal expired (H-0), client otomatis tidak lagi muncul di reminder
            namun tetap tersimpan aman di Visa Database.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-3 rounded-xl border border-[#D6C3A2] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-[#133D3D]">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Kategori:</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setUrgencyFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                urgencyFilter === 'all'
                  ? 'bg-[#133D3D] text-[#FDF7EB]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua ({activeReminders.length})
            </button>
            <button
              onClick={() => setUrgencyFilter('urgent')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                urgencyFilter === 'urgent'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Urgent ({urgentCount})
            </button>
            <button
              onClick={() => setUrgencyFilter('warning')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                urgencyFilter === 'warning'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Warning ({warningCount})
            </button>
            <button
              onClick={() => setUrgencyFilter('normal')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                urgencyFilter === 'normal'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Normal ({normalCount})
            </button>
          </div>
        </div>

        {/* Filter by Service */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Service:</span>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="border border-[#D6C3A2] rounded-md px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          >
            <option value="">Semua Service</option>
            {reminderSettings.map((s) => (
              <option key={s.id} value={s.service}>{s.service}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reminder Table (Section 7 columns) */}
      <div className="bg-white rounded-xl border border-[#D6C3A2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#133D3D] text-[#FFFFFF] font-medium">
              <tr>
                <th className="px-3 py-3 w-12 text-center">No</th>
                <th className="px-3 py-3 font-semibold">Nama Client</th>
                <th className="px-3 py-3 font-semibold">No Passport</th>
                <th className="px-3 py-3">Service</th>
                <th className="px-3 py-3 font-semibold">Staypermit</th>
                <th className="px-3 py-3 font-bold">Remaining Days</th>
                <th className="px-3 py-3">Status Follow-up</th>
                <th className="px-3 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReminders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                    <p className="font-semibold text-gray-700">Tidak ada Stay Permit yang memerlukan reminder.</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Semua client memiliki masa berlaku aman di luar rentang threshold reminder.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReminders.map((item, index) => {
                  const { client, remainingDays, urgency, thresholdDays } = item;
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-[#FDF7EB]/50 transition-colors text-gray-800"
                    >
                      <td className="px-3 py-2.5 text-center font-mono text-gray-400 font-semibold">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-gray-900">{client.namaClient}</td>
                      <td className="px-3 py-2.5 font-mono font-medium text-blue-900 bg-blue-50/50">
                        {client.noPassport}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-[#133D3D]">{client.service}</td>
                      <td className="px-3 py-2.5 font-bold text-gray-900">
                        {formatDateDisplay(client.staypermit)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${
                              urgency === 'urgent'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : urgency === 'warning'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {remainingDays} Hari Lagi
                          </span>
                          <span className="text-[10px] text-gray-400">(H-{thresholdDays})</span>
                        </div>
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
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingClient(client)}
                            className="px-2.5 py-1 bg-white border border-[#133D3D] text-[#133D3D] hover:bg-[#FDF7EB] text-[11px] font-semibold rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detail
                          </button>
                          <button
                            onClick={() => setFollowUpClient(client)}
                            className="px-2.5 py-1 bg-[#133D3D] text-[#FDF7EB] hover:bg-[#0d2a2a] text-[11px] font-semibold rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            Follow-up
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

      {/* Client Detail Modal */}
      <ClientDetailModal
        isOpen={!!viewingClient}
        onClose={() => setViewingClient(null)}
        client={viewingClient}
      />

      {/* Add Follow-up Modal */}
      <AddFollowUpModal
        isOpen={!!followUpClient}
        onClose={() => setFollowUpClient(null)}
        defaultClient={followUpClient}
      />
    </div>
  );
};
