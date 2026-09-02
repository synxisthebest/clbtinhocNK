import dotenv from 'dotenv';
import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, collection, getDocs, terminate } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Load Firebase Config
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId || undefined);

const CLUB_GMAIL = process.env.CLUB_GMAIL || process.env.SMTP_USER || 'nkdeveloperclub@gmail.com';
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface QuestionItem {
  qNum: string;
  qTitle: string;
  qText: string;
  answer?: string;
}

function renderQASection(
  title: string,
  icon: string,
  accentColor: string,
  questions: QuestionItem[]
): string {
  const answered = questions.filter(q => q.answer && String(q.answer).trim().length > 0);
  if (answered.length === 0) return '';

  const qHtml = answered
    .map(
      (q) => `
    <div style="margin-bottom: 16px; background-color: #020617; border: 1px solid #334155; border-left: 4px solid ${accentColor}; border-radius: 10px; overflow: hidden;">
      <div style="background-color: #1e293b; padding: 12px 16px; border-bottom: 1px solid #334155;">
        <div style="font-weight: 800; color: ${accentColor}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
          ${escapeHtml(q.qNum)}: ${escapeHtml(q.qTitle)}
        </div>
        <div style="color: #ffffff; font-size: 14px; font-weight: 700; margin-top: 6px; line-height: 1.5;">
          ❓ ${escapeHtml(q.qText)}
        </div>
      </div>
      <div style="padding: 16px; background-color: #090d16;">
        <span style="color: #38bdf8; font-size: 11px; font-weight: 800; display: block; margin-bottom: 8px; letter-spacing: 0.5px; text-transform: uppercase;">
          💬 CÂU TRẢ LỜI CỦA THÍ SÍNH:
        </span>
        <div style="color: #f8fafc; font-size: 14px; line-height: 1.7; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; white-space: pre-wrap; word-break: break-word; font-weight: 500;">${escapeHtml(q.answer || '')}</div>
      </div>
    </div>
  `
    )
    .join('');

  return `
    <div style="background-color: #0f172a; padding: 20px; border-radius: 14px; margin-bottom: 22px; border: 1px solid #1e293b; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);">
      <h3 style="color: ${accentColor}; font-size: 16px; margin: 0 0 16px 0; font-weight: 800; border-bottom: 1px solid #334155; padding-bottom: 10px; display: flex; align-items: center; gap: 8px;">
        ${icon} ${escapeHtml(title)} <span style="background-color: #1e293b; color: #f8fafc; font-size: 12px; padding: 2px 8px; border-radius: 12px; margin-left: 8px;">${answered.length} câu đã trả lời</span>
      </h3>
      ${qHtml}
    </div>
  `;
}

