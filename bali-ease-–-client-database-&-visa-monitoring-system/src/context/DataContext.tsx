import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './AuthContext';
import {
  VisaClient,
  MasterDataItem,
  MasterCategory,
  ReminderSetting,
  FollowUpRecord,
  AuditLog,
  StayPermitReminderItem,
} from '../types';
import { calculateRemainingDays, getTodayWITAString, normalizeDateString } from '../utils/dateUtils';

interface DataContextType {
  clients: VisaClient[];
  masterData: MasterDataItem[];
  reminderSettings: ReminderSetting[];
  followUps: FollowUpRecord[];
  auditLogs: AuditLog[];
  loading: boolean;
  // CRUD Clients
  addClient: (clientData: Omit<VisaClient, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdById'>) => Promise<string>;
  updateClient: (id: string, clientData: Partial<VisaClient>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  // Master Data
  getMasterOptions: (category: MasterCategory) => string[];
  addMasterItem: (category: MasterCategory, value: string, label: string) => Promise<void>;
  updateMasterItem: (id: string, value: string, label: string) => Promise<void>;
  deleteMasterItem: (id: string) => Promise<void>;
  // Reminder Settings
  addReminderSetting: (service: string, daysBeforeExpiry: number) => Promise<void>;
  updateReminderSetting: (id: string, daysBeforeExpiry: number, isActive: boolean) => Promise<void>;
  // Follow Up
  addFollowUp: (followUp: {
    clientId: string;
    followUpDate: string;
    status: string;
    remark: string;
    nextFollowUpDate?: string;
  }) => Promise<void>;
  // Batch Import
  batchImportClients: (
    items: Omit<VisaClient, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdById'>[],
    updateDuplicates: boolean
  ) => Promise<{ imported: number; updated: number; skipped: number; failed: number }>;
  // Reminders helper
  getReminderInfo: (client: VisaClient) => StayPermitReminderItem | null;
  activeReminders: StayPermitReminderItem[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, isAdmin, recordAudit } = useAuth();

  const [clients, setClients] = useState<VisaClient[]>([]);
  const [masterData, setMasterData] = useState<MasterDataItem[]>([]);
  const [reminderSettings, setReminderSettings] = useState<ReminderSetting[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen to Firestore collections when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setClients([]);
      setMasterData([]);
      setReminderSettings([]);
      setFollowUps([]);
      setAuditLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Clients
    const unsubClients = onSnapshot(
      collection(db, 'visaClients'),
      (snapshot) => {
        const list: VisaClient[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as VisaClient);
        });
        setClients(list);
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'visaClients');
      }
    );

