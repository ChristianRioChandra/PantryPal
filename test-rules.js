import { initializeApp as initializeAdminApp, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { initializeApp as initializeClientApp } from 'firebase/app';
import { getAuth as getClientAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore as getClientFirestore, doc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccount = JSON.parse(
  readFileSync('./firebaseServiceAccount.json', 'utf8')
);

// 1. Initialize Admin SDK
const adminApp = initializeAdminApp({
  credential: cert(serviceAccount)
}, 'admin-app');

const adminAuth = getAdminAuth(adminApp);

async function run() {
  const uid = 'lXQGX6v6h7Zg1IVxC7KWZPLjkPc2'; // Susu UltraMilk owner from query-db.js
  console.log('Minting custom token for UID:', uid);
  const customToken = await adminAuth.createCustomToken(uid);

  // 2. Initialize Client SDK
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };

  const clientApp = initializeClientApp(firebaseConfig);
  const clientAuth = getClientAuth(clientApp);
  const clientDb = getClientFirestore(clientApp);

  console.log('Signing in with custom token on client...');
  await signInWithCustomToken(clientAuth, customToken);
  console.log('Authenticated as client user:', clientAuth.currentUser.uid);

  const docId = '05AiFbJBr0CuAixOUSV3'; // A legacy document missing optional fields
  const docRef = doc(clientDb, 'food', docId);

  console.log('Attempting partial update on legacy document...');
  try {
    await updateDoc(docRef, { quantity_level: 'medium' });
    console.log('SUCCESS! Document updated.');
  } catch (error) {
    console.error('FAILED with error code:', error.code);
    console.error(error.message);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('Global error:', err);
  process.exit(1);
});