function buildHtmlBody(data: any): string {
  const {
    fullName, studentClass, schoolName, email, phone, facebook,
    departmentName, department, subRole, skills, flexZone, motivation,
    scoreByAI, aiVibe, aiReview, createdAt, cheatCount, cheatLogs,
    castingCamQ1, castingCamQ2, castingCamQ3,
    castingContentQ1, castingContentQ2, castingContentQ3,
    castingDesignQ1, castingDesignQ2, castingDesignQ3,
    castingCpQ1, castingCpQ2, castingCpQ3, castingCpQ4, castingCpQ5,
    castingDevQ1, castingDevQ2, castingDevQ3, castingDevQ4, castingDevQ5,
    castingGameQ1, castingGameQ2, castingGameQ3, castingGameQ4, castingGameQ5,
    castingAiResQ1, castingAiResQ2, castingAiResQ3, castingAiResQ4, castingAiResQ5,
    castingHrQ1, castingHrQ2, castingHrQ3, castingHrQ4, castingHrQ5
  } = data;

  const deptMap: Record<string, string> = {
    'chuyen-mon': 'Ban Chuyên Môn (Tech Core)',
    'truyen-thong': 'Ban Truyền Thông & Sáng Tạo (Media & Content)',
    'nhan-su': 'Ban Quản Lý Nhân Sự (HR & Operations)'
  };
  const chosenDepartmentDisplay = departmentName || deptMap[department] || department || 'Chưa chọn ban';
  const skillsListStr = Array.isArray(skills) ? skills.join(', ') : (skills || 'Chưa chọn');

  const hrBlock = renderQASection('Bài Thi Ban Quản Lý Nhân Sự (HR)', '👥', '#a855f7', [
    { qNum: 'CÂU 1', qTitle: 'Đừng vội kết luận về một người', qText: 'Khi tiếp xúc với một thành viên mới tỏ ra thu mình...', answer: castingHrQ1 },
    { qNum: 'CÂU 2', qTitle: 'Một câu chuyện, 2 sự thật', qText: 'Khi xảy ra sự cố trong sự kiện...', answer: castingHrQ2 },
    { qNum: 'CÂU 3', qTitle: 'Ứng viên hoàn hảo', qText: 'Bạn nghĩ một ứng viên "hoàn hảo" có thực sự tồn tại không?...', answer: castingHrQ3 },
    { qNum: 'CÂU 4', qTitle: 'Công bằng không có nghĩa là giống nhau', qText: 'Đối xử công bằng với các thành viên...', answer: castingHrQ4 },
    { qNum: 'CÂU 5', qTitle: 'Khi nào nên nói "Không"', qText: 'Trong tình huống nào bạn sẽ quyết định từ chối...', answer: castingHrQ5 }
  ]);

  const aiBlock = renderQASection('Bài Thi Ban AI & Data Science Research', '🔬', '#06b6d4', [
    { qNum: 'CÂU 1', qTitle: 'Dữ liệu hay mắt mình', qText: 'Robot A vs Robot B...', answer: castingAiResQ1 },
    { qNum: 'CÂU 2', qTitle: 'Thử nghiệm 9/10 lần', qText: 'Xử lý 1 lần thất bại...', answer: castingAiResQ2 },
    { qNum: 'CÂU 3', qTitle: 'Con số nói dối', qText: 'Độ chính xác 95% vs 90%...', answer: castingAiResQ3 },
    { qNum: 'CÂU 4', qTitle: 'Robot học điều không dạy', qText: 'Mô hình AI đưa ra kết quả đúng...', answer: castingAiResQ4 },
    { qNum: 'CÂU 5', qTitle: 'Chứng minh mình sai', qText: 'Thiết kế bài kiểm tra...', answer: castingAiResQ5 }
  ]);

  const contentBlock = renderQASection('Bài Thi Ban Truyền Thông — Content', '✍️', '#f43f5e', [
    { qNum: 'CÂU 1', qTitle: 'Một chuyện — 3 góc nhìn', qText: 'Từ hoạt động bình thường của CLB...', answer: castingContentQ1 },
    { qNum: 'CÂU 2', qTitle: 'Một tình huống — một meme', qText: 'Biến tình huống thành meme...', answer: castingContentQ2 },
    { qNum: 'CÂU 3', qTitle: 'Quản lý Page trong 1 tuần', qText: 'Kế hoạch phát triển Fanpage...', answer: castingContentQ3 }
  ]);

  const cpBlock = renderQASection('Bài Thi Ban Chuyên Môn — Chuyên Tin (CP)', '💻', '#eab308', [
    { qNum: 'CÂU 1', qTitle: 'Quan sát: Có gì sai?', qText: 'Dãy số 2-4-8-16-31-64...', answer: castingCpQ1 },
    { qNum: 'CÂU 2', qTitle: 'Suy luận', qText: 'Hỏi 1 câu duy nhất...', answer: castingCpQ2 },
    { qNum: 'CÂU 3', qTitle: 'Tư duy linh hoạt: Đổi luật 21 que', qText: 'Thay đổi 1 luật...', answer: castingCpQ3 },
    { qNum: 'CÂU 4', qTitle: 'Tư duy tối ưu: Làm ít hơn', qText: 'Tìm 1 bạn cao khác biệt...', answer: castingCpQ4 },
    { qNum: 'CÂU 5', qTitle: 'Câu phân loại', qText: '3 câu hỏi bạn hỏi...', answer: castingCpQ5 }
  ]);

  const devBlock = renderQASection('Bài Thi Ban Chuyên Môn — Web / App Developer', '⚡', '#22c55e', [
    { qNum: 'CÂU 1', qTitle: 'Vấn đề bạn đang giải quyết', qText: 'Mô tả vấn đề thực tế...', answer: castingDevQ1 },
    { qNum: 'CÂU 2', qTitle: 'Feature thích nhưng user không cần', qText: 'Tìm ra vấn đề thực sự...', answer: castingDevQ2 },
    { qNum: 'CÂU 3', qTitle: 'Nút bấm có thể phá sản phẩm', qText: 'Thứ tự ưu tiên hiển thị...', answer: castingDevQ3 },
    { qNum: 'CÂU 4', qTitle: 'Người dùng nói dối?', qText: 'Xử lý 2 giả thuyết...', answer: castingDevQ4 },
    { qNum: 'CÂU 5', qTitle: 'Nếu chỉ được giữ lại 1 thứ', qText: 'Thứ giữ chân người dùng...', answer: castingDevQ5 }
  ]);

  const gameBlock = renderQASection('Bài Thi Ban Chuyên Môn — Game Developer', '🎮', '#ec4899', [
    { qNum: 'CÂU 1', qTitle: 'Tại sao bạn không chơi nữa?', qText: 'Phân tích tựa game đã bỏ...', answer: castingGameQ1 },
    { qNum: 'CÂU 2', qTitle: 'Skill vs Luck', qText: 'Cân bằng kỹ năng và may mắn...', answer: castingGameQ2 },
    { qNum: 'CÂU 3', qTitle: 'Đóng băng 3s', qText: 'Cùng mechanic cho 2 game...', answer: castingGameQ3 },
    { qNum: 'CÂU 4', qTitle: 'Người chơi làm điều ngoài ý muốn', qText: 'Xử lý farm tiền/level...', answer: castingGameQ4 },
    { qNum: 'CÂU 5', qTitle: 'Core Loop 5 phút đầu', qText: 'Giữ chân người chơi mới...', answer: castingGameQ5 }
  ]);

  const designBlock = renderQASection('Bài Thi Ban Truyền Thông — Graphic Design & Video', '🎨', '#38bdf8', [
    { qNum: 'CÂU 1', qTitle: 'Đừng làm nó đẹp', qText: 'Poster thu hút ánh nhìn...', answer: castingDesignQ1 },
    { qNum: 'CÂU 2', qTitle: 'Video 10 giây không nói', qText: 'Ý tưởng video...', answer: castingDesignQ2 },
    { qNum: 'CÂU 3', qTitle: 'Ý tưởng đầu tiên bị loại', qText: 'Tìm cảm hứng mới...', answer: castingDesignQ3 }
  ]);

  const camBlock = renderQASection('Bài Thi Ban Truyền Thông — Media & Camera', '📸', '#14b8a6', [
    { qNum: 'CÂU 1', qTitle: '5 tấm ảnh kể 1 ngày', qText: 'Ý tưởng 5 bức ảnh...', answer: castingCamQ1 },
    { qNum: 'CÂU 2', qTitle: 'Biến điều thường thành nhớ', qText: 'Góc máy và ánh sáng...', answer: castingCamQ2 },
    { qNum: 'CÂU 3', qTitle: '1 tấm ảnh duy nhất', qText: 'Khoảnh khắc biểu tượng...', answer: castingCamQ3 }
  ]);

  return `
    <div style="font-family: system-ui, sans-serif; background-color: #020617; color: #f8fafc; padding: 24px 12px;">
      <div style="max-width: 680px; margin: 0 auto; background-color: #0f172a; border-radius: 20px; border: 1px solid #1e293b; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0284c7 0%, #0d9488 50%, #7e22ce 100%); padding: 30px 24px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 0 0 8px 0;">
            🚀 [HỒ SƠ GỬI LẠI] ${escapeHtml(fullName)} (${escapeHtml(studentClass)})
          </h1>
          <p style="color: #e0f2fe; font-size: 14px; margin: 0;">Ban: ${escapeHtml(chosenDepartmentDisplay)} | Vị trí: ${escapeHtml(subRole || 'Chưa chọn')}</p>
        </div>
        <div style="padding: 24px 20px;">
          <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
            <p style="margin: 4px 0;"><strong>👤 Họ tên:</strong> ${escapeHtml(fullName)}</p>
            <p style="margin: 4px 0;"><strong>🏫 Lớp:</strong> ${escapeHtml(studentClass)} (${escapeHtml(schoolName || 'THPT')})</p>
            <p style="margin: 4px 0;"><strong>📧 Email:</strong> ${escapeHtml(email)}</p>
            <p style="margin: 4px 0;"><strong>📱 SĐT / Zalo:</strong> ${escapeHtml(phone)}</p>
            <p style="margin: 4px 0;"><strong>🌐 Facebook:</strong> ${escapeHtml(facebook || 'Không có')}</p>
            <p style="margin: 4px 0;"><strong>💡 Kỹ năng:</strong> ${escapeHtml(skillsListStr)}</p>
            <p style="margin: 4px 0;"><strong>🔗 Flex Zone:</strong> ${escapeHtml(flexZone || 'Không có')}</p>
            <p style="margin: 4px 0;"><strong>❤️ Lý do gia nhập:</strong> ${escapeHtml(motivation || 'Không có')}</p>
            <p style="margin: 4px 0;"><strong>🤖 Điểm AI:</strong> ${scoreByAI || '9.5'}/10 | <strong>Vibe:</strong> ${escapeHtml(aiVibe || 'N/A')}</p>
            <p style="margin: 4px 0;"><strong>📝 Nhận xét AI:</strong> ${escapeHtml(aiReview || 'N/A')}</p>
            <p style="margin: 4px 0;"><strong>🛡️ Anti-cheat:</strong> ${cheatCount ? `${cheatCount} lần out tab` : '0 lần out tab'}</p>
          </div>
          ${hrBlock}
          ${aiBlock}
          ${contentBlock}
          ${cpBlock}
          ${devBlock}
          ${gameBlock}
          ${designBlock}
          ${camBlock}
        </div>
      </div>
    </div>
  `;
}

