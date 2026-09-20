import fs from 'fs';
import path from 'path';
import { parseSgsPdfReport } from '../src/engine/sgsPdfParser';
import { evaluateMultiSampleReport } from '../src/engine/labRulesEngine';

async function runTests() {
  console.log('================================================================');
  console.log('NIRIKSHAK — Multi-Sample Laboratory PDF Extraction & Evaluation Test');
  console.log('================================================================\n');

  // Locate test PDF
  const pdfCandidates = [
    path.join(process.cwd(), 'scratch', 'Heavy-metal-testing-pro-cocoa-coffee-whey-concentrate.pdf'),
    path.join('C:', 'Users', 'jaing', 'Downloads', 'Heavy-metal-testing-pro-cocoa-coffee-whey-concentrate.pdf'),
  ];
  let pdfPath = pdfCandidates.find(p => fs.existsSync(p));
  if (!pdfPath) {
    throw new Error('Test PDF Heavy-metal-testing-pro-cocoa-coffee-whey-concentrate.pdf not found!');
  }
  console.log(`[TEST 1] Loading PDF from: ${pdfPath}`);
  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log(`  -> Loaded ${pdfBuffer.length} bytes.`);

  // Parse PDF
  console.log('\n[TEST 2] Parsing Full PDF with SGS Multi-Sample Vector Engine...');
  const parseResult = await parseSgsPdfReport(pdfBuffer);

  // Assertions on Document-Level Extraction
  console.log(`  -> Pages Processed: ${parseResult.pagesProcessed} (Expected: 12)`);
  if (parseResult.pagesProcessed !== 12) {
    throw new Error(`Expected 12 pages processed, got ${parseResult.pagesProcessed}`);
  }

  console.log(`  -> Samples Detected: ${parseResult.samples.length} (Expected: 4)`);
  if (parseResult.samples.length !== 4) {
    throw new Error(`Expected 4 samples detected, got ${parseResult.samples.length}`);
  }

  console.log(`  -> Total Parameters Extracted: ${parseResult.totalParameters} (Expected: 160)`);
  if (parseResult.totalParameters !== 160) {
    throw new Error(`Expected 160 parameters extracted, got ${parseResult.totalParameters}`);
  }

  // Verify Samples
  const expectedSamples = [
    { id: 'CG23-017639.001', nameSnippet: 'PLAIN ISOLATE' },
    { id: 'CG23-017639.003', nameSnippet: 'COCOA' },
    { id: 'CG23-017639.002', nameSnippet: 'COFFEE' },
    { id: 'CG23-017030.001', nameSnippet: 'PLAIN' },
  ];

  expectedSamples.forEach((exp, idx) => {
    const s = parseResult.samples[idx];
    console.log(`\n[TEST 3.${idx + 1}] Sample ${idx + 1}: ${s.sample_name} [${s.sample_id}]`);
    if (!s.sample_id.includes(exp.id)) {
      throw new Error(`Sample ${idx + 1} ID mismatch: expected ${exp.id}, got ${s.sample_id}`);
    }
    if (!s.sample_name.includes(exp.nameSnippet)) {
      throw new Error(`Sample ${idx + 1} Name mismatch: expected snippet ${exp.nameSnippet}, got ${s.sample_name}`);
    }
    console.log(`  -> Parameter count: ${s.test_results.length} (Expected: 40)`);
    if (s.test_results.length !== 40) {
      throw new Error(`Sample ${idx + 1} expected 40 parameters, got ${s.test_results.length}`);
    }
    console.log(`  -> NABL Accredited count: ${s.accreditation_summary.nabl_count} (Expected: 7)`);
    console.log(`  -> Non-Accredited count: ${s.accreditation_summary.non_accredited_count} (Expected: 33)`);
  });

  // Evaluate Samples Against FSSAI Rules
  console.log('\n[TEST 4] Evaluating Samples Against FSSAI Regulatory Rules Database...');
  const evaluatedSamples = evaluateMultiSampleReport(parseResult.samples, 'PROCESSED_FOOD');

  // Verify Key Specific Test Cases
  console.log('\n[TEST 5] Verifying 11 Exact Test Cases:');

  // 1. Lead in Plain Isolate
  const s1 = evaluatedSamples[0];
  const lead1 = s1.findings.find(f => f.parameter.toLowerCase().includes('lead'));
  console.log(`  1. Lead in Plain Isolate: result="${lead1?.reported_result}", status=${lead1?.status}, LOQ=${lead1?.loq}`);
  if (!lead1 || lead1.status !== 'WITHIN_LIMIT' || lead1.loq !== '0.03') {
    throw new Error(`Lead in Plain Isolate failed: status=${lead1?.status}, loq=${lead1?.loq}`);
  }

  // 2. Arsenic in Plain Isolate
  const as1 = s1.findings.find(f => f.parameter.toLowerCase().includes('arsenic'));
  console.log(`  2. Arsenic in Plain Isolate: result="${as1?.reported_result}", status=${as1?.status}, LOQ=${as1?.loq}`);
  if (!as1 || as1.status !== 'NO_APPLICABLE_LIMIT' || as1.loq !== '0.05') {
    throw new Error(`Arsenic in Plain Isolate failed: status=${as1?.status}, loq=${as1?.loq}`);
  }

  // 3. Copper in Plain Isolate
  const cu1 = s1.findings.find(f => f.parameter.toLowerCase().includes('copper'));
  console.log(`  3. Copper in Plain Isolate: result="${cu1?.reported_result}", status=${cu1?.status}`);
  if (!cu1 || cu1.reported_result !== '0.51' || cu1.status !== 'NO_APPLICABLE_LIMIT') {
    throw new Error(`Copper in Plain Isolate failed: result=${cu1?.reported_result}, status=${cu1?.status}`);
  }

  // 4. Cocoa Cadmium
  const s2 = evaluatedSamples[1];
  const cd2 = s2.findings.find(f => f.parameter.toLowerCase().includes('cadmium'));
  console.log(`  4. Cadmium in Cocoa: result="${cd2?.reported_result}", status=${cd2?.status}`);
  if (!cd2 || cd2.reported_result !== '0.06' || cd2.status !== 'NO_APPLICABLE_LIMIT') {
    throw new Error(`Cadmium in Cocoa failed: result=${cd2?.reported_result}, status=${cd2?.status}`);
  }

  // 5. Cocoa Copper
  const cu2 = s2.findings.find(f => f.parameter.toLowerCase().includes('copper'));
  console.log(`  5. Copper in Cocoa: result="${cu2?.reported_result}", status=${cu2?.status}`);
  if (!cu2 || cu2.reported_result !== '4.47' || cu2.status !== 'NO_APPLICABLE_LIMIT') {
    throw new Error(`Copper in Cocoa failed: result=${cu2?.reported_result}, status=${cu2?.status}`);
  }

  // 6. Coffee Copper
  const s3 = evaluatedSamples[2];
  const cu3 = s3.findings.find(f => f.parameter.toLowerCase().includes('copper'));
  console.log(`  6. Copper in Coffee: result="${cu3?.reported_result}", status=${cu3?.status}`);
  if (!cu3 || cu3.reported_result !== '1.16' || cu3.status !== 'NO_APPLICABLE_LIMIT') {
    throw new Error(`Copper in Coffee failed: result=${cu3?.reported_result}, status=${cu3?.status}`);
  }

  // 7. Plain Protein Powder Copper
  const s4 = evaluatedSamples[3];
  const cu4 = s4.findings.find(f => f.parameter.toLowerCase().includes('copper'));
  console.log(`  7. Copper in Plain: result="${cu4?.reported_result}", status=${cu4?.status}`);
  if (!cu4 || cu4.reported_result !== '1.03' || cu4.status !== 'NO_APPLICABLE_LIMIT') {
    throw new Error(`Copper in Plain failed: result=${cu4?.reported_result}, status=${cu4?.status}`);
  }

  // 8. Aflatoxin B1
  const afb1 = s1.findings.find(f => f.parameter.toLowerCase().includes('aflatoxin b1'));
  console.log(`  8. Aflatoxin B1: result="${afb1?.reported_result}", status=${afb1?.status}, LOQ=${afb1?.loq}`);
  if (!afb1 || afb1.loq !== '1.0' || afb1.status !== 'NO_APPLICABLE_LIMIT') {
    throw new Error(`Aflatoxin B1 failed: loq=${afb1?.loq}, status=${afb1?.status}`);
  }

  // 9. Deoxynivalenol (DON)
  const don = s1.findings.find(f => f.parameter.toLowerCase().includes('don') || f.parameter.toLowerCase().includes('deoxynivalenol'));
  console.log(`  9. DON: result="${don?.reported_result}", status=${don?.status}, LOQ=${don?.loq}`);
  if (!don || don.loq !== '50.0' || don.status !== 'NO_APPLICABLE_LIMIT') {
    throw new Error(`DON failed: loq=${don?.loq}, status=${don?.status}`);
  }

  // 10. Melamine
  const mel = s1.findings.find(f => f.parameter.toLowerCase().includes('melamine'));
  console.log(`  10. Melamine: result="${mel?.reported_result}", status=${mel?.status}, LOQ=${mel?.loq}`);
  if (!mel || !mel.loq || mel.status !== 'NO_APPLICABLE_LIMIT') {
    throw new Error(`Melamine failed: loq=${mel?.loq}, status=${mel?.status}`);
  }

  // 11. Soyabean Allergen
  const soy = s1.findings.find(f => f.parameter.toLowerCase().includes('soyabean') || f.parameter.toLowerCase().includes('soybean'));
  console.log(`  11. Soyabean: result="${soy?.reported_result}", status=${soy?.status}`);
  if (!soy || soy.status !== 'NO_APPLICABLE_LIMIT') {
    throw new Error(`Soyabean failed: status=${soy?.status}`);
  }

  // Summary and Grade Assertions
  console.log('\n[TEST 6] Verifying Overall Grades and Absence of False Violations:');
  evaluatedSamples.forEach((s, idx) => {
    console.log(`  Sample ${idx + 1}: Grade=${s.grade_result?.grade} (Score=${s.grade_result?.score}), Above Limit=${s.summary.above_limit}, Within Limit=${s.summary.within_limit}`);
    if (s.summary.above_limit !== 0) {
      throw new Error(`Sample ${idx + 1} has false violations: above_limit=${s.summary.above_limit}`);
    }
    if (s.grade_result?.grade !== 'A') {
      throw new Error(`Sample ${idx + 1} expected Grade A, got ${s.grade_result?.grade}`);
    }
  });

  console.log('\n================================================================');
  console.log(' ALL TESTS PASSED SUCCESSFULLY! (100% COMPLIANT WITH CRITERIA)');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
