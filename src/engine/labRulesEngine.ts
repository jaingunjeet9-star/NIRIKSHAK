/**
 * NIRIKSHAK — Lab Rules Matching & Evaluation Engine
 *
 * Handles:
 * - Product category identification from text
 * - Rule matching: finds applicable FSSAI rules for a given parameter + product category
 * - Unit normalization
 * - ND / LOQ / LOD result handling
 * - Compliance evaluation: compares extracted lab values against FSSAI limits
 * - A–E grade calculation (NIRIKSHAK Lab Compliance Grade)
 */

import {
  FSSAILabRule,
  LabTestResult,
  LabComplianceFinding,
  AdditiveComplianceFinding,
  LabGradeResult,
  LabResultStatus,
  NirikshakLabGrade,
  LabReportSample,
  LabSampleReport,
} from '../types';
import {
  FSSAI_LAB_RULES,
  FSSAI_FOOD_CATEGORY_MAP,
  FSSAI_LAB_RULES_VERSION,
  FSSAI_LAB_RULES_SOURCE_DOCUMENT,
} from '../data/fssaiLabRules';
import { evaluateStructuredLabReport } from './additivePermissionEngine';
import { generateSingleSourceOfTruthAnalysis } from './unifiedLabAnalysisEngine';

// ─────────────────────────────────────────────────────────────────────────────
// UNIT NORMALIZATION
// Converts values between equivalent units so comparisons work correctly.
// IMPORTANT: Always preserve original reported value and unit for display.
// ─────────────────────────────────────────────────────────────────────────────

export interface UnitConversionResult {
  convertedValue: number;
  targetUnit: string;
  conversionFactor: number;
  conversionNote: string;
}

/**
 * Normalize reported unit string to canonical form.
 */
export function normalizeUnitString(unit: string): string {
  if (!unit) return '';
  let u = unit.trim().toLowerCase();

  // Unicode replacements
  u = u.replace(/μ/g, 'µ').replace(/⁻¹/g, '-1').replace(/²/g, '2').replace(/₂/g, '2');

  // Percentage equivalents (g/100g = % w/w = % m/m = gm/100gm)
  if (
    u === '%' || u === '% w/w' || u === '%(w/w)' || u === '% (w/w)' ||
    u === '% m/m' || u === '%(m/m)' || u === '% (m/m)' || u === 'percent' ||
    u === 'g/100g' || u === 'g/100 g' || u === 'g / 100g' || u === 'g/100gm' ||
    u === 'gm/100g' || u === 'gm/100gm' || u === 'g/100ml' || u === 'gm/100ml' ||
    u === 'g / 100gm' || u === 'g /100g' || u === 'g/ 100g' || u === 'g/100 gms'
  ) {
    return '%';
  }
  if (u === '% w/v' || u === '%(w/v)' || u === '% (w/v)') return '% (w/v)';

  // mEq O2/kg — Peroxide value variants
  if (
    u === 'meq o2/kg' || u === 'meq/kg' || u === 'meq o₂/kg' || u === 'meqo2/kg' ||
    u === 'milliequivalents/kg' || u === 'milliequivalents o2/kg' ||
    u === 'meq active oxygen/kg' || u === 'meq oxygen/kg' || u === 'meq active oxygen kg-1' ||
    u === 'meq/ kg' || u === 'meq / kg'
  ) {
    return 'mEq O2/kg';
  }

  // mg KOH/g (Acid Value, Saponification Value)
  if (
    u === 'mg koh/g' || u === 'mg koh/gm' || u === 'mg koh g-1' ||
    u === 'mg koh / g' || u === 'mg koh / gm' || u === 'mgkoh/g'
  ) {
    return 'mg KOH/g';
  }

  // Wijs / Iodine value
  if (
    u === 'g i2/100g' || u === 'gi2/100g' || u === 'g i₂/100g' || u === 'wijs' ||
    u === 'g i2' || u === 'gi2' || u === 'centigrams iodine/gram'
  ) {
    return 'g I2/100g';
  }

  // mg/kg equivalents
  if (u === 'mg/kg' || u === 'ppm' || u === 'mg kg-1' || u === 'mg.kg-1' || u === 'mg/kg (ppm)' || u === 'mg / kg') {
    return 'mg/kg';
  }

  // µg/kg equivalents
  if (u === 'µg/kg' || u === 'ug/kg' || u === 'ppb' || u === 'mcg/kg' || u === 'µg kg-1' || u === 'µg/kg (ppb)' || u === 'ug / kg') {
    return 'µg/kg';
  }

  // mg/L equivalents
  if (u === 'mg/l' || u === 'mg/litre' || u === 'mg/liter' || u === 'ppm (liquid)' || u === 'mg l-1' || u === 'mg / l') {
    return 'mg/L';
  }

  // µg/L equivalents
  if (u === 'µg/l' || u === 'ug/l' || u === 'ppb (liquid)' || u === 'mcg/l' || u === 'µg/litre') {
    return 'µg/L';
  }

  // CFU / MPN equivalents
  if (u === 'cfu/g' || u === 'cfu g-1') return 'CFU/g';
  if (u === 'cfu/ml' || u === 'cfu/mL' || u === 'cfu ml-1') return 'CFU/mL';
  if (u === 'mpn/g' || u === 'mpn g-1') return 'MPN/g';
  if (u === 'mpn/ml' || u === 'mpn/100ml' || u === 'mpn/100mL') return 'MPN/100mL';

  // Refractive index
  if (u === 'ri' || u === 'refractive index' || u === 'n40' || u === 'n20') return 'RI';

  if (u === 'qualitative') return 'Qualitative';

  return u;
}

/**
 * Parsed structure for reported result strings like "< 0.1 g/100g" or "2.98 Meq/kg"
 */
export interface ParsedReportedValue {
  numericValue: number | null;
  operator: '<=' | '>=' | '<' | '>' | '==' | null;
  unit: string;
  isNotDetected: boolean;
  ndQualifier: string;
  isInequality: boolean;
}

/**
 * Safely parse reported value string into numeric, operator, and unit components.
 * Preserves inequalities such as "< 0.1".
 */
export function parseReportedValue(resultText: string, reportedUnit?: string): ParsedReportedValue {
  const text = (resultText || '').trim();

  // Check ND / Not detected (qualitative phrases like Absent, Negative, Nil, Not Detected)
  const ndCheck = isNotDetectedResult(text);
  if (ndCheck.isND && ndCheck.detectedBelowValue === null) {
    return {
      numericValue: null,
      operator: null,
      unit: reportedUnit ? normalizeUnitString(reportedUnit) : '',
      isNotDetected: true,
      ndQualifier: ndCheck.qualifier,
      isInequality: false,
    };
  }

  // Regex to extract optional inequality operator (<, <=, ≤, >, >=, ≥, =), number (allowing comma or dot decimals), and trailing unit
  const match = text.match(/^\s*([<>≤≥=]{1,2})?\s*([0-9]+(?:[\.,][0-9]+)?)\s*(.*)$/);
  if (match) {
    const rawOp = match[1] || '';
    const num = parseFloat(match[2].replace(',', '.'));
    let op: '<=' | '>=' | '<' | '>' | '==' = '==';
    let isInequality = false;

    if (rawOp === '<' || rawOp === '<=' || rawOp === '≤') {
      op = '<=';
      isInequality = true;
    } else if (rawOp === '>' || rawOp === '>=' || rawOp === '≥') {
      op = '>=';
      isInequality = true;
    } else if (rawOp === '=') {
      op = '==';
    }

    let unit = (match[3] || '').trim();
    if (!unit && reportedUnit) unit = reportedUnit.trim();

    return {
      numericValue: isNaN(num) ? null : num,
      operator: op,
      unit: normalizeUnitString(unit),
      isNotDetected: false,
      ndQualifier: '',
      isInequality,
    };
  }

  return {
    numericValue: null,
    operator: null,
    unit: reportedUnit ? normalizeUnitString(reportedUnit) : '',
    isNotDetected: false,
    ndQualifier: '',
    isInequality: false,
  };
}

