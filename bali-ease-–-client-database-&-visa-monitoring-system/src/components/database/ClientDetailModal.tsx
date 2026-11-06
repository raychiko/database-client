import React, { useState } from 'react';
import { X, Calendar, PhoneCall, Edit, User, Shield, FileText, Clock, AlertCircle } from 'lucide-react';
import { VisaClient, FollowUpRecord } from '../../types';
import { useData } from '../../context/DataContext';
import { formatDateDisplay, formatDateTimeDisplay } from '../../utils/dateUtils';
import { AddFollowUpModal } from '../followup/AddFollowUpModal';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: VisaClient | null;
  onEditClient?: (client: VisaClient) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  isOpen,
  onClose,
  client,
  onEditClient,
}) => {
  const { followUps, auditLogs, getReminderInfo } = useData();
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  if (!isOpen || !client) return null;

  // Filter history for this specific client
  const clientFollowUps = followUps.filter((f) => f.clientId === client.id);
  const clientAuditLogs = auditLogs.filter(
    (a) => a.targetRecord.includes(client.namaClient) || a.targetRecord.includes(client.noPassport)
  );

  const reminderInfo = getReminderInfo(client);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="bg-[#FFFFFF] rounded-xl shadow-2xl border border-[#D6C3A2] w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="bg-[#133D3D] text-[#FFFFFF] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#D6C3A2]/20 rounded-lg text-[#D6C3A2]">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-[#FDF7EB]">{client.namaClient}</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-sm bg-[#D6C3A2]/20 text-[#D6C3A2] font-medium">
                    {client.noPassport}
                  </span>
                </div>
                <p className="text-xs text-[#D6C3A2]">{client.service} • {client.imigrasi}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFollowUpModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#D6C3A2] text-[#133D3D] text-xs font-semibold rounded-lg hover:bg-[#c9b491] transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Add Follow-up
              </button>
              {onEditClient && (
                <button
                  onClick={() => {
                    onClose();
                    onEditClient(client);
                  }}
                  className="px-3.5 py-1.5 bg-white/10 text-white hover:bg-white/20 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Client
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-[#D6C3A2] hover:text-[#FFFFFF] rounded-lg transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* Stay Permit Reminder Banner if active */}
            {reminderInfo && (
              <div
                className={`p-3.5 rounded-lg border flex items-center justify-between ${
                  reminderInfo.urgency === 'urgent'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : reminderInfo.urgency === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="font-semibold block">
                      Peringatan Stay Permit ({reminderInfo.remainingDays} hari tersisa)
                    </span>
                    <span className="text-[11px] opacity-90">
                      Masa berlaku Stay Permit berakhir pada {formatDateDisplay(client.staypermit)} (Threshold:{' '}
                      {reminderInfo.thresholdDays} hari).
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${
                    reminderInfo.urgency === 'urgent'
                      ? 'bg-rose-600 text-white'
                      : reminderInfo.urgency === 'warning'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-700 text-white'
                  }`}
                >
                  {reminderInfo.urgency}
                </span>
              </div>
            )}

            {/* A. Client Information & B. Visa Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Section A: Client Information */}
              <div className="p-4 bg-[#FDF7EB]/40 rounded-xl border border-[#D6C3A2]/50 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#D6C3A2]/40 text-[#133D3D] font-bold">
                  <User className="w-4 h-4" />
                  <span>Informasi Client</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-2">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Nama Client</span>
                    <span className="font-semibold text-gray-900 text-sm">{client.namaClient || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">No Passport</span>
                    <span className="font-mono font-semibold text-gray-900 text-sm">{client.noPassport || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Tanggal Entri</span>
                    <span className="text-gray-800">{formatDateDisplay(client.date)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">No Permohonan</span>
                    <span className="font-mono text-gray-800">{client.noPermohonan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Rekanan</span>
                    <span className="text-gray-800">{client.rekanan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Kantor Imigrasi</span>
                    <span className="text-gray-800">{client.imigrasi || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Section B: Visa & Operational Details */}
              <div className="p-4 bg-[#FDF7EB]/40 rounded-xl border border-[#D6C3A2]/50 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#D6C3A2]/40 text-[#133D3D] font-bold">
                  <Shield className="w-4 h-4" />
                  <span>Informasi Visa & Izin Tinggal</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-2">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Service (Layanan)</span>
                    <span className="font-semibold text-[#133D3D]">{client.service || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Status Visa</span>
                    <span className="inline-block px-2 py-0.5 rounded-sm text-[11px] font-medium bg-emerald-100 text-emerald-800">
                      {client.status || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Expired Staypermit</span>
                    <span className="font-semibold text-gray-900">{formatDateDisplay(client.staypermit)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">EVISA</span>
                    <span className="font-mono text-gray-800">{client.evisa || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-gray-500 uppercase block">Sponsor / Penjamin</span>
                    <span className="text-gray-800">{client.sponsor || '-'}</span>
                  </div>
                  <div className="col-span-2 pt-1">
                    <span className="text-[10px] text-gray-500 uppercase block">Status Follow-up</span>
                    <span className="inline-block px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-amber-100 text-amber-900">
                      {client.statusFollowUp || 'Belum Follow-up'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Remark */}
            {client.remark && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">
                  Remark / Catatan:
                </span>
                <p className="text-gray-700 italic">{client.remark}</p>
              </div>
            )}

            {/* C. Follow-up History */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-[#133D3D]">
                  <PhoneCall className="w-4 h-4 text-[#133D3D]" />
                  <span>Riwayat Follow-up ({clientFollowUps.length})</span>
                </div>
                <button
                  onClick={() => setIsFollowUpModalOpen(true)}
                  className="text-xs text-[#133D3D] hover:underline font-semibold flex items-center gap-1"
                >
                  + Tambah Follow-up
                </button>
              </div>

              {clientFollowUps.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400">
                  Belum ada catatan riwayat follow-up untuk client ini.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#133D3D] text-[#FFFFFF]">
                      <tr>
                        <th className="px-3 py-2 font-medium">Tanggal</th>
                        <th className="px-3 py-2 font-medium">CS</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Remark</th>
                        <th className="px-3 py-2 font-medium">Next Follow-up</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clientFollowUps.map((rec) => (
                        <tr key={rec.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2.5 font-medium text-gray-900">
                            {formatDateDisplay(rec.followUpDate)}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-gray-800">{rec.userName}</td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded-sm text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-gray-700">{rec.remark}</td>
                          <td className="px-3 py-2.5 text-gray-600 font-medium">
                            {rec.nextFollowUpDate ? formatDateDisplay(rec.nextFollowUpDate) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* D. Audit Log for this client */}
            {clientAuditLogs.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Audit Trail Record Client</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {clientAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="text-[11px] p-2 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-gray-800">{log.userName}: </span>
                        <span className="text-gray-600">{log.details}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                        {formatDateTimeDisplay(log.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Follow-up Modal */}
      <AddFollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        defaultClient={client}
      />
    </>
  );
};
