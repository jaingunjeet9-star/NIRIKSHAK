import assert from 'assert';
import { evaluateCompliance, getStatutoryRationale } from './engine/evaluator';
import { generateInspectionEvidenceHash, computeSha256 } from './lib/cryptoHash';
import { ExtractedFields, ProductCategory, BoundingBox } from './types';

console.log('🧪 RUNNING NIRIKSHAK ROADMAP PHASE 1 TEST SUITE...\n');

let totalPassed = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then(() => {
        console.log(`  ✓ PASS: ${name}`);
        totalPassed++;
      }).catch((err) => {
        console.error(`  ✗ FAIL: ${name}`);
        console.error(err);
        process.exit(1);
      });
    } else {
      console.log(`  ✓ PASS: ${name}`);
      totalPassed++;
    }
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function runAll() {
  console.log('--- 1. MRP OVERCHARGING DETECTOR (LM ACT SEC 36 & RULE 18) ---');

  runTest('Triggers VIOLATION when actual selling price exceeds printed MRP', () => {
    const fields: ExtractedFields = {
      productName: 'Herbal Face Wash 150ml',
      mrp: '₹100.00',
      mrpValue: 100,
      actualSellingPrice: 120, // Overcharge by ₹20 (20%)
      netQuantity: '150 ml',
    };

    const result = evaluateCompliance(fields, 'PERSONAL_CARE_COSMETIC', false);
    const overchargeFinding = result.findings.find((f) => f.ruleId === 'LMPC-R18-OVERCHARGE');

    assert(overchargeFinding !== undefined, 'LMPC-R18-OVERCHARGE rule must be evaluated');
    assert.strictEqual(overchargeFinding.status, 'VIOLATION', 'Must be flagged as VIOLATION');
    assert.strictEqual(overchargeFinding.severity, 'CRITICAL', 'Must have CRITICAL severity');
    assert(overchargeFinding.detectedText.includes('₹120'), 'Must show selling price in detected text');
    assert(overchargeFinding.detectedText.includes('₹100'), 'Must show printed MRP in detected text');
    assert(overchargeFinding.detectedText.includes('+₹20'), 'Must show +₹20 overcharge difference');
    assert(overchargeFinding.detectedText.includes('+20%'), 'Must show +20% overcharge percentage');
    assert(overchargeFinding.explanation.includes('Section 36(1)'), 'Must cite LM Act 2009 Section 36(1)');
    assert(overchargeFinding.explanation.includes('Rule 18(2)'), 'Must cite LM(PC) Rule 18(2)');
    assert.strictEqual(fields.mrpOverchargeAmount, 20, 'Must record overcharge amount in extractedFields');
    assert.strictEqual(fields.mrpOverchargePercent, 20, 'Must record overcharge percent in extractedFields');
  });

  runTest('Marks VERIFIED when actual selling price is equal to printed MRP', () => {
    const fields: ExtractedFields = {
      productName: 'Cold Pressed Coconut Oil 500ml',
      mrp: '₹250.00',
      mrpValue: 250,
      actualSellingPrice: 250, // Compliant
      netQuantity: '500 ml',
    };

    const result = evaluateCompliance(fields, 'FOOD_BEVERAGE', false);
    const overchargeFinding = result.findings.find((f) => f.ruleId === 'LMPC-R18-OVERCHARGE');

    assert(overchargeFinding !== undefined, 'LMPC-R18-OVERCHARGE rule must be evaluated');
    assert.strictEqual(overchargeFinding.status, 'VERIFIED', 'Must be flagged as VERIFIED');
    assert(overchargeFinding.explanation.includes('does not exceed'), 'Explanation must confirm compliance');
  });

  runTest('Marks VERIFIED when actual selling price is discounted below printed MRP', () => {
    const fields: ExtractedFields = {
      productName: 'Premium Basmati Rice 5kg',
      mrp: '₹500.00',
      mrpValue: 500,
      actualSellingPrice: 450, // Discounted by ₹50
      netQuantity: '5 kg',
    };

    const result = evaluateCompliance(fields, 'FOOD_BEVERAGE', false);
    const overchargeFinding = result.findings.find((f) => f.ruleId === 'LMPC-R18-OVERCHARGE');

    assert(overchargeFinding !== undefined, 'LMPC-R18-OVERCHARGE rule must be evaluated');
    assert.strictEqual(overchargeFinding.status, 'VERIFIED', 'Must be VERIFIED when discounted');
  });

  runTest('Omits overcharge finding when actual selling price is not entered by inspector', () => {
    const fields: ExtractedFields = {
      productName: 'Ballpoint Pen Pack of 5',
      mrp: '₹50.00',
      mrpValue: 50,
      netQuantity: '5 N',
    };

    const result = evaluateCompliance(fields, 'STATIONERY_OFFICE', false);
    const overchargeFinding = result.findings.find((f) => f.ruleId === 'LMPC-R18-OVERCHARGE');

    assert.strictEqual(overchargeFinding, undefined, 'Must not generate overcharge finding when selling price is not provided');
  });

  console.log('\n--- 2. "WHY THIS RULE APPLIES" STATUTORY RATIONALE EXPLAINABILITY ---');

  runTest('Attaches statutory rationale to every finding', () => {
    const fields: ExtractedFields = {
      productName: 'Sunscreen SPF 50',
      mrp: '₹399.00',
      netQuantity: '100 ml',
    };

    const result = evaluateCompliance(fields, 'PERSONAL_CARE_COSMETIC', false);
    assert(result.findings.length > 0, 'Must have findings');

    for (const f of result.findings) {
      assert(f.statutoryRationale && f.statutoryRationale.trim().length > 0, `Finding ${f.ruleId} must have statutoryRationale`);
      // Non-agri product MUST NOT have agricultural references in rationale
      assert(!f.statutoryRationale.includes('Seeds Act 1966'), `Finding ${f.ruleId} must not cite Seeds Act for cosmetics`);
      assert(!f.statutoryRationale.includes('FCO 1985'), `Finding ${f.ruleId} must not cite FCO for cosmetics`);
    }
  });

  runTest('Category-aware rationale for Food and Beverage includes FSSAI', () => {
    const rationale = getStatutoryRationale('FSSAI-LIC-14DIGIT', 'FOOD_BEVERAGE');
    assert(rationale.includes('Food Safety and Standards Regulations 2020'), 'Must reference FSSAI');
  });

  runTest('Category-aware rationale for Cosmetics includes CDSCO Cosmetics Rules', () => {
    const rationale = getStatutoryRationale('COSM-R34-INGREDIENTS', 'PERSONAL_CARE_COSMETIC');
    assert(rationale.includes('Cosmetics Rules 2020'), 'Must reference Cosmetics Rules');
  });

  console.log('\n--- 3. VISUAL EVIDENCE LINKING ("SHOW ME WHERE THE VIOLATION IS") ---');

  runTest('Links finding to matching bounding box ID and evidence side', () => {
    const fields: ExtractedFields = {
      productName: 'Cotton T-Shirt',
      mrp: '₹499.00',
      netQuantity: '1 N',
    };

    const boundingBoxes: BoundingBox[] = [
      {
        id: 'box-mrp-101',
        field: 'mrp',
        label: 'MRP (Inclusive of Taxes)',
        value: '₹499.00',
        confidence: 0.98,
        status: 'VERIFIED',
        x: 10,
        y: 20,
        width: 30,
        height: 10,
        sourceSide: 'BACK',
        sourceImageIndex: 1,
      },
      {
        id: 'box-name-102',
        field: 'productname',
        label: 'Product Identity',
        value: 'Cotton T-Shirt',
        confidence: 0.95,
        status: 'VERIFIED',
        x: 10,
        y: 5,
        width: 50,
        height: 12,
        sourceSide: 'FRONT',
        sourceImageIndex: 0,
      },
    ];

    const result = evaluateCompliance(fields, 'APPAREL_TEXTILE', false, boundingBoxes);
    const mrpFinding = result.findings.find((f) => f.ruleId === 'LMPC-R06-1D');
    const nameFinding = result.findings.find((f) => f.ruleId === 'LMPC-R06-1A');

    assert(mrpFinding !== undefined, 'Must find MRP rule');
    assert.strictEqual(mrpFinding.targetBoundingBoxId, 'box-mrp-101', 'Must point to box-mrp-101');
    assert.strictEqual(mrpFinding.evidenceSide, 'BACK', 'Must identify BACK panel');

    assert(nameFinding !== undefined, 'Must find Name rule');
    assert.strictEqual(nameFinding.targetBoundingBoxId, 'box-name-102', 'Must point to box-name-102');
    assert.strictEqual(nameFinding.evidenceSide, 'FRONT', 'Must identify FRONT panel');
  });

  console.log('\n--- 4. TAMPER-EVIDENT SHA-256 CRYPTOGRAPHIC EVIDENCE DIGEST ---');

  await runTest('Computes 64-character hex SHA-256 hash', async () => {
    const hash = await computeSha256('NIRIKSHAK_TEST_PAYLOAD');
    assert.strictEqual(typeof hash, 'string');
    assert.strictEqual(hash.length, 64, 'SHA-256 must be exactly 64 hex characters');
  });

  await runTest('Generates deterministic evidence hash for inspection record', async () => {
    const inspectionSample = {
      id: 'INSP-2026-TEST-001',
      batchReference: 'BATCH-ALPHA-01',
      productName: 'Organic Almond Milk 1L',
      category: 'FOOD_BEVERAGE',
      extractedFields: {
        netQuantity: '1 L',
        mrp: '₹220.00',
        mrpValue: 220,
        actualSellingPrice: 220,
        manufacturerName: 'Healthy Beverages Pvt Ltd',
      },
      findings: [
        { ruleId: 'LMPC-R06-1A', status: 'VERIFIED', detectedText: 'Organic Almond Milk' },
        { ruleId: 'LMPC-R06-1B', status: 'VERIFIED', detectedText: '1 L' },
      ],
      createdAt: '2026-09-11T12:00:00Z',
    };

    const hash1 = await generateInspectionEvidenceHash(inspectionSample);
    const hash2 = await generateInspectionEvidenceHash(inspectionSample);

    assert.strictEqual(hash1, hash2, 'Hash must be strictly deterministic across repeated runs');
    assert.strictEqual(hash1.length, 64, 'Evidence digest must be 64 characters');

    // Modifying any critical parameter must produce a completely different hash
    const tampered = {
      ...inspectionSample,
      extractedFields: {
        ...inspectionSample.extractedFields,
        mrpValue: 250, // tampered price
      },
    };
    const tamperedHash = await generateInspectionEvidenceHash(tampered);
    assert.notStrictEqual(hash1, tamperedHash, 'Tampered payload must yield distinct cryptographic hash');
  });

  console.log(`\n🎉 ALL ${totalPassed} ROADMAP TESTS PASSED WITH ZERO ERRORS!\n`);
}

runAll().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
