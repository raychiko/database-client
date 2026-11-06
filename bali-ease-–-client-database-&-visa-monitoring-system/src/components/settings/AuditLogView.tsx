import React, { useState, useMemo } from 'react';
import { History, Search, Filter, ShieldAlert, Download } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatDateTimeDisplay } from '../../utils/dateUtils';
import * as XLSX from 'xlsx';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (typeFilter && log.activityType !== typeFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const user = log.userName.toLowerCase();
        const target = log.targetRecord.toLowerCase();
        const details = log.details.toLowerCase();
        if (!user.includes(q) && !target.includes(q) && !details.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [auditLogs, typeFilter, searchTerm]);

  const handleExportAudit = () => {
    const rows = filteredLogs.map((log, idx) => ({
      No: idx + 1,
      Waktu: formatDateTimeDisplay(log.createdAt),
      Pengguna: log.userName,
      'Jenis Aktivitas': log.activityType,
      'Record Terkait': log.targetRecord,
      Rincian: log.details,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Log');
    XLSX.writeFile(wb, 'Bali_Ease_Audit_Logs.xlsx');
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header and Controls */}
      <div className="bg-white p-4 rounded-xl border border-[#D6C3A2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-sm text-[#133D3D]">
            Audit Trail & Log Aktivitas Sistem
          </h4>
          <p className="text-gray-500 text-[11px] mt-0.5">
            Mencatat setiap pembuatan client, pengeditan, penghapusan, import data, dan follow-up oleh seluruh staf.
          </p>
        </div>

        <button
          onClick={handleExportAudit}
          className="px-3 py-1.5 bg-white border border-[#133D3D] text-[#133D3D] hover:bg-[#FDF7EB] rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start md:self-auto transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export Log ke Excel
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-[#D6C3A2] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama staf, client, atau rincian..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-[#D6C3A2] rounded-lg text-xs bg-[#FDF7EB]/30 focus:outline-none focus:ring-1 focus:ring-[#133D3D]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-medium">Jenis Aktivitas:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-[#D6C3A2] rounded-md px-2 py-1 text-xs bg-white text-gray-800 focus:outline-none"
          >
            <option value="">Semua Aktivitas</option>
            <option value="CREATE_CLIENT">CREATE_CLIENT</option>
            <option value="UPDATE_CLIENT">UPDATE_CLIENT</option>
            <option value="DELETE_CLIENT">DELETE_CLIENT</option>
            <option value="IMPORT_EXCEL">IMPORT_EXCEL</option>
            <option value="ADD_FOLLOW_UP">ADD_FOLLOW_UP</option>
            <option value="MASTER_DATA_CHANGE">MASTER_DATA_CHANGE</option>
            <option value="REMINDER_SETTINGS_CHANGE">REMINDER_SETTINGS_CHANGE</option>
            <option value="USER_ROLE_CHANGE">USER_ROLE_CHANGE</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-[#D6C3A2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#133D3D] text-[#FFFFFF] font-semibold">
              <tr>
                <th className="px-4 py-3 w-12 text-center">No</th>
                <th className="px-4 py-3">Waktu (WITA)</th>
                <th className="px-4 py-3">Nama Pengguna</th>
                <th className="px-4 py-3">Jenis Aktivitas</th>
                <th className="px-4 py-3">Record Terkait</th>
                <th className="px-4 py-3 min-w-[200px]">Rincian Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    Tidak ada catatan audit yang cocok.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors text-gray-800">
                    <td className="px-4 py-2.5 text-center font-mono text-gray-400 font-semibold">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-600">
                      {formatDateTimeDisplay(log.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-[#133D3D]">{log.userName}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                          log.activityType.includes('DELETE')
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : log.activityType.includes('CREATE') || log.activityType.includes('IMPORT')
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : log.activityType.includes('FOLLOW_UP')
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {log.activityType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-gray-900">{log.targetRecord}</td>
                    <td className="px-4 py-2.5 text-gray-600 max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
