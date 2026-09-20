import { COMMODITY_SCHEMAS, getCategorySchema, SUPPORTED_SANDBOX_CATEGORIES } from './config/categorySchemas';
import { evaluateCompliance } from './engine/evaluator';
import { STATUTORY_RULES } from './engine/rules';
import { ProductCategory, ExtractedFields } from './types';

console.log('================================================================');
console.log('NIRIKSHAK CATEGORY AWARENESS & ISOLATION VERIFICATION SUITE');
console.log('================================================================\n');

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

// ─────────────────────────────────────────────────────────────────────────────
// 1. COSMETICS ISOLATION
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- 1. Testing COSMETICS & PERSONAL CARE Isolation ---');
const cosmeticSchema = getCategorySchema('PERSONAL_CARE_COSMETIC');
const cosmeticFieldKeys = cosmeticSchema.fields.map((f) => f.key);

assert(!cosmeticFieldKeys.includes('germinationPercentage'), 'Cosmetics schema has NO germinationPercentage field');
assert(!cosmeticFieldKeys.includes('geneticPurityPercentage'), 'Cosmetics schema has NO geneticPurityPercentage field');
assert(!cosmeticFieldKeys.includes('npkRatio'), 'Cosmetics schema has NO npkRatio field');
assert(!cosmeticFieldKeys.includes('fcoLicenseNumber'), 'Cosmetics schema has NO fcoLicenseNumber field');
assert(cosmeticFieldKeys.includes('cosmeticMfgLicense'), 'Cosmetics schema has cosmeticMfgLicense');
assert(cosmeticFieldKeys.includes('cosmeticIngredients'), 'Cosmetics schema has cosmeticIngredients (INCI)');

const cosmeticActs = cosmeticSchema.applicableActs.map((a) => a.actCode);
assert(!cosmeticActs.includes('SEEDS_ACT_1966'), 'Cosmetics applicable acts has ZERO Seeds Act references');
assert(!cosmeticActs.includes('FCO_1985'), 'Cosmetics applicable acts has ZERO FCO 1985 references');

const cosmeticEval = evaluateCompliance(cosmeticSchema.sampleProduct as ExtractedFields, 'PERSONAL_CARE_COSMETIC', false);
const hasSeedRuleInCosmetic = cosmeticEval.findings.some(
  (f) => f.actName.toLowerCase().includes('seed') || f.ruleId.includes('SEED') || f.title.toLowerCase().includes('germination')
);
const hasFcoRuleInCosmetic = cosmeticEval.findings.some(
  (f) => f.actName.toLowerCase().includes('fertilizer') || f.ruleId.includes('FCO') || f.title.toLowerCase().includes('nutrient')
);
assert(!hasSeedRuleInCosmetic, 'Evaluation of Cosmetics produces ZERO Seeds Act or germination findings');
assert(!hasFcoRuleInCosmetic, 'Evaluation of Cosmetics produces ZERO FCO 1985 findings');

// ─────────────────────────────────────────────────────────────────────────────
// 2. FOOD & BEVERAGE ISOLATION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 2. Testing FOOD & BEVERAGES Isolation ---');
const foodSchema = getCategorySchema('FOOD_BEVERAGE');
const foodFieldKeys = foodSchema.fields.map((f) => f.key);

assert(!foodFieldKeys.includes('germinationPercentage'), 'Food schema has NO germinationPercentage field');
assert(!foodFieldKeys.includes('npkRatio'), 'Food schema has NO npkRatio field');
assert(!foodFieldKeys.includes('cosmeticMfgLicense'), 'Food schema has NO cosmeticMfgLicense field');
assert(foodFieldKeys.includes('fssaiLicenseNumber'), 'Food schema has fssaiLicenseNumber');
assert(foodFieldKeys.includes('vegNonVegMark'), 'Food schema has vegNonVegMark');

const foodActs = foodSchema.applicableActs.map((a) => a.actCode);
assert(!foodActs.includes('SEEDS_ACT_1966') && !foodActs.includes('FCO_1985'), 'Food acts contain ZERO agriculture/fertilizer references');

const foodEval = evaluateCompliance(foodSchema.sampleProduct as ExtractedFields, 'FOOD_BEVERAGE', false);
const hasAgriInFood = foodEval.findings.some(
  (f) => f.actName.toLowerCase().includes('seed') || f.actName.toLowerCase().includes('fertilizer') || f.ruleId.includes('SEED') || f.ruleId.includes('FCO')
);
assert(!hasAgriInFood, 'Evaluation of Food produces ZERO Seeds Act or FCO findings');

// ─────────────────────────────────────────────────────────────────────────────
// 3. STATIONERY & OFFICE ISOLATION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 3. Testing STATIONERY & OFFICE Isolation ---');
const stationerySchema = getCategorySchema('STATIONERY_OFFICE');
const stationeryFieldKeys = stationerySchema.fields.map((f) => f.key);

