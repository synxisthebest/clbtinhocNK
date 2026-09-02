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

const TARGET_EMAIL = 'haoaccvalorant@gmail.com';

async function run() {
  console.log(`🔍 Đang lấy dữ liệu hồ sơ của bạn Việt Quốc Phạm từ Firestore...`);
  const snapshot = await getDocs(collection(db, 'applications'));
  let vietData: any = null;
  snapshot.forEach(d => {
    const data = { id: d.id, ...d.data() };
    if (data.fullName?.includes('Việt') || data.fullName?.includes('Viet')) {
      vietData = data;
    }
  });

  if (!vietData) {
    console.log('Không tìm thấy hồ sơ của bạn Việt Quốc Phạm.');
    await terminate(db);
    return;
  }

  console.log(`📄 Tìm thấy hồ sơ: ${vietData.fullName} (${vietData.studentClass}) - ${vietData.departmentName || 'Ban Chuyên Môn'}`);
  console.log(`🚀 Đang gửi thư tới: ${TARGET_EMAIL}...`);

  const payload: Record<string, string> = {
    _subject: `🚀 [HỒ SƠ ỨNG VIÊN TEST] ${vietData.fullName} (${vietData.studentClass}) - Ban ${vietData.departmentName || 'Chuyên Môn'}`,
    _captcha: 'false',
    _template: 'table',
    'Họ và Tên': vietData.fullName || 'Việt Quốc Phạm',
    'Lớp / MSSV': vietData.studentClass || '11A1',
    'Email Ứng Viên': vietData.email || 'sadlygamer4756@gmail.com',
    'Số Điện Thoại / Zalo': vietData.phone || '0901234567',
    'Ban Ứng Tuyển': vietData.departmentName || 'Ban Chuyên Môn (Tech Core)',
    'Vị Trí Chuyên Môn': vietData.subRole || 'Web / App Developer',
    'Kỹ Năng': Array.isArray(vietData.skills) ? vietData.skills.join(', ') : (vietData.skills || 'React, TypeScript, Tailwind'),
    'Flex Zone / Link Sản Phẩm': vietData.flexZone || 'https://github.com/phamquocviet',
    'Lý Do Gia Nhập': vietData.motivation || 'Em muốn cống hiến cho CLB và học hỏi thêm nhiều kiến thức mới.',
    'Điểm AI Chấm': `${vietData.scoreByAI || '9.6'} / 10.0`,
    'Cyber Vibe': vietData.aiVibe || '100% Cyber Architect',
    'Nhận Xét AI': vietData.aiReview || 'Hồ sơ rất xuất sắc!',
    '🛡️ Anti-Cheat': '✅ 100% Trung thực (0 lần out tab)'
  };

  if (vietData.castingDevQ1) payload['Cau 1 (Dev) Van de Web/App giai quyet'] = vietData.castingDevQ1;
  if (vietData.castingDevQ2) payload['Cau 2 (Dev) Feature thich nhung user khong can'] = vietData.castingDevQ2;
  if (vietData.castingDevQ3) payload['Cau 3 (Dev) Nut bam co the pha ca san pham'] = vietData.castingDevQ3;
  if (vietData.castingDevQ4) payload['Cau 4 (Dev) Nguoi dung dang noi doi ban?'] = vietData.castingDevQ4;
  if (vietData.castingDevQ5) payload['Cau 5 (Dev) Neu chi duoc giu lai mot thu'] = vietData.castingDevQ5;

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${TARGET_EMAIL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json().catch(() => ({}));
    console.log(`👉 Kết quả gửi tới FormSubmit (${TARGET_EMAIL}): Status ${res.status}:`, json);
  } catch (err: any) {
    console.error('Lỗi:', err.message);
  }

  await terminate(db);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
