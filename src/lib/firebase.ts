/**
 * Firebase SDK Initialization and Configuration
 * This file sets up the connection to Firebase services including Authentication,
 * Firestore (database), and Storage (file uploads).
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, deleteDoc, updateDoc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app , {db} from '../../firebase-applet-config';


// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firebase Storage for file (receipt) uploads
export const storage = getStorage(app);

// Configure Google Auth Provider for sign-in functionality
export const googleProvider = new GoogleAuthProvider();

/**
 * Operation types for Firestore error tracking.
 * Used to identify which type of database action failed.
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * Interface for detailed Firestore error information.
 * Captures the error message, operation type, path, and current user's auth state
 * to help diagnose security rule or permission issues.
 */
export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

/**
 * Standard error handler for Firestore operations.
 * It logs a detailed JSON object containing the error context and the user's auth state.
 * This is critical for debugging "Missing or insufficient permissions" errors.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Connectivity test for Firestore.
 * Attempts to fetch a dummy document from the server to verify the configuration
 * and network connectivity. Logs an error if the client is detected as offline.
 */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };
