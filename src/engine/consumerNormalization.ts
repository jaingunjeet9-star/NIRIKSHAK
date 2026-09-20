/**
 * NIRIKSHAK Consumer Mode — Ingredient Normalization Layer
 * 
 * Responsibilities:
 * 1. Clean formatting, commas, bullets, bracketed percentages.
 * 2. INS / E-Number resolution (e.g., 'INS 110', 'E110' -> 'Sunset Yellow FCF').
 * 3. Synonym and INCI name resolution (e.g., 'Aqua' -> 'Water', 'Nicotinamide' -> 'Niacinamide').
 * 4. Fuzzy OCR mistyping correction with distance scoring & confidence weighting.
 * 5. Multi-image deduplication (consolidating occurrences from 1-4 packaging images).
 * 6. Strict preservation of original OCR text and spatial bounding coordinates.
 */

import { ConsumerBoundingBox, ProductDomain } from '../types/consumerTypes';

export interface RawExtractedItem {
  originalText: string;
  sourceImageIndex: number; // 1-indexed (1 to 4)
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence?: number;
}

export interface NormalizedIngredientItem {
  id: string;
  originalText: string;
  normalizedName: string;
  insNumber?: string;
  eNumber?: string;
  inciName?: string;
  detectedConcentration?: string;
  category?: string;
  confidence: number;
  sourceImages: number[];
  boundingBoxes: ConsumerBoundingBox[];
}

// Canonical INS / E-number map
const INS_MAPPING: Record<string, { name: string; category: string }> = {
  '102': { name: 'Tartrazine', category: 'Colour' },
  '110': { name: 'Sunset Yellow FCF', category: 'Colour' },
  '122': { name: 'Carmoisine', category: 'Colour' },
  '124': { name: 'Ponceau 4R', category: 'Colour' },
  '127': { name: 'Erythrosine', category: 'Colour' },
  '132': { name: 'Indigo Carmine', category: 'Colour' },
  '133': { name: 'Brilliant Blue FCF', category: 'Colour' },
  '143': { name: 'Fast Green FCF', category: 'Colour' },
  '200': { name: 'Sorbic Acid', category: 'Preservative' },
  '202': { name: 'Potassium Sorbate', category: 'Preservative' },
  '210': { name: 'Benzoic Acid', category: 'Preservative' },
  '211': { name: 'Sodium Benzoate', category: 'Preservative' },
  '218': { name: 'Methylparaben', category: 'Preservative' },
  '220': { name: 'Sulphur Dioxide', category: 'Preservative' },
  '223': { name: 'Sodium Metabisulphite', category: 'Preservative' },
  '250': { name: 'Sodium Nitrite', category: 'Preservative' },
  '300': { name: 'Ascorbic Acid', category: 'Antioxidant' },
  '307': { name: 'Tocopherol', category: 'Antioxidant' },
  '322': { name: 'Lecithin', category: 'Emulsifier' },
  '330': { name: 'Citric Acid', category: 'Acidity Regulator' },
  '407': { name: 'Carrageenan', category: 'Thickener' },
  '412': { name: 'Guar Gum', category: 'Stabiliser' },
  '415': { name: 'Xanthan Gum', category: 'Stabiliser' },
  '420': { name: 'Sorbitol', category: 'Sweetener' },
  '471': { name: 'Mono- and Diglycerides of Fatty Acids', category: 'Emulsifier' },
  '500': { name: 'Sodium Carbonates', category: 'Raising Agent' },
  '924a': { name: 'Potassium Bromate', category: 'Flour Improver' },
  '950': { name: 'Acesulfame Potassium', category: 'Sweetener' },
  '951': { name: 'Aspartame', category: 'Sweetener' },
  '954': { name: 'Saccharin', category: 'Sweetener' },
  '955': { name: 'Sucralose', category: 'Sweetener' },
  '960': { name: 'Steviol Glycosides', category: 'Sweetener' },
};