async function run() {
  console.log('🔍 Đang kết nối tới Firebase Firestore để lấy toàn bộ đơn ứng tuyển...');

  const snapshot = await getDocs(collection(db, 'applications'));
  console.log(`📊 Tìm thấy tổng cộng: ${snapshot.size} đơn ứng tuyển trong Firestore.\n`);

  if (snapshot.size === 0) {
    console.log('⚠️ Chưa có đơn ứng tuyển nào trong Firestore.');
    await terminate(db);
    return;
  }

  const isSmtpConfigured = Boolean(smtpUser && smtpPass);

  if (!isSmtpConfigured) {
    console.log(`
⚠️ CHƯA CẤU HÌNH SMTP GMAIL TRONG FILE .env !
=======================================================================
Để gửi email thực sự tới ${CLUB_GMAIL}, hãy tạo/chỉnh sửa file .env với:

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=nkdeveloperclub@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  <-- (Mật khẩu ứng dụng 16 ký tự của Gmail)
CLUB_GMAIL=nkdeveloperclub@gmail.com

👉 Hướng dẫn lấy Mật khẩu ứng dụng Gmail (16 ký tự):
1. Vào https://myaccount.google.com/security
2. Bật "Xác minh 2 bước" (2-Step Verification) nếu chưa bật.
3. Truy cập https://myaccount.google.com/apppasswords
4. Tạo một Mật khẩu ứng dụng mới (Tên: Recruitment Portal).
5. Copy 16 ký tự dán vào SMTP_PASS trong file .env.
=======================================================================
    `);
  }

  let transporter: nodemailer.Transporter | null = null;
  if (isSmtpConfigured) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    console.log(`✅ Đã kết nối SMTP Transporter qua ${smtpHost}:${smtpPort} với tài khoản ${smtpUser}`);
  }

  let successCount = 0;
  let skippedCount = 0;

  for (const doc of snapshot.docs) {
    const data: any = { id: doc.id, ...doc.data() };
    console.log(`----------------------------------------------------------------`);
    console.log(`📄 Đơn: ${data.fullName || 'Ẩn danh'} | Lớp: ${data.studentClass || 'N/A'} | Ban: ${data.departmentName || data.department || 'N/A'} | Email: ${data.email || 'N/A'}`);

    if (transporter) {
      try {
        const html = buildHtmlBody(data);
        await transporter.sendMail({
          from: `"NK Tech Club Portal" <${smtpUser}>`,
          to: CLUB_GMAIL,
          subject: `🚀 [HỒ SƠ GỬI LẠI] ${data.fullName || 'Ứng viên'} (${data.studentClass || 'N/A'}) - Ban ${data.departmentName || data.department || 'CLB'}`,
          html: html
        });
        console.log(`   ✅ ĐÃ GỬI THÀNH CÔNG EMAIL TỚI: ${CLUB_GMAIL}`);
        successCount++;
      } catch (sendErr) {
        console.error(`   ❌ Lỗi gửi email cho ${data.fullName}:`, sendErr);
      }
    } else {
      skippedCount++;
    }
  }

  console.log(`\n================================================================`);
  console.log(`🎉 TỔNG KẾT TIẾN TRÌNH:`);
  console.log(`- Tổng số hồ sơ: ${snapshot.size}`);
  console.log(`- Đã gửi qua SMTP: ${successCount}`);
  if (skippedCount > 0) {
    console.log(`- Đã hiển thị xem trước (do chưa cấu hình SMTP): ${skippedCount}`);
    console.log(`💡 Sau khi thêm SMTP_USER và SMTP_PASS vào .env, hãy chạy lại lệnh:`);
    console.log(`   npm run resend-emails`);
  }
  console.log(`================================================================\n`);

  await terminate(db);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Lỗi thực thi:', err);
    process.exit(1);
  });
