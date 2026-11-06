import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
    }
  }
}
testConnection();

// Initial Default Master Data
export const DEFAULT_MASTER_DATA = [
  // Rekanan
  { category: 'rekanan', value: 'Internal Bali Ease', label: 'Internal Bali Ease' },
  { category: 'rekanan', value: 'PT Bali Global', label: 'PT Bali Global' },
  { category: 'rekanan', value: 'Agent Seminyak', label: 'Agent Seminyak' },
  { category: 'rekanan', value: 'Agent Canggu', label: 'Agent Canggu' },
  { category: 'rekanan', value: 'Direct Client', label: 'Direct Client' },
  // Imigrasi
  { category: 'imigrasi', value: 'Ngurah Rai (Kanim Denpasar)', label: 'Ngurah Rai (Kanim Denpasar)' },
  { category: 'imigrasi', value: 'Singaraja', label: 'Singaraja' },
  { category: 'imigrasi', value: 'Jakarta (Dirjen)', label: 'Jakarta (Dirjen)' },
  { category: 'imigrasi', value: 'Surabaya', label: 'Surabaya' },
  // Service
  { category: 'service', value: 'Altus ITAS', label: 'Altus ITAS' },
  { category: 'service', value: 'ITAS', label: 'ITAS' },
  { category: 'service', value: 'KITAP', label: 'KITAP' },
  { category: 'service', value: 'E33F', label: 'E33F' },
  { category: 'service', value: 'B211A Visa', label: 'B211A Visa' },
  { category: 'service', value: 'Visa on Arrival (VoA) Extension', label: 'Visa on Arrival (VoA) Extension' },
  { category: 'service', value: 'Investor ITAS', label: 'Investor ITAS' },
  // Status
  { category: 'status', value: 'Active', label: 'Active' },
  { category: 'status', value: 'In Process', label: 'In Process' },
  { category: 'status', value: 'Approved', label: 'Approved' },
  { category: 'status', value: 'Submitted', label: 'Submitted' },
  { category: 'status', value: 'Expired', label: 'Expired' },
  { category: 'status', value: 'Cancelled', label: 'Cancelled' },
  // Status Follow-up
  { category: 'statusFollowUp', value: 'Belum Follow-up', label: 'Belum Follow-up' },
  { category: 'statusFollowUp', value: 'Sudah Follow-up', label: 'Sudah Follow-up' },
  { category: 'statusFollowUp', value: 'Menunggu Balasan', label: 'Menunggu Balasan' },
  { category: 'statusFollowUp', value: 'Tidak Merespons', label: 'Tidak Merespons' },
];

export const DEFAULT_REMINDER_SETTINGS = [
  { service: 'Altus ITAS', daysBeforeExpiry: 80, isActive: true },
  { service: 'ITAS', daysBeforeExpiry: 60, isActive: true },
  { service: 'KITAP', daysBeforeExpiry: 90, isActive: true },
  { service: 'E33F', daysBeforeExpiry: 60, isActive: true },
  { service: 'B211A Visa', daysBeforeExpiry: 14, isActive: true },
  { service: 'Visa on Arrival (VoA) Extension', daysBeforeExpiry: 7, isActive: true },
  { service: 'Investor ITAS', daysBeforeExpiry: 90, isActive: true },
];

// Helper to seed default options if collections are empty
export async function seedInitialMasterDataAndRemindersIfEmpty(currentUserEmail?: string, currentUserId?: string) {
  try {
    const masterCol = collection(db, 'masterData');
    const masterSnap = await getDocs(masterCol);
    if (masterSnap.empty) {
      const batch = writeBatch(db);
      DEFAULT_MASTER_DATA.forEach((item, index) => {
        const id = `${item.category}_${index + 1}`;
        const ref = doc(db, 'masterData', id);
        batch.set(ref, {
          id,
          category: item.category,
          value: item.value,
          label: item.label,
          order: index + 1,
          createdAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }

    const reminderCol = collection(db, 'reminderSettings');
    const reminderSnap = await getDocs(reminderCol);
    if (reminderSnap.empty) {
      const batch = writeBatch(db);
      DEFAULT_REMINDER_SETTINGS.forEach((item, index) => {
        const id = `rem_${index + 1}`;
        const ref = doc(db, 'reminderSettings', id);
        batch.set(ref, {
          id,
          service: item.service,
          daysBeforeExpiry: item.daysBeforeExpiry,
          isActive: item.isActive,
          updatedAt: new Date().toISOString(),
          updatedBy: 'System Default',
        });
      });
      await batch.commit();
    }

    // Seed admin if raychiko83@gmail.com
    if (currentUserEmail === 'raychiko83@gmail.com' && currentUserId) {
      await setDoc(doc(db, 'admins', currentUserId), {
        email: currentUserEmail,
        createdAt: new Date().toISOString(),
      }, { merge: true });
    }
  } catch (err) {
    console.error('Error during initial seed:', err);
  }
}
