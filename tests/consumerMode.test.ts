/**
 * NIRIKSHAK Consumer Mode — Comprehensive Automated Test Suite
 * Validates consumer-friendly analysis, nutrition evaluation,
 * cosmetic skin concerns, and secondary regulatory traceability.
 */

import {
  normalizeSingleIngredient,
  deduplicateIngredients,
} from '../src/engine/consumerNormalization';
import { evaluateConsumerIngredients } from '../src/engine/consumerRuleEngine';
import { CONSUMER_REGULATORY_RULES } from '../src/data/consumerRulesData';
import {
  getAllConsumerScans,
  saveConsumerScan,
  deleteConsumerScan,
} from '../src/server/consumerStore';
import { analyzeFoodProduct } from '../src/engine/foodConsumerAnalysisService';
import { analyzeCosmeticProduct } from '../src/engine/cosmeticConsumerAnalysisService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✓ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`✕ [FAIL] ${testName} - ${detail || 'Assertion failed'}`);
    failed++;
  }
}

console.log('====================================================');
console.log('NIRIKSHAK CONSUMER MODE — AUTOMATED TEST SUITE');
console.log('====================================================');

// TEST 1: Single food product image normalization & FSSAI rule evaluation
{
  const rawItems = [
    normalizeSingleIngredient('Sugar', 1),
    normalizeSingleIngredient('Citric Acid (INS 330)', 1),
    normalizeSingleIngredient('Potable Water', 1),
  ];
  const evalResult = evaluateConsumerIngredients(rawItems, { productDomain: 'FOOD' });
  assert(evalResult.domain === 'FOOD', 'TEST 1: Food Domain Recognition');
  assert(evalResult.summary.compliant >= 3, 'TEST 1: All standard food ingredients marked Compliant');
  assert(evalResult.ingredients[1].ruleId === 'FSSAI-ADD-330', 'TEST 1: Citric Acid matched FSSAI rule ID');
}

// TEST 2: Single cosmetic product image normalization & CDSCO rule evaluation
{
  const rawItems = [
    normalizeSingleIngredient('Aqua', 1),
    normalizeSingleIngredient('Glycerin', 1),
    normalizeSingleIngredient('Niacinamide', 1),
  ];
  const evalResult = evaluateConsumerIngredients(rawItems, { productDomain: 'COSMETIC' });
  assert(evalResult.domain === 'COSMETIC', 'TEST 2: Cosmetic Domain Recognition');
  assert(evalResult.ingredients[0].normalizedName === 'Water', 'TEST 2: Aqua mapped to Water for cosmetic');
  assert(evalResult.ingredients[2].ruleId === 'CDSCO-COS-001', 'TEST 2: Niacinamide matched CDSCO rule ID');
}

// TEST 3: Multi-image deduplication
{
  const img1Items = [
    normalizeSingleIngredient('Water', 1, { x: 10, y: 10, width: 20, height: 5 }),
    normalizeSingleIngredient('Sugar', 1, { x: 10, y: 20, width: 20, height: 5 }),
  ];
  const img2Items = [
    normalizeSingleIngredient('Sugar', 2, { x: 30, y: 40, width: 20, height: 5 }),
    normalizeSingleIngredient('Citric Acid', 2, { x: 30, y: 50, width: 20, height: 5 }),
  ];
  const combined = deduplicateIngredients([...img1Items, ...img2Items]);
  const sugarItem = combined.find((i) => i.normalizedName === 'Sugar');
  assert(combined.length === 3, 'TEST 3: Repeated ingredient deduplicated into 3 distinct items');
  assert(sugarItem !== undefined && sugarItem.sourceImages.length === 2, 'TEST 3: Sugar detected on both images [1, 2]');
  assert(sugarItem !== undefined && sugarItem.boundingBoxes.length === 2, 'TEST 3: Sugar preserves bounding boxes from both panels');
}

// TEST 4: OCR spelling error recovery
{
  const ocrMisread = normalizeSingleIngredient('Niacinamlde', 1);
  assert(ocrMisread.normalizedName === 'Niacinamide', 'TEST 4: Fuzzy matching normalized Niacinamlde to Niacinamide');
  assert(ocrMisread.originalText === 'Niacinamlde', 'TEST 4: Original OCR evidence preserved unaltered');
}

// TEST 5: Unknown ingredient must NEVER be called harmful/banned
{
  const unknownItem = normalizeSingleIngredient('ExoticRareRootExtractXYZ', 1);
  const evalResult = evaluateConsumerIngredients([unknownItem], { productDomain: 'FOOD' });
  const ing = evalResult.ingredients[0];
  assert(ing.ruleStatus === 'UNKNOWN_MANUAL_VERIFICATION', 'TEST 5: Unknown ingredient classified as UNKNOWN_MANUAL_VERIFICATION');
  assert(!ing.ruleStatus.includes('PROHIBITED'), 'TEST 5: Strict Check: Not classified as prohibited');
  assert(!ing.consumerExplanation?.toLowerCase().includes('harmful'), 'TEST 5: Strict Check: Plain explanation does NOT call it harmful');
}

