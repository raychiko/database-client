import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, seedInitialMasterDataAndRemindersIfEmpty } from '../firebase';
import { UserProfile, UserRole, AuditActivityType } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isCS: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setUserRole: (newRole: UserRole) => Promise<void>;
  recordAudit: (activityType: AuditActivityType, targetRecord: string, details: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const DEFAULT_PROFILE: UserProfile = {
    uid: 'admin_baliease_default',
    email: 'raychiko83@gmail.com',
    displayName: 'Admin Bali Ease',
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const [currentUser, setCurrentUser] = useState<User | null>(DEFAULT_PROFILE as unknown as User);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(false);

  // Sync auth state & seed initial defaults immediately
  useEffect(() => {
    // Seed initial master data and reminder settings on boot
    seedInitialMasterDataAndRemindersIfEmpty('raychiko83@gmail.com', 'admin_baliease_default');

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const isOwnerAdmin = user.email === 'raychiko83@gmail.com';
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);

          let profile: UserProfile;

          if (!userSnap.exists()) {
            profile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              role: isOwnerAdmin ? 'ADMIN' : 'CS',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, profile);

            if (isOwnerAdmin) {
              await setDoc(doc(db, 'admins', user.uid), {
                email: user.email,
                createdAt: new Date().toISOString(),
              });
            }
          } else {
            const data = userSnap.data() as UserProfile;
            profile = {
              ...data,
              role: isOwnerAdmin ? 'ADMIN' : (data.role || 'CS'),
            };
          }

          setUserProfile(profile);
          await seedInitialMasterDataAndRemindersIfEmpty(user.email || undefined, user.uid);
        } catch (error) {
          console.error('Error fetching or creating user profile:', error);
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'User',
            role: user.email === 'raychiko83@gmail.com' ? 'ADMIN' : 'CS',
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

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
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const setUserRole = async (newRole: UserRole) => {
    if (!userProfile) return;
    try {
      setUserProfile({
        ...userProfile,
        role: newRole,
      });

      if (currentUser?.uid) {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, { role: newRole, updatedAt: new Date().toISOString() }, { merge: true });

        if (newRole === 'ADMIN') {
          await setDoc(doc(db, 'admins', currentUser.uid), {
            email: currentUser.email || 'raychiko83@gmail.com',
            createdAt: new Date().toISOString(),
          }, { merge: true });
        }
      }

      await recordAudit('USER_ROLE_CHANGE', userProfile.displayName, `Role changed to ${newRole}`);
    } catch (error) {
      console.warn('Could not sync user role to firestore:', error);
    }
  };

  const recordAudit = async (activityType: AuditActivityType, targetRecord: string, details: string) => {
    try {
      const logData = {
        userId: currentUser?.uid || 'anonymous',
        userName: userProfile?.displayName || currentUser?.email || 'System',
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

  const isAdmin = userProfile?.role === 'ADMIN';
  const isCS = userProfile?.role === 'CS';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isCS,
        loginWithGoogle,
        logout,
        setUserRole,
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
