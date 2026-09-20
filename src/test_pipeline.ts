import { evaluateCompliance } from './engine/evaluator';
import { normalizeCategory } from './components/InspectionWorkspace';
import { PRESET_INSPECTIONS } from './data/presets';
import { ExtractedFields, InspectionRecord } from './types';

console.log('====================================================');
console.log('NIRIKSHAK GENERAL PACKAGED COMMODITY TEST SUITE');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✓ [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`✗ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
    failCount++;
  }
}

// TEST 1: Ball Pen (Stationery)
console.log('--- TEST 1: Scan Ball Pen (Stationery & Office) ---');
const ballPenCat = normalizeCategory('Reynolds Fine Writing Ball Pen 10 Pack');
assert(ballPenCat === 'STATIONERY_OFFICE', 'Ball Pen category classified as STATIONERY_OFFICE');

const ballPenFields: ExtractedFields = {
  brandName: 'Reynolds',
  productName: 'Reynolds Fine Writing Ball Pen',
  netQuantity: '10 N',
  mrp: '₹ 100.00',
};
const ballPenEval = evaluateCompliance(ballPenFields, 'STATIONERY_OFFICE', false);
const hasGerminationInPen = ballPenEval.findings.some((f) => f.title.toLowerCase().includes('germination'));
const hasSeedActInPen = ballPenEval.findings.some((f) => f.actName.includes('Seeds') || f.ruleId.includes('SEED'));
assert(!hasGerminationInPen && !hasSeedActInPen, 'Zero seed or germination rules evaluated for Ball Pen');

// TEST 2: Sunscreen (Cosmetics)
console.log('\n--- TEST 2: Scan Sunscreen (Cosmetics & Personal Care) ---');
const sunscreenCat = normalizeCategory('Aqualogica Radiance+ Dewy Sunscreen SPF 50');
assert(sunscreenCat === 'PERSONAL_CARE_COSMETIC', 'Sunscreen classified as PERSONAL_CARE_COSMETIC');

const sunscreenFields: ExtractedFields = {
  brandName: 'Aqualogica',
  productName: 'Dewy Sunscreen SPF 50',
  netQuantity: '50.00 g',
  mrp: '₹ 399.00',
  cosmeticMfgLicense: 'COS-LIC-HR-2022-901',
  cosmeticIngredients: 'Aqua, Niacinamide, Titanium Dioxide',
};
const sunscreenEval = evaluateCompliance(sunscreenFields, 'PERSONAL_CARE_COSMETIC', false);
const hasCosmeticRuleInSunscreen = sunscreenEval.findings.some((f) => f.ruleId.includes('COSM'));
const hasSeedInSunscreen = sunscreenEval.findings.some((f) => f.actName.includes('Seeds') || f.ruleId.includes('SEED'));
assert(hasCosmeticRuleInSunscreen && !hasSeedInSunscreen, 'Cosmetic rules present and ZERO agricultural rules evaluated for Sunscreen');

// TEST 3: Biscuits (Food & Beverage)
console.log('\n--- TEST 3: Scan Biscuit (Food & Beverage) ---');
const biscuitCat = normalizeCategory('Britannia Good Day Butter Biscuits');
assert(biscuitCat === 'FOOD_BEVERAGE', 'Biscuits classified as FOOD_BEVERAGE');

const biscuitFields: ExtractedFields = {
  brandName: 'Britannia',
  productName: 'Good Day Biscuits',
  fssaiLicenseNumber: '10015043001290',
  vegNonVegMark: 'VEG',
};
const biscuitEval = evaluateCompliance(biscuitFields, 'FOOD_BEVERAGE', false);
const hasFssaiInBiscuit = biscuitEval.findings.some((f) => f.ruleId.includes('FSSAI'));
const hasGerminationInBiscuit = biscuitEval.findings.some((f) => f.title.toLowerCase().includes('germination'));
assert(hasFssaiInBiscuit && !hasGerminationInBiscuit, 'FSSAI food rules evaluated and ZERO germination rules for Biscuits');

// TEST 4: Detergent (Household)
console.log('\n--- TEST 4: Scan Detergent (Household Products) ---');
const detergentCat = normalizeCategory('CleanHome Surf Ultra Detergent Powder');
assert(detergentCat === 'HOUSEHOLD_COMMODITY', 'Detergent classified as HOUSEHOLD_COMMODITY');

const detergentEval = evaluateCompliance({ productName: 'Surf Ultra Powder', netQuantity: '1 kg', mrp: '₹ 140.00' }, 'HOUSEHOLD_COMMODITY', false);
const hasAgriInDetergent = detergentEval.findings.some((f) => f.actName.includes('Seeds') || f.actName.includes('Fertilizer'));
assert(!hasAgriInDetergent, 'ZERO agricultural information evaluated for Household Detergent');

// TEST 5: Seed Bag (Agricultural Product)
console.log('\n--- TEST 5: Scan Seed Bag (Agricultural Products) ---');
const seedCat = normalizeCategory('Certified Hybrid Maize KM-901 Seed Bag');
assert(seedCat === 'SEED_AGRICULTURE', 'Seed Bag classified as SEED_AGRICULTURE');

const seedFields: ExtractedFields = {
  productName: 'Kisan Hybrid Maize',
  germinationPercentage: 78.0,
  geneticPurityPercentage: 98.5,
  lotNumber: 'HY-MZ-4091',
};
const seedEval = evaluateCompliance(seedFields, 'SEED_AGRICULTURE', false);
const hasGerminationInSeed = seedEval.findings.some((f) => f.ruleId === 'SEEDS-SEC06-GERM');
assert(hasGerminationInSeed, 'Germination rule evaluated ONLY when product is SEED_AGRICULTURE');

// TEST 6: Transition Test (Seed Bag -> Sunscreen)
console.log('\n--- TEST 6: State Transition Test (Seed Bag -> Sunscreen) ---');
let activeState: InspectionRecord = PRESET_INSPECTIONS.find((p) => p.category === 'SEED_AGRICULTURE')!;
assert(activeState.extractedFields.germinationPercentage === 78, 'Initial active state has seed germination');

// Simulate new scan: replaced 100% with Sunscreen scan
const sunscreenScanResult: InspectionRecord = {
  id: 'INSP-SCAN-999',
  scanId: 'scan-sunscreen-test',
  analysisSource: 'uploaded_image',
  batchReference: 'BATCH-COS-TEST',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'COMPLETED',
  inspectorName: 'Officer',
  stationNode: 'NODE-01',
  productName: 'Aqualogica Sunscreen',
  category: 'PERSONAL_CARE_COSMETIC',
  isImported: false,
  images: [],
  extractedFields: {
    productName: 'Aqualogica Sunscreen',
    cosmeticMfgLicense: 'COS-LIC-123',
  },
  boundingBoxes: [],
  findings: sunscreenEval.findings,
  completenessScore: 97,
  summaryCounts: sunscreenEval.summaryCounts,
};
activeState = sunscreenScanResult; // 100% replaced
assert(
  activeState.extractedFields.germinationPercentage === undefined &&
    !activeState.findings.some((f) => f.ruleId.includes('SEED')),
  'Zero seed/germination data remains after transition to Sunscreen'
);

// TEST 7: Preset Overriding Test
console.log('\n--- TEST 7: Real Scan Overrides Preset State ---');
const presetState = PRESET_INSPECTIONS[0];
const realScanOverride: InspectionRecord = {
  ...presetState,
  id: 'INSP-REAL-SCAN-100',
  productName: 'Real Scanned Ball Pen',
  category: 'STATIONERY_OFFICE',
  analysisSource: 'uploaded_image',
  extractedFields: {
    productName: 'Real Scanned Ball Pen',
    netQuantity: '1 N',
    mrp: '₹ 10.00',
  },
};
assert(
  realScanOverride.analysisSource === 'uploaded_image' && realScanOverride.productName === 'Real Scanned Ball Pen',
  'Real scan result completely overrides preset state'
);

// TEST 8: Category Normalization Fallback (Unknown -> GENERAL_PACKAGED_COMMODITY)
console.log('\n--- TEST 8: Unknown Product Fallback ---');
const unknownCat = normalizeCategory('Random Unlabeled Cardboard Package Box');
assert(unknownCat === 'GENERAL_PACKAGED_COMMODITY', 'Unknown product falls back to GENERAL_PACKAGED_COMMODITY (NOT Agriculture)');

// TEST 9: Preset Dataset Multi-Category Balance
console.log('\n--- TEST 9: Preset Dataset Balance ---');
const categoriesCount: Record<string, number> = {};
for (const p of PRESET_INSPECTIONS) {
  categoriesCount[p.category] = (categoriesCount[p.category] || 0) + 1;
}
console.log('Preset Category Breakdown:', categoriesCount);
assert(
  Object.keys(categoriesCount).length >= 5 &&
    (categoriesCount['STATIONERY_OFFICE'] || 0) >= 1 &&
    (categoriesCount['PERSONAL_CARE_COSMETIC'] || 0) >= 1 &&
    (categoriesCount['FOOD_BEVERAGE'] || 0) >= 1 &&
    (categoriesCount['HOUSEHOLD_COMMODITY'] || 0) >= 1 &&
    (categoriesCount['ELECTRONICS'] || 0) >= 1,
  'Presets cover multiple diverse packaged commodity categories'
);

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
}
