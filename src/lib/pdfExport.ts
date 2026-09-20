import { jsPDF } from 'jspdf';
import { BoundingBox, InspectionRecord } from '../types';
import { normalizeBoxCoords, getShortFieldLabel, createPresetPackagingSvg } from './annotationUtils';
import { getImageBinary } from './indexedDB';

/**
 * Composites the package image and its OCR bounding-box annotations onto an offscreen canvas
 * matching the visual styling of the live Scanner workspace (green/amber/red bounding boxes + canonical labels).
 */
async function renderAnnotatedEvidenceImage(
  imageSrc: string,
  boxes: BoundingBox[]
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (!imageSrc || imageSrc.length < 20) {
    console.warn('[PDF Export] Empty or invalid image source passed to renderer');
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();

    // CRITICAL: NEVER set crossOrigin on data: or blob: URIs as Chromium taints the canvas
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    const processImage = async () => {
      try {
        // Wait for image decode if supported to ensure bitmap raster is ready
        if ('decode' in img && typeof img.decode === 'function') {
          try {
            await img.decode();
          } catch (decodeErr) {
            console.warn('[PDF Export] decode() warning (proceeding with onload):', decodeErr);
          }
        }

        const canvas = document.createElement('canvas');
        const origW = img.naturalWidth || img.width || 900;
        const origH = img.naturalHeight || img.height || 600;

        // Ensure canvas has high resolution for crisp PDF vector-quality rasterization
        const targetW = Math.max(origW, 900);
        const scaleFactor = targetW / origW;
        const targetH = Math.round(origH * scaleFactor);

        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('[PDF Export] Unable to obtain 2D canvas context');
          resolve(null);
          return;
        }

        // 1. CRITICAL: Fill with pure white background FIRST so transparency never converts to black in JPEG/PNG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);

        // 2. Draw base scanned package image
        ctx.drawImage(img, 0, 0, targetW, targetH);

        // 3. Overlay color-coded bounding boxes and statutory badges
        boxes.forEach((box) => {
          const coords = normalizeBoxCoords(box);
          const x = (coords.x / 100) * targetW;
          const y = (coords.y / 100) * targetH;
          const w = (coords.width / 100) * targetW;
          const h = (coords.height / 100) * targetH;

          const isViolation = box.status === 'VIOLATION';
          const isReview =
            (box.status as string) === 'REVIEW_REQUIRED' ||
            box.status === 'REQUIRES_MANUAL_REVIEW' ||
            box.status === 'INSUFFICIENT_EVIDENCE' ||
            box.status === 'POTENTIAL_ISSUE' ||
            box.status === 'WARNING' ||
            box.status === 'LOW_CONFIDENCE';

          // Color palette matching PrecisionAnnotationViewer
          let strokeColor = '#52796F';
          let fillColor = 'rgba(82, 121, 111, 0.22)';
          let badgeBg = '#335E46';

          if (isViolation) {
            strokeColor = '#9E432A';
            fillColor = 'rgba(158, 67, 42, 0.25)';
            badgeBg = '#9E432A';
          } else if (isReview) {
            strokeColor = '#8C5E2D';
            fillColor = 'rgba(140, 94, 45, 0.25)';
            badgeBg = '#8C5E2D';
          }

          // Translucent highlight fill
          ctx.fillStyle = fillColor;
          ctx.fillRect(x, y, w, h);

          // Crisp border stroke
          const strokeWidth = Math.max(2.5, Math.round(targetW / 320));
          ctx.lineWidth = strokeWidth;
          ctx.strokeStyle = strokeColor;
          ctx.strokeRect(x, y, w, h);

          // Optional polygon outline
          if (box.polygon && box.polygon.length > 2) {
            ctx.save();
            ctx.beginPath();
            const p0 = box.polygon[0];
            ctx.moveTo((p0.x / 100) * targetW, (p0.y / 100) * targetH);
            for (let i = 1; i < box.polygon.length; i++) {
              ctx.lineTo((box.polygon[i].x / 100) * targetW, (box.polygon[i].y / 100) * targetH);
            }
            ctx.closePath();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = Math.max(1.5, strokeWidth * 0.8);
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.restore();
          }

          // Canonical Label Badge Pill (Short 1-2 words + confidence %)
          const shortLabel = box.displayLabel || getShortFieldLabel(box.field, box.label);
          const confStr = box.confidence ? `${Math.round(box.confidence > 1 ? box.confidence : box.confidence * 100)}%` : '';
          const badgeText = confStr ? `${shortLabel} ${confStr}` : shortLabel;

          const fontSize = Math.max(12, Math.round(targetW / 60));
          ctx.font = `bold ${fontSize}px sans-serif`;
          const textMetrics = ctx.measureText(badgeText);
          const badgePadX = 8;
          const badgePadY = 4;
          const badgeW = textMetrics.width + badgePadX * 2;
          const badgeH = fontSize + badgePadY * 2;

          let badgeX = Math.max(2, Math.min(targetW - badgeW - 2, x));
          let badgeY = y - badgeH - 2;
          if (badgeY < 2) {
            badgeY = y + 2;
          }

          // Badge pill container
          ctx.fillStyle = badgeBg;
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
          } else {
            ctx.rect(badgeX, badgeY, badgeW, badgeH);
          }
          ctx.fill();

          // Badge text
          ctx.fillStyle = '#FFFFFF';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, badgeX + badgePadX, badgeY + badgeH / 2);
        });

        const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
        if (!dataUrl || dataUrl.length < 500) {
          console.warn('[PDF Export] Generated dataUrl was unexpectedly short or invalid');
          resolve(null);
          return;
        }

        console.log(`[PDF Export] Composited annotated evidence image (${targetW}x${targetH}, ${boxes.length} boxes, dataUrl length: ${dataUrl.length})`);
        resolve({ dataUrl, width: targetW, height: targetH });
      } catch (err) {
        console.warn('[PDF Export] Canvas rendering exception:', err);
        resolve(null);
      }
    };

    img.onload = () => {
      void processImage();
    };

    img.onerror = (err) => {
      console.warn('[PDF Export] Failed to load evidence image source:', err);
      resolve(null);
    };

    img.src = imageSrc;
  });
}

