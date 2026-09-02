import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

async function inspect() {
  const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${config.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true })
  });
  const authData = await authRes.json();
  const token = authData.idToken;

  console.log('Testing custom DB:', config.firestoreDatabaseId);
  const url1 = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/applications`;
  const res1 = await fetch(url1, { headers: { 'Authorization': `Bearer ${token}` } });
  const data1 = await res1.json();
  console.log('Custom DB docs:', data1.documents ? data1.documents.length : (data1.error || '0 docs'));

  console.log('\nTesting default DB: (default)');
  const url2 = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/applications`;
  const res2 = await fetch(url2, { headers: { 'Authorization': `Bearer ${token}` } });
  const data2 = await res2.json();
  console.log('Default DB docs:', data2.documents ? data2.documents.length : (data2.error || '0 docs'));
  if (data2.documents) {
    data2.documents.forEach((d: any, i: number) => {
      console.log(`[${i+1}]`, d.fields?.fullName?.stringValue, '|', d.fields?.studentClass?.stringValue);
    });
  }
}

inspect().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
