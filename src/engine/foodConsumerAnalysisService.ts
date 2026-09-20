/**
 * NIRIKSHAK Consumer Mode — Food Consumer Analysis Service
 * 
 * Analyzes Food Products by combining:
 * 1. Nutrition Facts Panel (Sugar, Saturated Fat, Sodium, Protein, Fibre, Calories)
 * 2. Ingredient List & Everyday Functions
 * 3. Allergen Identification
 * 4. Things to Watch vs. Good to Know
 * 5. Secondary FSSAI Regulatory Status
 * 
 * Strictly follows principles:
 * - NO absolute claims ("100% healthy", "toxic", "dangerous", "unhealthy")
 * - Distinguishes between "Legal" and "Nutrition Profile"
 * - Calculates per 100g transparently and marks calculated values
 * - Objective, evidence-based consumer language
 */

import {
  AllergenAlert,
  ConsumerBoundingBox,
  ConsumerIngredient,
  ConsumerObservationItem,
  FoodAnalysisResult,
  NutritionLevel,
  NutritionMetric,
  NutritionPanel,
} from '../types/consumerTypes';
import { NormalizedIngredientItem } from './consumerNormalization';
import { lookupIngredientKnowledge } from '../data/consumerKnowledgeBase';
import { findApplicableRule } from './consumerRuleEngine';

export interface RawNutritionInput {
  calories?: number | null;
  totalFat?: number | null;
  saturatedFat?: number | null;
  transFat?: number | null;
  carbohydrates?: number | null;
  totalSugar?: number | null;
  addedSugar?: number | null;
  protein?: number | null;
  fibre?: number | null;
  sodium?: number | null;
  servingSize?: string;
  servingsPerPackage?: string;
  basis?: 'PER_100G' | 'PER_SERVING' | 'UNKNOWN';
  rawPanelText?: string;
  boundingBox?: ConsumerBoundingBox;
}

export interface FoodAnalysisOptions {
  productName?: string;
  brandName?: string;
  declaredAllergens?: string[];
  declaredClaims?: string[];
  nutritionInput?: RawNutritionInput;
}

/**
 * Standard thresholds for solids per 100g (and per serving heuristic)
 */
const THRESHOLDS = {
  sugar: { low: 5.0, high: 15.0, perServingHigh: 10.0 }, // g
  satFat: { low: 1.5, high: 5.0, perServingHigh: 2.5 },   // g
  sodium: { low: 120, high: 600, perServingHigh: 400 },   // mg
  protein: { low: 3.0, high: 8.0 },                       // g
  fibre: { low: 2.0, high: 5.0 },                         // g
};

function parseServingGrams(servingSizeStr?: string): number | null {
  if (!servingSizeStr) return null;
  const match = servingSizeStr.match(/([\d.]+)\s*(?:g|gm|gram|ml)/i);
  if (match) {
    const val = parseFloat(match[1]);
    return isNaN(val) ? null : val;
  }
  return null;
}

