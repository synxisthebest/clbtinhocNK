import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, terminate } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || undefined);

async function test() {
  console.log('Fetching applications from Firestore...');
  const snapshot = await getDocs(collection(db, 'applications'));
  console.log('Total applications found:', snapshot.size);
  snapshot.forEach((doc, i) => {
    const data = doc.data();
    console.log(`[${i + 1}] ID: ${doc.id} | Name: ${data.fullName} | Class: ${data.studentClass} | Email: ${data.email} | Dept: ${data.department}`);
  });
  await terminate(db);
}

test().then(() => process.exit(0)).catch(err => { console.error('Error:', err); process.exit(1); });
