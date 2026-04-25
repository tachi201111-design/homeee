import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const dataService = {
  // Users
  async createUserProfile(user: { uid: string; email: string; displayName?: string; photoURL?: string }) {
    if (!db) return;
    const path = `users/${user.uid}`;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          ...user,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Projects
  async getProjects() {
    if (!auth || !auth.currentUser || !db) return [];
    const path = 'projects';
    try {
      const q = query(collection(db, path), where('ownerId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async createProject(project: { title: string; description?: string; status: string; img?: string; data?: Record<string, unknown> }) {
    if (!auth || !auth.currentUser || !db) return;
    const path = 'projects';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...project,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async updateProject(id: string, updates: Partial<{ title: string; description: string; status: string; img: string; data: Record<string, unknown> }>) {
    if (!db) return;
    const path = `projects/${id}`;
    try {
      const ref = doc(db, 'projects', id);
      await updateDoc(ref, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteProject(id: string) {
    if (!db) return;
    const path = `projects/${id}`;
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
