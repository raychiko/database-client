import * as XLSX from 'xlsx';
import { VisaClient } from '../../types';
import { formatDateDisplay } from '../../utils/dateUtils';

export function exportClientsToExcel(clients: VisaClient[], filename = 'Visa_Database_Bali_Ease.xlsx') {
  // Column structure matching Bali Ease standard
  const rows = clients.map((client, index) => ({
    'No': index + 1,
    'Date': client.date || '',
    'Rekanan': client.rekanan || '',
    'Imigrasi': client.imigrasi || '',
    'Service': client.service || '',
    'Nama Client': client.namaClient || '',
    'No. Telepon / Phone': String(client.clientPhone || ''),
    'No Permohonan': client.noPermohonan || '',
    'No Passport': String(client.noPassport || ''), // preserve text
    'Status': client.status || '',
    'Staypermit': client.staypermit || '',
    'EVISA': client.evisa || '',
    'Sponsor': client.sponsor || '',
    'Status Follow-up': client.statusFollowUp || '',
    'Remark': client.remark || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Ensure 'No Passport' and 'No. Telepon / Phone' columns are formatted as text so leading zeroes are preserved
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Find column indices from header row
  let passportColIdx = -1;
  let phoneColIdx = -1;
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const headerCell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
    if (headerCell) {
      const headerVal = String(headerCell.v || '').toLowerCase();
      if (headerVal.includes('passport')) passportColIdx = C;
      if (headerVal.includes('telepon') || headerVal.includes('phone')) phoneColIdx = C;
    }
  }

  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    if (passportColIdx >= 0) {
      const pCell = worksheet[XLSX.utils.encode_cell({ r: R, c: passportColIdx })];
      if (pCell) {
        pCell.t = 's';
        pCell.v = String(pCell.v || '');
      }
    }
    if (phoneColIdx >= 0) {
      const phCell = worksheet[XLSX.utils.encode_cell({ r: R, c: phoneColIdx })];
      if (phCell) {
        phCell.t = 's';
        phCell.v = String(phCell.v || '');
      }
    }
  }

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 12 }, // Date
    { wch: 20 }, // Rekanan
    { wch: 24 }, // Imigrasi
    { wch: 18 }, // Service
    { wch: 25 }, // Nama Client
    { wch: 20 }, // No. Telepon / Phone
    { wch: 18 }, // No Permohonan
    { wch: 16 }, // No Passport
    { wch: 14 }, // Status
    { wch: 14 }, // Staypermit
    { wch: 18 }, // EVISA
    { wch: 22 }, // Sponsor
    { wch: 18 }, // Status Follow-up
    { wch: 30 }, // Remark
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Visa Database');

  XLSX.writeFile(workbook, filename);
}
