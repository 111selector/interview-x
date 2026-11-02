import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  deleteDoc,
  getDocFromServer,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { User, Plan, InterviewData, ChatMessage, PausedInterview, InterviewRecord } from '../types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test connection on boot per Firebase guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline status:', error.message);
    }
  }
}
testConnection();

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Map Firebase User to App User
export function mapFirebaseUserToAppUser(fbUser: FirebaseUser, existingData?: Partial<User>): User {
  const providerId = fbUser.providerData[0]?.providerId || 'google.com';
  let providerName = 'Google';
  if (providerId.includes('microsoft')) providerName = 'Microsoft';
  else if (providerId.includes('instagram')) providerName = 'Instagram';
  else if (providerId.includes('tiktok')) providerName = 'TikTok';

  return {
    id: fbUser.uid,
    name: fbUser.displayName || existingData?.name || 'Career Professional',
    email: fbUser.email || existingData?.email || `${fbUser.uid.substring(0, 8)}@interviewx.app`,
    profilePicture: fbUser.photoURL || existingData?.profilePicture,
    plan: existingData?.plan || Plan.PRO,
    progress: existingData?.progress || 'Beginner',
    interviewsCompleted: existingData?.interviewsCompleted || 0,
    downloadsUsed: existingData?.downloadsUsed || 0,
    provider: existingData?.provider || providerName,
  };
}

// User Profile Operations
export async function getOrCreateUserProfile(fbUser: FirebaseUser): Promise<User> {
  const path = `users/${fbUser.uid}`;
  try {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const updatedUser: User = {
        id: fbUser.uid,
        name: data.name || fbUser.displayName || 'Career Professional',
        email: data.email || fbUser.email || `${fbUser.uid.substring(0, 8)}@interviewx.app`,
        profilePicture: data.profilePicture || fbUser.photoURL,
        plan: data.plan || Plan.PRO,
        progress: data.progress || 'Beginner',
        interviewsCompleted: data.interviewsCompleted || 0,
        downloadsUsed: data.downloadsUsed || 0,
        provider: data.provider || 'Google',
      };
      return updatedUser;
    } else {
      const newUser = mapFirebaseUserToAppUser(fbUser);
      await setDoc(userDocRef, {
        name: newUser.name,
        email: newUser.email,
        profilePicture: newUser.profilePicture || '',
        plan: newUser.plan,
        progress: newUser.progress,
        interviewsCompleted: newUser.interviewsCompleted,
        downloadsUsed: newUser.downloadsUsed,
        provider: newUser.provider,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return newUser;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return mapFirebaseUserToAppUser(fbUser);
  }
}

export async function updateUserProfile(userId: string, data: Partial<User>): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// User Interview History - Strictly isolated to userId
export async function saveCompletedInterview(
  userId: string,
  interviewData: InterviewData,
  feedback: string,
  messages: ChatMessage[],
  language: string
): Promise<string> {
  const interviewId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${userId}/interviews/${interviewId}`;
  try {
    const interviewRef = doc(db, 'users', userId, 'interviews', interviewId);
    await setDoc(interviewRef, {
      id: interviewId,
      userId,
      jobRole: interviewData.jobRole,
      companyName: interviewData.companyName,
      companyUrl: interviewData.companyUrl || '',
      language,
      feedback,
      messages,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    return interviewId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    return interviewId;
  }
}

export async function getUserInterviewHistory(userId: string): Promise<InterviewRecord[]> {
  const path = `users/${userId}/interviews`;
  try {
    const interviewsRef = collection(db, 'users', userId, 'interviews');
    const q = query(interviewsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as InterviewRecord);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// User Paused Session - Strictly isolated to userId
export async function saveUserPausedSession(userId: string, session: PausedInterview): Promise<void> {
  const path = `users/${userId}/pausedSession/current`;
  try {
    const pausedRef = doc(db, 'users', userId, 'pausedSession', 'current');
    await setDoc(pausedRef, {
      userId,
      interviewData: session.interviewData,
      messages: session.messages,
      language: session.language,
      savedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getUserPausedSession(userId: string): Promise<PausedInterview | null> {
  const path = `users/${userId}/pausedSession/current`;
  try {
    const pausedRef = doc(db, 'users', userId, 'pausedSession', 'current');
    const snapshot = await getDoc(pausedRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        interviewData: data.interviewData,
        messages: data.messages,
        language: data.language,
      };
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

export async function clearUserPausedSession(userId: string): Promise<void> {
  const path = `users/${userId}/pausedSession/current`;
  try {
    const pausedRef = doc(db, 'users', userId, 'pausedSession', 'current');
    await deleteDoc(pausedRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Real Authentication Providers
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signInWithMicrosoft(): Promise<FirebaseUser> {
  const provider = new OAuthProvider('microsoft.com');
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signInWithInstagram(): Promise<FirebaseUser> {
  try {
    // Attempt Firebase Custom/OIDC provider for Instagram
    const provider = new OAuthProvider('oidc.instagram');
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    // If not configured in Firebase console yet, throw standard code for UI handler
    throw error;
  }
}

export async function signInWithTikTok(): Promise<FirebaseUser> {
  try {
    // Attempt Firebase Custom/OIDC provider for TikTok
    const provider = new OAuthProvider('oidc.tiktok');
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    // If not configured in Firebase console yet, throw standard code for UI handler
    throw error;
  }
}

export async function logOut(): Promise<void> {
  await firebaseSignOut(auth);
}
