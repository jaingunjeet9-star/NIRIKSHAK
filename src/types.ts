export type ComplianceStatus =
  | 'VERIFIED'
  | 'WARNING'
  | 'VIOLATION'
  | 'POTENTIAL_ISSUE'
  | 'NOT_APPLICABLE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_DETECTED'
  | 'LOW_CONFIDENCE'
  | 'REQUIRES_MANUAL_REVIEW';

export type ProductCategory =
  | 'FOOD_BEVERAGE'
  | 'PERSONAL_CARE_COSMETIC'
  | 'HOUSEHOLD_COMMODITY'
  | 'STATIONERY_OFFICE'
  | 'APPAREL_TEXTILE'
  | 'ELECTRONICS'
  | 'TOYS_CHILDREN'
  | 'HARDWARE_CONSUMER'
  | 'SEED_AGRICULTURE'
  | 'FERTILIZER_CHEMICAL'
  | 'PESTICIDE_CROP_PROTECTION'
  | 'PHARMACEUTICAL'
  | 'GENERAL_PACKAGED_COMMODITY'
  // --- Drug & Cosmetics Act 1940 / D&C Rules 1945 ---
  | 'DRUG_GENERAL'            // Ordinary Rx drug — Rules 95/96
  | 'DRUG_SCHEDULE_G'         // Schedule G drug — Rule 97 caution required
  | 'DRUG_SCHEDULE_H'         // Schedule H drug — Rx symbol + warning
  | 'DRUG_SCHEDULE_H1'        // Schedule H1 drug — Red Rx + warning box
  | 'DRUG_SCHEDULE_X'         // Schedule X drug — XRx + pack-size limits
  | 'DRUG_BIOLOGICAL'         // Schedule C / biological / special product
  | 'DRUG_VETERINARY'         // Veterinary medicine — withdrawal period applies
  // --- Indian Systems of Medicine ---
  | 'HOMOEOPATHIC_MEDICINE'   // Rule 106-A/B
  | 'AYURVEDIC_MEDICINE'      // Rule 161 / 161B
  | 'SIDDHA_MEDICINE'         // Rule 161 / 161B
  | 'UNANI_MEDICINE'          // Rule 161 / 161B
  // --- Devices & Diagnostics ---
  | 'MEDICAL_DEVICE'          // Medical Devices Rules 2017, Rule 109-A/C
  | 'IN_VITRO_DIAGNOSTIC'     // IVD — subset of medical device rules
  // --- Contraceptives & Disinfectants ---
  | 'CONTRACEPTIVE_MECHANICAL'
  | 'CONTRACEPTIVE_OTHER'
  | 'DISINFECTANT'
  | 'SURGICAL_DRESSING'       // Suture / ligature / surgical dressing
  // --- Other ---
  | 'EXPORT_PACKAGE'
  | 'MULTI_REGULATORY'        // Product spans multiple regulatory domains
  | 'UNKNOWN';

export type ImageSide =
  | 'FRONT'
  | 'BACK'
  | 'SIDE_A'
  | 'SIDE_B'
  | 'LEFT_SIDE'
  | 'RIGHT_SIDE'
  | 'TOP'
  | 'BOTTOM'
  | 'TOP_NECK'
  | 'NECK'
  | 'CAP'
  | 'LABEL'
  | 'OTHER'
  | 'UNKNOWN';

export interface BoundingBox {
  id: string;
  field: string;
  label: string;
  displayLabel?: string; // Short 1-2 word canonical label (e.g., 'MRP', 'Product Name')
  category?: string; // High-level group for filtering (pricing, product, dates, etc.)
  value: string;
  confidence: number;
  status: ComplianceStatus;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  polygon?: Array<{ x: number; y: number }>; // Percentage coordinates for rotated/angled package text
  sourceSide: ImageSide;
  sourceImageId?: string;
  sourceImageIndex?: number;
}

export interface ProductIdentification {
  category: ProductCategory;
  subcategory: string;
  brandName?: string;
  productName?: string;
  confidence: number; // 0 to 1.0 (e.g. 0.97)
  evidence: string[];
  applicableFrameworks: string[];
}

export interface ImageQualityResult {
  score: number; // 0 to 100
  usable: boolean;
  issues: string[];
}

export interface ExtractedFields {
  // Product Identity
  brandName?: string;
  productName?: string;
  category?: ProductCategory;
  varietyOrGrade?: string;
  isImported?: boolean;

  // Quantity & Measurements
  netQuantity?: string;
  netQuantityUnit?: string;
  declaredQuantityValue?: number;
  unitSalePrice?: string;
  declaredToleranceNote?: string;

  // Pricing & Taxation
  mrp?: string;
  mrpValue?: number;
  actualSellingPrice?: number;
  mrpOverchargeAmount?: number;
  mrpOverchargePercent?: number;
  taxDeclaration?: string; // e.g., "Inclusive of all taxes"

  // Manufacturer / Packer / Importer
  manufacturerName?: string;
  manufacturerAddress?: string;
  packerName?: string;
  packerAddress?: string;
  importerName?: string;
  importerAddress?: string;
  marketerName?: string;
  barcode?: string;
  gtin?: string;
  countryOfOrigin?: string;

  // Dates & Lot Codes
  mfgMonthYear?: string;
  packingDate?: string;
  expiryDate?: string;
  useBeforeDate?: string;
  batchNumber?: string;
  lotNumber?: string;

