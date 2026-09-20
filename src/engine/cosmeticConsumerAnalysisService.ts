/**
 * NIRIKSHAK Consumer Mode — Cosmetic Consumer Analysis Service
 * 
 * Analyzes Cosmetic Products by evaluating:
 * 1. Cosmetic Ingredients & Everyday Functions (Humectant, Solvent, Preservative, Fragrance)
 * 2. Possible Skin Concerns (Fragrance, Sensitizers, Drying alcohols, Surfactants)
 * 3. Good to Know (Moisturizers, Barrier protectants)
 * 4. Secondary CDSCO Regulatory Status & Restrictions
 * 
 * Strictly adheres to:
 * - NO absolute claims ("100% safe", "completely non-irritating", "dangerous")
 * - Disclaims that individual skin reactions vary
 * - Highlights fragrance and potential irritants with balanced context
 */

import {
  ConsumerIngredient,
  ConsumerObservationItem,
  CosmeticAnalysisResult,
  CosmeticSkinConcern,
} from '../types/consumerTypes';
import { NormalizedIngredientItem } from './consumerNormalization';
import { lookupIngredientKnowledge } from '../data/consumerKnowledgeBase';
import { findApplicableRule } from './consumerRuleEngine';

export interface CosmeticAnalysisOptions {
  productName?: string;
  brandName?: string;
}

