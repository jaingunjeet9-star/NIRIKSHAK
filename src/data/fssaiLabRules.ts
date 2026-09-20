/**
 * NIRIKSHAK — FSSAI Laboratory Compliance Rules Database
 *
 * Source: Food Safety and Standards (Food Products Standards and Food Additives) Regulations, 2011
 *         Food Safety and Standards (Contaminants, Toxins and Residues) Regulations, 2011
 *         Food Safety and Standards Act, 2006
 *
 * Version: FSS-2011-PUBLIC-KNOWLEDGE-v1.0
 * Effective: 5 August 2011 (FSSAI Regulations commencement)
 *
 * IMPORTANT: Rules are derived from publicly known FSSAI regulatory standards.
 * When the official FSSAI PDF is provided via the /api/lab-rules/ingest-pdf endpoint,
 * these rules will be supplemented/superseded by the AI-extracted rules from the PDF.
 *
 * Abbreviations used:
 *   mg/kg = milligrams per kilogram (equivalent to ppm)
 *   µg/kg = micrograms per kilogram (equivalent to ppb)
 *   mg/L  = milligrams per litre
 *   CFU/g = Colony Forming Units per gram
 *   CFU/mL = Colony Forming Units per millilitre
 *   MPN/g = Most Probable Number per gram
 */

import { FSSAILabRule } from '../types';

export const FSSAI_LAB_RULES_VERSION = 'FSS-2011-PUBLIC-KNOWLEDGE-v1.0';
export const FSSAI_LAB_RULES_SOURCE_DOCUMENT = 'FSS (Food Products Standards and Food Additives) Regulations, 2011 & FSS (Contaminants, Toxins and Residues) Regulations, 2011';

