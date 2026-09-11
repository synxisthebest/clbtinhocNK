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
  const list: any[] = [];
  snapshot.forEach(doc => {
    list.push({ id: doc.id, ...doc.data() });
  });
  list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Save full JSON
  fs.writeFileSync('tat_ca_ung_vien.json', JSON.stringify(list, null, 2), 'utf8');
  console.log('Saved all applications to tat_ca_ung_vien.json');

  const sonList = list.filter(a => (a.email || '').toLowerCase().includes('thienson') || (a.fullName || '').includes('Sơn') || (a.fullName || '').includes('SƠn'));
  console.log('=== CÁC HỒ SƠ LIÊN QUAN ĐẾN THIÊN SƠN / thiensonhp07@gmail.com (' + sonList.length + ' hồ sơ) ===');
  sonList.forEach((s, i) => {
    console.log(`\n--- [Hồ sơ Sơn #${i+1}] ID: ${s.id} ---`);
    console.log('Họ tên:', s.fullName);
    console.log('Lớp:', s.studentClass, '| Trường:', s.schoolName);
    console.log('Email:', s.email, '| SĐT:', s.phone);
    console.log('Facebook:', s.facebook);
    console.log('Ban:', s.departmentName || s.department, '| Vị trí:', s.subRole);
    console.log('Kỹ năng:', Array.isArray(s.skills) ? s.skills.join(', ') : s.skills);
    console.log('Flex Zone:', s.flexZone);
    console.log('Lý do tham gia:', s.motivation);
    console.log('Điểm AI:', s.scoreByAI, '| Vibe:', s.aiVibe);
    console.log('AI Nhận xét:', s.aiReview);
    console.log('Thời gian nộp:', s.createdAt);
    const answers = Object.keys(s).filter(k => k.startsWith('casting') && s[k]);
    if (answers.length > 0) {
      console.log('CÂU TRẢ LỜI CASTING:');
      answers.forEach(k => console.log(`  - [${k}]: ${s[k]}`));
    } else {
      console.log('CÂU TRẢ LỜI CASTING: (Không có hoặc để trống)');
    }
  });

  console.log('\n=== TẤT CẢ 44 HỒ SƠ ỨNG VIÊN (MỚI NHẤT TRƯỚC) ===');
  list.forEach((a, i) => {
    console.log(`${i+1}. ${a.fullName} | ${a.studentClass} (${a.schoolName || 'N/A'}) | ${a.email} | ${a.phone} | Ban: ${a.departmentName || a.department} | ${a.createdAt}`);
  });

  await terminate(db);
}

test().then(() => process.exit(0)).catch(err => { console.error('Error:', err); process.exit(1); });