// TEST 6: Conditional / Restricted ingredient with mandatory conditions & source
{
  const sunsetYellow = normalizeSingleIngredient('INS 110', 1);
  const evalResult = evaluateConsumerIngredients([sunsetYellow], { productDomain: 'FOOD' });
  const ing = evalResult.ingredients[0];
  assert(ing.ruleStatus === 'RESTRICTED_CONDITIONAL', 'TEST 6: Sunset Yellow FCF is RESTRICTED_CONDITIONAL');
  assert(ing.maximumLimit === '100 mg/kg', 'TEST 6: Statutory maximum limit (100 mg/kg) attached');
  assert(Boolean(ing.regulationName && ing.sourceDocument), 'TEST 6: Official FSSAI gazette reference attached');
}

// TEST 7: Prohibited / Banned ingredient evaluation
{
  const metanilYellow = normalizeSingleIngredient('Metanil Yellow', 1);
  const evalResult = evaluateConsumerIngredients([metanilYellow], { productDomain: 'FOOD' });
  const ing = evalResult.ingredients[0];
  assert(ing.ruleStatus === 'PROHIBITED_NOT_PERMITTED', 'TEST 7: Metanil Yellow is PROHIBITED_NOT_PERMITTED in food');
  assert(ing.ruleId === 'FSSAI-PRO-MY01', 'TEST 7: Matched exact Prohibition Rule ID');
}

// TEST 8: Domain Isolation (Cosmetic prohibited substance in Food context vs Cosmetic context)
{
  const hexachlorophene = normalizeSingleIngredient('Hexachlorophene', 1);
  const evalResult = evaluateConsumerIngredients([hexachlorophene], { productDomain: 'COSMETIC' });
  assert(evalResult.ingredients[0].ruleStatus === 'PROHIBITED_NOT_PERMITTED', 'TEST 8: Hexachlorophene prohibited under CDSCO Cosmetics Rules');
}

// TEST 9: Unclear product domain
{
  const item = normalizeSingleIngredient('Water', 1);
  const evalResult = evaluateConsumerIngredients([item], { productDomain: 'UNKNOWN' });
  assert(evalResult.domain === 'UNKNOWN', 'TEST 9: Domain remains UNKNOWN when uncertain');
}

// TEST 10: Drug Domain Non-Activation Safety Notice
{
  const item = normalizeSingleIngredient('Paracetamol', 1);
  const evalResult = evaluateConsumerIngredients([item], { productDomain: 'DRUG' });
  assert(evalResult.domain === 'DRUG', 'TEST 10: Drug domain identified');
  assert(
    evalResult.summary.attentionMessage.includes('Drug regulatory verification is not currently enabled'),
    'TEST 10: Mandatory non-activation notice displayed, no false safety claim'
  );
}

// TEST 11: Consumer Store Isolation
{
  const testScan = {
    id: `CSCAN-TEST-${Date.now()}`,
    createdAt: new Date().toISOString(),
    productName: 'Test Packaged Biscuit',
    domain: 'FOOD' as const,
    domainConfidence: 0.95,
    domainDeterminationReason: 'Test',
    images: [{ id: 'img-1', index: 1, dataUrl: 'data:image/png;base64,test' }],
    rawIngredientText: 'Wheat Flour, Sugar',
    ingredients: [],
    summary: { totalDetected: 2, compliant: 2, restricted: 0, prohibited: 0, unknown: 0, requiresAttention: 0, attentionMessage: 'OK' },
    disclaimer: 'Test disclaimer',
  };
  saveConsumerScan(testScan);
  const scans = getAllConsumerScans();
  const found = scans.some((s) => s.id === testScan.id);
  assert(found, 'TEST 11: Consumer scan stored in isolated consumer-scans store');
  deleteConsumerScan(testScan.id);
  const afterDelete = getAllConsumerScans().some((s) => s.id === testScan.id);
  assert(!afterDelete, 'TEST 11: Consumer scan deleted cleanly');
}

// TEST 12: Rule versioning and authoritative traceability
{
  const ruleCount = CONSUMER_REGULATORY_RULES.length;
  const allVersioned = CONSUMER_REGULATORY_RULES.every(
    (r) => r.regulation_version && r.source_document && r.consumer_explanation
  );
  assert(ruleCount >= 15, `TEST 12: At least 15 authoritative rules configured (found: ${ruleCount})`);
  assert(allVersioned, 'TEST 12: 100% of rules possess regulation_version, source_document, and plain-language explanation');
}

