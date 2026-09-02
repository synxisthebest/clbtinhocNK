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

async function run() {
  console.log('🔍 Đang lấy dữ liệu hồ sơ của Việt Quốc Phạm từ Firestore...');
  const snapshot = await getDocs(collection(db, 'applications'));
  const viets: any[] = [];
  snapshot.forEach(d => {
    const data = { id: d.id, ...d.data() };
    if (data.fullName?.includes('Việt') || data.fullName?.includes('Viet')) {
      viets.push(data);
    }
  });

  console.log(`📊 Tìm thấy ${viets.length} hồ sơ của Việt Quốc Phạm.\n`);

  const backendUrl = 'https://clbtinhocnk.onrender.com';

  for (let i = 0; i < viets.length; i++) {
    const data = viets[i];
    console.log(`[${i + 1}/${viets.length}] Gửi hồ sơ qua Render Backend (${backendUrl}/api/send-application-email)...`);

    try {
      const res = await fetch(`${backendUrl}/api/send-application-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const json = await res.json().catch(() => ({}));
      console.log(`👉 Phản hồi từ Render: Status ${res.status}:`, json);
    } catch (e: any) {
      console.error(`❌ Lỗi kết nối tới Render:`, e.message);
    }
  }

  await terminate(db);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
