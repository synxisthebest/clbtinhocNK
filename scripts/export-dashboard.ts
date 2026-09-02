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

function escapeHtml(str: any): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function exportAll() {
  console.log('Đang tải toàn bộ dữ liệu ứng viên từ Firestore...');
  const snapshot = await getDocs(collection(db, 'applications'));
  const list: any[] = [];
  snapshot.forEach(d => {
    list.push({ id: d.id, ...d.data() });
  });

  list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  let rowsHtml = '';
  list.forEach((app, idx) => {
    rowsHtml += `
      <tr style="border-bottom: 1px solid #334155;">
        <td style="padding: 12px; font-weight: bold; color: #38bdf8;">#${idx + 1}</td>
        <td style="padding: 12px; font-weight: bold; color: #fff; font-size: 15px;">${escapeHtml(app.fullName)}</td>
        <td style="padding: 12px; color: #94a3b8;">${escapeHtml(app.studentClass)} (${escapeHtml(app.schoolName || 'THPT')})</td>
        <td style="padding: 12px; color: #38bdf8;"><a href="mailto:${escapeHtml(app.email)}" style="color: #38bdf8;">${escapeHtml(app.email)}</a></td>
        <td style="padding: 12px; color: #4ade80; font-weight: bold;">${escapeHtml(app.phone)}</td>
        <td style="padding: 12px; color: #facc15;">${escapeHtml(app.departmentName || app.department)}</td>
        <td style="padding: 12px; color: #cbd5e1;">${escapeHtml(app.subRole || 'N/A')}</td>
        <td style="padding: 12px; font-weight: 900; color: #fbbf24;">${app.scoreByAI || 'N/A'}/10</td>
        <td style="padding: 12px; font-size: 12px; color: #94a3b8;">${app.createdAt ? new Date(app.createdAt).toLocaleString('vi-VN') : 'N/A'}</td>
      </tr>
      ${app.facebook || app.flexZone || app.motivation || app.castingDevQ1 || app.castingGameQ1 || app.castingCpQ1 ? `
      <tr style="background: #090d16; border-bottom: 2px solid #1e293b;">
        <td colspan="9" style="padding: 15px 20px; font-size: 13px; color: #cbd5e1; line-height: 1.6;">
          ${app.facebook ? `<div><strong>🌐 Facebook:</strong> <a href="${escapeHtml(app.facebook)}" target="_blank" style="color: #38bdf8;">${escapeHtml(app.facebook)}</a></div>` : ''}
          ${app.flexZone ? `<div><strong>🔗 Flex Zone:</strong> <a href="${escapeHtml(app.flexZone)}" target="_blank" style="color: #38bdf8;">${escapeHtml(app.flexZone)}</a></div>` : ''}
          ${app.skills ? `<div><strong>💡 Kỹ năng:</strong> ${escapeHtml(Array.isArray(app.skills) ? app.skills.join(', ') : app.skills)}</div>` : ''}
          ${app.motivation ? `<div><strong>❤️ Lý do gia nhập:</strong> ${escapeHtml(app.motivation)}</div>` : ''}
          ${app.aiReview ? `<div><strong>🤖 AI Nhận xét:</strong> <em>"${escapeHtml(app.aiReview)}"</em> (${escapeHtml(app.aiVibe || '')})</div>` : ''}
          ${app.castingDevQ1 ? `<div style="margin-top: 6px; padding: 8px; background: #1e293b; border-radius: 6px;"><strong>💻 Bài thi Web/Dev:</strong> ${escapeHtml(app.castingDevQ1)}</div>` : ''}
          ${app.castingGameQ1 ? `<div style="margin-top: 6px; padding: 8px; background: #1e293b; border-radius: 6px;"><strong>🎮 Bài thi Game Dev:</strong> ${escapeHtml(app.castingGameQ1)}</div>` : ''}
          ${app.castingCpQ1 ? `<div style="margin-top: 6px; padding: 8px; background: #1e293b; border-radius: 6px;"><strong>💻 Bài thi Chuyên Tin (CP):</strong> ${escapeHtml(app.castingCpQ1)}</div>` : ''}
        </td>
      </tr>` : ''}
    `;
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>BẢNG TỔNG HỢP TOÀN BỘ HỒ SƠ ỨNG VIÊN CLB TIN HỌC</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #020617; color: #f8fafc; padding: 25px; margin: 0; }
    h1 { color: #38bdf8; text-align: center; margin-bottom: 6px; }
    .table-container { max-width: 1300px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #1e293b; color: #38bdf8; padding: 14px 12px; font-weight: 800; font-size: 13px; text-transform: uppercase; border-bottom: 2px solid #334155; }
    tr:hover { background: rgba(56, 189, 248, 0.05); }
  </style>
</head>
<body>
  <div style="text-align: center; margin-bottom: 20px;">
    <h1>🚀 BẢNG TỔNG HỢP TOÀN BỘ ${list.length} HỒ SƠ ỨNG VIÊN</h1>
    <p style="color: #94a3b8; margin: 0;">Trích xuất trực tiếp từ Firestore Database CLB Tin Học NK</p>
  </div>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Họ và Tên</th>
          <th>Lớp / Trường</th>
          <th>Email</th>
          <th>SĐT / Zalo</th>
          <th>Ban</th>
          <th>Vị Trí</th>
          <th>Điểm AI</th>
          <th>Thời Gian Nộp</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>
</body>
</html>`;

  fs.writeFileSync('DANH_SACH_UNG_VIEN.html', fullHtml, 'utf8');
  console.log('✅ Đã xuất toàn bộ hồ sơ ra file DANH_SACH_UNG_VIEN.html');

  await terminate(db);
}

exportAll().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
