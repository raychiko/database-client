import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Filter,
  CheckCircle,
  AlertCircle,
  FileText,
  RefreshCw,
  Calendar,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { VisaClient } from '../../types';
import { exportClientsToExcel } from '../excel/exportExcel';
import { getTodayWITAString, normalizeDateString, formatDateDisplay } from '../../utils/dateUtils';

export const DataManagementSettings: React.FC = () => {
  const { clients, batchImportClients, getMasterOptions, visaServices } = useData();
  const { isAdmin, hasPermission } = useAuth();

  const canImport = isAdmin || hasPermission('canImportExcel');
  const canExport = isAdmin || hasPermission('canExportExcel');

  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');

  // ================= IMPORT STATE =================
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [updateDuplicates, setUpdateDuplicates] = useState(true);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    updated: number;
    skipped: number;
    failed: number;
  } | null>(null);

  // ================= EXPORT FILTER STATE =================
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('all');
  const [selectedService, setSelectedService] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedRekanan, setSelectedRekanan] = useState('ALL');
  const [expiryStart, setExpiryStart] = useState('');
  const [expiryEnd, setExpiryEnd] = useState('');

  const rekananOptions = getMasterOptions('rekanan');
  const statusOptions = getMasterOptions('status');

  // Handle File Reading
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreviewError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const rawData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

        if (rawData.length === 0) {
          setPreviewError('File Excel tidak memiliki baris data.');
          setParsedRows([]);
          return;
        }

        // Map column headers flexible
        const formatted = rawData.map((row) => {
          const findKey = (candidates: string[]) => {
            const found = Object.keys(row).find((k) =>
              candidates.includes(k.trim().toLowerCase())
            );
            return found ? String(row[found] || '').trim() : '';
          };

          return {
            date: normalizeDateString(findKey(['date', 'tanggal', 'tgl'])),
            rekanan: findKey(['rekanan', 'agent', 'agen', 'partner']),
            imigrasi: findKey(['imigrasi', 'kantor imigrasi', 'kanim']),
            service: findKey(['service', 'layanan', 'jenis visa', 'visa']),
            namaClient: findKey(['nama client', 'nama', 'client name', 'name', 'client']),
            clientPhone: String(findKey(['client phone number', 'client phone', 'phone number', 'phone', 'no telp', 'no telepon', 'nomor telepon', 'telepon', 'telp', 'wa', 'whatsapp'])).trim(),
            noPermohonan: findKey(['no permohonan', 'no. permohonan', 'nomor permohonan', 'permohonan']),
            noPassport: String(findKey(['no passport', 'no. passport', 'nomor passport', 'passport', 'passport no'])).trim(),
            status: findKey(['status', 'visa status', 'status visa']),
            staypermit: normalizeDateString(findKey(['staypermit', 'stay permit', 'expired', 'expired date', 'tgl expired', 'expiry'])),
            evisa: findKey(['evisa', 'e-visa', 'no evisa', 'nomor evisa']),
            sponsor: findKey(['sponsor', 'penjamin']),
            statusFollowUp: findKey(['status follow-up', 'status follow up', 'follow up', 'follow-up']),
            remark: findKey(['remark', 'keterangan', 'catatan', 'note']),
          };
        });

        const validRows = formatted.filter((r) => r.namaClient || r.noPassport);
        if (validRows.length === 0) {
          setPreviewError('Kolom Nama Client atau No Passport tidak ditemukan dalam file.');
        }
        setParsedRows(validRows);
      } catch (err: any) {
        console.error('Parse Excel error:', err);
        setPreviewError('Gagal membaca file Excel. Pastikan format .xlsx atau .xls valid.');
      }
    };
    reader.readAsBinaryString(selected);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setPreviewError(null);
    try {
      const res = await batchImportClients(parsedRows, updateDuplicates);
      setImportResult(res);
      setParsedRows([]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setPreviewError(err.message || 'Gagal memproses import data.');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        'Date': '2026-01-15',
        'Rekanan': 'Bali Express Travel',
        'Imigrasi': 'Kantor Imigrasi Ngurah Rai',
        'Service': 'E28A - Working ITAS',
        'Nama Client': 'John Michael Smith',
        'No. Telepon / Phone': '+6281234567890',
        'No Permohonan': 'W123456789',
        'No Passport': 'A12345678',
        'Status': 'Selesai',
        'Staypermit': '2027-01-14',
        'EVISA': 'EV-889900',
        'Sponsor': 'PT Bali Terang Bersinar',
        'Status Follow-up': 'Done / Closing',
        'Remark': 'Stay permit issued successfully',
      },
      {
        'Date': '2026-02-10',
        'Rekanan': 'Direct Client',
        'Imigrasi': 'Kantor Imigrasi Denpasar',
        'Service': 'Altus ITAS',
        'Nama Client': 'Elena Rostova',
        'No. Telepon / Phone': '+6289876543210',
        'No Permohonan': 'W987654321',
        'No Passport': 'B87654321',
        'Status': 'Dalam Proses',
        'Staypermit': '2027-02-09',
        'EVISA': 'EV-112233',
        'Sponsor': 'PT Bali Ease Management',
        'Status Follow-up': 'Follow-up 1',
        'Remark': 'Menunggu konfirmasi biometrik',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateRows);
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const phCell = ws[XLSX.utils.encode_cell({ r: R, c: 5 })];
      if (phCell) { phCell.t = 's'; phCell.v = String(phCell.v || ''); }
      const passCell = ws[XLSX.utils.encode_cell({ r: R, c: 7 })];
      if (passCell) { passCell.t = 's'; passCell.v = String(passCell.v || ''); }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Import');
    XLSX.writeFile(wb, 'Template_Import_Client_Bali_Ease.xlsx');
  };

  // Filtered clients for export
  const filteredClientsToExport = clients.filter((c) => {
    if (exportScope === 'all') return true;

    if (selectedService !== 'ALL' && c.service !== selectedService) return false;
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;
    if (selectedRekanan !== 'ALL' && c.rekanan !== selectedRekanan) return false;

    if (expiryStart && c.staypermit && c.staypermit < expiryStart) return false;
    if (expiryEnd && c.staypermit && c.staypermit > expiryEnd) return false;

    return true;
  });

  const handleExecuteExport = () => {
    const today = getTodayWITAString();
    const filename = `Bali_Ease_Database_${exportScope === 'all' ? 'FULL' : 'FILTERED'}_${today}.xlsx`;
    exportClientsToExcel(filteredClientsToExport, filename);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6C3A2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#133D3D]" />
            <h3 className="font-bold text-[#133D3D] text-sm">
              Data Management (Import & Export Excel)
            </h3>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Impor data spreadsheet massal ke Firestore atau unduh laporan data klien dalam format Excel (.xlsx).
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-[#FDF7EB] p-1 rounded-xl border border-[#D6C3A2]/60 shrink-0">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'import'
                ? 'bg-[#133D3D] text-[#FDF7EB] shadow-xs'
                : 'text-gray-600 hover:text-[#133D3D]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'export'
                ? 'bg-[#133D3D] text-[#FDF7EB] shadow-xs'
                : 'text-gray-600 hover:text-[#133D3D]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: IMPORT EXCEL ================= */}
      {activeTab === 'import' && (
        <div className="space-y-5">
          {!canImport ? (
            <div className="p-6 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs">
              Anda tidak memiliki izin (permission) untuk mengimpor data Excel. Hubungi Administrator.
            </div>
          ) : (
            <>
              {/* Import Upload Box */}
              <div className="bg-white p-6 rounded-2xl border border-[#D6C3A2] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-[#133D3D]">
                      Unggah File Spreadsheet (.xlsx / .xls)
                    </h4>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Pilih file data dari komputer Anda. Sistem akan memetakan kolom secara otomatis.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template Excel</span>
                  </button>
                </div>

                {/* Dropzone / File Picker */}
                <div className="border-2 border-dashed border-[#D6C3A2] rounded-2xl p-6 text-center hover:bg-[#FDF7EB]/30 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-file-input"
                  />
                  <label
                    htmlFor="excel-file-input"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="p-3 bg-[#133D3D]/10 rounded-full text-[#133D3D]">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#133D3D] hover:underline">
                        Klik untuk memilih file Excel
                      </span>
                      <span className="text-xs text-gray-500"> atau seret file ke sini</span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Mendukung format .xlsx dan .xls (Maksimal 500 baris per file)
                    </p>
                  </label>
                  {file && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-[#133D3D] text-[#FDF7EB] rounded-xl text-xs font-medium">
                      <FileText className="w-4 h-4 text-[#D6C3A2]" />
                      <span>{file.name}</span>
                      <span className="text-gray-300 text-[10px]">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                </div>

                {/* Duplicate Settings */}
                <div className="p-4 bg-[#FDF7EB] rounded-xl border border-[#D6C3A2]/60 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="update-dup"
                    checked={updateDuplicates}
                    onChange={(e) => setUpdateDuplicates(e.target.checked)}
                    className="mt-0.5 rounded text-[#133D3D] focus:ring-[#133D3D] h-4 w-4"
                  />
                  <label htmlFor="update-dup" className="cursor-pointer text-xs select-none">
                    <span className="font-bold text-gray-800">
                      Perbarui data jika nomor passport sudah ada di database (Update Duplicates)
                    </span>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      Jika dicentang, data lama dengan nomor passport yang sama akan diperbarui dengan data baru dari file Excel. Jika tidak dicentang, data duplikat akan dilewati (skip).
                    </p>
                  </label>
                </div>

                {previewError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{previewError}</span>
                  </div>
                )}

                {importResult && (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-700" />
                      <span>Proses Import Selesai!</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      <div className="p-2 bg-white rounded-lg border border-emerald-200 text-center">
                        <div className="text-[10px] text-gray-500 uppercase font-semibold">Baru Ditambahkan</div>
                        <div className="text-base font-bold text-emerald-700">{importResult.imported}</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-emerald-200 text-center">
                        <div className="text-[10px] text-gray-500 uppercase font-semibold">Diperbarui</div>
                        <div className="text-base font-bold text-blue-700">{importResult.updated}</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-emerald-200 text-center">
                        <div className="text-[10px] text-gray-500 uppercase font-semibold">Dilewati (Skip)</div>
                        <div className="text-base font-bold text-amber-700">{importResult.skipped}</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-emerald-200 text-center">
                        <div className="text-[10px] text-gray-500 uppercase font-semibold">Gagal</div>
                        <div className="text-base font-bold text-rose-700">{importResult.failed}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Table if rows parsed */}
              {parsedRows.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-[#D6C3A2] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#133D3D]">
                        Preview Data ({parsedRows.length} Baris Ditemukan)
                      </h4>
                      <p className="text-gray-500 text-xs">
                        Memperlihatkan 5 baris pertama sebelum proses penyimpanan permanen ke Firestore.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      disabled={importing}
                      className="px-5 py-2.5 bg-[#133D3D] text-[#FDF7EB] font-bold text-xs rounded-xl hover:bg-[#0d2a2a] transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 text-[#D6C3A2]" />
                      <span>{importing ? 'Menyimpan ke Firestore...' : `Proses Import (${parsedRows.length} Data)`}</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#133D3D] text-[#FFFFFF] font-semibold">
                        <tr>
                          <th className="px-3 py-2.5">Nama Client</th>
                          <th className="px-3 py-2.5">No. Telepon</th>
                          <th className="px-3 py-2.5">No Passport</th>
                          <th className="px-3 py-2.5">Service</th>
                          <th className="px-3 py-2.5">Stay Permit</th>
                          <th className="px-3 py-2.5">Rekanan</th>
                          <th className="px-3 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {parsedRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-bold text-gray-900">{row.namaClient || '-'}</td>
                            <td className="px-3 py-2 font-mono text-gray-700">{row.clientPhone || '-'}</td>
                            <td className="px-3 py-2 font-mono">{row.noPassport || '-'}</td>
                            <td className="px-3 py-2">{row.service || '-'}</td>
                            <td className="px-3 py-2 font-mono">{row.staypermit || '-'}</td>
                            <td className="px-3 py-2">{row.rekanan || '-'}</td>
                            <td className="px-3 py-2">{row.status || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ================= TAB 2: EXPORT EXCEL ================= */}
      {activeTab === 'export' && (
        <div className="space-y-5">
          {!canExport ? (
            <div className="p-6 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs">
              Anda tidak memiliki izin (permission) untuk mengekspor data Excel. Hubungi Administrator.
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-[#D6C3A2] shadow-xs space-y-5">
              <div>
                <h4 className="font-bold text-sm text-[#133D3D]">
                  Konfigurasi Export Laporan Excel
                </h4>
                <p className="text-gray-500 text-xs mt-0.5">
                  Tentukan cakupan data yang ingin diunduh. Format spreadsheet sesuai dengan standar Bali Ease.
                </p>
              </div>

              {/* Scope Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setExportScope('all')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition select-none flex items-start gap-3 ${
                    exportScope === 'all'
                      ? 'border-[#133D3D] bg-[#FDF7EB]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    checked={exportScope === 'all'}
                    onChange={() => setExportScope('all')}
                    className="mt-1 text-[#133D3D] focus:ring-[#133D3D]"
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-900">
                      Seluruh Database Klien
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Export seluruh {clients.length} klien tanpa filter apapun.
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setExportScope('filtered')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition select-none flex items-start gap-3 ${
                    exportScope === 'filtered'
                      ? 'border-[#133D3D] bg-[#FDF7EB]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    checked={exportScope === 'filtered'}
                    onChange={() => setExportScope('filtered')}
                    className="mt-1 text-[#133D3D] focus:ring-[#133D3D]"
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-900">
                      Filter Kustom / Periode Tanggal
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Pilih layanan tertentu, status visa, rekanan, atau rentang tanggal Stay Permit.
                    </div>
                  </div>
                </label>
              </div>

              {/* Filter Controls (visible if filtered) */}
              {exportScope === 'filtered' && (
                <div className="p-4 bg-[#FDF7EB] rounded-xl border border-[#D6C3A2]/60 space-y-4">
                  <div className="text-xs font-bold text-[#133D3D] flex items-center gap-1.5">
                    <Filter className="w-4 h-4" />
                    <span>Filter Data Export</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Service */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Jenis Visa / Service
                      </label>
                      <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D]"
                      >
                        <option value="ALL">Semua Service</option>
                        {visaServices.map((s) => (
                          <option key={s.id} value={s.serviceName}>
                            {s.serviceName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Status Visa
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D]"
                      >
                        <option value="ALL">Semua Status</option>
                        {statusOptions.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Rekanan */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Rekanan / Partner
                      </label>
                      <select
                        value={selectedRekanan}
                        onChange={(e) => setSelectedRekanan(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D]"
                      >
                        <option value="ALL">Semua Rekanan</option>
                        {rekananOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date Range for Stay Permit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#D6C3A2]/40">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Stay Permit Expired Mulai
                      </label>
                      <input
                        type="date"
                        value={expiryStart}
                        onChange={(e) => setExpiryStart(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Stay Permit Expired Sampai
                      </label>
                      <input
                        type="date"
                        value={expiryEnd}
                        onChange={(e) => setExpiryEnd(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Summary and Download Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-600">
                  Total Data Terpilih:{' '}
                  <strong className="text-[#133D3D] text-sm">
                    {filteredClientsToExport.length}
                  </strong>{' '}
                  dari {clients.length} klien di database.
                </div>

                <button
                  type="button"
                  onClick={handleExecuteExport}
                  disabled={filteredClientsToExport.length === 0}
                  className="px-6 py-2.5 bg-[#133D3D] text-[#FDF7EB] font-bold text-xs rounded-xl hover:bg-[#0d2a2a] transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-[#D6C3A2]" />
                  <span>Download File Excel (.xlsx)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
