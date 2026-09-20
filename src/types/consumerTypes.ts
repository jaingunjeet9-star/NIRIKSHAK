/**
 * NIRIKSHAK Consumer Mode — Core Domain Types
 * Defines data structures for consumer-friendly product analysis,
 * nutrition evaluation, cosmetic skin safety, and secondary regulatory checks.
 * Completely isolated from Inspector Mode compliance models.
 */

export type ProductDomain = 'FOOD' | 'COSMETIC' | 'DRUG' | 'UNKNOWN';

export type NutritionLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'NOT_AVAILABLE';

export type ConsumerConcernLevel =
  | 'NO_SPECIFIC_CONCERN'
  | 'POTENTIAL_CONCERN'
  | 'RESTRICTED_USAGE'
  | 'PROHIBITED'
  | 'NEEDS_CLOSER_LOOK';

export type ConsumerRuleStatus =
  | 'REGULATORY_COMPLIANT'
  | 'RESTRICTED_CONDITIONAL'
  | 'PROHIBITED_NOT_PERMITTED'
  | 'NOT_DETECTED'
  | 'UNKNOWN_MANUAL_VERIFICATION';

export interface ConsumerBoundingBox {
  imageId: string;
  imageIndex: number; // 1-indexed (1 to 4)
  label?: string;
  x: number;          // percentage 0-100
  y: number;          // percentage 0-100
  width: number;      // percentage 0-100
  height: number;     // percentage 0-100
}

export interface NutritionMetric {
  value: number | null;
  unit: string;
  level: NutritionLevel;
  perServing?: number | null;
  per100g?: number | null;
  isCalculated?: boolean;
  benchmarkText?: string;
  explanation?: string;
}

export interface NutritionPanel {
  calories: NutritionMetric;
  totalFat: NutritionMetric;
  saturatedFat: NutritionMetric;
  transFat: NutritionMetric;
  carbohydrates: NutritionMetric;
  totalSugar: NutritionMetric;
  addedSugar: NutritionMetric;
  protein: NutritionMetric;
  fibre: NutritionMetric;
  sodium: NutritionMetric;
  servingSize?: string;
  servingsPerPackage?: string;
  isPer100gCalculated?: boolean;
  rawPanelText?: string;
  boundingBox?: ConsumerBoundingBox;
  hasNutritionData: boolean;
}

export interface ConsumerRegulatoryRule {
  rule_id: string;
  ingredient_id: string;
  normalized_name: string;
  synonyms: string[];
  ins_number?: string;
  e_number?: string;
  inci_name?: string;
  domain: ProductDomain;
  rule_status: ConsumerRuleStatus;
  conditions?: string;
  maximum_limit?: string;
  minimum_limit?: string;
  allowed_product_categories?: string[];
  prohibited_product_categories?: string[];
  warning_text?: string;
  regulation_name: string;
  regulation_version: string;
  effective_date: string;
  effective_until?: string;
  source_document: string;
  source_page?: number | string;
  source_section?: string;
  source_url?: string;
  last_verified_at: string;
  confidence?: number;
  notes?: string;
  consumer_explanation: string;
}

export interface ConsumerIngredient {
  id: string;
  originalText: string;
  normalizedName: string;
  domain: ProductDomain;
  function: string;                   // Everyday purpose (e.g. "Sweetener", "Humectant")
  category: string;                   // Grouping (e.g. "Fats & Oils", "Preservatives")
  identityDescription: string;        // Simple "What it is"
  nutritionRelevance?: string;        // e.g. "Contributes to saturated fat content"
  consumerConcern: ConsumerConcernLevel;
  concernExplanation?: string;
  allergenInfo?: {
    isAllergen: boolean;
    allergenName: string;
    advice: string;
  };
  confidence: 'HIGH' | 'NEEDS_VERIFICATION' | 'UNCLEAR';
  sourceImages: number[];
  boundingBoxes: ConsumerBoundingBox[];

  // Secondary Regulatory Layer
  ruleStatus: ConsumerRuleStatus;
  statusReason?: string;
  consumerExplanation?: string;
  conditions?: string;
  maximumLimit?: string;
  warningText?: string;
  ruleId?: string;
  regulationName?: string;
  regulationVersion?: string;
  effectiveDate?: string;
  sourceDocument?: string;
  sourceSection?: string;
  sourcePage?: number | string;
  sourceUrl?: string;
}

export interface ConsumerObservationItem {
  id: string;
  title: string;
  subtitle?: string;
  explanation: string;
  source: string;
  ingredientId?: string;
  nutrientKey?: string;
  isWarning: boolean;
  severity?: 'NOTICE' | 'CAUTION' | 'ALERT';
  boundingBox?: ConsumerBoundingBox;
}

export interface AllergenAlert {
  name: string;
  advice: string;
  detectedIn: string; // e.g. "Ingredient list ('Soya Lecithin')", "Package allergy declaration"
}

export interface FoodAnalysisResult {
  quickSummary: string[];
  overallSummary: string;
  nutritionProfile: Array<{
    key: string;
    label: string;
    valueStr: string;
    level: NutritionLevel;
    explanation: string;
  }>;
  thingsToWatch: ConsumerObservationItem[];
  goodToKnow: ConsumerObservationItem[];
  allergens: AllergenAlert[];
  ingredientGroups: Array<{
    category: string;
    count: number;
    ingredients: ConsumerIngredient[];
  }>;
  regulatorySummary: {
    hasRestricted: boolean;
    hasProhibited: boolean;
    message: string;
  };
  nutritionPanel: NutritionPanel;
}

export interface CosmeticSkinConcern {
  id: string;
  title: string;
  ingredientName: string;
  ingredientId: string;
  explanation: string;
  advice: string;
  severity: 'NOTICE' | 'CAUTION' | 'ALERT';
  boundingBox?: ConsumerBoundingBox;
}

export interface CosmeticAnalysisResult {
  quickSummary: string[];
  overallSummary: string;
  possibleSkinConcerns: CosmeticSkinConcern[];
  goodToKnow: ConsumerObservationItem[];
  ingredientGroups: Array<{
    category: string;
    count: number;
    ingredients: ConsumerIngredient[];
  }>;
  regulatorySummary: {
    hasRestricted: boolean;
    hasProhibited: boolean;
    message: string;
  };
  disclaimer: string;
}

export interface ConsumerScanSummary {
  totalDetected: number;
  compliant: number;
  restricted: number;
  prohibited: number;
  unknown: number;
  requiresAttention: number;
  attentionMessage: string;
}

export interface ConsumerScanImage {
  id: string;
  index: number;
  name?: string;
  dataUrl: string;
  panelLabel?: string;
}

export interface ConsumerScanRecord {
  id: string;
  createdAt: string;
  productName?: string;
  brandName?: string;
  domain: ProductDomain;
  domainConfidence: number;
  domainDeterminationReason: string;
  images: ConsumerScanImage[];
  rawIngredientText: string;
  ingredients: ConsumerIngredient[];
  summary: ConsumerScanSummary;
  disclaimer: string;
  foodAnalysis?: FoodAnalysisResult;
  cosmeticAnalysis?: CosmeticAnalysisResult;
  isDemo?: boolean;
}

export interface ConsumerHistoryFilter {
  domain?: ProductDomain | 'ALL';
  concernOnly?: boolean;
  searchQuery?: string;
}