  // Consumer Grievance & Care (Mandatory under LM(PC) Rule 6(1)(n))
  consumerCareName?: string;
  consumerCarePhone?: string;
  consumerCareEmail?: string;
  consumerCareAddress?: string;

  // Cosmetic & Personal Care Specific Declarations (Cosmetics Rules 2020)
  cosmeticMfgLicense?: string;
  cosmeticIngredients?: string;
  spfRating?: string;
  uvProtectionClaim?: string;

  // Food & Beverage Specific (FSSAI 2020)
  fssaiLicenseNumber?: string;
  vegNonVegMark?: string;
  vegNonVegDeclaration?: string;
  ingredientsList?: string;
  nutritionalInfo?: string;

  // Stationery & Office Products Specific
  stationeryItemType?: string;
  packQuantityCount?: string;

  // Apparel & Textile Specific
  fiberComposition?: string;
  apparelSize?: string;

  // Toys & Children Products Specific (BIS IS:9873)
  toySafetyLicense?: string;
  is9873Compliance?: boolean;

  // Electronics & Electrical Specific (BEE Star Rating / BIS)
  powerRatingWatts?: string;
  starRating?: string;

  // Agricultural & Chemical Specific Declarations (ONLY when category = SEED_AGRICULTURE or FERTILIZER_CHEMICAL)
  germinationPercentage?: number;
  geneticPurityPercentage?: number;
  dateOfTest?: string;
  testValidityPeriod?: string;
  seedClass?: string; // 'Certified' | 'Foundation' | 'Breeder'
  npkRatio?: string;
  nutrientGuarantees?: string;
  moisturePercentage?: number;
  isiMarkNumber?: string;
  fcoLicenseNumber?: string;

  // Crop Protection / Pesticide Specific (Insecticides Act 1968)
  cibRegistrationNumber?: string;
  antidoteWarning?: string;
  toxicityClass?: string;

  // ──────────────────────────────────────────────────────────────────────────
  // Pharmaceutical / Drug Specific (D&C Rules 1945)
  // ──────────────────────────────────────────────────────────────────────────
  drugLicenseNumber?: string;
  drugProperName?: string;          // Proper/generic pharmacopoeial name
  drugTradeName?: string;           // Trade / brand name of drug
  activeIngredients?: string;       // Active ingredient(s) with quantity
  dosageForm?: string;              // e.g. tablets, capsules, oral liquid, cream, injection
  scheduleClassification?: string;  // 'G' | 'H' | 'H1' | 'X' | 'C' | 'none'
  rxSymbol?: string;                // Detected Rx / NRx / XRx symbol text
  rxSymbolColor?: string;           // Detected colour of Rx symbol (red, black, etc.)
  rxSymbolPosition?: string;        // Detected position description
  scheduleHWarning?: string;        // Full detected Schedule H warning text
  scheduleHWarningText?: string;    // Alias — same as above
  scheduleH1WarningBox?: boolean;   // true if a red-border warning box is detected
  scheduleGCaution?: string;        // Detected Schedule G cautionary text
  scheduleXWarning?: string;        // Detected Schedule X warning text
  xrxSymbol?: string;               // Detected XRx symbol text
  importLicenseNumber?: string;     // Import licence number for imported drugs / devices
  alcoholPercentage?: string;       // e.g. "6.4% v/v alcohol"
  externalUseDeclaration?: string;  // Detected "FOR EXTERNAL USE ONLY" text
  physicianSampleDeclaration?: string; // Detected "Physician's Sample — Not to be sold"
  redVerticalLine?: boolean;        // true if red vertical line detected on left panel
  netContentForDrug?: string;       // Net content for drug (may differ from general qty)
  storageConditions?: string;       // Storage / handling conditions text
  withdrawalPeriod?: string;        // Veterinary withdrawal period (e.g. "7 days")
  animalSpecies?: string;           // Target species for veterinary drugs
  prohibitedClaims?: string[];      // Detected therapeutic / disease-cure claims

  // ──────────────────────────────────────────────────────────────────────────
  // Homoeopathic Medicine Specific (Rule 106-A/B)
  // ──────────────────────────────────────────────────────────────────────────
  potency?: string;                 // e.g. "30C", "200X", "1M"
  pharmacopoeialName?: string;      // Official pharmacopoeial / descriptive name
  motherTinctureBatchNo?: string;   // Batch number of mother tincture used
  motherTinctureLicenseNo?: string; // Manufacturing licence of mother tincture
  homoeoAlcoholContent?: string;    // Alcohol % in homoeopathic preparation
  isMotherTincture?: boolean;       // true if product is a mother tincture (Q)
  multiIngredientList?: string;     // Ingredient : potency : proportion list

  // ──────────────────────────────────────────────────────────────────────────
  // ASU (Ayurvedic / Siddha / Unani) Specific (Rule 161 / 161B)
  // ──────────────────────────────────────────────────────────────────────────
  botanicalNames?: string;          // Botanical names of plant ingredients
  plantParts?: string;              // Plant parts used (root, leaf, bark, etc.)
  asuLicenseNumber?: string;        // ASU manufacturing licence number
  asuBatchNumber?: string;          // ASU batch / lot number
  asuMfgDate?: string;              // ASU manufacturing date
  asuExpiryDate?: string;           // ASU expiry date
  asuCategory?: string;             // 'ayurvedic' | 'siddha' | 'unani'
  scheduleE1Ingredients?: string;   // Schedule E(1) substances identified on label
  preservativeInfo?: string;        // Preservative and colouring agent declaration
  referenceMethod?: string;         // Reference/method of preparation

