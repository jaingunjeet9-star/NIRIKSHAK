/**
 * NIRIKSHAK Consumer Mode — Deterministic Regulatory Rules Engine
 * 
 * Strict Legal Principles:
 * 1. ZERO AI Hallucination for compliance status.
 * 2. Food rules ONLY apply to Food; Cosmetic rules ONLY apply to Cosmetics.
 * 3. Drug Mode is explicitly unconfigured with a non-activation disclaimer.
 * 4. Unknown ingredients are NEVER called "HARMFUL", "BANNED", or "DANGEROUS".
 * 5. Full statutory traceability (Regulation, Gazette, Rule ID, Version, Section).
 */

import { CONSUMER_REGULATORY_RULES } from '../data/consumerRulesData';
import { lookupIngredientKnowledge } from '../data/consumerKnowledgeBase';
import {
  ConsumerIngredient,
  ConsumerRegulatoryRule,
  ConsumerRuleStatus,
  ConsumerScanSummary,
  ProductDomain,
} from '../types/consumerTypes';
import { NormalizedIngredientItem } from './consumerNormalization';

export interface EvaluationOptions {
  productDomain: ProductDomain;
  productName?: string;
  categoryHint?: string;
}

export interface ConsumerEvaluationResult {
  domain: ProductDomain;
  domainConfidence: number;
  domainDeterminationReason: string;
  ingredients: ConsumerIngredient[];
  summary: ConsumerScanSummary;
  disclaimer: string;
}

const MANDATORY_CONSUMER_DISCLAIMER =
  'This scan provides an automated regulatory-information check based on configured official government sources (FSSAI and CDSCO). It is not a laboratory test, medical diagnosis, or substitute for professional regulatory or health advice.';

/**
 * Evaluates a list of normalized ingredients against the authoritative regulatory database.
 */
