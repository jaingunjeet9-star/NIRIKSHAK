/**
 * NIRIKSHAK — FSSAI Appendix A Food Additive Permission Engine
 *
 * Source: Food Safety and Standards (Food Products Standards and Food Additives)
 *         Regulations, 2011 — Version-XXIV (01.07.2022)
 *
 * Responsibilities:
 * 1. Categorizes food products to FSSAI food category codes (e.g., 1.1.1.1 for plain milk).
 * 2. Checks detected substances against the list of explicitly Prohibited Substances (Section 6).
 * 3. Identifies "No Additives Permitted" categories (e.g., untreated fresh fruit, plain milk, honey, salt).
 * 4. Stubs Tables 13 and 15 explicitly as MANUAL_REVIEW with exact regulatory disclaimers.
 * 5. Matches additive parameters using names, aliases, and INS numbers.
 * 6. Evaluates compliance against Appendix A rules:
 *    - "GMP" -> PERMITTED_GMP (never compared numerically)
 *    - Numeric limits -> compares normalized values (WITHIN_LIMIT or ABOVE_LIMIT)
 *    - Not found / incomplete reference -> MANUAL_REVIEW (never assumed safe or unsafe)
 *    - Not detected -> NOT_DETECTED
 * 7. Produces separate structured outputs:
 *    { contaminants: [...], microbiological: [...], additives: [...], summary: {...} }
 */

import {
  AdditiveComplianceFinding,
  AdditivePermissionStatus,
  FSSAIAdditiveRule,
  FSSAIProhibitedSubstance,
  LabComplianceFinding,
  LabReportSample,
  LabTestResult,
} from '../types';
import {
  FSSAI_ADDITIVE_ALIASES,
  FSSAI_ADDITIVE_RULES,
  FSSAI_ADDITIVE_RULES_SOURCE,
  FSSAI_ADDITIVE_RULES_VERSION,
  FSSAI_FOOD_CATEGORY_CODES,
  FSSAI_PROHIBITED_SUBSTANCES,
  TABLE13_MANUAL_REVIEW_STUB,
  TABLE14_PARTIAL_NOTE,
  TABLE15_MANUAL_REVIEW_STUB,
} from '../data/fssaiAdditiveRules';
import {
  convertUnit,
  normalizeParameterName,
  normalizeUnitString,
} from './labRulesEngine';

// ─────────────────────────────────────────────────────────────────────────────
// FOOD CATEGORY DETECTION (FSSAI Categorization System)
// ─────────────────────────────────────────────────────────────────────────────

interface CategoryMatch {
  code: string;
  name: string;
  confidence: number;
}

/**
 * Identify the applicable FSSAI Appendix A Food Category Code from product metadata.
 */
