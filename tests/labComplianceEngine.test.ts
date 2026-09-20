import {
  runLabComplianceAnalysis,
  evaluateTestResultAgainstRule,
  findApplicableRulesDetailed,
  resolveCanonicalParameter,
  convertUnit,
  parseReportedValue,
} from '../src/engine/labRulesEngine';
import { FSSAI_LAB_RULES } from '../src/data/fssaiLabRules';
import { LabTestResult, FSSAILabRule } from '../src/types';

function createMockResult(id: string, parameter: string, resultText: string, unit: string, numeric: number | null = null): LabTestResult {
  return {
    id,
    parameter,
    parameter_normalized: parameter.toLowerCase(),
    detected_value: resultText,
    detected_numeric: numeric,
    unit,
    unit_normalized: unit,
    detection_limit: null,
    quantification_limit: null,
    result_text: resultText,
    is_not_detected: false,
    extraction_confidence: 0.95,
    requires_verification: false,
  };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

console.log('================================================================');
console.log('NIRIKSHAK FSSAI Compliance Engine Test Suite');
console.log('================================================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// TEST CASE 1: Numeric MAX rule below limit -> WITHIN_LIMIT
// ─────────────────────────────────────────────────────────────────────────────
console.log('Test 1: Numeric MAX rule with reported value below limit');
{
  const item = createMockResult('T1', 'Moisture', '0.05', '%', 0.05);
  const findings = runLabComplianceAnalysis([item], 'EDIBLE_OILS_FATS');
  assert(findings.length === 1, 'Returns 1 finding');
  assert(findings[0].status === 'WITHIN_LIMIT', 'Status is WITHIN_LIMIT', `Got ${findings[0].status}`);
  assert(findings[0].fssai_limit_value !== null, 'Has numeric limit value');
  assert(findings[0].comparison_detail?.result === true, 'Comparison result is true');
  assert(findings[0].comparison_detail?.formatted_comparison?.includes('<= max') ?? false, 'Formatted comparison contains <= max');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST CASE 2: Numeric MAX rule above limit -> ABOVE_LIMIT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTest 2: Numeric MAX rule with reported value above limit');
{
  // Peroxide Value in Edible Oils has limit 10 meq/kg
  const item = createMockResult('T2', 'Peroxide Value', '15.0', 'meq/kg', 15.0);
  const findings = runLabComplianceAnalysis([item], 'EDIBLE_OILS_FATS');
  assert(findings.length === 1, 'Returns 1 finding');
  assert(findings[0].status === 'ABOVE_LIMIT', 'Status is ABOVE_LIMIT', `Got ${findings[0].status}`);
  assert(findings[0].comparison_detail?.result === false, 'Comparison result is false');
  assert(findings[0].difference_from_limit !== null && findings[0].difference_from_limit > 0, 'Positive difference from limit');
  assert(findings[0].comparison_detail?.formatted_comparison?.includes('> max') ?? false, 'Formatted comparison contains > max');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST CASE 3: Parameter with no rule -> NO_APPLICABLE_LIMIT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTest 3: Parameter with no rule (Energy, Carbohydrate)');
{
  const energyItem = createMockResult('T3A', 'Energy Value', '884', 'kcal', 884);
  const carbItem = createMockResult('T3B', 'Carbohydrate', '0.0', 'g/100g', 0.0);
  const proteinItem = createMockResult('T3C', 'Protein', '0.0', 'g/100g', 0.0);
  const fatItem = createMockResult('T3D', 'Total Fat', '100.0', 'g/100g', 100.0);

  const findings = runLabComplianceAnalysis([energyItem, carbItem, proteinItem, fatItem], 'EDIBLE_OILS_FATS');
  assert(findings[0].status === 'NO_APPLICABLE_LIMIT', 'Energy is NO_APPLICABLE_LIMIT', `Got ${findings[0].status}`);
  assert(findings[1].status === 'NO_APPLICABLE_LIMIT', 'Carbohydrate is NO_APPLICABLE_LIMIT', `Got ${findings[1].status}`);
  assert(findings[2].status === 'NO_APPLICABLE_LIMIT', 'Protein is NO_APPLICABLE_LIMIT', `Got ${findings[2].status}`);
  assert(findings[3].status === 'NO_APPLICABLE_LIMIT', 'Fat is NO_APPLICABLE_LIMIT', `Got ${findings[3].status}`);
  assert(findings[0].severity === 'NONE', 'No applicable limit is severity NONE');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST CASE 4: Category ambiguous and multiple rules exist -> MANUAL_VERIFICATION_REQUIRED
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTest 4: Category ambiguous and multiple rules exist');
{
  // Lead and Cadmium have different limits across Dairy, Fruit, Cereals, etc.
  const leadItem = createMockResult('T4', 'Lead', '0.1', 'mg/kg', 0.1);
  const findings = runLabComplianceAnalysis([leadItem], 'GENERAL_FOOD');
  assert(findings[0].status === 'MANUAL_VERIFICATION_REQUIRED', 'Ambiguous category yields MANUAL_VERIFICATION_REQUIRED', `Got ${findings[0].status}`);
  assert(
    findings[0].explanation.includes('Multiple applicable FSSAI standards found; food category must be confirmed'),
    'Explanation states multiple applicable FSSAI standards found'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST CASE 5: GMP rule -> PERMITTED_GMP
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTest 5: GMP rule handling');
{
  const mockGmpRule: FSSAILabRule = {
    id: 'MOCK-GMP-1',
    parameter_name: 'Guar Gum',
    parameter_aliases: ['Guar gum', 'INS 412'],
    substance_name: 'Guar Gum',
    substance_aliases: ['guar gum'],
    product_category: 'EDIBLE_OILS_FATS',
    limit_type: 'GMP',
    unit: 'GMP',
    active: true,
    rule_type: 'MAXIMUM_LIMIT',
    criticality: 'NON_CRITICAL',
    rule_reference: 'FSSAI GMP Rule',
    regulation_name: 'Food Additives',
    regulation_version: '2011',
    source_section: 'Section 3',
    source_document: 'FSSAI Regs',
    source_text: 'Good Manufacturing Practice',
    severity: 'ADVISORY',
    prohibited_status: false,
  };

  const item = createMockResult('T5', 'Guar Gum', '0.5', '%', 0.5);
  const finding = evaluateTestResultAgainstRule(item, mockGmpRule, 'EDIBLE_OILS_FATS');
  assert(finding.status === 'PERMITTED_GMP', 'GMP rule yields PERMITTED_GMP', `Got ${finding.status}`);
  assert(finding.severity === 'NONE', 'GMP rule has severity NONE');
  assert(finding.comparison_detail?.operator === 'GMP', 'Comparison detail operator is GMP');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST CASE 6: Prohibited substance detected -> PROHIBITED
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTest 6: Prohibited substance detected');
{
  // Argemone oil is strictly prohibited in Edible Oils
  const itemDetected = createMockResult('T6A', 'Argemone Oil', '0.05', '%', 0.05);
  const findingsDetected = runLabComplianceAnalysis([itemDetected], 'EDIBLE_OILS_FATS');
  assert(findingsDetected[0].status === 'PROHIBITED', 'Detected prohibited substance yields PROHIBITED', `Got ${findingsDetected[0].status}`);
  assert(findingsDetected[0].severity === 'CRITICAL', 'Prohibited substance is CRITICAL severity');
  assert(findingsDetected[0].is_prohibited === true, 'is_prohibited flag is true');

  // Argemone oil reported as Not Detected / Absent
  const itemND = createMockResult('T6B', 'Argemone Oil', 'Negative', '%', null);
  const findingsND = runLabComplianceAnalysis([itemND], 'EDIBLE_OILS_FATS');
  assert(findingsND[0].status === 'NOT_DETECTED', 'ND prohibited substance yields NOT_DETECTED', `Got ${findingsND[0].status}`);
  assert(findingsND[0].severity === 'NONE', 'ND prohibited substance is severity NONE');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST CASE 7: Alias normalization
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTest 7: Alias normalization');
{
  const canon1 = resolveCanonicalParameter('Peroxide Value (PV)');
  const canon2 = resolveCanonicalParameter('PV');
  const canon3 = resolveCanonicalParameter('Peroxide Value');
  const canon4 = resolveCanonicalParameter('Moisture Content');
  const canon5 = resolveCanonicalParameter('Protein (N × 6.25)');

  assert(canon1 === 'peroxide_value', '"Peroxide Value (PV)" resolves to "peroxide_value"', `Got ${canon1}`);
  assert(canon2 === 'peroxide_value', '"PV" resolves to "peroxide_value"', `Got ${canon2}`);
  assert(canon3 === 'peroxide_value', '"Peroxide Value" resolves to "peroxide_value"', `Got ${canon3}`);
  assert(canon4 === 'moisture', '"Moisture Content" resolves to "moisture"', `Got ${canon4}`);
  assert(canon5 === 'protein', '"Protein (N × 6.25)" resolves to "protein"', `Got ${canon5}`);

  // Test that PV and Peroxide Value match the same FSSAI rule in Edible Oils
  const searchPV = findApplicableRulesDetailed('PV', 'EDIBLE_OILS_FATS');
  const searchFullName = findApplicableRulesDetailed('Peroxide Value', 'EDIBLE_OILS_FATS');
  assert(searchPV.matches.length > 0, 'PV matches FSSAI rules');
  assert(searchFullName.matches.length > 0, 'Peroxide Value matches FSSAI rules');
  assert(searchPV.matches[0].id === searchFullName.matches[0].id, 'PV and Peroxide Value match identical rule');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST CASE 8: Safe unit conversion & incompatible units
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTest 8: Safe unit conversion and incompatible units');
{
  // 1. g/100g to % (1:1 conversion)
  const conv1 = convertUnit(0.08, 'g/100g', '%');
  assert(conv1 !== null && conv1.convertedValue === 0.08, 'g/100g converts 1:1 to %');

  // 2. Meq/kg to meq O2/kg (1:1 conversion)
  const conv2 = convertUnit(6.5, 'Meq/kg', 'meq O2/kg');
  assert(conv2 !== null && conv2.convertedValue === 6.5, 'Meq/kg converts 1:1 to meq O2/kg');

  // 3. Incompatible units (e.g. mg/kg vs CFU/g or % vs ml)
  const convIncompatible = convertUnit(10, '%', 'CFU/g');
  assert(convIncompatible === null, 'Incompatible units return null');

  const mockRuleWithPercent: FSSAILabRule = {
    id: 'MOCK-PERCENT-1',
    parameter_name: 'Test Moisture',
    parameter_aliases: ['moisture'],
    substance_name: 'Test Moisture',
    substance_aliases: ['moisture'],
    product_category: 'EDIBLE_OILS_FATS',
    limit_type: 'MAX',
    limit_value: 0.1,
    unit: '%',
    active: true,
    rule_type: 'MAXIMUM_LIMIT',
    criticality: 'NON_CRITICAL',
    rule_reference: 'FSSAI Mock',
    regulation_name: 'Mock',
    regulation_version: '2011',
    source_section: 'S1',
    source_document: 'Doc',
    source_text: 'Max 0.1%',
    severity: 'MAJOR',
    prohibited_status: false,
  };

  const itemIncompatibleUnit = createMockResult('T8', 'Test Moisture', '100', 'CFU/g', 100);
  const findingIncompat = evaluateTestResultAgainstRule(itemIncompatibleUnit, mockRuleWithPercent, 'EDIBLE_OILS_FATS');
  assert(
    findingIncompat.status === 'MANUAL_VERIFICATION_REQUIRED',
    'Incompatible unit yields MANUAL_VERIFICATION_REQUIRED',
    `Got ${findingIncompat.status}`
  );
  assert(findingIncompat.explanation.includes('reported unit "CFU/g" cannot be reliably converted'), 'Explanation notes unit incompatibility');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST CASE 9: Inequality handling (< 0.1 g/100g vs MAX 0.1 %)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTest 9: Inequality parsing and evaluation (< 0.1 g/100g vs MAX 0.1 %)');
{
  const parsed = parseReportedValue('< 0.1');
  assert(parsed.isInequality === true, '< 0.1 parsed as inequality');
  assert(parsed.numericValue === 0.1, '< 0.1 numeric value is 0.1');
  assert(parsed.operator === '<=', '< 0.1 operator is <=');

  const itemInequality = createMockResult('T9', 'Moisture', '< 0.1', 'g/100g');
  const findings = runLabComplianceAnalysis([itemInequality], 'EDIBLE_OILS_FATS');
  assert(findings[0].status === 'WITHIN_LIMIT', '< 0.1 g/100g against max 0.1% is WITHIN_LIMIT', `Got ${findings[0].status}`);
  assert(findings[0].comparison_detail?.formatted_comparison?.includes('<= max') ?? false, 'Comparison reflects <= max');
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST CASE 10: Minimum requirement deficit -> BELOW_LIMIT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTest 10: Minimum requirement deficit -> BELOW_LIMIT');
{
  const mockMinRule: FSSAILabRule = {
    id: 'MOCK-MIN-1',
    parameter_name: 'Milk Fat',
    parameter_aliases: ['fat', 'milk fat'],
    substance_name: 'Milk Fat',
    substance_aliases: ['fat'],
    product_category: 'DAIRY',
    limit_type: 'MIN',
    lower_limit: 3.5,
    unit: '%',
    active: true,
    rule_type: 'MINIMUM_LIMIT',
    criticality: 'NON_CRITICAL',
    rule_reference: 'FSSAI Dairy',
    regulation_name: 'Dairy Regulations',
    regulation_version: '2011',
    source_section: 'S2',
    source_document: 'Doc',
    source_text: 'Min 3.5%',
    severity: 'MAJOR',
    prohibited_status: false,
  };

  const itemDeficit = createMockResult('T10', 'Milk Fat', '2.8', '%', 2.8);
  const finding = evaluateTestResultAgainstRule(itemDeficit, mockMinRule, 'DAIRY');
  assert(finding.status === 'BELOW_LIMIT', 'Deficit on minimum requirement yields BELOW_LIMIT', `Got ${finding.status}`);
  assert(finding.comparison_detail?.result === false, 'Comparison result is false');
  assert(finding.comparison_detail?.formatted_comparison?.includes('< min') ?? false, 'Formatted comparison contains < min');
}

console.log('\n================================================================');
console.log(`Results: ${passedTests} / ${totalTests} assertions passed (${((passedTests / totalTests) * 100).toFixed(0)}%)`);
console.log('================================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
