export type UserRole = 'ADMIN' | 'CS';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export type MasterCategory = 'rekanan' | 'imigrasi' | 'service' | 'status' | 'statusFollowUp';

export interface MasterDataItem {
  id: string;
  category: MasterCategory;
  value: string;
  label: string;
  order?: number;
  createdAt?: string;
}

export interface VisaClient {
  id: string;
  date: string; // YYYY-MM-DD
  rekanan: string;
  imigrasi: string;
  service: string;
  namaClient: string;
  noPermohonan: string;
  noPassport: string;
  status: string;
  staypermit: string; // YYYY-MM-DD expired date
  evisa: string;
  sponsor: string;
  statusFollowUp: string;
  remark: string;
  lastFollowUpDate?: string;
  nextFollowUpDate?: string;
  createdAt?: string;
  createdBy?: string;
  createdById?: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedById?: string;
}

export interface ReminderSetting {
  id: string;
  service: string;
  daysBeforeExpiry: number;
  isActive: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface FollowUpRecord {
  id: string;
  clientId: string;
  clientName?: string;
  noPassport?: string;
  service?: string;
  followUpDate: string; // YYYY-MM-DD
  userId: string;
  userName: string;
  status: string;
  remark: string;
  nextFollowUpDate?: string; // YYYY-MM-DD
  createdAt: string;
}

export type AuditActivityType =
  | 'CREATE_CLIENT'
  | 'UPDATE_CLIENT'
  | 'DELETE_CLIENT'
  | 'IMPORT_EXCEL'
  | 'EXPORT_EXCEL'
  | 'ADD_FOLLOW_UP'
  | 'MASTER_DATA_CHANGE'
  | 'REMINDER_SETTINGS_CHANGE'
  | 'USER_ROLE_CHANGE';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  activityType: AuditActivityType;
  targetRecord: string;
  details: string;
  createdAt: string;
}

export interface StayPermitReminderItem {
  client: VisaClient;
  remainingDays: number;
  urgency: 'urgent' | 'warning' | 'normal';
  thresholdDays: number;
}
