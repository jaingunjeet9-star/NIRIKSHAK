/**
 * NIRIKSHAK — Compliance Report DOCX Generator
 *
 * Generates a fully editable Microsoft Word (.docx) document from an InspectionRecord.
 * Text, tables, headings and inspector remarks all remain natively editable.
 * Compatible with Microsoft Word and uploadable / openable in Google Docs.
 *
 * This DOCX is the COMPLIANCE REPORT workflow ONLY.
 * Manufacturer Memo/Notice uses a separate immutable PDF (noticePdfExport.ts).
 */
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  TableLayoutType,
  PageOrientation,
  PageSize,
  Indent,
  convertInchesToTwip,
  VerticalAlign,
} from 'docx';
import { InspectionRecord } from '../types';
import { saveAs } from '../lib/fileSaver';

// ─── Helpers ────────────────────────────────────────────────────────────────

function bold(text: string, size = 20): TextRun {
  return new TextRun({ text, bold: true, size, font: 'Calibri' });
}

function normal(text: string, size = 20): TextRun {
  return new TextRun({ text, size, font: 'Calibri' });
}

function italic(text: string, size = 20): TextRun {
  return new TextRun({ text, italics: true, size, font: 'Calibri' });
}

function para(children: TextRun[], spacing_after = 100): Paragraph {
  return new Paragraph({ children, spacing: { after: spacing_after } });
}

function heading1(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { after: 80, before: 200 },
  });
}

function emptyPara(): Paragraph {
  return new Paragraph({ children: [new TextRun('')], spacing: { after: 80 } });
}

function thinBorder() {
  return { style: BorderStyle.SINGLE, size: 6, color: '999999' };
}

function headerCell(text: string, width?: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [bold(text, 18)],
        spacing: { after: 60 },
      }),
    ],
    shading: { type: ShadingType.SOLID, color: 'D9E2DC' },
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
  });
}

function dataCell(text: string, colspan?: number, isRed = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 18, font: 'Calibri', color: isRed ? '9E432A' : '2D322E' })],
        spacing: { after: 60 },
      }),
    ],
    columnSpan: colspan,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
  });
}

function labelValueRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        children: [para([bold(label + ':', 18)])],
        width: { size: 3000, type: WidthType.DXA },
        shading: { type: ShadingType.SOLID, color: 'F5F3EE' },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
      }),
      new TableCell({
        children: [para([normal(value || '—', 18)])],
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
      }),
    ],
  });
}

function blankSignatureLine(label: string): Paragraph {
  return new Paragraph({
    children: [
      bold(label + ': ', 18),
      new TextRun({ text: '_'.repeat(50), size: 18, font: 'Calibri' }),
    ],
    spacing: { after: 160 },
  });
}

// ─── Main Export ────────────────────────────────────────────────────────────

