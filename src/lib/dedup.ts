import { ApplicationRecord } from '../types';

function calculateCompleteness(app: ApplicationRecord): number {
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

export function deduplicateApplicants(rawList: ApplicationRecord[]): ApplicationRecord[] {
  const map = new Map<string, ApplicationRecord>();

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

    const key = hasValidEmail ? rawEmail : `${nameWords}_${normClass}`;

    if (!key || key === '_' || key.length < 3) continue;

    // Check if an existing entry shares the exact same normalized name words
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

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}