export function evaluateConsumerIngredients(
  normalizedItems: NormalizedIngredientItem[],
  options: EvaluationOptions
): ConsumerEvaluationResult {
  const { productDomain } = options;

  // 1. Check for Drug Domain (Strictly unconfigured / disabled)
  if (productDomain === 'DRUG') {
    const drugIngredients: ConsumerIngredient[] = normalizedItems.map((item) => ({
      id: item.id,
      originalText: item.originalText,
      normalizedName: item.normalizedName,
      domain: 'DRUG',
      function: 'Pharmaceutical Active / Excipient',
      category: 'Pharmaceutical Substances',
      identityDescription: `Medical drug substance labeled as ${item.originalText}.`,
      consumerConcern: 'NEEDS_CLOSER_LOOK',
      confidence: item.confidence >= 0.8 ? 'HIGH' : 'NEEDS_VERIFICATION',
      ruleStatus: 'UNKNOWN_MANUAL_VERIFICATION',
      statusReason: 'Drug regulatory verification is not currently enabled for this product category.',
      consumerExplanation:
        'Pharmaceutical drug products are governed by specialized prescription schedules (e.g. Schedule H/X). Automated consumer safety verification is not currently active for medicines.',
      sourceImages: item.sourceImages,
      boundingBoxes: item.boundingBoxes,
    }));

    return {
      domain: 'DRUG',
      domainConfidence: 0.95,
      domainDeterminationReason: 'Product packaging text indicates medical / pharmaceutical drug formulation.',
      ingredients: drugIngredients,
      summary: {
        totalDetected: drugIngredients.length,
        compliant: 0,
        restricted: 0,
        prohibited: 0,
        unknown: drugIngredients.length,
        requiresAttention: 0,
        attentionMessage: 'Drug regulatory verification is not currently enabled for this product category.',
      },
      disclaimer: MANDATORY_CONSUMER_DISCLAIMER,
    };
  }

  // 2. Evaluate each ingredient deterministically
  const evaluatedIngredients: ConsumerIngredient[] = [];
  let compliantCount = 0;
  let restrictedCount = 0;
  let prohibitedCount = 0;
  let unknownCount = 0;

  for (const item of normalizedItems) {
    const matchedRule = findApplicableRule(item, productDomain);
    const kbEntry = lookupIngredientKnowledge(item.normalizedName, productDomain);

    if (matchedRule) {
      if (matchedRule.rule_status === 'REGULATORY_COMPLIANT') compliantCount++;
      else if (matchedRule.rule_status === 'RESTRICTED_CONDITIONAL') restrictedCount++;
      else if (matchedRule.rule_status === 'PROHIBITED_NOT_PERMITTED') prohibitedCount++;
      else unknownCount++;

      evaluatedIngredients.push({
        id: item.id,
        originalText: item.originalText,
        normalizedName: matchedRule.normalized_name,
        domain: matchedRule.domain,
        function: kbEntry?.function || (item.insNumber ? `Food Additive (INS ${item.insNumber})` : 'Regulated Substance'),
        category: kbEntry?.category || item.category || 'Regulatory Ingredient',
        identityDescription: kbEntry?.identityDescription || `Identified as ${matchedRule.normalized_name}.`,
        nutritionRelevance: kbEntry?.nutritionRelevance,
        consumerConcern:
          matchedRule.rule_status === 'PROHIBITED_NOT_PERMITTED'
            ? 'PROHIBITED'
            : matchedRule.rule_status === 'RESTRICTED_CONDITIONAL'
            ? 'RESTRICTED_USAGE'
            : 'NO_SPECIFIC_CONCERN',
        concernExplanation: matchedRule.warning_text || kbEntry?.concernExplanation,
        confidence: Math.min(item.confidence, matchedRule.confidence ?? 1.0) >= 0.8 ? 'HIGH' : 'NEEDS_VERIFICATION',
        ruleStatus: matchedRule.rule_status,
        statusReason: matchedRule.conditions || matchedRule.warning_text || 'Permitted under applicable regulation.',
        consumerExplanation: matchedRule.consumer_explanation,
        conditions: matchedRule.conditions,
        maximumLimit: matchedRule.maximum_limit,
        warningText: matchedRule.warning_text,
        ruleId: matchedRule.rule_id,
        regulationName: matchedRule.regulation_name,
        regulationVersion: matchedRule.regulation_version,
        effectiveDate: matchedRule.effective_date,
        sourceDocument: matchedRule.source_document,
        sourceSection: matchedRule.source_section,
        sourcePage: matchedRule.source_page,
        sourceUrl: matchedRule.source_url,
        sourceImages: item.sourceImages,
        boundingBoxes: item.boundingBoxes,
      });
    } else if (kbEntry) {
      // Recognized everyday ingredient in knowledge base without specific restriction
      compliantCount++;
      evaluatedIngredients.push({
        id: item.id,
        originalText: item.originalText,
        normalizedName: kbEntry.normalizedName,
        domain: productDomain,
        function: kbEntry.function,
        category: kbEntry.category,
        identityDescription: kbEntry.identityDescription,
        nutritionRelevance: kbEntry.nutritionRelevance,
        consumerConcern: kbEntry.consumerConcern,
        concernExplanation: kbEntry.concernExplanation || 'Standard ingredient. No specific concern detected.',
        confidence: item.confidence >= 0.8 ? 'HIGH' : 'NEEDS_VERIFICATION',
        ruleStatus: 'REGULATORY_COMPLIANT',
        statusReason: 'Permitted general ingredient under standard provisions.',
        consumerExplanation:
          kbEntry.concernExplanation || 'Commonly used ingredient. No specific regulatory restriction or health concern detected under standard use.',
        sourceImages: item.sourceImages,
        boundingBoxes: item.boundingBoxes,
      });
    } else {
      // Truly unrecognized / unread ingredient — NEVER call harmful/banned!
      unknownCount++;
      evaluatedIngredients.push({
        id: item.id,
        originalText: item.originalText,
        normalizedName: item.normalizedName,
        domain: productDomain,
        function: item.insNumber ? `Additive (INS ${item.insNumber})` : 'Unclassified Ingredient',
        category: item.category || 'Other Ingredients',
        identityDescription: `Extracted from package as "${item.originalText}".`,
        consumerConcern: 'NEEDS_CLOSER_LOOK',
        concernExplanation: 'Could not be confidently matched to common ingredient schedules. Requires a closer look.',
        confidence: item.confidence >= 0.8 ? 'NEEDS_VERIFICATION' : 'UNCLEAR',
        ruleStatus: 'UNKNOWN_MANUAL_VERIFICATION',
        statusReason: 'No authoritative regulatory rule found in configured database. Requires manual verification.',
        consumerExplanation:
          'This ingredient could not be matched to common ingredients or regulatory schedules. This does not indicate that it is unsafe; it simply means it needs a closer look.',
        sourceImages: item.sourceImages,
        boundingBoxes: item.boundingBoxes,
      });
    }
  }

  // 3. Build overall summary
  const requiresAttention = restrictedCount + prohibitedCount;
  let attentionMessage = 'All detected ingredients are permitted under standard regulations.';
  if (prohibitedCount > 0) {
    attentionMessage = `${prohibitedCount} prohibited or non-permitted substance(s) detected.`;
  } else if (restrictedCount > 0) {
    attentionMessage = `${restrictedCount} ingredient(s) have statutory conditions or concentration restrictions.`;
  } else if (unknownCount > 0 && compliantCount === 0) {
    attentionMessage = 'Ingredients could not be mapped to configured rules. Manual review recommended.';
  }

  return {
    domain: productDomain,
    domainConfidence: productDomain === 'UNKNOWN' ? 0.5 : 0.95,
    domainDeterminationReason:
      productDomain === 'FOOD'
        ? 'Evaluated under FSSAI statutory standards for food products and additives.'
        : productDomain === 'COSMETIC'
        ? 'Evaluated under CDSCO Cosmetics Rules, 2020 and Drugs & Cosmetics Act, 1940.'
        : 'Product category is uncertain. General verification rules applied.',
    ingredients: evaluatedIngredients,
    summary: {
      totalDetected: evaluatedIngredients.length,
      compliant: compliantCount,
      restricted: restrictedCount,
      prohibited: prohibitedCount,
      unknown: unknownCount,
      requiresAttention,
      attentionMessage,
    },
    disclaimer: MANDATORY_CONSUMER_DISCLAIMER,
  };
}

