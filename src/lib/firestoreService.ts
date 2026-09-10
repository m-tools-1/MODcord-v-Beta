import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read firebase-applet-config.json safely
function getFirebaseConfig() {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading firebase-applet-config.json:', err);
  }
  return null;
}

const config = getFirebaseConfig();

let dbInstance: any = null;

if (config && config.apiKey && config.projectId) {
  try {
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    dbInstance = config.firestoreDatabaseId
      ? getFirestore(app, config.firestoreDatabaseId)
      : getFirestore(app);
    console.log('[Firestore] Connected to database:', config.firestoreDatabaseId || '(default)');
  } catch (err) {
    console.error('[Firestore] Initialization error:', err);
  }
}

export const firestore = dbInstance;

/**
 * Load all accounts from Firestore
 */
export async function loadAccountsFromFirestore(): Promise<any[] | null> {
  if (!firestore) return null;
  try {
    const snapshot = await getDocs(collection(firestore, 'accounts'));
    const accounts: any[] = [];
    snapshot.forEach((docSnap) => {
      accounts.push({ id: docSnap.id, ...docSnap.data() });
    });
    return accounts;
  } catch (err) {
    console.warn('[Firestore] Could not load accounts from Firestore:', err);
    return null;
  }
}

/**
 * Save or update single account in Firestore
 */
export async function saveAccountToFirestore(account: any): Promise<void> {
  if (!firestore || !account?.id) return;
  try {
    await setDoc(doc(firestore, 'accounts', account.id), account, { merge: true });
  } catch (err) {
    console.warn(`[Firestore] Failed to save account ${account.id}:`, err);
  }
}

/**
 * Load initial state (servers, messages, users) from Firestore
 */
export async function loadStateFromFirestore(): Promise<{
  servers?: any[];
  messages?: any[];
  users?: any[];
} | null> {
  if (!firestore) return null;
  try {
    const [serversSnap, messagesSnap, usersSnap] = await Promise.all([
      getDocs(collection(firestore, 'servers')),
      getDocs(collection(firestore, 'messages')),
      getDocs(collection(firestore, 'users')),
    ]);

    const servers: any[] = [];
    serversSnap.forEach((docSnap) => servers.push({ id: docSnap.id, ...docSnap.data() }));

    const messages: any[] = [];
    messagesSnap.forEach((docSnap) => messages.push({ id: docSnap.id, ...docSnap.data() }));

    const users: any[] = [];
    usersSnap.forEach((docSnap) => users.push({ id: docSnap.id, ...docSnap.data() }));

    return { servers, messages, users };
  } catch (err) {
    console.warn('[Firestore] Could not load state from Firestore:', err);
    return null;
  }
}

/**
 * Save or update a message in Firestore
 */
export async function saveMessageToFirestore(message: any): Promise<void> {
  if (!firestore || !message?.id) return;
  try {
    await setDoc(doc(firestore, 'messages', message.id), message, { merge: true });
  } catch (err) {
    console.warn(`[Firestore] Failed to save message ${message.id}:`, err);
  }
}

/**
 * Delete a message from Firestore
 */
export async function deleteMessageFromFirestore(messageId: string): Promise<void> {
  if (!firestore || !messageId) return;
  try {
    await deleteDoc(doc(firestore, 'messages', messageId));
  } catch (err) {
    console.warn(`[Firestore] Failed to delete message ${messageId}:`, err);
  }
}

/**
 * Save or update a user profile in Firestore
 */
export async function saveUserToFirestore(user: any): Promise<void> {
  if (!firestore || !user?.id) return;
  try {
    await setDoc(doc(firestore, 'users', user.id), user, { merge: true });
  } catch (err) {
    console.warn(`[Firestore] Failed to save user ${user.id}:`, err);
  }
}

/**
 * Save or update a server in Firestore
 */
export async function saveServerToFirestore(server: any): Promise<void> {
  if (!firestore || !server?.id) return;
  try {
    await setDoc(doc(firestore, 'servers', server.id), server, { merge: true });
  } catch (err) {
    console.warn(`[Firestore] Failed to save server ${server.id}:`, err);
  }
}