  // ──────────────────────────────────────────────────────────────────────────
  // Medical Device Specific (Medical Devices Rules 2017, Rule 109-A/C)
  // ──────────────────────────────────────────────────────────────────────────
  deviceProperName?: string;        // Proper name of device
  deviceBatchNumber?: string;       // Device batch / lot number
  deviceSterileState?: string;      // "STERILE" or equivalent
  deviceSterilisationMethod?: string; // e.g. ETO, Gamma, Steam
  deviceSingleUse?: boolean;        // true if "single use" / "do not reuse" present
  clinicalInvestigationOnly?: boolean; // true if "FOR CLINICAL INVESTIGATION ONLY"
  deviceImportLicenseNumber?: string; // Import licence for imported devices
  deviceShelfLifeMonths?: number;   // Computed shelf life in months

  // ──────────────────────────────────────────────────────────────────────────
  // Extended Cosmetic Specific (Rule 148 / 148B)
  // ──────────────────────────────────────────────────────────────────────────
  cosmeticName?: string;            // Declared name of the cosmetic product
  cosmeticBatchPrefix?: string;     // Prefix used on batch (should be "B")
  cosmeticMfgLicPrefix?: string;    // Prefix used on mfg licence (should be "M")
  hairDyeCaution?: string;          // Hair dye caution text
  sensitivityTestInstruction?: string; // Preliminary sensitivity test instructions
  prohibitedIngredients?: string[]; // Detected prohibited ingredients
  hexachlorophenePresent?: boolean; // true if hexachlorophene detected
  isSoap?: boolean;                 // true if product is classified as soap
}

export interface InspectionImageRecord {
  id: string;
  side: ImageSide;
  detectedView?: string;
  userLabel?: string;
  ocrStatus?: 'PENDING' | 'READY' | 'ERROR';
  qualityStatus?: 'GOOD' | 'FAIR' | 'LOW_QUALITY';
  qualityIssues?: string[];
  isPrincipalDisplayPanel?: boolean;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  previewUrl?: string; // transient or object URL
  hasIndexedBlob?: boolean;
}

export interface FieldSourceRecord {
  imageIndex: number;
  imageId: string;
  viewType: string;
  confidence: number;
  rawValue: string;
}

export interface FieldConflict {
  field: string;
  label: string;
  values: {
    imageIndex: number;
    imageId: string;
    viewType: string;
    value: string;
  }[];
  status: 'REVIEW_REQUIRED';
  description: string;
}

export interface CoverageWarning {
  hasWarning: boolean;
  message: string;
  missingViews?: string[];
}

export interface MultiImageContext {
  imageCount: number;
  detectedViews: { imageIndex: number; imageId: string; viewType: string; isPdp: boolean }[];
  pdpImageIndex?: number;
  fieldSources: Record<string, FieldSourceRecord[]>;
  fieldConflicts: FieldConflict[];
  coverageWarning?: CoverageWarning;
}

export type RuleActName =
  | 'LM_PC_2011'
  | 'COSMETICS_RULES_2020'
  | 'SEEDS_ACT_1966'
  | 'FCO_1985'
  | 'INSECTICIDES_ACT_1968'
  | 'FSSAI_2020'
  | 'IMPORTED_RULES'
  | 'BIS_COMPULSORY_REGISTRATION'
  | 'TOYS_QUALITY_CONTROL_ORDER'
  | 'TEXTILE_LABELLING_RULES'
  // --- Drugs & Cosmetics Act / Rules ---
  | 'DRUGS_COSMETICS_ACT_1940'
  | 'DRUGS_COSMETICS_RULES_1945'
  // --- Medical Devices ---
  | 'MEDICAL_DEVICES_RULES_2017';

export type RuleCategory =
  | 'PRICING_MRP'             // Maximum Retail Price, Unit Sale Price, overcharge prohibition
  | 'CONSUMER_CARE'           // Grievance contact, helpline, email, address
  | 'DATES_EXPIRY'            // Mfg date, packing date, expiry date, validity period
  | 'SAFETY_WARNINGS'         // Toxicity warnings, toy safety, Schedule H/H1 warnings, caution statements
  | 'STANDARDS_QUALITY'       // Seed germination, FCO fertilizer ratios, BIS ISI standards, purity
  | 'IDENTITY_ORIGIN'         // Generic name, manufacturer/packer/importer name and address, country of origin
  | 'QUANTITY_MEASUREMENT'    // Net quantity, standard units, MPE tolerances
  | 'INGREDIENTS_COMPOSITION' // INCI ingredients, botanical names, nutritional info, veg/non-veg mark
  | 'LICENSES_REGISTRATIONS'; // FSSAI license, cosmetic license, drug license, CIB registration

export interface StatutoryRule {
  ruleId: string;
  actName: RuleActName;
  sectionRef: string;
  title: string;
  description: string;
  applicableCategories: ProductCategory[];
  isMandatory: boolean;
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'ADVISORY';
  ruleCategory?: RuleCategory;
  rule_category?: RuleCategory;
  criticality?: 'CRITICAL' | 'NON_CRITICAL';
  effectiveVersion: string;
  effectiveDate: string;
  statutoryPenaltyRef?: string;
}