export function analyzeCosmeticProduct(
  normalizedIngredients: NormalizedIngredientItem[],
  options: CosmeticAnalysisOptions = {}
): CosmeticAnalysisResult {
  const processedIngredients: ConsumerIngredient[] = [];
  const possibleSkinConcerns: CosmeticSkinConcern[] = [];
  const goodToKnow: ConsumerObservationItem[] = [];

  let hasRestricted = false;
  let hasProhibited = false;
  let hasFragrance = false;
  let hasMoisturizers = false;

  for (const item of normalizedIngredients) {
    const kbEntry = lookupIngredientKnowledge(item.normalizedName, 'COSMETIC');
    const matchedRule = findApplicableRule(item, 'COSMETIC');

    if (matchedRule) {
      if (matchedRule.rule_status === 'PROHIBITED_NOT_PERMITTED') hasProhibited = true;
      if (matchedRule.rule_status === 'RESTRICTED_CONDITIONAL') hasRestricted = true;
    }

    const functionTitle = kbEntry?.function || 'Cosmetic Formulation Ingredient';
    const categoryTitle = kbEntry?.category || 'General Ingredients';
    const identityDesc = kbEntry?.identityDescription || `Declared as ${item.originalText} on cosmetic packaging.`;

    let consumerConcern = kbEntry?.consumerConcern || 'NO_SPECIFIC_CONCERN';
    if (matchedRule?.rule_status === 'PROHIBITED_NOT_PERMITTED') {
      consumerConcern = 'PROHIBITED';
    } else if (matchedRule?.rule_status === 'RESTRICTED_CONDITIONAL') {
      consumerConcern = 'RESTRICTED_USAGE';
    }

    const concernExplanation =
      matchedRule?.warning_text ||
      kbEntry?.concernExplanation ||
      'No specific regulatory or skin sensitivity concern identified for this ingredient.';

    const ing: ConsumerIngredient = {
      id: item.id,
      originalText: item.originalText,
      normalizedName: kbEntry?.normalizedName || item.normalizedName,
      domain: 'COSMETIC',
      function: functionTitle,
      category: categoryTitle,
      identityDescription: identityDesc,
      consumerConcern,
      concernExplanation,
      confidence: item.confidence >= 0.8 ? 'HIGH' : 'NEEDS_VERIFICATION',
      sourceImages: item.sourceImages,
      boundingBoxes: item.boundingBoxes,
      // Secondary regulatory layer
      ruleStatus: matchedRule ? matchedRule.rule_status : 'REGULATORY_COMPLIANT',
      ruleId: matchedRule?.rule_id || kbEntry?.ruleId,
      regulationName: matchedRule?.regulation_name || 'Cosmetics Rules, 2020 (CDSCO)',
      regulationVersion: matchedRule?.regulation_version || 'CDSCO-CR-2020.v1',
      sourceDocument: matchedRule?.source_document || 'Drugs and Cosmetics Act, 1940 & Rules',
      sourceSection: matchedRule?.source_section,
      sourcePage: matchedRule?.source_page,
      sourceUrl: matchedRule?.source_url,
      conditions: matchedRule?.conditions,
      maximumLimit: matchedRule?.maximum_limit,
      warningText: matchedRule?.warning_text,
      consumerExplanation: matchedRule?.consumer_explanation,
    };

    processedIngredients.push(ing);

    // Evaluate Potential Skin Concerns
    const lowerName = ing.normalizedName.toLowerCase();
    if (lowerName.includes('fragrance') || lowerName.includes('parfum')) {
      hasFragrance = true;
      possibleSkinConcerns.push({
        id: `concern-fragrance-${ing.id}`,
        title: 'Fragrance / Parfum present',
        ingredientName: ing.normalizedName,
        ingredientId: ing.id,
        explanation: 'Fragrance blends are a frequent trigger for dermal sensitivity or contact irritation, especially for delicate or eczema-prone skin.',
        advice: 'If you have sensitive or allergy-prone skin, consider patch testing or using fragrance-free formulas.',
        severity: 'NOTICE',
        boundingBox: ing.boundingBoxes[0],
      });
    } else if (lowerName.includes('linalool') || lowerName.includes('limonene') || lowerName.includes('citronellol')) {
      possibleSkinConcerns.push({
        id: `concern-scent-allergen-${ing.id}`,
        title: `Fragrance allergen component (${ing.normalizedName})`,
        ingredientName: ing.normalizedName,
        ingredientId: ing.id,
        explanation: 'Naturally occurring aromatic component recognized as a potential contact allergen when exposed to air.',
        advice: 'Individuals with fragrance contact dermatitis may experience reactions.',
        severity: 'NOTICE',
        boundingBox: ing.boundingBoxes[0],
      });
    } else if (lowerName.includes('alcohol denat') || lowerName.includes('denatured alcohol')) {
      possibleSkinConcerns.push({
        id: `concern-alcohol-${ing.id}`,
        title: 'Drying simple alcohol present',
        ingredientName: ing.normalizedName,
        ingredientId: ing.id,
        explanation: 'Denatured alcohol evaporates rapidly for a lightweight finish, but may disrupt the moisture barrier in dry or sensitive skin.',
        advice: 'Follow with a hydrating moisturizer if prone to dryness.',
        severity: 'NOTICE',
        boundingBox: ing.boundingBoxes[0],
      });
    } else if (lowerName.includes('sodium lauryl sulfate') || lowerName === 'sls') {
      possibleSkinConcerns.push({
        id: `concern-sls-${ing.id}`,
        title: 'Potent foaming surfactant (SLS)',
        ingredientName: ing.normalizedName,
        ingredientId: ing.id,
        explanation: 'Effective cleanser that can strip natural skin lipids, leading to tightness or irritation on facial skin.',
        advice: 'Consider gentler alternatives if experiencing redness or flaking.',
        severity: 'CAUTION',
        boundingBox: ing.boundingBoxes[0],
      });
    } else if (matchedRule?.rule_status === 'RESTRICTED_CONDITIONAL') {
      possibleSkinConcerns.push({
        id: `concern-restricted-${ing.id}`,
        title: `Regulated ingredient (${ing.normalizedName})`,
        ingredientName: ing.normalizedName,
        ingredientId: ing.id,
        explanation: matchedRule.conditions || `Subject to statutory usage caps (e.g. limit: ${matchedRule.maximum_limit || 'specified limit'}) under Indian cosmetic rules.`,
        advice: 'Complies with standard caps when formulated within legal thresholds.',
        severity: 'NOTICE',
        boundingBox: ing.boundingBoxes[0],
      });
    } else if (matchedRule?.rule_status === 'PROHIBITED_NOT_PERMITTED') {
      possibleSkinConcerns.push({
        id: `concern-prohibited-${ing.id}`,
        title: `Prohibited cosmetic ingredient (${ing.normalizedName})`,
        ingredientName: ing.normalizedName,
        ingredientId: ing.id,
        explanation: matchedRule.warning_text || 'Strictly banned from all cosmetic products under the Drugs & Cosmetics Rules.',
        advice: 'Do not use. Report non-compliant cosmetic product to enforcement authorities.',
        severity: 'ALERT',
        boundingBox: ing.boundingBoxes[0],
      });
    }

    // Check for positive skin moisturizers
    if (
      lowerName.includes('glycerin') ||
      lowerName.includes('hyaluronic') ||
      lowerName.includes('panthenol') ||
      lowerName.includes('aloe') ||
      lowerName.includes('ceramide')
    ) {
      hasMoisturizers = true;
    }
  }

  // Good to know items
  if (hasMoisturizers) {
    goodToKnow.push({
      id: 'good-moisturizers',
      title: 'Contains hydrating & soothing ingredients',
      explanation: 'Formulation includes recognized skin humectants (e.g., Glycerin, Panthenol, or Hyaluronic Acid) that attract and lock in moisture.',
      source: 'Ingredient List',
      isWarning: false,
    });
  }

  if (!hasFragrance) {
    goodToKnow.push({
      id: 'good-no-fragrance',
      title: 'No synthetic fragrance detected in scanned list',
      explanation: 'No "Parfum" or "Fragrance" was identified in the readable ingredient text.',
      source: 'Scanned Ingredient Declaration',
      isWarning: false,
    });
  }

  if (!hasRestricted && !hasProhibited) {
    goodToKnow.push({
      id: 'good-clean-regulatory',
      title: 'No restricted cosmetic ingredients identified',
      explanation: 'Ingredients read correspond to standard permitted cosmetic substances under CDSCO rules.',
      source: 'CDSCO Cosmetics Rules, 2020',
      isWarning: false,
    });
  }

  // Quick Summary
  const quickSummary: string[] = [];
  if (hasProhibited) {
    quickSummary.push('Prohibited ingredient detected');
  } else if (!hasRestricted && possibleSkinConcerns.length === 0) {
    quickSummary.push('No major concern detected');
  } else {
    if (hasFragrance) quickSummary.push('Fragrance detected');
    if (possibleSkinConcerns.length > 0) quickSummary.push('Some ingredients may irritate sensitive skin');
  }
  if (hasMoisturizers) quickSummary.push('Contains moisturizing ingredients');

  // Overall Summary
  const overallSummary = hasProhibited
    ? 'An ingredient prohibited under Indian cosmetics regulations was detected. Review the regulatory check below.'
    : possibleSkinConcerns.length > 0
    ? 'This product contains ingredients (such as fragrance or active compounds) that some individuals with sensitive skin may wish to note. See what each ingredient does below.'
    : 'No major regulatory concerns or common irritants were detected from the readable ingredients on this package.';

  // Group ingredients by category
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

  // Regulatory Summary
  let regMessage = 'Ingredients correspond to permitted cosmetic substances.';
  if (hasProhibited) {
    regMessage = 'Contains an ingredient prohibited under the Drugs and Cosmetics Act & Rules.';
  } else if (hasRestricted) {
    regMessage = 'Contains ingredients with statutory maximum concentration or usage conditions under CDSCO.';
  }

  const disclaimer =
    'Skin reactions vary from person to person. NIRIKSHAK does not diagnose skin conditions or provide medical advice. If you have sensitive skin, consult the ingredient list and consider professional advice.';

  return {
    quickSummary,
    overallSummary,
    possibleSkinConcerns,
    goodToKnow,
    ingredientGroups,
    regulatorySummary: {
      hasRestricted,
      hasProhibited,
      message: regMessage,
    },
    disclaimer,
  };
}
