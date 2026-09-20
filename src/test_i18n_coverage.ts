import { en } from './locales/en';
import { hi } from './locales/hi';

function getLeafKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const fullKey = prefix ? `${prefix}.${k}` : k;
      if (typeof obj[k] === 'object' && obj[k] !== null) {
        keys = keys.concat(getLeafKeys(obj[k], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  return keys;
}

export function runI18nCoverageAudit() {
  console.log('====================================================');
  console.log('NIRIKSHAK i18n TRANSLATION COVERAGE AUDIT');
  console.log('====================================================\n');

  const enKeys = getLeafKeys(en);
  const hiKeys = getLeafKeys(hi);

  const missingInHi = enKeys.filter((k) => !hiKeys.includes(k));
  const missingInEn = hiKeys.filter((k) => !enKeys.includes(k));

  console.log(`Total English Keys: ${enKeys.length}`);
  console.log(`Total Hindi Keys:   ${hiKeys.length}`);
  console.log(`Missing Hindi Keys: ${missingInHi.length}`);
  console.log(`Missing English Keys: ${missingInEn.length}\n`);

  if (missingInHi.length > 0) {
    console.error('❌ [FAIL] Missing Hindi Translation Keys:');
    missingInHi.forEach((k) => console.error(`   - ${k}`));
  } else {
    console.log('✓ [PASS] All English keys have 100% matching Hindi translations.');
  }

  if (missingInEn.length > 0) {
    console.error('❌ [FAIL] Extra Hindi keys missing in English:');
    missingInEn.forEach((k) => console.error(`   - ${k}`));
  } else {
    console.log('✓ [PASS] All Hindi keys exist in English dictionary.');
  }

  const success = missingInHi.length === 0 && missingInEn.length === 0;

  console.log('\n====================================================');
  console.log(`AUDIT RESULT: ${success ? 'PASSED (100% COVERAGE)' : 'FAILED'}`);
  console.log('====================================================\n');

  if (!success) {
    process.exit(1);
  }
}

runI18nCoverageAudit();

