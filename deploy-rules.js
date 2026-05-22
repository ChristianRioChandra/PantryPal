import { initializeApp, cert } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./firebaseServiceAccount.json', 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

async function deploy() {
  console.log('Reading firestore.rules...');
  const rulesContent = readFileSync('firestore.rules', 'utf8');

  console.log('Deploying Firestore security rules from source...');
  const rules = getSecurityRules();
  const ruleset = await rules.releaseFirestoreRulesetFromSource(rulesContent);

  console.log('SUCCESS! Firestore security rules deployed successfully.');
  console.log('Ruleset Name:', ruleset.name);
  console.log('Release Time:', ruleset.createTime);
}

deploy().catch((err) => {
  console.error('Failed to deploy Firestore security rules:');
  console.error('Message:', err.message);
  console.error('Code:', err.code);
  if (err.errorInfo) {
    console.error('ErrorInfo:', JSON.stringify(err.errorInfo, null, 2));
  }
  process.exit(1);
});