export function identifyFSSAICategoryCode(
  sample: LabReportSample,
  rawText?: string
): CategoryMatch {
  const rawCat = (sample.product_category || '').replace(/_/g, ' ');
  const rawSubCat = (sample.product_subcategory || '').replace(/_/g, ' ');
  const text = [
    sample.product_name || '',
    rawSubCat,
    rawCat,
    sample.additional_info || '',
    rawText || '',
  ]
    .join(' ')
    .toLowerCase();

  const directCategoryMap: Record<string, { code: string; name: string }> = {
    DAIRY: { code: '1.1.1.1', name: 'Milk (plain)' },
    EDIBLE_OILS_FATS: { code: '2.1.2', name: 'Vegetable oils and fats' },
    BEVERAGES: { code: '14.0', name: 'Beverages, excluding dairy products' },
    SPICES_CONDIMENTS: { code: '12.2.1', name: 'Herbs and spices' },
    SUGAR_CONFECTIONERY: { code: '5.2', name: 'Confectionery including hard and soft candy, nougats, etc.' },
    CEREAL_GRAIN: { code: '6.1', name: 'Whole, broken, or flaked grain, including rice' },
    FRUITS_VEGETABLES: { code: '4.1.1.1', name: 'Untreated fresh fruit' },
    MEAT_FISH: { code: '8.1.1', name: 'Fresh meat, poultry, and game' },
    FISH_SEAFOOD: { code: '9.1.1', name: 'Fresh fish' },
    PACKAGED_WATER: { code: '14.1.1.1', name: 'Natural mineral waters and packaged drinking water' },
    BAKERY: { code: '7.1', name: 'Bread and ordinary bakery wares' },
    SALT: { code: '12.1.1', name: 'Salt' },
  };

  // Explicit Table 13 matches (Particular nutritional uses / Infant / Dietary)
  if (
    /infant formula|baby food|infant milk|follow-up formula|weaning food|cerelac|medical purpose|special dietary|nutraceutical|health supplement/i.test(
      text
    )
  ) {
    return {
      code: '13.0',
      name: FSSAI_FOOD_CATEGORY_CODES['13.0'],
      confidence: 0.95,
    };
  }

  // Explicit Table 15 matches (Ready-to-eat savouries)
  if (
    /namkeen|bhujia|chips|potato chips|papad|chivda|kurkure|extruded snack|ready-to-eat savoury|savoury snack/i.test(
      text
    )
  ) {
    return {
      code: '15.0',
      name: FSSAI_FOOD_CATEGORY_CODES['15.0'],
      confidence: 0.92,
    };
  }

  // Table 1: Dairy
  if (/(skimmed|toned|pasteurised|pasteurized|raw|cow|buffalo)\s+milk/i.test(text) || text.includes('fresh milk') || text === 'milk') {
    return { code: '1.1.1.1', name: FSSAI_FOOD_CATEGORY_CODES['1.1.1.1'], confidence: 0.95 };
  }
  if (/buttermilk|chaas|mattha/i.test(text)) {
    return { code: '1.1.1.2', name: FSSAI_FOOD_CATEGORY_CODES['1.1.1.2'], confidence: 0.95 };
  }
  if (/flavoured milk|flavored milk|dairy drink|milkshake|chocolate milk/i.test(text)) {
    return { code: '1.1.2', name: FSSAI_FOOD_CATEGORY_CODES['1.1.2'], confidence: 0.92 };
  }
  if (/curd|dahi|yoghurt|yogurt|fermented milk|lassi/i.test(text)) {
    return { code: '1.2.1.2', name: FSSAI_FOOD_CATEGORY_CODES['1.2.1.2'], confidence: 0.9 };
  }
  if (/paneer|channa|cottage cheese/i.test(text)) {
    return { code: '1.6.1', name: FSSAI_FOOD_CATEGORY_CODES['1.6.1'], confidence: 0.92 };
  }
  if (/processed cheese|cheese spread|cheese slice/i.test(text)) {
    return { code: '1.6.4.1', name: FSSAI_FOOD_CATEGORY_CODES['1.6.4.1'], confidence: 0.92 };
  }
  if (/cheese/i.test(text)) {
    return { code: '1.6', name: FSSAI_FOOD_CATEGORY_CODES['1.6'], confidence: 0.85 };
  }
  if (/milk powder|dairy whitener|cream powder/i.test(text)) {
    return { code: '1.5.1', name: FSSAI_FOOD_CATEGORY_CODES['1.5.1'], confidence: 0.9 };
  }
  if (/condensed milk|evaporated milk|sweetened condensed|khoya|khoa|mawa/i.test(text)) {
    return { code: '1.3.1', name: FSSAI_FOOD_CATEGORY_CODES['1.3.1'], confidence: 0.92 };
  }
  if (/dairy dessert|ice cream mix|custard|kheer|shrikhand/i.test(text)) {
    return { code: '1.7', name: FSSAI_FOOD_CATEGORY_CODES['1.7'], confidence: 0.88 };
  }

  // Table 2: Fats and oils
  if (/ghee|butter oil|anhydrous milk fat/i.test(text)) {
    return { code: '2.1.1', name: FSSAI_FOOD_CATEGORY_CODES['2.1.1'], confidence: 0.95 };
  }
  if (/butter/i.test(text)) {
    return { code: '2.2.1', name: FSSAI_FOOD_CATEGORY_CODES['2.2.1'], confidence: 0.95 };
  }
  if (/margarine|fat spread/i.test(text)) {
    return { code: '2.2.2', name: FSSAI_FOOD_CATEGORY_CODES['2.2.2'], confidence: 0.9 };
  }
  if (/edible oil|vegetable oil|mustard oil|sunflower oil|soybean oil|groundnut oil|palm oil|refined oil/i.test(text)) {
    return { code: '2.1.2', name: FSSAI_FOOD_CATEGORY_CODES['2.1.2'], confidence: 0.92 };
  }

  // Table 3: Edible ices
  if (/ice candy|sorbet|ice cream|kulfi|edible ice/i.test(text)) {
    return { code: '3.0', name: FSSAI_FOOD_CATEGORY_CODES['3.0'], confidence: 0.9 };
  }

  // Table 4: Fruits and Vegetables
  if (/fresh fruit|fresh apple|fresh banana|fresh mango|fresh grape/i.test(text)) {
    return { code: '4.1.1.1', name: FSSAI_FOOD_CATEGORY_CODES['4.1.1.1'], confidence: 0.95 };
  }
  if (/dried fruit|raisin|sultana|prune|almond|cashew|walnut/i.test(text)) {
    return { code: '4.1.2.2', name: FSSAI_FOOD_CATEGORY_CODES['4.1.2.2'], confidence: 0.9 };
  }
  if (/jam|jelly|marmalade/i.test(text)) {
    return { code: '4.1.2.5', name: FSSAI_FOOD_CATEGORY_CODES['4.1.2.5'], confidence: 0.95 };
  }
  if (/pickle|achaar|fruit in vinegar/i.test(text)) {
    return { code: '4.1.2.3', name: FSSAI_FOOD_CATEGORY_CODES['4.1.2.3'], confidence: 0.9 };
  }
  if (/fresh vegetable|onion|potato|tomato|cabbage|cauliflower|spinach|carrot/i.test(text)) {
    return { code: '4.2.1.1', name: FSSAI_FOOD_CATEGORY_CODES['4.2.1.1'], confidence: 0.95 };
  }
  if (/frozen vegetable|canned vegetable|processed vegetable/i.test(text)) {
    return { code: '4.2.2', name: FSSAI_FOOD_CATEGORY_CODES['4.2.2'], confidence: 0.88 };
  }

  // Table 5: Confectionery
  if (/chocolate|cocoa/i.test(text)) {
    return { code: '5.1.3', name: FSSAI_FOOD_CATEGORY_CODES['5.1.3'], confidence: 0.95 };
  }
  if (/chewing gum|bubble gum/i.test(text)) {
    return { code: '5.3', name: FSSAI_FOOD_CATEGORY_CODES['5.3'], confidence: 0.95 };
  }
  if (/hard candy|boiled sweet|lollipop/i.test(text)) {
    return { code: '5.2.1', name: FSSAI_FOOD_CATEGORY_CODES['5.2.1'], confidence: 0.92 };
  }
  if (/candy|toffee|caramel candy|fudge/i.test(text)) {
    return { code: '5.2', name: FSSAI_FOOD_CATEGORY_CODES['5.2'], confidence: 0.9 };
  }

  // Table 6: Cereals
  if (/wheat grain|paddy|raw rice|cereal grain/i.test(text)) {
    return { code: '6.1', name: FSSAI_FOOD_CATEGORY_CODES['6.1'], confidence: 0.95 };
  }
  if (/atta|maida|wheat flour|corn starch|corn flour|starch/i.test(text)) {
    return { code: '6.2', name: FSSAI_FOOD_CATEGORY_CODES['6.2'], confidence: 0.9 };
  }
  if (/breakfast cereal|cornflakes|rolled oats|muesli/i.test(text)) {
    return { code: '6.3', name: FSSAI_FOOD_CATEGORY_CODES['6.3'], confidence: 0.92 };
  }
  if (/instant noodles|noodles|pasta|macaroni|vermicelli/i.test(text)) {
    return { code: '6.4.3', name: FSSAI_FOOD_CATEGORY_CODES['6.4.3'], confidence: 0.92 };
  }

  // Table 7: Bakery
  if (/bread|bun|loaf|baguette|roti/i.test(text)) {
    return { code: '7.1.1', name: FSSAI_FOOD_CATEGORY_CODES['7.1.1'], confidence: 0.95 };
  }
  if (/biscuit|cookie|cracker|cake|pastry|muffin/i.test(text)) {
    return { code: '7.2.1', name: FSSAI_FOOD_CATEGORY_CODES['7.2.1'], confidence: 0.95 };
  }

  // Table 8: Meat
  if (/fresh meat|raw chicken|raw mutton|raw beef|fresh poultry/i.test(text)) {
    return { code: '8.1.1', name: FSSAI_FOOD_CATEGORY_CODES['8.1.1'], confidence: 0.95 };
  }
  if (/sausage|salami|ham|cured meat|processed meat/i.test(text)) {
    return { code: '8.2', name: FSSAI_FOOD_CATEGORY_CODES['8.2'], confidence: 0.9 };
  }

  // Table 9: Fish
  if (/fresh fish|raw fish|fresh prawn|fresh shrimp/i.test(text)) {
    return { code: '9.1.1', name: FSSAI_FOOD_CATEGORY_CODES['9.1.1'], confidence: 0.95 };
  }
  if (/frozen fish|canned fish|canned tuna|sardine/i.test(text)) {
    return { code: '9.2.1', name: FSSAI_FOOD_CATEGORY_CODES['9.2.1'], confidence: 0.9 };
  }

  // Table 10: Eggs
  if (/fresh egg|raw egg/i.test(text)) {
    return { code: '10.1', name: FSSAI_FOOD_CATEGORY_CODES['10.1'], confidence: 0.95 };
  }

  // Table 11: Sweeteners
  if (/honey/i.test(text)) {
    return { code: '11.5', name: FSSAI_FOOD_CATEGORY_CODES['11.5'], confidence: 0.98 };
  }
  if (/jaggery|gur/i.test(text)) {
    return { code: '11.1.6', name: FSSAI_FOOD_CATEGORY_CODES['11.1.6'], confidence: 0.95 };
  }
  if (/sugar|white sugar/i.test(text)) {
    return { code: '11.1.1', name: FSSAI_FOOD_CATEGORY_CODES['11.1.1'], confidence: 0.92 };
  }

  // Table 12: Salts, spices, condiments, sauces
  if (/salt|iodized salt|common salt/i.test(text)) {
    return { code: '12.1.1', name: FSSAI_FOOD_CATEGORY_CODES['12.1.1'], confidence: 0.95 };
  }
  if (/spice|masala|turmeric powder|chilli powder|coriander powder/i.test(text)) {
    return { code: '12.2.1', name: FSSAI_FOOD_CATEGORY_CODES['12.2.1'], confidence: 0.92 };
  }
  if (/mayonnaise|salad dressing/i.test(text)) {
    return { code: '12.6.1', name: FSSAI_FOOD_CATEGORY_CODES['12.6.1'], confidence: 0.92 };
  }
  if (/ketchup|tomato sauce|chilli sauce/i.test(text)) {
    return { code: '12.6.2', name: FSSAI_FOOD_CATEGORY_CODES['12.6.2'], confidence: 0.92 };
  }
  if (/soup|broth/i.test(text)) {
    return { code: '12.5.1', name: FSSAI_FOOD_CATEGORY_CODES['12.5.1'], confidence: 0.9 };
  }

  // Table 14: Beverages
  if (/packaged drinking water|mineral water|natural mineral water/i.test(text)) {
    return { code: '14.1.1.1', name: FSSAI_FOOD_CATEGORY_CODES['14.1.1.1'], confidence: 0.95 };
  }
  if (/fruit juice|apple juice|orange juice|mango juice/i.test(text)) {
    return { code: '14.1.2.1', name: FSSAI_FOOD_CATEGORY_CODES['14.1.2.1'], confidence: 0.92 };
  }
  if (/beverage|soft drink|carbonated/i.test(text)) {
    return { code: '14.0', name: FSSAI_FOOD_CATEGORY_CODES['14.0'], confidence: 0.7 };
  }

  // Fallback: check directCategoryMap from sample.product_category
  if (sample.product_category && directCategoryMap[sample.product_category]) {
    return {
      code: directCategoryMap[sample.product_category].code,
      name: directCategoryMap[sample.product_category].name,
      confidence: 0.85,
    };
  }

  // Fallback generic category code
  return { code: '1.0', name: 'Food Product (Unspecified Category)', confidence: 0.3 };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROHIBITED SUBSTANCES CHECK (Section 6)
// ─────────────────────────────────────────────────────────────────────────────

export function checkProhibitedSubstance(
  parameterName: string
): FSSAIProhibitedSubstance | null {
  const norm = normalizeParameterName(parameterName);

  for (const item of FSSAI_PROHIBITED_SUBSTANCES) {
    const normSub = normalizeParameterName(item.substance_name);
    if (norm === normSub || norm.includes(normSub) || normSub.includes(norm)) {
      return item;
    }
    for (const alias of item.aliases) {
      const normAlias = normalizeParameterName(alias);
      if (norm === normAlias || norm.includes(normAlias) || normAlias.includes(norm)) {
        return item;
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIVE RULE MATCHING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes an additive name and resolves canonical form via alias map.
 */
export function resolveCanonicalAdditiveName(param: string): string {
  const norm = normalizeParameterName(param);

  for (const [canonical, aliases] of Object.entries(FSSAI_ADDITIVE_ALIASES)) {
    if (normalizeParameterName(canonical) === norm) return canonical;
    for (const alias of aliases) {
      const normAlias = normalizeParameterName(alias);
      if (norm === normAlias || norm.includes(normAlias) || normAlias.includes(norm)) {
        return canonical;
      }
    }
  }

  return norm;
}

/**
 * Extracts INS number from parameter name string if present (e.g., "INS 330", "E-330", "INS-211").
 */
export function extractInsNumber(param: string): string | null {
  const match = param.match(/(?:ins|e)\s*[-:]?\s*([0-9]{3,4}[a-z]?(?:\([i|v|x]+\))?)/i);
  return match ? match[1] : null;
}

/**
 * Finds applicable additive permission rule for a given additive parameter in a category.
 * Supports hierarchical fallback (e.g., 1.1.2 -> 1.1 -> 1.0).
 */
export function findAdditivePermissionRule(
  parameterName: string,
  categoryCode: string
): FSSAIAdditiveRule | null {
  const normParam = normalizeParameterName(parameterName);
  const canonicalName = resolveCanonicalAdditiveName(parameterName);
  const insNum = extractInsNumber(parameterName);

  // Generate category hierarchy to check (e.g. ['1.1.1.1', '1.1.1', '1.1', '1.0'])
  const codesToCheck: string[] = [];
  const parts = categoryCode.split('.');
  for (let i = parts.length; i >= 1; i--) {
    codesToCheck.push(parts.slice(0, i).join('.'));
  }

  // 1. First check if any ancestor category has "NO_ADDITIVES" rule
  for (const code of codesToCheck) {
    const sentinel = FSSAI_ADDITIVE_RULES.find(
      (r) => r.food_category_code === code && r.no_additives_permitted
    );
    if (sentinel) return sentinel;
  }

  // 2. Search for additive matching rule across hierarchy
  for (const code of codesToCheck) {
    const rulesInCat = FSSAI_ADDITIVE_RULES.filter(
      (r) => r.food_category_code === code && !r.no_additives_permitted
    );

    for (const rule of rulesInCat) {
      // INS match
      if (insNum && rule.ins_number && rule.ins_number.includes(insNum)) {
        return rule;
      }

      const ruleParam = normalizeParameterName(rule.additive_name);
      if (
        ruleParam === normParam ||
        ruleParam === canonicalName ||
        ruleParam.includes(canonicalName) ||
        canonicalName.includes(ruleParam)
      ) {
        return rule;
      }

      // Alias matches
      for (const alias of rule.additive_aliases) {
        const normAlias = normalizeParameterName(alias);
        if (
          normAlias === normParam ||
          normAlias === canonicalName ||
          normParam.includes(normAlias) ||
          normAlias.includes(normParam)
        ) {
          return rule;
        }
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIVE COMPLIANCE EVALUATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates a single lab test result against FSSAI Appendix A Food Additive regulations.
 */
export function evaluateAdditiveResult(
  result: LabTestResult,
  categoryCode: string,
  categoryName: string
): AdditiveComplianceFinding {
  const normParam = normalizeParameterName(result.parameter);
  const ins = extractInsNumber(result.parameter);

  // Check 1: Explicitly Prohibited Substance (Section 6)
  const prohibited = checkProhibitedSubstance(result.parameter);
  if (prohibited) {
    const isND = result.is_not_detected || result.detected_numeric === 0;
    return {
      id: `ADD-FIND-${result.id}-PROH`,
      detected_name: result.parameter,
      normalized_name: prohibited.substance_name,
      ins_number: ins,
      lab_value: result.result_text,
      lab_value_numeric: result.detected_numeric,
      lab_unit: result.unit,
      food_category_code: categoryCode,
      food_category_name: categoryName,
      matched_rule_id: prohibited.id,
      fssai_limit: 'PROHIBITED',
      fssai_unit: '',
      fssai_is_gmp: false,
      fssai_limit_numeric: 0,
      fssai_notes: prohibited.restriction,
      status: isND ? 'NOT_DETECTED' : 'PROHIBITED',
      explanation: isND
        ? `Prohibited substance ${prohibited.substance_name} was reported as Not Detected.`
        : `CRITICAL VIOLATION: "${prohibited.substance_name}" is an explicitly prohibited substance under FSSAI regulations (${prohibited.restriction}). Presence in food products is not permitted.`,
      source_page: prohibited.source_page,
      source_table: 'Prohibited Substances',
      source_document: FSSAI_ADDITIVE_RULES_SOURCE,
      severity: isND ? 'NONE' : 'CRITICAL',
      is_prohibited: true,
      requires_manual_review: false,
    };
  }

  // Check 2: Table 13 Stub (Foods for particular nutritional uses)
  if (categoryCode === '13.0' || categoryCode.startsWith('13.')) {
    return {
      id: `ADD-FIND-${result.id}-T13`,
      detected_name: result.parameter,
      normalized_name: normParam,
      ins_number: ins,
      lab_value: result.result_text,
      lab_value_numeric: result.detected_numeric,
      lab_unit: result.unit,
      food_category_code: categoryCode,
      food_category_name: categoryName,
      matched_rule_id: null,
      fssai_limit: null,
      fssai_unit: null,
      fssai_is_gmp: false,
      fssai_limit_numeric: null,
      fssai_notes: null,
      status: 'MANUAL_REVIEW',
      explanation: TABLE13_MANUAL_REVIEW_STUB.reason,
      source_page: '704',
      source_table: 'Table 13',
      source_document: FSSAI_ADDITIVE_RULES_SOURCE,
      severity: 'ADVISORY',
      is_prohibited: false,
      requires_manual_review: true,
    };
  }

  // Check 3: Table 15 Stub (Ready-to-eat savouries)
  if (categoryCode === '15.0' || categoryCode.startsWith('15.')) {
    return {
      id: `ADD-FIND-${result.id}-T15`,
      detected_name: result.parameter,
      normalized_name: normParam,
      ins_number: ins,
      lab_value: result.result_text,
      lab_value_numeric: result.detected_numeric,
      lab_unit: result.unit,
      food_category_code: categoryCode,
      food_category_name: categoryName,
      matched_rule_id: null,
      fssai_limit: null,
      fssai_unit: null,
      fssai_is_gmp: false,
      fssai_limit_numeric: null,
      fssai_notes: null,
      status: 'MANUAL_REVIEW',
      explanation: TABLE15_MANUAL_REVIEW_STUB.reason,
      source_page: 'Appendix A',
      source_table: 'Table 15',
      source_document: FSSAI_ADDITIVE_RULES_SOURCE,
      severity: 'ADVISORY',
      is_prohibited: false,
      requires_manual_review: true,
    };
  }

  // Check 4: Table 14 Partial Check (Beverages)
  if (categoryCode === '14.0' || (categoryCode.startsWith('14.') && !['14.1.1', '14.1.1.1', '14.1.1.2', '14.1.2.1'].includes(categoryCode))) {
    return {
      id: `ADD-FIND-${result.id}-T14`,
      detected_name: result.parameter,
      normalized_name: normParam,
      ins_number: ins,
      lab_value: result.result_text,
      lab_value_numeric: result.detected_numeric,
      lab_unit: result.unit,
      food_category_code: categoryCode,
      food_category_name: categoryName,
      matched_rule_id: null,
      fssai_limit: null,
      fssai_unit: null,
      fssai_is_gmp: false,
      fssai_limit_numeric: null,
      fssai_notes: null,
      status: 'MANUAL_REVIEW',
      explanation: TABLE14_PARTIAL_NOTE,
      source_page: '704',
      source_table: 'Table 14',
      source_document: FSSAI_ADDITIVE_RULES_SOURCE,
      severity: 'ADVISORY',
      is_prohibited: false,
      requires_manual_review: true,
    };
  }

  // Check 5: Look up matched rule in Appendix A
  const rule = findAdditivePermissionRule(result.parameter, categoryCode);

  // If No Additives Permitted for this category
  if (rule && rule.no_additives_permitted) {
    const isND = result.is_not_detected || result.detected_numeric === 0;
    return {
      id: `ADD-FIND-${result.id}-NAP`,
      detected_name: result.parameter,
      normalized_name: normParam,
      ins_number: ins,
      lab_value: result.result_text,
      lab_value_numeric: result.detected_numeric,
      lab_unit: result.unit,
      food_category_code: categoryCode,
      food_category_name: categoryName,
      matched_rule_id: rule.id,
      fssai_limit: 'NO_ADDITIVES',
      fssai_unit: 'NO_ADDITIVES',
      fssai_is_gmp: false,
      fssai_limit_numeric: 0,
      fssai_notes: 'No food additives permitted in this category',
      status: isND ? 'NOT_DETECTED' : 'NOT_PERMITTED',
      explanation: isND
        ? `Additive "${result.parameter}" was not detected in category "${categoryCode} (${categoryName})", where no additives are permitted.`
        : `VIOLATION: Category "${categoryCode} (${categoryName})" permits NO food additives. The presence of "${result.parameter}" is not permitted under FSSAI regulations.`,
      source_page: rule.source_page,
      source_table: rule.source_table,
      source_document: FSSAI_ADDITIVE_RULES_SOURCE,
      severity: isND ? 'NONE' : 'CRITICAL',
      is_prohibited: false,
      requires_manual_review: false,
    };
  }

  // If No rule matched in the dataset
  if (!rule) {
    return {
      id: `ADD-FIND-${result.id}-NOMATCH`,
      detected_name: result.parameter,
      normalized_name: normParam,
      ins_number: ins,
      lab_value: result.result_text,
      lab_value_numeric: result.detected_numeric,
      lab_unit: result.unit,
      food_category_code: categoryCode,
      food_category_name: categoryName,
      matched_rule_id: null,
      fssai_limit: null,
      fssai_unit: null,
      fssai_is_gmp: false,
      fssai_limit_numeric: null,
      fssai_notes: null,
      status: 'MANUAL_REVIEW',
      explanation: `Not found in this reference / Manual verification required. No matching FSSAI Appendix A entry was found for "${result.parameter}" in food category "${categoryCode} (${categoryName})". This does not automatically indicate the additive is permitted or prohibited.`,
      source_page: null,
      source_table: null,
      source_document: FSSAI_ADDITIVE_RULES_SOURCE,
      severity: 'ADVISORY',
      is_prohibited: false,
      requires_manual_review: true,
    };
  }

  // Not detected results
  if (result.is_not_detected || result.detected_numeric === 0) {
    return {
      id: `ADD-FIND-${result.id}-ND`,
      detected_name: result.parameter,
      normalized_name: rule.additive_name,
      ins_number: rule.ins_number || ins,
      lab_value: result.result_text,
      lab_value_numeric: result.detected_numeric,
      lab_unit: result.unit,
      food_category_code: rule.food_category_code,
      food_category_name: rule.food_category_name,
      matched_rule_id: rule.id,
      fssai_limit: rule.maximum_level,
      fssai_unit: rule.unit,
      fssai_is_gmp: rule.is_gmp,
      fssai_limit_numeric: rule.is_gmp ? null : parseFloat(rule.maximum_level),
      fssai_notes: rule.notes,
      status: 'NOT_DETECTED',
      explanation: `Result reported as Not Detected (${result.result_text}). Permitted up to ${rule.maximum_level} ${rule.unit}.`,
      source_page: rule.source_page,
      source_table: rule.source_table,
      source_document: FSSAI_ADDITIVE_RULES_SOURCE,
      severity: 'NONE',
      is_prohibited: false,
      requires_manual_review: false,
    };
  }

  // Check 6: GMP Rule (Good Manufacturing Practice)
  if (rule.is_gmp) {
    return {
      id: `ADD-FIND-${result.id}-GMP`,
      detected_name: result.parameter,
      normalized_name: rule.additive_name,
      ins_number: rule.ins_number || ins,
      lab_value: result.result_text,
      lab_value_numeric: result.detected_numeric,
      lab_unit: result.unit,
      food_category_code: rule.food_category_code,
      food_category_name: rule.food_category_name,
      matched_rule_id: rule.id,
      fssai_limit: 'GMP',
      fssai_unit: 'GMP',
      fssai_is_gmp: true,
      fssai_limit_numeric: null,
      fssai_notes: rule.notes,
      status: 'PERMITTED_GMP',
      explanation: `Additive "${rule.additive_name}" is permitted in category "${rule.food_category_code} (${rule.food_category_name})" subject to Good Manufacturing Practice (GMP). Under FSSAI regulations, GMP limits are not evaluated as a numeric threshold.`,
      source_page: rule.source_page,
      source_table: rule.source_table,
      source_document: FSSAI_ADDITIVE_RULES_SOURCE,
      severity: 'NONE',
      is_prohibited: false,
      requires_manual_review: false,
    };
  }

  // Check 7: Numeric Limit Comparison
  const limitNumeric = parseFloat(rule.maximum_level);
  if (isNaN(limitNumeric)) {
    return {
      id: `ADD-FIND-${result.id}-NONNUM`,
      detected_name: result.parameter,
      normalized_name: rule.additive_name,
      ins_number: rule.ins_number || ins,
      lab_value: result.result_text,
      lab_value_numeric: result.detected_numeric,
      lab_unit: result.unit,
      food_category_code: rule.food_category_code,
      food_category_name: rule.food_category_name,
      matched_rule_id: rule.id,
      fssai_limit: rule.maximum_level,
      fssai_unit: rule.unit,
      fssai_is_gmp: false,
      fssai_limit_numeric: null,
      fssai_notes: rule.notes,
      status: 'MANUAL_REVIEW',
      explanation: `Limit specified as "${rule.maximum_level} ${rule.unit}" requires manual review.`,
      source_page: rule.source_page,
      source_table: rule.source_table,
      source_document: FSSAI_ADDITIVE_RULES_SOURCE,
      severity: 'ADVISORY',
      is_prohibited: false,
      requires_manual_review: true,
    };
  }

  // Unit conversion
  let detectedValue = result.detected_numeric;
  if (detectedValue !== null && result.unit && rule.unit) {
    const conv = convertUnit(detectedValue, result.unit, rule.unit);
    if (conv) detectedValue = conv.convertedValue;
  }

  if (detectedValue === null) {
    return {
      id: `ADD-FIND-${result.id}-NODETVAL`,
      detected_name: result.parameter,
      normalized_name: rule.additive_name,
      ins_number: rule.ins_number || ins,
      lab_value: result.result_text,
      lab_value_numeric: null,
      lab_unit: result.unit,
      food_category_code: rule.food_category_code,
      food_category_name: rule.food_category_name,
      matched_rule_id: rule.id,
      fssai_limit: rule.maximum_level,
      fssai_unit: rule.unit,
      fssai_is_gmp: false,
      fssai_limit_numeric: limitNumeric,
      fssai_notes: rule.notes,
      status: 'MANUAL_REVIEW',
      explanation: `Detected numeric value could not be parsed from "${result.result_text}". Permitted maximum: ${rule.maximum_level} ${rule.unit}.`,
      source_page: rule.source_page,
      source_table: rule.source_table,
      source_document: FSSAI_ADDITIVE_RULES_SOURCE,
      severity: 'ADVISORY',
      is_prohibited: false,
      requires_manual_review: true,
    };
  }

  const isExceeded = detectedValue > limitNumeric;
  const status: AdditivePermissionStatus = isExceeded ? 'ABOVE_LIMIT' : 'WITHIN_LIMIT';

  return {
    id: `ADD-FIND-${result.id}-${status}`,
    detected_name: result.parameter,
    normalized_name: rule.additive_name,
    ins_number: rule.ins_number || ins,
    lab_value: result.result_text,
    lab_value_numeric: result.detected_numeric,
    lab_unit: result.unit,
    food_category_code: rule.food_category_code,
    food_category_name: rule.food_category_name,
    matched_rule_id: rule.id,
    fssai_limit: rule.maximum_level,
    fssai_unit: rule.unit,
    fssai_is_gmp: false,
    fssai_limit_numeric: limitNumeric,
    fssai_notes: rule.notes,
    status,
    explanation: isExceeded
      ? `VIOLATION: Detected ${result.result_text} exceeds FSSAI maximum permitted limit of ${rule.maximum_level} ${rule.unit} for category ${rule.food_category_code} (${rule.food_category_name}).${rule.notes ? ` Conditions/Notes: ${rule.notes}.` : ''}`
      : `WITHIN LIMIT: Detected ${result.result_text} is within FSSAI maximum permitted limit of ${rule.maximum_level} ${rule.unit} for category ${rule.food_category_code} (${rule.food_category_name}).${rule.notes ? ` Conditions/Notes: ${rule.notes}.` : ''}`,
    source_page: rule.source_page,
    source_table: rule.source_table,
    source_document: FSSAI_ADDITIVE_RULES_SOURCE,
    severity: isExceeded ? 'MAJOR' : 'NONE',
    is_prohibited: false,
    requires_manual_review: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMETER TYPE CLASSIFIER
// ─────────────────────────────────────────────────────────────────────────────

export type ParameterClassification = 'CONTAMINANT' | 'MICROBIOLOGICAL' | 'ADDITIVE' | 'QUALITY' | 'NUTRITIONAL';

const MICROBIOLOGICAL_PATTERNS = [
  /total plate count|aerobic plate count|coliform|e\.?\s*coli|salmonella|shigella|staph|yeast|mould|mold|pseudomonas|vibrio|listeria|spore|bacillus|cfu|mpn/i,
];

const CONTAMINANT_PATTERNS = [
  /lead|cadmium|arsenic|mercury|copper|tin|zinc|iron|nickel|chromium|aflatoxin|ochratoxin|patulin|deoxynivalenol|zearalenone|fumonisin|pesticide|malathion|chlorpyrifos|ddt|endosulfan|pah|benzo.*pyrene|melamine|heavy metal|toxin|detergent|urea/i,
];

const QUALITY_PATTERNS = [
  /peroxide value|peroxide|acid value|free fatty acid|ffa|iodine value|saponification|unsaponifiable|refractive index|smoke point|flash point|argemone|mineral oil|moisture|water content|volatile matter|total ash|ash content|acid insoluble ash|ash|snf|milk fat|solids[- ]not[- ]fat|titratable acidity|curcumin|piperine|brix|total dissolved solids|tds|specific gravity|reducing sugar|sucrose|c4 sugar|adulterat|starch/i,
];

const NUTRITIONAL_PATTERNS = [
  /energy|calorie|carbohydrate|total sugar|added sugar|protein|total fat|saturated fat|trans fat|cholesterol|dietary fibre|dietary fiber|sodium|potassium|calcium|iron|vitamin/i,
];

const ADDITIVE_PATTERNS = [
  /preservative|colour|color|sweetener|antioxidant|emulsif|stabiliz|thicken|acidity regulator|anti-caking|raising agent|flavour enhancer|flavor enhancer|glazing agent|humectant|sequestrant|benzoate|benzoic acid|sorbate|sorbic acid|propionate|sulfite|sulphite|metabisulfite|ascorb|tartrazine|sunset yellow|erythrosine|ponceau|carmoisine|brilliant blue|fast green|indigo carmine|allura red|quinoline yellow|annatto|chlorophyll|caramel|curcumin colour|anthocyanin|bha|bht|tbhq|gallate|aspartame|acesulfame|sucralose|saccharin|neotame|steviol|cyclamate|msg|monosodium glutamate|lecithin|pectin|agar|alginate|carrageenan|guar gum|xanthan|locust bean|tragacanth|acacia|cellulose|polysorbate/i,
];

/**
 * Classify whether a tested parameter is a contaminant, microbiological, food additive, quality parameter, or nutritional value.
 */
export function classifyParameter(
  parameterName: string,
  unit?: string
): ParameterClassification {
  const norm = normalizeParameterName(parameterName);
  const u = normalizeUnitString(unit || '');

  if (u.includes('cfu') || u.includes('mpn') || MICROBIOLOGICAL_PATTERNS.some((p) => p.test(norm))) {
    return 'MICROBIOLOGICAL';
  }

  if (CONTAMINANT_PATTERNS.some((p) => p.test(norm))) {
    return 'CONTAMINANT';
  }

  if (QUALITY_PATTERNS.some((p) => p.test(norm))) {
    return 'QUALITY';
  }

  if (NUTRITIONAL_PATTERNS.some((p) => p.test(norm))) {
    return 'NUTRITIONAL';
  }

  // Explicit INS number or prohibited substance
  if (extractInsNumber(parameterName) || checkProhibitedSubstance(parameterName)) {
    return 'ADDITIVE';
  }

  if (ADDITIVE_PATTERNS.some((p) => p.test(norm))) {
    return 'ADDITIVE';
  }

  // Default to QUALITY (standard composition / quality parameter)
  // This prevents non-additive food parameters from being treated as additives
  return 'QUALITY';
}

// ─────────────────────────────────────────────────────────────────────────────
// STRUCTURED MULTI-DIMENSIONAL LAB REPORT EVALUATION
// ─────────────────────────────────────────────────────────────────────────────

export interface StructuredLabComplianceReport {
  sample: LabReportSample;
  food_category_code: string;
  food_category_name: string;
  contaminants: LabComplianceFinding[];
  microbiological: LabComplianceFinding[];
  additives: AdditiveComplianceFinding[];
  all_standard_findings: LabComplianceFinding[];
  summary: {
    total_parameters: number;
    contaminants_count: number;
    microbiological_count: number;
    additives_count: number;
    violations_count: number;
    manual_review_count: number;
    gmp_count: number;
    within_limit_count: number;
    prohibited_count: number;
  };
}

/**
 * High-level engine function:
 * Splits test results into contaminants, microbiological, and additives,
 * evaluating each against its appropriate FSSAI regulatory dataset.
 */
export function evaluateStructuredLabReport(
  sample: LabReportSample,
  testResults: LabTestResult[],
  standardFindings: LabComplianceFinding[],
  rawText?: string
): StructuredLabComplianceReport {
  // Determine FSSAI Food Category Code
  const categoryMatch = identifyFSSAICategoryCode(sample, rawText);
  const categoryCode = categoryMatch.code;
  const categoryName = categoryMatch.name;

  const contaminants: LabComplianceFinding[] = [];
  const microbiological: LabComplianceFinding[] = [];
  const additives: AdditiveComplianceFinding[] = [];

  for (const finding of standardFindings) {
    if (finding.is_microbiological) {
      microbiological.push(finding);
    } else {
      const cls = classifyParameter(finding.parameter, finding.reported_unit);
      if (cls === 'MICROBIOLOGICAL') {
        microbiological.push(finding);
      } else {
        contaminants.push(finding);
      }
    }
  }

  // Evaluate additives using Appendix A rules
  for (const result of testResults) {
    const cls = classifyParameter(result.parameter, result.unit);
    // ONLY evaluate if it is an additive, has an INS number, or is a prohibited substance
    if (cls === 'ADDITIVE' || extractInsNumber(result.parameter) || checkProhibitedSubstance(result.parameter)) {
      const additiveFinding = evaluateAdditiveResult(result, categoryCode, categoryName);
      additives.push(additiveFinding);
    }
  }

  // Fallback: If no additive findings were generated, check if any non-micro, non-nutritional, non-quality parameter matches an actual additive rule
  if (additives.length === 0 && testResults.length > 0) {
    for (const result of testResults) {
      const cls = classifyParameter(result.parameter, result.unit);
      if (cls !== 'MICROBIOLOGICAL' && cls !== 'QUALITY' && cls !== 'NUTRITIONAL') {
        const additiveFinding = evaluateAdditiveResult(result, categoryCode, categoryName);
        if (additiveFinding.status !== 'MANUAL_REVIEW' && additiveFinding.matched_rule_id !== null) {
          additives.push(additiveFinding);
        }
      }
    }
  }

  // Calculate summary counts
  const violationsCount =
    contaminants.filter((f) => f.status === 'ABOVE_LIMIT' || f.status === 'BELOW_MINIMUM' || f.status === 'PROHIBITED').length +
    microbiological.filter((f) => f.status === 'ABOVE_LIMIT' || f.status === 'PROHIBITED').length +
    additives.filter((f) => f.status === 'ABOVE_LIMIT' || f.status === 'NOT_PERMITTED' || f.status === 'PROHIBITED').length;

  const manualReviewCount =
    additives.filter((f) => f.status === 'MANUAL_REVIEW').length +
    contaminants.filter((f) => f.status === 'REQUIRES_VERIFICATION' || f.status === 'CANNOT_DETERMINE').length;

  const gmpCount = additives.filter((f) => f.status === 'PERMITTED_GMP').length;

  const withinLimitCount =
    contaminants.filter((f) => f.status === 'WITHIN_LIMIT' || f.status === 'NOT_DETECTED').length +
    microbiological.filter((f) => f.status === 'WITHIN_LIMIT' || f.status === 'NOT_DETECTED').length +
    additives.filter((f) => f.status === 'WITHIN_LIMIT' || f.status === 'PERMITTED_GMP' || f.status === 'NOT_DETECTED').length;

  const prohibitedCount =
    contaminants.filter((f) => f.status === 'PROHIBITED').length +
    additives.filter((f) => f.status === 'PROHIBITED').length;

  return {
    sample,
    food_category_code: categoryCode,
    food_category_name: categoryName,
    contaminants,
    microbiological,
    additives,
    all_standard_findings: standardFindings,
    summary: {
      total_parameters: testResults.length,
      contaminants_count: contaminants.length,
      microbiological_count: microbiological.length,
      additives_count: additives.length,
      violations_count: violationsCount,
      manual_review_count: manualReviewCount,
      gmp_count: gmpCount,
      within_limit_count: withinLimitCount,
      prohibited_count: prohibitedCount,
    },
  };
}
