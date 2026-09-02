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

async function exportViet() {
  const snapshot = await getDocs(collection(db, 'applications'));
  const viets: any[] = [];
  snapshot.forEach(d => {
    const data = { id: d.id, ...d.data() };
    if (data.fullName?.includes('Việt') || data.fullName?.includes('Viet')) {
      viets.push(data);
    }
  });

  fs.writeFileSync('scripts/viet-data.json', JSON.stringify(viets, null, 2), 'utf8');
  console.log(`Đã xuất ${viets.length} hồ sơ của Việt Quốc Phạm ra file scripts/viet-data.json`);
  await terminate(db);
}

exportViet().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