// TEST 13: Food Consumer Analysis — Nutrition Facts & Health Profile
{
  const ingredients = [
    normalizeSingleIngredient('Sugar', 1),
    normalizeSingleIngredient('Fully Hydrogenated Vegetable Fat', 1),
    normalizeSingleIngredient('Cocoa Butter', 1),
    normalizeSingleIngredient('Milk Solids', 1),
    normalizeSingleIngredient('Soya Lecithin (INS 322)', 1),
  ];

  const analysis = analyzeFoodProduct(ingredients, {
    productName: 'Truffle Selection',
    nutritionInput: {
      calories: 540,
      totalSugar: 46.0,
      addedSugar: 42.0,
      saturatedFat: 18.5,
      sodium: 85,
      protein: 5.4,
      fibre: 3.1,
      servingSize: '25g',
      basis: 'PER_100G',
    },
    declaredAllergens: ['Milk', 'Soy'],
  });

  const sugarMetric = analysis.nutritionPanel.totalSugar;
  const satFatMetric = analysis.nutritionPanel.saturatedFat;
  const sodiumMetric = analysis.nutritionPanel.sodium;

  assert(sugarMetric.level === 'HIGH', 'TEST 13: Sugar identified as HIGH (>15g/100g)');
  assert(satFatMetric.level === 'HIGH', 'TEST 13: Saturated Fat identified as HIGH (>5g/100g)');
  assert(sodiumMetric.level === 'LOW', 'TEST 13: Sodium identified as LOW (<=120mg/100g)');
  assert(analysis.quickSummary.some((s) => s.includes('sugar')), 'TEST 13: Quick summary includes sugar notice');
  assert(analysis.thingsToWatch.some((w) => w.id === 'watch-sugar'), 'TEST 13: Things to watch includes High in sugar');
  assert(analysis.goodToKnow.some((g) => g.id === 'good-sodium'), 'TEST 13: Good to know includes Low sodium fact');
}

// TEST 14: Food Allergens & Knowledge Base Mapping (No Unknown for Common Ingredients)
{
  const ingredients = [
    normalizeSingleIngredient('Sugar', 1),
    normalizeSingleIngredient('Palm Oil', 1),
    normalizeSingleIngredient('Wheat Flour', 1),
    normalizeSingleIngredient('Milk Solids', 1),
    normalizeSingleIngredient('Soya Lecithin', 1),
  ];

  const analysis = analyzeFoodProduct(ingredients, {
    productName: 'Milk Biscuit',
  });

  const hasMilk = analysis.allergens.some((a) => a.name.includes('Milk'));
  const hasSoy = analysis.allergens.some((a) => a.name.includes('Soy'));
  const hasWheat = analysis.allergens.some((a) => a.name.includes('Wheat'));

  assert(hasMilk && hasSoy && hasWheat, 'TEST 14: Accurately identified Milk, Soy, and Wheat allergens');

  // Verify common ingredients show NO_SPECIFIC_CONCERN and have everyday functions
  const palmOil = analysis.ingredientGroups.flatMap((g) => g.ingredients).find((i) => i.normalizedName.includes('Palm'));
  assert(palmOil?.consumerConcern === 'NO_SPECIFIC_CONCERN', 'TEST 14: Palm oil marked NO_SPECIFIC_CONCERN instead of Unknown');
  assert(Boolean(palmOil?.function), 'TEST 14: Palm oil assigned everyday function');
}

// TEST 15: Cosmetic Consumer Analysis — Skin Concerns & What Ingredients Do
{
  const ingredients = [
    normalizeSingleIngredient('Water', 1),
    normalizeSingleIngredient('Glycerin', 1),
    normalizeSingleIngredient('Fragrance', 1),
    normalizeSingleIngredient('Phenoxyethanol', 1),
  ];

  const cosmeticAnalysis = analyzeCosmeticProduct(ingredients, {
    productName: 'Moisturizing Face Cream',
  });

  const fragranceConcern = cosmeticAnalysis.possibleSkinConcerns.find((c) => c.title.includes('Fragrance'));
  const hasMoisturizers = cosmeticAnalysis.goodToKnow.some((g) => g.id === 'good-moisturizers');

  assert(fragranceConcern !== undefined, 'TEST 15: Fragrance flagged as possible skin concern');
  assert(hasMoisturizers, 'TEST 15: Glycerin recognized as moisturizing/hydrating ingredient');
  assert(cosmeticAnalysis.disclaimer.includes('vary from person to person'), 'TEST 15: Transparent skin reaction disclaimer included');
}

// TEST 16: Strict Guard: No Absolute Health Claims Generated
{
  const ingredients = [normalizeSingleIngredient('Sugar', 1)];
  const analysis = analyzeFoodProduct(ingredients, {
    nutritionInput: { totalSugar: 50 },
  });

  const allText = JSON.stringify(analysis).toLowerCase();
  assert(!allText.includes('100% healthy'), 'TEST 16: No "100% healthy" claim');
  assert(!allText.includes('completely safe'), 'TEST 16: No "completely safe" claim');
  assert(!allText.includes('toxic'), 'TEST 16: No "toxic" claim');
  assert(!allText.includes('damages liver'), 'TEST 16: No "damages liver" claim');
  assert(!allText.includes('causes cancer'), 'TEST 16: No "causes cancer" claim');
}

console.log('====================================================');
console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
