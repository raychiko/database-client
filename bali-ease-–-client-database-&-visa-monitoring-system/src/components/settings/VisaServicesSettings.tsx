import React, { useState, useRef } from 'react';
import {
  Compass,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  Check,
  X,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { VisaService } from '../../types';
import { calculateReminderDate, formatDateDisplay } from '../../utils/dateUtils';

export const VisaServicesSettings: React.FC = () => {
  const { visaServices, addVisaService, updateVisaService, deleteVisaService } = useData();
  const { isAdmin, hasPermission, recordAudit } = useAuth();

  const canEdit = isAdmin || hasPermission('canEditReminderSettings');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState('ITAS');
  const [duration, setDuration] = useState('1 Year');
  const [reminderDays, setReminderDays] = useState<number>(80);
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [customDaysVal, setCustomDaysVal] = useState<number>(80);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Import Modal State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedServices, setParsedServices] = useState<{
    valid: Array<{
      serviceName: string;
      category: string;
      duration: string;
      reminderBeforeExpiry: number;
      status: 'Active' | 'Inactive';
      isExisting: boolean;
      existingId?: string;
    }>;
    invalid: Array<{ row: any; reason: string }>;
  }>({ valid: [], invalid: [] });
  const [importMode, setImportMode] = useState<'update_existing' | 'add_new_only'>('update_existing');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const presetReminderDays = [30, 45, 60, 80, 90];

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingServiceId(null);
    setServiceName('');
    setCategory('ITAS');
    setDuration('1 Year');
    setReminderDays(80);
    setIsCustomDays(false);
    setCustomDaysVal(80);
    setStatus('Active');
    setErrorMsg(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (svc: VisaService) => {
    setEditingServiceId(svc.id);
    setServiceName(svc.serviceName);
    setCategory(svc.category || 'ITAS');
    setDuration(svc.duration || '1 Year');
    const isPreset = presetReminderDays.includes(svc.reminderBeforeExpiry);
    if (isPreset) {
      setReminderDays(svc.reminderBeforeExpiry);
      setIsCustomDays(false);
    } else {
      setIsCustomDays(true);
      setCustomDaysVal(svc.reminderBeforeExpiry);
      setReminderDays(svc.reminderBeforeExpiry);
    }
    setStatus(svc.status || 'Active');
    setIsFormOpen(true);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      setErrorMsg('Nama layanan visa wajib diisi.');
      return;
    }

    const finalReminder = isCustomDays ? Number(customDaysVal) || 60 : Number(reminderDays) || 60;
    if (finalReminder <= 0) {
      setErrorMsg('Hari reminder harus lebih besar dari 0.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      if (editingServiceId) {
        await updateVisaService(editingServiceId, {
          serviceName: serviceName.trim(),
          category: category.trim(),
          duration: duration.trim(),
          reminderBeforeExpiry: finalReminder,
          status,
        });
      } else {
        await addVisaService({
          serviceName: serviceName.trim(),
          category: category.trim(),
          duration: duration.trim(),
          reminderBeforeExpiry: finalReminder,
          status,
        });
      }
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan layanan visa.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (svc: VisaService) => {
    if (!window.confirm(`Hapus layanan visa "${svc.serviceName}"?`)) return;
    setLoading(true);
    try {
      await deleteVisaService(svc.id);
    } catch (err: any) {
      alert('Gagal menghapus layanan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================= EXPORT VISA SERVICES =================
  const handleExportVisaServices = () => {
    const rows = visaServices.map((svc) => ({
      'Service Name': svc.serviceName || '',
      'Visa Category': svc.category || '',
      'Visa Duration': svc.duration || '',
      'Reminder Before Expiry (Days)': svc.reminderBeforeExpiry || 60,
      'Service Status': svc.status || 'Active',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    ws['!cols'] = [
      { wch: 32 }, // Service Name
      { wch: 22 }, // Visa Category
      { wch: 20 }, // Visa Duration
      { wch: 30 }, // Reminder Before Expiry (Days)
      { wch: 18 }, // Service Status
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Visa Services');
    XLSX.writeFile(wb, 'BaliEase_VisaServices_Export.xlsx');

    recordAudit('EXPORT_VISA_SERVICES', 'Visa Services', `Exported ${rows.length} visa services to Excel`);
  };

  // ================= TEMPLATE VISA SERVICES =================
  const handleDownloadTemplate = () => {
    const sampleRows = [
      {
        'Service Name': 'E28A - Working ITAS',
        'Visa Category': 'ITAS',
        'Visa Duration': '1 Year',
        'Reminder Before Expiry (Days)': 80,
        'Service Status': 'Active',
      },
      {
        'Service Name': 'Altus ITAS',
        'Visa Category': 'ITAS',
        'Visa Duration': '1 Year',
        'Reminder Before Expiry (Days)': 80,
        'Service Status': 'Active',
      },
      {
        'Service Name': 'Tourist Visa Extension (60 Days)',
        'Visa Category': 'Kunjungan',
        'Visa Duration': '60 Days',
        'Reminder Before Expiry (Days)': 30,
        'Service Status': 'Active',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    ws['!cols'] = [
      { wch: 32 },
      { wch: 22 },
      { wch: 20 },
      { wch: 30 },
      { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Visa Services');
    XLSX.writeFile(wb, 'Template_Visa_Services.xlsx');
  };

  // ================= IMPORT VISA SERVICES =================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const rawData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawData.length === 0) {
          setImportError('File Excel tidak memiliki baris data.');
          setParsedServices({ valid: [], invalid: [] });
          return;
        }

        const validList: any[] = [];
        const invalidList: any[] = [];

        // Build map of existing services by normalized name
        const existingMap = new Map<string, VisaService>();
        visaServices.forEach((s) => {
          existingMap.set(s.serviceName.trim().toLowerCase(), s);
        });

        rawData.forEach((row, idx) => {
          // Flexible key lookup
          const findVal = (candidates: string[]) => {
            const foundKey = Object.keys(row).find((k) =>
              candidates.includes(k.trim().toLowerCase())
            );
            return foundKey ? String(row[foundKey] || '').trim() : '';
          };

          const name = findVal(['service name', 'servicename', 'service', 'nama layanan', 'nama visa', 'layanan']);
          const cat = findVal(['visa category', 'category', 'kategori', 'kategori visa']) || 'ITAS';
          const dur = findVal(['visa duration', 'duration', 'durasi', 'durasi izin tinggal']) || '1 Year';
          const remRaw = findVal(['reminder before expiry (days)', 'reminder before expiry', 'reminder days', 'reminder', 'hari reminder', 'h-x']);
          const statRaw = findVal(['service status', 'status', 'status layanan']);

          if (!name) {
            invalidList.push({ row, reason: `Baris ${idx + 2}: Service Name tidak boleh kosong` });
            return;
          }

          const remDays = parseInt(remRaw, 10);
          const finalReminder = !isNaN(remDays) && remDays > 0 ? remDays : 60;
          const finalStatus: 'Active' | 'Inactive' =
            statRaw.toLowerCase().includes('inact') || statRaw.toLowerCase().includes('non')
              ? 'Inactive'
              : 'Active';

          const existingMatch = existingMap.get(name.toLowerCase());

          validList.push({
            serviceName: name,
            category: cat,
            duration: dur,
            reminderBeforeExpiry: finalReminder,
            status: finalStatus,
            isExisting: !!existingMatch,
            existingId: existingMatch?.id,
          });
        });

        setParsedServices({ valid: validList, invalid: invalidList });
      } catch (err: any) {
        console.error('Error parsing Excel:', err);
        setImportError('Gagal membaca file Excel. Pastikan file berformat .xlsx yang valid.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteImport = async () => {
    if (parsedServices.valid.length === 0) return;
    setImportLoading(true);
    setImportError(null);
    setImportSuccess(null);

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    try {
      for (const item of parsedServices.valid) {
        if (item.isExisting) {
          if (importMode === 'update_existing' && item.existingId) {
            await updateVisaService(item.existingId, {
              serviceName: item.serviceName,
              category: item.category,
              duration: item.duration,
              reminderBeforeExpiry: item.reminderBeforeExpiry,
              status: item.status,
            });
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          await addVisaService({
            serviceName: item.serviceName,
            category: item.category,
            duration: item.duration,
            reminderBeforeExpiry: item.reminderBeforeExpiry,
            status: item.status,
          });
          addedCount++;
        }
      }

      await recordAudit(
        'IMPORT_VISA_SERVICES',
        'Visa Services',
        `Imported: ${addedCount} added, ${updatedCount} updated, ${skippedCount} skipped`
      );

      setImportSuccess(
        `Berhasil memproses import: ${addedCount} layanan baru ditambahkan, ${updatedCount} diperbarui, ${skippedCount} dilewati.`
      );
      setParsedServices({ valid: [], invalid: [] });
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setImportError(err.message || 'Gagal memproses import Visa Services.');
    } finally {
      setImportLoading(false);
    }
  };

  // Example preview of reminder calculation
  const sampleExpiry = '2026-12-10';
  const effectiveDays = isCustomDays ? customDaysVal : reminderDays;
  const sampleReminderDate = calculateReminderDate(sampleExpiry, effectiveDays);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-[#D6C3A2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[#133D3D] text-sm">
              Visa Services (Master Layanan Visa)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#133D3D]/10 text-[#133D3D]">
              {visaServices.length} Layanan
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Kelola jenis visa, durasi izin tinggal, dan batas ambang reminder otomatis. Otomatis tersinkronisasi dengan Stay Permit Reminder.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportVisaServices}
            className="px-3.5 py-2 bg-white text-emerald-800 border border-emerald-600 hover:bg-emerald-50 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
            title="Download seluruh Visa Services sebagai Excel (.xlsx)"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(true);
                  setImportError(null);
                  setImportSuccess(null);
                }}
                className="px-3.5 py-2 bg-white text-[#133D3D] border border-[#133D3D] hover:bg-gray-50 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
                title="Upload daftar Visa Services dari file Excel"
              >
                <Upload className="w-4 h-4" />
                <span>Import Excel</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-[#133D3D] text-[#FDF7EB] text-xs font-semibold rounded-xl hover:bg-[#0d2a2a] transition-colors flex items-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4 text-[#D6C3A2]" />
                <span>Tambah Layanan</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================= IMPORT VISA SERVICES MODAL ================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-[#D6C3A2] shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="bg-[#133D3D] text-[#FFFFFF] p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#D6C3A2]/20 rounded-lg text-[#D6C3A2]">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#FDF7EB]">
                    Import Visa Services dari Excel (.xlsx)
                  </h4>
                  <p className="text-[11px] text-[#D6C3A2]">
                    Unggah daftar layanan visa secara massal tanpa merusak data klien yang sudah ada.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedServices({ valid: [], invalid: [] });
                  setImportFile(null);
                }}
                className="p-1.5 text-[#D6C3A2] hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Template Download Notice */}
              <div className="p-3.5 bg-[#FDF7EB] rounded-xl border border-[#D6C3A2]/60 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-[#133D3D] block">
                    Gunakan Format Template Resmi Bali Ease
                  </span>
                  <span className="text-gray-600 text-[11px]">
                    Kolom: Service Name, Visa Category, Visa Duration, Reminder Before Expiry (Days), Service Status
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-white border border-[#133D3D] text-[#133D3D] hover:bg-gray-50 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-[#D6C3A2] rounded-xl p-5 text-center hover:bg-[#FDF7EB]/20 transition">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="import-visa-services-file"
                />
                <label
                  htmlFor="import-visa-services-file"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                >
                  <div className="p-2.5 bg-[#133D3D]/10 rounded-full text-[#133D3D]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#133D3D] hover:underline">
                    Pilih file Excel (.xlsx) untuk diimport
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Sistem akan memvalidasi header kolom secara otomatis
                  </span>
                </label>
                {importFile && (
                  <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 bg-[#133D3D] text-[#FDF7EB] rounded-lg text-xs font-medium">
                    <FileText className="w-3.5 h-3.5 text-[#D6C3A2]" />
                    <span>{importFile.name}</span>
                  </div>
                )}
              </div>

              {/* Duplication Mode Choice */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                <span className="font-bold text-gray-800 block">
                  Penanganan Data Duplikasi (Matching Identifier: Service Name):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="update_existing"
                      checked={importMode === 'update_existing'}
                      onChange={() => setImportMode('update_existing')}
                      className="text-[#133D3D] focus:ring-[#133D3D]"
                    />
                    <span className="font-medium text-gray-700">
                      Perbarui Data Lama (Update Existing)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="add_new_only"
                      checked={importMode === 'add_new_only'}
                      onChange={() => setImportMode('add_new_only')}
                      className="text-[#133D3D] focus:ring-[#133D3D]"
                    />
                    <span className="font-medium text-gray-700">
                      Hanya Tambah Baru (Skip Duplikat)
                    </span>
                  </label>
                </div>
              </div>

              {/* Feedback Alert */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-700" />
                  <span>{importSuccess}</span>
                </div>
              )}

              {/* Parsed Preview */}
              {parsedServices.valid.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#133D3D]">
                      Preview Data: {parsedServices.valid.length} Valid
                      {parsedServices.invalid.length > 0 && (
                        <span className="text-rose-600 ml-1.5">
                          ({parsedServices.invalid.length} Tidak Valid)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#133D3D] text-[#FFFFFF] sticky top-0 font-semibold">
                        <tr>
                          <th className="px-3 py-2">Service Name</th>
                          <th className="px-3 py-2">Kategori</th>
                          <th className="px-3 py-2">Durasi</th>
                          <th className="px-3 py-2">Reminder</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Info</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {parsedServices.valid.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-bold text-gray-900">{item.serviceName}</td>
                            <td className="px-3 py-2 text-gray-600">{item.category}</td>
                            <td className="px-3 py-2 text-gray-600">{item.duration}</td>
                            <td className="px-3 py-2 font-mono">H-{item.reminderBeforeExpiry}</td>
                            <td className="px-3 py-2">{item.status}</td>
                            <td className="px-3 py-2">
                              {item.isExisting ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-semibold">
                                  {importMode === 'update_existing' ? 'Akan Diupdate' : 'Dilewati'}
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                                  Baru
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedServices({ valid: [], invalid: [] });
                  setImportFile(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={importLoading || parsedServices.valid.length === 0}
                className="px-5 py-2 bg-[#133D3D] text-[#FDF7EB] text-xs font-bold rounded-xl hover:bg-[#0d2a2a] transition flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Upload className="w-4 h-4 text-[#D6C3A2]" />
                <span>
                  {importLoading
                    ? 'Memproses Import...'
                    : `Simpan ke Database (${parsedServices.valid.length} Data)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {isFormOpen && (
        <div className="bg-[#FDF7EB] p-6 rounded-2xl border border-[#D6C3A2] shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[#D6C3A2]/40 pb-3">
            <div>
              <h4 className="font-bold text-sm text-[#133D3D]">
                {editingServiceId ? 'Edit Layanan Visa' : 'Tambah Layanan Visa Baru'}
              </h4>
              <p className="text-gray-500 text-xs">
                Perubahan pada ambang reminder akan otomatis berlaku untuk seluruh data klien dengan layanan ini.
              </p>
            </div>
            <button
              onClick={resetForm}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Service Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Service Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: E28A, Altus ITAS, E33G"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D] focus:border-[#133D3D]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kategori
                </label>
                <input
                  type="text"
                  placeholder="Contoh: ITAS, KITAP, Kunjungan, Investor"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D] focus:border-[#133D3D]"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Durasi Izin Tinggal
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 30 Hari, 60 Hari, 1 Tahun, 2 Tahun"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D] focus:border-[#133D3D]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Status Layanan
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#133D3D] focus:border-[#133D3D] font-semibold"
                >
                  <option value="Active">Active (Aktif)</option>
                  <option value="Inactive">Inactive (Nonaktif)</option>
                </select>
              </div>
            </div>

            {/* Reminder Days Configuration */}
            <div className="p-4 bg-white rounded-xl border border-[#D6C3A2]/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-[#133D3D] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    Batas Reminder Sebelum Expired (Reminder Before Expiry Days)
                  </span>
                  <p className="text-[11px] text-gray-500">
                    Klien dengan layanan ini akan mulai muncul di menu reminder H-X hari sebelum masa berlaku berakhir.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-[#133D3D] text-[#FDF7EB] rounded-lg">
                    {effectiveDays} Hari
                  </span>
                </div>
              </div>

              {/* Presets and Custom Input */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {presetReminderDays.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => {
                      setReminderDays(days);
                      setIsCustomDays(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      !isCustomDays && reminderDays === days
                        ? 'bg-[#133D3D] text-[#FDF7EB] shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {days} Hari
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsCustomDays(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isCustomDays
                      ? 'bg-[#133D3D] text-[#FDF7EB] shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Custom Days
                </button>

                {isCustomDays && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={customDaysVal}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10) || 1;
                        setCustomDaysVal(v);
                        setReminderDays(v);
                      }}
                      className="w-20 px-2.5 py-1.5 text-xs bg-white border border-[#133D3D] rounded-lg focus:outline-none font-bold"
                    />
                    <span className="text-xs text-gray-600 font-medium">Hari</span>
                  </div>
                )}
              </div>

              {/* Formula & Live Simulation Preview */}
              <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-600 flex flex-wrap items-center gap-2">
                <span className="font-bold text-[#133D3D]">Simulasi Rumus:</span>
                <span>
                  Jika Stay Permit expired pada{' '}
                  <strong className="text-gray-900">{formatDateDisplay(sampleExpiry)}</strong>,
                  reminder akan otomatis mulai aktif pada tanggal{' '}
                  <strong className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {formatDateDisplay(sampleReminderDate || undefined)} (H-{effectiveDays})
                  </strong>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#133D3D] text-[#FDF7EB] text-xs font-bold rounded-xl hover:bg-[#0d2a2a] transition-all flex items-center gap-2 disabled:opacity-50 shadow-xs"
              >
                <Check className="w-4 h-4 text-[#D6C3A2]" />
                {loading ? 'Menyimpan...' : editingServiceId ? 'Simpan Perubahan' : 'Simpan Layanan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services Table */}
      <div className="bg-white rounded-2xl border border-[#D6C3A2] shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#133D3D] text-[#FFFFFF] font-semibold">
            <tr>
              <th className="px-4 py-3.5 w-12 text-center">No</th>
              <th className="px-4 py-3.5">Nama Layanan Visa</th>
              <th className="px-4 py-3.5">Kategori</th>
              <th className="px-4 py-3.5">Durasi Izin Tinggal</th>
              <th className="px-4 py-3.5">Ambang Reminder (H-X)</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              {canEdit && <th className="px-4 py-3.5 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visaServices.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="py-10 text-center text-gray-400">
                  Belum ada data Visa Services. Klik "Tambah Layanan" atau "Import Excel" untuk menambahkan.
                </td>
              </tr>
            ) : (
              visaServices.map((svc, index) => {
                const isActive = svc.status === 'Active';
                return (
                  <tr key={svc.id} className="hover:bg-[#FDF7EB]/40 transition-colors">
                    <td className="px-4 py-3.5 text-center font-mono text-gray-400 font-semibold">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-gray-900">{svc.serviceName}</div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 font-medium">
                      {svc.category || '-'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">
                      {svc.duration || '-'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#133D3D]/10 text-[#133D3D]">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" />
                        H-{svc.reminderBeforeExpiry} Hari
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-gray-100 text-gray-500 border border-gray-300'
                        }`}
                      >
                        {svc.status || 'Active'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(svc)}
                            className="p-1.5 text-gray-500 hover:text-[#133D3D] hover:bg-gray-100 rounded-lg transition"
                            title="Edit Layanan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(svc)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Hapus Layanan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