assert(!stationeryFieldKeys.includes('germinationPercentage'), 'Stationery schema has NO germinationPercentage field');
assert(!stationeryFieldKeys.includes('geneticPurityPercentage'), 'Stationery schema has NO geneticPurityPercentage field');
assert(!stationeryFieldKeys.includes('npkRatio'), 'Stationery schema has NO npkRatio field');
assert(!stationeryFieldKeys.includes('fcoLicenseNumber'), 'Stationery schema has NO fcoLicenseNumber field');
assert(!stationeryFieldKeys.includes('cosmeticMfgLicense'), 'Stationery schema has NO cosmeticMfgLicense field');
assert(!stationeryFieldKeys.includes('fssaiLicenseNumber'), 'Stationery schema has NO fssaiLicenseNumber field');
assert(stationeryFieldKeys.includes('netQuantity'), 'Stationery schema includes standard Net Quantity');
assert(stationeryFieldKeys.includes('unitSalePrice'), 'Stationery schema includes Unit Sale Price');

const stationeryActs = stationerySchema.applicableActs.map((a) => a.actCode);
assert(stationeryActs.every((a) => !a.includes('SEED') && !a.includes('FCO')), 'Stationery applicable acts contain ZERO agricultural statutes');

const stationeryEval = evaluateCompliance(stationerySchema.sampleProduct as ExtractedFields, 'STATIONERY_OFFICE', false);
const hasAgriInStationery = stationeryEval.findings.some(
  (f) => f.actName.toLowerCase().includes('seed') || f.actName.toLowerCase().includes('fertilizer') || f.ruleId.includes('SEED') || f.ruleId.includes('FCO')
);
assert(!hasAgriInStationery, 'Evaluation of Stationery produces ZERO agricultural or fertilizer findings');

// ─────────────────────────────────────────────────────────────────────────────
// 4. AGRICULTURAL SEEDS & FERTILIZERS LEGITIMACY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 4. Testing Dedicated AGRICULTURAL SEEDS & FERTILIZERS Legitimacy ---');
const seedSchema = getCategorySchema('SEED_AGRICULTURE');
const seedFieldKeys = seedSchema.fields.map((f) => f.key);
assert(seedFieldKeys.includes('germinationPercentage'), 'Seeds schema correctly has germinationPercentage');
assert(seedFieldKeys.includes('geneticPurityPercentage'), 'Seeds schema correctly has geneticPurityPercentage');
assert(seedFieldKeys.includes('lotNumber'), 'Seeds schema correctly has lotNumber');

const seedEval = evaluateCompliance(seedSchema.sampleProduct as ExtractedFields, 'SEED_AGRICULTURE', false);
const hasGermInSeed = seedEval.findings.some((f) => f.ruleId === 'SEEDS-SEC06-GERM');
assert(hasGermInSeed, 'Seeds evaluation correctly triggers Seeds Act Section 6(a) Germination rule');

const fertilizerSchema = getCategorySchema('FERTILIZER_CHEMICAL');
const fertFieldKeys = fertilizerSchema.fields.map((f) => f.key);
assert(fertFieldKeys.includes('npkRatio'), 'Fertilizer schema correctly has npkRatio');
assert(fertFieldKeys.includes('fcoLicenseNumber'), 'Fertilizer schema correctly has fcoLicenseNumber');
assert(!fertFieldKeys.includes('germinationPercentage'), 'Fertilizer schema has NO seed germination field');

const fertEval = evaluateCompliance(fertilizerSchema.sampleProduct as ExtractedFields, 'FERTILIZER_CHEMICAL', false);
const hasFcoInFert = fertEval.findings.some((f) => f.ruleId === 'FCO-SCHED01-NUTRIENTS');
assert(hasFcoInFert, 'Fertilizer evaluation correctly triggers FCO 1985 Schedule 1 rule');

// ─────────────────────────────────────────────────────────────────────────────
// 5. CATEGORY SWITCHING SEQUENCE
// Sequence: Cosmetics -> Food -> Stationery -> Seeds -> Fertilizers -> Cosmetics
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 5. Testing Category Switching Sequence: Cosmetics -> Food -> Stationery -> Seeds -> Fertilizers -> Cosmetics ---');

// Simulated active state container
class SandboxFormSession {
  category: ProductCategory = 'PERSONAL_CARE_COSMETIC';
  fields: Record<string, any> = {};
  result: any = null;

  constructor() {
    this.switchTo('PERSONAL_CARE_COSMETIC');
  }

  switchTo(cat: ProductCategory) {
    this.category = cat;
    const schema = getCategorySchema(cat);
    // Wipe previous fields and load pristine category sample
    this.fields = JSON.parse(JSON.stringify(schema.sampleProduct));
    // Immediately clear previous evaluation results
    this.result = null;
  }

  evaluate() {
    const cleanFields: Record<string, any> = {};
    const schema = getCategorySchema(this.category);
    for (const f of schema.fields) {
      if (this.fields[f.key] !== undefined) {
        cleanFields[f.key] = this.fields[f.key];
      }
    }
    this.result = evaluateCompliance(cleanFields as any, this.category, false);
  }
}