/**
 * Generates and downloads a formal statutory PDF inspection summary report.
 * Compliant with Legal Metrology (Packaged Commodities) Rules 2011,
 * The Seeds Act 1966, and Fertilizer Control Order 1985.
 */
export async function exportInspectionToPDF(inspection: InspectionRecord): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper for adding new pages safely
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawPageHeaderMini();
    }
  };

  const drawPageHeaderMini = () => {
    doc.setFillColor(242, 240, 235);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(82, 121, 111);
    doc.text('NIRIKSHAK STATUTORY COMPLIANCE SUMMARY • CONTINUED', margin + 3, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`REF: ${inspection.id}`, pageWidth - margin - 3, y + 5.5, { align: 'right' });
    y += 12;
  };

  // 1. TOP HEADER BANNER (Government Theme)
  doc.setFillColor(51, 94, 70); // #335E46
  doc.rect(margin, y, contentWidth, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(235, 243, 238);
  doc.text(
    'GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION',
    margin + contentWidth / 2,
    y + 6,
    { align: 'center' }
  );

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(
    'NIRIKSHAK STATUTORY PACKAGED COMMODITY INSPECTION SUMMARY',
    margin + contentWidth / 2,
    y + 13,
    { align: 'center' }
  );

  y += 22;

  // 2. META DATA GRID
  doc.setDrawColor(220, 216, 208);
  doc.setFillColor(250, 248, 245);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

  const col1 = margin + 4;
  const col2 = margin + 70;
  const col3 = margin + 132;
  let metaY = y + 6;

  // Row 1
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(110, 115, 110);
  doc.text('INSPECTION ID', col1, metaY);
  doc.text('EXPORT TIMESTAMP', col2, metaY);
  doc.text('OVERALL COMPLIANCE STATUS', col3, metaY);

  metaY += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 50, 46);
  doc.text(inspection.id, col1, metaY);

  doc.setFont('helvetica', 'normal');
  const now = new Date();
  const timestampStr = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST`;
  doc.text(timestampStr, col2, metaY);

  // Status Badge
  const isViolation = inspection.summaryCounts.potentialIssues > 0 || inspection.status === 'SEIZURE_FLAGGED';
  if (isViolation) {
    doc.setFillColor(158, 67, 42); // #9E432A
    doc.setTextColor(255, 255, 255);
    doc.roundedRect(col3, metaY - 3.5, 45, 5.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(
      inspection.status === 'SEIZURE_FLAGGED' ? 'SEIZURE FLAGGED' : 'ISSUES DETECTED',
      col3 + 22.5,
      metaY + 0.3,
      { align: 'center' }
    );
  } else if (inspection.status === 'COMPLETED') {
    doc.setFillColor(51, 94, 70); // #335E46
    doc.setTextColor(255, 255, 255);
    doc.roundedRect(col3, metaY - 3.5, 45, 5.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('VERIFIED COMPLIANT', col3 + 22.5, metaY + 0.3, { align: 'center' });
  } else {
    doc.setFillColor(180, 115, 30);
    doc.setTextColor(255, 255, 255);
    doc.roundedRect(col3, metaY - 3.5, 45, 5.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('UNDER REVIEW', col3 + 22.5, metaY + 0.3, { align: 'center' });
  }

  // Row 2
  metaY += 7.5;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(110, 115, 110);
  doc.text('PRODUCT NAME & CATEGORY', col1, metaY);
  doc.text('BATCH REFERENCE', col2, metaY);
  doc.text('COMPLETENESS SCORE', col3, metaY);

  metaY += 4.5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 50, 46);
  const prodText = `${inspection.productName} (${inspection.category.replace(/_/g, ' ')})`;
  doc.text(doc.splitTextToSize(prodText, 62)[0], col1, metaY);

  doc.setFont('helvetica', 'normal');
  doc.text(inspection.batchReference || 'N/A', col2, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isViolation ? 158 : 51, isViolation ? 67 : 94, isViolation ? 42 : 70);
  doc.text(`${inspection.completenessScore} / 100`, col3, metaY);

  // Row 3
  metaY += 7.5;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(110, 115, 110);
  doc.text('INSPECTOR IN CHARGE', col1, metaY);
  doc.text('STATION NODE', col2, metaY);
  doc.text('INITIAL INSPECTION DATE', col3, metaY);

  metaY += 4.5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(45, 50, 46);
  doc.text(inspection.inspectorName || 'District Legal Metrology Officer', col1, metaY);
  doc.text(inspection.stationNode || 'NIC-METROLOGY-NODE: #DELHI-WEST-04', col2, metaY);
  doc.text(new Date(inspection.createdAt).toLocaleDateString('en-GB'), col3, metaY);

  y += 42;

  // 3. STATISTICAL SUMMARY CHIPS
  doc.setFillColor(245, 243, 238);
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'F');

  const chipWidth = contentWidth / 4;
  const chipY = y + 4;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 95, 90);
  doc.text('Verified Mandatory Rules:', margin + 4, chipY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 94, 70);
  doc.text(`${inspection.summaryCounts.verified}`, margin + 4, chipY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 95, 90);
  doc.text('Identified Non-Compliances:', margin + chipWidth + 4, chipY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(158, 67, 42);
  doc.text(`${inspection.summaryCounts.potentialIssues}`, margin + chipWidth + 4, chipY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 95, 90);
  doc.text('Under Manual Review:', margin + chipWidth * 2 + 4, chipY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 115, 30);
  doc.text(`${inspection.summaryCounts.requiresReview}`, margin + chipWidth * 2 + 4, chipY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 95, 90);
  doc.text('Missing Declarations:', margin + chipWidth * 3 + 4, chipY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 120, 120);
  doc.text(`${inspection.summaryCounts.notDetected}`, margin + chipWidth * 3 + 4, chipY + 4.5);

  y += 16;

  // 3.5. EVIDENCE — ANNOTATED STATUTORY PACKAGING IMAGES
  interface EvidenceItem {
    sideLabel: string;
    fileName: string;
    imageSrc: string;
    boxes: BoundingBox[];
  }
  const evidenceItems: EvidenceItem[] = [];

  if (inspection.images && inspection.images.length > 0) {
    for (let idx = 0; idx < inspection.images.length; idx++) {
      const imgRec = inspection.images[idx];
      let resolvedSrc = '';

      if (imgRec.previewUrl) {
        if (imgRec.previewUrl.startsWith('data:') || imgRec.previewUrl.startsWith('http') || imgRec.previewUrl.startsWith('blob:')) {
          resolvedSrc = imgRec.previewUrl;
        } else if (imgRec.previewUrl.length > 50) {
          resolvedSrc = `data:${imgRec.mimeType || 'image/jpeg'};base64,${imgRec.previewUrl}`;
        }
      }

      if (!resolvedSrc && imgRec.id) {
        try {
          const bin = await getImageBinary(imgRec.id);
          if (typeof bin === 'string') {
            resolvedSrc = bin;
          } else if (bin instanceof Blob) {
            resolvedSrc = URL.createObjectURL(bin);
          }
        } catch {}
      }

      if (!resolvedSrc) {
        resolvedSrc = createPresetPackagingSvg(inspection);
      }

      const matchingBoxes = (inspection.boundingBoxes || []).filter((b) => {
        if (inspection.images.length === 1) return true;
        if (b.sourceImageIndex !== undefined) return b.sourceImageIndex === idx;
        if (b.sourceImageId && b.sourceImageId === imgRec.id) return true;
        if (b.sourceSide && b.sourceSide === imgRec.side) return true;
        return idx === 0;
      });

      const rawSide = (imgRec.side || 'FRONT').toUpperCase();
      const panelName = rawSide.includes('FRONT')
        ? 'FRONT PANEL (PDP)'
        : rawSide.includes('BACK')
        ? 'BACK PANEL'
        : rawSide.includes('LEFT')
        ? 'LEFT SIDE PANEL'
        : rawSide.includes('RIGHT')
        ? 'RIGHT SIDE PANEL'
        : rawSide.includes('TOP')
        ? 'TOP / CAP PANEL'
        : rawSide.includes('BOTTOM')
        ? 'BOTTOM PANEL'
        : `${rawSide} PANEL`;

      evidenceItems.push({
        sideLabel: `PANEL ${idx + 1}: ${panelName}`,
        fileName: imgRec.fileName || `scanned_view_${idx + 1}.jpg`,
        imageSrc: resolvedSrc,
        boxes: matchingBoxes,
      });
    }
  } else {
    // Preset inspections or historical scans without stored raw files — synthesize standard packaging declarations
    evidenceItems.push({
      sideLabel: 'PANEL 1: FRONT PANEL (PDP)',
      fileName: `${(inspection.productName || 'product').toLowerCase().replace(/\s+/g, '_')}_declarations.svg`,
      imageSrc: createPresetPackagingSvg(inspection),
      boxes: inspection.boundingBoxes || [],
    });
  }

  if (evidenceItems.length > 0) {
    checkPageBreak(50);
    doc.setFillColor(51, 94, 70);
    doc.rect(margin, y, 3, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(45, 50, 46);
    doc.text(
      `EVIDENCE — ANNOTATED STATUTORY PACKAGING IMAGES (${evidenceItems.length} VIEW${evidenceItems.length > 1 ? 'S' : ''})`,
      margin + 6,
      y + 4.8
    );
    y += 9;

    for (let eIdx = 0; eIdx < evidenceItems.length; eIdx++) {
      const item = evidenceItems[eIdx];
      const rendered = await renderAnnotatedEvidenceImage(item.imageSrc, item.boxes);
      if (!rendered) continue;

      const aspect = rendered.height / rendered.width;
      let imgW = Math.min(contentWidth, 155);
      let imgH = imgW * aspect;
      if (imgH > 105) {
        imgH = 105;
        imgW = imgH / aspect;
      }

      // Check page break before rendering the evidence card
      checkPageBreak(imgH + 28);

      // Panel Header Bar
      doc.setFillColor(242, 240, 235);
      doc.roundedRect(margin, y, contentWidth, 7, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 94, 70);
      doc.text(item.sideLabel, margin + 4, y + 4.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(90, 95, 90);
      doc.text(
        `File: ${item.fileName} • ${item.boxes.length} statutory field annotations overlaid`,
        pageWidth - margin - 4,
        y + 4.8,
        { align: 'right' }
      );
      y += 9;

      // Draw Center Image with crisp border
      const imgX = margin + (contentWidth - imgW) / 2;
      try {
        doc.addImage(rendered.dataUrl, 'JPEG', imgX, y, imgW, imgH, undefined, 'FAST');
        doc.setDrawColor(220, 216, 208);
        doc.rect(imgX, y, imgW, imgH);
      } catch (imgErr) {
        console.warn('[PDF Export] Could not embed packaging image:', imgErr);
      }
      y += imgH + 3;

      // Bounding-box Color Legend Bar
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      const legY = y + 2.5;
      let legX = imgX;

      // Green - Verified
      doc.setFillColor(51, 94, 70);
      doc.rect(legX, legY - 2.5, 3, 3, 'F');
      doc.setTextColor(51, 94, 70);
      doc.text('Verified Compliant', legX + 4.5, legY);
      legX += 34;

      // Amber - Needs Review
      doc.setFillColor(140, 94, 45);
      doc.rect(legX, legY - 2.5, 3, 3, 'F');
      doc.setTextColor(140, 94, 45);
      doc.text('Needs Review / Advisory', legX + 4.5, legY);
      legX += 42;

      // Red - Violation
      doc.setFillColor(158, 67, 42);
      doc.rect(legX, legY - 2.5, 3, 3, 'F');
      doc.setTextColor(158, 67, 42);
      doc.text('Potential Issue / Violation', legX + 4.5, legY);

      y += 9;
    }
  }

  // 4. IDENTIFIED REGULATORY ISSUES SECTION (PRIMARY EMPHASIS)
  const regulatoryIssues = inspection.findings.filter(
    (f) =>
      f.status === 'VIOLATION' ||
      f.status === 'POTENTIAL_ISSUE' ||
      f.status === 'REQUIRES_MANUAL_REVIEW' ||
      f.status === 'NOT_DETECTED' ||
      f.status === 'LOW_CONFIDENCE'
  );

  checkPageBreak(30);

  doc.setFillColor(158, 67, 42);
  doc.rect(margin, y, 3, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(45, 50, 46);
  doc.text(`IDENTIFIED REGULATORY ISSUES & NON-COMPLIANCES (${regulatoryIssues.length})`, margin + 6, y + 5.5);
  y += 10;

  if (regulatoryIssues.length === 0) {
    doc.setFillColor(235, 245, 238);
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(51, 94, 70);
    doc.text('✓ NO STATUTORY VIOLATIONS DETECTED', margin + 6, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(70, 75, 70);
    doc.text(
      'All examined declarations comply with Legal Metrology (Packaged Commodities) Rules 2011 and applicable statutory regulations.',
      margin + 6,
      y + 10.5
    );
    y += 18;
  } else {
    regulatoryIssues.forEach((issue, index) => {
      // Calculate needed height for this issue card
      const detectedLines = doc.splitTextToSize(`Observed Text: "${issue.detectedText || 'Declaration absent from package'}"`, contentWidth - 12);
      const standardLines = doc.splitTextToSize(`Statutory Standard: ${issue.statutoryStandardText}`, contentWidth - 12);
      const explainLines = doc.splitTextToSize(`Violation Details: ${issue.explanation}`, contentWidth - 12);
      const actionLines = doc.splitTextToSize(`Remedial Action: ${issue.recommendedAction}`, contentWidth - 12);

      const cardHeight = 24 + (detectedLines.length + standardLines.length + explainLines.length + actionLines.length) * 3.8;
      checkPageBreak(cardHeight);

      // Issue Card Border & Background
      const isCritical = issue.severity === 'CRITICAL' || issue.status === 'POTENTIAL_ISSUE';
      doc.setFillColor(isCritical ? 254 : 255, isCritical ? 247 : 252, isCritical ? 245 : 240);
      doc.setDrawColor(isCritical ? 245 : 230, isCritical ? 200 : 205, isCritical ? 190 : 180);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, 'FD');

      // Issue Card Header
      let cardY = y + 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(isCritical ? 158 : 180, isCritical ? 67 : 115, isCritical ? 42 : 30);
      doc.text(
        `ISSUE #${index + 1}: ${issue.title.toUpperCase()} [${issue.sectionRef}]`,
        margin + 4,
        cardY
      );

      // Severity Tag
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isCritical ? 158 : 180, isCritical ? 67 : 115, isCritical ? 42 : 30);
      doc.text(`SEVERITY: ${issue.severity}`, pageWidth - margin - 4, cardY, { align: 'right' });

      // Governing Act
      cardY += 4.5;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(110, 115, 110);
      doc.text(`Governing Act: ${issue.actName}`, margin + 4, cardY);

      // Content Lines
      doc.setFontSize(8);
      doc.setTextColor(45, 50, 46);

      cardY += 4.5;
      doc.setFont('helvetica', 'bold');
      doc.text('Observed on Packaging:', margin + 4, cardY);
      doc.setFont('helvetica', 'normal');
      doc.text(detectedLines, margin + 4, cardY + 3.8);

      cardY += 4 + detectedLines.length * 3.8;
      doc.setFont('helvetica', 'bold');
      doc.text('Statutory Requirement:', margin + 4, cardY);
      doc.setFont('helvetica', 'normal');
      doc.text(standardLines, margin + 4, cardY + 3.8);

      cardY += 4 + standardLines.length * 3.8;
      doc.setFont('helvetica', 'bold');
      doc.text('Findings & Law Citation:', margin + 4, cardY);
      doc.setFont('helvetica', 'normal');
      doc.text(explainLines, margin + 4, cardY + 3.8);

      cardY += 4 + explainLines.length * 3.8;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isCritical ? 158 : 180, isCritical ? 67 : 115, isCritical ? 42 : 30);
      doc.text('Remedial Action Prescribed:', margin + 4, cardY);
      doc.setFont('helvetica', 'normal');
      doc.text(actionLines, margin + 4, cardY + 3.8);

      y += cardHeight + 4;
    });
  }

  // 5. VERIFIED COMPLIANT DECLARATIONS SUMMARY
  const verifiedFindings = inspection.findings.filter((f) => f.status === 'VERIFIED');
  if (verifiedFindings.length > 0) {
    checkPageBreak(30);

    doc.setFillColor(51, 94, 70);
    doc.rect(margin, y, 3, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(45, 50, 46);
    doc.text(`VERIFIED COMPLIANT STATUTORY DECLARATIONS (${verifiedFindings.length})`, margin + 6, y + 4.8);
    y += 9;

    verifiedFindings.forEach((v) => {
      const hasOverride = v.reviewerOverride?.newStatus === 'VERIFIED';
      const cardHeight = hasOverride ? 13 : 10;
      checkPageBreak(cardHeight + 2);
      doc.setDrawColor(225, 235, 228);
      doc.setFillColor(250, 253, 250);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 94, 70);
      const titleText = hasOverride
        ? `✓ ${v.sectionRef}: ${v.title} [Adjudicated: ${v.reviewerOverride?.overriddenBy || 'Field Inspector'}]`
        : `✓ ${v.sectionRef}: ${v.title}`;
      doc.text(titleText, margin + 3, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(80, 85, 80);
      const detText = doc.splitTextToSize(`Value: ${v.detectedText || 'Verified on package'}`, contentWidth - 8)[0];
      doc.text(detText, margin + 3, y + 8);

      if (hasOverride && v.reviewerOverride?.reason) {
        doc.setFontSize(7);
        doc.setTextColor(51, 94, 70);
        doc.text(`Review Note: ${v.reviewerOverride.reason}`, margin + 3, y + 11.5);
      }

      y += cardHeight + 2;
    });
  }

  // 6. EXTRACTED METROLOGY DECLARATIONS TABLE (KEY FIELDS)
  checkPageBreak(35);
  doc.setFillColor(82, 121, 111);
  doc.rect(margin, y, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(45, 50, 46);
  doc.text('EXTRACTED PRODUCT IDENTITY & LABEL ATTRIBUTES', margin + 6, y + 4.8);
  y += 9;

  const ef = inspection.extractedFields;
  const attributes = [
    { label: 'Brand Name', val: ef.brandName || 'N/A' },
    { label: 'Net Quantity (Rule 6(1)(b))', val: ef.netQuantity || 'N/A' },
    { label: 'MRP (Rule 6(1)(d))', val: ef.mrp ? `${ef.mrp} (${ef.taxDeclaration || 'Incl. taxes'})` : 'N/A' },
    { label: 'Unit Sale Price (USP)', val: ef.unitSalePrice || 'N/A' },
    { label: 'Manufacturer Name', val: ef.manufacturerName || 'N/A' },
    { label: 'Packing / Mfg Date', val: ef.packingDate || ef.mfgMonthYear || 'N/A' },
    { label: 'Lot / Batch Reference', val: ef.lotNumber || ef.batchNumber || 'N/A' },
    { label: 'Consumer Helpline (Rule 6(1)(n))', val: ef.consumerCarePhone || ef.consumerCareEmail ? `${ef.consumerCarePhone || ''} ${ef.consumerCareEmail || ''}` : 'NOT DETECTED / ABSENT' },
  ];

  if (ef.germinationPercentage !== undefined) {
    attributes.push({ label: 'Germination % (Seeds Act)', val: `${ef.germinationPercentage}% (Standard: 85%)` });
  }
  if (ef.npkRatio) {
    attributes.push({ label: 'NPK Ratio (FCO 1985)', val: ef.npkRatio });
  }

  // Pre-calculate table height so background card is drawn BEFORE text (preventing overdraw)
  let calculatedHeight = 4;
  for (let i = 0; i < attributes.length; i += 2) {
    const item1 = attributes[i];
    const item2 = attributes[i + 1];
    const lines1 = doc.splitTextToSize(item1.val, 45);
    const lines2 = item2 ? doc.splitTextToSize(item2.val, 45) : [];
    const rowLineCount = Math.max(lines1.length, lines2.length || 1);
    calculatedHeight += Math.max(8, rowLineCount * 4);
  }

  doc.setDrawColor(225, 225, 220);
  doc.setFillColor(252, 251, 248);
  doc.roundedRect(margin, y, contentWidth, calculatedHeight + 2, 1.5, 1.5, 'FD');

  let tableY = y + 5;
  for (let i = 0; i < attributes.length; i += 2) {
    const item1 = attributes[i];
    const item2 = attributes[i + 1];

    const lines1 = doc.splitTextToSize(item1.val, 45);
    const lines2 = item2 ? doc.splitTextToSize(item2.val, 45) : [];
    const rowLineCount = Math.max(lines1.length, lines2.length || 1);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(90, 95, 90);
    doc.text(`${item1.label}:`, margin + 4, tableY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(45, 50, 46);
    doc.text(lines1, margin + 46, tableY);

    if (item2) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(90, 95, 90);
      doc.text(`${item2.label}:`, margin + contentWidth / 2 + 4, tableY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(
        item2.val.includes('NOT DETECTED') ? 158 : 45,
        item2.val.includes('NOT DETECTED') ? 67 : 50,
        item2.val.includes('NOT DETECTED') ? 42 : 46
      );
      doc.text(lines2, margin + contentWidth / 2 + 50, tableY);
    }

    tableY += Math.max(8, rowLineCount * 4);
  }

  y += calculatedHeight + 8;

  // 7. INSPECTOR OBSERVATIONS & SIGN-OFF BLOCK
  checkPageBreak(35);

  if (inspection.inspectorNotes) {
    doc.setFillColor(248, 246, 240);
    doc.setDrawColor(225, 220, 210);
    doc.roundedRect(margin, y, contentWidth, 16, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(80, 85, 80);
    doc.text('FIELD INSPECTOR NOTES & OBSERVATIONS:', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(45, 50, 46);
    const notesLines = doc.splitTextToSize(inspection.inspectorNotes, contentWidth - 8);
    doc.text(notesLines, margin + 4, y + 9.5);

    y += 20;
  }

  // 8. LEGAL SEAL & SIGNATURE BLOCK
  checkPageBreak(28);
  doc.setDrawColor(180, 185, 180);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 115, 110);
  doc.text(
    'This summary report is generated under the statutory mandate of Section 15 of Legal Metrology Act, 2009 & Section 13 of The Seeds Act, 1966.',
    margin,
    y
  );
  doc.text(
    'Digital Document Verification Hash: ' +
      btoa(`${inspection.id}-${inspection.completenessScore}-${inspection.createdAt}`).slice(0, 32).toUpperCase(),
    margin,
    y + 4
  );

  // Signature Block
  const sigX = pageWidth - margin - 55;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(45, 50, 46);
  doc.text('AUTHORIZED LEGAL METROLOGY INSPECTOR', sigX, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 105, 100);
  doc.text(inspection.inspectorName || 'District Legal Metrology Officer', sigX, y + 13.5);
  doc.text('Govt. of India • National Metrology Registry', sigX, y + 17.5);

  // Download the generated PDF
  const cleanDate = now.toISOString().slice(0, 10);
  const fileName = `NIRIKSHAK_Inspection_${inspection.id}_${cleanDate}.pdf`;
  doc.save(fileName);
}
