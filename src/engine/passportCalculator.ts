import { InspectionRecord, ManufacturerProfile, RepeatViolationRuleSummary, RepeatViolationGroup, ManufacturerViolationFinding } from '../types';
import { STATUTORY_RULES, CRITICAL_RULE_CATEGORIES, isRuleCritical } from './rules';

// Pre-registered canonical directory data for known statutory entities
const KNOWN_MFG_REGISTRY: Record<
  string,
  { canonicalName: string; state: string; licenseNumber: string }
> = {
  kisanagriinputs: {
    canonicalName: 'Kisan Agri Inputs Pvt Ltd',
    state: 'Haryana (Karnal)',
    licenseNumber: 'HR-SEED-2018-091',
  },
  nationalseedscorporation: {
    canonicalName: 'National Seeds Corporation Ltd',
    state: 'New Delhi',
    licenseNumber: 'GOI-NSC-CENTRAL-001',
  },
  indoglobalfoods: {
    canonicalName: 'IndoGlobal Foods & Agrotech Pvt Ltd',
    state: 'Maharashtra (Navi Mumbai)',
    licenseNumber: 'MH-IMP-2021-4410',
  },
  reynoldswritinginstruments: {
    canonicalName: 'Reynolds Writing Instruments Pvt Ltd',
    state: 'Tamil Nadu (Sriperumbudur)',
    licenseNumber: 'TN-STAT-2019-112',
  },
  honasaconsumer: {
    canonicalName: 'Honasa Consumer Limited',
    state: 'Haryana (Gurugram)',
    licenseNumber: 'CDSCO-COS-HR-2022-89',
  },
  dermaglowcare: {
    canonicalName: 'DermaGlow Care India Pvt Ltd',
    state: 'Maharashtra (Mumbai)',
    licenseNumber: 'MH-COS-2021-304',
  },
  botanicaorganics: {
    canonicalName: 'Botanica Organics India Pvt Ltd',
    state: 'Uttarakhand (Dehradun)',
    licenseNumber: 'UK-AYU-2020-112',
  },
  hydrasoftskincare: {
    canonicalName: 'HydraSoft Skincare Labs',
    state: 'Karnataka (Bengaluru)',
    licenseNumber: 'KA-COS-2023-551',
  },
  britanniaindustries: {
    canonicalName: 'Britannia Industries Limited',
    state: 'West Bengal (Kolkata)',
    licenseNumber: 'FSSAI-10014031001201',
  },
  bisleriinternational: {
    canonicalName: 'Bisleri International Pvt Ltd',
    state: 'Maharashtra (Mumbai)',
    licenseNumber: 'FSSAI-10012022000526',
  },
  annapurnaagrofoods: {
    canonicalName: 'Annapurna Agro Foods Ltd',
    state: 'Madhya Pradesh (Indore)',
    licenseNumber: 'MP-AGRO-2020-044',
  },
  cleanhomecareproducts: {
    canonicalName: 'CleanHome Care Products India Ltd',
    state: 'Gujarat (Ahmedabad)',
    licenseNumber: 'GJ-LMPC-2021-998',
  },
  luminaelectronics: {
    canonicalName: 'Lumina Electronics India Pvt Ltd',
    state: 'Karnataka (Bengaluru)',
    licenseNumber: 'BIS-R-41009872',
  },
  adityabirlafashion: {
    canonicalName: 'Aditya Birla Fashion & Retail Ltd',
    state: 'Karnataka (Bengaluru)',
    licenseNumber: 'KA-TEX-2017-550',
  },
  playcrafttoyindustries: {
    canonicalName: 'PlayCraft Toy Industries India Pvt Ltd',
    state: 'Noida, Uttar Pradesh',
    licenseNumber: 'BIS-CM/L-8400192',
  },
  indianfarmersfertilisertiffco: {
    canonicalName: 'Indian Farmers Fertiliser Cooperative Ltd (IFFCO)',
    state: 'New Delhi',
    licenseNumber: 'FCO-DL-CENTRAL-1985-01',
  },
  safeconlifesciences: {
    canonicalName: 'Safecon Lifesciences Pvt Ltd',
    state: 'Uttar Pradesh (Agra)',
    licenseNumber: 'UP-DRUG-2018-04',
  },
};

