export type UserRole = 'ADMIN' | 'CS';

export interface CSPermissions {
  // Modules View
  canViewDashboard: boolean;
  canViewDatabase: boolean;
  canViewReminders: boolean;
  canViewFollowUp: boolean;
  canViewSettings: boolean;

  // CRUD & Operations
  canCreateClient: boolean;
  canEditClient: boolean;
  canDeleteClient: boolean;
  canExportExcel: boolean;
  canImportExcel: boolean;

  // Granular Actions
  canEditVisaStatus: boolean;
  canEditExpiryDate: boolean;
  canEditPassportNo: boolean;
  canEditSponsor: boolean;
  canEditService: boolean;
  canAddFollowUp: boolean;
  canEditReminderSettings: boolean;
  canManageUsers: boolean;
}

export const DEFAULT_CS_PERMISSIONS: CSPermissions = {
  canViewDashboard: true,
  canViewDatabase: true,
  canViewReminders: true,
  canViewFollowUp: true,
  canViewSettings: false,

  canCreateClient: true,
  canEditClient: true,
  canDeleteClient: false,
  canExportExcel: true,
  canImportExcel: false,

  canEditVisaStatus: true,
  canEditExpiryDate: true,
  canEditPassportNo: true,
  canEditSponsor: true,
  canEditService: true,
  canAddFollowUp: true,
  canEditReminderSettings: false,
  canManageUsers: false,
};

export const ADMIN_PERMISSIONS: CSPermissions = {
  canViewDashboard: true,
  canViewDatabase: true,
  canViewReminders: true,
  canViewFollowUp: true,
  canViewSettings: true,

  canCreateClient: true,
  canEditClient: true,
  canDeleteClient: true,
  canExportExcel: true,
  canImportExcel: true,

  canEditVisaStatus: true,
  canEditExpiryDate: true,
  canEditPassportNo: true,
  canEditSponsor: true,
  canEditService: true,
  canAddFollowUp: true,
  canEditReminderSettings: true,
  canManageUsers: true,
};

export interface UserProfile {
  uid: string;
  userId?: string; // CS User ID like CS001, CS002
  email?: string; // For Admin
  displayName: string;
  role: UserRole;
  status: 'active' | 'inactive';
  passwordHash?: string;
  salt?: string;
  permissions?: CSPermissions;
  lastLogin?: string;
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

export interface VisaService {
  id: string;
  serviceName: string; // e.g. "E28A", "Altus ITAS"
  category: string; // e.g. "ITAS", "KITAP", "Visit Visa", "Investor"
  duration: string; // e.g. "30 Days", "60 Days", "1 Year", "2 Years"
  reminderBeforeExpiry: number; // in days, e.g. 80, 60
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
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
  clientPhone?: string; // Client Phone Number (optional string)
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
  | 'IMPORT_VISA_SERVICES'
  | 'EXPORT_VISA_SERVICES'
  | 'ADD_FOLLOW_UP'
  | 'MASTER_DATA_CHANGE'
  | 'REMINDER_SETTINGS_CHANGE'
  | 'USER_ROLE_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'VISA_SERVICE_CHANGE'
  | 'CREATE_CS_USER'
  | 'UPDATE_CS_USER'
  | 'LOGIN'
  | 'LOGOUT';

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
  reminderDate?: string; // Expiry Date - thresholdDays
}
