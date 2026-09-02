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

function calculateCompleteness(app: any): number {
  let score = 0;
  if (app.fullName && app.fullName.length > 2) score += 10;
  if (app.phone && app.phone.length > 8) score += 10;
  if (app.facebook && String(app.facebook).startsWith('http')) score += 10;
  if (app.email && app.email.includes('@') && app.email.length > 6 && !app.email.endsWith('@')) score += 20;
  if (app.motivation && app.motivation.length > 5) score += app.motivation.length;
  if (app.castingDevQ1 && app.castingDevQ1 !== '.') score += app.castingDevQ1.length;
  if (app.castingGameQ1 && app.castingGameQ1 !== '.') score += app.castingGameQ1.length;
  if (app.castingCpQ1 && app.castingCpQ1 !== '.') score += app.castingCpQ1.length;
  if (app.castingHrQ1 && app.castingHrQ1 !== '.') score += app.castingHrQ1.length;
  if (app.castingContentQ1 && app.castingContentQ1 !== '.') score += app.castingContentQ1.length;
  if (app.castingDesignQ1 && app.castingDesignQ1 !== '.') score += app.castingDesignQ1.length;
  if (app.castingCamQ1 && app.castingCamQ1 !== '.') score += app.castingCamQ1.length;
  return score;
}

export function deduplicateApplicants(rawList: any[]): any[] {
  const map = new Map<string, any>();

  for (const app of rawList) {
    // Normalize name words (e.g. "Phạm Quốc Việt" & "Việt Quốc Phạm" -> same key)
    const nameWords = (app.fullName || '')
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .sort()
      .join('_');

    const normClass = (app.studentClass || '').toLowerCase().replace(/\s+/g, '');
    const rawEmail = (app.email || '').toLowerCase().trim();
    const hasValidEmail = rawEmail.includes('@') && rawEmail.length > 6 && !rawEmail.startsWith('@') && !rawEmail.endsWith('@');

    // Candidate unique key: email or normalized (nameWords + class)
    const key = hasValidEmail ? rawEmail : `${nameWords}_${normClass}`;

    if (!key || key === '_' || key.length < 3) continue;

    // Check if an entry with same nameWords exists even if email was invalid
    let matchedKey = key;
    for (const [existingKey, existingApp] of map.entries()) {
      const existingNameWords = (existingApp.fullName || '')
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .sort()
        .join('_');
      const existingClass = (existingApp.studentClass || '').toLowerCase().replace(/\s+/g, '');

      if (existingNameWords === nameWords && (existingClass === normClass || !existingClass || !normClass)) {
        matchedKey = existingKey;
        break;
      }
    }

    const existing = map.get(matchedKey);
    if (!existing) {
      map.set(matchedKey, app);
    } else {
      const existingScore = calculateCompleteness(existing);
      const currentScore = calculateCompleteness(app);
      if (currentScore >= existingScore) {
        map.set(matchedKey, app);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

async function run() {
  const OFFICIAL_LAUNCH_TIME = '2026-08-31T12:53:00.000Z';
  const snapshot = await getDocs(collection(db, 'applications'));
  const rawList: any[] = [];
  snapshot.forEach(d => {
    rawList.push({ id: d.id, ...d.data() });
  });

  const officialList = rawList.filter(a => (a.createdAt || '') >= OFFICIAL_LAUNCH_TIME);
  const deduped = deduplicateApplicants(officialList);
  console.log(`Total unique applicants: ${deduped.length}\n`);

  deduped.forEach((a, i) => {
    console.log(`[${i + 1}] ${a.fullName} | Lớp: ${a.studentClass} | Ban: ${a.departmentName || a.department} | Email: ${a.email} | DocID: ${a.id}`);
  });

  const vietList = deduped.filter(a => a.fullName?.includes('Việt') || a.fullName?.includes('Viet'));
  console.log(`\nViệt Quốc Phạm count in list: ${vietList.length} (DocID: ${vietList[0]?.id})`);

  await terminate(db);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