export interface ComplianceFinding {
  id: string;
  ruleId: string;
  actName: string;
  sectionRef: string;
  title: string;
  status: ComplianceStatus;
  confidence: number;
  detectedText: string;
  statutoryStandardText: string;
  explanation: string;
  recommendedAction: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'ADVISORY';
  evidenceLocation?: string;
  sourceImageIndex?: number;
  sourceImageView?: string;
  hasConflict?: boolean;
  conflictDetails?: string;
  isPdpViolation?: boolean;
  statutoryRationale?: string; // Explainability: Why this rule applies to the product category
  targetBoundingBoxId?: string; // Visual Evidence linking: Direct pointer to visual bounding box
  evidenceSide?: ImageSide | string; // Package panel containing visual evidence
  field?: string; // Associated extracted field key
  reviewerOverride?: {
    overriddenBy: string;
    previousStatus?: ComplianceStatus | string;
    newStatus: ComplianceStatus;
    decision?: string;
    reason: string;
    timestamp: string;
  };
}

export interface ReviewDecisionRecord {
  id: string;
  inspectionId: string;
  findingId?: string;
  ruleId?: string;
  sectionRef?: string;
  reviewer: string;
  timestamp: string;
  decision: 'VERIFIED' | 'VIOLATION' | 'ACCEPT' | 'REJECT' | 'MARK_VERIFIED' | string;
  previousStatus: ComplianceStatus | string;
  newStatus: ComplianceStatus | string;
  notes?: string;
}

export interface InspectionRecord {
  id: string;
  scanId: string;
  analysisSource: 'uploaded_image' | 'preset';
  batchReference: string;
  createdAt: string;
  updatedAt: string;
  status:
  | 'DRAFT'
  | 'ANALYZING'
  | 'COMPLETED'
  | 'NEEDS_REVIEW'
  | 'SEIZURE_FLAGGED'
  | 'UNCERTAIN_CATEGORY'
  | 'ANALYSIS_ERROR';
  inspectorName: string;
  stationNode: string;
  productName: string;
  category: ProductCategory;
  isImported: boolean;
  productIdentification?: ProductIdentification;
  imageQuality?: ImageQualityResult;
  images: InspectionImageRecord[];
  extractedFields: ExtractedFields;
  boundingBoxes: BoundingBox[];
  findings: ComplianceFinding[];
  completenessScore: number; // 0 - 100
  summaryCounts: {
    verified: number;
    violations: number;
    warnings: number;
    insufficientEvidence: number;
    potentialIssues: number;
    notDetected: number;
    requiresReview: number;
    lowConfidence: number;
    notApplicable: number;
  };
  fieldSources?: Record<string, FieldSourceRecord[]>;
  fieldConflicts?: FieldConflict[];
  coverageWarning?: CoverageWarning;
  evidenceHash?: string; // SHA-256 Cryptographic Evidence Digest
  hashAlgorithm?: string; // 'SHA-256'
  tamperVerified?: boolean;
  inspectorNotes?: string;
  officialNoticeDraft?: string;
  errorMessage?: string;
  isDemoData?: boolean;
}

export interface RepeatViolationRuleSummary {
  ruleId: string;
  sectionRef: string;
  title: string;
  count: number;
}

export interface ManufacturerProfile {
  id: string;
  name: string;
  state: string;
  licenseNumber: string;

  // Live Manufacturer Compliance Passport Metrics
  productsInspected: number; // Count of DISTINCT inspection records for this manufacturer
  compliant: number;         // Count of inspections with overall status of "Verified" (no issues or reviews)
  violations: number;        // Count of inspections that have at least one finding with status "Potential Issue" or "Not Detected"
  repeatViolations: number;  // Count of specific RULES that have been violated 2 or more times
  repeatViolationRules: RepeatViolationRuleSummary[]; // Detailed repeating rules
  criticalViolations: number; // Count of violations belonging to critical rule categories
  lastInspection: string | null; // Formatted / ISO timestamp of most recent inspection record

  isDemoData: boolean;       // Visually marked as Demo Data (Section 41) vs Live Scans

  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskReason: string;        // Dynamically generated risk assessment
  recentViolations: string[];// Dynamically generated recent violations list

  // Legacy/compatibility counters
  totalInspected: number;
  verifiedCount: number;
  needsReviewCount: number;
  potentialIssuesCount: number;
}

