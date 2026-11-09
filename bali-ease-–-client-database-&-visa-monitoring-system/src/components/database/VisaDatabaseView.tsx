import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Download,
  Eye,
  Edit2,
  Trash2,
  PhoneCall,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
} from 'lucide-react';
import { VisaClient } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateDisplay } from '../../utils/dateUtils';
import { ClientModal } from './ClientModal';
import { ClientDetailModal } from './ClientDetailModal';
import { ImportExcelModal } from '../excel/ImportExcelModal';
import { exportClientsToExcel } from '../excel/exportExcel';
import { AddFollowUpModal } from '../followup/AddFollowUpModal';

export const VisaDatabaseView: React.FC = () => {
  const { clients, deleteClient, getMasterOptions, loading } = useData();
  const { isAdmin, hasPermission } = useAuth();

  // Search exclusively by Passport Number
  const [passportSearch, setPassportSearch] = useState<string>('');

  // Dropdown filters
  const [filterRekanan, setFilterRekanan] = useState<string>('');
  const [filterImigrasi, setFilterImigrasi] = useState<string>('');
  const [filterService, setFilterService] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterFollowUp, setFilterFollowUp] = useState<string>('');

  // Sorting
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<VisaClient | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<VisaClient | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpTargetClient, setFollowUpTargetClient] = useState<VisaClient | null>(null);

  // Delete Confirmation Dialog state
  const [clientToDelete, setClientToDelete] = useState<VisaClient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Master options for filter dropdowns
  const rekananOptions = getMasterOptions('rekanan');
  const imigrasiOptions = getMasterOptions('imigrasi');
  const serviceOptions = getMasterOptions('service');
  const statusOptions = getMasterOptions('status');
  const followUpOptions = getMasterOptions('statusFollowUp');

  // Filter & Search Logic
  const filteredClients = useMemo(() => {
    return clients
      .filter((client) => {
        // Passport or Phone search
        if (passportSearch.trim()) {
          const queryClean = passportSearch.trim().toLowerCase();
          const passportClean = (client.noPassport || '').toLowerCase();
          const phoneClean = (client.clientPhone || '').toLowerCase();
          if (!passportClean.includes(queryClean) && !phoneClean.includes(queryClean)) {
            return false;
          }
        }

        // Dropdown filters
        if (filterRekanan && client.rekanan !== filterRekanan) return false;
        if (filterImigrasi && client.imigrasi !== filterImigrasi) return false;
        if (filterService && client.service !== filterService) return false;
        if (filterStatus && client.status !== filterStatus) return false;
        if (filterFollowUp && client.statusFollowUp !== filterFollowUp) return false;

        return true;
      })
      .sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (sortOrder === 'asc') {
          return dateA.localeCompare(dateB);
        }
        return dateB.localeCompare(dateA);
      });
  }, [
    clients,
    passportSearch,
    filterRekanan,
    filterImigrasi,
    filterService,
    filterStatus,
    filterFollowUp,
    sortOrder,
  ]);

  // Pagination calculation
  const totalRecords = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, currentPage, pageSize]);

  // Handlers
  const handleSortToggle = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleClearFilters = () => {
    setPassportSearch('');
    setFilterRekanan('');
    setFilterImigrasi('');
    setFilterService('');
    setFilterStatus('');
    setFilterFollowUp('');
    setCurrentPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      await deleteClient(clientToDelete.id);
      setClientToDelete(null);
    } catch (err: any) {
      alert('Gagal menghapus client: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#D6C3A2] shadow-xs">
        {/* Passport search only (strict user requirement) */}
        <div className="flex-1 max-w-md">
          <label className="text-[10px] uppercase font-bold text-[#133D3D] block mb-1 tracking-wider">
            Pencarian No Passport / Phone
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ketik No Passport atau No Telepon..."
              value={passportSearch}
              onChange={(e) => {
                setPassportSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs border border-[#D6C3A2] rounded-lg bg-[#FDF7EB]/30 focus:outline-none focus:ring-1 focus:ring-[#133D3D] font-mono font-medium"
            />
            {passportSearch && (
              <button
                onClick={() => setPassportSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(isAdmin || hasPermission('canImportExcel')) && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-2 bg-white text-[#133D3D] border border-[#133D3D] rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#133D3D]" />
              Import Excel
            </button>
          )}

          {(isAdmin || hasPermission('canExportExcel')) && (
            <div className="relative group">
              <button
                onClick={() => exportClientsToExcel(filteredClients, 'Visa_Database_Filtered.xlsx')}
                className="px-3 py-2 bg-white text-emerald-800 border border-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-50 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" />
                Export Excel ({filteredClients.length})
              </button>
            </div>
          )}

          {(isAdmin || hasPermission('canCreateClient')) && (
            <button
              onClick={() => {
                setEditingClient(null);
                setIsClientModalOpen(true);
              }}
              className="px-4 py-2 bg-[#133D3D] text-[#FDF7EB] rounded-lg text-xs font-semibold hover:bg-[#0d2a2a] transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add New Client
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-[#FDF7EB] p-3 rounded-xl border border-[#D6C3A2] grid grid-cols-2 md:grid-cols-6 gap-2 items-center text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-[#133D3D] col-span-2 md:col-span-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Data:</span>
        </div>

        {/* Rekanan */}
        <select
          value={filterRekanan}
          onChange={(e) => {
            setFilterRekanan(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-white border border-[#D6C3A2] rounded-md px-2 py-1.5 text-xs text-gray-800 focus:outline-none"
        >
          <option value="">Semua Rekanan</option>
          {rekananOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        {/* Imigrasi */}
        <select
          value={filterImigrasi}
          onChange={(e) => {
            setFilterImigrasi(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-white border border-[#D6C3A2] rounded-md px-2 py-1.5 text-xs text-gray-800 focus:outline-none"
        >
          <option value="">Semua Imigrasi</option>
          {imigrasiOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        {/* Service */}
        <select
          value={filterService}
          onChange={(e) => {
            setFilterService(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-white border border-[#D6C3A2] rounded-md px-2 py-1.5 text-xs text-gray-800 focus:outline-none"
        >
          <option value="">Semua Service</option>
          {serviceOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-white border border-[#D6C3A2] rounded-md px-2 py-1.5 text-xs text-gray-800 focus:outline-none"
        >
          <option value="">Semua Status</option>
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        {/* Status Follow-up */}
        <select
          value={filterFollowUp}
          onChange={(e) => {
            setFilterFollowUp(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-white border border-[#D6C3A2] rounded-md px-2 py-1.5 text-xs text-gray-800 focus:outline-none"
        >
          <option value="">Semua Follow-up</option>
          {followUpOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Main Visa Database Table */}
      <div className="bg-white rounded-xl border border-[#D6C3A2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#133D3D] text-[#FFFFFF] font-medium sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 w-12 text-center">No</th>
                <th
                  onClick={handleSortToggle}
                  className="px-3 py-3 cursor-pointer hover:bg-[#0d2a2a] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 text-[#D6C3A2]" />
                  </div>
                </th>
                <th className="px-3 py-3">Rekanan</th>
                <th className="px-3 py-3">Imigrasi</th>
                <th className="px-3 py-3">Service</th>
                <th className="px-3 py-3 font-bold">Nama Client</th>
                <th className="px-3 py-3">No. Telepon</th>
                <th className="px-3 py-3">No Permohonan</th>
                <th className="px-3 py-3 font-bold bg-[#0d2a2a]/60">No Passport</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Staypermit</th>
                <th className="px-3 py-3">EVISA</th>
                <th className="px-3 py-3">Sponsor</th>
                <th className="px-3 py-3">Status Follow-up</th>
                <th className="px-3 py-3 min-w-[140px]">Remark</th>
                <th className="px-3 py-3 text-center sticky right-0 bg-[#133D3D] shadow-xs">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-gray-500">
                    Memuat data Visa Database dari Cloud Firestore...
                  </td>
                </tr>
              ) : paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-gray-500">
                    <p className="font-semibold text-gray-700">Tidak ada data client yang ditemukan.</p>
                    <p className="text-[11px] mt-1 text-gray-400">
                      Gunakan tombol "Add New Client" atau "Import Excel" untuk menambahkan data.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client, index) => {
                  const globalIndex = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-[#FDF7EB]/50 transition-colors group text-gray-800"
                    >
                      <td className="px-3 py-2.5 text-center font-mono text-gray-400 font-semibold">
                        {globalIndex}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 font-medium">
                        {formatDateDisplay(client.date)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">{client.rekanan || '-'}</td>
                      <td className="px-3 py-2.5 text-gray-700">{client.imigrasi || '-'}</td>
                      <td className="px-3 py-2.5 font-semibold text-[#133D3D]">
                        {client.service || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-gray-900">
                        {client.namaClient}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-gray-700">
                        {client.clientPhone || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-gray-600">
                        {client.noPermohonan || '-'}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-blue-900 bg-blue-50/40">
                        {client.noPassport}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {client.status || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-900">
                        {formatDateDisplay(client.staypermit)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-gray-600">
                        {client.evisa || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">{client.sponsor || '-'}</td>
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
                      <td className="px-3 py-2.5 max-w-[200px] truncate text-gray-600" title={client.remark}>
                        {client.remark || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center sticky right-0 bg-white group-hover:bg-[#FDF7EB] shadow-xs">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Lihat Detail Client"
                            onClick={() => {
                              setViewingClient(client);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-[#133D3D] hover:bg-white rounded-md transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {(isAdmin || hasPermission('canAddFollowUp')) && (
                            <button
                              title="Tambah Follow-up"
                              onClick={() => {
                                setFollowUpTargetClient(client);
                                setIsFollowUpModalOpen(true);
                              }}
                              className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-md transition-colors"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(isAdmin || hasPermission('canEditClient')) && (
                            <button
                              title="Edit Data Client"
                              onClick={() => {
                                setEditingClient(client);
                                setIsClientModalOpen(true);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(isAdmin || hasPermission('canDeleteClient')) && (
                            <button
                              title="Hapus Data Client"
                              onClick={() => setClientToDelete(client)}
                              className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-[#FDF7EB]/40 border-t border-[#D6C3A2]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Baris per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-[#D6C3A2] rounded-md px-2 py-1 text-xs text-gray-800 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-gray-400">|</span>
            <span>
              Menampilkan {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, totalRecords)} dari {totalRecords} records
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-[#D6C3A2] rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-medium">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 border border-[#D6C3A2] rounded-md bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal (Admin only) */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full border border-rose-300 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-700 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-gray-900">Konfirmasi Hapus Client</h3>
            </div>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus client{' '}
              <span className="font-bold text-gray-900">{clientToDelete.namaClient}</span> (No Passport:{' '}
              <span className="font-mono font-bold text-gray-900">{clientToDelete.noPassport}</span>)?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end items-center gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
              >
                Batal
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors shadow-xs"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setEditingClient(null);
        }}
        client={editingClient}
      />

      {/* Client Detail View */}
      <ClientDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingClient(null);
        }}
        client={viewingClient}
        onEditClient={(c) => {
          setEditingClient(c);
          setIsClientModalOpen(true);
        }}
      />

      {/* Import Excel Modal */}
      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Add Follow-up Modal */}
      <AddFollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setFollowUpTargetClient(null);
        }}
        defaultClient={followUpTargetClient}
      />
    </div>
  );
};
