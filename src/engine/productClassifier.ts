/**
 * NIRIKSHAK — FSSAI Product Classification Engine
 *
 * Categorizes food and nutritional products into specific statutory categories
 * (Health Supplements, Protein Supplements, Whey Protein, Dairy, Edible Oils, etc.)
 * rather than applying generic processed-food rules.
 */

export interface ProductClassificationResult {
  productName: string;
  detectedCategory: string;
  categoryDisplayName: string;
  confidence: 'High' | 'Medium' | 'Low';
  confidenceScore: number;
  applicableRegulatoryFramework: string;
  requiresReview: boolean;
  reviewReason?: string;
  matchedKeywords: string[];
}

export function classifyLabProduct(
  productName?: string,
  extraText?: string
): ProductClassificationResult {
  const combined = `${productName || ''} ${extraText || ''}`.trim();
  const lower = combined.toLowerCase();

  // 1. Protein Powder / Whey / Isolate / Protein Supplement
  if (
    lower.includes('protein powder') ||
    lower.includes('whey protein') ||
    lower.includes('plain isolate') ||
    lower.includes('whey concentrate') ||
    lower.includes('protein isolate') ||
    lower.includes('isolate') ||
    lower.includes('pro protein') ||
    (lower.includes('protein') && (lower.includes('powder') || lower.includes('supplement') || lower.includes('shake')))
  ) {
    return {
      productName: productName || 'Protein Product',
      detectedCategory: 'PROTEIN_SUPPLEMENT',
      categoryDisplayName: 'Protein Supplement / Health Supplement',
      confidence: 'High',
      confidenceScore: 0.96,
      applicableRegulatoryFramework:
        'Food Safety and Standards (Health Supplements, Nutraceuticals, Food for Special Dietary Use, Food for Special Medical Purpose, Functional Food and Novel Food) Regulations, 2022 & FSS (Contaminants, Toxins and Residues) Regulations, 2011',
      requiresReview: false,
      matchedKeywords: ['protein powder', 'isolate', 'nutritional supplement'],
    };
  }

  // 2. Health Supplement / Nutraceutical
  if (
    lower.includes('health supplement') ||
    lower.includes('nutraceutical') ||
    lower.includes('dietary supplement') ||
    lower.includes('fsdu') ||
    lower.includes('special dietary')
  ) {
    return {
      productName: productName || 'Health Supplement',
      detectedCategory: 'HEALTH_SUPPLEMENT',
      categoryDisplayName: 'Health Supplement / Nutraceutical',
      confidence: 'High',
      confidenceScore: 0.92,
      applicableRegulatoryFramework:
        'Food Safety and Standards (Health Supplements, Nutraceuticals, Food for Special Dietary Use, Food for Special Medical Purpose, Functional Food and Novel Food) Regulations, 2022',
      requiresReview: false,
      matchedKeywords: ['health supplement', 'nutraceutical'],
    };
  }

  // 3. Edible Oils and Fats
  if (
    lower.includes('oil') ||
    lower.includes('ghee') ||
    lower.includes('butter') ||
    lower.includes('fat') ||
    lower.includes('vanaspati')
  ) {
    return {
      productName: productName || 'Edible Oil/Fat',
      detectedCategory: 'EDIBLE_OILS_FATS',
      categoryDisplayName: 'Edible Oils and Fats',
      confidence: 'High',
      confidenceScore: 0.94,
      applicableRegulatoryFramework:
        'Food Safety and Standards (Food Products Standards and Food Additives) Regulations, 2011 (Part 2.2: Fats, Oils and Fat Emulsions)',
      requiresReview: false,
      matchedKeywords: ['oil', 'fat'],
    };
  }

  // 4. Dairy Products
  if (
    lower.includes('milk') ||
    lower.includes('paneer') ||
    lower.includes('cheese') ||
    lower.includes('curd') ||
    lower.includes('yoghurt') ||
    lower.includes('dairy')
  ) {
    return {
      productName: productName || 'Dairy Product',
      detectedCategory: 'DAIRY_PRODUCT',
      categoryDisplayName: 'Dairy Product',
      confidence: 'High',
      confidenceScore: 0.91,
      applicableRegulatoryFramework:
        'Food Safety and Standards (Food Products Standards and Food Additives) Regulations, 2011 (Part 2.1: Dairy Products)',
      requiresReview: false,
      matchedKeywords: ['dairy', 'milk'],
    };
  }

  // 5. Cereal / Grain
  if (
    lower.includes('wheat') ||
    lower.includes('flour') ||
    lower.includes('atta') ||
    lower.includes('maida') ||
    lower.includes('rice') ||
    lower.includes('cereal') ||
    lower.includes('grain')
  ) {
    return {
      productName: productName || 'Cereal / Grain Product',
      detectedCategory: 'CEREAL_GRAIN',
      categoryDisplayName: 'Cereals and Cereal Products',
      confidence: 'Medium',
      confidenceScore: 0.85,
      applicableRegulatoryFramework:
        'Food Safety and Standards (Food Products Standards and Food Additives) Regulations, 2011 (Part 2.4: Cereals and Cereal Products)',
      requiresReview: false,
      matchedKeywords: ['cereal', 'grain'],
    };
  }

  // 6. Generic Processed Food fallback with review notice
  if (combined.length > 0) {
    return {
      productName: productName || 'Food Product',
      detectedCategory: 'GENERAL_PROCESSED_FOOD',
      categoryDisplayName: 'General Processed Food',
      confidence: 'Medium',
      confidenceScore: 0.65,
      applicableRegulatoryFramework:
        'Food Safety and Standards (Food Products Standards and Food Additives) Regulations, 2011 & FSS (Contaminants, Toxins and Residues) Regulations, 2011',
      requiresReview: false,
      matchedKeywords: ['food'],
    };
  }

  // 7. Unknown / Unspecified
  return {
    productName: 'Unspecified Sample',
    detectedCategory: 'UNKNOWN',
    categoryDisplayName: 'Category Requires Regulatory Review',
    confidence: 'Low',
    confidenceScore: 0.20,
    applicableRegulatoryFramework: 'General FSSAI Regulatory Framework (Subject to Category Verification)',
    requiresReview: true,
    reviewReason: 'Product name and description lack identifying food category information. Inspector verification required.',
    matchedKeywords: [],
  };
}
