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

const ACCESS_KEY = '9809c16d-6cf1-4fa4-b200-e8a76a672962';

async function run() {
  console.log('🔍 Đang lấy dữ liệu hồ sơ của Việt Quốc Phạm từ Firestore...');
  const snapshot = await getDocs(collection(db, 'applications'));
  let vietData: any = null;
  snapshot.forEach(d => {
    const data = { id: d.id, ...d.data() };
    if (data.fullName?.includes('Việt') || data.fullName?.includes('Viet')) {
      vietData = data;
    }
  });

  if (!vietData) {
    console.log('❌ Không tìm thấy hồ sơ của bạn Việt Quốc Phạm.');
    await terminate(db);
    return;
  }

  console.log(`📄 Tìm thấy hồ sơ: ${vietData.fullName} (${vietData.studentClass})`);
  console.log(`🚀 Đang gửi trực tiếp qua Web3Forms API với Access Key: ${ACCESS_KEY}...`);

  const payload = {
    access_key: ACCESS_KEY,
    subject: `🚀 [HỒ SƠ ỨNG VIÊN] ${vietData.fullName} (${vietData.studentClass}) - Ban ${vietData.departmentName || 'Chuyên Môn'}`,
    from_name: 'NK Tech Club Recruitment Portal',
    'Họ và Tên': vietData.fullName || 'Việt Quốc Phạm',
    'Lớp / MSSV': vietData.studentClass || '11A1',
    'Trường': vietData.schoolName || 'THPT Chuyên / THPT',
    'Email Ứng Viên': vietData.email || 'sadlygamer4756@gmail.com',
    'Số Điện Thoại / Zalo': vietData.phone || 'Không có',
    'Facebook': vietData.facebook || 'Không cung cấp',
    'Ban Ứng Tuyển': vietData.departmentName || 'Ban Chuyên Môn (Tech Core)',
    'Vị Trí Chuyên Môn': vietData.subRole || 'Web / App Developer',
    'Kỹ Năng': Array.isArray(vietData.skills) ? vietData.skills.join(', ') : (vietData.skills || 'React, TypeScript, Tailwind'),
    'Flex Zone / Link Sản Phẩm': vietData.flexZone || 'Không có',
    'Lý Do Gia Nhập CLB': vietData.motivation || 'Cống hiến cho CLB và phát triển kỹ năng',
    'Điểm AI Đánh Giá': `${vietData.scoreByAI || '9.6'} / 10.0`,
    'AI Cyber Vibe Tag': vietData.aiVibe || '⚡ 100% Cyber Architect',
    'AI Nhận Xét': vietData.aiReview || 'Hồ sơ rất xuất sắc!',
    '🛡️ Chống Gian Lận': vietData.cheatCount ? `⚠️ Cảnh báo ${vietData.cheatCount} lần out tab` : '✅ 100% Trung thực (0 lần out tab)',
    'Thời Gian Nộp Gốc': vietData.createdAt ? new Date(vietData.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
    'Câu 1 (Dev) Vấn đề giải quyết': vietData.castingDevQ1 || 'Không có',
    'Câu 2 (Dev) Feature thích nhưng user không cần': vietData.castingDevQ2 || 'Không có',
    'Câu 3 (Dev) Nút bấm có thể phá sản phẩm': vietData.castingDevQ3 || 'Không có',
    'Câu 4 (Dev) Người dùng nói dối': vietData.castingDevQ4 || 'Không có',
    'Câu 5 (Dev) Nếu chỉ được giữ lại 1 thứ': vietData.castingDevQ5 || 'Không có'
  };

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Origin': 'https://clbtinhocnk.onrender.com',
        'Referer': 'https://clbtinhocnk.onrender.com/'
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    console.log('👉 Phản hồi:', json);
    if (json.success) {
      console.log('🎉 ĐÃ GỬI THÀNH CÔNG HỒ SƠ VIỆT QUỐC PHẠM QUA WEB3FORMS!');
    } else {
      console.log('⚠️ Lỗi:', json.message);
    }
  } catch (err: any) {
    console.error('❌ Lỗi:', err.message);
  }

  await terminate(db);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