    // 2. Master Data
    const unsubMaster = onSnapshot(
      collection(db, 'masterData'),
      (snapshot) => {
        const list: MasterDataItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as MasterDataItem);
        });
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setMasterData(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'masterData');
      }
    );

    // 3. Reminder Settings
    const unsubReminders = onSnapshot(
      collection(db, 'reminderSettings'),
      (snapshot) => {
        const list: ReminderSetting[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ReminderSetting);
        });
        setReminderSettings(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'reminderSettings');
      }
    );

    // 4. Follow Up History
    const unsubFollowUps = onSnapshot(
      query(collection(db, 'followUpHistory'), orderBy('createdAt', 'desc'), limit(500)),
      (snapshot) => {
        const list: FollowUpRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as FollowUpRecord);
        });
        setFollowUps(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'followUpHistory');
      }
    );

    // 5. Audit Logs (Admin only)
    let unsubAudit = () => {};
    if (isAdmin) {
      unsubAudit = onSnapshot(
        query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(300)),
        (snapshot) => {
          const list: AuditLog[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() } as AuditLog);
          });
          setAuditLogs(list);
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, 'auditLogs');
        }
      );
    }

    return () => {
      unsubClients();
      unsubMaster();
      unsubReminders();
      unsubFollowUps();
      unsubAudit();
    };
  }, [currentUser, isAdmin]);

  // Master options helper
  const getMasterOptions = (category: MasterCategory): string[] => {
    return masterData
      .filter((item) => item.category === category)
      .map((item) => item.value);
  };

  // Add Client
  const addClient = async (
    clientData: Omit<VisaClient, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdById'>
  ): Promise<string> => {
    try {
      const now = new Date().toISOString();
      const payload = {
        ...clientData,
        date: normalizeDateString(clientData.date || getTodayWITAString()),
        staypermit: normalizeDateString(clientData.staypermit),
        noPassport: String(clientData.noPassport || '').trim(),
        createdAt: now,
        createdBy: userProfile?.displayName || currentUser?.email || 'User',
        createdById: currentUser?.uid || '',
        updatedAt: now,
        updatedBy: userProfile?.displayName || currentUser?.email || 'User',
        updatedById: currentUser?.uid || '',
      };

      const docRef = await addDoc(collection(db, 'visaClients'), payload);
      await recordAudit(
        'CREATE_CLIENT',
        `${payload.namaClient} (${payload.noPassport})`,
        `Created client for service ${payload.service}`
      );
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'visaClients');
    }
  };

  // Update Client
  const updateClient = async (id: string, clientData: Partial<VisaClient>): Promise<void> => {
    try {
      const clientRef = doc(db, 'visaClients', id);
      const now = new Date().toISOString();
      const payload: Record<string, any> = {
        ...clientData,
        updatedAt: now,
        updatedBy: userProfile?.displayName || currentUser?.email || 'User',
        updatedById: currentUser?.uid || '',
      };
      if (payload.date) payload.date = normalizeDateString(payload.date);
      if (payload.staypermit) payload.staypermit = normalizeDateString(payload.staypermit);
      if (payload.noPassport) payload.noPassport = String(payload.noPassport).trim();

      await updateDoc(clientRef, payload);
      await recordAudit(
        'UPDATE_CLIENT',
        payload.namaClient || id,
        `Updated client details (${payload.service || 'visa record'})`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `visaClients/${id}`);
    }
  };

  // Delete Client (Admin only)
  const deleteClient = async (id: string): Promise<void> => {
    if (!isAdmin) {
      throw new Error('Hanya Admin yang dapat menghapus data client.');
    }
    try {
      const target = clients.find((c) => c.id === id);
      await deleteDoc(doc(db, 'visaClients', id));
      await recordAudit(
        'DELETE_CLIENT',
        target ? `${target.namaClient} (${target.noPassport})` : id,
        'Deleted client record from Visa Database'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `visaClients/${id}`);
    }
  };

  // Master Data CRUD
  const addMasterItem = async (category: MasterCategory, value: string, label: string): Promise<void> => {
    if (!isAdmin) throw new Error('Hanya Admin yang dapat menambah Master Data.');
    try {
      const itemData = {
        category,
        value: value.trim(),
        label: label.trim(),
        order: masterData.filter((m) => m.category === category).length + 1,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'masterData'), itemData);
      await recordAudit('MASTER_DATA_CHANGE', `${category}: ${value}`, 'Added new master data item');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'masterData');
    }
  };

  const updateMasterItem = async (id: string, value: string, label: string): Promise<void> => {
    if (!isAdmin) throw new Error('Hanya Admin yang dapat mengubah Master Data.');
    try {
      await updateDoc(doc(db, 'masterData', id), {
        value: value.trim(),
        label: label.trim(),
      });
      await recordAudit('MASTER_DATA_CHANGE', id, `Updated master data item value to "${value}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `masterData/${id}`);
    }
  };

  const deleteMasterItem = async (id: string): Promise<void> => {
    if (!isAdmin) throw new Error('Hanya Admin yang dapat menghapus Master Data.');
    try {
      const item = masterData.find((m) => m.id === id);
      await deleteDoc(doc(db, 'masterData', id));
      await recordAudit('MASTER_DATA_CHANGE', item ? `${item.category}: ${item.value}` : id, 'Deleted master data item');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `masterData/${id}`);
    }
  };

  // Reminder Settings CRUD
  const addReminderSetting = async (service: string, daysBeforeExpiry: number): Promise<void> => {
    if (!isAdmin) throw new Error('Hanya Admin yang dapat menambah Reminder Setting.');
    try {
      await addDoc(collection(db, 'reminderSettings'), {
        service: service.trim(),
        daysBeforeExpiry,
        isActive: true,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.displayName || currentUser?.email || 'Admin',
      });
      await recordAudit('REMINDER_SETTINGS_CHANGE', service, `Configured reminder: ${daysBeforeExpiry} days`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reminderSettings');
    }
  };

  const updateReminderSetting = async (id: string, daysBeforeExpiry: number, isActive: boolean): Promise<void> => {
    if (!isAdmin) throw new Error('Hanya Admin yang dapat mengubah Reminder Setting.');
    try {
      const item = reminderSettings.find((r) => r.id === id);
      await updateDoc(doc(db, 'reminderSettings', id), {
        daysBeforeExpiry,
        isActive,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.displayName || currentUser?.email || 'Admin',
      });
      await recordAudit(
        'REMINDER_SETTINGS_CHANGE',
        item?.service || id,
        `Updated reminder to ${daysBeforeExpiry} days (Active: ${isActive})`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reminderSettings/${id}`);
    }
  };

  // Add Follow-up
  const addFollowUp = async (followUp: {
    clientId: string;
    followUpDate: string;
    status: string;
    remark: string;
    nextFollowUpDate?: string;
  }): Promise<void> => {
    try {
      const client = clients.find((c) => c.id === followUp.clientId);
      const now = new Date().toISOString();
      const followUpRecord: Omit<FollowUpRecord, 'id'> = {
        clientId: followUp.clientId,
        clientName: client?.namaClient || '',
        noPassport: client?.noPassport || '',
        service: client?.service || '',
        followUpDate: normalizeDateString(followUp.followUpDate || getTodayWITAString()),
        userId: currentUser?.uid || '',
        userName: userProfile?.displayName || currentUser?.email || 'CS Agent',
        status: followUp.status,
        remark: followUp.remark,
        nextFollowUpDate: followUp.nextFollowUpDate ? normalizeDateString(followUp.nextFollowUpDate) : '',
        createdAt: now,
      };

      await addDoc(collection(db, 'followUpHistory'), followUpRecord);

      // Update primary client record's statusFollowUp, remark, and last/next followUp dates
      const clientUpdates: Partial<VisaClient> = {
        statusFollowUp: followUp.status,
        remark: followUp.remark,
        lastFollowUpDate: followUpRecord.followUpDate,
        updatedAt: now,
        updatedBy: userProfile?.displayName || currentUser?.email || 'CS Agent',
        updatedById: currentUser?.uid || '',
      };
      if (followUpRecord.nextFollowUpDate) {
        clientUpdates.nextFollowUpDate = followUpRecord.nextFollowUpDate;
      }
      await updateDoc(doc(db, 'visaClients', followUp.clientId), clientUpdates);

      await recordAudit(
        'ADD_FOLLOW_UP',
        client?.namaClient || followUp.clientId,
        `Follow-up status: ${followUp.status}. Remark: ${followUp.remark}`
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'followUpHistory');
    }
  };

  // Batch import
  const batchImportClients = async (
    items: Omit<VisaClient, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdById'>[],
    updateDuplicates: boolean
  ): Promise<{ imported: number; updated: number; skipped: number; failed: number }> => {
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    const existingPassportMap = new Map<string, VisaClient>();
    clients.forEach((c) => {
      if (c.noPassport) {
        existingPassportMap.set(c.noPassport.trim().toUpperCase(), c);
      }
    });

    const now = new Date().toISOString();
    const batchSize = 200; // safe chunk size well under 500
    let currentBatch = writeBatch(db);
    let operationCount = 0;

    for (const item of items) {
      try {
        const passportKey = String(item.noPassport || '').trim().toUpperCase();
        const existing = existingPassportMap.get(passportKey);

        if (existing && !updateDuplicates) {
          skipped++;
          continue;
        }

        const normalizedItem = {
          ...item,
          date: normalizeDateString(item.date || getTodayWITAString()),
          staypermit: normalizeDateString(item.staypermit),
          noPassport: String(item.noPassport || '').trim(),
          updatedAt: now,
          updatedBy: userProfile?.displayName || currentUser?.email || 'Admin',
          updatedById: currentUser?.uid || '',
        };

        if (existing && updateDuplicates) {
          const docRef = doc(db, 'visaClients', existing.id);
          currentBatch.update(docRef, normalizedItem);
          updated++;
        } else {
          const docRef = doc(collection(db, 'visaClients'));
          currentBatch.set(docRef, {
            ...normalizedItem,
            createdAt: now,
            createdBy: userProfile?.displayName || currentUser?.email || 'Admin',
            createdById: currentUser?.uid || '',
          });
          imported++;
        }

        operationCount++;

        if (operationCount >= batchSize) {
          await currentBatch.commit();
          currentBatch = writeBatch(db);
          operationCount = 0;
        }
      } catch (err) {
        console.error('Row import error:', err);
        failed++;
      }
    }

    if (operationCount > 0) {
      await currentBatch.commit();
    }

    await recordAudit(
      'IMPORT_EXCEL',
      `Imported: ${imported}, Updated: ${updated}`,
      `Skipped: ${skipped}, Failed: ${failed}`
    );

    return { imported, updated, skipped, failed };
  };

  // Compute Reminder information per client according to Bali Ease rules:
  // 1. Reminder starts appearing when today enters the service reminder threshold
  // 2. Continues to appear while today < expiry
  // 3. On expiry date (H-0), disappears (remainingDays <= 0)
  // 4. Past expiry, disappears
  const getReminderInfo = (client: VisaClient): StayPermitReminderItem | null => {
    if (!client.staypermit || !client.service) return null;

    const remainingDays = calculateRemainingDays(client.staypermit);
    if (remainingDays === null || remainingDays <= 0) {
      return null; // Expired or 0 days (H-0), rule 3 & 4
    }

    // Match reminder threshold for client's service
    const setting = reminderSettings.find(
      (r) => r.service.trim().toLowerCase() === client.service.trim().toLowerCase()
    );

    // If setting exists and is inactive, ignore
    if (setting && !setting.isActive) {
      return null;
    }

    // Default to 60 days if service is not in settings
    const thresholdDays = setting ? setting.daysBeforeExpiry : 60;

    // Must be within threshold (H-threshold to H-1)
    if (remainingDays > thresholdDays) {
      return null; // Not yet entered reminder window
    }

    let urgency: 'urgent' | 'warning' | 'normal' = 'normal';
    if (remainingDays <= 7) {
      urgency = 'urgent';
    } else if (remainingDays <= 30) {
      urgency = 'warning';
    }

    return {
      client,
      remainingDays,
      urgency,
      thresholdDays,
    };
  };

  // Active stay permit reminders sorted by closest expiry
  const activeReminders = useMemo(() => {
    const list: StayPermitReminderItem[] = [];
    clients.forEach((c) => {
      const info = getReminderInfo(c);
      if (info) {
        list.push(info);
      }
    });

    return list.sort((a, b) => a.remainingDays - b.remainingDays);
  }, [clients, reminderSettings]);

  return (
    <DataContext.Provider
      value={{
        clients,
        masterData,
        reminderSettings,
        followUps,
        auditLogs,
        loading,
        addClient,
        updateClient,
        deleteClient,
        getMasterOptions,
        addMasterItem,
        updateMasterItem,
        deleteMasterItem,
        addReminderSetting,
        updateReminderSetting,
        addFollowUp,
        batchImportClients,
        getReminderInfo,
        activeReminders,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