// Known synonyms dictionary
const SYNONYMS_MAP: Record<string, string> = {
  'aqua': 'Water',
  'eau': 'Water',
  'purified water': 'Water',
  'demineralised water': 'Water',
  'deionized water': 'Water',
  'potable water': 'Water',
  'sucrose': 'Sugar',
  'refined sugar': 'Sugar',
  'cane sugar': 'Sugar',
  'white sugar': 'Sugar',
  'sodium chloride': 'Iodised Salt',
  'salt': 'Iodised Salt',
  'common salt': 'Iodised Salt',
  'table salt': 'Iodised Salt',
  'nicotinamide': 'Niacinamide',
  'vitamin b3': 'Niacinamide',
  'niacinamide powder': 'Niacinamide',
  'glycerol': 'Glycerin',
  'glycerine': 'Glycerin',
  'vegetable glycerin': 'Glycerin',
  'tocopheryl acetate': 'Tocopherol',
  'vitamin e': 'Tocopherol',
  'alpha-tocopherol': 'Tocopherol',
  'parfum': 'Fragrance / Parfum',
  'fragrance': 'Fragrance / Parfum',
  'perfume': 'Fragrance / Parfum',
  'yellow 6': 'Sunset Yellow FCF',
  'fd&c yellow 6': 'Sunset Yellow FCF',
  'yellow 5': 'Tartrazine',
  'fd&c yellow 5': 'Tartrazine',
  'soya lecithin': 'Lecithin',
  'soy lecithin': 'Lecithin',
  'preservative 211': 'Sodium Benzoate',
  'preservative (211)': 'Sodium Benzoate',
  'acidity regulator (330)': 'Citric Acid',
  'acid 330': 'Citric Acid',
  'bvo': 'Brominated Vegetable Oil (BVO)',
  'acid yellow 36': 'Metanil Yellow',
};

// Levenshtein distance helper
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Check for close OCR match against canonical target
function findFuzzyMatch(cleanText: string, candidates: string[]): { match: string; confidence: number } | null {
  const lower = cleanText.toLowerCase();
  for (const cand of candidates) {
    const candLower = cand.toLowerCase();
    if (lower === candLower) {
      return { match: cand, confidence: 1.0 };
    }
    const dist = levenshteinDistance(lower, candLower);
    const maxLen = Math.max(lower.length, candLower.length);
    // Allow up to 2 character edits for words of length >= 7, or 1 edit for length >= 5
    if ((maxLen >= 7 && dist <= 2) || (maxLen >= 5 && dist === 1)) {
      const confidence = Number((1 - dist / maxLen).toFixed(2));
      return { match: cand, confidence };
    }
  }
  return null;
}

/**
 * Normalizes an individual raw ingredient string.
 */