/**
 * Convert value from one unit to another.
 * Returns null if conversion is not possible or dimensions are incompatible.
 */
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string
): UnitConversionResult | null {
  const from = normalizeUnitString(fromUnit);
  const to = normalizeUnitString(toUnit);

  if (from === to) {
    return { convertedValue: value, targetUnit: to, conversionFactor: 1, conversionNote: '' };
  }

  // mg/kg ↔ µg/kg (1 mg/kg = 1000 µg/kg)
  if (from === 'mg/kg' && to === 'µg/kg') {
    return { convertedValue: value * 1000, targetUnit: to, conversionFactor: 1000, conversionNote: '× 1000 (mg/kg → µg/kg)' };
  }
  if (from === 'µg/kg' && to === 'mg/kg') {
    return { convertedValue: value / 1000, targetUnit: to, conversionFactor: 0.001, conversionNote: '÷ 1000 (µg/kg → mg/kg)' };
  }

  // mg/L ↔ µg/L
  if (from === 'mg/L' && to === 'µg/L') {
    return { convertedValue: value * 1000, targetUnit: to, conversionFactor: 1000, conversionNote: '× 1000 (mg/L → µg/L)' };
  }
  if (from === 'µg/L' && to === 'mg/L') {
    return { convertedValue: value / 1000, targetUnit: to, conversionFactor: 0.001, conversionNote: '÷ 1000 (µg/L → mg/L)' };
  }

  // g/kg ↔ mg/kg (1 g/kg = 1000 mg/kg)
  if (from === 'g/kg' && to === 'mg/kg') {
    return { convertedValue: value * 1000, targetUnit: to, conversionFactor: 1000, conversionNote: '× 1000 (g/kg → mg/kg)' };
  }
  if (from === 'mg/kg' && to === 'g/kg') {
    return { convertedValue: value / 1000, targetUnit: to, conversionFactor: 0.001, conversionNote: '÷ 1000 (mg/kg → g/kg)' };
  }

  // mg/100g ↔ mg/kg (1 mg/100g = 10 mg/kg)
  if (from === 'mg/100g' && to === 'mg/kg') {
    return { convertedValue: value * 10, targetUnit: to, conversionFactor: 10, conversionNote: '× 10 (mg/100g → mg/kg)' };
  }
  if (from === 'mg/kg' && to === 'mg/100g') {
    return { convertedValue: value / 10, targetUnit: to, conversionFactor: 0.1, conversionNote: '÷ 10 (mg/kg → mg/100g)' };
  }

  // mg/kg ↔ mg/L (approximate for aqueous solutions: 1 mg/kg ≈ 1 mg/L)
  if ((from === 'mg/kg' && to === 'mg/L') || (from === 'mg/L' && to === 'mg/kg')) {
    return { convertedValue: value, targetUnit: to, conversionFactor: 1, conversionNote: 'Approximate: mg/kg ≈ mg/L for aqueous food products' };
  }

  // % ↔ mg/kg  (1 % = 10,000 mg/kg)
  if (from === '%' && to === 'mg/kg') {
    return { convertedValue: value * 10000, targetUnit: to, conversionFactor: 10000, conversionNote: '× 10000 (% → mg/kg)' };
  }
  if (from === 'mg/kg' && to === '%') {
    return { convertedValue: value / 10000, targetUnit: to, conversionFactor: 0.0001, conversionNote: '÷ 10000 (mg/kg → %)' };
  }

  // % ↔ µg/kg  (1 % = 10,000,000 µg/kg)
  if (from === '%' && to === 'µg/kg') {
    return { convertedValue: value * 1e7, targetUnit: to, conversionFactor: 1e7, conversionNote: '× 10,000,000 (% → µg/kg)' };
  }
  if (from === 'µg/kg' && to === '%') {
    return { convertedValue: value / 1e7, targetUnit: to, conversionFactor: 1e-7, conversionNote: '÷ 10,000,000 (µg/kg → %)' };
  }

  // mg/kg ↔ µg/L  (1 mg/kg ≈ 1000 µg/L for liquids)
  if (from === 'mg/kg' && to === 'µg/L') {
    return { convertedValue: value * 1000, targetUnit: to, conversionFactor: 1000, conversionNote: '× 1000 (mg/kg → µg/L, approximate for liquids)' };
  }
  if (from === 'µg/L' && to === 'mg/kg') {
    return { convertedValue: value / 1000, targetUnit: to, conversionFactor: 0.001, conversionNote: '÷ 1000 (µg/L → mg/kg, approximate for liquids)' };
  }

  return null; // Incompatible units
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CATEGORY MATCHING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given raw text from a lab report, identify the most likely FSSAI food category.
 * Returns category and confidence score (0-1).
 */
export function identifyFSSAIFoodCategory(text: string): {
  category: string | null;
  confidence: number;
  matchedTerms: string[];
  allMatches: Array<{ category: string; count: number }>;
} {
  const lowerText = text.toLowerCase();
  const scores: Record<string, number> = {};
  const matchedTermsMap: Record<string, string[]> = {};

  for (const [category, keywords] of Object.entries(FSSAI_FOOD_CATEGORY_MAP)) {
    let score = 0;
    matchedTermsMap[category] = [];
    for (const kw of keywords) {
      if (lowerText.includes(kw.toLowerCase())) {
        // Exact match scores higher
        const wordBoundaryMatch = new RegExp(`\\b${kw.replace(/[-()]/g, '\\$&')}\\b`, 'i').test(lowerText);
        score += wordBoundaryMatch ? 2 : 1;
        matchedTermsMap[category].push(kw);
      }
    }
    if (score > 0) scores[category] = score;
  }

  if (Object.keys(scores).length === 0) {
    return { category: null, confidence: 0, matchedTerms: [], allMatches: [] };
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topCategory = sorted[0][0];
  const topScore = sorted[0][1];
  const secondScore = sorted[1]?.[1] ?? 0;

  // Confidence: ratio of top score vs second, capped at 0.95
  const confidence = Math.min(0.95, topScore / Math.max(1, topScore + secondScore));

  return {
    category: topCategory,
    confidence,
    matchedTerms: matchedTermsMap[topCategory] || [],
    allMatches: sorted.map(([cat, count]) => ({ category: cat, count })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL ALIASES & RULE MATCHING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Robust mapping of laboratory parameter names and common aliases to canonical keys.
 * Handles variations in spacing, abbreviations, symbols, and chemical designations.
 */
export const CANONICAL_PARAMETER_MAP: Record<string, string> = {
  // Moisture & Water Content
  'moisture': 'moisture',
  'moisture content': 'moisture',
  'moisture and volatile matter': 'moisture',
  'moisture volatile matter': 'moisture',
  'water content': 'moisture',
  'water': 'moisture',
  'loss on drying': 'moisture',
  'mvs': 'moisture',
  'moisture insoluble impurities': 'moisture',
  'moisture and insoluble impurities': 'moisture',

  // Peroxide Value
  'peroxide value': 'peroxide_value',
  'peroxide value pv': 'peroxide_value',
  'peroxide value pov': 'peroxide_value',
  'peroxide': 'peroxide_value',
  'peroxides': 'peroxide_value',
  'pv': 'peroxide_value',
  'pov': 'peroxide_value',

  // Acid Value & Free Fatty Acids
  'acid value': 'acid_value',
  'av': 'acid_value',
  'acid value av': 'acid_value',
  'acidity as koh': 'acid_value',
  'acid value mg koh g': 'acid_value',
  'free fatty acids': 'ffa',
  'free fatty acid': 'ffa',
  'ffa': 'ffa',
  'free fatty acids ffa': 'ffa',
  'acidity as oleic acid': 'ffa',
  'free fatty acids as oleic acid': 'ffa',

  // Iodine Value
  'iodine value': 'iodine_value',
  'iv': 'iodine_value',
  'wijs iodine value': 'iodine_value',
  'wijs': 'iodine_value',
  'iodine absorption value': 'iodine_value',

  // Saponification Value
  'saponification value': 'saponification_value',
  'sv': 'saponification_value',
  'sap value': 'saponification_value',
  'saponification number': 'saponification_value',

  // Unsaponifiable Matter
  'unsaponifiable matter': 'unsaponifiable_matter',
  'usm': 'unsaponifiable_matter',
  'unsaponifiable matter %': 'unsaponifiable_matter',

  // Refractive Index
  'refractive index': 'refractive_index',
  'ri': 'refractive_index',
  'refractive index at 40c': 'refractive_index',
  'refractive index at 20c': 'refractive_index',
  'b r reading': 'refractive_index',
  'br reading': 'refractive_index',
  'butyro refractometer reading': 'refractive_index',

  // Nutritional
  'energy': 'energy_value',
  'energy value': 'energy_value',
  'calories': 'energy_value',
  'calorie': 'energy_value',
  'carbohydrate': 'carbohydrate',
  'carbohydrates': 'carbohydrate',
  'total carbohydrate': 'carbohydrate',
  'total carbohydrates': 'carbohydrate',
  'carb': 'carbohydrate',
  'protein': 'protein',
  'protein n x 6 25': 'protein',
  'protein n 6 25': 'protein',
  'crude protein': 'protein',
  'total protein': 'protein',
  'fat': 'fat',
  'total fat': 'fat',
  'crude fat': 'fat',
  'milk fat': 'milk_fat',
  'sugar': 'total_sugar',
  'total sugar': 'total_sugar',
  'added sugar': 'added_sugar',
  'dietary fibre': 'dietary_fibre',
  'dietary fiber': 'dietary_fibre',

  // Prohibited Adulterants
  'argemone oil': 'argemone_oil',
  'argemone oil qualitative test': 'argemone_oil',
  'argemone': 'argemone_oil',
  'argemone test': 'argemone_oil',
  'mineral oil': 'mineral_oil',
  'mineral oil test': 'mineral_oil',
  'holde test': 'mineral_oil',
  'hydrocarbon oil': 'mineral_oil',
  'metanil yellow': 'metanil_yellow',
  'metanil yellow non permitted dye': 'metanil_yellow',
  'metanil yellow dye': 'metanil_yellow',

  // Heavy metals / Contaminants
  'lead': 'lead',
  'lead as pb': 'lead',
  'lead pb': 'lead',
  'pb': 'lead',
  'plumbum': 'lead',
  'cadmium': 'cadmium',
  'cadmium as cd': 'cadmium',
  'cadmium cd': 'cadmium',
  'cd': 'cadmium',
  'mercury': 'mercury',
  'mercury as hg': 'mercury',
  'mercury hg': 'mercury',
  'total mercury': 'mercury',
  'hg': 'mercury',
  'methyl mercury': 'methyl_mercury',
  'methyl mercury as elemental mercury hg': 'methyl_mercury',
  'arsenic': 'arsenic',
  'arsenic as as': 'arsenic',
  'total arsenic': 'arsenic',
  'as': 'arsenic',
  'copper': 'copper',
  'copper as cu': 'copper',
  'cu': 'copper',
  'zinc': 'zinc',
  'zinc as zn': 'zinc',
  'zn': 'zinc',
  'tin': 'tin',
  'tin as sn': 'tin',
  'sn': 'tin',
  'aflatoxin b1': 'aflatoxin_b1',
  'aflatoxin b2': 'aflatoxin_b2',
  'aflatoxin g1': 'aflatoxin_g1',
  'aflatoxin g2': 'aflatoxin_g2',
  'total aflatoxins': 'total_aflatoxins',
  'total aflatoxins g2 g1 b2 b1': 'total_aflatoxins',
  'deoxynivalenol': 'deoxynivalenol',
  'deoxynivalenol don': 'deoxynivalenol',
  'don': 'deoxynivalenol',
  'zearalenone': 'zearalenone',
  'ht 2 toxin': 'ht_2_toxin',
  't 2 toxin': 't_2_toxin',
  'fumonisin': 'fumonisin',
  'fumonisins': 'fumonisin',
  'fumonisin sum of fumonisin b1 b2 b3': 'fumonisin',
  'melamine': 'melamine',
  'soyabean': 'soybean',
  'soybean': 'soybean',
  'ochratoxin a': 'ochratoxin_a',

  // Microbiology
  'total plate count': 'total_plate_count',
  'tpc': 'total_plate_count',
  'aerobic plate count': 'total_plate_count',
  'standard plate count': 'total_plate_count',
  'escherichia coli': 'e_coli',
  'e coli': 'e_coli',
  'salmonella': 'salmonella',
  'salmonella spp': 'salmonella',
  'coliform': 'coliform',
  'coliforms': 'coliform',
  'total coliforms': 'coliform',
  'yeast and mould': 'yeast_and_mould',
  'yeast and mold': 'yeast_and_mould',

  // Physical / Chemical / Quality
  'total ash': 'total_ash',
  'ash': 'total_ash',
  'ash content': 'total_ash',
  'acid insoluble ash': 'acid_insoluble_ash',
  'aia': 'acid_insoluble_ash',
  'total dissolved solids': 'tds',
  'tds': 'tds',
  'curcumin': 'curcumin',
  'curcumin content': 'curcumin',
  'solids not fat': 'snf',
  'snf': 'snf',
  'titratable acidity': 'titratable_acidity',
  'acidity': 'titratable_acidity',
};

/**
 * Normalize a parameter name for matching purposes.
 * Handles Unicode (× vs x, µ vs u), strips punctuation, collapses spaces.
 */
export function normalizeParameterName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[×x]/g, 'x')
    .replace(/[µμ]/g, 'u')
    .replace(/⁻¹/g, '-1')
    .replace(/[²₂]/g, '2')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolve a parameter name to its canonical identifier if mapped, or normalized string.
 */
export function resolveCanonicalParameter(name: string): string {
  const norm = normalizeParameterName(name);
  if (CANONICAL_PARAMETER_MAP[norm]) {
    return CANONICAL_PARAMETER_MAP[norm];
  }
  // Try removing parentheses content (e.g. "Peroxide Value (PV)" -> "peroxide value")
  const stripped = name.replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ');
  const normStripped = normalizeParameterName(stripped);
  if (CANONICAL_PARAMETER_MAP[normStripped]) {
    return CANONICAL_PARAMETER_MAP[normStripped];
  }
  return norm;
}

export interface RuleSearchResult {
  matches: FSSAILabRule[];
  isAmbiguous: boolean;
  ambiguousCategories: string[];
  totalParamRulesInDb: number;
}

/**
 * Category-aware rule search with ambiguity guard.
 * Returns matching rules or identifies when multiple competing standards exist for an unconfirmed food category.
 */
export function findApplicableRulesDetailed(
  parameterName: string,
  productCategory: string,
  rules: FSSAILabRule[] = FSSAI_LAB_RULES
): RuleSearchResult {
  const normParam = normalizeParameterName(parameterName);
  const canonParam = resolveCanonicalParameter(parameterName);
  const normCategory = (productCategory || '').toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');

  // Step 1: Find all active rules that match this parameter
  const paramMatches: { rule: FSSAILabRule; specificity: number }[] = [];

  for (const rule of rules) {
    if (!rule.active) continue;

    const ruleCanonParam = resolveCanonicalParameter(rule.parameter_name);
    const ruleCanonSubstance = resolveCanonicalParameter(rule.substance_name);
    const normRuleParam = normalizeParameterName(rule.parameter_name);
    const normRuleSubstance = normalizeParameterName(rule.substance_name);
    const paramAliases = (rule.parameter_aliases || []).map(a => normalizeParameterName(a));
    const paramCanonAliases = (rule.parameter_aliases || []).map(a => resolveCanonicalParameter(a));
    const substanceAliases = (rule.substance_aliases || []).map(a => normalizeParameterName(a));

    let isMatch = false;
    let specificity = 0;

    // Direct canonical match
    if (canonParam === ruleCanonParam || canonParam === ruleCanonSubstance || paramCanonAliases.includes(canonParam)) {
      isMatch = true;
      specificity = 1000;
    } else if (normParam === normRuleParam || normParam === normRuleSubstance || paramAliases.includes(normParam) || substanceAliases.includes(normParam)) {
      isMatch = true;
      specificity = 900;
    } else if (rule.INS_number && new RegExp(`\\b(ins\\s*${rule.INS_number}|e\\s*${rule.INS_number})\\b`, 'i').test(parameterName)) {
      isMatch = true;
      specificity = 800;
    } else {
      // Substring / word boundary match only for strings longer than 3 characters
      const allNames = [normRuleParam, normRuleSubstance, ...paramAliases, ...substanceAliases];
      for (const name of allNames) {
        if (name.length <= 3 || normParam.length <= 3) continue;
        if (name === normParam) {
          isMatch = true;
          specificity = 700;
          break;
        }
        if (
          Math.abs(name.length - normParam.length) <= 12 &&
          (new RegExp(`\\b${name}\\b`, 'i').test(normParam) || new RegExp(`\\b${normParam}\\b`, 'i').test(name))
        ) {
          isMatch = true;
          specificity = 500;
          break;
        }
      }
    }

    if (isMatch) {
      paramMatches.push({ rule, specificity });
    }
  }

  if (paramMatches.length === 0) {
    return { matches: [], isAmbiguous: false, ambiguousCategories: [], totalParamRulesInDb: 0 };
  }

  const allCategoriesForParam = [...new Set(paramMatches.map(m => m.rule.product_category))];

  // Step 2: Food Category Filtering
  const isGeneralCategory = !normCategory || normCategory === 'GENERAL_FOOD';

  if (!isGeneralCategory) {
    // Known / specific food category from report metadata or inspector
    const categoryMatches: FSSAILabRule[] = [];

    for (const { rule, specificity } of paramMatches) {
      const ruleCat = rule.product_category.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_');
      let catMatch = false;
      let catBonus = 0;

      if (ruleCat === normCategory) {
        catMatch = true;
        catBonus = 200;
      } else if (ruleCat === 'GENERAL_FOOD') {
        catMatch = true;
        catBonus = 50;
      } else {
        // Parent / child hierarchy
        const parentMap: Record<string, string[]> = {
          DAIRY: ['MILK', 'CHEESE', 'BUTTER', 'GHEE', 'YOGHURT', 'CREAM'],
          EDIBLE_OILS_FATS: ['OIL', 'OILS', 'FAT', 'FATS', 'EDIBLE_OIL', 'EDIBLE_OILS', 'VEGETABLE_OIL', 'OLIVE_OIL'],
          FRUITS_VEGETABLES: ['VEGETABLES', 'FRUITS', 'LEAFY_VEGETABLES', 'ROOT_VEGETABLES'],
          CEREAL_GRAIN: ['WHEAT', 'RICE', 'MAIZE_CORN', 'BARLEY'],
          MEAT_FISH: ['FISH_SEAFOOD', 'POULTRY', 'PROCESSED_MEAT'],
          SPICES_CONDIMENTS: ['SPICE', 'SPICES', 'TURMERIC', 'CHILLI', 'PEPPER', 'CONDIMENT'],
          SUGAR_CONFECTIONERY: ['HONEY', 'SUGAR', 'SWEET', 'CONFECTIONERY'],
        };
        for (const [parent, children] of Object.entries(parentMap)) {
          if ((ruleCat === parent && children.some(c => normCategory.includes(c))) ||
              (children.some(c => ruleCat.includes(c)) && normCategory === parent)) {
            catMatch = true;
            catBonus = 100;
            break;
          }
        }
      }

      if (catMatch) {
        (rule as any)._matchScore = specificity + catBonus;
        categoryMatches.push(rule);
      }
    }

    categoryMatches.sort((a, b) => ((b as any)._matchScore || 0) - ((a as any)._matchScore || 0));

    return {
      matches: categoryMatches,
      isAmbiguous: false,
      ambiguousCategories: [],
      totalParamRulesInDb: paramMatches.length,
    };
  }

  // Food Category is GENERAL_FOOD / unspecified
  // If multiple distinct specific categories exist for this parameter in FSSAI rules:
  const specificCategories = allCategoriesForParam.filter(c => c !== 'GENERAL_FOOD');
  if (specificCategories.length > 1) {
    return {
      matches: [],
      isAmbiguous: true,
      ambiguousCategories: specificCategories,
      totalParamRulesInDb: paramMatches.length,
    };
  }

  // If rules only belong to a single specific category (e.g. Peroxide Value is unique to EDIBLE_OILS_FATS)
  // or only GENERAL_FOOD, return them
  paramMatches.sort((a, b) => b.specificity - a.specificity);
  return {
    matches: paramMatches.map(m => m.rule),
    isAmbiguous: false,
    ambiguousCategories: [],
    totalParamRulesInDb: paramMatches.length,
  };
}

/**
 * Find all applicable FSSAI rules for a given parameter and product category.
 * Searches by canonical mapping, aliases, and category hierarchy.
 */
export function findApplicableRules(
  parameterName: string,
  productCategory: string,
  rules: FSSAILabRule[] = FSSAI_LAB_RULES
): FSSAILabRule[] {
  return findApplicableRulesDetailed(parameterName, productCategory, rules).matches;
}

// ─────────────────────────────────────────────────────────────────────────────
// ND / NOT DETECTED HANDLING
// ─────────────────────────────────────────────────────────────────────────────

const ND_PATTERNS = [
  /^\s*nd\s*$/i,
  /^\s*not\s+detected\s*$/i,
  /^\s*not\s+found\s*$/i,
  /^\s*below\s+detection\s+limit\s*$/i,
  /^\s*below\s+lod\s*$/i,
  /^\s*below\s+loq\s*$/i,
  /^\s*<\s*lod\s*$/i,
  /^\s*<\s*loq\s*$/i,
  /^\s*bdl\s*$/i,
  /^\s*nil\s*$/i,
  /^\s*absent\s*$/i,
  /^\s*negative\s*$/i,
];

const ND_VALUE_PATTERNS = [
  /^\s*<\s*([\d.,]+)\s*/,      // < 0.01
  /^\s*≤\s*([\d.,]+)\s*/,      // ≤ 0.01
];

/**
 * Determine if a result text represents "Not Detected".
 */
export function isNotDetectedResult(resultText: string): {
  isND: boolean;
  qualifier: string;
  detectedBelowValue: number | null;
} {
  const text = resultText.trim();

  for (const pattern of ND_PATTERNS) {
    if (pattern.test(text)) {
      return { isND: true, qualifier: text, detectedBelowValue: null };
    }
  }

  // < value pattern (e.g., "<0.01", "< 0.01 mg/kg")
  for (const pattern of ND_VALUE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const val = parseFloat(match[1].replace(',', '.'));
      return { isND: true, qualifier: text, detectedBelowValue: isNaN(val) ? null : val };
    }
  }

  return { isND: false, qualifier: '', detectedBelowValue: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLIANCE EVALUATION
// Compares an extracted lab test result against a matched FSSAI rule.
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateTestResultAgainstRule(
  testResult: LabTestResult,
  rule: FSSAILabRule,
  productCategory: string
): LabComplianceFinding {
  const findingId = `LF-${testResult.id}-${rule.id}`;
  const parsed = parseReportedValue(testResult.result_text);
  const rawNumeric = parsed.numericValue ?? testResult.detected_numeric;

  // 1. Handle BLQ (Below Limit of Quantification) with LOQ comparison
  const isBlq = testResult.result_type === 'BLQ' || /BLQ\s*\(\s*LOQ\s*:\s*([0-9.]+)\s*\)/i.test(testResult.result_text);
  let loqStr = testResult.loq;
  if (!loqStr) {
    const loqM = testResult.result_text.match(/BLQ\s*\(\s*LOQ\s*:\s*([0-9.]+)\s*\)/i);
    if (loqM) loqStr = loqM[1];
  }

  if (isBlq && loqStr) {
    const loqNumeric = parseFloat(loqStr);
    if (!isNaN(loqNumeric)) {
      let normalizedLoq = loqNumeric;
      let loqConversionNote = '';
      if (normalizeUnitString(testResult.unit) !== normalizeUnitString(rule.unit)) {
        const conv = convertUnit(loqNumeric, testResult.unit, rule.unit);
        if (conv) {
          normalizedLoq = conv.convertedValue;
          loqConversionNote = ` (${conv.conversionNote})`;
        }
      }

      if (rule.limit_type === 'PROHIBITED' || rule.prohibited_status) {
        return {
          id: findingId,
          test_result_id: testResult.id,
          rule_id: rule.id,
          parameter: testResult.parameter,
          reported_result: testResult.result_text,
          reported_numeric: null,
          reported_unit: testResult.unit,
          normalized_numeric: null,
          normalized_unit: rule.unit,
          fssai_limit_value: 0,
          fssai_lower_limit: null,
          fssai_upper_limit: null,
          fssai_unit: rule.unit,
          limit_type: 'PROHIBITED',
          status: 'NOT_DETECTED',
          difference_from_limit: null,
          percent_of_limit: null,
          product_category_matched: productCategory,
          rule_reference: rule.rule_reference,
          regulation_name: rule.regulation_name,
          source_section: rule.source_section,
          source_page: rule.source_page ?? null,
          source_document: rule.source_document,
          explanation: `Reported as BLQ (${testResult.result_text}). Substance is below quantification threshold, complying with prohibition requirement. ${rule.source_text}`,
          severity: 'NONE',
          is_prohibited: false,
          is_microbiological: rule.rule_type === 'MICROBIOLOGICAL_LIMIT',
          comparison_detail: {
            actual: `< ${loqStr} ${testResult.unit}`,
            operator: '==',
            limit: '0 / Not Detected',
            result: true,
            formatted_comparison: `BLQ (LOQ ${loqStr} ${testResult.unit}) == Compliant with prohibition`,
          },
          matched_rule: rule,
          result_type: 'BLQ',
          loq: loqStr,
          accreditation_status: testResult.accreditation_status,
        };
      }

      if (rule.limit_type === 'MAX' && rule.limit_value !== undefined) {
        if (normalizedLoq <= rule.limit_value) {
          return {
            id: findingId,
            test_result_id: testResult.id,
            rule_id: rule.id,
            parameter: testResult.parameter,
            reported_result: testResult.result_text,
            reported_numeric: null,
            reported_unit: testResult.unit,
            normalized_numeric: null,
            normalized_unit: rule.unit,
            fssai_limit_value: rule.limit_value,
            fssai_lower_limit: null,
            fssai_upper_limit: null,
            fssai_unit: rule.unit,
            limit_type: 'MAX',
            status: 'WITHIN_LIMIT',
            difference_from_limit: normalizedLoq - rule.limit_value,
            percent_of_limit: rule.limit_value > 0 ? (normalizedLoq / rule.limit_value) * 100 : null,
            product_category_matched: productCategory,
            rule_reference: rule.rule_reference,
            regulation_name: rule.regulation_name,
            source_section: rule.source_section,
            source_page: rule.source_page ?? null,
            source_document: rule.source_document,
            explanation: `Below Laboratory Quantification Limit (BLQ). Stated LOQ of ${loqStr} ${testResult.unit}${loqConversionNote} does not exceed applicable FSSAI maximum limit of ${rule.limit_value} ${rule.unit}. Note: Result is below quantification threshold, not necessarily zero.`,
            severity: 'NONE',
            is_prohibited: false,
            is_microbiological: rule.rule_type === 'MICROBIOLOGICAL_LIMIT',
            comparison_detail: {
              actual: `< ${loqStr} ${testResult.unit}`,
              operator: '<=',
              limit: rule.limit_value,
              result: true,
              formatted_comparison: `< ${loqStr} ${testResult.unit} <= ${rule.limit_value} ${rule.unit} (Compliant at LOQ)`,
            },
            matched_rule: rule,
            result_type: 'BLQ',
            loq: loqStr,
            accreditation_status: testResult.accreditation_status,
          };
        } else {
          return {
            id: findingId,
            test_result_id: testResult.id,
            rule_id: rule.id,
            parameter: testResult.parameter,
            reported_result: testResult.result_text,
            reported_numeric: null,
            reported_unit: testResult.unit,
            normalized_numeric: null,
            normalized_unit: rule.unit,
            fssai_limit_value: rule.limit_value,
            fssai_lower_limit: null,
            fssai_upper_limit: null,
            fssai_unit: rule.unit,
            limit_type: 'MAX',
            status: 'CANNOT_DETERMINE',
            difference_from_limit: normalizedLoq - rule.limit_value,
            percent_of_limit: rule.limit_value > 0 ? (normalizedLoq / rule.limit_value) * 100 : null,
            product_category_matched: productCategory,
            rule_reference: rule.rule_reference,
            regulation_name: rule.regulation_name,
            source_section: rule.source_section,
            source_page: rule.source_page ?? null,
            source_document: rule.source_document,
            explanation: `Method Quantification Limit (LOQ: ${loqStr} ${testResult.unit}) exceeds applicable FSSAI limit of ${rule.limit_value} ${rule.unit}. Laboratory sensitivity is insufficient to confirm compliance.`,
            severity: 'MODERATE',
            is_prohibited: false,
            is_microbiological: rule.rule_type === 'MICROBIOLOGICAL_LIMIT',
            comparison_detail: {
              actual: `LOQ: ${loqStr} ${testResult.unit}`,
              operator: '<=',
              limit: rule.limit_value,
              result: false,
              formatted_comparison: `LOQ ${loqStr} ${testResult.unit} > limit ${rule.limit_value} ${rule.unit}`,
            },
            matched_rule: rule,
            result_type: 'BLQ',
            loq: loqStr,
            accreditation_status: testResult.accreditation_status,
          };
        }
      }
    }
  }

  // Handle "Not Detected" results (pure qualitative ND without numeric threshold)
  if ((testResult.is_not_detected || parsed.isNotDetected) && !parsed.isInequality && !isBlq) {
    if (rule.limit_type === 'PROHIBITED' || rule.prohibited_status) {
      return {
        id: findingId,
        test_result_id: testResult.id,
        rule_id: rule.id,
        parameter: testResult.parameter,
        reported_result: testResult.result_text,
        reported_numeric: null,
        reported_unit: testResult.unit,
        normalized_numeric: null,
        normalized_unit: rule.unit,
        fssai_limit_value: 0,
        fssai_lower_limit: null,
        fssai_upper_limit: null,
        fssai_unit: rule.unit,
        limit_type: 'PROHIBITED',
        status: 'NOT_DETECTED',
        difference_from_limit: null,
        percent_of_limit: null,
        product_category_matched: productCategory,
        rule_reference: rule.rule_reference,
        regulation_name: rule.regulation_name,
        source_section: rule.source_section,
        source_page: rule.source_page ?? null,
        source_document: rule.source_document,
        explanation: `Substance "${testResult.parameter}" was not detected (${testResult.result_text}). Complies with prohibition requirement. ${rule.source_text}`,
        severity: 'NONE',
        is_prohibited: false,
        is_microbiological: rule.rule_type === 'MICROBIOLOGICAL_LIMIT',
        comparison_detail: {
          actual: 'Not Detected',
          operator: '==',
          limit: '0 / Not Detected',
          result: true,
          formatted_comparison: 'Not Detected == Compliant with prohibition',
        },
        matched_rule: rule,
      };
    }

    if (rule.limit_type === 'MIN') {
      return {
        id: findingId,
        test_result_id: testResult.id,
        rule_id: rule.id,
        parameter: testResult.parameter,
        reported_result: testResult.result_text,
        reported_numeric: 0,
        reported_unit: testResult.unit,
        normalized_numeric: 0,
        normalized_unit: rule.unit,
        fssai_limit_value: rule.lower_limit ?? null,
        fssai_lower_limit: rule.lower_limit ?? null,
        fssai_upper_limit: null,
        fssai_unit: rule.unit,
        limit_type: 'MIN',
        status: 'BELOW_LIMIT',
        difference_from_limit: rule.lower_limit !== undefined ? -rule.lower_limit : null,
        percent_of_limit: 0,
        product_category_matched: productCategory,
        rule_reference: rule.rule_reference,
        regulation_name: rule.regulation_name,
        source_section: rule.source_section,
        source_page: rule.source_page ?? null,
        source_document: rule.source_document,
        explanation: `Reported as "${testResult.result_text}", which fails the applicable FSSAI minimum requirement of ${rule.lower_limit} ${rule.unit}. ${rule.source_text}`,
        severity: rule.severity || 'MAJOR',
        is_prohibited: false,
        is_microbiological: rule.rule_type === 'MICROBIOLOGICAL_LIMIT',
        comparison_detail: {
          actual: 'Not Detected (0)',
          operator: '>=',
          limit: rule.lower_limit ?? 0,
          result: false,
          formatted_comparison: `0 ${rule.unit} < min ${rule.lower_limit} ${rule.unit}`,
        },
        matched_rule: rule,
      };
    }

    // Default ND for MAX, RANGE, GMP
    return {
      id: findingId,
      test_result_id: testResult.id,
      rule_id: rule.id,
      parameter: testResult.parameter,
      reported_result: testResult.result_text,
      reported_numeric: null,
      reported_unit: testResult.unit,
      normalized_numeric: null,
      normalized_unit: rule.unit,
      fssai_limit_value: rule.limit_value ?? null,
      fssai_lower_limit: rule.lower_limit ?? null,
      fssai_upper_limit: rule.upper_limit ?? null,
      fssai_unit: rule.unit,
      limit_type: rule.limit_type,
      status: 'NOT_DETECTED',
      difference_from_limit: null,
      percent_of_limit: null,
      product_category_matched: productCategory,
      rule_reference: rule.rule_reference,
      regulation_name: rule.regulation_name,
      source_section: rule.source_section,
      source_page: rule.source_page ?? null,
      source_document: rule.source_document,
      explanation: `Result reported as "${testResult.result_text}" (below detection limit). Applicable FSSAI limit: ${rule.limit_value ?? rule.upper_limit ?? 'N/A'} ${rule.unit}. Not Detected does not necessarily mean the substance is completely absent — it means it was not quantifiable at the laboratory's stated detection threshold.`,
      severity: 'NONE',
      is_prohibited: false,
      is_microbiological: rule.rule_type === 'MICROBIOLOGICAL_LIMIT',
      comparison_detail: {
        actual: 'Not Detected',
        operator: '<=',
        limit: rule.limit_value ?? rule.upper_limit ?? 'N/A',
        result: true,
        formatted_comparison: `Not Detected <= ${rule.limit_value ?? rule.upper_limit ?? 'N/A'} ${rule.unit}`,
      },
      matched_rule: rule,
    };
  }

  // Handle PROHIBITED substance rules
  if (rule.limit_type === 'PROHIBITED' || rule.prohibited_status || rule.rule_type === 'PROHIBITED') {
    const detected = rawNumeric !== null && rawNumeric > 0;
    return {
      id: findingId,
      test_result_id: testResult.id,
      rule_id: rule.id,
      parameter: testResult.parameter,
      reported_result: testResult.result_text,
      reported_numeric: rawNumeric,
      reported_unit: testResult.unit,
      normalized_numeric: rawNumeric,
      normalized_unit: testResult.unit,
      fssai_limit_value: 0,
      fssai_lower_limit: null,
      fssai_upper_limit: null,
      fssai_unit: rule.unit,
      limit_type: 'PROHIBITED',
      status: detected ? 'PROHIBITED' : 'NOT_DETECTED',
      difference_from_limit: detected ? rawNumeric : null,
      percent_of_limit: null,
      product_category_matched: productCategory,
      rule_reference: rule.rule_reference,
      regulation_name: rule.regulation_name,
      source_section: rule.source_section,
      source_page: rule.source_page ?? null,
      source_document: rule.source_document,
      explanation: detected
        ? `VIOLATION: "${testResult.parameter}" is strictly prohibited under FSSAI regulations. Detected value: ${testResult.result_text}. ${rule.source_text}`
        : `Substance "${testResult.parameter}" is not permitted but was reported as not detected.`,
      severity: detected ? 'CRITICAL' : 'NONE',
      is_prohibited: detected,
      is_microbiological: rule.rule_type === 'MICROBIOLOGICAL_LIMIT',
      comparison_detail: {
        actual: rawNumeric ?? testResult.result_text,
        operator: 'PROHIBITED',
        limit: 0,
        result: !detected,
        formatted_comparison: detected
          ? `Detected ${testResult.result_text} (strictly prohibited)`
          : 'Not Detected == Compliant with prohibition',
      },
      matched_rule: rule,
    };
  }

  // Handle GMP rules
  if (rule.limit_type === 'GMP') {
    return {
      id: findingId,
      test_result_id: testResult.id,
      rule_id: rule.id,
      parameter: testResult.parameter,
      reported_result: testResult.result_text,
      reported_numeric: rawNumeric,
      reported_unit: testResult.unit,
      normalized_numeric: rawNumeric,
      normalized_unit: rule.unit,
      fssai_limit_value: null,
      fssai_lower_limit: null,
      fssai_upper_limit: null,
      fssai_unit: rule.unit,
      limit_type: 'GMP',
      status: 'PERMITTED_GMP',
      difference_from_limit: null,
      percent_of_limit: null,
      product_category_matched: productCategory,
      rule_reference: rule.rule_reference,
      regulation_name: rule.regulation_name,
      source_section: rule.source_section,
      source_page: rule.source_page ?? null,
      source_document: rule.source_document,
      explanation: `${testResult.parameter} is permitted at GMP (Good Manufacturing Practice) levels — no fixed numeric maximum. ${rule.source_text}`,
      severity: 'NONE',
      is_prohibited: false,
      is_microbiological: rule.rule_type === 'MICROBIOLOGICAL_LIMIT',
      comparison_detail: {
        actual: rawNumeric ?? testResult.result_text,
        operator: 'GMP',
        limit: 'GMP',
        result: true,
        formatted_comparison: `${rawNumeric ?? testResult.result_text} ${rule.unit} <= Permitted at GMP`,
      },
      matched_rule: rule,
    };
  }

  // No numeric value to evaluate
  if (rawNumeric === null) {
    return {
      id: findingId,
      test_result_id: testResult.id,
      rule_id: rule.id,
      parameter: testResult.parameter,
      reported_result: testResult.result_text,
      reported_numeric: null,
      reported_unit: testResult.unit,
      normalized_numeric: null,
      normalized_unit: rule.unit,
      fssai_limit_value: rule.limit_value ?? null,
      fssai_lower_limit: rule.lower_limit ?? null,
      fssai_upper_limit: rule.upper_limit ?? null,
      fssai_unit: rule.unit,
      limit_type: rule.limit_type,
      status: 'MANUAL_VERIFICATION_REQUIRED',
      difference_from_limit: null,
      percent_of_limit: null,
      product_category_matched: productCategory,
      rule_reference: rule.rule_reference,
      regulation_name: rule.regulation_name,
      source_section: rule.source_section,
      source_page: rule.source_page ?? null,
      source_document: rule.source_document,
      explanation: `Could not extract a numeric value from "${testResult.result_text}". Manual verification required.`,
      severity: 'MODERATE',
      is_prohibited: false,
      is_microbiological: rule.rule_type === 'MICROBIOLOGICAL_LIMIT',
      comparison_detail: {
        actual: testResult.result_text,
        operator: '==',
        limit: rule.limit_value ?? rule.lower_limit ?? null,
        result: false,
        formatted_comparison: `Could not parse numeric value from "${testResult.result_text}"`,
      },
      matched_rule: rule,
    };
  }

  // Attempt unit conversion
  let normalizedNumeric = rawNumeric;
  let normalizedUnit = normalizeUnitString(testResult.unit);
  const targetUnit = normalizeUnitString(rule.unit);
  let conversionNote = '';
  let unitMismatch = false;

  if (normalizedUnit !== targetUnit) {
    const conversion = convertUnit(rawNumeric, testResult.unit, rule.unit);
    if (conversion) {
      normalizedNumeric = conversion.convertedValue;
      normalizedUnit = conversion.targetUnit;
      conversionNote = ` (${conversion.conversionNote})`;
    } else {
      unitMismatch = true;
    }
  }

  if (unitMismatch) {
    return {
      id: findingId,
      test_result_id: testResult.id,
      rule_id: rule.id,
      parameter: testResult.parameter,
      reported_result: testResult.result_text,
      reported_numeric: rawNumeric,
      reported_unit: testResult.unit,
      normalized_numeric: rawNumeric,
      normalized_unit: normalizedUnit,
      fssai_limit_value: rule.limit_value ?? null,
      fssai_lower_limit: rule.lower_limit ?? null,
      fssai_upper_limit: rule.upper_limit ?? null,
      fssai_unit: rule.unit,
      limit_type: rule.limit_type,
      status: 'MANUAL_VERIFICATION_REQUIRED',
      difference_from_limit: null,
      percent_of_limit: null,
      product_category_matched: productCategory,
      rule_reference: rule.rule_reference,
      regulation_name: rule.regulation_name,
      source_section: rule.source_section,
      source_page: rule.source_page ?? null,
      source_document: rule.source_document,
      explanation: `Cannot compare: reported unit "${testResult.unit}" cannot be reliably converted to FSSAI rule unit "${rule.unit}". Manual verification required. ${rule.source_text}`,
      severity: 'MODERATE',
      is_prohibited: false,
      is_microbiological: rule.rule_type === 'MICROBIOLOGICAL_LIMIT',
      comparison_detail: {
        actual: `${testResult.result_text} ${testResult.unit}`,
        operator: '==',
        limit: `${rule.limit_value ?? rule.lower_limit ?? ''} ${rule.unit}`,
        result: false,
        formatted_comparison: `Incompatible units: ${testResult.unit} cannot be converted to ${rule.unit}`,
      },
      matched_rule: rule,
    };
  }

  // Perform comparison
  let status: LabResultStatus = 'CANNOT_DETERMINE';
  let differenceFromLimit: number | null = null;
  let percentOfLimit: number | null = null;
  let explanation = '';
  let severity: LabComplianceFinding['severity'] = 'NONE';
  let formattedComparison = '';
  let comparisonResult = false;
  let comparisonOperator: '<=' | '>=' | '<' | '>' | '==' | 'RANGE' | 'GMP' | 'PROHIBITED' = '<=';

  // 1. Inequality handling (e.g. "< 0.1 g/100g")
  if (parsed.isInequality) {
    if (parsed.operator === '<=' || parsed.operator === '<') {
      if (rule.limit_type === 'MAX' && rule.limit_value !== undefined) {
        if (normalizedNumeric <= rule.limit_value) {
          status = 'WITHIN_LIMIT';
          comparisonResult = true;
          comparisonOperator = '<=';
          formattedComparison = `${testResult.result_text} ${rule.unit} <= max ${rule.limit_value} ${rule.unit}`;
          explanation = `Reported upper bound (${testResult.result_text}${conversionNote}) is within the applicable FSSAI maximum limit of ${rule.limit_value} ${rule.unit}. ${rule.source_text}`;
          severity = 'NONE';
        } else {
          status = 'MANUAL_VERIFICATION_REQUIRED';
          comparisonResult = false;
          comparisonOperator = '<=';
          formattedComparison = `${testResult.result_text} ${rule.unit} vs max ${rule.limit_value} ${rule.unit} (uncertain bound)`;
          explanation = `Reported upper bound (${testResult.result_text}) exceeds the maximum limit threshold of ${rule.limit_value} ${rule.unit}. Manual verification required.`;
          severity = 'MODERATE';
        }
      } else if (rule.limit_type === 'MIN' && rule.lower_limit !== undefined) {
        if (normalizedNumeric < rule.lower_limit) {
          status = 'BELOW_LIMIT';
          comparisonResult = false;
          comparisonOperator = '<';
          formattedComparison = `${testResult.result_text} ${rule.unit} < min ${rule.lower_limit} ${rule.unit}`;
          explanation = `Reported value (${testResult.result_text}${conversionNote}) is below the applicable FSSAI minimum requirement of ${rule.lower_limit} ${rule.unit}. ${rule.source_text}`;
          severity = rule.severity || 'MAJOR';
        } else {
          status = 'MANUAL_VERIFICATION_REQUIRED';
          comparisonResult = false;
          comparisonOperator = '>=';
          formattedComparison = `${testResult.result_text} ${rule.unit} vs min ${rule.lower_limit} ${rule.unit} (uncertain bound)`;
          explanation = `Reported upper bound (${testResult.result_text}) cannot confirm compliance with minimum requirement of ${rule.lower_limit} ${rule.unit}. Manual verification required.`;
          severity = 'MODERATE';
        }
      } else if (rule.limit_type === 'RANGE' && rule.lower_limit !== undefined && rule.upper_limit !== undefined) {
        if (normalizedNumeric <= rule.upper_limit && normalizedNumeric >= rule.lower_limit) {
          status = 'WITHIN_LIMIT';
          comparisonResult = true;
          comparisonOperator = 'RANGE';
          formattedComparison = `${testResult.result_text} within range ${rule.lower_limit}–${rule.upper_limit} ${rule.unit}`;
          explanation = `Reported value (${testResult.result_text}${conversionNote}) is within the applicable FSSAI range of ${rule.lower_limit}–${rule.upper_limit} ${rule.unit}. ${rule.source_text}`;
          severity = 'NONE';
        } else {
          status = 'MANUAL_VERIFICATION_REQUIRED';
          comparisonResult = false;
          comparisonOperator = 'RANGE';
          formattedComparison = `${testResult.result_text} vs range ${rule.lower_limit}–${rule.upper_limit} ${rule.unit}`;
          explanation = `Reported upper bound (${testResult.result_text}) cannot confirm compliance with range ${rule.lower_limit}–${rule.upper_limit} ${rule.unit}. Manual verification required.`;
          severity = 'MODERATE';
        }
      }
    } else if (parsed.operator === '>=' || parsed.operator === '>') {
      if (rule.limit_type === 'MIN' && rule.lower_limit !== undefined) {
        if (normalizedNumeric >= rule.lower_limit) {
          status = 'WITHIN_LIMIT';
          comparisonResult = true;
          comparisonOperator = '>=';
          formattedComparison = `${testResult.result_text} ${rule.unit} >= min ${rule.lower_limit} ${rule.unit}`;
          explanation = `Reported value (${testResult.result_text}${conversionNote}) meets the applicable FSSAI minimum requirement of ${rule.lower_limit} ${rule.unit}. ${rule.source_text}`;
          severity = 'NONE';
        } else {
          status = 'MANUAL_VERIFICATION_REQUIRED';
          comparisonResult = false;
          comparisonOperator = '>=';
          formattedComparison = `${testResult.result_text} vs min ${rule.lower_limit} ${rule.unit} (uncertain bound)`;
          explanation = `Reported lower bound (${testResult.result_text}) does not guarantee compliance with minimum requirement of ${rule.lower_limit} ${rule.unit}.`;
          severity = 'MODERATE';
        }
      } else if (rule.limit_type === 'MAX' && rule.limit_value !== undefined) {
        if (normalizedNumeric > rule.limit_value) {
          status = 'ABOVE_LIMIT';
          comparisonResult = false;
          comparisonOperator = '>';
          formattedComparison = `${testResult.result_text} ${rule.unit} > max ${rule.limit_value} ${rule.unit}`;
          differenceFromLimit = normalizedNumeric - rule.limit_value;
          explanation = `Reported value (${testResult.result_text}${conversionNote}) exceeds the applicable FSSAI maximum limit of ${rule.limit_value} ${rule.unit}. ${rule.source_text}`;
          severity = rule.severity || 'MAJOR';
        } else {
          status = 'MANUAL_VERIFICATION_REQUIRED';
          comparisonResult = false;
          comparisonOperator = '<=';
          formattedComparison = `${testResult.result_text} vs max ${rule.limit_value} ${rule.unit} (uncertain bound)`;
          explanation = `Reported lower bound (${testResult.result_text}) cannot guarantee compliance with maximum limit of ${rule.limit_value} ${rule.unit}.`;
          severity = 'MODERATE';
        }
      }
    }
  } else {
    // 2. Exact numeric comparison
    if (rule.limit_type === 'MAX' && rule.limit_value !== undefined) {
      comparisonOperator = '<=';
      if (normalizedNumeric <= rule.limit_value) {
        status = 'WITHIN_LIMIT';
        comparisonResult = true;
        differenceFromLimit = normalizedNumeric - rule.limit_value;
        percentOfLimit = rule.limit_value > 0 ? (normalizedNumeric / rule.limit_value) * 100 : null;
        formattedComparison = `${normalizedNumeric} ${rule.unit} <= max ${rule.limit_value} ${rule.unit}`;
        explanation = `Reported value (${testResult.result_text}${conversionNote}) is within the applicable FSSAI maximum limit of ${rule.limit_value} ${rule.unit}. ${rule.source_text}`;
        severity = 'NONE';
      } else {
        status = 'ABOVE_LIMIT';
        comparisonResult = false;
        differenceFromLimit = normalizedNumeric - rule.limit_value;
        percentOfLimit = rule.limit_value > 0 ? (normalizedNumeric / rule.limit_value) * 100 : null;
        formattedComparison = `${normalizedNumeric} ${rule.unit} > max ${rule.limit_value} ${rule.unit}`;
        explanation = `Reported value (${testResult.result_text}${conversionNote}) exceeds the applicable FSSAI maximum limit of ${rule.limit_value} ${rule.unit} by ${differenceFromLimit.toFixed(4)} ${rule.unit} (${percentOfLimit?.toFixed(1)}% of limit). ${rule.source_text}`;
        severity = rule.severity || 'MAJOR';
      }
    } else if (rule.limit_type === 'MIN' && rule.lower_limit !== undefined) {
      comparisonOperator = '>=';
      if (normalizedNumeric >= rule.lower_limit) {
        status = 'WITHIN_LIMIT';
        comparisonResult = true;
        differenceFromLimit = normalizedNumeric - rule.lower_limit;
        percentOfLimit = rule.lower_limit > 0 ? (normalizedNumeric / rule.lower_limit) * 100 : null;
        formattedComparison = `${normalizedNumeric} ${rule.unit} >= min ${rule.lower_limit} ${rule.unit}`;
        explanation = `Reported value (${testResult.result_text}${conversionNote}) meets the applicable FSSAI minimum requirement of ${rule.lower_limit} ${rule.unit}. ${rule.source_text}`;
        severity = 'NONE';
      } else {
        status = 'BELOW_LIMIT';
        comparisonResult = false;
        differenceFromLimit = normalizedNumeric - rule.lower_limit;
        percentOfLimit = rule.lower_limit > 0 ? (normalizedNumeric / rule.lower_limit) * 100 : null;
        formattedComparison = `${normalizedNumeric} ${rule.unit} < min ${rule.lower_limit} ${rule.unit}`;
        explanation = `Reported value (${testResult.result_text}${conversionNote}) is below the applicable FSSAI minimum requirement of ${rule.lower_limit} ${rule.unit}. Deficit: ${Math.abs(differenceFromLimit).toFixed(4)} ${rule.unit}. ${rule.source_text}`;
        severity = rule.severity || 'MAJOR';
      }
    } else if (rule.limit_type === 'RANGE' && rule.lower_limit !== undefined && rule.upper_limit !== undefined) {
      comparisonOperator = 'RANGE';
      if (normalizedNumeric >= rule.lower_limit && normalizedNumeric <= rule.upper_limit) {
        status = 'WITHIN_LIMIT';
        comparisonResult = true;
        formattedComparison = `${rule.lower_limit} <= ${normalizedNumeric} <= ${rule.upper_limit} ${rule.unit}`;
        explanation = `Reported value (${testResult.result_text}${conversionNote}) is within the applicable FSSAI range of ${rule.lower_limit}–${rule.upper_limit} ${rule.unit}. ${rule.source_text}`;
        severity = 'NONE';
      } else if (normalizedNumeric < rule.lower_limit) {
        status = 'BELOW_LIMIT';
        comparisonResult = false;
        differenceFromLimit = normalizedNumeric - rule.lower_limit;
        formattedComparison = `${normalizedNumeric} ${rule.unit} < min ${rule.lower_limit} ${rule.unit}`;
        explanation = `Reported value (${testResult.result_text}${conversionNote}) is below the applicable FSSAI minimum of ${rule.lower_limit} ${rule.unit}. ${rule.source_text}`;
        severity = rule.severity || 'MAJOR';
      } else {
        status = 'ABOVE_LIMIT';
        comparisonResult = false;
        differenceFromLimit = normalizedNumeric - rule.upper_limit;
        percentOfLimit = rule.upper_limit > 0 ? (normalizedNumeric / rule.upper_limit) * 100 : null;
        formattedComparison = `${normalizedNumeric} ${rule.unit} > max ${rule.upper_limit} ${rule.unit}`;
        explanation = `Reported value (${testResult.result_text}${conversionNote}) exceeds the applicable FSSAI maximum of ${rule.upper_limit} ${rule.unit}. ${rule.source_text}`;
        severity = rule.severity || 'MAJOR';
      }
    }
  }

  if (status === 'CANNOT_DETERMINE') {
    explanation = `Cannot determine compliance for "${testResult.parameter}" — rule data may be incomplete. ${rule.source_text}`;
    severity = 'MODERATE';
    formattedComparison = `${normalizedNumeric} ${rule.unit} vs ${rule.limit_value ?? 'N/A'}`;
  }

  return {
    id: findingId,
    test_result_id: testResult.id,
    rule_id: rule.id,
    parameter: testResult.parameter,
    reported_result: testResult.result_text,
    reported_numeric: rawNumeric,
    reported_unit: testResult.unit,
    normalized_numeric: normalizedNumeric,
    normalized_unit: normalizedUnit,
    fssai_limit_value: rule.limit_value ?? null,
    fssai_lower_limit: rule.lower_limit ?? null,
    fssai_upper_limit: rule.upper_limit ?? null,
    fssai_unit: rule.unit,
    limit_type: rule.limit_type,
    status,
    difference_from_limit: differenceFromLimit,
    percent_of_limit: percentOfLimit,
    product_category_matched: productCategory,
    rule_reference: rule.rule_reference,
    regulation_name: rule.regulation_name,
    source_section: rule.source_section,
    source_page: rule.source_page ?? null,
    source_document: rule.source_document,
    explanation,
    severity,
    is_prohibited: false,
    is_microbiological: rule.rule_type === 'MICROBIOLOGICAL_LIMIT',
    comparison_detail: {
      actual: normalizedNumeric,
      operator: comparisonOperator,
      limit: rule.limit_value ?? (rule.lower_limit !== undefined && rule.upper_limit !== undefined ? `${rule.lower_limit}-${rule.upper_limit}` : rule.lower_limit ?? null),
      result: comparisonResult,
      formatted_comparison: formattedComparison,
    },
    matched_rule: rule,
  };
}

/**
 * Run full compliance analysis for all test results against matched FSSAI rules.
 * Returns one finding per test result with Section 14 debug logging.
 */
export function runLabComplianceAnalysis(
  testResults: LabTestResult[],
  productCategory: string,
  rules: FSSAILabRule[] = FSSAI_LAB_RULES
): LabComplianceFinding[] {
  const findings: LabComplianceFinding[] = [];

  for (const result of testResults) {
    const searchResult = findApplicableRulesDetailed(result.parameter, productCategory, rules);
    const canonParam = resolveCanonicalParameter(result.parameter);

    let finding: LabComplianceFinding;
    let matchedRuleDesc = 'NONE';
    let ruleTypeDesc = 'NONE';

    if (searchResult.isAmbiguous) {
      finding = {
        id: `LF-${result.id}-AMBIGUOUS`,
        test_result_id: result.id,
        rule_id: null,
        parameter: result.parameter,
        reported_result: result.result_text,
        reported_numeric: result.detected_numeric,
        reported_unit: result.unit,
        normalized_numeric: result.detected_numeric,
        normalized_unit: result.unit_normalized || result.unit,
        fssai_limit_value: null,
        fssai_lower_limit: null,
        fssai_upper_limit: null,
        fssai_unit: '',
        limit_type: 'AMBIGUOUS',
        status: 'MANUAL_VERIFICATION_REQUIRED',
        difference_from_limit: null,
        percent_of_limit: null,
        product_category_matched: productCategory,
        rule_reference: null,
        regulation_name: null,
        source_section: null,
        source_page: null,
        source_document: null,
        explanation: `Multiple applicable FSSAI standards found; food category must be confirmed. Competing categories in database: ${searchResult.ambiguousCategories.join(', ')}.`,
        severity: 'MODERATE',
        is_prohibited: false,
        is_microbiological: false,
        comparison_detail: {
          actual: result.result_text,
          operator: '==',
          limit: null,
          result: false,
          formatted_comparison: 'Multiple applicable FSSAI standards found; food category must be confirmed.',
        },
      };
      ruleTypeDesc = 'AMBIGUOUS';
    } else if (searchResult.matches.length === 0) {
      const isBLQ = result.result_type === 'BLQ' || /BLQ\s*\(/i.test(result.result_text);
      const isND = result.is_not_detected || isNotDetectedResult(result.result_text).isND;
      
      let status: LabResultStatus = 'NO_APPLICABLE_LIMIT';
      let explanation = '';

      if (isBLQ) {
        status = 'NO_APPLICABLE_LIMIT';
        explanation = `Reported as Below Quantification Limit (${result.result_text}). No applicable FSSAI limit was found in the configured regulatory dataset for this parameter in product category "${productCategory}". This parameter cannot be evaluated for compliance at this time.`;
      } else if (isND) {
        status = 'NO_APPLICABLE_LIMIT';
        explanation = `Result reported as "${result.result_text}" (not detected). No applicable FSSAI limit was found in the configured regulatory dataset for this parameter in product category "${productCategory}".`;
      } else {
        status = 'NO_APPLICABLE_LIMIT';
        explanation = `No applicable FSSAI limit was found in the configured regulatory dataset for "${result.parameter}" in product category "${productCategory}". This parameter cannot be evaluated for compliance at this time. It does not imply the substance is banned or permitted.`;
      }

      finding = {
        id: `LF-${result.id}-NORULE`,
        test_result_id: result.id,
        rule_id: null,
        parameter: result.parameter,
        reported_result: result.result_text,
        reported_numeric: result.detected_numeric,
        reported_unit: result.unit,
        normalized_numeric: result.detected_numeric,
        normalized_unit: result.unit_normalized || result.unit,
        fssai_limit_value: null,
        fssai_lower_limit: null,
        fssai_upper_limit: null,
        fssai_unit: '',
        limit_type: '',
        status,
        difference_from_limit: null,
        percent_of_limit: null,
        product_category_matched: productCategory,
        rule_reference: null,
        regulation_name: null,
        source_section: null,
        source_page: null,
        source_document: null,
        explanation,
        severity: 'NONE',
        is_prohibited: false,
        is_microbiological: false,
        comparison_detail: {
          actual: result.result_text,
          operator: '==',
          limit: null,
          result: true,
          formatted_comparison: 'No applicable regulatory limit defined',
        },
        result_type: result.result_type,
        loq: result.loq,
        accreditation_status: result.accreditation_status,
      };
      ruleTypeDesc = 'NONE';
    } else {
      const bestRule = searchResult.matches[0];
      matchedRuleDesc = `${bestRule.id} (${bestRule.rule_reference || 'FSSAI'})`;
      ruleTypeDesc = bestRule.limit_type;
      finding = evaluateTestResultAgainstRule(result, bestRule, productCategory);
      if (!finding.result_type) finding.result_type = result.result_type;
      if (!finding.loq) finding.loq = result.loq;
      if (!finding.accreditation_status) finding.accreditation_status = result.accreditation_status;
    }

    // SECTION 14: DEBUG LOGGING FOR EVERY PARAMETER
    console.log(`[NIRIKSHAK FSSAI EVAL]
  PARAMETER: ${result.parameter}
  RAW VALUE: ${result.result_text}
  NORMALIZED PARAMETER: ${canonParam || 'unknown'}
  FOOD CATEGORY: ${productCategory}
  RULES SEARCHED: ${searchResult.totalParamRulesInDb} candidates
  MATCHED RULE: ${matchedRuleDesc}
  RULE TYPE: ${ruleTypeDesc}
  RAW UNIT: ${result.unit}
  NORMALIZED UNIT: ${finding.normalized_unit}
  ACTUAL VALUE: ${finding.normalized_numeric ?? finding.reported_result}
  LIMIT: ${finding.fssai_limit_value ?? (finding.fssai_lower_limit !== null ? `${finding.fssai_lower_limit}-${finding.fssai_upper_limit}` : 'NONE')}
  COMPARISON: ${finding.comparison_detail?.formatted_comparison ?? 'N/A'}
  FINAL STATUS: ${finding.status}
  REASON: ${finding.explanation}`);

    findings.push(finding);
  }

  return findings;
}

// ─────────────────────────────────────────────────────────────────────────────
// A–E GRADE CALCULATION
// NIRIKSHAK Lab Compliance Grade — Transparent methodology
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the NIRIKSHAK Lab Compliance Grade (A–E) from findings.
 *
 * Methodology:
 * - Start at 100 points
 * - Deduct for violations based on severity and type
 * - Apply multipliers for critical parameters
 * - Grade thresholds: A ≥ 90, B ≥ 75, C ≥ 55, D ≥ 35, E < 35
 */
export function calculateLabGrade(
  findings: LabComplianceFinding[],
  totalTestResults: number
): LabGradeResult {
  let score = 100;
  const reasons: string[] = [];
  let criticalViolations = 0;
  let majorViolations = 0;
  let microbiologicalFailures = 0;
  let withinLimit = 0;
  let aboveLimit = 0;
  let belowMinimum = 0;
  let prohibited = 0;
  let notDetected = 0;
  let notReported = 0;
  let cannotDetermine = 0;
  let noApplicableLimit = 0;

  for (const finding of findings) {
    switch (finding.status) {
      case 'WITHIN_LIMIT':
      case 'PERMITTED_GMP':
        withinLimit++;
        break;
      case 'ABOVE_LIMIT':
        aboveLimit++;
        break;
      case 'BELOW_LIMIT':
      case 'BELOW_MINIMUM':
        belowMinimum++;
        break;
      case 'PROHIBITED':
      case 'NOT_PERMITTED':
        prohibited++;
        break;
      case 'NOT_DETECTED':
        notDetected++;
        break;
      case 'NOT_REPORTED':
        notReported++;
        break;
      case 'CANNOT_DETERMINE':
      case 'MANUAL_VERIFICATION_REQUIRED':
        cannotDetermine++;
        break;
      case 'NO_APPLICABLE_LIMIT':
        noApplicableLimit++;
        break;
    }
  }

  const evaluated = withinLimit + aboveLimit + belowMinimum + prohibited;

  // Deductions for violations
  for (const finding of findings) {
    if (finding.status === 'ABOVE_LIMIT' || finding.status === 'BELOW_LIMIT' || finding.status === 'BELOW_MINIMUM') {
      if (finding.severity === 'CRITICAL') {
        score -= 20;
        criticalViolations++;
        reasons.push(`Critical violation: ${finding.parameter} — ${finding.explanation.substring(0, 100)}`);
      } else if (finding.severity === 'MAJOR') {
        score -= 12;
        majorViolations++;
        reasons.push(`Major violation: ${finding.parameter} — ${finding.explanation.substring(0, 100)}`);
      } else if (finding.severity === 'MODERATE') {
        score -= 7;
        reasons.push(`Moderate violation: ${finding.parameter}`);
      } else {
        score -= 3;
      }

      if (finding.is_microbiological) {
        microbiologicalFailures++;
        score -= 8;
        reasons.push(`Microbiological failure: ${finding.parameter}`);
      }

      // Additional penalty for large exceedances
      if (finding.percent_of_limit && finding.percent_of_limit > 200) {
        score -= 5;
        reasons.push(`${finding.parameter} exceeds FSSAI limit by more than 100% (${finding.percent_of_limit.toFixed(0)}% of limit)`);
      }
    }

    if (finding.status === 'PROHIBITED' || finding.status === 'NOT_PERMITTED') {
      score -= 30;
      criticalViolations++;
      reasons.push(`Prohibited substance detected: ${finding.parameter} — ${finding.explanation.substring(0, 100)}`);
    }
  }

  // Bonus for high compliance rate among evaluable parameters
  if (evaluated > 0) {
    const complianceRate = withinLimit / evaluated;
    if (complianceRate >= 0.95 && evaluated >= 5) {
      reasons.push(`High compliance rate: ${(complianceRate * 100).toFixed(0)}% of evaluated parameters within FSSAI limits`);
    }
  }

  // Note: Cannot Determine and No Applicable Limit are not penalized
  if (cannotDetermine > 0) {
    reasons.push(`${cannotDetermine} parameter(s) require manual verification or have uncertainty`);
  }
  if (noApplicableLimit > 0) {
    reasons.push(`${noApplicableLimit} parameter(s) have no applicable FSSAI limit in the current dataset — not penalized`);
  }
  if (notDetected > 0) {
    reasons.push(`${notDetected} parameter(s) reported as Not Detected (below detection limit) — not counted as violations`);
  }

  // Enforce bounds
  score = Math.max(0, Math.min(100, score));

  // Grade thresholds
  let grade: NirikshakLabGrade;
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 55) grade = 'C';
  else if (score >= 35) grade = 'D';
  else grade = 'E';

  if (reasons.length === 0) reasons.push('All evaluated parameters are within applicable FSSAI limits.');

  return {
    grade,
    score,
    total_evaluated: evaluated,
    within_limit: withinLimit,
    above_limit: aboveLimit,
    below_minimum: belowMinimum,
    prohibited,
    not_detected: notDetected,
    not_reported: notReported,
    cannot_determine: cannotDetermine,
    no_applicable_limit: noApplicableLimit,
    critical_violations: criticalViolations,
    major_violations: majorViolations,
    microbiological_failures: microbiologicalFailures,
    grade_reasons: reasons,
    methodology_notes: [
      'Score starts at 100.',
      'Critical violation (ABOVE/BELOW limit, CRITICAL severity): −20 points.',
      'Critical prohibited substance: −30 points.',
      'Major violation: −12 points.',
      'Moderate violation: −7 points.',
      'Microbiological failure (additional): −8 points.',
      'Exceedance >100% of limit (additional): −5 points.',
      'Grade thresholds: A ≥ 90 | B ≥ 75 | C ≥ 55 | D ≥ 35 | E < 35.',
      'NOT DETECTED, NO APPLICABLE LIMIT, and MANUAL VERIFICATION REQUIRED do NOT reduce the score.',
    ].join('\n'),
    disclaimer: 'This is a NIRIKSHAK analytical classification based on the submitted laboratory report and applicable regulatory comparisons. It is NOT an official FSSAI or Government of India certification, rating, or legal determination. This grade does not certify the product as safe or unsafe. Regulatory decisions must be made by authorized officials using official laboratory procedures.',
  };
}

/**
 * Parse a numeric value from a lab result string.
 * Returns null if not parseable.
 */
export function parseNumericValue(text: string): number | null {
  if (!text) return null;
  // Remove non-numeric characters except digits, dot, minus
  const cleaned = text.replace(/[^0-9.\-]/g, '').trim();
  if (!cleaned) return null;
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

/**
 * Determine report quality score based on extraction completeness.
 */
export function assessReportQuality(
  sample: LabReportSample,
  testResultCount: number,
  qualityWarnings: string[]
): number {
  let score = 100;

  if (!sample.product_name) { score -= 10; }
  if (!sample.laboratory_name) { score -= 5; }
  if (!sample.report_date) { score -= 5; }
  if (!sample.batch_lot_number) { score -= 5; }
  if (sample.category_requires_inspector_selection) { score -= 15; }
  if (testResultCount === 0) { score -= 50; }
  if (testResultCount < 3) { score -= 10; }
  score -= qualityWarnings.length * 5;

  return Math.max(0, Math.min(100, score));
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT ALIASES & COMPLIANCE WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

export const findApplicableLabRules = findApplicableRules;
export const determineProductCategory = identifyFSSAIFoodCategory;

export function evaluateLabReportCompliance(
  sample: LabReportSample,
  testResults: LabTestResult[],
  rawText?: string
) {
  const category = sample.product_category || 'GENERAL_FOOD';
  const findings = runLabComplianceAnalysis(testResults, category);
  const structured = evaluateStructuredLabReport(sample, testResults, findings, rawText);
  const gradeResult = calculateLabGrade(findings, testResults.length);
  const qualityScore = assessReportQuality(sample, testResults.length, []);
  return {
    sample,
    findings,
    additive_findings: structured.additives,
    structured_compliance: {
      contaminants: structured.contaminants,
      microbiological: structured.microbiological,
      additives: structured.additives,
      summary: structured.summary,
    },
    gradeResult,
    report_quality_score: qualityScore,
  };
}

/**
 * Evaluates an entire multi-sample laboratory document across all independent samples.
 * Computes individual compliance findings, summaries, and A-E grades for each sample.
 */
export function evaluateMultiSampleReport(
  samples: LabSampleReport[],
  productCategory: string = 'PROCESSED_FOOD',
  rules: FSSAILabRule[] = FSSAI_LAB_RULES
): LabSampleReport[] {
  return samples.map(sample => {
    const cat = sample.sample?.product_category || productCategory;
    const findings = runLabComplianceAnalysis(sample.test_results, cat, rules);

    let withinLimit = 0;
    let belowQuant = 0;
    let aboveLimit = 0;
    let noApplicableLimit = 0;
    let unmatched = 0;

    findings.forEach(f => {
      if (f.status === 'WITHIN_LIMIT' || f.status === 'PERMITTED_GMP') {
        withinLimit++;
        if (f.result_type === 'BLQ' || /BLQ/i.test(f.reported_result)) {
          belowQuant++;
        }
      } else if (f.status === 'ABOVE_LIMIT' || f.status === 'BELOW_LIMIT' || f.status === 'PROHIBITED') {
        aboveLimit++;
      } else if (f.status === 'NO_APPLICABLE_LIMIT') {
        noApplicableLimit++;
      } else {
        unmatched++;
      }
    });

    const gradeResult = calculateLabGrade(findings, sample.test_results.length);
    const analysis = generateSingleSourceOfTruthAnalysis(sample.sample, sample.test_results, sample.report_number, sample.sample_id);

    return {
      ...sample,
      findings,
      grade_result: gradeResult,
      analysis,
      summary: {
        total_tests: sample.test_results.length,
        within_limit: withinLimit,
        below_quantification: belowQuant,
        above_limit: aboveLimit,
        no_applicable_limit: noApplicableLimit,
        unmatched,
      },
    };
  });
}