/**
 * Searches the authoritative regulatory database for a match within the specified domain.
 */
export function findApplicableRule(
  item: NormalizedIngredientItem,
  targetDomain: ProductDomain
): ConsumerRegulatoryRule | null {
  const normLower = item.normalizedName.toLowerCase();
  const origLower = item.originalText.toLowerCase();

  for (const rule of CONSUMER_REGULATORY_RULES) {
    // If domain is specific (FOOD or COSMETIC), isolate strictly
    if (targetDomain !== 'UNKNOWN' && rule.domain !== targetDomain) {
      continue;
    }

    // 1. Direct INS / E-number match
    if (item.insNumber && rule.ins_number && item.insNumber.toLowerCase() === rule.ins_number.toLowerCase()) {
      return rule;
    }

    // 2. Direct normalized name match
    if (rule.normalized_name.toLowerCase() === normLower) {
      return rule;
    }

    // 3. Synonym check
    if (rule.synonyms.some((syn) => syn.toLowerCase() === normLower || syn.toLowerCase() === origLower)) {
      return rule;
    }

    // 4. INCI name check
    if (rule.inci_name && (rule.inci_name.toLowerCase() === normLower || rule.inci_name.toLowerCase() === origLower)) {
      return rule;
    }
  }

  return null;
}
