import { jsPDF } from 'jspdf';
import { ComplianceDocument } from '../types';

/**
 * NIRIKSHAK — Manufacturer Memo / Notice PDF Generator
 *
 * Generates an IMMUTABLE formal PDF in the structure of the
 * "Form of Seizure Memo" reference document (Legal Metrology Act, 2009 /
 * Packaged Commodities Rules, 2011).
 *
 * Structure:
 *   Page 1 — Memo Header + Sections 1–6
 *   Page 2 — Annexure: Inventory Sheet
 *   Page 3 — Section 7: Signatures & Acknowledgements
 *
 * NOT editable. NOT a DOCX. No text editor / body field.
 * All data populated from real ComplianceDocument records only.
 */
export async function exportNoticeToPDF(documentData: ComplianceDocument): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const PW = doc.internal.pageSize.getWidth();   // 210
  const PH = doc.internal.pageSize.getHeight();  // 297
  const LM = 20;   // left margin
  const RM = 20;   // right margin
  const CW = PW - LM - RM;  // content width
  let y = 15;

  // ─── Formatting helpers ──────────────────────────────────────────────────────
  const blank = (len = 30) => '_'.repeat(len);
  const val = (v?: string | null, fallback = blank()) => (v && v.trim() ? v.trim() : fallback);

  function setH1() { doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(0, 0, 0); }
  function setH2() { doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0, 0, 0); }
  function setBody() { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(20, 20, 20); }
  function setBold(size = 9.5) { doc.setFont('helvetica', 'bold'); doc.setFontSize(size); doc.setTextColor(20, 20, 20); }
  function setSmall() { doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(40, 40, 40); }
  function setItalic() { doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(40, 40, 40); }

  function drawLine(x1: number, x2: number, yy: number, thickness = 0.2) {
    doc.setLineWidth(thickness);
    doc.setDrawColor(0, 0, 0);
    doc.line(x1, yy, x2, yy);
  }

  function needsPage(needed: number) {
    if (y + needed > PH - 15) {
      doc.addPage();
      y = 15;
    }
  }

  // ─── Derived data ────────────────────────────────────────────────────────────
  const now = new Date();
  const dateInspected = documentData.inspectionDate
    ? new Date(documentData.inspectionDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Memo reference from documentData or generate one
  const memoNo = documentData.documentId || `NIR-MEMO-${now.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000)).padStart(6, '0')}`;

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — FORM OF SEIZURE MEMO (Sections 1–6)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Title ────────────────────────────────────────────────────────────────────
  setH1();
  doc.text('FORM OF SEIZURE MEMO', PW / 2, y, { align: 'center' });
  y += 5;
  setItalic();
  doc.setFontSize(8.5);
  doc.text('(Under Section 15 of the Legal Metrology Act, 2009 / Packaged Commodities Rules, 2011)', PW / 2, y, { align: 'center' });
  y += 8;

  // ── Memo No & Date/Time ──────────────────────────────────────────────────────
  setBody();
  setBold(9.5);
  doc.text('MEMO NO:', LM, y);
  setBody();
  doc.text(memoNo, LM + 21, y);
  y += 5;

  setBold(9.5);
  doc.text('DATE OF SEIZURE:', LM, y);
  setBody();
  doc.text(dateInspected, LM + 36, y);
  setBold(9.5);
  doc.text('TIME:', LM + 70, y);
  setBody();
  doc.text(timeStr + ' AM / PM', LM + 84, y);
  y += 8;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — DETAILS OF THE INSPECTING OFFICER
  // ═══════════════════════════════════════════════════════════════════════════
  setH2();
  doc.text('1. DETAILS OF THE INSPECTING OFFICER', LM, y);
  y += 5;

  setBody();
  // Name of Inspector
  setBold(9.5);
  doc.text('Name of the Inspector:', LM, y);
  setBody();
  const inspectorName = val(documentData.inspectorName, blank(35));
  doc.text(inspectorName, LM + 43, y);

  setBold(9.5);
  doc.text('Designation:', LM + 105, y);
  setBody();
  doc.text('Legal Metrology Officer (LMO)', LM + 124, y);
  y += 6;

  setBold(9.5);
  doc.text('Jurisdiction / Zone:', LM, y);
  setBody();
  doc.text(blank(35), LM + 40, y);

  setBold(9.5);
  doc.text('State/UT Department:', LM + 105, y);
  setBody();
  doc.text(blank(28), LM + 145, y);
  y += 9;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — DETAILS OF THE ESTABLISHMENT / ACCUSED
  // ═══════════════════════════════════════════════════════════════════════════
  setH2();
  doc.text('2. DETAILS OF THE ESTABLISHMENT / ACCUSED', LM, y);
  y += 5;

  setBody();
  setBold(9.5);
  doc.text('Name of Establishment / Firm:', LM, y);
  setBody();
  const mfgName = val(documentData.manufacturerName, blank(50));
  // Wrap if long
  const mfgNameLines = doc.splitTextToSize(mfgName, CW - 63);
  doc.text(mfgNameLines[0], LM + 63, y);
  y += 6;

  setBold(9.5);
  doc.text('Address of Establishment:', LM, y);
  setBody();
  const mfgAddr = val(documentData.manufacturerAddress, blank(60));
  const addrLines = doc.splitTextToSize(mfgAddr, CW - 55);
  doc.text(addrLines[0] || blank(60), LM + 55, y);
  y += 6;

  setBold(9.5);
  doc.text('Name of Proprietor / Owner / Accused:', LM, y);
  setBody();
  doc.text(blank(40), LM + 79, y);
  y += 6;

  setBold(9.5);
  doc.text('Nature of Business:', LM, y);
  setBody();
  doc.text('Packaged Commodity Manufacturer / Marketer', LM + 41, y);
  setBold(9.5);
  doc.text('Trade License / Packer Reg No:', LM + 115, y);
  setBody();
  doc.text(blank(18), LM + 163, y);
  y += 9;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — PARTICULARS OF SEIZED ARTICLES / GOODS
  // ═══════════════════════════════════════════════════════════════════════════
  setH2();
  doc.text('3. PARTICULARS OF SEIZED ARTICLES / GOODS', LM, y);
  y += 4;
  setSmall();
  setItalic();
  doc.text('The following pre-packaged commodities have been taken into physical custody due to prima facie violations:', LM, y);
  y += 5;

  // Draw table for seized articles
  const tableTop = y;
  const cols = [10, 52, 22, 26, 22, 22, 16]; // widths for each column
  // Col headers
  const headers = ['S.No.', 'Product Description & Brand', 'Batch/Lot', 'Declared Net Qty', 'MRP (₹)', 'Qty Seized', 'Specific Violation Identified'];
  const colXs: number[] = [];
  let cx = LM;
  for (const w of cols) { colXs.push(cx); cx += w; }
  // Special: last col takes remaining
  const lastColX = colXs[colXs.length - 1];
  const lastColW = LM + CW - lastColX;

  // Header row
  const headerH = 8;
  doc.setFillColor(230, 230, 230);
  doc.rect(LM, y, CW, headerH, 'F');
  doc.setDrawColor(0);
  doc.rect(LM, y, CW, headerH);

  setBold(7.5);
  doc.setTextColor(0, 0, 0);
  for (let i = 0; i < headers.length; i++) {
    const xPos = i < 6 ? colXs[i] + 1 : lastColX + 1;
    const wAvail = i < 5 ? cols[i] - 2 : (i === 5 ? cols[i] - 2 : lastColW - 2);
    const hLines = doc.splitTextToSize(headers[i], wAvail);
    // center vertically in header
    const lineH = 3.2;
    const startY = y + (headerH - hLines.length * lineH) / 2 + 2.5;
    doc.text(hLines, xPos, startY);
  }

  // Draw vertical lines for header
  for (let i = 1; i < 6; i++) {
    doc.setLineWidth(0.2);
    doc.line(colXs[i], y, colXs[i], y + headerH);
  }
  doc.line(lastColX, y, lastColX, y + headerH);

  y += headerH;

  // Data rows — populate row 1 from the violation, rows 2–4 empty
  const rowH = 14;
  const violations = [
    {
      sNo: '1',
      product: documentData.productName + (documentData.brandName ? ` — ${documentData.brandName}` : ''),
      batch: documentData.batchReference || '',
      netQty: documentData.netQuantity || '',
      mrp: documentData.mrp || '',
      qtySzd: '',
      violation: documentData.ruleTitle ? `${documentData.sectionRef}: ${documentData.ruleTitle}` : '',
    },
    { sNo: '2', product: '', batch: '', netQty: '', mrp: '', qtySzd: '', violation: '' },
    { sNo: '3', product: '', batch: '', netQty: '', mrp: '', qtySzd: '', violation: '' },
    { sNo: '4', product: '', batch: '', netQty: '', mrp: '', qtySzd: '', violation: '' },
  ];

  setSmall();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  for (const row of violations) {
    doc.setDrawColor(0);
    doc.rect(LM, y, CW, rowH);
    for (let i = 1; i < 6; i++) {
      doc.line(colXs[i], y, colXs[i], y + rowH);
    }
    doc.line(lastColX, y, lastColX, y + rowH);

    // Row content
    doc.setTextColor(20, 20, 20);
    doc.text(row.sNo, colXs[0] + 2, y + 5);

    if (row.product) {
      const pLines = doc.splitTextToSize(row.product, cols[1] - 3);
      doc.text(pLines.slice(0, 2), colXs[1] + 1, y + 4);
    }
    if (row.batch) doc.text(doc.splitTextToSize(row.batch, cols[2] - 2)[0] || '', colXs[2] + 1, y + 5);
    if (row.netQty) doc.text(row.netQty, colXs[3] + 1, y + 5);
    if (row.mrp) doc.text(row.mrp, colXs[4] + 1, y + 5);
    if (row.violation) {
      const vLines = doc.splitTextToSize(row.violation, lastColW - 3);
      doc.text(vLines.slice(0, 2), lastColX + 1, y + 4);
    }
    y += rowH;
  }
  y += 6;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — BOOKS OF ACCOUNTS / DOCUMENTS SEIZED
  // ═══════════════════════════════════════════════════════════════════════════
  needsPage(30);
  setH2();
  doc.text('4. BOOKS OF ACCOUNTS / DOCUMENTS SEIZED (If any)', LM, y);
  y += 5;
  setBody();
  doc.text('1. ' + blank(65), LM, y);
  y += 6;
  doc.text('2. ' + blank(65), LM, y);
  y += 9;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — GROUNDS / REASONS FOR SEIZURE
  // ═══════════════════════════════════════════════════════════════════════════
  needsPage(30);
  setH2();
  doc.text('5. GROUNDS / REASONS FOR SEIZURE', LM, y);
  y += 5;
  setSmall();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Use actual explanation from violation finding (no invented text)
  let groundsText = '';
  if (documentData.groundsForAction) {
    groundsText = documentData.groundsForAction;
  } else if (documentData.explanation) {
    groundsText = documentData.explanation;
  } else if (documentData.ruleTitle && documentData.sectionRef) {
    groundsText = `The packaged commodity "${documentData.productName}" was found to be in contravention of ${documentData.sectionRef} (${documentData.ruleTitle}) as identified during statutory inspection under inspection reference ${documentData.inspectionId}. The specific non-compliance observed: ${documentData.detectedText ? `"${documentData.detectedText}"` : '[To be completed by authorized inspector]'}.`;
  } else {
    groundsText = `The pre-packaged commodities listed above were found to be in prima facie violation of applicable provisions of Legal Metrology Act, 2009 / Packaged Commodities Rules, 2011. Specific grounds to be documented by the authorized Inspecting Officer.`;
  }

  const groundsLines = doc.splitTextToSize(groundsText, CW);
  doc.text(groundsLines, LM, y);
  y += groundsLines.length * 4.5 + 6;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6 — CUSTODY OF SEIZED MATERIAL
  // ═══════════════════════════════════════════════════════════════════════════
  needsPage(30);
  setH2();
  doc.text('6. CUSTODY OF SEIZED MATERIAL', LM, y);
  y += 5;
  setSmall();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const custodyLines = [
    '[ ] The seized goods have been packed, sealed with the official seal, and taken to the departmental safe custody room.',
    '[ ] The seized goods are bulky/perishable and have been handed over to the Store Manager under a strict Supratnama (Indemnity Bond).',
  ];
  for (const line of custodyLines) {
    const wrapped = doc.splitTextToSize(line, CW);
    doc.text(wrapped, LM, y);
    y += wrapped.length * 4.5 + 2;
  }
  y += 4;

  // ── Page 1 footer ─────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `NIRIKSHAK Statutory Verification System  •  Document Ref: ${memoNo}  •  Inspection: ${documentData.inspectionId}`,
    PW / 2, PH - 8, { align: 'center' }
  );
  drawLine(LM, PW - RM, PH - 10, 0.3);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 2 — ANNEXURE: INVENTORY SHEET
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = 15;

  setH1();
  doc.text('ANNEXURE - INVENTORY SHEET', PW / 2, y, { align: 'center' });
  y += 5;
  setItalic();
  doc.setFontSize(9);
  doc.text('(Continuation Sheet to Section 3 - Particulars of Seized Articles / Goods)', PW / 2, y, { align: 'center' });
  y += 8;

  setSmall();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Memo No:', LM, y);
  doc.setFont('helvetica', 'normal');
  doc.text(memoNo, LM + 19, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Continuation Page:', PW - RM - 50, y);
  doc.setFont('helvetica', 'normal');
  doc.text(blank(15), PW - RM - 22, y);
  y += 6;

  setItalic();
  doc.setFontSize(8.5);
  doc.text('Use additional copies of this blank sheet as required for recording further seized articles.', LM, y);
  y += 4;
  doc.text('Each copy forms part of the inventory attached to the Seizure Memo referenced above.', LM, y);
  y += 8;

  // Annexure table (same columns, no pre-filled data except first row)
  const annexCols = [52, 26, 26, 22, 26, 18]; // widths
  const annexHeaders = ['Product Description & Brand', 'Batch / Lot', 'Declared Net Qty', 'MRP (₹)', 'Seized Qty', 'Specific Violation Identified'];
  const annexXs: number[] = [];
  let ax = LM;
  for (const w of annexCols) { annexXs.push(ax); ax += w; }
  const annexLastX = annexXs[annexXs.length - 1];
  const annexLastW = LM + CW - annexLastX;
  const annexTotalW = CW;

  // Header
  const annexHeaderH = 9;
  doc.setFillColor(230, 230, 230);
  doc.rect(LM, y, annexTotalW, annexHeaderH, 'F');
  doc.rect(LM, y, annexTotalW, annexHeaderH);
  setBold(8);
  for (let i = 0; i < annexHeaders.length; i++) {
    const xp = annexXs[i] + 1;
    const wa = i < annexCols.length - 1 ? annexCols[i] - 2 : annexLastW - 2;
    const hl = doc.splitTextToSize(annexHeaders[i], wa);
    const lineH = 3.0;
    const sy = y + (annexHeaderH - hl.length * lineH) / 2 + 2.5;
    doc.text(hl, xp, sy);
  }
  for (let i = 1; i < annexHeaders.length; i++) {
    doc.line(annexXs[i], y, annexXs[i], y + annexHeaderH);
  }
  y += annexHeaderH;

  // 10 blank data rows
  const annexRowH = 18;
  for (let i = 0; i < 10; i++) {
    doc.setDrawColor(0);
    doc.rect(LM, y, annexTotalW, annexRowH);
    for (let j = 1; j < annexHeaders.length; j++) {
      doc.line(annexXs[j], y, annexXs[j], y + annexRowH);
    }
    y += annexRowH;
  }
  y += 8;

  // Certification block
  setH2();
  doc.text('CERTIFICATION OF CONTINUATION SHEET', LM, y);
  y += 5;
  setSmall();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text("We/I certify that the above is a true and correct continuation of the inventory of goods seized", LM, y);
  y += 4.5;
  doc.text("under the Seizure Memo referenced above.", LM, y);
  y += 9;

  // Witness & Inspector row
  drawLine(LM, PW - RM, y, 0.5);
  y += 4;
  setBold(9.5);
  doc.text('WITNESS 1', LM, y);
  setBody();
  doc.text('Name: ' + blank(20) + '    Signature: ' + blank(15), LM + 22, y);
  setBold(9.5);
  doc.text('WITNESS 2', PW / 2, y);
  setBody();
  doc.text('Name: ' + blank(15) + '    Signature: ' + blank(10), PW / 2 + 22, y);
  y += 7;

  setBold(9.5);
  doc.text('INSPECTING OFFICER', LM, y);
  setBody();
  doc.text(
    'Name: ' + blank(20) + '    Signature: ' + blank(15) + '    Date: ' + blank(10) + '    Stamp: ' + blank(10),
    LM + 43, y
  );

  // Page 2 footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `NIRIKSHAK  •  Annexure — Inventory Sheet  •  Ref: ${memoNo}`,
    PW / 2, PH - 8, { align: 'center' }
  );
  drawLine(LM, PW - RM, PH - 10, 0.3);

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 3 — SECTION 7: SIGNATURES & ACKNOWLEDGEMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = 15;

  setH2();
  doc.text('7. SIGNATURES & ACKNOWLEDGEMENTS', LM, y);
  y += 5;

  // Three-column table: A. Witness Details | B. Acknowledgement of Dealer | C. Inspecting Officer
  const sigColW = CW / 3;
  const sigTableH = 75;

  // Draw outer border
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.rect(LM, y, CW, sigTableH);

  // Vertical dividers
  doc.line(LM + sigColW, y, LM + sigColW, y + sigTableH);
  doc.line(LM + sigColW * 2, y, LM + sigColW * 2, y + sigTableH);

  // Column A header
  const colAx = LM + 2;
  const colBx = LM + sigColW + 2;
  const colCx = LM + sigColW * 2 + 2;
  const sigInner = sigColW - 4;

  setBold(8.5);
  doc.text('A. WITNESS DETAILS (Min.', colAx, y + 4.5);
  doc.text('2 Required)', colAx, y + 8.5);

  setBold(8.5);
  doc.text('B. ACKNOWLEDGEMENT', colBx, y + 4.5);
  doc.text('OF DEALER', colBx, y + 8.5);

  setBold(8.5);
  doc.text('C. INSPECTING OFFICER', colCx, y + 4.5);

  // Horizontal line after headers
  drawLine(LM, LM + CW, y + 11, 0.4);

  // Column A content
  let ay = y + 15;
  setBody();
  doc.setFontSize(9);
  doc.text('1. Signature:', colAx, ay); ay += 5;
  drawLine(colAx, colAx + sigInner, ay); ay += 5;
  doc.text('Name: ' + blank(20), colAx, ay); ay += 5;
  doc.text('Address: ' + blank(15), colAx, ay); ay += 7;
  doc.text('2. Signature:', colAx, ay); ay += 5;
  drawLine(colAx, colAx + sigInner, ay); ay += 5;
  doc.text('Name: ' + blank(20), colAx, ay); ay += 5;
  doc.text('Address: ' + blank(15), colAx, ay);

  // Column B content
  let by = y + 15;
  setItalic();
  doc.setFontSize(9);
  const ackText = '"I hereby acknowledge that a copy of this seizure memo has been handed over to me on the spot, and facts are true."';
  const ackLines = doc.splitTextToSize(ackText, sigInner);
  doc.text(ackLines, colBx, by);
  by += ackLines.length * 4.2 + 5;
  setBody();
  doc.text('Signature:', colBx, by); by += 5;
  drawLine(colBx, colBx + sigInner - 5, by); by += 5;
  doc.text('Name: ' + blank(18), colBx, by); by += 5;
  doc.text('Designation:', colBx, by); by += 5;
  drawLine(colBx, colBx + sigInner - 5, by); by += 5;
  doc.text('Stamp:', colBx, by);

  // Column C content
  let cy = y + 15;
  setBody();
  doc.text('Signature:', colCx, cy); cy += 5;
  drawLine(colCx, colCx + sigInner - 5, cy); cy += 5;
  doc.text('Name: ' + blank(18), colCx, cy); cy += 5;
  doc.text('Designation: LMO / Inspector', colCx, cy); cy += 7;
  doc.text('Official Stamp:', colCx, cy);

  y += sigTableH + 12;

  // ── Verification seal ─────────────────────────────────────────────────────
  setSmall();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Document ID: ${memoNo}  |  Inspection: ${documentData.inspectionId}  |  Violation Finding: ${documentData.violationFindingId}`,
    PW / 2, y, { align: 'center' }
  );
  y += 5;
  doc.text(
    `Generated by: NIRIKSHAK Statutory Inspection System  |  Evidence Hash: ${documentData.documentId}-SEAL-${btoa(documentData.inspectionId).slice(0, 12).toUpperCase()}`,
    PW / 2, y, { align: 'center' }
  );
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const footNote = 'This document is generated directly from verified statutory inspection records under Legal Metrology Act, 2009. ' +
    'It is not a court summons. All factual data has been sourced from the live inspection record. ' +
    'Fields marked with blank lines are to be completed by the authorized Inspecting Officer at the time of issuance.';
  const fnLines = doc.splitTextToSize(footNote, CW);
  doc.text(fnLines, LM, y);

  // Page 3 footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `NIRIKSHAK  •  Section 7 — Signatures & Acknowledgements  •  Ref: ${memoNo}`,
    PW / 2, PH - 8, { align: 'center' }
  );
  drawLine(LM, PW - RM, PH - 10, 0.3);

  // ─── Save ──────────────────────────────────────────────────────────────────
  const sanitizedMfg = (documentData.manufacturerName || 'Manufacturer')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 30);
  const sanitizedMemo = memoNo.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `NIRIKSHAK_Memo_${sanitizedMemo}_${sanitizedMfg}.pdf`;
  doc.save(fileName);
}