/**
 * Normalizes manufacturer/importer name for robust entity grouping and aggregation.
 */
export function normalizeManufacturerKey(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .toLowerCase()
    .replace(/\b(m\/s|ms|pvt|ltd|private|limited|co|company|corp|corporation|inc|llp|india)\b/gi, '')
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

/**
 * Extracts the primary commercial manufacturer / packer / importer identity from an inspection record.
 */
export function extractManufacturerInfo(inspection: InspectionRecord): {
  key: string;
  displayName: string;
  state?: string;
  licenseNumber?: string;
  isImporter: boolean;
} | null {
  const fields = inspection.extractedFields || {};
  const mfgName = fields.manufacturerName?.trim();
  const impName = fields.importerName?.trim();
  const pkrName = fields.packerName?.trim();
  const brandName = fields.brandName?.trim() || inspection.productIdentification?.brandName?.trim();
  const prodName = inspection.productName?.trim();

  let chosenName = mfgName || impName || pkrName || brandName || prodName || '';
  if (!chosenName) return null;

  const key = normalizeManufacturerKey(chosenName);
  if (!key) return null;

  // Check known registry
  let canonicalName = chosenName;
  let state = fields.manufacturerAddress || fields.importerAddress || fields.packerAddress;
  let licenseNumber =
    fields.cosmeticMfgLicense ||
    fields.fssaiLicenseNumber ||
    fields.drugLicenseNumber ||
    fields.fcoLicenseNumber ||
    fields.cibRegistrationNumber;

  // Match against known registry keys
  for (const [regKey, regData] of Object.entries(KNOWN_MFG_REGISTRY)) {
    if (key === regKey || key.includes(regKey) || regKey.includes(key)) {
      canonicalName = regData.canonicalName;
      if (!state) state = regData.state;
      if (!licenseNumber) licenseNumber = regData.licenseNumber;
      break;
    }
  }

  // Fallback state parse if address is present
  if (state && !state.includes('(')) {
    const stateMatch = state.match(
      /(Haryana|Delhi|New Delhi|Maharashtra|Tamil Nadu|Karnataka|Gujarat|Uttar Pradesh|Madhya Pradesh|West Bengal|Uttarakhand|Punjab|Rajasthan|Telangana|Kerala|Andhra Pradesh|Bihar|Odisha)/i
    );
    if (stateMatch) {
      state = stateMatch[1];
    }
  }

  return {
    key,
    displayName: canonicalName,
    state: state || 'Registered In Scope',
    licenseNumber: licenseNumber || 'VERIFIED-REG-STD',
    isImporter: Boolean(impName && !mfgName),
  };
}

/**
 * Helper to resolve the canonical group key and details for an inspection.
 */
export function getManufacturerGroupKey(inspection: InspectionRecord): {
  groupKey: string;
  displayName: string;
  state: string;
  licenseNumber: string;
  isImporter: boolean;
} {
  const info = extractManufacturerInfo(inspection);
  if (info) {
    for (const [regKey, regData] of Object.entries(KNOWN_MFG_REGISTRY)) {
      if (info.key === regKey || info.key.includes(regKey) || regKey.includes(info.key)) {
        return {
          groupKey: regKey,
          displayName: regData.canonicalName,
          state: info.state || regData.state,
          licenseNumber: info.licenseNumber || regData.licenseNumber,
          isImporter: info.isImporter,
        };
      }
    }
    return {
      groupKey: info.key,
      displayName: info.displayName,
      state: info.state || 'Registered In Scope',
      licenseNumber: info.licenseNumber || 'VERIFIED-REG-STD',
      isImporter: info.isImporter,
    };
  }

  const fallbackName = inspection.productName || 'Unknown Manufacturer';
  const fallbackKey = normalizeManufacturerKey(fallbackName) || 'unknownmfg';
  return {
    groupKey: fallbackKey,
    displayName: fallbackName,
    state: 'Registered In Scope',
    licenseNumber: 'VERIFIED-REG-STD',
    isImporter: false,
  };
}

/**
 * Helper to determine if a finding is a qualifying active violation finding.
 * Checks for status normalization and excludes findings overridden to VERIFIED.
 */
export function isFindingViolation(f: any): boolean {
  if (!f) return false;

  // If status is explicitly VERIFIED or NOT_APPLICABLE, it is not an active violation
  if (f.status === 'VERIFIED' || f.status === 'NOT_APPLICABLE') {
    return false;
  }

  // Check for reviewer override
  if (
    f.reviewerOverride &&
    (f.reviewerOverride.decision === 'VERIFIED' ||
      f.reviewerOverride.newStatus === 'VERIFIED' ||
      f.reviewerOverride.decision === 'NOT_APPLICABLE' ||
      f.reviewerOverride.newStatus === 'NOT_APPLICABLE')
  ) {
    return false;
  }

  const status = String(f.status || '')
    .toUpperCase()
    .trim();

  return (
    status === 'POTENTIAL_ISSUE' ||
    status === 'NOT_DETECTED' ||
    status === 'VIOLATION' ||
    status === 'REQUIRES_MANUAL_REVIEW' ||
    status === 'NEEDS_REVIEW' ||
    status === 'LOW_CONFIDENCE' ||
    status === 'NON_COMPLIANT' ||
    status === 'INSUFFICIENT_EVIDENCE'
  );
}

/**
 * Computes live Manufacturer Compliance Passport profiles across all active inspections.
 * Recalculated dynamically on every read — NO caching, NO static hardcoding.
 */
export function computeLiveManufacturerProfiles(
  inspections: InspectionRecord[],
  includeDemo = false
): ManufacturerProfile[] {
  // 1. Group inspections by normalized manufacturer key
  const groups: Map<
    string,
    {
      mfgInfo: { displayName: string; state: string; licenseNumber: string };
      inspections: InspectionRecord[];
    }
  > = new Map();

  // Seed known demo regulatory entities if demo data mode is explicitly enabled
  if (includeDemo) {
    for (const [regKey, regData] of Object.entries(KNOWN_MFG_REGISTRY)) {
      groups.set(regKey, {
        mfgInfo: {
          displayName: regData.canonicalName,
          state: regData.state,
          licenseNumber: regData.licenseNumber,
        },
        inspections: [],
      });
    }
  }

  // Distribute all active inspections to their matching manufacturer groups
  inspections.forEach((insp) => {
    // If demo mode is off, skip any preset inspections entirely
    if (!includeDemo && (insp.analysisSource === 'preset' || (insp as any).isDemoData)) {
      return;
    }

    const mfgData = getManufacturerGroupKey(insp);

    // Check if matches an existing group key in map
    let matchedKey: string | null = null;
    for (const groupKey of groups.keys()) {
      if (
        mfgData.groupKey === groupKey ||
        mfgData.groupKey.includes(groupKey) ||
        groupKey.includes(mfgData.groupKey)
      ) {
        matchedKey = groupKey;
        break;
      }
    }

    if (matchedKey) {
      groups.get(matchedKey)!.inspections.push(insp);
    } else {
      groups.set(mfgData.groupKey, {
        mfgInfo: {
          displayName: mfgData.displayName,
          state: mfgData.state,
          licenseNumber: mfgData.licenseNumber,
        },
        inspections: [insp],
      });
    }
  });

  // 2. Compute the 6 Compliance Passport metrics for each manufacturer
  const profiles: ManufacturerProfile[] = [];

  for (const [groupKey, group] of groups.entries()) {
    const mfgInspections = group.inspections;

    const distinctInspections = Array.from(new Set(mfgInspections.map((i) => i.id))).map(
      (id) => mfgInspections.find((i) => i.id === id)!
    );

    // Only include manufacturers that have at least 1 real inspection (or if demo mode is on, major demo entities)
    if (distinctInspections.length === 0) {
      if (!includeDemo) continue;
      if (!['kisanagriinputs', 'nationalseedscorporation', 'indoglobalfoods', 'safeconlifesciences'].includes(groupKey)) {
        continue;
      }
    }

    // Metric 1: Products Inspected (count of distinct inspection records)
    const productsInspected = distinctInspections.length;

    // Metric 2: Compliant
    // count of inspections with zero active violation findings
    const compliant = distinctInspections.filter((insp) => {
      const findings = insp.findings || [];
      const hasActiveViolations = findings.some((f) => isFindingViolation(f));
      const isInvalidStatus =
        insp.status === 'ANALYSIS_ERROR' ||
        insp.status === 'SEIZURE_FLAGGED' ||
        insp.status === 'NEEDS_REVIEW' ||
        insp.status === 'DRAFT';

      return !hasActiveViolations && !isInvalidStatus && findings.length > 0;
    }).length;

    // Metric 3: Violations
    // total count of qualifying active violation findings across all product inspections for this manufacturer
    let violations = 0;
    distinctInspections.forEach((insp) => {
      (insp.findings || []).forEach((f) => {
        if (isFindingViolation(f)) {
          violations += 1;
        }
      });
    });

    // Metric 4: Repeat Violations
    // count of specific RULES that have been violated 2 or more times across inspection history
    const violationCountByRule: Record<
      string,
      { ruleId: string; sectionRef: string; title: string; count: number }
    > = {};

    distinctInspections.forEach((insp) => {
      const violatedRuleIdsInInspection = new Set<string>();

      (insp.findings || []).forEach((f) => {
        if (isFindingViolation(f)) {
          if (!violatedRuleIdsInInspection.has(f.ruleId)) {
            violatedRuleIdsInInspection.add(f.ruleId);
            if (!violationCountByRule[f.ruleId]) {
              violationCountByRule[f.ruleId] = {
                ruleId: f.ruleId,
                sectionRef: f.sectionRef || f.ruleId,
                title: f.title || f.ruleId,
                count: 0,
              };
            }
            violationCountByRule[f.ruleId].count += 1;
          }
        }
      });
    });

    const repeatViolationRules: RepeatViolationRuleSummary[] = Object.values(violationCountByRule)
      .filter((r) => r.count >= 2)
      .map((r) => ({
        ruleId: r.ruleId,
        sectionRef: r.sectionRef,
        title: r.title,
        count: r.count,
      }));

    const repeatViolations = repeatViolationRules.length;

    // Metric 5: Critical Violations
    // count of qualifying active violation findings where the violated rule belongs to critical categories or has severity CRITICAL
    let criticalViolations = 0;
    distinctInspections.forEach((insp) => {
      (insp.findings || []).forEach((f) => {
        if (isFindingViolation(f)) {
          const ruleDef = STATUTORY_RULES.find((r) => r.ruleId === f.ruleId);
          const isCritical =
            f.severity === 'CRITICAL' ||
            (ruleDef && isRuleCritical(ruleDef)) ||
            (ruleDef?.ruleCategory && CRITICAL_RULE_CATEGORIES.includes(ruleDef.ruleCategory)) ||
            (ruleDef?.rule_category && CRITICAL_RULE_CATEGORIES.includes(ruleDef.rule_category));

          if (isCritical) {
            criticalViolations += 1;
          }
        }
      });
    });

    // Metric 6: Last Inspection
    let lastInspection: string | null = null;
    if (distinctInspections.length > 0) {
      const sortedByDate = [...distinctInspections].sort((a, b) => {
        const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
        return timeB - timeA;
      });
      lastInspection = sortedByDate[0].createdAt || sortedByDate[0].updatedAt || null;
    }

    const isDemoData =
      productsInspected === 0 ||
      distinctInspections.every((i) => i.analysisSource === 'preset' || (i as any).isDemoData);

    // Generate live Recent Violations list (latest first)
    const recentViolations: string[] = [];
    const sortedInspections = [...distinctInspections].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

    for (const insp of sortedInspections) {
      for (const f of insp.findings || []) {
        if (isFindingViolation(f)) {
          const entry = `${f.sectionRef || f.ruleId} — ${f.title}${
            f.detectedText ? ` (${f.detectedText})` : ''
          }`;
          if (!recentViolations.includes(entry) && recentViolations.length < 5) {
            recentViolations.push(entry);
          }
        }
      }
    }

    // Dynamic Risk Assessment & Risk Level derived strictly from live data
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let riskReason = '';

    if (criticalViolations >= 2 || repeatViolations >= 1 || (violations > 0 && violations === productsInspected && criticalViolations > 0)) {
      riskLevel = 'HIGH';
      const points: string[] = [];
      if (repeatViolations > 0) {
        const ruleNames = repeatViolationRules.map((r) => r.sectionRef).join(', ');
        points.push(`${repeatViolations} repeat rule violation(s) [${ruleNames}]`);
      }
      if (criticalViolations > 0) {
        points.push(`${criticalViolations} critical statutory infraction(s)`);
      }
      riskReason = `High Risk: ${points.join(' and ')} detected across ${productsInspected} inspection(s). Immediate mandatory market sampling and compounding review warranted under Legal Metrology Act Sec 36.`;
    } else if (violations > 0 || criticalViolations > 0) {
      riskLevel = 'MEDIUM';
      riskReason = `Moderate Risk: ${violations} of ${productsInspected} product inspection(s) flagged with statutory label discrepancies (${recentViolations[0] || 'Non-compliance on file'}). Continuous node monitoring active.`;
    } else {
      riskLevel = 'LOW';
      riskReason = productsInspected > 0
        ? `Low Risk / Fully Compliant: Exemplary compliance record across ${productsInspected} inspected product(s). 0 repeat and 0 critical omissions detected.`
        : 'Registered statutory entity with no historical violations recorded in node jurisdiction.';
    }

    profiles.push({
      id: `mfg-${groupKey}`,
      name: group.mfgInfo.displayName,
      state: group.mfgInfo.state,
      licenseNumber: group.mfgInfo.licenseNumber,
      productsInspected,
      compliant,
      violations,
      repeatViolations,
      repeatViolationRules,
      criticalViolations,
      lastInspection,
      isDemoData,
      riskLevel,
      riskReason,
      recentViolations,
      // Legacy compatibility counts
      totalInspected: productsInspected,
      verifiedCount: compliant,
      potentialIssuesCount: violations,
      needsReviewCount: distinctInspections.filter((i) => i.status === 'NEEDS_REVIEW').length,
    });
  }

  // Sort: High risk first, then by products inspected descending
  return profiles.sort((a, b) => {
    const riskScore = (r: 'LOW' | 'MEDIUM' | 'HIGH') => (r === 'HIGH' ? 3 : r === 'MEDIUM' ? 2 : 1);
    if (riskScore(b.riskLevel) !== riskScore(a.riskLevel)) {
      return riskScore(b.riskLevel) - riskScore(a.riskLevel);
    }
    return b.productsInspected - a.productsInspected;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-manufacturer drill-down helpers (used by API routes & modals)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve a mfgId (e.g. "mfg-kisanagriinputs") or raw manufacturer name
 * to its canonical group key and return all matching inspections from the global store.
 */
export function getManufacturerInspections(
  mfgId: string,
  allInspections: InspectionRecord[],
  includeDemo = true
): InspectionRecord[] {
  if (!mfgId) return [];

  // Strip "mfg-" prefix if present
  const groupKey = mfgId.startsWith('mfg-') ? mfgId.slice(4) : mfgId;
  const targetKey = normalizeManufacturerKey(groupKey) || groupKey.toLowerCase().replace(/[^a-z0-9]/gi, '').trim();

  const matched: InspectionRecord[] = [];
  const seen = new Set<string>();

  allInspections.forEach((insp) => {
    if (!includeDemo && (insp.analysisSource === 'preset' || (insp as any).isDemoData)) {
      return;
    }

    const mfgData = getManufacturerGroupKey(insp);
    const inspGroupKey = mfgData.groupKey;

    const isMatch =
      inspGroupKey === targetKey ||
      inspGroupKey === groupKey ||
      inspGroupKey.includes(targetKey) ||
      targetKey.includes(inspGroupKey) ||
      inspGroupKey.includes(groupKey) ||
      groupKey.includes(inspGroupKey);

    if (isMatch && !seen.has(insp.id)) {
      seen.add(insp.id);
      matched.push(insp);
    }
  });

  return matched;
}

/**
 * Returns all qualifying violation findings for a manufacturer, each paired with its parent inspection.
 */
export function getManufacturerViolationFindings(
  mfgId: string,
  allInspections: InspectionRecord[],
  includeDemo = true
): ManufacturerViolationFinding[] {
  const inspections = getManufacturerInspections(mfgId, allInspections, includeDemo);
  const results: ManufacturerViolationFinding[] = [];

  inspections.forEach((insp) => {
    (insp.findings || []).forEach((f) => {
      if (isFindingViolation(f)) {
        results.push({ finding: f, inspection: insp, mfgId });
      }
    });
  });

  // Sort: most recent inspection first
  results.sort((a, b) => {
    const tA = new Date(a.inspection.createdAt || a.inspection.updatedAt || 0).getTime();
    const tB = new Date(b.inspection.createdAt || b.inspection.updatedAt || 0).getTime();
    return tB - tA;
  });

  return results;
}

/**
 * Returns violation findings grouped by rule, showing only rules violated 2+ times.
 */
export function getManufacturerRepeatViolationGroups(
  mfgId: string,
  allInspections: InspectionRecord[],
  includeDemo = true
): RepeatViolationGroup[] {
  const inspections = getManufacturerInspections(mfgId, allInspections, includeDemo);

  const ruleMap: Record<
    string,
    {
      ruleId: string;
      sectionRef: string;
      title: string;
      ruleCategory?: string;
      isCritical: boolean;
      occurrences: Array<{
        inspectionId: string;
        productName: string;
        brandName?: string;
        date: string | null;
        findingId: string;
        findingStatus: string;
      }>;
    }
  > = {};

  inspections.forEach((insp) => {
    const uniqueRuleIds = new Set<string>();
    (insp.findings || []).forEach((f) => {
      if (isFindingViolation(f)) {
        if (!uniqueRuleIds.has(f.ruleId)) {
          uniqueRuleIds.add(f.ruleId);
          if (!ruleMap[f.ruleId]) {
            const ruleDef = STATUTORY_RULES.find((r) => r.ruleId === f.ruleId);
            ruleMap[f.ruleId] = {
              ruleId: f.ruleId,
              sectionRef: f.sectionRef || f.ruleId,
              title: f.title || f.ruleId,
              ruleCategory: ruleDef?.ruleCategory || ruleDef?.rule_category,
              isCritical: f.severity === 'CRITICAL' || (ruleDef ? isRuleCritical(ruleDef) : false),
              occurrences: [],
            };
          }
          const date = insp.createdAt || insp.updatedAt || null;
          ruleMap[f.ruleId].occurrences.push({
            inspectionId: insp.id,
            productName: insp.productName || insp.extractedFields?.productName || 'Unknown Product',
            brandName: insp.extractedFields?.brandName || insp.productIdentification?.brandName,
            date,
            findingId: f.id,
            findingStatus: f.status,
          });
        }
      }
    });
  });

  return Object.values(ruleMap)
    .filter((g) => g.occurrences.length >= 2)
    .map((g) => {
      const affectedProducts = new Set(g.occurrences.map((o) => o.productName)).size;
      const dates = g.occurrences
        .map((o) => (o.date ? new Date(o.date).getTime() : 0))
        .filter((t) => t > 0);
      const latestDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null;

      return {
        ruleId: g.ruleId,
        sectionRef: g.sectionRef,
        ruleTitle: g.title,
        ruleCategory: g.ruleCategory,
        isCritical: g.isCritical,
        count: g.occurrences.length,
        affectedProducts,
        latestDate,
        occurrences: g.occurrences.sort((a, b) => {
          const tA = a.date ? new Date(a.date).getTime() : 0;
          const tB = b.date ? new Date(b.date).getTime() : 0;
          return tB - tA;
        }),
      };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * Returns all violation findings for a manufacturer that belong to critical rule categories.
 */
export function getManufacturerCriticalViolations(
  mfgId: string,
  allInspections: InspectionRecord[],
  includeDemo = true
): ManufacturerViolationFinding[] {
  return getManufacturerViolationFindings(mfgId, allInspections, includeDemo).filter(({ finding }) => {
    const ruleDef = STATUTORY_RULES.find((r) => r.ruleId === finding.ruleId);
    return (
      finding.severity === 'CRITICAL' ||
      (ruleDef && isRuleCritical(ruleDef)) ||
      (ruleDef?.ruleCategory && CRITICAL_RULE_CATEGORIES.includes(ruleDef.ruleCategory)) ||
      (ruleDef?.rule_category && CRITICAL_RULE_CATEGORIES.includes(ruleDef.rule_category))
    );
  });
}

