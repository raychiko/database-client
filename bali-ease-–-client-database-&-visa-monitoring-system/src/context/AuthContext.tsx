import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, seedInitialMasterDataAndRemindersIfEmpty } from '../firebase';
import {
  UserProfile,
  UserRole,
  CSPermissions,
  DEFAULT_CS_PERMISSIONS,
  ADMIN_PERMISSIONS,
  AuditActivityType,
} from '../types';
import { hashPassword, verifyPassword } from '../utils/crypto';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isCS: boolean;
  hasPermission: (key: keyof CSPermissions) => boolean;
  loginWithAdminEmail: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithCSUserId: (userId: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setUserRole: (newRole: UserRole) => Promise<void>;
  createCSUser: (data: {
    userId: string;
    displayName: string;
    password: string;
    permissions?: CSPermissions;
    status?: 'active' | 'inactive';
  }) => Promise<void>;
  updateCSUser: (uid: string, data: Partial<UserProfile>, newPassword?: string) => Promise<void>;
  updateCSPermissions: (uid: string, permissions: CSPermissions) => Promise<void>;
  toggleUserStatus: (uid: string, status: 'active' | 'inactive') => Promise<void>;
  deleteCSUser: (uid: string) => Promise<void>;
  recordAudit: (activityType: AuditActivityType, targetRecord: string, details: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to record audit log
  const recordAudit = async (
    activityType: AuditActivityType,
    targetRecord: string,
    details: string
  ) => {
    try {
      const logData = {
        userId: userProfile?.userId || currentUser?.email || currentUser?.uid || 'system',
        userName: userProfile?.displayName || currentUser?.email || 'User',
        activityType,
        targetRecord,
        details,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'auditLogs'), logData);
    } catch (error) {
      console.warn('Could not record audit log:', error);
    }
  };

  // Clean up any old dummy CS accounts if present, adhering strictly to:
  // "Untuk saat ini jangan membuat akun CS secara otomatis. Tidak ada akun CS default atau dummy."
  const cleanupLegacyDummyCSIfPresent = async () => {
    try {
      const dummyRef = doc(db, 'users', 'cs_001_sera');
      const dummySnap = await getDoc(dummyRef);
      if (dummySnap.exists()) {
        await deleteDoc(dummyRef);
      }
    } catch {
      // Safe no-op
    }
  };

  useEffect(() => {
    // Seed master dropdowns and initial reminder rules if empty
    seedInitialMasterDataAndRemindersIfEmpty('raychiko83@gmail.com', 'admin_primary');
    cleanupLegacyDummyCSIfPresent();

    // 1. Check Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const isOwnerAdmin = fbUser.email?.trim().toLowerCase() === 'raychiko83@gmail.com';

          // Verify admin marker in /admins/
          const adminDocRef = doc(db, 'admins', fbUser.uid);
          const adminSnap = await getDoc(adminDocRef);

          if (isOwnerAdmin && !adminSnap.exists()) {
            await setDoc(adminDocRef, {
              email: fbUser.email,
              role: 'SUPER_ADMIN',
              createdAt: new Date().toISOString(),
            }, { merge: true });
          }

          const isSuperAdmin = isOwnerAdmin || adminSnap.exists();

          const userDocRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userDocRef);

          let profile: UserProfile;

          if (!userSnap.exists()) {
            profile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: isSuperAdmin
                ? 'Super Admin (raychiko83)'
                : fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              role: isSuperAdmin ? 'ADMIN' : 'CS',
              status: 'active',
              permissions: isSuperAdmin ? ADMIN_PERMISSIONS : DEFAULT_CS_PERMISSIONS,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, profile);
          } else {
            const data = userSnap.data() as UserProfile;
            profile = {
              ...data,
              role: isSuperAdmin ? 'ADMIN' : (data.role || 'CS'),
              permissions: isSuperAdmin ? ADMIN_PERMISSIONS : (data.permissions || DEFAULT_CS_PERMISSIONS),
            };
          }

          setCurrentUser(fbUser);
          setUserProfile(profile);
          sessionStorage.removeItem('bali_ease_cs_uid');
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error fetching user profile from Firebase Auth:', error);
        }
      }

      // 2. If no Firebase Auth user, check for active CS session in sessionStorage
      const csUid = sessionStorage.getItem('bali_ease_cs_uid');
      if (csUid) {
        try {
          const csSnap = await getDoc(doc(db, 'users', csUid));
          if (csSnap.exists()) {
            const csData = csSnap.data() as UserProfile;
            if (csData.status === 'active' && csData.role === 'CS') {
              const profile: UserProfile = {
                ...csData,
                uid: csSnap.id,
                permissions: csData.permissions || DEFAULT_CS_PERMISSIONS,
              };
              setUserProfile(profile);
              setCurrentUser({ uid: profile.uid, email: '' } as unknown as User);
              setLoading(false);
              return;
            } else {
              // Account disabled or deleted
              sessionStorage.removeItem('bali_ease_cs_uid');
            }
          } else {
            sessionStorage.removeItem('bali_ease_cs_uid');
          }
        } catch (err) {
          console.warn('Error checking CS session in sessionStorage:', err);
        }
      }

      // No active session
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check granular permission
  const hasPermission = (key: keyof CSPermissions): boolean => {
    if (!userProfile) return false;
    // Super Admin has unrestricted access to everything
    if (userProfile.role === 'ADMIN' || userProfile.email === 'raychiko83@gmail.com') return true;
    if (userProfile.status !== 'active') return false;
    return userProfile.permissions?.[key] ?? false;
  };

  // Login for ADMIN using Email and Password via Firebase Authentication
  const loginWithAdminEmail = async (email: string, password: string, rememberMe = true) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error('Email Admin wajib diisi.');
    if (!password) throw new Error('Password wajib diisi.');

    // Only authorized Admin emails allowed
    const isOwner = cleanEmail === 'raychiko83@gmail.com';
    if (!isOwner) {
      const q = query(collection(db, 'admins'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error('Akses ditolak: Hanya akun Administrator yang dapat login melalui form ini.');
      }
    }

    try {
      // Set persistence according to Remember Me selection
      try {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      } catch (pErr) {
        console.warn('Auth persistence configuration:', pErr);
      }

      let userCred;
      try {
        userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      } catch (authErr: any) {
        // If owner raychiko83@gmail.com is logging in for the first time and user doesn't exist in Firebase Auth yet,
        // create their Firebase Auth credential with their chosen password:
        if (
          (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') &&
          isOwner
        ) {
          try {
            userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              throw new Error('Password yang Anda masukkan salah. Silakan periksa kembali.');
            }
            throw authErr;
          }
        } else if (
          authErr.code === 'auth/wrong-password' ||
          authErr.code === 'auth/invalid-credential'
        ) {
          throw new Error('Email atau password Admin salah. Silakan periksa kembali.');
        } else if (authErr.code === 'auth/too-many-requests') {
          throw new Error('Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat lagi.');
        } else {
          throw authErr;
        }
      }

      const fbUser = userCred.user;

      // Ensure Super Admin authorization marker in Firestore (/admins/{uid})
      const adminDocRef = doc(db, 'admins', fbUser.uid);
      await setDoc(
        adminDocRef,
        {
          email: cleanEmail,
          role: isOwner ? 'SUPER_ADMIN' : 'ADMIN',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Record profile in /users/{uid}
      const userDocRef = doc(db, 'users', fbUser.uid);
      const profile: UserProfile = {
        uid: fbUser.uid,
        email: cleanEmail,
        displayName: isOwner ? 'Super Admin (raychiko83)' : (fbUser.displayName || cleanEmail.split('@')[0]),
        role: 'ADMIN',
        status: 'active',
        permissions: ADMIN_PERMISSIONS,
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, profile, { merge: true });

      sessionStorage.removeItem('bali_ease_cs_uid');
      setCurrentUser(fbUser);
      setUserProfile(profile);

      await recordAudit('LOGIN', profile.displayName, 'Super Admin logged in via Firebase Auth');
    } catch (err: any) {
      console.error('Admin login error:', err);
      throw new Error(err.message || 'Login Admin gagal. Silakan periksa kredensial Anda.');
    }
  };

  // Login for CS using User ID (e.g. CS001, CS002) and Password
  const loginWithCSUserId = async (userIdInput: string, passwordInput: string) => {
    const cleanUserId = userIdInput.trim().toUpperCase();
    if (!cleanUserId) {
      throw new Error('User ID wajib diisi.');
    }
    if (!passwordInput) {
      throw new Error('Password wajib diisi.');
    }

    // Query users collection for matching userId
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('userId', '==', cleanUserId));
    const snap = await getDocs(q);

    if (snap.empty) {
      throw new Error(`User ID "${cleanUserId}" tidak ditemukan di database.`);
    }

    let csUser: UserProfile | null = null;
    snap.forEach((d) => {
      csUser = { uid: d.id, ...d.data() } as UserProfile;
    });

    if (!csUser) {
      throw new Error('Data pengguna tidak ditemukan.');
    }

    const activeCsUser = csUser as UserProfile;

    if (activeCsUser.status === 'inactive') {
      throw new Error('Akun Anda sedang dinonaktifkan. Silakan hubungi Administrator.');
    }

    // Verify salted password hash
    if (!activeCsUser.passwordHash || !activeCsUser.salt) {
      throw new Error('Kredensial akun belum lengkap. Hubungi Administrator.');
    }

    const isValid = await verifyPassword(passwordInput, activeCsUser.passwordHash, activeCsUser.salt);
    if (!isValid) {
      throw new Error('Password yang dimasukkan salah.');
    }

    // Record last login
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'users', activeCsUser.uid), { lastLogin: now });

    const finalProfile: UserProfile = {
      ...activeCsUser,
      lastLogin: now,
      permissions: activeCsUser.permissions || DEFAULT_CS_PERMISSIONS,
    };

    // Store only CS UID in sessionStorage (never plain text password!)
    sessionStorage.setItem('bali_ease_cs_uid', activeCsUser.uid);

    // If an old Firebase Auth was logged in, sign it out cleanly
    if (auth.currentUser) {
      try {
        await signOut(auth);
      } catch {}
    }

    setUserProfile(finalProfile);
    setCurrentUser({ uid: activeCsUser.uid, email: '' } as unknown as User);

    await recordAudit('LOGIN', `${finalProfile.displayName} (${finalProfile.userId})`, 'CS logged in via User ID');
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Google Sign-in failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (userProfile) {
        await recordAudit('LOGOUT', userProfile.displayName, 'User logged out');
      }
      sessionStorage.removeItem('bali_ease_cs_uid');
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUserProfile(null);
      setCurrentUser(null);
    }
  };

  // Switch role between ADMIN and CS (for testing when Admin)
  const setUserRole = async (newRole: UserRole) => {
    if (!userProfile) return;
    try {
      const updatedProfile: UserProfile = {
        ...userProfile,
        role: newRole,
        permissions: newRole === 'ADMIN' ? ADMIN_PERMISSIONS : (userProfile.permissions || DEFAULT_CS_PERMISSIONS),
      };
      setUserProfile(updatedProfile);

      if (currentUser?.uid) {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, { role: newRole, updatedAt: new Date().toISOString() }, { merge: true });
      }

      await recordAudit('USER_ROLE_CHANGE', userProfile.displayName, `Role switched to ${newRole}`);
    } catch (error) {
      console.warn('Could not sync user role to firestore:', error);
    }
  };

  // Create CS User (Admin only)
  const createCSUser = async (data: {
    userId: string;
    displayName: string;
    password: string;
    permissions?: CSPermissions;
    status?: 'active' | 'inactive';
  }) => {
    try {
      const cleanUserId = data.userId.trim().toUpperCase();

      // Check for duplicate userId
      const q = query(collection(db, 'users'), where('userId', '==', cleanUserId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error(`User ID "${cleanUserId}" sudah digunakan. Gunakan User ID lain.`);
      }

      const { hash, salt } = await hashPassword(data.password);
      const newUid = `cs_${cleanUserId.toLowerCase()}_${Date.now()}`;
      const now = new Date().toISOString();

      const profile: UserProfile = {
        uid: newUid,
        userId: cleanUserId,
        displayName: data.displayName.trim(),
        role: 'CS',
        status: data.status || 'active',
        passwordHash: hash,
        salt,
        permissions: data.permissions || DEFAULT_CS_PERMISSIONS,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'users', newUid), profile);
      await recordAudit('CREATE_CS_USER', `${profile.displayName} (${cleanUserId})`, `Created new CS account`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'users');
    }
  };

  // Update CS User (Admin only)
  const updateCSUser = async (uid: string, data: Partial<UserProfile>, newPassword?: string) => {
    try {
      const updates: Record<string, any> = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      if (newPassword) {
        const { hash, salt } = await hashPassword(newPassword);
        updates.passwordHash = hash;
        updates.salt = salt;
      }
      await updateDoc(doc(db, 'users', uid), updates);
      await recordAudit('UPDATE_CS_USER', uid, 'Updated CS user information/password');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  // Update CS Permissions (Admin only)
  const updateCSPermissions = async (uid: string, permissions: CSPermissions) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        permissions,
        updatedAt: new Date().toISOString(),
      });
      await recordAudit('PERMISSION_CHANGE', uid, 'Updated granular permissions');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  // Toggle user status (active/inactive)
  const toggleUserStatus = async (uid: string, status: 'active' | 'inactive') => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        status,
        updatedAt: new Date().toISOString(),
      });
      await recordAudit('USER_ROLE_CHANGE', uid, `User status updated to ${status}`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  // Delete CS User (Admin only)
  const deleteCSUser = async (uid: string) => {
    try {
      const uSnap = await getDoc(doc(db, 'users', uid));
      const uData = uSnap.data() as UserProfile;
      await deleteDoc(doc(db, 'users', uid));
      await recordAudit('USER_ROLE_CHANGE', uData?.displayName || uid, 'Deleted CS user account');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
  };

  const isAdmin = userProfile?.role === 'ADMIN' || userProfile?.email === 'raychiko83@gmail.com';
  const isCS = userProfile?.role === 'CS';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isCS,
        hasPermission,
        loginWithAdminEmail,
        loginWithCSUserId,
        loginWithGoogle,
        logout,
        setUserRole,
        createCSUser,
        updateCSUser,
        updateCSPermissions,
        toggleUserStatus,
        deleteCSUser,
        recordAudit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