export async function exportComplianceReportToDocx(inspection: InspectionRecord): Promise<void> {
  const ef = inspection.extractedFields;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const inspDate = new Date(inspection.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const inspTime = new Date(inspection.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  const violations = inspection.findings.filter(
    (f) => f.status === 'VIOLATION' || f.status === 'POTENTIAL_ISSUE'
  );
  const notDetected = inspection.findings.filter((f) => f.status === 'NOT_DETECTED');
  const verified = inspection.findings.filter((f) => f.status === 'VERIFIED');

  const overallStatus =
    violations.length > 0
      ? 'NON-COMPLIANT — VIOLATIONS DETECTED'
      : inspection.summaryCounts.requiresReview > 0
      ? 'UNDER REVIEW'
      : 'COMPLIANT';

  // ── Section 1: Header / Title ──────────────────────────────────────────────
  const titleSection: Paragraph[] = [
    new Paragraph({
      children: [bold('NIRIKSHAK', 28)],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [normal('STATUTORY INSPECTION / COMPLIANCE SYSTEM', 20)],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [italic('Government of India · Ministry of Consumer Affairs, Food & Public Distribution', 18)],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [bold('COMPLIANCE INSPECTION REPORT', 26)],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [italic('Legal Metrology (Packaged Commodities) Rules 2011 and applicable statutes', 18)],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
  ];

  // ── Section 2: Document Metadata ──────────────────────────────────────────
  const metaSection: (Paragraph | Table)[] = [
    heading2('DOCUMENT INFORMATION'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        new TableRow({
          children: [
            headerCell('Inspection ID'),
            dataCell(inspection.id),
            headerCell('Report Generated'),
            dataCell(dateStr),
          ],
        }),
        new TableRow({
          children: [
            headerCell('Inspection Date / Time'),
            dataCell(`${inspDate} at ${inspTime}`),
            headerCell('Status'),
            dataCell(overallStatus, undefined, violations.length > 0),
          ],
        }),
        new TableRow({
          children: [
            headerCell('Inspector'),
            dataCell(inspection.inspectorName || 'Field Officer'),
            headerCell('Station / Node'),
            dataCell(inspection.stationNode || 'NIC-METROLOGY-NODE: #DELHI-WEST-04'),
          ],
        }),
        new TableRow({
          children: [
            headerCell('Batch Reference'),
            dataCell(inspection.batchReference || '—'),
            headerCell('Completeness Score'),
            dataCell(`${inspection.completenessScore} / 100`),
          ],
        }),
      ],
    }),
  ];

  // ── Section 3: Product & Manufacturer ────────────────────────────────────
  const productSection: (Paragraph | Table)[] = [
    heading2('1. PRODUCT & MANUFACTURER / MARKETER DETAILS'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [
        labelValueRow('Product Name', inspection.productName || '—'),
        labelValueRow('Brand Name', ef.brandName || ef.productName || '—'),
        labelValueRow('Category', inspection.category?.replace(/_/g, ' ') || '—'),
        labelValueRow('Net Quantity', ef.netQuantity || '—'),
        labelValueRow('MRP (Declared)', ef.mrp || '—'),
        labelValueRow('Tax Declaration', ef.taxDeclaration || '—'),
        labelValueRow('Manufacturer / Packer', ef.manufacturerName || ef.packerName || '—'),
        labelValueRow('Manufacturer Address', ef.manufacturerAddress || ef.packerAddress || '—'),
        labelValueRow('Importer', ef.importerName || '—'),
        labelValueRow('Country of Origin', ef.countryOfOrigin || '—'),
        labelValueRow('FSSAI License', ef.fssaiLicenseNumber || '—'),
        labelValueRow('Cosmetic Mfg License', ef.cosmeticMfgLicense || '—'),
        labelValueRow('Drug License', ef.drugLicenseNumber || '—'),
        labelValueRow('Batch / Lot No.', ef.batchNumber || ef.lotNumber || '—'),
        labelValueRow('Manufacturing Date', ef.mfgMonthYear || ef.packingDate || '—'),
        labelValueRow('Expiry / Use Before', ef.expiryDate || ef.useBeforeDate || '—'),
        labelValueRow('Consumer Care Contact', [ef.consumerCarePhone, ef.consumerCareEmail, ef.consumerCareName].filter(Boolean).join(' · ') || '—'),
        labelValueRow('Consumer Care Address', ef.consumerCareAddress || '—'),
      ],
    }),
  ];

  // ── Section 4: Compliance Findings Table ─────────────────────────────────
  const findingsRows = inspection.findings.map((f) => {
    const statusColor =
      f.status === 'VERIFIED' ? '335E46' :
      f.status === 'VIOLATION' || f.status === 'POTENTIAL_ISSUE' ? '9E432A' : '8C5E2D';

    return new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({ children: [bold(f.sectionRef || f.ruleId, 16)], spacing: { after: 40 } }),
            new Paragraph({ children: [normal(f.title, 16)], spacing: { after: 40 } }),
            new Paragraph({ children: [italic(f.actName || '', 15)], spacing: { after: 0 } }),
          ],
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: f.detectedText || 'Not detected on package', size: 16, font: 'Calibri', color: f.detectedText ? '2D322E' : '9E432A', italics: !f.detectedText })], spacing: { after: 0 } })],
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }),
        new TableCell({
          children: [new Paragraph({ children: [normal(f.statutoryStandardText || '—', 16)], spacing: { after: 0 } })],
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: f.status, size: 16, bold: true, font: 'Calibri', color: statusColor })], spacing: { after: 0 } })],
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          shading: {
            type: ShadingType.SOLID,
            color: f.status === 'VERIFIED' ? 'EBF3EE' : f.status === 'VIOLATION' || f.status === 'POTENTIAL_ISSUE' ? 'FAECE7' : 'FBF3E8',
          },
        }),
      ],
    });
  });

  const findingsSection: (Paragraph | Table)[] = [
    heading2(`2. COMPLIANCE RULE EVALUATION MATRIX (${inspection.findings.length} rules examined)`),
    new Paragraph({
      children: [
        new TextRun({ text: `Verified: ${verified.length}  ·  Violations / Issues: ${violations.length}  ·  Not Detected: ${notDetected.length}  ·  Under Review: ${inspection.summaryCounts.requiresReview}`, size: 18, font: 'Calibri', bold: true }),
      ],
      spacing: { after: 120 },
    }),
    ...(inspection.findings.length === 0
      ? [para([normal('No compliance findings recorded for this inspection.')])]
      : [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  headerCell('Statutory Rule / Section', 2200),
                  headerCell('Detected / Observed', 2200),
                  headerCell('Required Standard', 3000),
                  headerCell('Status', 1200),
                ],
              }),
              ...findingsRows,
            ],
          }),
        ]),
  ];

  // ── Section 5: Violations Detail ─────────────────────────────────────────
  const violationDetailSection: (Paragraph | Table)[] = violations.length > 0
    ? [
        heading2(`3. IDENTIFIED VIOLATIONS / NON-COMPLIANCES (${violations.length})`),
        ...violations.flatMap((v, i) => [
          para([bold(`Issue #${i + 1}: ${v.title.toUpperCase()} [${v.sectionRef}]`, 18)]),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              labelValueRow('Rule / Section', `${v.sectionRef} — ${v.title}`),
              labelValueRow('Governing Act', v.actName || '—'),
              labelValueRow('Severity', v.severity || '—'),
              labelValueRow('Observed on Packaging', v.detectedText || 'Declaration absent from physical package'),
              labelValueRow('Statutory Requirement', v.statutoryStandardText || '—'),
              labelValueRow('Explanation', v.explanation || '—'),
              labelValueRow('Recommended Action', v.recommendedAction || '—'),
              labelValueRow('Evidence', v.evidenceLocation || (v.sourceImageView ? `Package View — ${v.sourceImageView}` : 'Scanned package image')),
            ],
          }),
          emptyPara(),
        ]),
      ]
    : [];

  // ── Section 6: Potential Issues / Not Detected ────────────────────────────
  const potentialIssuesSection: (Paragraph | Table)[] = notDetected.length > 0
    ? [
        heading2(`4. DECLARATIONS NOT DETECTED ON PACKAGE (${notDetected.length})`),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [headerCell('Rule / Section'), headerCell('Mandatory Declaration'), headerCell('Observed')],
            }),
            ...notDetected.map((f) =>
              new TableRow({
                children: [
                  dataCell(`${f.sectionRef} — ${f.title}`),
                  dataCell(f.statutoryStandardText || '—'),
                  dataCell('NOT DETECTED', undefined, true),
                ],
              })
            ),
          ],
        }),
      ]
    : [];

  // ── Section 7: Inspector Remarks (EDITABLE) ───────────────────────────────
  const remarksSection: (Paragraph | Table)[] = [
    heading2('5. INSPECTOR OBSERVATIONS & REMARKS'),
    new Paragraph({
      children: [italic('(Inspector: Please complete the following sections. This area is fully editable.)', 18)],
      spacing: { after: 120 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            headerCell('Field Inspector Notes / Observations (Pre-populated)', 4000),
            new TableCell({
              children: [new Paragraph({ children: [normal(inspection.inspectorNotes || '(Inspector observations to be entered here)', 18)], spacing: { after: 200 } })],
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
            }),
          ],
        }),
        new TableRow({
          children: [
            headerCell('Additional Observations (Editable)', 4000),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: ' ', size: 18 })], spacing: { after: 400 } })],
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
            }),
          ],
        }),
        new TableRow({
          children: [
            headerCell('Review Comments (Editable)', 4000),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: ' ', size: 18 })], spacing: { after: 400 } })],
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
            }),
          ],
        }),
        new TableRow({
          children: [
            headerCell('Corrective Action Notes (Editable)', 4000),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: ' ', size: 18 })], spacing: { after: 400 } })],
              margins: { top: 80, bottom: 80, left: 100, right: 100 },
            }),
          ],
        }),
      ],
    }),
  ];

  // ── Section 8: Signature / Acknowledgement ────────────────────────────────
  const signatureSection: (Paragraph | Table)[] = [
    heading2('6. SIGNATURE / ACKNOWLEDGEMENT'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                para([bold('INSPECTOR SIGNATURE', 18)]),
                emptyPara(),
                para([normal('Name: ' + (inspection.inspectorName || '________________'), 18)]),
                para([normal('Designation: Legal Metrology Inspector', 18)]),
                para([normal('Station: ' + (inspection.stationNode || '________________'), 18)]),
                para([normal('Date: ' + inspDate, 18)]),
                emptyPara(),
                para([italic('Signature: ________________________________', 18)]),
                para([italic('Official Stamp: ____________________________', 18)]),
              ],
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
            }),
            new TableCell({
              children: [
                para([bold('ESTABLISHMENT REPRESENTATIVE', 18)]),
                emptyPara(),
                para([normal('"I hereby acknowledge receipt of this compliance report."', 18)]),
                emptyPara(),
                para([normal('Name: ________________________________', 18)]),
                para([normal('Designation: _________________________', 18)]),
                para([normal('Organization: ________________________', 18)]),
                emptyPara(),
                para([italic('Signature: ________________________________', 18)]),
                para([italic('Date: ____________________________________', 18)]),
              ],
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
            }),
          ],
        }),
      ],
    }),
    emptyPara(),
    new Paragraph({
      children: [
        normal('Inspection Evidence SHA-256 Digest: ', 16),
        bold(inspection.evidenceHash || `${inspection.id}-EVIDENCE-SEAL`, 16),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [italic('This compliance report is generated under the statutory mandate of Section 18 of Legal Metrology Act, 2009. The original scanner result, compliance findings, rules, violations and evidence are immutable source data. The editable sections above are for inspector reporting and review only.', 16)],
      spacing: { after: 80 },
    }),
  ];

  // ── Assemble Document ─────────────────────────────────────────────────────
  const doc = new Document({
    creator: 'NIRIKSHAK Statutory Inspection System',
    title: `Compliance Report — ${inspection.productName} — ${inspection.id}`,
    description: `Statutory compliance inspection report for ${inspection.productName} (${inspection.id})`,
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 20,
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: 'Calibri',
            size: 28,
            bold: true,
            color: '2D322E',
          },
          paragraph: {
            spacing: { after: 120 },
            alignment: AlignmentType.CENTER,
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          run: {
            font: 'Calibri',
            size: 22,
            bold: true,
            color: '335E46',
          },
          paragraph: {
            spacing: { before: 300, after: 120 },
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: [
          ...titleSection,
          ...metaSection,
          emptyPara(),
          ...productSection,
          emptyPara(),
          ...findingsSection,
          emptyPara(),
          ...violationDetailSection,
          ...potentialIssuesSection,
          ...(potentialIssuesSection.length > 0 ? [emptyPara()] : []),
          ...remarksSection,
          emptyPara(),
          ...signatureSection,
        ],
      },
    ],
  });

  // ── Save as .docx blob ─────────────────────────────────────────────────────
  const blob = await Packer.toBlob(doc);
  const cleanName = (inspection.productName || 'Product').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25);
  const cleanDate = now.toISOString().slice(0, 10);
  const fileName = `NIRIKSHAK_CR_${inspection.id}_${cleanName}_${cleanDate}.docx`;
  saveAs(blob, fileName);
}
