import React from 'react';
import {
  Users,
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PhoneCall,
  Calendar,
  History,
  Shield,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatDateDisplay, formatDateTimeDisplay } from '../../utils/dateUtils';
import { VisaClient } from '../../types';

interface DashboardViewProps {
  onNavigateToTab: (tab: string) => void;
  onOpenClientDetail: (client: VisaClient) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToTab,
  onOpenClientDetail,
}) => {
  const { clients, activeReminders, followUps, auditLogs } = useData();

  // Summary counts
  const totalClients = clients.length;
  const upcomingExpiryCount = activeReminders.length;
  const pendingFollowUpCount = clients.filter(
    (c) => !c.statusFollowUp || c.statusFollowUp === 'Belum Follow-up'
  ).length;
  const completedFollowUpCount = clients.filter(
    (c) => c.statusFollowUp === 'Sudah Follow-up'
  ).length;

  // Section A: Upcoming Stay Permit (Top 5 closest)
  const topUpcomingReminders = activeReminders.slice(0, 6);

  // Section B: Pending Follow-up
  const pendingClients = clients
    .filter((c) => !c.statusFollowUp || c.statusFollowUp === 'Belum Follow-up' || c.statusFollowUp === 'Menunggu Balasan')
    .slice(0, 6);

  // Section C: Recent Activity (combine recent audit logs and follow-ups)
  const recentActivities = auditLogs.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clients */}
        <div
          onClick={() => onNavigateToTab('database')}
          className="bg-white p-5 rounded-xl border border-[#D6C3A2] shadow-xs hover:border-[#133D3D] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Total Client / Records
              </span>
              <div className="text-3xl font-extrabold text-[#133D3D] mt-1.5">{totalClients}</div>
              <span className="text-[11px] text-gray-400 group-hover:text-[#133D3D] flex items-center gap-1 mt-2 transition-colors">
                Buka Visa Database <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <div className="p-3 bg-[#FDF7EB] text-[#133D3D] rounded-xl border border-[#D6C3A2] group-hover:bg-[#133D3D] group-hover:text-[#FDF7EB] transition-colors">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Upcoming Stay Permit */}
        <div
          onClick={() => onNavigateToTab('reminders')}
          className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs hover:border-rose-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                Upcoming Stay Permit
              </span>
              <div className="text-3xl font-extrabold text-rose-900 mt-1.5">
                {upcomingExpiryCount}
              </div>
              <span className="text-[11px] text-rose-600 group-hover:underline flex items-center gap-1 mt-2">
                Lihat Reminder Aktif <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 group-hover:bg-rose-700 group-hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Pending Follow-up */}
        <div
          onClick={() => onNavigateToTab('followup')}
          className="bg-white p-5 rounded-xl border border-amber-200 shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                Pending Follow-up
              </span>
              <div className="text-3xl font-extrabold text-amber-900 mt-1.5">
                {pendingFollowUpCount}
              </div>
              <span className="text-[11px] text-amber-600 group-hover:underline flex items-center gap-1 mt-2">
                Kelola Follow-up <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Completed Follow-up */}
        <div
          onClick={() => onNavigateToTab('followup')}
          className="bg-white p-5 rounded-xl border border-emerald-200 shadow-xs hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                Completed Follow-up
              </span>
              <div className="text-3xl font-extrabold text-emerald-900 mt-1.5">
                {completedFollowUpCount}
              </div>
              <span className="text-[11px] text-emerald-600 group-hover:underline flex items-center gap-1 mt-2">
                Riwayat Tersimpan <ArrowRight className="w-3 h-3" />
              </span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Sections: A & B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section A: Upcoming Stay Permit */}
        <div className="bg-white p-5 rounded-xl border border-[#D6C3A2] shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-100 text-rose-800 rounded-md">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#133D3D]">Upcoming Stay Permit</h3>
                <p className="text-[11px] text-gray-500">Masa berlaku mendekati tanggal expired (WITA)</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('reminders')}
              className="text-xs text-[#133D3D] hover:underline font-semibold flex items-center gap-1"
            >
              Lihat Semua ({activeReminders.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {topUpcomingReminders.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                Tidak ada Stay Permit yang mendekati expired saat ini.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FDF7EB] text-[#133D3D] font-semibold">
                  <tr>
                    <th className="px-3 py-2">Nama Client</th>
                    <th className="px-3 py-2">No Passport</th>
                    <th className="px-3 py-2">Service</th>
                    <th className="px-3 py-2">Expired</th>
                    <th className="px-3 py-2 text-right">Sisa Hari</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topUpcomingReminders.map(({ client, remainingDays, urgency }) => (
                    <tr
                      key={client.id}
                      onClick={() => onOpenClientDetail(client)}
                      className="hover:bg-[#FDF7EB]/40 cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-2.5 font-bold text-gray-900">{client.namaClient}</td>
                      <td className="px-3 py-2.5 font-mono text-blue-900 font-medium">
                        {client.noPassport}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">{client.service}</td>
                      <td className="px-3 py-2.5 font-semibold text-gray-900">
                        {formatDateDisplay(client.staypermit)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            urgency === 'urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : urgency === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {remainingDays} Hari
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Section B: Pending Follow-up */}
        <div className="bg-white p-5 rounded-xl border border-[#D6C3A2] shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-800 rounded-md">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#133D3D]">Pending Follow-up</h3>
                <p className="text-[11px] text-gray-500">Client yang belum dihubungi atau menunggu respon</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateToTab('followup')}
              className="text-xs text-[#133D3D] hover:underline font-semibold flex items-center gap-1"
            >
              Kelola ({pendingFollowUpCount})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {pendingClients.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                Semua client telah memiliki status follow-up lengkap.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FDF7EB] text-[#133D3D] font-semibold">
                  <tr>
                    <th className="px-3 py-2">Nama Client</th>
                    <th className="px-3 py-2">No Passport</th>
                    <th className="px-3 py-2">Status Follow-up</th>
                    <th className="px-3 py-2">Remark Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingClients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => onOpenClientDetail(client)}
                      className="hover:bg-[#FDF7EB]/40 cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-2.5 font-bold text-gray-900">{client.namaClient}</td>
                      <td className="px-3 py-2.5 font-mono text-gray-600 font-medium">
                        {client.noPassport}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {client.statusFollowUp || 'Belum Follow-up'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 max-w-[180px] truncate text-gray-600 italic">
                        {client.remark || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Section C: Recent Activity */}
      <div className="bg-white p-5 rounded-xl border border-[#D6C3A2] shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#133D3D]/10 text-[#133D3D] rounded-md">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#133D3D]">Recent Activity</h3>
              <p className="text-[11px] text-gray-500">
                Log penambahan client, perubahan data, dan follow-up terbaru
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('settings')}
            className="text-xs text-[#133D3D] hover:underline font-semibold flex items-center gap-1"
          >
            Audit Log Lengkap
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-xs">
            Belum ada log aktivitas tercatat di sistem.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentActivities.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-[#FDF7EB]/40 rounded-lg border border-[#D6C3A2]/50 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#133D3D] text-[11px]">
                    {log.userName}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {formatDateTimeDisplay(log.createdAt)}
                  </span>
                </div>
                <div className="font-medium text-gray-800 text-[11px] truncate">
                  {log.targetRecord}
                </div>
                <p className="text-[11px] text-gray-600 line-clamp-1">{log.details}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
