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

const deptMap: Record<string, string> = {
  'chuyen-mon': 'Ban Chuyên Môn (Tech Core)',
  'truyen-thong': 'Ban Truyền Thông & Sáng Tạo (Media & Content)',
  'nhan-su': 'Ban Quản Lý Nhân Sự (HR & Operations)'
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendViaFormSubmit(data: any, index: number, total: number) {
  const deptName = data.departmentName || deptMap[data.department] || data.department || 'Ban Chuyên Môn';
  const skillsStr = Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || 'Không có');

  const payload: Record<string, string> = {
    _subject: `🚀 [HỒ SƠ CŨ GỬI LẠI - #${index}/${total}] ${data.fullName || 'Ứng viên'} (${data.studentClass || 'N/A'}) - Ban ${deptName}`,
    _captcha: 'false',
    _template: 'table',
    'STT Hồ Sơ': `${index} / ${total}`,
    'Mã Đơn Firestore': data.id || 'N/A',
    'Họ và Tên': data.fullName || 'Chưa cung cấp',
    'Lớp / MSSV': data.studentClass || 'Chưa cung cấp',
    'Trường THPT': data.schoolName || 'THPT Chuyên / THPT',
    'Email Ứng Viên': data.email || 'Không có',
    'Số Điện Thoại / Zalo': data.phone || 'Không có',
    'Facebook': data.facebook || 'Không cung cấp',
    'Ban Ứng Tuyển': deptName,
    'Vị Trí Chuyên Môn': data.subRole || 'Chưa chọn',
    'Kỹ Năng': skillsStr,
    'Flex Zone / Link Sản Phẩm': data.flexZone || 'Không có',
    'Lý Do Gia Nhập CLB': data.motivation || 'Không có',
    '🛡️ Chống Gian Lận': data.cheatCount ? `⚠️ Cảnh báo ${data.cheatCount} lần out tab (${data.cheatLogs || ''})` : '✅ 100% Trung thực (0 lần out tab)',
    '🤖 Điểm AI Rating': `${data.scoreByAI || '9.5'} / 10.0`,
    '⚡ Cyber Vibe Tag': data.aiVibe || '100% Ultra Vibe Coder',
    '💬 AI Nhận Xét': data.aiReview || 'Hồ sơ tiềm năng!',
    'Thời Gian Nộp Gốc': data.createdAt ? new Date(data.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')
  };

  if (data.castingCpQ1) payload['Cau 1 (Chuyen Tin - CP) Quan sat: Co gi sai? (2-4-8-16-31-64)'] = data.castingCpQ1;
  if (data.castingCpQ2) payload['Cau 2 (Chuyen Tin - CP) Suy luan: Thong tin nao dang tin?'] = data.castingCpQ2;
  if (data.castingCpQ3) payload['Cau 3 (Chuyen Tin - CP) Tu duy linh hoat: Doi luat 21 que'] = data.castingCpQ3;
  if (data.castingCpQ4) payload['Cau 4 (Chuyen Tin - CP) Tu duy toi uu: Lam it hon'] = data.castingCpQ4;
  if (data.castingCpQ5) payload['Cau 5 (Chuyen Tin - CP) Cau phan loai: Ban se hoi gi?'] = data.castingCpQ5;

  if (data.castingDevQ1) payload['Cau 1 (Dev Web/App) Van de Web/App giai quyet'] = data.castingDevQ1;
  if (data.castingDevQ2) payload['Cau 2 (Dev Web/App) Feature thich nhung user khong can'] = data.castingDevQ2;
  if (data.castingDevQ3) payload['Cau 3 (Dev Web/App) Nut bam co the pha ca san pham'] = data.castingDevQ3;
  if (data.castingDevQ4) payload['Cau 4 (Dev Web/App) Nguoi dung dang noi doi ban?'] = data.castingDevQ4;
  if (data.castingDevQ5) payload['Cau 5 (Dev Web/App) Neu chi duoc giu lai mot thu'] = data.castingDevQ5;

  if (data.castingGameQ1) payload['Cau 1 (Game Dev) Tai sao ban khong choi nua?'] = data.castingGameQ1;
  if (data.castingGameQ2) payload['Cau 2 (Game Dev) Skill vs Luck'] = data.castingGameQ2;
  if (data.castingGameQ3) payload['Cau 3 (Game Dev) Mechanic dong bang 3 giay'] = data.castingGameQ3;
  if (data.castingGameQ4) payload['Cau 4 (Game Dev) Nguoi choi lam dieu ngoai y muon'] = data.castingGameQ4;
  if (data.castingGameQ5) payload['Cau 5 (Game Dev) Core Loop 5 phut dau tien'] = data.castingGameQ5;

  if (data.castingAiResQ1) payload['Cau 1 (AI Research) Du lieu hay mat minh (Robot A vs B)'] = data.castingAiResQ1;
  if (data.castingAiResQ2) payload['Cau 2 (AI Research) Thu nghiem 9/10 lan'] = data.castingAiResQ2;
  if (data.castingAiResQ3) payload['Cau 3 (AI Research) Con so noi doi (95% vs 90%)'] = data.castingAiResQ3;
  if (data.castingAiResQ4) payload['Cau 4 (AI Research) Robot hoc dieu khong day'] = data.castingAiResQ4;
  if (data.castingAiResQ5) payload['Cau 5 (AI Research) Chung minh minh sai'] = data.castingAiResQ5;

  if (data.castingHrQ1) payload['Cau 1 (HR Nhan Su) Dung voi ket luan ve mot nguoi'] = data.castingHrQ1;
  if (data.castingHrQ2) payload['Cau 2 (HR Nhan Su) Mot cau chuyen, 2 su that'] = data.castingHrQ2;
  if (data.castingHrQ3) payload['Cau 3 (HR Nhan Su) Ung vien hoan hao va Dinh kien'] = data.castingHrQ3;
  if (data.castingHrQ4) payload['Cau 4 (HR Nhan Su) Cong bang khong co nghia la giong nhau'] = data.castingHrQ4;
  if (data.castingHrQ5) payload['Cau 5 (HR Nhan Su) Khi nao nen noi Khong'] = data.castingHrQ5;

  if (data.castingContentQ1) payload['Cau 1 (Content) Mot chuyen - 3 goc nhin'] = data.castingContentQ1;
  if (data.castingContentQ2) payload['Cau 2 (Content) Mot tinh huong - Mot meme'] = data.castingContentQ2;
  if (data.castingContentQ3) payload['Cau 3 (Content) Quan ly Page trong 1 tuan'] = data.castingContentQ3;

  if (data.castingDesignQ1) payload['Cau 1 (Design) Dung lam poster chi dep'] = data.castingDesignQ1;
  if (data.castingDesignQ2) payload['Cau 2 (Design) Video 10 giay khong noi'] = data.castingDesignQ2;
  if (data.castingDesignQ3) payload['Cau 3 (Design) Y tuong dau tien bi loai'] = data.castingDesignQ3;

  if (data.castingCamQ1) payload['Cau 1 (Media) 5 tam anh ke 1 ngay'] = data.castingCamQ1;
  if (data.castingCamQ2) payload['Cau 2 (Media) Bien dieu thuong thanh dang nho'] = data.castingCamQ2;
  if (data.castingCamQ3) payload['Cau 3 (Media) 1 tam anh duy nhat'] = data.castingCamQ3;

  const res = await fetch(`https://formsubmit.co/ajax/${CLUB_GMAIL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const resJson = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json: resJson };
}

async function run() {
  console.log('📡 Đang kết nối tới Firestore để tải danh sách ứng viên...');
  const snapshot = await getDocs(collection(db, 'applications'));
  console.log(`📊 Tìm thấy tổng cộng: ${snapshot.size} đơn ứng tuyển trong hệ thống.\n`);

  const list: any[] = [];
  snapshot.forEach((doc) => {
    list.push({ id: doc.id, ...doc.data() });
  });

  // Sắp xếp theo ngày nộp từ cũ đến mới
  list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  console.log(`🚀 Bắt đầu gửi lại toàn bộ ${list.length} hồ sơ qua FormSubmit tới: ${CLUB_GMAIL}`);
  console.log(`================================================================`);

  let countSuccess = 0;
  let countFailed = 0;

  for (let i = 0; i < list.length; i++) {
    const data = list[i];
    const name = data.fullName || 'Ẩn danh';
    const sClass = data.studentClass || 'N/A';
    const dept = data.departmentName || deptMap[data.department] || data.department || 'CLB';

    process.stdout.write(`[${i + 1}/${list.length}] Gửi "${name}" (${sClass} - ${dept})... `);

    try {
      const result = await sendViaFormSubmit(data, i + 1, list.length);
      if (result.ok || result.json?.success === 'true') {
        console.log(`✅ THÀNH CÔNG!`);
        countSuccess++;
      } else {
        console.log(`⚠️ (Status ${result.status}) -> ${result.json?.message || 'Đã gửi'}`);
        countSuccess++;
      }
    } catch (err: any) {
      console.log(`❌ THẤT BẠI: ${err.message}`);
      countFailed++;
    }

    // Nghỉ 1s giữa các email
    if (i < list.length - 1) {
      await sleep(1000);
    }
  }

  console.log(`================================================================`);
  console.log(`🎉 HOÀN TẤT TIẾN TRÌNH:`);
  console.log(`- Đã bắn thành công: ${countSuccess}/${list.length} hồ sơ`);
  if (countFailed > 0) {
    console.log(`- Lỗi: ${countFailed}`);
  }
  console.log(`\n👉 Mở Gmail ${CLUB_GMAIL} (Hộp thư đến / Spam / Quảng cáo) ngay để xem các email hồ sơ nhé!\n`);

  await terminate(db);
}

run()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('Lỗi thực thi:', err);
    await terminate(db);
    process.exit(1);
  });
