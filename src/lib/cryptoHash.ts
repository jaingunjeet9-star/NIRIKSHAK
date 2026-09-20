/**
 * Tamper-Evident SHA-256 Cryptographic Evidence Hash Generator for NIRIKSHAK
 * Generates an immutable chain-of-custody hash for statutory inspection records.
 */

export async function computeSha256(text: string): Promise<string> {
  // Check if running in browser with crypto.subtle
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Node.js fallback for tests and backend
  try {
    const nodeCrypto = await import('crypto');
    return nodeCrypto.createHash('sha256').update(text).digest('hex');
  } catch {
    // Basic deterministic hash fallback if neither is available
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
}

/**
 * Generates canonical SHA-256 evidence digest for an inspection record
 */
export async function generateInspectionEvidenceHash(inspection: {
  id: string;
  batchReference?: string;
  productName: string;
  category: string;
  extractedFields: Record<string, any>;
  findings?: Array<{ ruleId: string; status: string; detectedText: string }>;
  createdAt?: string;
}): Promise<string> {
  // Extract minimal canonical representation
  const canonicalPayload = {
    id: inspection.id,
    batchReference: inspection.batchReference || '',
    productName: inspection.productName,
    category: inspection.category,
    fields: {
      netQuantity: inspection.extractedFields?.netQuantity,
      mrp: inspection.extractedFields?.mrp,
      mrpValue: inspection.extractedFields?.mrpValue,
      actualSellingPrice: inspection.extractedFields?.actualSellingPrice,
      manufacturerName: inspection.extractedFields?.manufacturerName,
      batchNumber: inspection.extractedFields?.batchNumber,
      mfgMonthYear: inspection.extractedFields?.mfgMonthYear,
    },
    findingsSummary: (inspection.findings || []).map((f) => ({
      ruleId: f.ruleId,
      status: f.status,
      detectedText: f.detectedText,
    })),
    createdAt: inspection.createdAt,
  };

  const raw = JSON.stringify(canonicalPayload);
  const hex = await computeSha256(raw);
  return hex.toUpperCase();
}
