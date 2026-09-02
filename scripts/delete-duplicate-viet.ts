import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, deleteDoc, getDocs, collection, terminate } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || undefined);

// 2 duplicate doc IDs with placeholder "." answers:
// 'E1w9DmorpSkXjDcStxfA'
// 'jGcBzu06duVH6hGVb4Dt'
// We KEEP: 'mbeh9zySs3JEEHZ7kvo5' (the original detailed application with full casting answers)

async function run() {
  console.log('Checking applications for Viet...');
  const snapshot = await getDocs(collection(db, 'applications'));
  const viets: any[] = [];
  snapshot.forEach(d => {
    const data = { id: d.id, ...d.data() };
    if (data.fullName?.includes('Việt') || data.fullName?.includes('Viet')) {
      viets.push(data);
    }
  });

  console.log(`Found ${viets.length} docs for Viet:`);
  viets.forEach(v => console.log(`- ID: ${v.id} | Date: ${v.createdAt} | DevQ1: ${v.castingDevQ1?.slice(0, 30)}`));

  const toDelete = ['E1w9DmorpSkXjDcStxfA', 'jGcBzu06duVH6hGVb4Dt'];
  for (const docId of toDelete) {
    try {
      console.log(`Attempting to delete doc: ${docId}...`);
      await deleteDoc(doc(db, 'applications', docId));
      console.log(`✅ Deleted doc ${docId}`);
    } catch (e: any) {
      console.error(`❌ Failed to delete ${docId}:`, e.message);
    }
  }

  await terminate(db);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
