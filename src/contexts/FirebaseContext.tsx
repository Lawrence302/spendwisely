/**
 * Firebase Context Provider
 * This file manages the global state of the application, including user authentication,
 * real-time data synchronization with Firestore, and utility functions for CRUD operations.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  auth, 
  db, 
  storage, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  deleteDoc, 
  updateDoc,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Transaction, Budget, UserProfile } from '../types';

/**
 * Defines the shape of the Firebase context.
 * Includes state variables and all functions exposed to the rest of the app.
 */
interface FirebaseContextType {
  user: User | null;
  profile: UserProfile | null;
  transactions: Transaction[];
  budgets: Budget[];
  loading: boolean;
  isAuthReady: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'uid'>) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id' | 'uid'>) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadReceipt: (file: File) => Promise<string>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

/**
 * The main provider component that wraps the application.
 * It initializes the auth listener and sets up real-time data streams.
 */
export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  /**
   * Auth Listener Effect
   * Monitors the user's authentication state. When a user logs in, it fetches
   * or creates their profile in Firestore.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create profile in the 'users' collection
        const profileRef = doc(db, 'users', currentUser.uid);
        try {
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            setProfile(profileSnap.data() as UserProfile);
          } else {
            // Create a default profile for new users
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              currency: 'USD',
              theme: 'light',
            };
            await setDoc(profileRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } else {
        // Clear state on logout
        setProfile(null);
        setTransactions([]);
        setBudgets([]);
      }
      setIsAuthReady(true);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Real-time Transactions Effect
   * Sets up a Firestore snapshot listener to keep the 'transactions' state
   * in sync with the database for the current user.
   */
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
      setTransactions(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  /**
   * Real-time Budgets Effect
   * Sets up a Firestore snapshot listener to keep the 'budgets' state
   * in sync with the database for the current user.
   */
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const q = query(
      collection(db, 'budgets'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Budget));
      setBudgets(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'budgets');
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  /**
   * Theme Management Effect
   * Applies the 'dark' class to the document root based on the user's profile preference.
   */
  useEffect(() => {
    if (profile?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile?.theme]);

  /**
   * Triggers the Google Sign-In popup.
   */
  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  /**
   * Logs the current user out.
   */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  /**
   * Adds a new transaction to Firestore.
   * Generates a unique ID and attaches the current user's UID.
   */
  const addTransaction = async (data: Omit<Transaction, 'id' | 'uid'>) => {
    if (!user) return;
    const id = crypto.randomUUID();
    const path = 'transactions';
    try {
      await setDoc(doc(db, path, id), { ...data, id, uid: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  /**
   * Updates an existing transaction in Firestore.
   */
  const updateTransaction = async (transaction: Transaction) => {
    if (!user) return;
    const path = 'transactions';
    try {
      await updateDoc(doc(db, path, transaction.id), { ...transaction });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  /**
   * Deletes a transaction from Firestore.
   */
  const deleteTransaction = async (id: string) => {
    if (!user) return;
    const path = 'transactions';
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  /**
   * Adds a new budget limit for a category to Firestore.
   */
  const addBudget = async (data: Omit<Budget, 'id' | 'uid'>) => {
    if (!user) return;
    const id = crypto.randomUUID();
    const path = 'budgets';
    try {
      await setDoc(doc(db, path, id), { ...data, id, uid: user.uid });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  /**
   * Updates an existing budget in Firestore.
   */
  const updateBudget = async (budget: Budget) => {
    if (!user) return;
    const path = 'budgets';
    try {
      await updateDoc(doc(db, path, budget.id), { ...budget });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  /**
   * Deletes a budget from Firestore.
   */
  const deleteBudget = async (id: string) => {
    if (!user) return;
    const path = 'budgets';
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  /**
   * Recurring Transaction Logic
   * Checks if any recurring transactions are due to be generated.
   * If due, it spawns a new transaction and updates the 'lastGenerated' timestamp
   * on the original recurring record.
   */
  const checkRecurringTransactions = async (userTransactions: Transaction[]) => {
    if (!user) return;
    const now = new Date();
    const recurring = userTransactions.filter(t => t.isRecurring && t.recurringInterval);

    for (const t of recurring) {
      const lastGen = t.lastGenerated ? new Date(t.lastGenerated) : new Date(t.date);
      let nextGen = new Date(lastGen);

      switch (t.recurringInterval) {
        case 'daily': nextGen.setDate(nextGen.getDate() + 1); break;
        case 'weekly': nextGen.setDate(nextGen.getDate() + 7); break;
        case 'monthly': nextGen.setMonth(nextGen.getMonth() + 1); break;
        case 'yearly': nextGen.setFullYear(nextGen.getFullYear() + 1); break;
      }

      if (nextGen <= now) {
        // Create new transaction record
        const newId = crypto.randomUUID();
        const newTransaction: Transaction = {
          ...t,
          id: newId,
          date: nextGen.toISOString(),
          lastGenerated: undefined,
          isRecurring: false // The spawned instance is a one-time record
        };
        
        try {
          await setDoc(doc(db, 'transactions', newId), newTransaction);
          
          // Update original recurring transaction's lastGenerated to prevent double-spawning
          await updateDoc(doc(db, 'transactions', t.id), {
            lastGenerated: nextGen.toISOString()
          });
        } catch (error) {
          console.error('Error spawning recurring transaction:', error);
        }
      }
    }
  };

  /**
   * Effect to trigger recurring transaction checks whenever transactions are loaded.
   */
  useEffect(() => {
    if (user && transactions.length > 0) {
      checkRecurringTransactions(transactions);
    }
  }, [user, transactions.length]);

  /**
   * Updates the user's profile preferences (currency, theme, etc.) in Firestore.
   */
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const path = 'users';
    try {
      await updateDoc(doc(db, path, user.uid), updates);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  /**
   * Uploads a receipt image to Firebase Storage and returns the public download URL.
   */
  const uploadReceipt = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const storageRef = ref(storage, `receipts/${user.uid}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  return (
    <FirebaseContext.Provider value={{ 
      user, 
      profile, 
      transactions, 
      budgets, 
      loading, 
      isAuthReady,
      signIn, 
      logout,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addBudget,
      updateBudget,
      deleteBudget,
      updateProfile,
      uploadReceipt
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Custom hook to access the Firebase context.
 */
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