export function normalizeSingleIngredient(
  rawText: string,
  sourceIndex: number = 1,
  box?: { x: number; y: number; width: number; height: number },
  providedConfidence: number = 0.95
): NormalizedIngredientItem {
  const trimmed = rawText.trim();

  // 1. Extract bracketed concentration if present (e.g. "Niacinamide (2%)" or "Sugar (15 g)")
  let detectedConcentration: string | undefined;
  let coreText = trimmed;
  const percentMatch = trimmed.match(/\((\d+(?:\.\d+)?\s*%)\)/i) || trimmed.match(/(\d+(?:\.\d+)?\s*%)/i);
  if (percentMatch) {
    detectedConcentration = percentMatch[1];
    coreText = trimmed.replace(/\(\d+(?:\.\d+)?\s*%\)/gi, '').replace(/\b\d+(?:\.\d+)?\s*%/g, '').trim();
  }

  // Remove leading bullets, numbers, hyphens
  coreText = coreText.replace(/^[\d\.\-\*\•\–\—\s]+/, '').replace(/[\,\;\:\.]*$/, '').trim();

  const lowerCore = coreText.toLowerCase();

  // 2. Check for INS or E-Number (e.g., "INS 110", "E-110", "INS110", "Emulsifier (322)")
  const insMatch = lowerCore.match(/(?:ins|e)[-–\s]*(\d+[a-z]?)/i) || lowerCore.match(/\((\d+[a-z]?)\)/);
  if (insMatch) {
    const code = insMatch[1].toLowerCase();
    if (INS_MAPPING[code]) {
      const mapping = INS_MAPPING[code];
      return {
        id: `ing-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        originalText: rawText,
        normalizedName: mapping.name,
        insNumber: code.toUpperCase(),
        eNumber: `E${code.toUpperCase()}`,
        category: mapping.category,
        detectedConcentration,
        confidence: 0.98,
        sourceImages: [sourceIndex],
        boundingBoxes: box ? [{ imageId: `img-${sourceIndex}`, imageIndex: sourceIndex, x: box.x, y: box.y, width: box.width, height: box.height }] : [],
      };
    }
  }

  // 3. Check direct Synonyms Map
  if (SYNONYMS_MAP[lowerCore]) {
    return {
      id: `ing-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      originalText: rawText,
      normalizedName: SYNONYMS_MAP[lowerCore],
      detectedConcentration,
      confidence: 0.99,
      sourceImages: [sourceIndex],
      boundingBoxes: box ? [{ imageId: `img-${sourceIndex}`, imageIndex: sourceIndex, x: box.x, y: box.y, width: box.width, height: box.height }] : [],
    };
  }

  // 4. Fuzzy OCR error correction against common ingredients
  const canonicalCandidates = [
    'Niacinamide',
    'Glycerin',
    'Water',
    'Tocopherol',
    'Fragrance / Parfum',
    'Phenoxyethanol',
    'Methylparaben',
    'Propylparaben',
    'Hydroquinone',
    'Formaldehyde',
    'Citric Acid',
    'Lecithin',
    'Sunset Yellow FCF',
    'Tartrazine',
    'Sodium Benzoate',
    'Aspartame',
    'Sucralose',
    'Steviol Glycosides',
    'Metanil Yellow',
    'Potassium Bromate',
    'Brominated Vegetable Oil (BVO)',
    'Hexachlorophene',
    'Mercury & Mercurial Compounds',
    'Chloroform',
    'Cocoa Butter',
    'Cocoa Solids',
    'Milk Solids',
    'Palm Oil',
    'Wheat Flour',
    'Iodised Salt',
    'Sugar',
  ];

  const fuzzyResult = findFuzzyMatch(coreText, canonicalCandidates);
  if (fuzzyResult) {
    return {
      id: `ing-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      originalText: rawText,
      normalizedName: fuzzyResult.match,
      detectedConcentration,
      confidence: Math.min(providedConfidence, fuzzyResult.confidence),
      sourceImages: [sourceIndex],
      boundingBoxes: box ? [{ imageId: `img-${sourceIndex}`, imageIndex: sourceIndex, x: box.x, y: box.y, width: box.width, height: box.height }] : [],
    };
  }

  // 5. Default capitalization fallback (unaltered identity preserved)
  const capitalized = coreText
    .split(' ')
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');

  return {
    id: `ing-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    originalText: rawText,
    normalizedName: capitalized || rawText,
    detectedConcentration,
    confidence: Math.max(0.7, providedConfidence),
    sourceImages: [sourceIndex],
    boundingBoxes: box ? [{ imageId: `img-${sourceIndex}`, imageIndex: sourceIndex, x: box.x, y: box.y, width: box.width, height: box.height }] : [],
  };
}

/**
 * Deduplicates and consolidates normalized ingredients across 1-4 scanned images.
 */
export function deduplicateIngredients(items: NormalizedIngredientItem[]): NormalizedIngredientItem[] {
  const map = new Map<string, NormalizedIngredientItem>();

  for (const item of items) {
    const key = item.normalizedName.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { ...item });
    } else {
      const existing = map.get(key)!;
      // Merge source image indices without duplicates
      for (const imgIdx of item.sourceImages) {
        if (!existing.sourceImages.includes(imgIdx)) {
          existing.sourceImages.push(imgIdx);
        }
      }
      existing.sourceImages.sort((a, b) => a - b);

      // Merge bounding boxes
      for (const box of item.boundingBoxes) {
        const isDuplicateBox = existing.boundingBoxes.some(
          (b) => b.imageIndex === box.imageIndex && Math.abs(b.x - box.x) < 2 && Math.abs(b.y - box.y) < 2
        );
        if (!isDuplicateBox) {
          existing.boundingBoxes.push(box);
        }
      }

      // Preserve higher confidence score
      existing.confidence = Math.max(existing.confidence, item.confidence);

      // Keep concentration if existing did not have one
      if (!existing.detectedConcentration && item.detectedConcentration) {
        existing.detectedConcentration = item.detectedConcentration;
      }
    }
  }

  return Array.from(map.values());
}
