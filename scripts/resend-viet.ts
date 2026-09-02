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

const CLUB_GMAIL = 'nkdeveloperclub@gmail.com';

async function run() {
  console.log('🔍 Đang tìm hồ sơ của bạn Việt Quốc Phạm trong Firestore...');
  const snapshot = await getDocs(collection(db, 'applications'));
  const viets: any[] = [];
  snapshot.forEach(d => {
    const data = { id: d.id, ...d.data() };
    if (data.fullName?.includes('Việt') || data.fullName?.includes('Viet')) {
      viets.push(data);
    }
  });

  console.log(`📊 Tìm thấy ${viets.length} hồ sơ của Việt Quốc Phạm.\n`);

  for (let i = 0; i < viets.length; i++) {
    const data = viets[i];
    console.log(`[${i + 1}/${viets.length}] Đang gửi hồ sơ: ${data.fullName} (${data.studentClass}) - ${data.email}...`);

    const payload: Record<string, string> = {
      _subject: `🚀 [HỒ SƠ ỨNG VIÊN] ${data.fullName} (${data.studentClass}) - Ban ${data.departmentName || 'Chuyên Môn'}`,
      _captcha: 'false',
      _template: 'table',
      'Họ và Tên': data.fullName || 'Việt Quốc Phạm',
      'Lớp / MSSV': data.studentClass || '11A1',
      'Email Ứng Viên': data.email || 'sadlygamer4756@gmail.com',
      'Số Điện Thoại / Zalo': data.phone || 'Không có',
      'Ban Ứng Tuyển': data.departmentName || 'Ban Chuyên Môn (Tech Core)',
      'Vị Trí Chuyên Môn': data.subRole || 'Web / App Developer',
      'Kỹ Năng': Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || 'React, TypeScript'),
      'Flex Zone / Link Sản Phẩm': data.flexZone || 'Không có',
      'Lý Do Gia Nhập': data.motivation || 'Muốn đóng góp cho CLB',
      'Điểm AI': `${data.scoreByAI || '9.5'} / 10.0`,
      'Vibe AI': data.aiVibe || '100% Ultra Vibe Coder',
      'Nhận Xét AI': data.aiReview || 'Hồ sơ rất xuất sắc!',
      'Thời Gian Nộp': data.createdAt ? new Date(data.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')
    };

    if (data.castingDevQ1) payload['Cau 1 (Dev Web/App) Van de Web/App giai quyet'] = data.castingDevQ1;
    if (data.castingDevQ2) payload['Cau 2 (Dev Web/App) Feature thich nhung user khong can'] = data.castingDevQ2;
    if (data.castingDevQ3) payload['Cau 3 (Dev Web/App) Nut bam co the pha ca san pham'] = data.castingDevQ3;
    if (data.castingDevQ4) payload['Cau 4 (Dev Web/App) Nguoi dung dang noi doi ban?'] = data.castingDevQ4;
    if (data.castingDevQ5) payload['Cau 5 (Dev Web/App) Neu chi duoc giu lai mot thu'] = data.castingDevQ5;

    if (data.castingCpQ1) payload['Cau 1 (CP) Quan sat'] = data.castingCpQ1;
    if (data.castingCpQ2) payload['Cau 2 (CP) Suy luan'] = data.castingCpQ2;
    if (data.castingCpQ3) payload['Cau 3 (CP) Tu duy linh hoat'] = data.castingCpQ3;
    if (data.castingCpQ4) payload['Cau 4 (CP) Tu duy toi uu'] = data.castingCpQ4;
    if (data.castingCpQ5) payload['Cau 5 (CP) Cau phan loai'] = data.castingCpQ5;

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${CLUB_GMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => ({}));
      console.log(`   👉 Kết quả: Status ${res.status} | Response:`, json);
    } catch (e: any) {
      console.error(`   ❌ Lỗi gửi:`, e.message);
    }

    if (i < viets.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('\n🎉 Hoàn tất gửi hồ sơ cho bạn Việt Quốc Phạm!');
  await terminate(db);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
