import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('c:\\Users\\Asus\\Documents\\SOFTWARE ENGINEERING\\PantryPal\\firebaseServiceAccount.json', 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  console.log('Fetching food documents...');
  const snapshot = await db.collection('food').limit(5).get();
  if (snapshot.empty) {
    console.log('No food documents found.');
    return;
  }
  snapshot.forEach(doc => {
    console.log('--- Document ID:', doc.id);
    console.log(JSON.stringify(doc.data(), null, 2));
  });
}

run().catch(console.error);