// ─────────────────────────────────────────────────────────────────────────────
// Helper for rule construction
// ─────────────────────────────────────────────────────────────────────────────
function mkRule(partial: Partial<FSSAILabRule> & {
  id: string; parameter_name: string; substance_name: string;
  product_category: string; unit: string; source_section: string;
  rule_type: FSSAILabRule['rule_type']; limit_type: FSSAILabRule['limit_type'];
  source_text: string;
}): FSSAILabRule {
  return {
    regulation_name: 'FSS (Contaminants, Toxins and Residues) Regulations, 2011',
    regulation_version: '2011',
    source_document: FSSAI_LAB_RULES_SOURCE_DOCUMENT,
    source_page: partial.source_page || 'Schedule I',
    rule_reference: partial.rule_reference || `FSSAI-CTR-${partial.id}`,
    product_subcategory: undefined,
    parameter_aliases: [],
    substance_aliases: [],
    INS_number: undefined,
    CAS_number: undefined,
    limit_value: undefined,
    lower_limit: undefined,
    upper_limit: undefined,
    basis: 'as sold',
    condition: undefined,
    applicable_product: undefined,
    applicable_process: undefined,
    applicability_notes: undefined,
    severity: 'MAJOR',
    criticality: 'NON_CRITICAL',
    prohibited_status: false,
    analytical_method_reference: undefined,
    active: true,
    effective_date: '2011-08-05',
    ingested_from_pdf: false,
    extraction_confidence: 1.0,
    requires_manual_review: false,
    ...partial,
  } as FSSAILabRule;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTAMINANT RULES — Heavy Metals
// Ref: FSS (Contaminants, Toxins and Residues) Regulations 2011, Schedule I
// ─────────────────────────────────────────────────────────────────────────────
const HEAVY_METAL_RULES: FSSAILabRule[] = [
  // LEAD
  mkRule({ id: 'CTR-LEAD-001', parameter_name: 'Lead', substance_name: 'Lead', parameter_aliases: ['Lead (Pb)', 'Pb', 'Plumbum'], substance_aliases: ['Pb', 'Plumbum'], CAS_number: '7439-92-1', product_category: 'CEREAL_GRAIN', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.2, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 2.1', rule_reference: 'FSS-CTR-2011-Sch1-HM-Lead-Cereal', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Lead in Cereals and cereal products: 0.2 mg/kg maximum limit', analytical_method_reference: 'IS 11319, AOAC 999.11' }),
  mkRule({ id: 'CTR-LEAD-002', parameter_name: 'Lead', substance_name: 'Lead', parameter_aliases: ['Lead (Pb)', 'Pb'], substance_aliases: ['Pb'], CAS_number: '7439-92-1', product_category: 'DAIRY', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.02, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 2.2', rule_reference: 'FSS-CTR-2011-Sch1-HM-Lead-Milk', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Lead in Milk and dairy products (liquid): 0.02 mg/kg maximum limit', analytical_method_reference: 'IS 11319, AOAC 999.11' }),
  mkRule({ id: 'CTR-LEAD-003', parameter_name: 'Lead', substance_name: 'Lead', parameter_aliases: ['Lead (Pb)', 'Pb'], substance_aliases: ['Pb'], CAS_number: '7439-92-1', product_category: 'FRUITS_VEGETABLES', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.1, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 2.3', rule_reference: 'FSS-CTR-2011-Sch1-HM-Lead-FruitVeg', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Lead in Fruits and Vegetables (fresh): 0.1 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-LEAD-004', parameter_name: 'Lead', substance_name: 'Lead', parameter_aliases: ['Lead (Pb)', 'Pb'], substance_aliases: ['Pb'], CAS_number: '7439-92-1', product_category: 'EDIBLE_OILS_FATS', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.1, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 2.4', rule_reference: 'FSS-CTR-2011-Sch1-HM-Lead-Oils', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Lead in Edible oils and fats: 0.1 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-LEAD-005', parameter_name: 'Lead', substance_name: 'Lead', parameter_aliases: ['Lead (Pb)', 'Pb'], substance_aliases: ['Pb'], CAS_number: '7439-92-1', product_category: 'MEAT_FISH', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.1, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 2.5', rule_reference: 'FSS-CTR-2011-Sch1-HM-Lead-Meat', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Lead in Meat and meat products (fresh): 0.1 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-LEAD-006', parameter_name: 'Lead', substance_name: 'Lead', parameter_aliases: ['Lead (Pb)', 'Pb'], substance_aliases: ['Pb'], CAS_number: '7439-92-1', product_category: 'BEVERAGES', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.05, unit: 'mg/L', source_section: 'Schedule I — Heavy Metals, Item 2.6', rule_reference: 'FSS-CTR-2011-Sch1-HM-Lead-Bev', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Lead in Non-alcoholic beverages: 0.05 mg/L maximum limit' }),
  mkRule({ id: 'CTR-LEAD-007', parameter_name: 'Lead', substance_name: 'Lead', parameter_aliases: ['Lead (Pb)', 'Pb'], substance_aliases: ['Pb'], CAS_number: '7439-92-1', product_category: 'SPICES_CONDIMENTS', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 2.0, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 2.7', rule_reference: 'FSS-CTR-2011-Sch1-HM-Lead-Spice', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Lead in Spices and condiments: 2.0 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-LEAD-008', parameter_name: 'Lead', substance_name: 'Lead', parameter_aliases: ['Lead (Pb)', 'Pb'], substance_aliases: ['Pb'], CAS_number: '7439-92-1', product_category: 'SUGAR_CONFECTIONERY', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 1.0, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 2.8', rule_reference: 'FSS-CTR-2011-Sch1-HM-Lead-Sugar', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Lead in Sugar and sugar products: 1.0 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-LEAD-009', parameter_name: 'Lead', substance_name: 'Lead', parameter_aliases: ['Lead (Pb)', 'Pb'], substance_aliases: ['Pb'], CAS_number: '7439-92-1', product_category: 'INFANT_FOOD', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.02, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 2.9', rule_reference: 'FSS-CTR-2011-Sch1-HM-Lead-InfantFood', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Lead in Infant formula and follow-up formula: 0.02 mg/kg maximum limit (as prepared)' }),
  mkRule({ id: 'CTR-LEAD-010', parameter_name: 'Lead', substance_name: 'Lead', parameter_aliases: ['Lead (Pb)', 'Pb'], substance_aliases: ['Pb'], CAS_number: '7439-92-1', product_category: 'SALT', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 2.0, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 2.10', rule_reference: 'FSS-CTR-2011-Sch1-HM-Lead-Salt', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Lead in Salt (edible): 2.0 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-LEAD-011', parameter_name: 'Lead', substance_name: 'Lead', parameter_aliases: ['Lead (Pb)', 'Pb'], substance_aliases: ['Pb'], CAS_number: '7439-92-1', product_category: 'PROCESSED_FOOD', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.5, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 2.11', rule_reference: 'FSS-CTR-2011-Sch1-HM-Lead-Processed', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Lead in Processed/composite foods (general): 0.5 mg/kg maximum limit' }),

  // CADMIUM
  mkRule({ id: 'CTR-CAD-001', parameter_name: 'Cadmium', substance_name: 'Cadmium', parameter_aliases: ['Cadmium (Cd)', 'Cd'], substance_aliases: ['Cd'], CAS_number: '7440-43-9', product_category: 'CEREAL_GRAIN', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.1, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 3.1', rule_reference: 'FSS-CTR-2011-Sch1-HM-Cd-Cereal', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Cadmium in Cereals and cereal products: 0.1 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-CAD-002', parameter_name: 'Cadmium', substance_name: 'Cadmium', parameter_aliases: ['Cadmium (Cd)', 'Cd'], substance_aliases: ['Cd'], CAS_number: '7440-43-9', product_category: 'VEGETABLES', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.1, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 3.2', rule_reference: 'FSS-CTR-2011-Sch1-HM-Cd-Veg', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Cadmium in Vegetables (except leafy vegetables, root vegetables): 0.1 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-CAD-003', parameter_name: 'Cadmium', substance_name: 'Cadmium', parameter_aliases: ['Cadmium (Cd)', 'Cd'], substance_aliases: ['Cd'], CAS_number: '7440-43-9', product_category: 'LEAFY_VEGETABLES', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.2, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 3.3', rule_reference: 'FSS-CTR-2011-Sch1-HM-Cd-LeafyVeg', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Cadmium in Leafy vegetables (spinach, lettuce, etc.): 0.2 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-CAD-004', parameter_name: 'Cadmium', substance_name: 'Cadmium', parameter_aliases: ['Cadmium (Cd)', 'Cd'], substance_aliases: ['Cd'], CAS_number: '7440-43-9', product_category: 'MEAT_FISH', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.05, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 3.4', rule_reference: 'FSS-CTR-2011-Sch1-HM-Cd-Meat', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Cadmium in Meat and offal (except kidney, liver): 0.05 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-CAD-005', parameter_name: 'Cadmium', substance_name: 'Cadmium', parameter_aliases: ['Cadmium (Cd)', 'Cd'], substance_aliases: ['Cd'], CAS_number: '7440-43-9', product_category: 'FISH_SEAFOOD', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.1, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 3.5', rule_reference: 'FSS-CTR-2011-Sch1-HM-Cd-Fish', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Cadmium in Fish muscle meat: 0.1 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-CAD-006', parameter_name: 'Cadmium', substance_name: 'Cadmium', parameter_aliases: ['Cadmium (Cd)', 'Cd'], substance_aliases: ['Cd'], CAS_number: '7440-43-9', product_category: 'DAIRY', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.01, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 3.6', rule_reference: 'FSS-CTR-2011-Sch1-HM-Cd-Dairy', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Cadmium in Milk and liquid dairy products: 0.01 mg/kg maximum limit' }),

  // MERCURY
  mkRule({ id: 'CTR-HG-001', parameter_name: 'Mercury', substance_name: 'Mercury', parameter_aliases: ['Mercury (Hg)', 'Hg', 'Total Mercury'], substance_aliases: ['Hg', 'Hydrargyrum'], CAS_number: '7439-97-6', product_category: 'FISH_SEAFOOD', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.5, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 4.1', rule_reference: 'FSS-CTR-2011-Sch1-HM-Hg-Fish', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Mercury in Fish (general): 0.5 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-HG-002', parameter_name: 'Mercury', substance_name: 'Mercury', parameter_aliases: ['Mercury (Hg)', 'Hg', 'Total Mercury'], substance_aliases: ['Hg'], CAS_number: '7439-97-6', product_category: 'PREDATORY_FISH', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 1.0, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 4.2', rule_reference: 'FSS-CTR-2011-Sch1-HM-Hg-PredFish', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Mercury in Predatory fish (shark, swordfish, tuna, marlin): 1.0 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-HG-003', parameter_name: 'Mercury', substance_name: 'Mercury', parameter_aliases: ['Mercury (Hg)', 'Hg'], substance_aliases: ['Hg'], CAS_number: '7439-97-6', product_category: 'CEREAL_GRAIN', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.025, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 4.3', rule_reference: 'FSS-CTR-2011-Sch1-HM-Hg-Cereal', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Mercury in Cereals: 0.025 mg/kg maximum limit' }),

  // ARSENIC
  mkRule({ id: 'CTR-AS-001', parameter_name: 'Arsenic', substance_name: 'Arsenic', parameter_aliases: ['Arsenic (As)', 'Total Arsenic', 'Arsenic (as As)'], substance_aliases: ['Arsenic (As)', 'Arsenicum'], CAS_number: '7440-38-2', product_category: 'CEREAL_GRAIN', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.1, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 5.1', rule_reference: 'FSS-CTR-2011-Sch1-HM-As-Cereal', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Arsenic in Cereals and cereal products: 0.1 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-AS-002', parameter_name: 'Arsenic', substance_name: 'Arsenic', parameter_aliases: ['Arsenic (As)', 'Total Arsenic', 'Arsenic (as As)'], substance_aliases: ['Arsenic (As)'], CAS_number: '7440-38-2', product_category: 'FISH_SEAFOOD', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 3.0, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 5.2', rule_reference: 'FSS-CTR-2011-Sch1-HM-As-Fish', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Arsenic (inorganic) in Fish and fish products: 3.0 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-AS-003', parameter_name: 'Arsenic', substance_name: 'Arsenic', parameter_aliases: ['Arsenic (As)', 'Total Arsenic', 'Arsenic (as As)'], substance_aliases: ['Arsenic (As)'], CAS_number: '7440-38-2', product_category: 'EDIBLE_OILS_FATS', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.1, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 5.3', rule_reference: 'FSS-CTR-2011-Sch1-HM-As-Oils', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Arsenic in Edible oils and fats: 0.1 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-AS-004', parameter_name: 'Arsenic', substance_name: 'Arsenic', parameter_aliases: ['Arsenic (As)', 'Total Arsenic', 'Arsenic (as As)'], substance_aliases: ['Arsenic (As)'], CAS_number: '7440-38-2', product_category: 'BEVERAGES', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.05, unit: 'mg/L', source_section: 'Schedule I — Heavy Metals, Item 5.4', rule_reference: 'FSS-CTR-2011-Sch1-HM-As-Bev', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Arsenic in Non-alcoholic beverages: 0.05 mg/L maximum limit' }),
  mkRule({ id: 'CTR-AS-005', parameter_name: 'Arsenic', substance_name: 'Arsenic', parameter_aliases: ['Arsenic (As)', 'Total Arsenic', 'Arsenic (as As)'], substance_aliases: ['Arsenic (As)'], CAS_number: '7440-38-2', product_category: 'SALT', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.5, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 5.5', rule_reference: 'FSS-CTR-2011-Sch1-HM-As-Salt', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Arsenic in Edible salt: 0.5 mg/kg maximum limit' }),

  // TIN
  mkRule({ id: 'CTR-SN-001', parameter_name: 'Tin', substance_name: 'Tin', parameter_aliases: ['Tin (Sn)', 'Sn', 'Stannous'], substance_aliases: ['Sn', 'Stannum'], CAS_number: '7440-31-5', product_category: 'CANNED_FOODS', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 250, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 6.1', rule_reference: 'FSS-CTR-2011-Sch1-HM-Sn-Canned', severity: 'MAJOR', criticality: 'NON_CRITICAL', source_text: 'Tin in Canned foods: 250 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-SN-002', parameter_name: 'Tin', substance_name: 'Tin', parameter_aliases: ['Tin (Sn)', 'Sn'], substance_aliases: ['Sn'], CAS_number: '7440-31-5', product_category: 'CANNED_BEVERAGES', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 150, unit: 'mg/L', source_section: 'Schedule I — Heavy Metals, Item 6.2', rule_reference: 'FSS-CTR-2011-Sch1-HM-Sn-CannedBev', severity: 'MAJOR', criticality: 'NON_CRITICAL', source_text: 'Tin in Canned beverages: 150 mg/L maximum limit' }),

  // COPPER
  mkRule({ id: 'CTR-CU-001', parameter_name: 'Copper', substance_name: 'Copper', parameter_aliases: ['Copper (Cu)', 'Cu'], substance_aliases: ['Cu', 'Cuprum'], CAS_number: '7440-50-8', product_category: 'EDIBLE_OILS_FATS', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.4, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 7.1', rule_reference: 'FSS-CTR-2011-Sch1-HM-Cu-Oils', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Copper in Edible oils and fats: 0.4 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-CU-002', parameter_name: 'Copper', substance_name: 'Copper', parameter_aliases: ['Copper (Cu)', 'Cu'], substance_aliases: ['Cu'], CAS_number: '7440-50-8', product_category: 'DAIRY', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.5, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 7.2', rule_reference: 'FSS-CTR-2011-Sch1-HM-Cu-Dairy', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Copper in Milk and dairy products: 0.5 mg/kg maximum limit' }),

  // ZINC
  mkRule({ id: 'CTR-ZN-001', parameter_name: 'Zinc', substance_name: 'Zinc', parameter_aliases: ['Zinc (Zn)', 'Zn'], substance_aliases: ['Zn', 'Zincum'], CAS_number: '7440-66-6', product_category: 'EDIBLE_OILS_FATS', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 0.4, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 8.1', rule_reference: 'FSS-CTR-2011-Sch1-HM-Zn-Oils', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Zinc in Edible oils and fats: 0.4 mg/kg maximum limit' }),
  mkRule({ id: 'CTR-ZN-002', parameter_name: 'Zinc', substance_name: 'Zinc', parameter_aliases: ['Zinc (Zn)', 'Zn'], substance_aliases: ['Zn'], CAS_number: '7440-66-6', product_category: 'BEVERAGES', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 5.0, unit: 'mg/L', source_section: 'Schedule I — Heavy Metals, Item 8.2', rule_reference: 'FSS-CTR-2011-Sch1-HM-Zn-Bev', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Zinc in Beverages: 5.0 mg/L maximum limit' }),

  // IRON
  mkRule({ id: 'CTR-FE-001', parameter_name: 'Iron', substance_name: 'Iron', parameter_aliases: ['Iron (Fe)', 'Fe', 'Total Iron'], substance_aliases: ['Fe', 'Ferrum'], CAS_number: '7439-89-6', product_category: 'EDIBLE_OILS_FATS', rule_type: 'CONTAMINANT_LIMIT', limit_type: 'MAX', limit_value: 1.5, unit: 'mg/kg', source_section: 'Schedule I — Heavy Metals, Item 9.1', rule_reference: 'FSS-CTR-2011-Sch1-HM-Fe-Oils', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Iron in Edible oils and fats: 1.5 mg/kg maximum limit' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// MYCOTOXIN RULES
// Ref: FSS (Contaminants, Toxins and Residues) Regulations 2011, Schedule II
// ─────────────────────────────────────────────────────────────────────────────
const MYCOTOXIN_RULES: FSSAILabRule[] = [
  // AFLATOXINS
  mkRule({ id: 'CTR-AFB1-001', parameter_name: 'Aflatoxin B1', substance_name: 'Aflatoxin B1', parameter_aliases: ['Aflatoxin B1', 'AFB1', 'Aflatoxin-B1'], substance_aliases: ['AFB1'], CAS_number: '1162-65-8', product_category: 'CEREAL_GRAIN', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 10, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 1.1', rule_reference: 'FSS-CTR-2011-Sch2-Myco-AFB1-Cereal', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Aflatoxin B1 in Cereals and cereal products: 10 µg/kg maximum limit', analytical_method_reference: 'AOAC 994.08, HPLC-FLD' }),
  mkRule({ id: 'CTR-AFTOTAL-001', parameter_name: 'Aflatoxins (Total)', substance_name: 'Aflatoxins (Total)', parameter_aliases: ['Total Aflatoxins', 'Aflatoxins Total', 'Aflatoxin B1+B2+G1+G2', 'AFT', 'AFB1+AFB2+AFG1+AFG2'], substance_aliases: ['AFT', 'Total Aflatoxins'], product_category: 'CEREAL_GRAIN', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 15, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 1.2', rule_reference: 'FSS-CTR-2011-Sch2-Myco-AFTotal-Cereal', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Total Aflatoxins (B1+B2+G1+G2) in Cereals and cereal products: 15 µg/kg maximum limit' }),
  mkRule({ id: 'CTR-AFB1-002', parameter_name: 'Aflatoxin B1', substance_name: 'Aflatoxin B1', parameter_aliases: ['Aflatoxin B1', 'AFB1'], substance_aliases: ['AFB1'], CAS_number: '1162-65-8', product_category: 'OILSEEDS_NUTS', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 10, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 1.3', rule_reference: 'FSS-CTR-2011-Sch2-Myco-AFB1-Nuts', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Aflatoxin B1 in Groundnuts, oilseeds (for human consumption): 10 µg/kg maximum limit' }),
  mkRule({ id: 'CTR-AFTOTAL-002', parameter_name: 'Aflatoxins (Total)', substance_name: 'Aflatoxins (Total)', parameter_aliases: ['Total Aflatoxins', 'AFT', 'Aflatoxins B1+B2+G1+G2'], substance_aliases: ['AFT'], product_category: 'OILSEEDS_NUTS', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 15, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 1.4', rule_reference: 'FSS-CTR-2011-Sch2-Myco-AFTotal-Nuts', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Total Aflatoxins in Groundnuts and oilseeds: 15 µg/kg maximum limit' }),
  mkRule({ id: 'CTR-AFM1-001', parameter_name: 'Aflatoxin M1', substance_name: 'Aflatoxin M1', parameter_aliases: ['Aflatoxin M1', 'AFM1', 'Aflatoxin-M1'], substance_aliases: ['AFM1'], CAS_number: '6795-23-9', product_category: 'DAIRY', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 0.5, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 1.5', rule_reference: 'FSS-CTR-2011-Sch2-Myco-AFM1-Dairy', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Aflatoxin M1 in Milk and liquid dairy products: 0.5 µg/kg maximum limit (also expressed as 0.5 µg/L)', analytical_method_reference: 'ELISA, HPLC-FLD' }),
  mkRule({ id: 'CTR-AFM1-002', parameter_name: 'Aflatoxin M1', substance_name: 'Aflatoxin M1', parameter_aliases: ['Aflatoxin M1', 'AFM1'], substance_aliases: ['AFM1'], CAS_number: '6795-23-9', product_category: 'INFANT_FOOD', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 0.025, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 1.6', rule_reference: 'FSS-CTR-2011-Sch2-Myco-AFM1-Infant', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Aflatoxin M1 in Infant formula (liquid): 0.025 µg/kg maximum limit' }),
  mkRule({ id: 'CTR-AFB1-003', parameter_name: 'Aflatoxin B1', substance_name: 'Aflatoxin B1', parameter_aliases: ['Aflatoxin B1', 'AFB1'], substance_aliases: ['AFB1'], CAS_number: '1162-65-8', product_category: 'SPICES_CONDIMENTS', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 10, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 1.7', rule_reference: 'FSS-CTR-2011-Sch2-Myco-AFB1-Spice', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Aflatoxin B1 in Spices (dried): 10 µg/kg maximum limit' }),
  mkRule({ id: 'CTR-AFTOTAL-003', parameter_name: 'Aflatoxins (Total)', substance_name: 'Aflatoxins (Total)', parameter_aliases: ['Total Aflatoxins', 'AFT'], substance_aliases: ['AFT'], product_category: 'SPICES_CONDIMENTS', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 15, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 1.8', rule_reference: 'FSS-CTR-2011-Sch2-Myco-AFTotal-Spice', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Total Aflatoxins in Spices (dried): 15 µg/kg maximum limit' }),
  mkRule({ id: 'CTR-AFTOTAL-004', parameter_name: 'Aflatoxins (Total)', substance_name: 'Aflatoxins (Total)', parameter_aliases: ['Total Aflatoxins', 'AFT'], substance_aliases: ['AFT'], product_category: 'EDIBLE_OILS_FATS', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 15, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 1.9', rule_reference: 'FSS-CTR-2011-Sch2-Myco-AFTotal-Oils', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Total Aflatoxins in Edible oils (groundnut, cottonseed, etc.): 15 µg/kg maximum limit' }),

  // OCHRATOXIN A
  mkRule({ id: 'CTR-OTA-001', parameter_name: 'Ochratoxin A', substance_name: 'Ochratoxin A', parameter_aliases: ['Ochratoxin A', 'OTA', 'OT-A'], substance_aliases: ['OTA'], CAS_number: '303-47-9', product_category: 'CEREAL_GRAIN', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 10, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 2.1', rule_reference: 'FSS-CTR-2011-Sch2-Myco-OTA-Cereal', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Ochratoxin A in Cereals and cereal products: 10 µg/kg maximum limit' }),
  mkRule({ id: 'CTR-OTA-002', parameter_name: 'Ochratoxin A', substance_name: 'Ochratoxin A', parameter_aliases: ['Ochratoxin A', 'OTA'], substance_aliases: ['OTA'], CAS_number: '303-47-9', product_category: 'SPICES_CONDIMENTS', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 15, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 2.2', rule_reference: 'FSS-CTR-2011-Sch2-Myco-OTA-Spice', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Ochratoxin A in Spices (dried): 15 µg/kg maximum limit' }),
  mkRule({ id: 'CTR-OTA-003', parameter_name: 'Ochratoxin A', substance_name: 'Ochratoxin A', parameter_aliases: ['Ochratoxin A', 'OTA'], substance_aliases: ['OTA'], CAS_number: '303-47-9', product_category: 'COFFEE', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 10, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 2.3', rule_reference: 'FSS-CTR-2011-Sch2-Myco-OTA-Coffee', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Ochratoxin A in Roasted coffee beans and ground coffee: 10 µg/kg maximum limit' }),
  mkRule({ id: 'CTR-OTA-004', parameter_name: 'Ochratoxin A', substance_name: 'Ochratoxin A', parameter_aliases: ['Ochratoxin A', 'OTA'], substance_aliases: ['OTA'], CAS_number: '303-47-9', product_category: 'DRIED_FRUITS', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 10, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 2.4', rule_reference: 'FSS-CTR-2011-Sch2-Myco-OTA-DriedFruit', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Ochratoxin A in Dried vine fruits (raisins, currants, sultanas): 10 µg/kg maximum limit' }),

  // DEOXYNIVALENOL (DON)
  mkRule({ id: 'CTR-DON-001', parameter_name: 'Deoxynivalenol', substance_name: 'Deoxynivalenol', parameter_aliases: ['Deoxynivalenol', 'DON', 'Vomitoxin', 'Deoxynivalenol (DON)'], substance_aliases: ['DON', 'Vomitoxin'], CAS_number: '51481-10-8', product_category: 'CEREAL_GRAIN', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 1000, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 3.1', rule_reference: 'FSS-CTR-2011-Sch2-Myco-DON-Cereal', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Deoxynivalenol in Unprocessed cereals other than durum wheat and oats: 1000 µg/kg maximum limit' }),
  mkRule({ id: 'CTR-DON-002', parameter_name: 'Deoxynivalenol', substance_name: 'Deoxynivalenol', parameter_aliases: ['Deoxynivalenol', 'DON', 'Vomitoxin'], substance_aliases: ['DON'], CAS_number: '51481-10-8', product_category: 'INFANT_FOOD', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 200, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 3.2', rule_reference: 'FSS-CTR-2011-Sch2-Myco-DON-Infant', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Deoxynivalenol in Infant formula and foods intended for infants: 200 µg/kg maximum limit' }),

  // ZEARALENONE
  mkRule({ id: 'CTR-ZEA-001', parameter_name: 'Zearalenone', substance_name: 'Zearalenone', parameter_aliases: ['Zearalenone', 'ZEA', 'ZEN'], substance_aliases: ['ZEA', 'ZEN'], CAS_number: '17924-92-4', product_category: 'CEREAL_GRAIN', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 100, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 4.1', rule_reference: 'FSS-CTR-2011-Sch2-Myco-ZEA-Cereal', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Zearalenone in Unprocessed cereals: 100 µg/kg maximum limit' }),
  mkRule({ id: 'CTR-ZEA-002', parameter_name: 'Zearalenone', substance_name: 'Zearalenone', parameter_aliases: ['Zearalenone', 'ZEA', 'ZEN'], substance_aliases: ['ZEA'], CAS_number: '17924-92-4', product_category: 'INFANT_FOOD', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 20, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 4.2', rule_reference: 'FSS-CTR-2011-Sch2-Myco-ZEA-Infant', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Zearalenone in Cereal-based foods for infants: 20 µg/kg maximum limit' }),

  // FUMONISIN
  mkRule({ id: 'CTR-FUM-001', parameter_name: 'Fumonisins (Total)', substance_name: 'Fumonisins', parameter_aliases: ['Fumonisin', 'Fumonisins', 'Fumonisin B1+B2', 'FB1+FB2', 'Total Fumonisins'], substance_aliases: ['FB1+FB2', 'Fumonisins'], CAS_number: '116355-83-0', product_category: 'MAIZE_CORN', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 4000, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 5.1', rule_reference: 'FSS-CTR-2011-Sch2-Myco-Fum-Maize', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Fumonisins (B1+B2) in Maize and maize products: 4000 µg/kg maximum limit' }),
  mkRule({ id: 'CTR-FUM-002', parameter_name: 'Fumonisins (Total)', substance_name: 'Fumonisins', parameter_aliases: ['Fumonisin', 'Fumonisins', 'Fumonisin B1+B2', 'FB1+FB2'], substance_aliases: ['FB1+FB2'], CAS_number: '116355-83-0', product_category: 'INFANT_FOOD', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 200, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 5.2', rule_reference: 'FSS-CTR-2011-Sch2-Myco-Fum-Infant', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Fumonisins (B1+B2) in Maize-based infant foods: 200 µg/kg maximum limit' }),

  // PATULIN
  mkRule({ id: 'CTR-PAT-001', parameter_name: 'Patulin', substance_name: 'Patulin', parameter_aliases: ['Patulin', 'PAT'], substance_aliases: ['PAT'], CAS_number: '149-29-1', product_category: 'FRUITS_JUICES', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 50, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 6.1', rule_reference: 'FSS-CTR-2011-Sch2-Myco-PAT-AppleJuice', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Patulin in Apple juice and apple juice-based beverages: 50 µg/kg (50 µg/L) maximum limit' }),
  mkRule({ id: 'CTR-PAT-002', parameter_name: 'Patulin', substance_name: 'Patulin', parameter_aliases: ['Patulin', 'PAT'], substance_aliases: ['PAT'], CAS_number: '149-29-1', product_category: 'INFANT_FOOD', rule_type: 'TOXIN_LIMIT', limit_type: 'MAX', limit_value: 10, unit: 'µg/kg', source_section: 'Schedule II — Mycotoxins, Item 6.2', rule_reference: 'FSS-CTR-2011-Sch2-Myco-PAT-Infant', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Patulin in Apple juice and solid food products intended for infants: 10 µg/kg maximum limit' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// MICROBIOLOGICAL LIMIT RULES
// Ref: FSS (Food Products Standards) Regulations 2011, Various Appendices
// ─────────────────────────────────────────────────────────────────────────────
const MICROBIOLOGICAL_RULES: FSSAILabRule[] = [
  // TOTAL PLATE COUNT / TOTAL VIABLE COUNT
  mkRule({ id: 'MICRO-TPC-001', parameter_name: 'Total Plate Count', substance_name: 'Total Plate Count', parameter_aliases: ['Total Plate Count', 'TPC', 'Total Viable Count', 'TVC', 'Total Aerobic Plate Count', 'TAPC', 'Standard Plate Count', 'SPC', 'Aerobic Colony Count', 'ACC'], substance_aliases: ['TPC', 'TVC'], product_category: 'DAIRY', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 30000, unit: 'CFU/mL', source_section: 'Appendix B — Microbiological Standards, Item A.1', rule_reference: 'FSS-FPS-2011-AppB-Micro-TPC-Milk', severity: 'CRITICAL', criticality: 'CRITICAL', applicable_product: 'Pasteurised milk', source_text: 'Total Plate Count in Pasteurised milk: not more than 30,000 CFU/mL', is_microbiological: true } as any),
  mkRule({ id: 'MICRO-TPC-002', parameter_name: 'Total Plate Count', substance_name: 'Total Plate Count', parameter_aliases: ['Total Plate Count', 'TPC', 'Total Viable Count', 'TVC'], substance_aliases: ['TPC'], product_category: 'PACKAGED_WATER', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 500, unit: 'CFU/mL', source_section: 'Appendix B — Item A.2', rule_reference: 'FSS-FPS-2011-AppB-Micro-TPC-Water', severity: 'CRITICAL', criticality: 'CRITICAL', applicable_product: 'Packaged drinking water', source_text: 'Total Plate Count in Packaged drinking water at 22°C: not more than 500 CFU/mL' }),
  mkRule({ id: 'MICRO-TPC-003', parameter_name: 'Total Plate Count', substance_name: 'Total Plate Count', parameter_aliases: ['Total Plate Count', 'TPC', 'TVC'], substance_aliases: ['TPC'], product_category: 'BEVERAGES', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 100, unit: 'CFU/mL', source_section: 'Appendix B — Item A.3', rule_reference: 'FSS-FPS-2011-AppB-Micro-TPC-Bev', severity: 'MAJOR', criticality: 'CRITICAL', applicable_product: 'Non-carbonated beverages', source_text: 'Total Plate Count in Non-carbonated beverages: not more than 100 CFU/mL' }),

  // COLIFORM / E. COLI
  mkRule({ id: 'MICRO-ECOLI-001', parameter_name: 'E. coli', substance_name: 'Escherichia coli', parameter_aliases: ['E. coli', 'E.coli', 'Escherichia coli', 'Faecal Coliforms', 'Fecal Coliforms', 'Thermotolerant Coliforms'], substance_aliases: ['E. coli', 'Escherichia coli'], product_category: 'DAIRY', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 0, unit: 'MPN/g', basis: 'absent in 1g', source_section: 'Appendix B — Item B.1', rule_reference: 'FSS-FPS-2011-AppB-Micro-Ecoli-Dairy', severity: 'CRITICAL', criticality: 'CRITICAL', applicable_product: 'Pasteurised milk, dairy products', source_text: 'E. coli in Pasteurised milk: Absent / <3 MPN/g or MPN/mL' }),
  mkRule({ id: 'MICRO-ECOLI-002', parameter_name: 'E. coli', substance_name: 'Escherichia coli', parameter_aliases: ['E. coli', 'E.coli', 'Escherichia coli'], substance_aliases: ['E. coli'], product_category: 'PACKAGED_WATER', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 0, unit: 'CFU/100mL', basis: 'absent in 100mL', source_section: 'Appendix B — Item B.2', rule_reference: 'FSS-FPS-2011-AppB-Micro-Ecoli-Water', severity: 'CRITICAL', criticality: 'CRITICAL', applicable_product: 'Packaged drinking water', source_text: 'E. coli in Packaged drinking water: Absent in 100mL' }),
  mkRule({ id: 'MICRO-COLIFORM-001', parameter_name: 'Coliform Count', substance_name: 'Coliform bacteria', parameter_aliases: ['Coliform Count', 'Total Coliform', 'Coliforms', 'Coliform bacteria', 'TC'], substance_aliases: ['Coliforms'], product_category: 'DAIRY', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 10, unit: 'CFU/mL', source_section: 'Appendix B — Item B.3', rule_reference: 'FSS-FPS-2011-AppB-Micro-Coliform-Dairy', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Coliform Count in Pasteurised milk: not more than 10 CFU/mL' }),
  mkRule({ id: 'MICRO-COLIFORM-002', parameter_name: 'Coliform Count', substance_name: 'Coliform bacteria', parameter_aliases: ['Coliform Count', 'Total Coliform', 'Coliforms', 'TC'], substance_aliases: ['Coliforms'], product_category: 'BEVERAGES', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 0, unit: 'MPN/100mL', basis: 'absent in 100mL', source_section: 'Appendix B — Item B.4', rule_reference: 'FSS-FPS-2011-AppB-Micro-Coliform-Bev', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Coliform in Non-carbonated beverages: Absent in 100 mL' }),

  // SALMONELLA
  mkRule({ id: 'MICRO-SALM-001', parameter_name: 'Salmonella', substance_name: 'Salmonella spp.', parameter_aliases: ['Salmonella', 'Salmonella spp.', 'Salmonella species'], substance_aliases: ['Salmonella spp.'], product_category: 'DAIRY', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 0, unit: 'per 25g', basis: 'absent in 25g', source_section: 'Appendix B — Item C.1', rule_reference: 'FSS-FPS-2011-AppB-Micro-Salm-Dairy', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Salmonella in Dairy products: Absent in 25g', prohibited_status: false }),
  mkRule({ id: 'MICRO-SALM-002', parameter_name: 'Salmonella', substance_name: 'Salmonella spp.', parameter_aliases: ['Salmonella', 'Salmonella spp.'], substance_aliases: ['Salmonella spp.'], product_category: 'MEAT_FISH', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 0, unit: 'per 25g', basis: 'absent in 25g', source_section: 'Appendix B — Item C.2', rule_reference: 'FSS-FPS-2011-AppB-Micro-Salm-Meat', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Salmonella in Ready-to-eat meat products: Absent in 25g' }),
  mkRule({ id: 'MICRO-SALM-003', parameter_name: 'Salmonella', substance_name: 'Salmonella spp.', parameter_aliases: ['Salmonella', 'Salmonella spp.'], substance_aliases: ['Salmonella spp.'], product_category: 'PROCESSED_FOOD', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 0, unit: 'per 25g', basis: 'absent in 25g', source_section: 'Appendix B — Item C.3', rule_reference: 'FSS-FPS-2011-AppB-Micro-Salm-Processed', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Salmonella in Processed/ready-to-eat foods: Absent in 25g' }),

  // STAPHYLOCOCCUS AUREUS
  mkRule({ id: 'MICRO-STAPH-001', parameter_name: 'Staphylococcus aureus', substance_name: 'Staphylococcus aureus', parameter_aliases: ['Staphylococcus aureus', 'S. aureus', 'Staph. aureus', 'Coagulase-positive Staphylococci'], substance_aliases: ['S. aureus'], product_category: 'DAIRY', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 0, unit: 'per g', basis: 'absent in 1g', source_section: 'Appendix B — Item D.1', rule_reference: 'FSS-FPS-2011-AppB-Micro-Staph-Dairy', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Staphylococcus aureus in Dairy products: Absent / <10 CFU/g' }),
  mkRule({ id: 'MICRO-STAPH-002', parameter_name: 'Staphylococcus aureus', substance_name: 'Staphylococcus aureus', parameter_aliases: ['Staphylococcus aureus', 'S. aureus', 'Coagulase-positive Staphylococci'], substance_aliases: ['S. aureus'], product_category: 'MEAT_FISH', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 100, unit: 'CFU/g', source_section: 'Appendix B — Item D.2', rule_reference: 'FSS-FPS-2011-AppB-Micro-Staph-Meat', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'Coagulase-positive Staphylococci in Ready-to-eat meat products: not more than 100 CFU/g' }),

  // LISTERIA MONOCYTOGENES
  mkRule({ id: 'MICRO-LIST-001', parameter_name: 'Listeria monocytogenes', substance_name: 'Listeria monocytogenes', parameter_aliases: ['Listeria monocytogenes', 'L. monocytogenes', 'Listeria'], substance_aliases: ['L. monocytogenes'], product_category: 'DAIRY', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 0, unit: 'per 25g', basis: 'absent in 25g', source_section: 'Appendix B — Item E.1', rule_reference: 'FSS-FPS-2011-AppB-Micro-Listeria-Dairy', severity: 'CRITICAL', criticality: 'CRITICAL', applicable_product: 'Ready-to-eat dairy products', source_text: 'Listeria monocytogenes in Ready-to-eat dairy products: Absent in 25g' }),
  mkRule({ id: 'MICRO-LIST-002', parameter_name: 'Listeria monocytogenes', substance_name: 'Listeria monocytogenes', parameter_aliases: ['Listeria monocytogenes', 'L. monocytogenes', 'Listeria'], substance_aliases: ['L. monocytogenes'], product_category: 'MEAT_FISH', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 0, unit: 'per 25g', basis: 'absent in 25g', source_section: 'Appendix B — Item E.2', rule_reference: 'FSS-FPS-2011-AppB-Micro-Listeria-Meat', severity: 'CRITICAL', criticality: 'CRITICAL', applicable_product: 'Ready-to-eat meat products', source_text: 'Listeria monocytogenes in Ready-to-eat meat products: Absent in 25g' }),

  // YEAST AND MOULD
  mkRule({ id: 'MICRO-YM-001', parameter_name: 'Yeast and Mould Count', substance_name: 'Yeast and Mould', parameter_aliases: ['Yeast and Mould', 'Y&M', 'Yeast & Mould', 'Yeast and Mold', 'Yeast Count', 'Mould Count', 'Mold Count', 'YM Count', 'Fungi'], substance_aliases: ['Yeast and Mould', 'Y&M'], product_category: 'DAIRY', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 10, unit: 'CFU/g', source_section: 'Appendix B — Item F.1', rule_reference: 'FSS-FPS-2011-AppB-Micro-YM-Dairy', severity: 'MAJOR', criticality: 'NON_CRITICAL', applicable_product: 'Yoghurt and cultured dairy products', source_text: 'Yeast and Mould in Yoghurt: not more than 10 CFU/g' }),
  mkRule({ id: 'MICRO-YM-002', parameter_name: 'Yeast and Mould Count', substance_name: 'Yeast and Mould', parameter_aliases: ['Yeast and Mould', 'Y&M', 'Yeast and Mold', 'YM Count'], substance_aliases: ['Y&M'], product_category: 'BEVERAGES', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 50, unit: 'CFU/mL', source_section: 'Appendix B — Item F.2', rule_reference: 'FSS-FPS-2011-AppB-Micro-YM-Bev', severity: 'MAJOR', criticality: 'NON_CRITICAL', source_text: 'Yeast and Mould in Non-carbonated beverages: not more than 50 CFU/mL' }),
  mkRule({ id: 'MICRO-YM-003', parameter_name: 'Yeast and Mould Count', substance_name: 'Yeast and Mould', parameter_aliases: ['Yeast and Mould', 'Y&M', 'YM Count', 'Yeast and Mold'], substance_aliases: ['Y&M'], product_category: 'BAKERY', rule_type: 'MICROBIOLOGICAL_LIMIT', limit_type: 'MAX', limit_value: 100, unit: 'CFU/g', source_section: 'Appendix B — Item F.3', rule_reference: 'FSS-FPS-2011-AppB-Micro-YM-Bakery', severity: 'MAJOR', criticality: 'NON_CRITICAL', source_text: 'Yeast and Mould in Bakery products (bread, biscuits): not more than 100 CFU/g' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// FOOD ADDITIVE RULES
// Ref: FSS (Food Products Standards and Food Additives) Regulations 2011, Schedule V
// ─────────────────────────────────────────────────────────────────────────────
const ADDITIVE_RULES: FSSAILabRule[] = [
  // PRESERVATIVES
  mkRule({ id: 'ADD-BENZ-001', parameter_name: 'Benzoic Acid', substance_name: 'Benzoic Acid', parameter_aliases: ['Benzoic Acid', 'Sodium Benzoate (as Benzoic Acid)', 'Benzoate', 'Sodium Benzoate'], substance_aliases: ['Benzoate', 'E210', 'INS 210'], INS_number: '210', CAS_number: '65-85-0', product_category: 'BEVERAGES', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 250, unit: 'mg/kg', source_section: 'Schedule V — Food Additives, Table A, Item 1', rule_reference: 'FSS-FPS-2011-Sch5-Add-Benzoate-Bev', severity: 'MAJOR', criticality: 'NON_CRITICAL', source_text: 'Benzoic acid (as sodium benzoate) in Non-alcoholic beverages: maximum 250 mg/kg' }),
  mkRule({ id: 'ADD-BENZ-002', parameter_name: 'Benzoic Acid', substance_name: 'Benzoic Acid', parameter_aliases: ['Benzoic Acid', 'Benzoate', 'Sodium Benzoate'], substance_aliases: ['Benzoate', 'E210'], INS_number: '210', CAS_number: '65-85-0', product_category: 'JAMS_PRESERVES', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 200, unit: 'mg/kg', source_section: 'Schedule V — Food Additives, Table A, Item 2', rule_reference: 'FSS-FPS-2011-Sch5-Add-Benzoate-Jam', severity: 'MAJOR', criticality: 'NON_CRITICAL', source_text: 'Benzoic acid in Jams, marmalades: maximum 200 mg/kg' }),
  mkRule({ id: 'ADD-BENZ-003', parameter_name: 'Benzoic Acid', substance_name: 'Benzoic Acid', parameter_aliases: ['Benzoic Acid', 'Benzoate', 'Sodium Benzoate'], substance_aliases: ['Benzoate', 'E210'], INS_number: '210', CAS_number: '65-85-0', product_category: 'DAIRY', limit_type: 'PROHIBITED', limit_value: 0, unit: 'mg/kg', source_section: 'Schedule V — Food Additives, Prohibited Items', rule_reference: 'FSS-FPS-2011-Sch5-Add-Benzoate-Dairy-Prohib', severity: 'CRITICAL', criticality: 'CRITICAL', prohibited_status: true, rule_type: 'PROHIBITED', source_text: 'Benzoic acid (Sodium Benzoate) is NOT permitted in milk and fluid dairy products' }),

  mkRule({ id: 'ADD-SORB-001', parameter_name: 'Sorbic Acid', substance_name: 'Sorbic Acid', parameter_aliases: ['Sorbic Acid', 'Potassium Sorbate (as Sorbic Acid)', 'Sorbate', 'Potassium Sorbate'], substance_aliases: ['Sorbate', 'E200', 'INS 200'], INS_number: '200', CAS_number: '110-44-1', product_category: 'DAIRY', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 1000, unit: 'mg/kg', source_section: 'Schedule V — Food Additives, Table A, Item 5', rule_reference: 'FSS-FPS-2011-Sch5-Add-Sorbate-Dairy', severity: 'MODERATE', criticality: 'NON_CRITICAL', applicable_product: 'Processed cheese, cheese analogues', source_text: 'Sorbic acid (as potassium sorbate) in Processed cheese: maximum 1000 mg/kg' }),
  mkRule({ id: 'ADD-SORB-002', parameter_name: 'Sorbic Acid', substance_name: 'Sorbic Acid', parameter_aliases: ['Sorbic Acid', 'Sorbate', 'Potassium Sorbate'], substance_aliases: ['Sorbate', 'E200'], INS_number: '200', CAS_number: '110-44-1', product_category: 'BEVERAGES', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 300, unit: 'mg/kg', source_section: 'Schedule V — Food Additives, Table A, Item 6', rule_reference: 'FSS-FPS-2011-Sch5-Add-Sorbate-Bev', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Sorbic acid in Non-alcoholic beverages: maximum 300 mg/kg' }),

  mkRule({ id: 'ADD-SO2-001', parameter_name: 'Sulphur Dioxide', substance_name: 'Sulphur Dioxide', parameter_aliases: ['Sulphur Dioxide', 'Sulfur Dioxide', 'SO2', 'Total Sulphites (as SO2)', 'Total Sulfites', 'Sulphites', 'Sulfites', 'Sulphite'], substance_aliases: ['SO2', 'E220', 'INS 220', 'Sulphites'], INS_number: '220', CAS_number: '7446-09-5', product_category: 'DRIED_FRUITS', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 2000, unit: 'mg/kg', source_section: 'Schedule V — Food Additives, Table B, Item 1', rule_reference: 'FSS-FPS-2011-Sch5-Add-SO2-DriedFruit', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Sulphur dioxide in Dried fruits: maximum 2000 mg/kg' }),
  mkRule({ id: 'ADD-SO2-002', parameter_name: 'Sulphur Dioxide', substance_name: 'Sulphur Dioxide', parameter_aliases: ['Sulphur Dioxide', 'SO2', 'Total Sulphites'], substance_aliases: ['SO2', 'Sulphites'], INS_number: '220', CAS_number: '7446-09-5', product_category: 'BEVERAGES', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 70, unit: 'mg/L', source_section: 'Schedule V — Food Additives, Table B, Item 2', rule_reference: 'FSS-FPS-2011-Sch5-Add-SO2-Bev', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Sulphur dioxide in Fruit juices and drinks: maximum 70 mg/L' }),
  mkRule({ id: 'ADD-SO2-003', parameter_name: 'Sulphur Dioxide', substance_name: 'Sulphur Dioxide', parameter_aliases: ['Sulphur Dioxide', 'SO2', 'Total Sulphites', 'Sulphites'], substance_aliases: ['SO2', 'Sulphites'], INS_number: '220', CAS_number: '7446-09-5', product_category: 'CEREAL_GRAIN', limit_type: 'PROHIBITED', limit_value: 0, unit: 'mg/kg', source_section: 'Schedule V — Food Additives, Prohibited', rule_reference: 'FSS-FPS-2011-Sch5-Add-SO2-Cereal-Prohib', severity: 'CRITICAL', criticality: 'CRITICAL', prohibited_status: true, rule_type: 'PROHIBITED', source_text: 'Sulphur dioxide is NOT permitted in whole grain wheat flour (atta), maida' }),

  // COLOURS — Permitted and Prohibited
  mkRule({ id: 'ADD-COL-TART-001', parameter_name: 'Tartrazine', substance_name: 'Tartrazine', parameter_aliases: ['Tartrazine', 'E102', 'FD&C Yellow 5', 'CI 19140', 'INS 102'], substance_aliases: ['E102', 'INS 102', 'CI 19140'], INS_number: '102', CAS_number: '1934-21-0', product_category: 'BEVERAGES', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 200, unit: 'mg/kg', source_section: 'Schedule V — Food Additives, Colours, Table C', rule_reference: 'FSS-FPS-2011-Sch5-Add-Tartrazine-Bev', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Tartrazine (INS 102) in Non-alcoholic beverages: maximum 200 mg/kg (200 ppm)' }),
  mkRule({ id: 'ADD-COL-TART-002', parameter_name: 'Tartrazine', substance_name: 'Tartrazine', parameter_aliases: ['Tartrazine', 'E102', 'INS 102'], substance_aliases: ['E102', 'INS 102'], INS_number: '102', CAS_number: '1934-21-0', product_category: 'DAIRY', limit_type: 'PROHIBITED', limit_value: 0, unit: 'mg/kg', source_section: 'Schedule V — Food Additives, Colours, Prohibited', rule_reference: 'FSS-FPS-2011-Sch5-Add-Tartrazine-Dairy-Prohib', severity: 'CRITICAL', criticality: 'CRITICAL', prohibited_status: true, rule_type: 'PROHIBITED', source_text: 'Tartrazine (INS 102) is NOT permitted in milk, plain yoghurt, and non-flavoured dairy products' }),
  mkRule({ id: 'ADD-COL-SUNSET-001', parameter_name: 'Sunset Yellow FCF', substance_name: 'Sunset Yellow FCF', parameter_aliases: ['Sunset Yellow FCF', 'E110', 'INS 110', 'CI 15985', 'Orange Yellow S'], substance_aliases: ['E110', 'INS 110'], INS_number: '110', CAS_number: '2783-94-0', product_category: 'BEVERAGES', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 100, unit: 'mg/kg', source_section: 'Schedule V — Colours, Table C', rule_reference: 'FSS-FPS-2011-Sch5-Add-SunsetY-Bev', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Sunset Yellow FCF (INS 110) in Non-alcoholic beverages: maximum 100 mg/kg' }),
  mkRule({ id: 'ADD-COL-CARMEN-001', parameter_name: 'Carmoisine', substance_name: 'Carmoisine', parameter_aliases: ['Carmoisine', 'E122', 'INS 122', 'Azorubine', 'CI 14720'], substance_aliases: ['E122', 'INS 122', 'Azorubine'], INS_number: '122', CAS_number: '3567-69-9', product_category: 'BEVERAGES', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 100, unit: 'mg/kg', source_section: 'Schedule V — Colours, Table C', rule_reference: 'FSS-FPS-2011-Sch5-Add-Carmoisine-Bev', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Carmoisine (INS 122) in Non-alcoholic beverages: maximum 100 mg/kg' }),
  mkRule({ id: 'ADD-COL-ERYTHROSINE-001', parameter_name: 'Erythrosine', substance_name: 'Erythrosine', parameter_aliases: ['Erythrosine', 'E127', 'INS 127', 'CI 45430', 'FD&C Red 3'], substance_aliases: ['E127', 'INS 127'], INS_number: '127', CAS_number: '16423-68-0', product_category: 'CHERRY', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 200, unit: 'mg/kg', source_section: 'Schedule V — Colours, Table C', rule_reference: 'FSS-FPS-2011-Sch5-Add-Erythrosine-Cherry', severity: 'MODERATE', criticality: 'NON_CRITICAL', applicable_product: 'Cocktail cherries and glacé cherries', source_text: 'Erythrosine (INS 127) in Cocktail cherries: maximum 200 mg/kg' }),

  // SWEETENERS
  mkRule({ id: 'ADD-SACCH-001', parameter_name: 'Saccharin', substance_name: 'Saccharin', parameter_aliases: ['Saccharin', 'Sodium Saccharin', 'E954', 'INS 954', 'Saccharine'], substance_aliases: ['E954', 'INS 954'], INS_number: '954', CAS_number: '81-07-2', product_category: 'BEVERAGES', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 200, unit: 'mg/L', source_section: 'Schedule V — Sweeteners, Table D', rule_reference: 'FSS-FPS-2011-Sch5-Add-Saccharin-Bev', severity: 'MAJOR', criticality: 'NON_CRITICAL', applicable_product: 'Table top sweetener solutions and non-alcoholic beverages', source_text: 'Saccharin (INS 954) in Non-alcoholic beverages: maximum 200 mg/L' }),
  mkRule({ id: 'ADD-ASPART-001', parameter_name: 'Aspartame', substance_name: 'Aspartame', parameter_aliases: ['Aspartame', 'E951', 'INS 951', 'APM'], substance_aliases: ['E951', 'INS 951'], INS_number: '951', CAS_number: '22839-47-0', product_category: 'BEVERAGES', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 600, unit: 'mg/L', source_section: 'Schedule V — Sweeteners, Table D', rule_reference: 'FSS-FPS-2011-Sch5-Add-Aspartame-Bev', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Aspartame (INS 951) in Non-alcoholic beverages: maximum 600 mg/L' }),
  mkRule({ id: 'ADD-CYCL-001', parameter_name: 'Cyclamate', substance_name: 'Cyclamate', parameter_aliases: ['Cyclamate', 'Sodium Cyclamate', 'E952', 'INS 952', 'Cyclamic Acid'], substance_aliases: ['E952', 'INS 952'], INS_number: '952', CAS_number: '139-05-9', product_category: 'BEVERAGES', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 400, unit: 'mg/L', source_section: 'Schedule V — Sweeteners, Table D', rule_reference: 'FSS-FPS-2011-Sch5-Add-Cyclamate-Bev', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Cyclamic acid and its Na/K salts (INS 952) in Non-alcoholic beverages: maximum 400 mg/L' }),

  // ANTIOXIDANTS
  mkRule({ id: 'ADD-BHA-001', parameter_name: 'BHA (Butylated Hydroxyanisole)', substance_name: 'Butylated Hydroxyanisole', parameter_aliases: ['BHA', 'Butylated Hydroxyanisole', 'E320', 'INS 320', 'tert-Butyl-4-methoxyphenol'], substance_aliases: ['BHA', 'E320', 'INS 320'], INS_number: '320', CAS_number: '25013-16-5', product_category: 'EDIBLE_OILS_FATS', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 200, unit: 'mg/kg', source_section: 'Schedule V — Antioxidants, Table E', rule_reference: 'FSS-FPS-2011-Sch5-Add-BHA-Oils', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Butylated Hydroxyanisole (BHA, INS 320) in Edible oils and fats: maximum 200 mg/kg' }),
  mkRule({ id: 'ADD-BHT-001', parameter_name: 'BHT (Butylated Hydroxytoluene)', substance_name: 'Butylated Hydroxytoluene', parameter_aliases: ['BHT', 'Butylated Hydroxytoluene', 'E321', 'INS 321', 'Dibutylhydroxytoluene'], substance_aliases: ['BHT', 'E321', 'INS 321'], INS_number: '321', CAS_number: '128-37-0', product_category: 'EDIBLE_OILS_FATS', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 200, unit: 'mg/kg', source_section: 'Schedule V — Antioxidants, Table E', rule_reference: 'FSS-FPS-2011-Sch5-Add-BHT-Oils', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Butylated Hydroxytoluene (BHT, INS 321) in Edible oils and fats: maximum 200 mg/kg' }),
  mkRule({ id: 'ADD-TBHQ-001', parameter_name: 'TBHQ', substance_name: 'Tertiary Butylhydroquinone', parameter_aliases: ['TBHQ', 'Tertiary Butylhydroquinone', 'tert-Butylhydroquinone', 'E319', 'INS 319'], substance_aliases: ['TBHQ', 'E319', 'INS 319'], INS_number: '319', CAS_number: '1948-33-0', product_category: 'EDIBLE_OILS_FATS', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 200, unit: 'mg/kg', source_section: 'Schedule V — Antioxidants, Table E', rule_reference: 'FSS-FPS-2011-Sch5-Add-TBHQ-Oils', severity: 'MODERATE', criticality: 'NON_CRITICAL', source_text: 'Tertiary Butylhydroquinone (TBHQ, INS 319) in Edible oils and fats: maximum 200 mg/kg' }),

  // NITRATES / NITRITES
  mkRule({ id: 'ADD-NITRITE-001', parameter_name: 'Nitrite', substance_name: 'Sodium/Potassium Nitrite', parameter_aliases: ['Nitrite', 'Sodium Nitrite', 'Potassium Nitrite', 'E250', 'E249', 'INS 250', 'INS 249', 'NO2'], substance_aliases: ['E250', 'INS 250', 'E249', 'INS 249'], INS_number: '250', CAS_number: '7632-00-0', product_category: 'MEAT_FISH', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 125, unit: 'mg/kg', basis: 'residual', source_section: 'Schedule V — Curing Agents, Table F', rule_reference: 'FSS-FPS-2011-Sch5-Add-Nitrite-Meat', severity: 'MAJOR', criticality: 'CRITICAL', source_text: 'Sodium nitrite (INS 250) as residual in Cured/processed meat products: maximum 125 mg/kg residual' }),
  mkRule({ id: 'ADD-NITRATE-001', parameter_name: 'Nitrate', substance_name: 'Sodium/Potassium Nitrate', parameter_aliases: ['Nitrate', 'Sodium Nitrate', 'Potassium Nitrate', 'E251', 'E252', 'INS 251', 'INS 252', 'NO3'], substance_aliases: ['E251', 'INS 251', 'E252', 'INS 252'], INS_number: '251', CAS_number: '7631-99-4', product_category: 'MEAT_FISH', rule_type: 'ADDITIVE_LIMIT', limit_type: 'MAX', limit_value: 500, unit: 'mg/kg', basis: 'residual', source_section: 'Schedule V — Curing Agents, Table F', rule_reference: 'FSS-FPS-2011-Sch5-Add-Nitrate-Meat', severity: 'MAJOR', criticality: 'NON_CRITICAL', source_text: 'Sodium nitrate (INS 251) as residual in Cured/processed meat products: maximum 500 mg/kg residual' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSITION STANDARD RULES — Dairy
// Ref: FSS (Food Products Standards) Regulations 2011, Part II — Milk and Milk Products
// ─────────────────────────────────────────────────────────────────────────────
const DAIRY_COMPOSITION_RULES: FSSAILabRule[] = [
  mkRule({ id: 'COMP-DAIRY-FAT-001', parameter_name: 'Milk Fat', substance_name: 'Milk Fat', parameter_aliases: ['Milk Fat', 'Fat (as milk fat)', 'Butterfat', 'Fat Content', 'Total Fat'], substance_aliases: ['Milk Fat', 'Butterfat'], product_category: 'DAIRY', rule_type: 'COMPOSITION_REQUIREMENT', limit_type: 'MIN', lower_limit: 3.5, unit: '%', basis: 'w/w', source_section: 'Part II — Milk Products, Item 2.1', rule_reference: 'FSS-FPS-2011-P2-Dairy-Fat-Fullcream', severity: 'MAJOR', criticality: 'NON_CRITICAL', applicable_product: 'Full cream milk', source_text: 'Milk fat in Full cream milk: minimum 3.5% (w/w)' }),
  mkRule({ id: 'COMP-DAIRY-FAT-002', parameter_name: 'Milk Fat', substance_name: 'Milk Fat', parameter_aliases: ['Milk Fat', 'Fat', 'Butterfat'], substance_aliases: ['Milk Fat'], product_category: 'DAIRY', rule_type: 'COMPOSITION_REQUIREMENT', limit_type: 'RANGE', lower_limit: 1.5, upper_limit: 3.4, unit: '%', basis: 'w/w', source_section: 'Part II — Milk Products, Item 2.2', rule_reference: 'FSS-FPS-2011-P2-Dairy-Fat-Toned', severity: 'MODERATE', criticality: 'NON_CRITICAL', applicable_product: 'Toned milk', source_text: 'Milk fat in Toned milk: 1.5% to 3.4% (w/w)' }),
  mkRule({ id: 'COMP-DAIRY-FAT-003', parameter_name: 'Milk Fat', substance_name: 'Milk Fat', parameter_aliases: ['Milk Fat', 'Fat', 'Butterfat'], substance_aliases: ['Milk Fat'], product_category: 'DAIRY', rule_type: 'COMPOSITION_REQUIREMENT', limit_type: 'MIN', lower_limit: 0.5, unit: '%', basis: 'w/w', source_section: 'Part II — Milk Products, Item 2.3', rule_reference: 'FSS-FPS-2011-P2-Dairy-Fat-Skimmed', severity: 'MODERATE', criticality: 'NON_CRITICAL', applicable_product: 'Skimmed milk', source_text: 'Milk fat in Skimmed milk: not more than 0.5% (w/w)' }),
  mkRule({ id: 'COMP-DAIRY-SNF-001', parameter_name: 'Milk Solids-Not-Fat (SNF)', substance_name: 'Milk Solids-Not-Fat', parameter_aliases: ['SNF', 'Solids-Not-Fat', 'Milk SNF', 'Solid Non Fat', 'Non Fat Milk Solids', 'NFMS'], substance_aliases: ['SNF', 'NFMS'], product_category: 'DAIRY', rule_type: 'COMPOSITION_REQUIREMENT', limit_type: 'MIN', lower_limit: 8.5, unit: '%', basis: 'w/w', source_section: 'Part II — Milk Products, Item 2.4', rule_reference: 'FSS-FPS-2011-P2-Dairy-SNF', severity: 'MAJOR', criticality: 'NON_CRITICAL', applicable_product: 'Pasteurised/packaged milk (all types)', source_text: 'Milk solids-not-fat (SNF) in All milk varieties: minimum 8.5% (w/w)' }),
  mkRule({ id: 'COMP-DAIRY-ACID-001', parameter_name: 'Acidity (as Lactic Acid)', substance_name: 'Lactic Acid', parameter_aliases: ['Acidity', 'Titratable Acidity', 'Lactic Acid', 'Acidity (as lactic acid)', 'Acidity (LA)'], substance_aliases: ['Lactic Acid'], product_category: 'DAIRY', rule_type: 'COMPOSITION_REQUIREMENT', limit_type: 'MAX', limit_value: 0.14, unit: '% (w/v)', source_section: 'Part II — Milk Products, Item 2.5', rule_reference: 'FSS-FPS-2011-P2-Dairy-Acidity', severity: 'MAJOR', criticality: 'NON_CRITICAL', applicable_product: 'Pasteurised milk', source_text: 'Acidity (as lactic acid) in Pasteurised milk: not more than 0.14% (w/v)' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTICIDE RESIDUE RULES (selected MRLs)
// Ref: FSS (Contaminants, Toxins and Residues) Regulations 2011, Schedule III
// ─────────────────────────────────────────────────────────────────────────────
const PESTICIDE_RESIDUE_RULES: FSSAILabRule[] = [
  mkRule({ id: 'PEST-DDT-001', parameter_name: 'DDT (Total)', substance_name: 'DDT (Total)', parameter_aliases: ['DDT', 'Total DDT', 'DDT (p,p + o,p)', 'p,p-DDT', 'DDE+DDD+DDT'], substance_aliases: ['DDT'], CAS_number: '50-29-3', product_category: 'FRUITS_VEGETABLES', rule_type: 'RESIDUE_LIMIT', limit_type: 'MAX', limit_value: 0.05, unit: 'mg/kg', source_section: 'Schedule III — Pesticide Residue Limits, Item 1.1', rule_reference: 'FSS-CTR-2011-Sch3-Pest-DDT-FruitVeg', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'DDT (total) MRL in Fruits and vegetables: 0.05 mg/kg', analytical_method_reference: 'GC-ECD, AOAC 970.52' }),
  mkRule({ id: 'PEST-DDT-002', parameter_name: 'DDT (Total)', substance_name: 'DDT (Total)', parameter_aliases: ['DDT', 'Total DDT'], substance_aliases: ['DDT'], CAS_number: '50-29-3', product_category: 'CEREAL_GRAIN', rule_type: 'RESIDUE_LIMIT', limit_type: 'MAX', limit_value: 0.05, unit: 'mg/kg', source_section: 'Schedule III — Pesticide Residue Limits, Item 1.2', rule_reference: 'FSS-CTR-2011-Sch3-Pest-DDT-Cereal', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'DDT (total) MRL in Cereals: 0.05 mg/kg' }),
  mkRule({ id: 'PEST-DDT-003', parameter_name: 'DDT (Total)', substance_name: 'DDT (Total)', parameter_aliases: ['DDT', 'Total DDT'], substance_aliases: ['DDT'], CAS_number: '50-29-3', product_category: 'DAIRY', rule_type: 'RESIDUE_LIMIT', limit_type: 'MAX', limit_value: 0.05, unit: 'mg/kg', basis: 'fat', source_section: 'Schedule III — Pesticide Residue Limits, Item 1.3', rule_reference: 'FSS-CTR-2011-Sch3-Pest-DDT-Dairy', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'DDT (total) MRL in Milk (fat basis): 0.05 mg/kg fat' }),
  mkRule({ id: 'PEST-BHC-001', parameter_name: 'BHC (Total)', substance_name: 'Benzene Hexachloride', parameter_aliases: ['BHC', 'HCH', 'Total BHC', 'Total HCH', 'Lindane', 'gamma-BHC', 'alpha-BHC', 'beta-BHC'], substance_aliases: ['BHC', 'HCH', 'Lindane'], CAS_number: '608-73-1', product_category: 'CEREAL_GRAIN', rule_type: 'RESIDUE_LIMIT', limit_type: 'MAX', limit_value: 0.1, unit: 'mg/kg', source_section: 'Schedule III — Pesticide Residue Limits, Item 2.1', rule_reference: 'FSS-CTR-2011-Sch3-Pest-BHC-Cereal', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'BHC (total isomers) MRL in Cereals: 0.1 mg/kg' }),
  mkRule({ id: 'PEST-BHC-002', parameter_name: 'BHC (Total)', substance_name: 'Benzene Hexachloride', parameter_aliases: ['BHC', 'HCH', 'Total BHC', 'Total HCH', 'Lindane'], substance_aliases: ['BHC', 'HCH'], CAS_number: '608-73-1', product_category: 'FRUITS_VEGETABLES', rule_type: 'RESIDUE_LIMIT', limit_type: 'MAX', limit_value: 0.05, unit: 'mg/kg', source_section: 'Schedule III — Pesticide Residue Limits, Item 2.2', rule_reference: 'FSS-CTR-2011-Sch3-Pest-BHC-FruitVeg', severity: 'CRITICAL', criticality: 'CRITICAL', source_text: 'BHC (total isomers) MRL in Fruits and vegetables: 0.05 mg/kg' }),
  mkRule({ id: 'PEST-CHLOR-001', parameter_name: 'Chlorpyrifos', substance_name: 'Chlorpyrifos', parameter_aliases: ['Chlorpyrifos', 'Chloropyrifos', 'O,O-Diethyl O-(3,5,6-trichloro-2-pyridyl) phosphorothioate'], substance_aliases: ['Chlorpyrifos'], CAS_number: '2921-88-2', product_category: 'FRUITS_VEGETABLES', rule_type: 'RESIDUE_LIMIT', limit_type: 'MAX', limit_value: 0.5, unit: 'mg/kg', source_section: 'Schedule III — Pesticide Residue Limits, Item 3.1', rule_reference: 'FSS-CTR-2011-Sch3-Pest-Chlorpyrifos-FruitVeg', severity: 'MAJOR', criticality: 'CRITICAL', source_text: 'Chlorpyrifos MRL in Fruits and vegetables: 0.5 mg/kg' }),
  mkRule({ id: 'PEST-MALATH-001', parameter_name: 'Malathion', substance_name: 'Malathion', parameter_aliases: ['Malathion', 'S-1,2-bis(ethoxycarbonyl)ethyl dimethyl phosphorodithioate'], substance_aliases: ['Malathion'], CAS_number: '121-75-5', product_category: 'CEREAL_GRAIN', rule_type: 'RESIDUE_LIMIT', limit_type: 'MAX', limit_value: 1.0, unit: 'mg/kg', source_section: 'Schedule III — Pesticide Residue Limits, Item 4.1', rule_reference: 'FSS-CTR-2011-Sch3-Pest-Malathion-Cereal', severity: 'MAJOR', criticality: 'NON_CRITICAL', source_text: 'Malathion MRL in Cereals (stored grain): 1.0 mg/kg' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// OIL QUALITY & PURITY RULES
// Ref: FSS (Food Products Standards) Regulations 2011, Part II — Edible Oils
// ─────────────────────────────────────────────────────────────────────────────
const OIL_QUALITY_RULES: FSSAILabRule[] = [
  mkRule({
    id: 'QUAL-OIL-FFA-001',
    parameter_name: 'Free Fatty Acids (FFA)',
    substance_name: 'Free Fatty Acids',
    parameter_aliases: ['Free Fatty Acids', 'FFA', 'Free Fatty Acids (as Oleic Acid)', 'Free Acidity', 'FFA (as oleic acid)', 'Acidity'],
    substance_aliases: ['FFA'],
    product_category: 'EDIBLE_OILS_FATS',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'MAX',
    limit_value: 0.25,
    unit: '%',
    basis: 'as oleic acid',
    source_section: 'Part II — Edible Oils, Item 5.1',
    rule_reference: 'FSS-FPS-2011-P2-Oils-FFA-Refined',
    severity: 'MODERATE',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Refined edible oils',
    source_text: 'Free Fatty Acids in Refined edible oils: not more than 0.25% (as oleic acid)',
  }),
  mkRule({
    id: 'QUAL-OIL-AV-001',
    parameter_name: 'Acid Value',
    substance_name: 'Acid Value',
    parameter_aliases: ['Acid Value', 'AV', 'Acid Value (mg KOH/g)', 'Acidity (as KOH)'],
    substance_aliases: ['Acid Value', 'AV'],
    product_category: 'EDIBLE_OILS_FATS',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'MAX',
    limit_value: 0.5,
    unit: 'mg KOH/g',
    source_section: 'Part II — Edible Oils, Item 5.1',
    rule_reference: 'FSS-FPS-2011-P2-Oils-AcidValue-Refined',
    severity: 'MODERATE',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Refined edible oils',
    source_text: 'Acid Value in Refined edible oils: not more than 0.5 mg KOH/g',
  }),
  mkRule({
    id: 'QUAL-OIL-PEROX-001',
    parameter_name: 'Peroxide Value',
    substance_name: 'Peroxides',
    parameter_aliases: ['Peroxide Value', 'PV', 'Peroxide', 'POV'],
    substance_aliases: ['Peroxide Value', 'PV'],
    product_category: 'EDIBLE_OILS_FATS',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'MAX',
    limit_value: 10,
    unit: 'mEq O2/kg',
    source_section: 'Part II — Edible Oils, Item 5.2',
    rule_reference: 'FSS-FPS-2011-P2-Oils-Peroxide',
    severity: 'MODERATE',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Refined edible oils',
    source_text: 'Peroxide Value in Refined edible oils: not more than 10 mEq active oxygen/kg',
  }),
  mkRule({
    id: 'QUAL-OIL-MOIS-001',
    parameter_name: 'Moisture and Volatile Matter',
    substance_name: 'Moisture',
    parameter_aliases: ['Moisture', 'Moisture and Volatile Matter', 'Water Content', 'Moisture Content', 'MVS', 'Moisture & Insoluble Impurities'],
    substance_aliases: ['Moisture'],
    product_category: 'EDIBLE_OILS_FATS',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'MAX',
    limit_value: 0.1,
    unit: '%',
    basis: 'w/w',
    source_section: 'Part II — Edible Oils, Item 5.3',
    rule_reference: 'FSS-FPS-2011-P2-Oils-Moisture',
    severity: 'MODERATE',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Refined edible oils',
    source_text: 'Moisture and volatile matter in Refined edible oils: not more than 0.1% (w/w)',
  }),
  mkRule({
    id: 'QUAL-OIL-IV-001',
    parameter_name: 'Iodine Value',
    substance_name: 'Iodine Value',
    parameter_aliases: ['Iodine Value', 'IV', 'Wijs Iodine Value'],
    substance_aliases: ['Iodine Value', 'IV'],
    product_category: 'EDIBLE_OILS_FATS',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'RANGE',
    lower_limit: 80,
    upper_limit: 145,
    unit: 'g I2/100g',
    source_section: 'Part II — Edible Oils',
    rule_reference: 'FSS-FPS-2011-P2-Oils-IV',
    severity: 'MODERATE',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Edible vegetable oils',
    source_text: 'Iodine Value in edible vegetable oils: standard range 80 to 145 g I2/100g',
  }),
  mkRule({
    id: 'QUAL-OIL-SAP-001',
    parameter_name: 'Saponification Value',
    substance_name: 'Saponification Value',
    parameter_aliases: ['Saponification Value', 'SV', 'Sap Value'],
    substance_aliases: ['Saponification Value', 'SV'],
    product_category: 'EDIBLE_OILS_FATS',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'RANGE',
    lower_limit: 180,
    upper_limit: 205,
    unit: 'mg KOH/g',
    source_section: 'Part II — Edible Oils',
    rule_reference: 'FSS-FPS-2011-P2-Oils-Sap',
    severity: 'MODERATE',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Edible vegetable oils',
    source_text: 'Saponification Value in edible vegetable oils: standard range 180 to 205 mg KOH/g',
  }),
  mkRule({
    id: 'QUAL-OIL-USM-001',
    parameter_name: 'Unsaponifiable Matter',
    substance_name: 'Unsaponifiable Matter',
    parameter_aliases: ['Unsaponifiable Matter', 'USM', 'Unsaponifiable Matter (%)'],
    substance_aliases: ['Unsaponifiable Matter'],
    product_category: 'EDIBLE_OILS_FATS',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'MAX',
    limit_value: 1.0,
    unit: '%',
    source_section: 'Part II — Edible Oils, Item 5.4',
    rule_reference: 'FSS-FPS-2011-P2-Oils-USM',
    severity: 'MODERATE',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Refined edible oils',
    source_text: 'Unsaponifiable matter in Refined edible oils: not more than 1.0% (w/w)',
  }),
  mkRule({
    id: 'QUAL-OIL-RI-001',
    parameter_name: 'Refractive Index',
    substance_name: 'Refractive Index',
    parameter_aliases: ['Refractive Index', 'RI', 'Refractive Index at 40C', 'B.R. Reading'],
    substance_aliases: ['Refractive Index', 'RI'],
    product_category: 'EDIBLE_OILS_FATS',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'RANGE',
    lower_limit: 1.460,
    upper_limit: 1.475,
    unit: 'RI',
    source_section: 'Part II — Edible Oils',
    rule_reference: 'FSS-FPS-2011-P2-Oils-RI',
    severity: 'MODERATE',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Edible vegetable oils',
    source_text: 'Refractive Index of edible vegetable oils at 40°C: 1.460 to 1.475',
  }),
  mkRule({
    id: 'ADULT-OIL-ARG-001',
    parameter_name: 'Argemone Oil',
    substance_name: 'Argemone Oil',
    parameter_aliases: ['Argemone Oil', 'Argemone Oil (Qualitative Test)', 'Argemone', 'Argemone Test'],
    substance_aliases: ['Argemone Oil'],
    product_category: 'EDIBLE_OILS_FATS',
    rule_type: 'PROHIBITED',
    limit_type: 'PROHIBITED',
    unit: 'Qualitative',
    prohibited_status: true,
    source_section: 'FSS (Prohibition and Restrictions on Sales) Regulations 2011, Reg 2.2.1',
    rule_reference: 'FSS-PRS-2011-Reg2.2.1-Argemone',
    severity: 'CRITICAL',
    criticality: 'CRITICAL',
    applicable_product: 'All edible oils and fats',
    source_text: 'Argemone oil is strictly prohibited in all edible oils and fats (adulterant causing epidemic dropsy).',
  }),
  mkRule({
    id: 'ADULT-OIL-MIN-001',
    parameter_name: 'Mineral Oil',
    substance_name: 'Mineral Oil',
    parameter_aliases: ['Mineral Oil', 'Mineral Oil Test', 'Holde Test', 'Hydrocarbon Oil'],
    substance_aliases: ['Mineral Oil'],
    product_category: 'EDIBLE_OILS_FATS',
    rule_type: 'PROHIBITED',
    limit_type: 'PROHIBITED',
    unit: 'Qualitative',
    prohibited_status: true,
    source_section: 'FSS (Prohibition and Restrictions on Sales) Regulations 2011, Reg 2.2.1',
    rule_reference: 'FSS-PRS-2011-Reg2.2.1-MineralOil',
    severity: 'CRITICAL',
    criticality: 'CRITICAL',
    applicable_product: 'All edible oils and fats',
    source_text: 'Mineral oil is strictly prohibited in all edible oils and fats.',
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// SPICES & CONDIMENTS QUALITY RULES
// Ref: FSS (Food Products Standards) Regulations 2011, Part II — Spices
// ─────────────────────────────────────────────────────────────────────────────
const SPICE_QUALITY_RULES: FSSAILabRule[] = [
  mkRule({
    id: 'COMP-SPICE-CURC-001',
    parameter_name: 'Curcumin Content',
    substance_name: 'Curcumin',
    parameter_aliases: ['Curcumin Content', 'Curcumin', 'Curcuminoids'],
    substance_aliases: ['Curcumin'],
    product_category: 'SPICES_CONDIMENTS',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'MIN',
    lower_limit: 2.0,
    unit: '%',
    source_section: 'Part II — Spices, Item 14.1 (Turmeric Powder)',
    rule_reference: 'FSS-FPS-2011-P2-Spices-Curcumin-Turmeric',
    severity: 'MODERATE',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Turmeric powder',
    source_text: 'Curcumin content in Turmeric powder: minimum 2.0% (w/w)',
  }),
  mkRule({
    id: 'COMP-SPICE-ASH-001',
    parameter_name: 'Total Ash',
    substance_name: 'Total Ash',
    parameter_aliases: ['Total Ash', 'Ash Content', 'Ash'],
    substance_aliases: ['Total Ash'],
    product_category: 'SPICES_CONDIMENTS',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'MAX',
    limit_value: 9.0,
    unit: '%',
    source_section: 'Part II — Spices, Item 14.2',
    rule_reference: 'FSS-FPS-2011-P2-Spices-TotalAsh',
    severity: 'MODERATE',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Turmeric and ground spices',
    source_text: 'Total Ash in Turmeric powder: not more than 9.0% (w/w)',
  }),
  mkRule({
    id: 'COMP-SPICE-AIA-001',
    parameter_name: 'Acid Insoluble Ash',
    substance_name: 'Acid Insoluble Ash',
    parameter_aliases: ['Acid Insoluble Ash', 'AIA'],
    substance_aliases: ['Acid Insoluble Ash'],
    product_category: 'SPICES_CONDIMENTS',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'MAX',
    limit_value: 1.5,
    unit: '%',
    source_section: 'Part II — Spices, Item 14.3',
    rule_reference: 'FSS-FPS-2011-P2-Spices-AIA',
    severity: 'MODERATE',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Turmeric and ground spices',
    source_text: 'Acid Insoluble Ash in Turmeric powder: not more than 1.5% (w/w)',
  }),
  mkRule({
    id: 'COMP-SPICE-MOIS-001',
    parameter_name: 'Moisture',
    substance_name: 'Moisture',
    parameter_aliases: ['Moisture', 'Moisture Content', 'Loss on Drying'],
    substance_aliases: ['Moisture'],
    product_category: 'SPICES_CONDIMENTS',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'MAX',
    limit_value: 10.0,
    unit: '%',
    source_section: 'Part II — Spices, Item 14.4',
    rule_reference: 'FSS-FPS-2011-P2-Spices-Moisture',
    severity: 'MODERATE',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Spices and condiments (powdered)',
    source_text: 'Moisture in Powdered spices (Turmeric): not more than 10.0% (w/w)',
  }),
  mkRule({
    id: 'ADULT-SPICE-MY-001',
    parameter_name: 'Metanil Yellow',
    substance_name: 'Metanil Yellow',
    parameter_aliases: ['Metanil Yellow', 'Metanil Yellow (Non-Permitted Dye)', 'Metanil Yellow (Industrial Dye / Non-Permitted Colorant)', 'Acid Yellow 36'],
    substance_aliases: ['Metanil Yellow'],
    product_category: 'SPICES_CONDIMENTS',
    rule_type: 'PROHIBITED',
    limit_type: 'PROHIBITED',
    unit: 'Qualitative',
    prohibited_status: true,
    source_section: 'Schedule V — Colours, Reg 2.1.2',
    rule_reference: 'FSS-FPS-2011-Sch5-Prohib-MetanilYellow',
    severity: 'CRITICAL',
    criticality: 'CRITICAL',
    applicable_product: 'All food products / Spices',
    source_text: 'Metanil Yellow is a non-permitted, toxic industrial dye. Its use in any food is strictly prohibited.',
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// HONEY & SWEETENERS QUALITY RULES
// Ref: FSS (Food Products Standards) Regulations 2011, Part II — Honey
// ─────────────────────────────────────────────────────────────────────────────
const HONEY_QUALITY_RULES: FSSAILabRule[] = [
  mkRule({
    id: 'COMP-HONEY-MOIS-001',
    parameter_name: 'Moisture Content',
    substance_name: 'Moisture',
    parameter_aliases: ['Moisture', 'Moisture Content', 'Water Content'],
    substance_aliases: ['Moisture'],
    product_category: 'SUGAR_CONFECTIONERY',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'MAX',
    limit_value: 20.0,
    unit: '%',
    source_section: 'Part II — Honey, Item 7.1',
    rule_reference: 'FSS-FPS-2011-P2-Honey-Moisture',
    severity: 'MODERATE',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Natural honey',
    source_text: 'Moisture in Natural honey: not more than 20.0% (w/w)',
  }),
  mkRule({
    id: 'COMP-HONEY-HMF-001',
    parameter_name: 'Hydroxymethylfurfural (HMF)',
    substance_name: 'Hydroxymethylfurfural',
    parameter_aliases: ['Hydroxymethylfurfural', 'HMF', 'Hydroxymethylfurfural (HMF)'],
    substance_aliases: ['HMF'],
    product_category: 'SUGAR_CONFECTIONERY',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'MAX',
    limit_value: 80,
    unit: 'mg/kg',
    source_section: 'Part II — Honey, Item 7.2',
    rule_reference: 'FSS-FPS-2011-P2-Honey-HMF',
    severity: 'MODERATE',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Natural honey',
    source_text: 'Hydroxymethylfurfural (HMF) in Natural honey: not more than 80 mg/kg',
  }),
  mkRule({
    id: 'COMP-HONEY-RS-001',
    parameter_name: 'Total Reducing Sugars',
    substance_name: 'Reducing Sugars',
    parameter_aliases: ['Reducing Sugars', 'Total Reducing Sugars', 'Total Reducing Sugars (Fructose + Glucose)', 'Fructose + Glucose'],
    substance_aliases: ['Reducing Sugars'],
    product_category: 'SUGAR_CONFECTIONERY',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'MIN',
    lower_limit: 65.0,
    unit: '%',
    source_section: 'Part II — Honey, Item 7.3',
    rule_reference: 'FSS-FPS-2011-P2-Honey-ReducingSugars',
    severity: 'MAJOR',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Natural honey',
    source_text: 'Total reducing sugars (fructose + glucose) in Natural honey: minimum 65.0% (w/w)',
  }),
  mkRule({
    id: 'COMP-HONEY-SUC-001',
    parameter_name: 'Sucrose Content',
    substance_name: 'Sucrose',
    parameter_aliases: ['Sucrose', 'Sucrose Content', 'Apparent Sucrose'],
    substance_aliases: ['Sucrose'],
    product_category: 'SUGAR_CONFECTIONERY',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'MAX',
    limit_value: 5.0,
    unit: '%',
    source_section: 'Part II — Honey, Item 7.4',
    rule_reference: 'FSS-FPS-2011-P2-Honey-Sucrose',
    severity: 'MAJOR',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Natural honey',
    source_text: 'Sucrose content in Natural honey: not more than 5.0% (w/w)',
  }),
  mkRule({
    id: 'ADULT-HONEY-C4-001',
    parameter_name: 'C4 Sugar Syrup',
    substance_name: 'C4 Sugars',
    parameter_aliases: ['C4 Sugar Syrup', 'C4 Sugars', 'C4 Sugar Syrup (EA-IRMS Adulteration Test)', 'C-4 Sugar'],
    substance_aliases: ['C4 Sugars'],
    product_category: 'SUGAR_CONFECTIONERY',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'MAX',
    limit_value: 7.0,
    unit: '%',
    source_section: 'Part II — Honey, Item 7.5',
    rule_reference: 'FSS-FPS-2011-P2-Honey-C4',
    severity: 'CRITICAL',
    criticality: 'CRITICAL',
    applicable_product: 'Natural honey',
    source_text: 'C4 sugar adulteration in Natural honey: not more than 7.0% (by EA-IRMS)',
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// PACKAGED WATER QUALITY RULES
// Ref: IS 14543 / FSS (Food Products Standards) Regulations 2011
// ─────────────────────────────────────────────────────────────────────────────
const WATER_QUALITY_RULES: FSSAILabRule[] = [
  mkRule({
    id: 'COMP-WATER-TDS-001',
    parameter_name: 'Total Dissolved Solids (TDS)',
    substance_name: 'Total Dissolved Solids',
    parameter_aliases: ['Total Dissolved Solids', 'TDS', 'Total Dissolved Solids (TDS)'],
    substance_aliases: ['TDS'],
    product_category: 'PACKAGED_WATER',
    rule_type: 'COMPOSITION_REQUIREMENT',
    limit_type: 'MAX',
    limit_value: 500,
    unit: 'mg/L',
    source_section: 'IS 14543 Table 1 / FSS Regulations',
    rule_reference: 'FSS-FPS-2011-Water-TDS',
    severity: 'MODERATE',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Packaged drinking water',
    source_text: 'Total Dissolved Solids (TDS) in Packaged drinking water: not more than 500 mg/L',
  }),
  mkRule({
    id: 'COMP-WATER-NO3-001',
    parameter_name: 'Nitrate (as NO3)',
    substance_name: 'Nitrate',
    parameter_aliases: ['Nitrate', 'Nitrate (as NO3)', 'NO3'],
    substance_aliases: ['Nitrate'],
    product_category: 'PACKAGED_WATER',
    rule_type: 'CONTAMINANT_LIMIT',
    limit_type: 'MAX',
    limit_value: 45,
    unit: 'mg/L',
    source_section: 'IS 14543 Table 2 / FSS Regulations',
    rule_reference: 'FSS-FPS-2011-Water-Nitrate',
    severity: 'MAJOR',
    criticality: 'NON_CRITICAL',
    applicable_product: 'Packaged drinking water',
    source_text: 'Nitrate (as NO3) in Packaged drinking water: not more than 45 mg/L',
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const FSSAI_LAB_RULES: FSSAILabRule[] = [
  ...HEAVY_METAL_RULES,
  ...MYCOTOXIN_RULES,
  ...MICROBIOLOGICAL_RULES,
  ...ADDITIVE_RULES,
  ...DAIRY_COMPOSITION_RULES,
  ...PESTICIDE_RESIDUE_RULES,
  ...OIL_QUALITY_RULES,
  ...SPICE_QUALITY_RULES,
  ...HONEY_QUALITY_RULES,
  ...WATER_QUALITY_RULES,
];

/**
 * Food category keyword mapping — maps common terms in lab reports to FSSAI categories.
 * Used by the product identification engine.
 */
export const FSSAI_FOOD_CATEGORY_MAP: Record<string, string[]> = {
  DAIRY: ['milk', 'dairy', 'curd', 'yoghurt', 'yogurt', 'cheese', 'butter', 'ghee', 'cream', 'paneer', 'khoa', 'mawa', 'lassi', 'skimmed milk', 'toned milk', 'pasteurised milk', 'infant formula', 'condensed milk', 'evaporated milk', 'milk powder', 'whey'],
  CEREAL_GRAIN: ['wheat', 'rice', 'maize', 'corn', 'barley', 'oat', 'rye', 'millet', 'sorghum', 'jowar', 'bajra', 'ragi', 'flour', 'atta', 'maida', 'suji', 'semolina', 'bread', 'biscuit', 'cookie', 'cracker', 'breakfast cereal', 'muesli', 'porridge', 'cereal', 'grain'],
  FRUITS_VEGETABLES: ['fruit', 'vegetable', 'apple', 'mango', 'banana', 'grape', 'orange', 'tomato', 'potato', 'onion', 'carrot', 'pea', 'spinach', 'cabbage', 'cauliflower', 'brinjal', 'papaya', 'pineapple', 'guava', 'lemon', 'chilli', 'capsicum', 'beans', 'gourd', 'cucumber'],
  BEVERAGES: ['juice', 'drink', 'beverage', 'cola', 'soda', 'water', 'mineral water', 'soft drink', 'energy drink', 'tea', 'coffee', 'lemonade', 'nectar', 'squash', 'sherbet', 'sherbat', 'cordial'],
  MEAT_FISH: ['meat', 'chicken', 'mutton', 'beef', 'pork', 'lamb', 'poultry', 'turkey', 'goat', 'sausage', 'salami', 'ham', 'processed meat', 'cured meat'],
  FISH_SEAFOOD: ['fish', 'seafood', 'prawn', 'shrimp', 'crab', 'lobster', 'tuna', 'salmon', 'sardine', 'mackerel', 'hilsa', 'rohu', 'catla', 'sea fish', 'river fish', 'squid', 'oyster', 'mussel'],
  EDIBLE_OILS_FATS: ['oil', 'fat', 'ghee', 'butter', 'margarine', 'vanaspati', 'shortening', 'coconut oil', 'palm oil', 'sunflower oil', 'soybean oil', 'groundnut oil', 'mustard oil', 'sesame oil', 'rapeseed', 'canola', 'refined oil', 'edible oil', 'cooking oil'],
  SPICES_CONDIMENTS: ['spice', 'condiment', 'pepper', 'turmeric', 'coriander', 'cumin', 'chilli powder', 'garam masala', 'curry powder', 'cardamom', 'cinnamon', 'clove', 'mustard seed', 'fenugreek', 'asafoetida', 'hing', 'aniseed', 'fennel', 'bay leaf', 'nutmeg', 'mace'],
  OILSEEDS_NUTS: ['groundnut', 'peanut', 'almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'sunflower seed', 'sesame seed', 'flaxseed', 'chia', 'oilseed', 'nut', 'dry fruit'],
  SUGAR_CONFECTIONERY: ['sugar', 'jaggery', 'candy', 'chocolate', 'cocoa', 'confectionery', 'toffee', 'sweet', 'mithai', 'ladoo', 'barfi', 'halwa', 'honey', 'syrup', 'glucose', 'dextrose', 'fructose', 'molasses'],
  INFANT_FOOD: ['infant formula', 'baby food', 'infant food', 'weaning food', 'follow-up formula', 'growing-up milk', 'cerelac', 'baby cereal'],
  CANNED_FOODS: ['canned', 'tinned', 'tin can', 'retort', 'preserved food', 'canned vegetable', 'canned fruit'],
  PACKAGED_WATER: ['packaged water', 'drinking water', 'mineral water', 'bottled water', 'purified water'],
  MAIZE_CORN: ['maize', 'corn', 'cornmeal', 'corn flour', 'maize flour', 'popcorn', 'corn starch', 'cornstarch'],
  PROCESSED_FOOD: ['processed', 'ready to eat', 'ready-to-eat', 'snack', 'namkeen', 'chips', 'papad', 'pickles', 'sauce', 'ketchup', 'jam', 'preserve', 'protein powder', 'protein isolate', 'nutritional supplement', 'nutritional supplements', 'dietary supplement', 'health supplement', 'protein'],
  BAKERY: ['bread', 'biscuit', 'cake', 'pastry', 'muffin', 'cookie', 'cracker', 'rusk', 'toast', 'puff', 'wafer', 'bakery'],
  SALT: ['salt', 'iodised salt', 'iodized salt', 'sea salt', 'rock salt', 'table salt', 'sendha namak', 'black salt'],
  JAMS_PRESERVES: ['jam', 'jelly', 'marmalade', 'preserve', 'pickle', 'chutney', 'sauce'],
  COFFEE: ['coffee', 'instant coffee', 'roasted coffee', 'ground coffee', 'coffee powder'],
  DRIED_FRUITS: ['raisin', 'sultana', 'currant', 'dried fruit', 'dried apricot', 'prune', 'dried fig', 'dried mango'],
  FRUITS_JUICES: ['fruit juice', 'apple juice', 'orange juice', 'mango juice', 'juice concentrate'],
  LEAFY_VEGETABLES: ['spinach', 'lettuce', 'kale', 'fenugreek leaves', 'methi', 'coriander leaves', 'mint', 'mustard leaves', 'sarson', 'leafy', 'greens'],
  VEGETABLES: ['vegetables', 'potato', 'tomato', 'onion', 'carrot', 'pea', 'capsicum', 'brinjal', 'okra', 'bhindi', 'gourd'],
  PREDATORY_FISH: ['shark', 'swordfish', 'marlin', 'tuna', 'big eye tuna', 'large fish'],
  CANNED_BEVERAGES: ['canned beverage', 'canned juice', 'canned drink', 'canned soft drink'],
  CHERRY: ['cherry', 'glacé cherry', 'cocktail cherry', 'maraschino cherry'],
};

export const FSSAI_LAB_RULES_METADATA = {
  version: FSSAI_LAB_RULES_VERSION,
  source_document: FSSAI_LAB_RULES_SOURCE_DOCUMENT,
  total_rules: FSSAI_LAB_RULES.length,
  categories_covered: [...new Set(FSSAI_LAB_RULES.map(r => r.product_category))],
  rule_types_covered: [...new Set(FSSAI_LAB_RULES.map(r => r.rule_type))],
  last_updated: '2024-01-01',
  pdf_ingested: false,
  note: 'Rules derived from publicly known FSSAI Regulations 2011. Supplement with official PDF via /api/lab-rules/ingest-pdf endpoint.',
};

// ─────────────────────────────────────────────────────────────────────────────
// RE-EXPORT FSSAI APPENDIX A FOOD ADDITIVE RULES (Tables 1–14)
// Sourced from FSSAI_INGREDIENT_RULES_README.md (Version-XXIV 01.07.2022)
// ─────────────────────────────────────────────────────────────────────────────
export {
  FSSAI_ADDITIVE_RULES,
  FSSAI_ADDITIVE_RULES_VERSION,
  FSSAI_ADDITIVE_RULES_METADATA,
  FSSAI_PROHIBITED_SUBSTANCES,
  FSSAI_FOOD_CATEGORY_CODES,
  FSSAI_ADDITIVE_ALIASES,
} from './fssaiAdditiveRules';

