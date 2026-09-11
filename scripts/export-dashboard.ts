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

  // Helper to identify spam/test
  function isSpam(app: any): boolean {
    const name = (app.fullName || '').trim().toLowerCase();
    const email = (app.email || '').trim().toLowerCase();
    const phone = (app.phone || '').trim();
    if (['âf', 'cc', 'h', 'đasdad', 'sdadsdasdsadasdas', 'áddadas', 'adsdadassda', 'adssddas', 'dfdfdsffsdfdsfdsf', 'asadsadsaddas', 'hah', 'kid'].includes(name)) return true;
    if (email.endsWith('@') || email === '14@' || email === '12313@' || email === 'sơn đẹp trai@' || email === '1241@gga') return true;
    if (phone.length < 8 || /^([a-zA-Z]+|[0-9]{1,4})$/.test(phone)) return true;
    return false;
  }

  // Group real candidates by key (email or phone) to take their best/most complete submission
  const realMap = new Map<string, any>();
  const testList: any[] = [];

  list.forEach(app => {
    if (isSpam(app)) {
      testList.push(app);
    } else {
      const key = (app.email || app.phone || app.fullName).toLowerCase().trim();
      if (!realMap.has(key)) {
        realMap.set(key, app);
      } else {
        const prev = realMap.get(key);
        // If current app has longer casting content, keep current
        if (JSON.stringify(app).length > JSON.stringify(prev).length) {
          realMap.set(key, app);
        }
      }
    }
  });

  const realList = Array.from(realMap.values());
  realList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const deptCounts: Record<string, number> = { 'chuyen-mon': 0, 'truyen-thong': 0, 'nhan-su': 0 };
  realList.forEach(a => {
    const d = a.department || 'chuyen-mon';
    deptCounts[d] = (deptCounts[d] || 0) + 1;
  });

  const castingFields: { key: string; label: string; icon: string }[] = [
    // Content
    { key: 'castingContentQ1', label: 'Bài thi Content Q1 (1 chuyện 3 góc nhìn)', icon: '✍️' },
    { key: 'castingContentQ2', label: 'Bài thi Content Q2 (Ý tưởng Meme)', icon: '🎭' },
    { key: 'castingContentQ3', label: 'Bài thi Content Q3 (Kế hoạch 1 tuần QL Fanpage)', icon: '📅' },
    // Design & Video
    { key: 'castingDesignQ1', label: 'Bài thi Design Q1 (Ý tưởng Poster)', icon: '🎨' },
    { key: 'castingDesignQ2', label: 'Bài thi Design Q2 (Video 10s không lời)', icon: '🎬' },
    { key: 'castingDesignQ3', label: 'Bài thi Design Q3 (Concept sáng tạo lại)', icon: '💡' },
    // Cameraman
    { key: 'castingCamQ1', label: 'Bài thi Camera Q1 (5 tấm ảnh kể 1 ngày)', icon: '📸' },
    { key: 'castingCamQ2', label: 'Bài thi Camera Q2 (Biến bình thường thành đáng nhớ)', icon: '🌅' },
    { key: 'castingCamQ3', label: 'Bài thi Camera Q3 (1 bức ảnh biểu tượng)', icon: '⭐' },
    // Web / Dev
    { key: 'castingDevQ1', label: 'Bài thi Dev Q1 (Vấn đề giải quyết)', icon: '💻' },
    { key: 'castingDevQ2', label: 'Bài thi Dev Q2 (Tính năng không ai dùng)', icon: '❓' },
    { key: 'castingDevQ3', label: 'Bài thi Dev Q3 (Thứ tự ưu tiên 12 tính năng)', icon: '🔢' },
    { key: 'castingDevQ4', label: 'Bài thi Dev Q4 (User nói dối)', icon: '🕵️' },
    { key: 'castingDevQ5', label: 'Bài thi Dev Q5 (1 thứ giữ chân học sinh)', icon: '🎯' },
    // Game Dev
    { key: 'castingGameQ1', label: 'Bài thi Game Q1 (Tại sao bỏ game)', icon: '🎮' },
    { key: 'castingGameQ2', label: 'Bài thi Game Q2 (Skill vs Luck)', icon: '🎲' },
    { key: 'castingGameQ3', label: 'Bài thi Game Q3 (Đóng băng 3 giây)', icon: '❄️' },
    { key: 'castingGameQ4', label: 'Bài thi Game Q4 (Cày game/Roblox farm ngoài ý muốn)', icon: '🌾' },
    { key: 'castingGameQ5', label: 'Bài thi Game Q5 (Core loop 5 phút)', icon: '🔄' },
    // CP
    { key: 'castingCpQ1', label: 'Bài thi CP Q1 (Quan sát - Số sai)', icon: '🧠' },
    { key: 'castingCpQ2', label: 'Bài thi CP Q2 (Suy luận - Ai nói dối)', icon: '🔍' },
    { key: 'castingCpQ3', label: 'Bài thi CP Q3 (Đổi luật 21 que)', icon: '🕹️' },
    { key: 'castingCpQ4', label: 'Bài thi CP Q4 (Tối ưu tìm người 1/1000)', icon: '⚡' },
    { key: 'castingCpQ5', label: 'Bài thi CP Q5 (Câu hỏi cho người ra đề)', icon: '❓' },
    // AI Research
    { key: 'castingAiResQ1', label: 'Bài thi AI Q1 (Robot A vs Robot B)', icon: '🤖' },
    { key: 'castingAiResQ2', label: 'Bài thi AI Q2 (9/10 lần thành công)', icon: '📊' },
    { key: 'castingAiResQ3', label: 'Bài thi AI Q3 (Độ chính xác 95% vs 90%)', icon: '📈' },
    { key: 'castingAiResQ4', label: 'Bài thi AI Q4 (AI học điều không dạy)', icon: '🔮' },
    { key: 'castingAiResQ5', label: 'Bài thi AI Q5 (Chứng minh AI mình sai)', icon: '🧪' },
    // HR & Operations
    { key: 'castingHrQ1', label: 'Bài thi HR Q1 (Tiếp xúc thành viên mới/3 câu hỏi)', icon: '👥' },
    { key: 'castingHrQ2', label: 'Bài thi HR Q2 (Lỗi cá nhân vs Lỗi hệ thống)', icon: '⚖️' },
    { key: 'castingHrQ3', label: 'Bài thi HR Q3 (Ứng viên hoàn hảo & Định kiến)', icon: '🌟' },
    { key: 'castingHrQ4', label: 'Bài thi HR Q4 (Công bằng trong quản lý)', icon: '🤝' },
    { key: 'castingHrQ5', label: 'Bài thi HR Q5 (Khi nào nói "Không")', icon: '🚫' }
  ];

  function renderRows(dataList: any[], isOfficial: boolean) {
    return dataList.map((app, idx) => {
      const deptCode = app.department || 'chuyen-mon';
      const answeredList = castingFields
        .filter(f => app[f.key] && String(app[f.key]).trim().length > 0)
        .map(f => `
          <div style="margin-top: 8px; padding: 10px 14px; background: #0f172a; border-left: 3px solid #38bdf8; border-radius: 6px;">
            <strong style="color: #38bdf8; font-size: 12px; text-transform: uppercase;">${f.icon} ${escapeHtml(f.label)}:</strong>
            <div style="margin-top: 4px; color: #f8fafc; white-space: pre-wrap; word-break: break-word; font-size: 13.5px; line-height: 1.6;">${escapeHtml(app[f.key])}</div>
          </div>
        `)
        .join('');

      const deptColor = deptCode === 'truyen-thong' ? '#fb7185' : deptCode === 'nhan-su' ? '#c084fc' : '#38bdf8';
      const deptDisplay = app.departmentName || (deptCode === 'truyen-thong' ? 'Ban Truyền Thông' : deptCode === 'nhan-su' ? 'Ban Nhân Sự' : 'Ban Chuyên Môn');

      return `
        <tbody class="candidate-row" data-dept="${deptCode}" data-search="${escapeHtml((app.fullName + ' ' + app.studentClass + ' ' + app.phone + ' ' + app.email + ' ' + deptDisplay).toLowerCase())}">
          <tr style="border-bottom: 1px solid #334155; background: #0b1120;">
            <td style="padding: 14px 12px; font-weight: 800; color: #38bdf8; font-size: 15px;">#${idx + 1}</td>
            <td style="padding: 14px 12px; font-weight: bold; color: #ffffff; font-size: 16px;">
              ${escapeHtml(app.fullName)}
              ${isOfficial ? `<span style="display:inline-block; font-size: 10px; background: rgba(56,189,248,0.2); color: #38bdf8; border: 1px solid #0284c7; padding: 1px 6px; border-radius: 10px; margin-left: 6px;">HỒ SƠ THẬT</span>` : ''}
            </td>
            <td style="padding: 14px 12px; color: #cbd5e1; font-weight: 600;">${escapeHtml(app.studentClass)} <span style="color: #94a3b8; font-weight: normal;">(${escapeHtml(app.schoolName || 'THPT')})</span></td>
            <td style="padding: 14px 12px; color: #38bdf8;"><a href="mailto:${escapeHtml(app.email)}" style="color: #38bdf8; text-decoration: underline;">${escapeHtml(app.email)}</a></td>
            <td style="padding: 14px 12px; color: #4ade80; font-weight: bold;">${escapeHtml(app.phone)}</td>
            <td style="padding: 14px 12px; color: ${deptColor}; font-weight: 800;">${escapeHtml(deptDisplay)}</td>
            <td style="padding: 14px 12px; color: #e2e8f0; font-size: 13px;">${escapeHtml(app.subRole || 'Chưa phân định')}</td>
            <td style="padding: 14px 12px; font-weight: 900; color: #fbbf24; font-size: 15px;">${app.scoreByAI || 'N/A'}/10</td>
            <td style="padding: 14px 12px; font-size: 12px; color: #94a3b8;">${app.createdAt ? new Date(app.createdAt).toLocaleString('vi-VN') : 'N/A'}</td>
          </tr>
          <tr style="background: #060b16; border-bottom: 3px solid #1e293b;">
            <td colspan="9" style="padding: 16px 22px; font-size: 13.5px; color: #cbd5e1; line-height: 1.6;">
              <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #1e293b;">
                ${app.facebook ? `<div><strong>🌐 Facebook:</strong> <a href="${escapeHtml(app.facebook)}" target="_blank" style="color: #38bdf8; text-decoration: underline;">${escapeHtml(app.facebook)}</a></div>` : ''}
                ${app.flexZone ? `<div><strong>🔗 Flex Zone / Portfolio:</strong> <a href="${escapeHtml(app.flexZone)}" target="_blank" style="color: #c084fc; text-decoration: underline; font-weight: bold;">${escapeHtml(app.flexZone)}</a></div>` : ''}
              </div>
              ${app.skills ? `<div style="margin-bottom: 8px;"><strong>💡 Kỹ năng & Badges:</strong> <span style="color: #a7f3d0;">${escapeHtml(Array.isArray(app.skills) ? app.skills.join(', ') : app.skills)}</span></div>` : ''}
              ${app.motivation ? `<div style="margin-bottom: 8px;"><strong>❤️ Lý do muốn vào CLB:</strong> <span style="color: #fde047;">${escapeHtml(app.motivation)}</span></div>` : ''}
              ${app.aiReview ? `<div style="margin-bottom: 12px; padding: 8px 12px; background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38bdf8; border-radius: 4px;"><strong>🤖 AI Đánh Giá & Vibe:</strong> <em style="color: #e0f2fe;">"${escapeHtml(app.aiReview)}"</em> <strong style="color: #fbbf24; margin-left: 8px;">[${escapeHtml(app.aiVibe || '')}]</strong></div>` : ''}
              ${answeredList ? `
                <div style="margin-top: 14px;">
                  <div style="font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px; margin-bottom: 6px;">📝 CÂU TRẢ LỜI BÀI THI CASTING CHALLENGE:</div>
                  ${answeredList}
                </div>
              ` : '<div style="color: #64748b; font-style: italic; margin-top: 6px;">(Không có câu trả lời casting bằng chữ)</div>'}
            </td>
          </tr>
        </tbody>
      `;
    }).join('');
  }

  const officialRowsHtml = renderRows(realList, true);
  const testRowsHtml = renderRows(testList, false);

  const masterHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BÁO CÁO TỔNG HỢP TUYỂN QUÂN CLB TIN HỌC NK 2026 - KÍNH GỬI CHỦ NHIỆM CLB</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #020617; color: #f8fafc; padding: 25px; margin: 0; line-height: 1.5; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header-card { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0369a1 100%); border: 1px solid #38bdf8; border-radius: 20px; padding: 30px; text-align: center; margin-bottom: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 25px; }
    .kpi-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 14px; padding: 18px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    .kpi-num { font-size: 32px; font-weight: 900; margin-top: 4px; }
    .controls { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; align-items: center; justify-content: space-between; background: #0f172a; padding: 14px 20px; border-radius: 14px; border: 1px solid #1e293b; }
    .search-input { background: #020617; border: 1px solid #334155; color: #fff; padding: 10px 16px; border-radius: 10px; font-size: 14px; width: 320px; outline: none; }
    .search-input:focus { border-color: #38bdf8; }
    .filter-btn { background: #1e293b; border: 1px solid #334155; color: #cbd5e1; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 13px; transition: all 0.2s; }
    .filter-btn.active, .filter-btn:hover { background: #0284c7; color: #fff; border-color: #38bdf8; }
    .print-btn { background: #10b981; color: #fff; border: none; padding: 9px 18px; border-radius: 10px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px; }
    .print-btn:hover { background: #059669; }
    .table-container { background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #1e293b; color: #38bdf8; padding: 14px 12px; font-weight: 800; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #334155; letter-spacing: 0.5px; }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .controls, .no-print { display: none !important; }
      .header-card { background: #fff; color: #000; border: 1px solid #000; }
      .kpi-card { background: #fff; border: 1px solid #ccc; color: #000; }
      th { background: #eee; color: #000; }
      tr, td { color: #000 !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- HEADER -->
    <div class="header-card">
      <div style="display: inline-block; background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; color: #38bdf8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">
        🏛️ BAN CHỦ NHIỆM CLB TIN HỌC NK • RECRUITMENT PORTAL 2026
      </div>
      <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 28px; font-weight: 900; letter-spacing: 0.5px;">
        🚀 BÁO CÁO TỔNG HỢP TOÀN BỘ HỒ SƠ ỨNG VIÊN & BÀI THI CASTING
      </h1>
      <p style="color: #94a3b8; margin: 0; font-size: 14px;">
        Báo cáo trích xuất trực tiếp từ Firestore Database phục vụ Ban Chủ Nhiệm đánh giá, xếp lịch phỏng vấn và công bố kết quả.
      </p>
    </div>

    <!-- STATS -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div style="color: #94a3b8; font-size: 13px; font-weight: 700; text-transform: uppercase;">Tổng số hồ sơ trong DB</div>
        <div class="kpi-num" style="color: #38bdf8;">${list.length}</div>
      </div>
      <div class="kpi-card">
        <div style="color: #94a3b8; font-size: 13px; font-weight: 700; text-transform: uppercase;">Ứng viên thực tế (Chính thức)</div>
        <div class="kpi-num" style="color: #4ade80;">${realList.length}</div>
      </div>
      <div class="kpi-card">
        <div style="color: #94a3b8; font-size: 13px; font-weight: 700; text-transform: uppercase;">Ban Chuyên Môn</div>
        <div class="kpi-num" style="color: #38bdf8;">${deptCounts['chuyen-mon'] || 0}</div>
      </div>
      <div class="kpi-card">
        <div style="color: #94a3b8; font-size: 13px; font-weight: 700; text-transform: uppercase;">Ban Truyền Thông</div>
        <div class="kpi-num" style="color: #fb7185;">${deptCounts['truyen-thong'] || 0}</div>
      </div>
      <div class="kpi-card">
        <div style="color: #94a3b8; font-size: 13px; font-weight: 700; text-transform: uppercase;">Ban Nhân Sự</div>
        <div class="kpi-num" style="color: #c084fc;">${deptCounts['nhan-su'] || 0}</div>
      </div>
    </div>

    <!-- CONTROLS -->
    <div class="controls no-print">
      <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        <span style="color: #94a3b8; font-size: 13px; font-weight: 700;">LỌC BAN:</span>
        <button class="filter-btn active" onclick="filterDept('all', this)">Tất Cả (${realList.length})</button>
        <button class="filter-btn" onclick="filterDept('chuyen-mon', this)">Ban Chuyên Môn (${deptCounts['chuyen-mon'] || 0})</button>
        <button class="filter-btn" onclick="filterDept('truyen-thong', this)">Ban Truyền Thông (${deptCounts['truyen-thong'] || 0})</button>
        <button class="filter-btn" onclick="filterDept('nhan-su', this)">Ban Nhân Sự (${deptCounts['nhan-su'] || 0})</button>
      </div>

      <div style="display: flex; gap: 10px; align-items: center;">
        <input type="text" class="search-input" id="searchInput" placeholder="🔍 Tìm tên, lớp, SĐT, email..." oninput="searchCandidates()" />
        <button class="print-btn" onclick="window.print()">
          🖨️ In Báo Cáo / Xuất PDF
        </button>
      </div>
    </div>

    <!-- SECTION 1: HỒ SƠ ỨNG VIÊN CHÍNH THỨC -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h2 style="color: #38bdf8; font-size: 20px; font-weight: 900; margin: 0;">
        🌟 1. DANH SÁCH ${realList.length} ỨNG VIÊN CHÍNH THỨC (ĐÃ LỌC TRÙNG & LOẠI TEST)
      </h2>
      <span style="color: #94a3b8; font-size: 13px;">Kèm trọn vẹn câu hỏi & câu trả lời casting</span>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">STT</th>
            <th>Họ và Tên</th>
            <th>Lớp / Trường</th>
            <th>Email</th>
            <th>SĐT / Zalo</th>
            <th>Ban</th>
            <th>Vị Trí Chuyên Môn</th>
            <th>Điểm AI</th>
            <th>Thời Gian Nộp</th>
          </tr>
        </thead>
        ${officialRowsHtml}
      </table>
    </div>

    <!-- SECTION 2: CÁC LƯỢT NỘP TEST / SPAM -->
    <div style="margin-top: 40px; margin-bottom: 12px;" class="no-print">
      <h3 style="color: #94a3b8; font-size: 16px; font-weight: 800; margin: 0;">
        🧪 2. CÁC LƯỢT NỘP TEST GIAO DIỆN & THỬ NGHIỆM HỆ THỐNG (${testList.length} lượt)
      </h3>
      <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0;">(Dành cho kỹ thuật đối soát, Ban Chủ Nhiệm không cần chấm các lượt này)</p>
    </div>

    <div class="table-container no-print" style="opacity: 0.85;">
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">STT</th>
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
        ${testRowsHtml}
      </table>
    </div>

    <!-- FOOTER -->
    <div style="text-align: center; color: #64748b; font-size: 13px; margin: 40px 0 20px 0; border-top: 1px solid #1e293b; padding-top: 20px;">
      Hệ thống tuyển thành viên CLB Tin Học NK 2026 • Trích xuất lúc: ${new Date().toLocaleString('vi-VN')}
    </div>

  </div>

  <script>
    let currentDept = 'all';

    function filterDept(dept, btn) {
      currentDept = dept;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      applyFilters();
    }

    function searchCandidates() {
      applyFilters();
    }

    function applyFilters() {
      const q = (document.getElementById('searchInput').value || '').toLowerCase().trim();
      const rows = document.querySelectorAll('.candidate-row');

      rows.forEach(r => {
        const rowDept = r.getAttribute('data-dept');
        const rowSearch = r.getAttribute('data-search') || '';

        const matchDept = (currentDept === 'all' || rowDept === currentDept);
        const matchSearch = (!q || rowSearch.includes(q));

        if (matchDept && matchSearch) {
          r.style.display = '';
        } else {
          r.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync('DANH_SACH_UNG_VIEN.html', masterHtml, 'utf8');
  fs.writeFileSync('BAO_CAO_TUYEN_QUAN_GUI_CHU_NHIEM.html', masterHtml, 'utf8');
  console.log('✅ Đã xuất báo cáo master ra 2 file:');
  console.log('   - DANH_SACH_UNG_VIEN.html');
  console.log('   - BAO_CAO_TUYEN_QUAN_GUI_CHU_NHIEM.html');

  // Also create a clean Markdown file
  let mdContent = `# BÁO CÁO TỔNG HỢP TOÀN BỘ HỒ SƠ ỨNG VIÊN TUYỂN QUÂN CLB TIN HỌC NK 2026
*Kính gửi: Ban Chủ Nhiệm CLB Tin Học NK*
*Thời gian trích xuất: ${new Date().toLocaleString('vi-VN')}*

---

## 📊 1. THỐNG KÊ TỔNG QUAN (KPI SUMMARY)
- **Tổng số lượt nộp trong cơ sở dữ liệu:** ${list.length} lượt
- **Tổng số ứng viên thực tế chính thức:** ${realList.length} bạn
- **Ban Chuyên Môn (Tech Core):** ${deptCounts['chuyen-mon'] || 0} ứng viên
- **Ban Truyền Thông & Sáng Tạo:** ${deptCounts['truyen-thong'] || 0} ứng viên
- **Ban Quản Lý Nhân Sự & Sự Kiện:** ${deptCounts['nhan-su'] || 0} ứng viên

---

## 🌟 2. DANH SÁCH CHI TIẾT TỪNG ỨNG VIÊN CHÍNH THỨC

`;

  realList.forEach((app, idx) => {
    const deptDisplay = app.departmentName || (app.department === 'truyen-thong' ? 'Ban Truyền Thông' : app.department === 'nhan-su' ? 'Ban Nhân Sự' : 'Ban Chuyên Môn');
    mdContent += `### #${idx + 1}. ${app.fullName} (${app.studentClass} - ${app.schoolName || 'THPT'})\n`;
    mdContent += `- **Email:** ${app.email}\n`;
    mdContent += `- **Số điện thoại / Zalo:** ${app.phone}\n`;
    if (app.facebook) mdContent += `- **Facebook:** ${app.facebook}\n`;
    mdContent += `- **Ban ứng tuyển:** **${deptDisplay}**\n`;
    mdContent += `- **Vị trí chuyên môn:** ${app.subRole || 'Chưa phân định'}\n`;
    if (app.skills) mdContent += `- **Kỹ năng:** ${Array.isArray(app.skills) ? app.skills.join(', ') : app.skills}\n`;
    if (app.flexZone) mdContent += `- **Flex Zone / Sản phẩm:** ${app.flexZone}\n`;
    if (app.motivation) mdContent += `- **Lý do gia nhập:** ${app.motivation}\n`;
    mdContent += `- **Điểm AI đánh giá:** **${app.scoreByAI || 'N/A'} / 10** (${app.aiVibe || ''})\n`;
    if (app.aiReview) mdContent += `- **AI nhận xét:** *"${app.aiReview}"*\n`;

    const answered = castingFields.filter(f => app[f.key] && String(app[f.key]).trim().length > 0);
    if (answered.length > 0) {
      mdContent += `\n**📝 Chi tiết bài thi Casting Challenges:**\n`;
      answered.forEach(f => {
        mdContent += `> **${f.icon} ${f.label}:**\n> ${String(app[f.key]).replace(/\\n/g, '\\n> ')}\n>\n`;
      });
    }
    mdContent += `\n---\n\n`;
  });

  fs.writeFileSync('BAO_CAO_TUYEN_QUAN_GUI_CHU_NHIEM.md', mdContent, 'utf8');
  console.log('✅ Đã xuất bản tóm tắt văn bản: BAO_CAO_TUYEN_QUAN_GUI_CHU_NHIEM.md');

  await terminate(db);
}

exportAll().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