export interface AuditLogEntry {
  id: string;
  inspectionId: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

export type DocumentType = 'NOTICE' | 'MEMO' | 'NON_COMPLIANCE_REPORT' | 'COMPLIANCE_REPORT';
export type DocumentStatus = 'DRAFT' | 'REVIEWED' | 'ISSUED';

export interface ComplianceDocument {
  documentId: string;
  documentType: DocumentType;
  status: DocumentStatus;
  manufacturerId: string;
  manufacturerName: string;
  manufacturerAddress?: string;
  inspectionId: string;
  productName: string;
  brandName?: string;
  violationFindingId: string;
  ruleId: string;
  sectionRef: string;
  ruleTitle: string;
  ruleCategory?: string;
  severity: string;
  findingStatus: string;
  detectedText?: string;
  statutoryStandardText?: string;
  evidenceRef?: string;
  inspectorName?: string;
  stationNode?: string;
  inspectionDate: string;
  documentBody: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  batchReference?: string;
  netQuantity?: string;
  mrp?: string;
  groundsForAction?: string;
  explanation?: string;
}

export interface ManufacturerViolationFinding {
  finding: ComplianceFinding;
  inspection: InspectionRecord;
  mfgId: string;
}

export interface RepeatViolationGroup {
  ruleId: string;
  sectionRef: string;
  ruleTitle: string;
  ruleCategory?: string;
  isCritical: boolean;
  count: number;
  affectedProducts: number;
  latestDate: string | null;
  occurrences: Array<{
    inspectionId: string;
    productName: string;
    brandName?: string;
    date: string | null;
    findingId: string;
    findingStatus: string;
  }>;
}

export function hasUnresolvedFindings(inspection: InspectionRecord): boolean {
  if (!inspection || !Array.isArray(inspection.findings) || inspection.findings.length === 0) {
    return inspection?.status === 'NEEDS_REVIEW';
  }
  return inspection.findings.some(
    (f) => f.status !== 'VERIFIED' && f.status !== 'NOT_APPLICABLE' && !f.reviewerOverride
  );
}



export interface ReferenceObjectProfile {
  id: string;
  name: string;
  markerType: 'ARUCO_4X4_50' | 'CUSTOM_CALIBRATION_CARD' | 'CUSTOM_FIDUCIAL';
  markerId?: number;
  physicalWidthMm: number;
  physicalHeightMm: number;
  toleranceMm: number;
  isActive: boolean;
  registeredAt: string;
  inspectorId: string;
  referenceImageUrl?: string;
  isConfirmedByInspector: boolean;
}

export interface FiducialMarkerData {
  markerId: number;
  markerType: string;
  detectedPixelWidth: number;
  detectedPixelHeight: number;
  confidence: number;
  corners: Array<{ x: number; y: number }>;
  isPerspectiveValid: boolean;
  isBlurAcceptable: boolean;
}

export interface MeasuredFieldFont {
  field: string;
  label: string;
  detectedText: string;
  glyphHeightPx: number;
  glyphWidthPx: number;
  glyphHeightMm: number;
  glyphWidthMm: number;
  widthHeightRatio: number;
  requiredMinHeightMm: number;
  requiredMinRatio?: number;
  status: ComplianceStatus;
  explanation: string;
  boundingBox?: BoundingBox;
}

export interface FontSizeMeasurementResult {
  performed: boolean;
  status: ComplianceStatus;
  scalePxPerMm: number;
  scaleMmPerPx: number;
  scaleUncertaintyPercent: number;
  detectedMarker?: FiducialMarkerData;
  referenceProfileUsed?: ReferenceObjectProfile;
  measuredFields: MeasuredFieldFont[];
  summaryMessage: string;
  noticeReason?: string;
}


// ═══════════════════════════════════════════════════════════════════════════════
// LAB REPORT ANALYZER — Type Definitions
// ═══════════════════════════════════════════════════════════════════════════════

export type LabResultStatus =
  | 'WITHIN_LIMIT'
  | 'ABOVE_LIMIT'
  | 'BELOW_LIMIT'
  | 'NOT_DETECTED'
  | 'BLQ_CONCLUSIVE'
  | 'BLQ_INCONCLUSIVE'
  | 'NO_APPLICABLE_FSSAI_LIMIT'
  | 'CATEGORY_REVIEW_REQUIRED'
  | 'UNIT_INCOMPATIBLE'
  | 'REGULATORY_REVIEW_REQUIRED'
  // Existing & backwards-compatible statuses:
  | 'BELOW_MINIMUM'
  | 'PERMITTED_GMP'
  | 'NOT_PERMITTED'
  | 'PROHIBITED'
  | 'NOT_REPORTED'
  | 'CANNOT_DETERMINE'
  | 'NO_APPLICABLE_LIMIT'
  | 'MANUAL_VERIFICATION_REQUIRED'
  | 'DETECTED_REVIEW'
  | 'REQUIRES_VERIFICATION';

export interface LabComparisonDetail {
  actual: number | string;
  operator: '<=' | '>=' | '<' | '>' | '==' | 'RANGE' | 'GMP' | 'PROHIBITED';
  limit: number | string | null;
  result: boolean;
  formatted_comparison?: string;
}

export type LabRuleType =
  | 'MAXIMUM_LIMIT'
  | 'MINIMUM_LIMIT'
  | 'RANGE'
  | 'PRESENCE_ALLOWED'
  | 'PRESENCE_NOT_ALLOWED'
  | 'PROHIBITED'
  | 'MICROBIOLOGICAL_LIMIT'
  | 'COMPOSITION_REQUIREMENT'
  | 'ADDITIVE_LIMIT'
  | 'CONTAMINANT_LIMIT'
  | 'TOXIN_LIMIT'
  | 'RESIDUE_LIMIT'
  | 'OTHER';

export type NirikshakLabGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface FSSAILabRule {
  id: string;
  regulation_name: string;
  regulation_version: string;
  source_document: string;
  source_section: string;
  source_page?: string;
  rule_reference: string;
  product_category: string;
  product_subcategory?: string;
  parameter_name: string;
  parameter_aliases: string[];
  substance_name: string;
  substance_aliases: string[];
  INS_number?: string;
  CAS_number?: string;
  rule_type: LabRuleType;
  limit_type: 'MAX' | 'MIN' | 'RANGE' | 'PROHIBITED' | 'PRESENCE' | 'GMP';
  limit_value?: number;
  lower_limit?: number;
  upper_limit?: number;
  unit: string;
  basis?: string;
  condition?: string;
  applicable_product?: string;
  applicable_process?: string;
  applicability_notes?: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'ADVISORY';
  criticality: 'CRITICAL' | 'NON_CRITICAL';
  prohibited_status: boolean;
  analytical_method_reference?: string;
  source_text: string;
  active: boolean;
  effective_date?: string;
  ingested_from_pdf?: boolean;
  extraction_confidence?: number;
  requires_manual_review?: boolean;
}

export interface LabTestResult {
  id: string;
  parameter: string;
  parameter_normalized: string;
  detected_value: string | null;
  detected_numeric: number | null;
  unit: string;
  unit_normalized: string;
  detection_limit: string | null;
  quantification_limit: string | null;
  method?: string;
  result_text: string;
  is_not_detected: boolean;
  nd_qualifier?: string;
  source_page?: number;
  extraction_confidence: number;
  requires_verification: boolean;
  original_extracted?: string;
  inspector_corrected?: boolean;
  inspector_correction_note?: string;
  corrected_at?: string;
  corrected_by?: string;
  result_type?: 'BLQ' | 'NUMERIC' | 'QUALITATIVE' | 'INEQUALITY';
  loq?: string | null;
  accreditation_status?: 'NABL_ACCREDITED' | 'NON_ACCREDITED';
  sample_name?: string;
  report_number?: string;
}

export interface LabComplianceFinding {
  id: string;
  test_result_id: string;
  rule_id: string | null;
  parameter: string;
  reported_result: string;
  reported_numeric: number | null;
  reported_unit: string;
  normalized_numeric: number | null;
  normalized_unit: string;
  fssai_limit_value: number | null;
  fssai_lower_limit: number | null;
  fssai_upper_limit: number | null;
  fssai_unit: string;
  limit_type: string;
  status: LabResultStatus;
  difference_from_limit: number | null;
  percent_of_limit: number | null;
  product_category_matched: string;
  rule_reference: string | null;
  regulation_name: string | null;
  source_section: string | null;
  source_page: string | null;
  source_document: string | null;
  explanation: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'ADVISORY' | 'NONE';
  is_prohibited: boolean;
  is_microbiological: boolean;
  comparison_detail?: LabComparisonDetail;
  matched_rule?: any;
  result_type?: 'BLQ' | 'NUMERIC' | 'QUALITATIVE' | 'INEQUALITY';
  loq?: string | null;
  accreditation_status?: 'NABL_ACCREDITED' | 'NON_ACCREDITED';
}

export interface LabGradeResult {
  grade: NirikshakLabGrade;
  score: number;
  total_evaluated: number;
  within_limit: number;
  above_limit: number;
  below_minimum: number;
  prohibited: number;
  not_detected: number;
  not_reported: number;
  cannot_determine: number;
  no_applicable_limit: number;
  critical_violations: number;
  major_violations: number;
  microbiological_failures: number;
  grade_reasons: string[];
  methodology_notes: string;
  disclaimer: string;
}

export interface LabReportSample {
  product_name?: string;
  product_category?: string;
  product_category_confidence?: number;
  product_subcategory?: string;
  manufacturer?: string;
  brand?: string;
  batch_lot_number?: string;
  sample_id?: string;
  manufacturing_date?: string;
  expiry_date?: string;
  sample_collection_date?: string;
  report_date?: string;
  laboratory_name?: string;
  laboratory_accreditation?: string;
  test_method?: string;
  sample_quantity?: string;
  additional_info?: string;
  category_auto_detected: boolean;
  category_requires_inspector_selection: boolean;
}

export type LabReportStatus =
  | 'DRAFT'
  | 'UPLOADING'
  | 'EXTRACTING'
  | 'AWAITING_REVIEW'
  | 'ANALYZING'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'ERROR';

export interface LabSampleReport {
  sample_id: string; // e.g. "CG23-017639.001"
  sample_name: string; // e.g. "PROTEIN POWDER - PLAIN ISOLATE"
  report_number: string; // e.g. "CG23-017639"
  report_control_number?: string;
  sample: LabReportSample;
  test_results: LabTestResult[];
  findings: LabComplianceFinding[];
  grade_result?: LabGradeResult;
  accreditation_summary: {
    nabl_count: number;
    non_accredited_count: number;
  };
  summary: {
    total_tests: number;
    within_limit: number;
    below_quantification: number;
    above_limit: number;
    no_applicable_limit: number;
    unmatched: number;
  };
  analysis?: SingleSourceOfTruthLabAnalysis;
}

export interface LabReport {
  id: string;
  created_at: string;
  updated_at: string;
  inspector_name: string;
  station_node: string;
  status: LabReportStatus;
  status_message?: string;
  file_name?: string;
  file_size?: number;
  file_mime?: string;
  page_count?: number;
  sample: LabReportSample;
  test_results: LabTestResult[];
  findings: LabComplianceFinding[];
  additive_findings?: AdditiveComplianceFinding[];
  grade_result?: LabGradeResult;
  quality_warnings: string[];
  report_quality_score: number;
  ai_provider?: string;
  extraction_model?: string;
  linked_inspection_id?: string;
  linked_manufacturer_id?: string;
  is_demo?: boolean;
  raw_extraction?: string;
  samples?: LabSampleReport[];
  multi_sample_summary?: {
    sample_count: number;
    total_parameter_count: number;
    parameters_per_sample: Record<string, number>;
    pages_processed: number;
  };
  active_sample_index?: number;
  analysis?: SingleSourceOfTruthLabAnalysis;
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED FSSAI REGULATORY ANALYSIS — SINGLE SOURCE OF TRUTH
// ─────────────────────────────────────────────────────────────────────────────

export interface StructuredFSSAIRule {
  ruleId: string;
  parameter: string;
  canonicalParameter: string;
  aliases: string[];
  insNumber?: string;
  foodCategory: string; // e.g. "PROTEIN_SUPPLEMENT", "HEALTH_SUPPLEMENT", "DAIRY", "GENERAL_FOOD"
  productCategory: string;
  ruleDomain: 'CONTAMINANTS' | 'TOXINS' | 'FOOD_ADDITIVES' | 'MICROBIOLOGICAL' | 'COMPOSITION' | 'RESIDUES' | 'IDENTITY';
  ruleType: 'MAXIMUM_LIMIT' | 'MINIMUM_LIMIT' | 'RANGE' | 'PROHIBITED' | 'QUALITATIVE_ABSENT';
  operator: '<=' | '>=' | '<' | '>' | '==' | 'RANGE' | 'ABSENT';
  minimumValue?: number;
  maximumValue?: number;
  allowedValue?: string;
  unit: string;
  basis: string; // e.g. "as sold", "dry basis", "powdered food"
  applicability: string;
  sourceRegulation: string;
  sourceVersion: string;
  sourceSection: string;
  sourceTable: string;
  sourcePage?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  notes?: string;
  specialConditions?: string;
  numericalLimitSpecified?: boolean;
}

export interface AnalyzedParameterFinding {
  id: string;
  testResultId: string;
  parameter: string;
  canonicalParameter: string;
  reportedResult: string;
  reportedNumeric: number | null;
  reportedUnit: string;
  normalizedResult: number | null;
  normalizedUnit: string;
  fssaiLimitDisplay: string; // e.g. "0.50 mg/kg" or "Not specified"
  fssaiLimitValue: number | null;
  fssaiLowerLimit: number | null;
  fssaiUpperLimit: number | null;
  fssaiUnit: string;
  hasNumericalLimit: boolean;
  limitType: string;
  applicableCategory: string;
  comparisonDisplay: string; // e.g. "0.03 ≤ 0.50" or "No numerical limit"
  status: LabResultStatus;
  statusBadgeLabel: string;
  explanation: string;
  regulatorySource: {
    regulation: string;
    version: string;
    section: string;
    table: string;
    page?: string;
    effectiveDate?: string;
  };
  resultType?: 'BLQ' | 'NUMERIC' | 'QUALITATIVE' | 'INEQUALITY';
  loq?: string | null;
  accreditationStatus?: 'NABL_ACCREDITED' | 'NON_ACCREDITED';
  percentOfLimit?: number | null;
  requiresReview: boolean;
  reviewReason?: string;
}

export interface SingleSourceOfTruthLabAnalysis {
  reportInfo: {
    reportId: string;
    reportNumber: string;
    productName: string;
    laboratoryName: string;
    laboratoryAccreditation?: string;
    reportDate: string;
    analysisDate: string;
    sampleCollectionDate?: string;
    batchLotNumber?: string;
    inspectorName?: string;
    stationNode?: string;
  };
  productClassification: {
    productName: string;
    detectedCategory: string;
    categoryDisplayName: string;
    confidence: 'High' | 'Medium' | 'Low';
    confidenceScore: number;
    applicableRegulatoryFramework: string;
    requiresReview: boolean;
    reviewReason?: string;
  };
  parameters: AnalyzedParameterFinding[];
  complianceSummary: {
    totalParameters: number;
    rulesMatched: number;
    withinLimit: number;
    aboveLimit: number;
    notDetectedOrBlq: number;
    noApplicableNumericalLimit: number;
    manualReviewRequired: number;
    complianceRatePercent: number;
    // Enhanced convenience metrics
    isCompliant?: boolean;
    compliantCount?: number;
    blqConclusiveCount?: number;
    aboveLimitCount?: number;
    noLimitSpecifiedCount?: number;
    requiresReviewCount?: number;
    complianceRate?: number;
    complianceScore?: number;
  };
  regulatoryCoverage: {
    parametersDetected: number;
    rulesMatched: number;
    rulesSuccessfullyCompared: number;
    noApplicableNumericalLimit: number;
    categoryDependent: number;
    manualReview: number;
    // Enhanced fields
    coveragePercentage?: number;
    accreditationPercentage?: number;
    nablAccreditedCount?: number;
    totalEvaluated?: number;
    applicableRegulations?: string[];
  };
  reviewRequired: Array<{
    parameter: string;
    reportedResult: string;
    reason: string;
    missingOrAmbiguousInfo?: string;
    actionNeeded?: string;
    actionRequired?: string;
    source?: string;
    reportedValue?: string;
  }>;
  charts: {
    complianceDistribution: Array<{ name: string; value: number; color: string }>;
    contaminantComparison: Array<{
      parameter: string;
      reported: number;
      limit: number;
      unit: string;
      percentOfLimit: number;
    }>;
    heavyMetals: Array<{
      parameter: string;
      reported: number;
      limit: number;
      unit: string;
      status: LabResultStatus;
      isBlq?: boolean;
    }>;
    heavyMetalsComparison?: Array<{
      parameter: string;
      reportedValue: number | null;
      fssaiLimit: number | null;
      unit: string;
      status: LabResultStatus;
      isBlq?: boolean;
    }>;
  };
  sources: Array<{
    regulation: string;
    version: string;
    section: string;
    table: string;
    page?: string;
    effectiveDate?: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// FSSAI APPENDIX A — FOOD ADDITIVE PERMISSION TYPES
// Source: FSS (Food Products Standards and Food Additives) Regulations, 2011
//         Version-XXIV (01.07.2022), Appendix A, Tables 1–14
//
// These are SEPARATE from FSSAILabRule (which covers contaminants, mycotoxins,
// microbiological limits). Additive rules answer: "Is additive X permitted in
// food category Y, and at what maximum level?"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One row from the FSSAI Appendix A food-additive permission tables.
 * Maps a (food_category_code, additive) pair to its permission status and
 * maximum permitted level.
 */
export interface FSSAIAdditiveRule {
  /** Unique rule ID, e.g. "ADD-1.1.1.1-PHOS-001" */
  id: string;
  /** FSSAI food-category-system code, e.g. "1.1.1.1" */
  food_category_code: string;
  /** Human-readable category name, e.g. "Milk (plain)" */
  food_category_name: string;
  /** Additive name as written in the regulation */
  additive_name: string;
  /** Common aliases for matching (lab report terminology) */
  additive_aliases: string[];
  /** INS number string as printed in the regulation, e.g. "330" or "322(i),(ii)" */
  ins_number: string | null;
  /**
   * Maximum permitted level.
   * - A numeric string like "100" for quantitative limits
   * - "GMP" for Good Manufacturing Practice
   * - "NO_ADDITIVES" for categories with no additives permitted
   */
  maximum_level: string;
  /** Unit for maximum_level: "mg/kg", "g/kg", "%", "GMP", or "NO_ADDITIVES" */
  unit: string;
  /**
   * Whether the maximum_level is "GMP" (Good Manufacturing Practice).
   * When true, do NOT compare numerically — status will be PERMITTED_GMP.
   */
  is_gmp: boolean;
  /**
   * Whether this is a "No additives permitted" rule for the whole category.
   * When true, ANY detected additive → NOT_PERMITTED.
   */
  no_additives_permitted: boolean;
  /** Note/condition codes from the regulation (e.g. "33, 227") */
  notes: string | null;
  /** Full note text if known */
  notes_text?: string;
  /** Source PDF page number */
  source_page: string;
  /** Source table, e.g. "Table 1" */
  source_table: string;
  /** Regulation version */
  regulation_version: string;
  /** Active/inactive flag */
  active: boolean;
}

/**
 * A substance explicitly prohibited in food products (e.g. prohibited
 * flavouring agents listed in the FSSAI regulations).
 * Kept separate from additive permission rules.
 */
export interface FSSAIProhibitedSubstance {
  /** Unique ID */
  id: string;
  /** Substance name as in the regulation */
  substance_name: string;
  /** Common aliases/synonyms */
  aliases: string[];
  /** Category: "FLAVOURING_AGENT" | "SOLVENT" | "OTHER" */
  type: 'FLAVOURING_AGENT' | 'SOLVENT' | 'OTHER';
  /** Specific restriction text */
  restriction: string;
  /** Source page */
  source_page: string;
  /** Regulation version */
  version: string;
}

/**
 * Status of an additive compliance finding.
 * Matches the status system defined in FSSAI_INGREDIENT_RULES_README.md §8.
 */
export type AdditivePermissionStatus =
  | 'WITHIN_LIMIT'      // Detected concentration ≤ applicable numeric limit
  | 'ABOVE_LIMIT'       // Detected concentration > applicable numeric limit
  | 'PERMITTED_GMP'     // Additive permitted subject to GMP (no numeric limit to compare)
  | 'NOT_PERMITTED'     // Applicable category does not permit this additive
  | 'PROHIBITED'        // Substance appears in the explicit prohibited-substance list
  | 'MANUAL_REVIEW'     // No sufficiently specific rule matched; do not assume safe/unsafe
  | 'NOT_DETECTED';     // Laboratory report states the substance was not detected

/**
 * One additive compliance finding from the Appendix A permission check.
 * Produced by the additivePermissionEngine for each detected additive.
 *
 * NOTE: These are stored separately from LabComplianceFinding[] (contaminants/
 * microbiological). The LabReport.additive_findings field holds these.
 */
export interface AdditiveComplianceFinding {
  /** Unique finding ID */
  id: string;
  /** Name of the detected additive as reported in the lab report */
  detected_name: string;
  /** Normalized additive name used for matching */
  normalized_name: string;
  /** INS number if detected or matched */
  ins_number: string | null;
  /** Reported lab value (numeric string or "ND"/"Not Detected") */
  lab_value: string | null;
  /** Numeric value extracted from lab_value */
  lab_value_numeric: number | null;
  /** Unit as reported by the laboratory */
  lab_unit: string | null;
  /** FSSAI food-category-system code matched */
  food_category_code: string | null;
  /** FSSAI food-category name matched */
  food_category_name: string | null;
  /** The matched FSSAI additive rule, if found */
  matched_rule_id: string | null;
  /** Maximum permitted level from the regulation ("GMP" or numeric string) */
  fssai_limit: string | null;
  /** Unit of the FSSAI limit */
  fssai_unit: string | null;
  /** Whether the FSSAI limit is GMP */
  fssai_is_gmp: boolean;
  /** Numeric FSSAI limit, null if GMP or not found */
  fssai_limit_numeric: number | null;
  /** Notes/conditions from the regulation */
  fssai_notes: string | null;
  /** Permission status */
  status: AdditivePermissionStatus;
  /** Human-readable explanation of the finding */
  explanation: string;
  /** Source PDF page of the matched rule */
  source_page: string | null;
  /** Source table of the matched rule */
  source_table: string | null;
  /** Source document and version */
  source_document: string;
  /** Severity for grading purposes */
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'ADVISORY' | 'NONE';
  /** Whether this is a prohibited substance finding */
  is_prohibited: boolean;
  /** Whether manual human review is recommended */
  requires_manual_review: boolean;
}