const session = new SandboxFormSession();

// Step 1: Start at Cosmetics
session.evaluate();
assert(session.category === 'PERSONAL_CARE_COSMETIC', 'Step 1: Category is PERSONAL_CARE_COSMETIC');
assert(session.fields.cosmeticMfgLicense !== undefined, 'Step 1: Cosmetic licence is present');
assert(session.fields.germinationPercentage === undefined, 'Step 1: Stale germination is absent');
assert(!session.result.findings.some((f: any) => f.ruleId.includes('SEED')), 'Step 1: Zero seed findings in Cosmetics');

// Step 2: Switch to Food
session.switchTo('FOOD_BEVERAGE');
assert(session.category === 'FOOD_BEVERAGE', 'Step 2: Switched to FOOD_BEVERAGE');
assert(session.fields.fssaiLicenseNumber !== undefined, 'Step 2: FSSAI licence loaded');
assert(session.fields.cosmeticMfgLicense === undefined, 'Step 2: Previous cosmeticMfgLicense wiped clean');
assert(session.fields.germinationPercentage === undefined, 'Step 2: No germination in Food');
assert(session.result === null, 'Step 2: Previous evaluation result wiped clean');
session.evaluate();
assert(!session.result.findings.some((f: any) => f.ruleId.includes('COSM') || f.ruleId.includes('SEED')), 'Step 2: Food evaluation has zero cosmetic or seed findings');

// Step 3: Switch to Stationery
session.switchTo('STATIONERY_OFFICE');
assert(session.category === 'STATIONERY_OFFICE', 'Step 3: Switched to STATIONERY_OFFICE');
assert(session.fields.unitSalePrice !== undefined, 'Step 3: Stationery unitSalePrice loaded');
assert(session.fields.fssaiLicenseNumber === undefined, 'Step 3: Previous FSSAI licence wiped clean');
assert(session.fields.germinationPercentage === undefined, 'Step 3: No germination in Stationery');
assert(session.result === null, 'Step 3: Previous evaluation result wiped clean');
session.evaluate();
assert(
  !session.result.findings.some((f: any) => f.ruleId.includes('FSSAI') || f.ruleId.includes('SEED') || f.ruleId.includes('FCO')),
  'Step 3: Stationery evaluation has zero food or agricultural findings'
);

// Step 4: Switch to Seeds
session.switchTo('SEED_AGRICULTURE');
assert(session.category === 'SEED_AGRICULTURE', 'Step 4: Switched to SEED_AGRICULTURE');
assert(session.fields.germinationPercentage === 85.0, 'Step 4: Seed germination loaded (85.0%)');
assert(session.fields.unitSalePrice === undefined, 'Step 4: Previous stationery unitSalePrice wiped clean');
assert(session.result === null, 'Step 4: Previous evaluation result wiped clean');
session.evaluate();
assert(session.result.findings.some((f: any) => f.ruleId === 'SEEDS-SEC06-GERM'), 'Step 4: Seed evaluation triggers germination standard');

// Step 5: Switch to Fertilizers
session.switchTo('FERTILIZER_CHEMICAL');
assert(session.category === 'FERTILIZER_CHEMICAL', 'Step 5: Switched to FERTILIZER_CHEMICAL');
assert(session.fields.npkRatio === '19:19:19', 'Step 5: Fertilizer NPK ratio loaded (19:19:19)');
assert(session.fields.germinationPercentage === undefined, 'Step 5: Previous germination wiped clean');
assert(session.result === null, 'Step 5: Previous evaluation result wiped clean');
session.evaluate();
assert(session.result.findings.some((f: any) => f.ruleId === 'FCO-SCHED01-NUTRIENTS'), 'Step 5: Fertilizer evaluation triggers FCO nutrient rule');
assert(!session.result.findings.some((f: any) => f.ruleId.includes('SEED')), 'Step 5: Fertilizer evaluation has zero seed findings');

// Step 6: Switch back to Cosmetics
session.switchTo('PERSONAL_CARE_COSMETIC');
assert(session.category === 'PERSONAL_CARE_COSMETIC', 'Step 6: Returned to PERSONAL_CARE_COSMETIC');
assert(session.fields.cosmeticMfgLicense !== undefined, 'Step 6: Cosmetic licence restored');
assert(session.fields.npkRatio === undefined, 'Step 6: Fertilizer NPK ratio wiped clean');
assert(session.fields.germinationPercentage === undefined, 'Step 6: Seed germination is 100% absent');
assert(session.result === null, 'Step 6: Previous evaluation result wiped clean');
session.evaluate();
assert(
  !session.result.findings.some(
    (f: any) => f.actName.toLowerCase().includes('seed') || f.actName.toLowerCase().includes('fertilizer') || f.ruleId.includes('SEED') || f.ruleId.includes('FCO')
  ),
  'Step 6: Final Cosmetics evaluation has zero agricultural/fertilizer findings'
);

console.log('\n================================================================');
console.log(`SUMMARY: ${passCount} tests PASSED, ${failCount} tests FAILED.`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
