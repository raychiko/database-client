import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, FileSpreadsheet, AlertTriangle, Check, ArrowRight, RefreshCw } from 'lucide-react';
import { VisaClient } from '../../types';
import { useData } from '../../context/DataContext';
import { normalizeDateString } from '../../utils/dateUtils';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TARGET_FIELDS: { key: keyof VisaClient; label: string; aliases: string[] }[] = [
  { key: 'date', label: 'Date', aliases: ['date', 'tanggal', 'tgl', 'entry date'] },
  { key: 'rekanan', label: 'Rekanan', aliases: ['rekanan', 'partner', 'agent', 'agen'] },
  { key: 'imigrasi', label: 'Imigrasi', aliases: ['imigrasi', 'kantor imigrasi', 'kanim', 'immigration'] },
  { key: 'service', label: 'Service', aliases: ['service', 'layanan', 'jenis visa', 'visa type'] },
  { key: 'namaClient', label: 'Nama Client', aliases: ['nama client', 'nama', 'client name', 'name', 'client'] },
  { key: 'noPermohonan', label: 'No Permohonan', aliases: ['no permohonan', 'nomor permohonan', 'application no', 'app no'] },
  { key: 'noPassport', label: 'No Passport', aliases: ['no passport', 'nomor passport', 'passport no', 'passport', 'paspor', 'no paspor'] },
  { key: 'clientPhone', label: 'Client Phone Number', aliases: ['client phone number', 'client phone', 'phone number', 'phone', 'no telp', 'no telepon', 'nomor telepon', 'telepon', 'telp', 'whatsapp', 'wa'] },
  { key: 'status', label: 'Status', aliases: ['status', 'visa status', 'kondisi'] },
  { key: 'staypermit', label: 'Staypermit', aliases: ['staypermit', 'stay permit', 'expired staypermit', 'expiry date', 'expired', 'masa berlaku'] },
  { key: 'evisa', label: 'EVISA', aliases: ['evisa', 'e-visa', 'no evisa', 'nomor evisa'] },
  { key: 'sponsor', label: 'Sponsor', aliases: ['sponsor', 'penjamin', 'company'] },
  { key: 'statusFollowUp', label: 'Status Follow-up', aliases: ['status follow-up', 'status followup', 'followup status', 'follow up'] },
  { key: 'remark', label: 'Remark', aliases: ['remark', 'catatan', 'keterangan', 'notes'] },
];

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({ isOpen, onClose }) => {
  const { clients, batchImportClients } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'result'>('upload');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [updateDuplicates, setUpdateDuplicates] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    updated: number;
    skipped: number;
    failed: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true, raw: false });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        const firstSheet = wb.SheetNames[0] || '';
        setSelectedSheet(firstSheet);
        parseSheet(wb, firstSheet);
      } catch (err) {
        console.error('Failed to parse workbook:', err);
        alert('Gagal membaca file Excel. Pastikan file berformat .xlsx atau .xls yang valid.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const parseSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    // Read as array of arrays
    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!data || data.length === 0) {
      alert('Sheet ini kosong.');
      return;
    }

    // Find header row (first row with at least 3 non-empty cells)
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const nonEmpties = data[i].filter((cell) => String(cell).trim() !== '').length;
      if (nonEmpties >= 3) {
        headerRowIdx = i;
        break;
      }
    }

    const detectedHeaders: string[] = (data[headerRowIdx] || []).map((h) => String(h).trim());
    setHeaders(detectedHeaders);

    const rows = data.slice(headerRowIdx + 1).filter((row) =>
      row.some((c) => String(c).trim() !== '')
    );
    setRawRows(rows);

    // Auto-map headers
    const newMapping: Record<string, string> = {};
    TARGET_FIELDS.forEach((tf) => {
      const foundHeader = detectedHeaders.find((h) => {
        const lowerH = h.toLowerCase().trim();
        return tf.aliases.some((alias) => lowerH === alias || lowerH.includes(alias));
      });
      if (foundHeader) {
        newMapping[tf.key] = foundHeader;
      }
    });
    setMapping(newMapping);
    setStep('mapping');
  };

  const handleSheetChange = (sheet: string) => {
    setSelectedSheet(sheet);
    if (workbook) {
      parseSheet(workbook, sheet);
    }
  };

  // Convert raw rows according to mapping
  const parsedRecords = rawRows.map((row) => {
    const record: any = {};
    TARGET_FIELDS.forEach((tf) => {
      const headerName = mapping[tf.key];
      if (headerName) {
        const colIdx = headers.indexOf(headerName);
        if (colIdx >= 0) {
          let val = row[colIdx];
          if (tf.key === 'noPassport' || tf.key === 'clientPhone') {
            // Strictly string to keep leading zeros and + prefix
            record[tf.key] = String(val ?? '').trim();
          } else if (tf.key === 'date' || tf.key === 'staypermit') {
            record[tf.key] = normalizeDateString(val);
          } else {
            record[tf.key] = String(val ?? '').trim();
          }
        }
      } else {
        record[tf.key] = '';
      }
    });
    return record as Omit<VisaClient, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdById'>;
  });

  // Duplicate passport detection
  const existingPassports = new Set(clients.map((c) => c.noPassport.trim().toUpperCase()));
  const duplicateRows = parsedRecords.filter((r) =>
    r.noPassport && existingPassports.has(r.noPassport.trim().toUpperCase())
  );

  const handleConfirmImport = async () => {
    setIsProcessing(true);
    try {
      const validRecords = parsedRecords.filter((r) => r.namaClient || r.noPassport);
      const res = await batchImportClients(validRecords, updateDuplicates);
      setImportResult(res);
      setStep('result');
    } catch (err: any) {
      console.error('Import failed:', err);
      alert('Terjadi kesalahan saat mengimpor data: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setStep('upload');
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet('');
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        'Date': '2026-01-15',
        'Rekanan': 'Bali Express Travel',
        'Imigrasi': 'Kantor Imigrasi Ngurah Rai',
        'Service': 'Altus ITAS',
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
    XLSX.writeFile(wb, 'Template_Client_Database.xlsx');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] rounded-xl shadow-2xl border border-[#D6C3A2] w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#133D3D] text-[#FFFFFF] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D6C3A2]/20 rounded-lg text-[#D6C3A2]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[#FDF7EB]">Import Excel Database</h3>
              <p className="text-xs text-[#D6C3A2]">Dukungan file .xlsx & .xls dengan pemetaan kolom dan deteksi duplikasi</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetAll();
              onClose();
            }}
            className="p-1.5 text-[#D6C3A2] hover:text-[#FFFFFF] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#D6C3A2] rounded-xl p-10 bg-[#FDF7EB]/60 text-center">
              <Upload className="w-12 h-12 text-[#133D3D] mb-3 opacity-80" />
              <h4 className="text-base font-medium text-[#133D3D]">Pilih atau Drag File Excel</h4>
              <p className="text-xs text-gray-500 mt-1 mb-4">Mendukung format spreadsheet Excel (.xlsx, .xls)</p>
              <div className="flex items-center gap-3">
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
                  className="cursor-pointer px-5 py-2.5 bg-[#133D3D] text-[#FDF7EB] font-medium rounded-lg hover:bg-[#0d2a2a] transition-colors text-sm shadow-xs"
                >
                  Pilih File Excel
                </label>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2.5 bg-white border border-[#D6C3A2] text-[#133D3D] font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm shadow-xs"
                >
                  Download Template
                </button>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-5">
              {/* Sheet Selector */}
              {sheetNames.length > 1 && (
                <div className="bg-[#FDF7EB] p-3 rounded-lg border border-[#D6C3A2]/60 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#133D3D]">Pilih Sheet Excel:</span>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="bg-white border border-[#D6C3A2] text-sm rounded-md px-3 py-1.5 font-medium text-[#133D3D] focus:outline-none"
                  >
                    {sheetNames.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-[#133D3D] mb-1">Pemetaan Kolom Spreadsheet</h4>
                <p className="text-xs text-gray-500 mb-4">
                  Kolom otomatis dipetakan sesuai header standar. Anda dapat mengubah pilihan jika nama kolom di file berbeda.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {TARGET_FIELDS.map((tf) => (
                    <div
                      key={tf.key}
                      className="flex items-center justify-between p-2.5 bg-[#FDF7EB]/40 rounded-lg border border-gray-200"
                    >
                      <div className="w-1/2">
                        <span className="text-xs font-semibold text-[#133D3D] block">{tf.label}</span>
                        <span className="text-[10px] text-gray-500">{tf.key}</span>
                      </div>
                      <div className="w-1/2">
                        <select
                          value={mapping[tf.key] || ''}
                          onChange={(e) =>
                            setMapping((prev) => ({ ...prev, [tf.key]: e.target.value }))
                          }
                          className="w-full text-xs border border-[#D6C3A2] rounded-md px-2 py-1.5 bg-white text-gray-800 focus:outline-none"
                        >
                          <option value="">-- Lewati Kolom Ini --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  Ganti File
                </button>
                <button
                  onClick={() => setStep('preview')}
                  className="px-5 py-2 bg-[#133D3D] text-[#FDF7EB] text-xs font-medium rounded-lg hover:bg-[#0d2a2a] transition-colors flex items-center gap-2"
                >
                  Lanjut ke Preview Data ({rawRows.length} baris)
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Duplicate Passport Warning Box */}
              {duplicateRows.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="text-xs font-semibold text-amber-900">
                        Peringatan Duplikasi: {duplicateRows.length} No Passport sudah ada di database!
                      </h5>
                      <p className="text-[11px] text-amber-800 mt-1">
                        Satu nomor passport boleh memiliki permohonan baru. Tentukan perlakuan data yang memiliki nomor passport sama:
                      </p>
                      <div className="mt-2.5 flex items-center gap-6">
                        <label className="flex items-center gap-2 text-xs text-amber-950 cursor-pointer font-medium">
                          <input
                            type="radio"
                            name="dup_handling"
                            checked={!updateDuplicates}
                            onChange={() => setUpdateDuplicates(false)}
                            className="text-[#133D3D]"
                          />
                          <span>Simpan Sebagai Record Baru / Lewati update data lama</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-amber-950 cursor-pointer font-medium">
                          <input
                            type="radio"
                            name="dup_handling"
                            checked={updateDuplicates}
                            onChange={() => setUpdateDuplicates(true)}
                            className="text-[#133D3D]"
                          />
                          <span>Perbarui (Update) data client lama yang cocok</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-[#133D3D]">
                    Preview 5 Baris Pertama (Total: {parsedRecords.length} baris)
                  </h4>
                  <span className="text-[11px] text-gray-500">Nomor passport disimpan sebagai teks</span>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#133D3D] text-[#FFFFFF]">
                      <tr>
                        <th className="px-2.5 py-2">No</th>
                        <th className="px-2.5 py-2">Date</th>
                        <th className="px-2.5 py-2">Service</th>
                        <th className="px-2.5 py-2">Nama Client</th>
                        <th className="px-2.5 py-2">No Passport</th>
                        <th className="px-2.5 py-2">Staypermit</th>
                        <th className="px-2.5 py-2">Status</th>
                        <th className="px-2.5 py-2">Follow-up</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedRecords.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-2.5 py-2 font-mono">{idx + 1}</td>
                          <td className="px-2.5 py-2">{row.date || '-'}</td>
                          <td className="px-2.5 py-2 font-medium">{row.service || '-'}</td>
                          <td className="px-2.5 py-2 font-medium">{row.namaClient || '-'}</td>
                          <td className="px-2.5 py-2 font-mono font-medium text-blue-900 bg-blue-50/50">
                            {row.noPassport || '-'}
                          </td>
                          <td className="px-2.5 py-2">{row.staypermit || '-'}</td>
                          <td className="px-2.5 py-2">{row.status || '-'}</td>
                          <td className="px-2.5 py-2">{row.statusFollowUp || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <button
                  disabled={isProcessing}
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  Kembali ke Mapping
                </button>
                <div className="flex items-center gap-3">
                  <button
                    disabled={isProcessing}
                    onClick={() => {
                      resetAll();
                      onClose();
                    }}
                    className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-800"
                  >
                    Batal
                  </button>
                  <button
                    disabled={isProcessing}
                    onClick={handleConfirmImport}
                    className="px-6 py-2 bg-[#133D3D] text-[#FDF7EB] text-xs font-semibold rounded-lg hover:bg-[#0d2a2a] transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Mengimpor ke Firestore...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Konfirmasi Simpan ke Database ({parsedRecords.length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'result' && importResult && (
            <div className="text-center py-6 space-y-5">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#133D3D]">Proses Import Selesai</h4>
                <p className="text-xs text-gray-600 mt-1">Data telah berhasil diproses ke database Cloud Firestore.</p>
              </div>

              <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 block uppercase font-medium">Berhasil</span>
                  <span className="text-xl font-bold text-emerald-800">{importResult.imported}</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-[10px] text-blue-700 block uppercase font-medium">Diperbarui</span>
                  <span className="text-xl font-bold text-blue-800">{importResult.updated}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <span className="text-[10px] text-amber-700 block uppercase font-medium">Dilewati</span>
                  <span className="text-xl font-bold text-amber-800">{importResult.skipped}</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                  <span className="text-[10px] text-rose-700 block uppercase font-medium">Gagal</span>
                  <span className="text-xl font-bold text-rose-800">{importResult.failed}</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => {
                    resetAll();
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-[#133D3D] text-[#FDF7EB] text-xs font-semibold rounded-lg hover:bg-[#0d2a2a] transition-colors"
                >
                  Tutup dan Lihat Database
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