export function analyzeFoodProduct(
  normalizedIngredients: NormalizedIngredientItem[],
  options: FoodAnalysisOptions = {}
): FoodAnalysisResult {
  const { nutritionInput = {}, declaredAllergens = [] } = options;
  const servingGrams = parseServingGrams(nutritionInput.servingSize);
  const isPerServing = nutritionInput.basis === 'PER_SERVING';

  // 1. Process Nutrition Metrics
  const buildMetric = (
    val: number | null | undefined,
    unit: string,
    calcThreshold: (v100: number, vServ: number | null) => NutritionLevel,
    benchmarkLabel: string
  ): NutritionMetric => {
    if (val === null || val === undefined || isNaN(val)) {
      return { value: null, unit, level: 'NOT_AVAILABLE', benchmarkText: 'Not listed on package' };
    }

    let per100g: number | null = null;
    let perServing: number | null = null;
    let isCalculated = false;

    if (isPerServing) {
      perServing = val;
      if (servingGrams && servingGrams > 0) {
        per100g = Math.round(((val / servingGrams) * 100) * 10) / 10;
        isCalculated = true;
      }
    } else {
      per100g = val;
      if (servingGrams && servingGrams > 0) {
        perServing = Math.round(((val * servingGrams) / 100) * 10) / 10;
        isCalculated = true;
      }
    }

    const evalVal100 = per100g !== null ? per100g : val;
    const level = calcThreshold(evalVal100, perServing);

    return {
      value: val,
      unit,
      level,
      perServing,
      per100g,
      isCalculated,
      benchmarkText: benchmarkLabel,
    };
  };

  const sugarMetric = buildMetric(
    nutritionInput.totalSugar,
    'g',
    (v100, vServ) => {
      if (v100 > THRESHOLDS.sugar.high || (vServ && vServ > THRESHOLDS.sugar.perServingHigh)) return 'HIGH';
      if (v100 <= THRESHOLDS.sugar.low) return 'LOW';
      return 'MODERATE';
    },
    'High if >15g/100g (or >10g/serving)'
  );

  const satFatMetric = buildMetric(
    nutritionInput.saturatedFat,
    'g',
    (v100, vServ) => {
      if (v100 > THRESHOLDS.satFat.high || (vServ && vServ > THRESHOLDS.satFat.perServingHigh)) return 'HIGH';
      if (v100 <= THRESHOLDS.satFat.low) return 'LOW';
      return 'MODERATE';
    },
    'High if >5g/100g (or >2.5g/serving)'
  );

  const sodiumMetric = buildMetric(
    nutritionInput.sodium,
    'mg',
    (v100, vServ) => {
      if (v100 > THRESHOLDS.sodium.high || (vServ && vServ > THRESHOLDS.sodium.perServingHigh)) return 'HIGH';
      if (v100 <= THRESHOLDS.sodium.low) return 'LOW';
      return 'MODERATE';
    },
    'High if >600mg/100g (or >400mg/serving)'
  );

  const proteinMetric = buildMetric(
    nutritionInput.protein,
    'g',
    (v100) => (v100 >= THRESHOLDS.protein.high ? 'HIGH' : v100 >= THRESHOLDS.protein.low ? 'MODERATE' : 'LOW'),
    'Good source if >=5g/100g'
  );

  const fibreMetric = buildMetric(
    nutritionInput.fibre,
    'g',
    (v100) => (v100 >= THRESHOLDS.fibre.high ? 'HIGH' : v100 >= THRESHOLDS.fibre.low ? 'MODERATE' : 'LOW'),
    'Good source if >=3g/100g'
  );

  const caloriesMetric: NutritionMetric = {
    value: nutritionInput.calories ?? null,
    unit: 'kcal',
    level: nutritionInput.calories ? (nutritionInput.calories > 400 ? 'HIGH' : nutritionInput.calories < 150 ? 'LOW' : 'MODERATE') : 'NOT_AVAILABLE',
  };

  const nutritionPanel: NutritionPanel = {
    calories: caloriesMetric,
    totalFat: buildMetric(nutritionInput.totalFat, 'g', (v) => (v > 17.5 ? 'HIGH' : v <= 3 ? 'LOW' : 'MODERATE'), ''),
    saturatedFat: satFatMetric,
    transFat: buildMetric(nutritionInput.transFat, 'g', (v) => (v > 0.2 ? 'HIGH' : 'LOW'), ''),
    carbohydrates: buildMetric(nutritionInput.carbohydrates, 'g', () => 'MODERATE', ''),
    totalSugar: sugarMetric,
    addedSugar: buildMetric(nutritionInput.addedSugar, 'g', (v) => (v > 10 ? 'HIGH' : 'LOW'), ''),
    protein: proteinMetric,
    fibre: fibreMetric,
    sodium: sodiumMetric,
    servingSize: nutritionInput.servingSize,
    servingsPerPackage: nutritionInput.servingsPerPackage,
    isPer100gCalculated: sugarMetric.isCalculated || satFatMetric.isCalculated,
    rawPanelText: nutritionInput.rawPanelText,
    boundingBox: nutritionInput.boundingBox,
    hasNutritionData:
      nutritionInput.calories != null ||
      nutritionInput.totalSugar != null ||
      nutritionInput.totalFat != null ||
      nutritionInput.sodium != null,
  };

  // 2. Process Ingredients with Knowledge Base + Secondary Regulations
  const processedIngredients: ConsumerIngredient[] = [];
  const detectedAllergensSet = new Set<string>();
  const detectedAllergenAlerts: AllergenAlert[] = [];

  let hasProhibitedIngredient = false;
  let hasRestrictedIngredient = false;

  for (const item of normalizedIngredients) {
    const kbEntry = lookupIngredientKnowledge(item.normalizedName, 'FOOD');
    const matchedRule = findApplicableRule(item, 'FOOD');

    // Rule flags
    if (matchedRule) {
      if (matchedRule.rule_status === 'PROHIBITED_NOT_PERMITTED') hasProhibitedIngredient = true;
      if (matchedRule.rule_status === 'RESTRICTED_CONDITIONAL') hasRestrictedIngredient = true;
    }

    // Allergen flag
    let allergenInfo = undefined;
    if (kbEntry?.allergenCategory) {
      detectedAllergensSet.add(kbEntry.allergenCategory);
      allergenInfo = {
        isAllergen: true,
        allergenName: kbEntry.allergenCategory,
        advice: `Contains ${kbEntry.allergenCategory.toLowerCase()}. Avoid if allergic.`,
      };
    }

    // Determine everyday function and consumer concern
    const functionTitle = kbEntry?.function || (item.insNumber ? `Food Additive (INS ${item.insNumber})` : 'Dietary Ingredient');
    const categoryTitle = kbEntry?.category || 'Main Ingredients';
    const identityDesc = kbEntry?.identityDescription || `Listed as ${item.originalText} on package.`;

    let consumerConcern = kbEntry?.consumerConcern || 'NO_SPECIFIC_CONCERN';
    if (matchedRule?.rule_status === 'PROHIBITED_NOT_PERMITTED') {
      consumerConcern = 'PROHIBITED';
    } else if (matchedRule?.rule_status === 'RESTRICTED_CONDITIONAL') {
      consumerConcern = 'RESTRICTED_USAGE';
    }

    const concernExplanation =
      matchedRule?.warning_text ||
      kbEntry?.concernExplanation ||
      'No specific health or safety concern identified for this ingredient under standard dietary use.';

    processedIngredients.push({
      id: item.id,
      originalText: item.originalText,
      normalizedName: kbEntry?.normalizedName || item.normalizedName,
      domain: 'FOOD',
      function: functionTitle,
      category: categoryTitle,
      identityDescription: identityDesc,
      nutritionRelevance: kbEntry?.nutritionRelevance,
      consumerConcern,
      concernExplanation,
      allergenInfo,
      confidence: item.confidence >= 0.8 ? 'HIGH' : 'NEEDS_VERIFICATION',
      sourceImages: item.sourceImages,
      boundingBoxes: item.boundingBoxes,
      // Secondary regulatory data
      ruleStatus: matchedRule ? matchedRule.rule_status : 'REGULATORY_COMPLIANT',
      ruleId: matchedRule?.rule_id || kbEntry?.ruleId,
      regulationName: matchedRule?.regulation_name || 'FSSAI (Food Safety and Standards Act)',
      regulationVersion: matchedRule?.regulation_version || 'FSSAI-FPS-2011/2024',
      sourceDocument: matchedRule?.source_document || 'FSSAI Food Additives Schedules',
      sourceSection: matchedRule?.source_section,
      sourcePage: matchedRule?.source_page,
      sourceUrl: matchedRule?.source_url,
      conditions: matchedRule?.conditions,
      maximumLimit: matchedRule?.maximum_limit,
      consumerExplanation: matchedRule?.consumer_explanation,
    });
  }

  // Include declared allergens from package text (e.g. "CONTAINS MILK, SOY, WHEAT")
  for (const declared of declaredAllergens) {
    const upper = declared.toUpperCase().trim();
    if (upper.includes('MILK') || upper.includes('DAIRY')) detectedAllergensSet.add('MILK');
    if (upper.includes('SOY') || upper.includes('SOYA')) detectedAllergensSet.add('SOY');
    if (upper.includes('WHEAT') || upper.includes('GLUTEN')) detectedAllergensSet.add('WHEAT');
    if (upper.includes('NUT') || upper.includes('ALMOND') || upper.includes('CASHEW') || upper.includes('HAZELNUT')) detectedAllergensSet.add('TREE_NUTS');
    if (upper.includes('PEANUT')) detectedAllergensSet.add('PEANUTS');
    if (upper.includes('EGG')) detectedAllergensSet.add('EGGS');
  }

  const allergenLabels: Record<string, string> = {
    MILK: 'Milk / Dairy',
    SOY: 'Soy / Soya',
    WHEAT: 'Wheat / Gluten',
    TREE_NUTS: 'Tree Nuts (Almonds/Cashews/Hazelnuts)',
    PEANUTS: 'Peanuts',
    EGGS: 'Eggs',
    FISH: 'Fish',
    SULPHITES: 'Sulphites',
    SESAME: 'Sesame',
  };

  detectedAllergensSet.forEach((alg) => {
    const label = allergenLabels[alg] || alg;
    detectedAllergenAlerts.push({
      name: label,
      advice: `This product lists ${label.toLowerCase()} ingredients. Avoid if you have a known allergy.`,
      detectedIn: 'Scanned ingredient list & package allergen declaration',
    });
  });

  // 3. Build "Things to Watch"
  const thingsToWatch: ConsumerObservationItem[] = [];

  if (sugarMetric.level === 'HIGH') {
    const valText = sugarMetric.value !== null ? `${sugarMetric.value}g` : 'high amount';
    const addedText = nutritionInput.addedSugar ? ` (including ${nutritionInput.addedSugar}g added sugars)` : '';
    thingsToWatch.push({
      id: 'watch-sugar',
      title: 'High in sugar',
      explanation: `Contains ${valText} of total sugar${addedText} based on the scanned nutrition panel. Sugars are listed prominently in the ingredients.`,
      source: 'Package Nutrition Panel & Ingredients',
      nutrientKey: 'totalSugar',
      isWarning: true,
      severity: 'CAUTION',
    });
  }

  if (satFatMetric.level === 'HIGH') {
    const valText = satFatMetric.value !== null ? `${satFatMetric.value}g` : 'high amount';
    thingsToWatch.push({
      id: 'watch-satfat',
      title: 'High in saturated fat',
      explanation: `Contains ${valText} of saturated fat based on the scanned nutrition panel. Formulations with vegetable fat/palm oil contribute to saturated fat content.`,
      source: 'Package Nutrition Panel & Fats declaration',
      nutrientKey: 'saturatedFat',
      isWarning: true,
      severity: 'CAUTION',
    });
  }

  if (sodiumMetric.level === 'HIGH') {
    const valText = sodiumMetric.value !== null ? `${sodiumMetric.value}mg` : 'high amount';
    thingsToWatch.push({
      id: 'watch-sodium',
      title: 'High in sodium',
      explanation: `Contains ${valText} of sodium based on the package label. Consider monitoring if watching daily sodium or salt intake.`,
      source: 'Package Nutrition Panel',
      nutrientKey: 'sodium',
      isWarning: true,
      severity: 'CAUTION',
    });
  }

  if (detectedAllergenAlerts.length > 0) {
    const names = detectedAllergenAlerts.map((a) => a.name).join(', ');
    thingsToWatch.push({
      id: 'watch-allergens',
      title: `Contains allergens (${names})`,
      explanation: `Scanned packaging lists ${names}. Individuals with specific allergies should avoid or inspect carefully.`,
      source: 'Package Allergen Declaration & Ingredients',
      isWarning: true,
      severity: 'NOTICE',
    });
  }

  // Look for hydrogenated fats
  const hasHydrogenated = processedIngredients.some((i) => i.normalizedName.toLowerCase().includes('hydrogenated'));
  if (hasHydrogenated) {
    thingsToWatch.push({
      id: 'watch-hydrogenated',
      title: 'Contains hydrogenated vegetable fat',
      explanation: 'Hydrogenated fats are used to maintain firm texture and shelf life, which also elevates saturated fat.',
      source: 'Ingredient List',
      isWarning: true,
      severity: 'NOTICE',
    });
  }

  // Prohibited substances
  if (hasProhibitedIngredient) {
    thingsToWatch.push({
      id: 'watch-prohibited',
      title: 'Contains non-permitted substance',
      explanation: 'Contains an ingredient prohibited under Indian food standards (e.g. non-permitted industrial dye).',
      source: 'FSSAI Food Safety Standards Regulations',
      isWarning: true,
      severity: 'ALERT',
    });
  }

  // 4. Build "Good to Know"
  const goodToKnow: ConsumerObservationItem[] = [];

  if (proteinMetric.level === 'HIGH' || proteinMetric.level === 'MODERATE') {
    if (proteinMetric.value !== null && proteinMetric.value >= 3.0) {
      goodToKnow.push({
        id: 'good-protein',
        title: 'Provides dietary protein',
        explanation: `Contains ${proteinMetric.value}g of protein per ${isPerServing ? 'serving' : '100g'}.`,
        source: 'Package Nutrition Panel',
        nutrientKey: 'protein',
        isWarning: false,
      });
    }
  }

  if (fibreMetric.level === 'HIGH' || fibreMetric.level === 'MODERATE') {
    if (fibreMetric.value !== null && fibreMetric.value >= 2.0) {
      goodToKnow.push({
        id: 'good-fibre',
        title: 'Contains dietary fibre',
        explanation: `Provides ${fibreMetric.value}g of dietary fibre helping digestion.`,
        source: 'Package Nutrition Panel',
        nutrientKey: 'fibre',
        isWarning: false,
      });
    }
  }

  if (sodiumMetric.level === 'LOW' && sodiumMetric.value !== null) {
    goodToKnow.push({
      id: 'good-sodium',
      title: 'Sodium is relatively low',
      explanation: `Contains only ${sodiumMetric.value}mg of sodium per ${isPerServing ? 'serving' : '100g'}.`,
      source: 'Package Nutrition Panel',
      nutrientKey: 'sodium',
      isWarning: false,
    });
  }

  // Check for cocoa / whole foods
  const hasCocoa = processedIngredients.some((i) => i.normalizedName.toLowerCase().includes('cocoa'));
  if (hasCocoa) {
    goodToKnow.push({
      id: 'good-cocoa',
      title: 'Contains genuine cocoa ingredients',
      explanation: 'Formulation contains natural cocoa solids/cocoa butter derived from cocoa beans.',
      source: 'Ingredient List',
      isWarning: false,
    });
  }

  if (nutritionPanel.hasNutritionData) {
    goodToKnow.push({
      id: 'good-nutrition-read',
      title: 'Nutrition panel successfully read',
      explanation: 'Values were extracted directly from the printed nutrition table on the package.',
      source: 'Package Label Analysis',
      isWarning: false,
    });
  }

  // 5. Build Quick Summary Bullets
  const quickSummary: string[] = [];
  if (sugarMetric.level === 'HIGH') quickSummary.push('Higher in sugar');
  if (satFatMetric.level === 'HIGH') quickSummary.push('Higher in saturated fat');
  if (sodiumMetric.level === 'HIGH') quickSummary.push('Higher in sodium');
  if (detectedAllergenAlerts.length > 0) {
    const list = detectedAllergenAlerts.map((a) => a.name.split('/')[0].trim()).join(', ');
    quickSummary.push(`Contains ${list}`);
  }
  if (hasHydrogenated) quickSummary.push('Contains added vegetable fats');
  if (quickSummary.length === 0) {
    quickSummary.push('Standard packaged food profile');
    if (proteinMetric.level === 'MODERATE' || proteinMetric.level === 'HIGH') {
      quickSummary.push('Provides dietary protein');
    }
  }

  // 6. Overall Summary Paragraph
  const summaryPoints: string[] = [];
  if (sugarMetric.level === 'HIGH' && satFatMetric.level === 'HIGH') {
    summaryPoints.push('This product contains a relatively high amount of sugar and saturated fat based on the scanned nutrition panel.');
  } else if (sugarMetric.level === 'HIGH') {
    summaryPoints.push('This product is relatively high in sugar.');
  } else if (satFatMetric.level === 'HIGH') {
    summaryPoints.push('This product contains a relatively high proportion of saturated fat.');
  } else {
    summaryPoints.push('This product presents a moderate nutrition profile based on the information read from the label.');
  }

  if (detectedAllergenAlerts.length > 0) {
    summaryPoints.push(`It declares ${detectedAllergenAlerts.map((a) => a.name).join(' and ')}.`);
  }

  if (hasRestrictedIngredient) {
    summaryPoints.push('Certain additives (such as permitted colours or preservatives) are subject to statutory limits under FSSAI regulations.');
  }

  summaryPoints.push('See the nutrition breakdown and ingredient functions below to understand this product.');
  const overallSummary = summaryPoints.join(' ');

  // 7. Nutrition Profile Grid
  const nutritionProfile = [
    {
      key: 'totalSugar',
      label: 'Sugar',
      valueStr: sugarMetric.value !== null ? `${sugarMetric.value}g` : 'N/A',
      level: sugarMetric.level,
      explanation:
        sugarMetric.level === 'HIGH'
          ? 'Relatively high sugar content compared to standard benchmark recommendations.'
          : sugarMetric.level === 'LOW'
          ? 'Low sugar content.'
          : 'Moderate sugar content.',
    },
    {
      key: 'saturatedFat',
      label: 'Saturated Fat',
      valueStr: satFatMetric.value !== null ? `${satFatMetric.value}g` : 'N/A',
      level: satFatMetric.level,
      explanation:
        satFatMetric.level === 'HIGH'
          ? 'Relatively high saturated fat. Saturated fat intake is recommended in moderation.'
          : satFatMetric.level === 'LOW'
          ? 'Low saturated fat content.'
          : 'Moderate saturated fat content.',
    },
    {
      key: 'sodium',
      label: 'Sodium',
      valueStr: sodiumMetric.value !== null ? `${sodiumMetric.value}mg` : 'N/A',
      level: sodiumMetric.level,
      explanation:
        sodiumMetric.level === 'HIGH'
          ? 'High sodium. Consider monitoring if watching dietary salt.'
          : sodiumMetric.level === 'LOW'
          ? 'Low sodium content.'
          : 'Moderate sodium content.',
    },
    {
      key: 'protein',
      label: 'Protein',
      valueStr: proteinMetric.value !== null ? `${proteinMetric.value}g` : 'N/A',
      level: proteinMetric.level,
      explanation:
        proteinMetric.level === 'HIGH' || proteinMetric.level === 'MODERATE'
          ? 'Contributes dietary protein.'
          : 'Low protein content.',
    },
    {
      key: 'fibre',
      label: 'Fibre',
      valueStr: fibreMetric.value !== null ? `${fibreMetric.value}g` : 'N/A',
      level: fibreMetric.level,
      explanation:
        fibreMetric.level === 'HIGH' || fibreMetric.level === 'MODERATE'
          ? 'Provides dietary fibre.'
          : 'Low or unstated dietary fibre.',
    },
    {
      key: 'calories',
      label: 'Energy',
      valueStr: caloriesMetric.value !== null ? `${caloriesMetric.value} kcal` : 'N/A',
      level: caloriesMetric.level,
      explanation: 'Caloric energy content per stated unit.',
    },
  ];

  // 8. Group Ingredients by Category
  const categoryMap = new Map<string, ConsumerIngredient[]>();
  for (const ing of processedIngredients) {
    const cat = ing.category || 'Main Ingredients';
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(ing);
  }

  const ingredientGroups = Array.from(categoryMap.entries()).map(([category, ingredients]) => ({
    category,
    count: ingredients.length,
    ingredients,
  }));

  // 9. Regulatory Summary
  let regMessage = 'All detected ingredients correspond to standard food provisions.';
  if (hasProhibitedIngredient) {
    regMessage = 'Detected an ingredient strictly prohibited under Indian food standards (FSSAI).';
  } else if (hasRestrictedIngredient) {
    regMessage = 'Contains ingredients with statutory maximum concentration or usage conditions under FSSAI.';
  }

  return {
    quickSummary,
    overallSummary,
    nutritionProfile,
    thingsToWatch,
    goodToKnow,
    allergens: detectedAllergenAlerts,
    ingredientGroups,
    regulatorySummary: {
      hasRestricted: hasRestrictedIngredient,
      hasProhibited: hasProhibitedIngredient,
      message: regMessage,
    },
    nutritionPanel,
  };
}
