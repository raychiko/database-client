/**
 * Date utilities handling Asia/Makassar (WITA, UTC+8) for Bali Ease
 */

// Get current date string in Asia/Makassar timezone (YYYY-MM-DD)
export function getTodayWITAString(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    // Fallback: manually offset UTC + 8 hours
    const witaMs = now.getTime() + 8 * 60 * 60 * 1000;
    return new Date(witaMs).toISOString().split('T')[0];
  }
}

// Convert string / Excel date to YYYY-MM-DD
export function normalizeDateString(val: any): string {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    // Excel serial number (days since 1899-12-30)
    // Excel leap year bug adjustment
    const utcDays = Math.floor(val - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    // If format like DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = trimmed.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
    if (ddmmyyyy) {
      const d = ddmmyyyy[1].padStart(2, '0');
      const m = ddmmyyyy[2].padStart(2, '0');
      const y = ddmmyyyy[3];
      return `${y}-${m}-${d}`;
    }
    // If format like YYYY-MM-DD
    const yyyymmdd = trimmed.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
    if (yyyymmdd) {
      const y = yyyymmdd[1];
      const m = yyyymmdd[2].padStart(2, '0');
      const d = yyyymmdd[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // Try native parse
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  return String(val);
}

// Calculate whole days between Today (WITA) and Expiry Date
// Positive = future (remaining days)
// 0 = today (expired on H-0)
// Negative = already expired
export function calculateRemainingDays(expiryDateStr: string, todayStr?: string): number | null {
  if (!expiryDateStr) return null;
  const normalizedExpiry = normalizeDateString(expiryDateStr);
  const partsExp = normalizedExpiry.split('-');
  if (partsExp.length !== 3) return null;

  const yExp = parseInt(partsExp[0], 10);
  const mExp = parseInt(partsExp[1], 10) - 1;
  const dExp = parseInt(partsExp[2], 10);
  if (isNaN(yExp) || isNaN(mExp) || isNaN(dExp)) return null;

  const today = todayStr || getTodayWITAString();
  const partsToday = today.split('-');
  const yToday = parseInt(partsToday[0], 10);
  const mToday = parseInt(partsToday[1], 10) - 1;
  const dToday = parseInt(partsToday[2], 10);
  if (isNaN(yToday) || isNaN(mToday) || isNaN(dToday)) return null;

  const expUtc = Date.UTC(yExp, mExp, dExp);
  const todayUtc = Date.UTC(yToday, mToday, dToday);

  const diffMs = expUtc - todayUtc;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// Format date for display in Indonesian/English (e.g., 25 Jan 2027)
export function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return '-';
  const normalized = normalizeDateString(dateStr);
  const parts = normalized.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthIdx = parseInt(m, 10) - 1;
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${parseInt(d, 10)} ${months[monthIdx]} ${y}`;
  }
  return dateStr;
}

// Format full timestamp (e.g., 6 Nov 2026, 14:30 WITA)
export function formatDateTimeDisplay(isoStr?: string): string {
  if (!isoStr) return '-';
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return isoStr;
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date) + ' WITA';
  } catch {
    return isoStr || '-';
  }
}

// Calculate Reminder Date based on formula: Reminder Date = Expiry Date - Reminder Days
export function calculateReminderDate(expiryDateStr: string, reminderDays: number): string | null {
  if (!expiryDateStr || reminderDays <= 0) return null;
  const normalized = normalizeDateString(expiryDateStr);
  const parts = normalized.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

  const expUtc = Date.UTC(y, m, d);
  const reminderUtc = expUtc - (reminderDays * 86400 * 1000);
  const resDate = new Date(reminderUtc);
  return resDate.toISOString().split('T')[0];
}

