import { BoundingBox } from '../types';

/**
 * NIRIKSHAK Canonical Short Label Dictionary
 * Strictly 1-2 words per label. Identifies the statutory field, never explains it.
 */
export const CANONICAL_FIELD_LABELS: Record<string, string> = {
  // Product Identification
  product_name: 'Product Name',
  productname: 'Product Name',
  generic_name: 'Generic Name',
  genericname: 'Generic Name',
  brand: 'Brand',
  brandname: 'Brand',

  // Pricing
  mrp: 'MRP',
  maximum_retail_price: 'MRP',
  unit_price: 'Unit Price',
  unitsaleprice: 'Unit Price',
  tax_declaration: 'Taxes',

  // Quantity & Measurements
  net_quantity: 'Net Qty',
  netquantity: 'Net Qty',
  volume: 'Volume',
  weight: 'Weight',

  // Traceability & Production
  batch: 'Batch',
  batch_number: 'Batch',
  batchnumber: 'Batch',
  lot: 'Lot',
  lot_number: 'Lot',
  lotnumber: 'Lot',

  // Dates
  mfg_date: 'Mfg Date',
  manufacturing_date: 'Mfg Date',
  mfgmonthyear: 'Mfg Date',
  packing_date: 'Packing Date',
  packingdate: 'Packing Date',
  expiry: 'Expiry',
  expiry_date: 'Expiry',
  expirydate: 'Expiry',
  best_before: 'Best Before',
  bestbefore: 'Best Before',
  use_before: 'Use Before',
  usebefore: 'Use Before',

  // Business & Entities
  manufacturer: 'Manufacturer',
  manufacturername: 'Manufacturer',
  manufactureraddress: 'Mfg Address',
  marketer: 'Marketer',
  marketername: 'Marketer',
  packer: 'Packer',
  packername: 'Packer',
  importer: 'Importer',
  importername: 'Importer',

  // Consumer Contact
  customer_care: 'Customer Care',
  consumercare: 'Customer Care',
  consumercarephone: 'Customer Care',
  consumercareemail: 'Care Email',

  // Legal & Origin
  country_of_origin: 'Origin',
  countryoforigin: 'Origin',
  licence: 'Licence',
  licence_number: 'Licence',
  fssai: 'FSSAI Lic',
  fssailicensenumber: 'FSSAI Lic',
  drug_license: 'Drug Lic',
  druglicensenumber: 'Drug Lic',
  isi_mark: 'ISI Mark',
  bis_registration: 'BIS Reg',

  // Product-Specific & Safety
  ingredients: 'Ingredients',
  active_ingredient: 'Active Ingredient',
  dosage: 'Dosage',
  rx: 'Rx',
  rxsymbol: 'Rx',
  nrx: 'NRx',
  xrx: 'XRx',
  warning: 'Warning',
  caution: 'Caution',
  storage: 'Storage',
  storageconditions: 'Storage',
  germination: 'Germination %',
  germinationpercentage: 'Germination %',
  purity: 'Purity %',
  geneticpuritypercentage: 'Purity %',
  npk: 'NPK Ratio',
  npkratio: 'NPK Ratio',
};

/**
 * Returns a strict, concise 1-2 word display label for any detected bounding box
 */
export function getShortFieldLabel(field: string, rawLabel?: string): string {
  const normField = (field || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (CANONICAL_FIELD_LABELS[normField]) {
    return CANONICAL_FIELD_LABELS[normField];
  }

  // Check if raw label contains clear keywords
  const l = (rawLabel || '').toLowerCase();
  if (l.includes('mrp') || l.includes('retail price')) return 'MRP';
  if (l.includes('unit price') || l.includes('usp')) return 'Unit Price';
  if (l.includes('net qty') || l.includes('quantity')) return 'Net Qty';
  if (l.includes('product') || l.includes('identity')) return 'Product Name';
  if (l.includes('brand')) return 'Brand';
  if (l.includes('batch')) return 'Batch';
  if (l.includes('lot')) return 'Lot';
  if (l.includes('expir') || l.includes('best before')) return 'Expiry';
  if (l.includes('mfg date') || l.includes('date of mfg') || l.includes('packing date')) return 'Mfg Date';
  if (l.includes('manufacturer') || l.includes('mfg by')) return 'Manufacturer';
  if (l.includes('marketer')) return 'Marketer';
  if (l.includes('packer')) return 'Packer';
  if (l.includes('importer')) return 'Importer';
  if (l.includes('customer care') || l.includes('care') || l.includes('helpline')) return 'Customer Care';
  if (l.includes('origin')) return 'Origin';
  if (l.includes('fssai')) return 'FSSAI Lic';
  if (l.includes('licence') || l.includes('license')) return 'Licence';
  if (l.includes('ingredient')) return 'Ingredients';
  if (l.includes('warning')) return 'Warning';
  if (l.includes('caution')) return 'Caution';
  if (l.includes('storage')) return 'Storage';
  if (l.includes('rx')) return 'Rx';

  // If raw label is already 1-2 words and doesn't contain explanatory text like "TAG #" or "This is"
  if (rawLabel) {
    const cleaned = rawLabel
      .replace(/^tag\s*#?\d+:?\s*/i, '')
      .replace(/^(this is the|this is|detected)\s*/i, '')
      .trim();
    const words = cleaned.split(/\s+/);
    if (words.length <= 2 && cleaned.length <= 20 && !cleaned.includes(':')) {
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  // Clean the field name as fallback
  const fallback = (field || 'Field').replace(/_/g, ' ').trim();
  const words = fallback.split(/\s+/).slice(0, 2);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export type FieldCategory =
  | 'all'
  | 'pricing'
  | 'product'
  | 'dates'
  | 'batch'
  | 'manufacturer'
  | 'contact'
  | 'legal'
  | 'safety';

export const FIELD_CATEGORY_FILTERS: Array<{ id: FieldCategory; label: string }> = [
  { id: 'all', label: 'All Fields' },
  { id: 'pricing', label: 'Pricing (MRP)' },
  { id: 'product', label: 'Product' },
  { id: 'dates', label: 'Dates' },
  { id: 'batch', label: 'Batch / Lot' },
  { id: 'manufacturer', label: 'Manufacturer' },
  { id: 'contact', label: 'Customer Care' },
  { id: 'legal', label: 'Legal & Licences' },
  { id: 'safety', label: 'Safety / Rx' },
];

export function getFieldCategory(field: string, label: string): FieldCategory {
  const s = `${field} ${label}`.toLowerCase();
  if (s.includes('mrp') || s.includes('price') || s.includes('tax')) return 'pricing';
  if (s.includes('product') || s.includes('brand') || s.includes('name') || s.includes('qty') || s.includes('quantity'))
    return 'product';
  if (s.includes('date') || s.includes('mfg') || s.includes('exp') || s.includes('before')) return 'dates';
  if (s.includes('batch') || s.includes('lot')) return 'batch';
  if (s.includes('manufacturer') || s.includes('marketer') || s.includes('packer') || s.includes('importer'))
    return 'manufacturer';
  if (s.includes('care') || s.includes('phone') || s.includes('email') || s.includes('contact') || s.includes('consumer'))
    return 'contact';
  if (s.includes('origin') || s.includes('licence') || s.includes('license') || s.includes('fssai') || s.includes('bis') || s.includes('isi'))
    return 'legal';
  if (s.includes('warn') || s.includes('caut') || s.includes('rx') || s.includes('sched') || s.includes('hazard') || s.includes('storage') || s.includes('ingredient'))
    return 'safety';
  return 'product';
}

/**
 * Normalizes bounding box percentage coordinates ensuring they fit within the 0-100% viewport safely.
 * Intelligently handles:
 * - Standard Gemini/Vision 0-1000 scale (divides by 10 to get 0-100%)
 * - Normalized 0.0-1.0 fraction scale (multiplies by 100 to get 0-100%)
 * - Standard percentage 0-100%
 * - Standard Gemini box_2d: [ymin, xmin, ymax, xmax] in 0-1000 or 0-1
 */
export function normalizeBoxCoords(box: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  box_2d?: number[];
  ymin?: number;
  xmin?: number;
  ymax?: number;
  xmax?: number;
}): { x: number; y: number; width: number; height: number } {
  let rawX = 10;
  let rawY = 10;
  let rawW = 30;
  let rawH = 10;

  // Handle box_2d: [ymin, xmin, ymax, xmax]
  if (Array.isArray(box.box_2d) && box.box_2d.length >= 4) {
    const [ymin, xmin, ymax, xmax] = box.box_2d;
    rawX = xmin;
    rawY = ymin;
    rawW = Math.max(0, xmax - xmin);
    rawH = Math.max(0, ymax - ymin);
  } else if (
    typeof box.ymin === 'number' &&
    typeof box.xmin === 'number' &&
    typeof box.ymax === 'number' &&
    typeof box.xmax === 'number'
  ) {
    rawX = box.xmin;
    rawY = box.ymin;
    rawW = Math.max(0, box.xmax - box.xmin);
    rawH = Math.max(0, box.ymax - box.ymin);
  } else {
    rawX = typeof box.x === 'number' ? box.x : 10;
    rawY = typeof box.y === 'number' ? box.y : 10;
    rawW = typeof box.width === 'number' ? box.width : 30;
    rawH = typeof box.height === 'number' ? box.height : 10;
  }

  // 1. Detect 0-1000 scale (standard Gemini Vision format where values exceed 100)
  if (rawX > 100 || rawY > 100 || rawW > 100 || rawH > 100) {
    rawX = rawX / 10;
    rawY = rawY / 10;
    rawW = rawW / 10;
    rawH = rawH / 10;
  }
  // 2. Detect 0.0-1.0 fraction scale (where all dimensions are <= 1.0)
  else if (
    rawX <= 1.0 &&
    rawY <= 1.0 &&
    rawW <= 1.0 &&
    rawH <= 1.0 &&
    (rawW > 0 || rawH > 0)
  ) {
    rawX = rawX * 100;
    rawY = rawY * 100;
    rawW = rawW * 100;
    rawH = rawH * 100;
  }

  // Ensure minimum reasonable dimensions so labels and boxes remain clickable
  rawW = Math.max(2.5, rawW);
  rawH = Math.max(2.0, rawH);

  // Clamp safely within 0% to 100% bounds
  let x = Math.max(0, Math.min(97.5, rawX));
  let y = Math.max(0, Math.min(98.0, rawY));
  let width = Math.max(2.5, Math.min(100 - x, rawW));
  let height = Math.max(2.0, Math.min(100 - y, rawH));

  return {
    x: Number(x.toFixed(1)),
    y: Number(y.toFixed(1)),
    width: Number(width.toFixed(1)),
    height: Number(height.toFixed(1)),
  };
}

/**
 * Generates an SVG Data URI representing a statutory package label
 * for preset items or tests where no physical photo was uploaded.
 */
export function createPresetPackagingSvg(inspection: {
  productName?: string;
  category?: string;
  extractedFields?: any;
  batchReference?: string;
}): string {
  const fields = inspection.extractedFields || {};
  const prodName = fields.productName || inspection.productName || 'Packaged Commodity';
  const brand = fields.brandName || 'Declared Brand';
  const mrp = fields.mrp || '₹ 100.00 (incl. of all taxes)';
  const netQty = fields.netQuantity || '10 N';
  const unitPrice = fields.unitSalePrice || '';
  const mfg = fields.manufacturerName || 'Licensed Manufacturer Pvt Ltd';
  const mfgAddr = fields.manufacturerAddress || 'Industrial Area, Phase 2, New Delhi, India';
  const batch = fields.batchNumber || inspection.batchReference || 'BATCH-2026-901';
  const date = fields.packingDate || fields.mfgMonthYear || '08/2026';
  const origin = fields.countryOfOrigin || 'India';
  const care = fields.consumerCarePhone || fields.consumerCareEmail || '1800-11-4000 (Toll Free)';

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FBF9F5" />
        <stop offset="100%" stop-color="#EDE8E0" />
      </linearGradient>
    <!-- Outer Package Container (clean government-standard light carton texture) -->
    <rect width="800" height="600" fill="#F4F1EA" />
    <rect x="30" y="24" width="740" height="552" rx="12" fill="#FFFFFF" stroke="#D5CFBE" stroke-width="2" />
    
    <!-- Top Header Ribbon -->
    <rect x="30" y="24" width="740" height="46" rx="12" fill="#52796F" />
    <rect x="30" y="52" width="740" height="18" fill="#52796F" />
    <text x="60" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF" letter-spacing="1">STATUTORY DECLARATION • LEGAL METROLOGY (PC) RULES 2011</text>
    <text x="730" y="58" text-anchor="end" font-family="monospace" font-size="12" font-weight="600" fill="#FFFFFF">ORIGIN: ${origin.toUpperCase()}</text>

    <!-- Product Name & Brand Box (x: 6%, y: 15%, w: 88%, h: 20%) -->
    <g transform="translate(60, 90)">
      <rect width="680" height="110" rx="8" fill="#FFFFFF" stroke="#E2DCD2" stroke-width="1.5" />
      <text x="24" y="36" font-family="-apple-system, sans-serif" font-size="13" font-weight="800" fill="#52796F" text-transform="uppercase" letter-spacing="1.5">${brand}</text>
      <text x="24" y="68" font-family="-apple-system, sans-serif" font-size="22" font-weight="800" fill="#1C201D">${prodName}</text>
      <text x="24" y="92" font-family="-apple-system, sans-serif" font-size="12" font-weight="500" fill="#7A827B">Generic Commodity Declaration • Ref: LM Rule 6(1)(a)</text>
    </g>

    <!-- Middle Split: Net Qty (x: 6%, y: 42%, w: 42%, h: 22%) -->
    <g transform="translate(60, 225)">
      <rect width="325" height="120" rx="8" fill="#FFFFFF" stroke="#E2DCD2" stroke-width="1.5" />
      <text x="20" y="32" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#535953" letter-spacing="1">NET QUANTITY / NET CONTENT</text>
      <text x="20" y="74" font-family="-apple-system, sans-serif" font-size="28" font-weight="900" fill="#1C201D">${netQty}</text>
      <text x="20" y="102" font-family="-apple-system, sans-serif" font-size="11" font-weight="600" fill="#52796F">Standard Package Unit (LM Rule 6(1)(b))</text>
    </g>

    <!-- Middle Split: MRP & Unit Sale Price (x: 52%, y: 42%, w: 42%, h: 22%) -->
    <g transform="translate(415, 225)">
      <rect width="325" height="120" rx="8" fill="#FFFFFF" stroke="#E2DCD2" stroke-width="1.5" />
      <text x="20" y="32" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#535953" letter-spacing="1">MAXIMUM RETAIL PRICE (MRP)</text>
      <text x="20" y="74" font-family="-apple-system, sans-serif" font-size="26" font-weight="900" fill="#1C201D">${mrp}</text>
      <text x="20" y="102" font-family="-apple-system, sans-serif" font-size="12" font-weight="600" fill="#7A827B">${unitPrice ? `Unit Sale Price: ${unitPrice}` : 'Inclusive of all taxes'}</text>
    </g>

    <!-- Bottom Section: Manufacturer & Traceability (x: 6%, y: 68%, w: 88%, h: 20%) -->
    <g transform="translate(60, 370)">
      <rect width="680" height="120" rx="8" fill="#FFFFFF" stroke="#E2DCD2" stroke-width="1.5" />
      <text x="24" y="30" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#535953" letter-spacing="1">MANUFACTURED &amp; PACKED BY:</text>
      <text x="24" y="52" font-family="-apple-system, sans-serif" font-size="14" font-weight="700" fill="#1C201D">${mfg}</text>
      <text x="24" y="72" font-family="-apple-system, sans-serif" font-size="12" font-weight="500" fill="#535953">${mfgAddr}</text>
      <text x="24" y="98" font-family="monospace" font-size="11" font-weight="600" fill="#52796F">Batch: ${batch} • Date: ${date} • Care: ${care}</text>
    </g>

    <!-- Bottom Compliance Seal Footer -->
    <text x="60" y="525" font-family="monospace" font-size="10" font-weight="600" fill="#7A827B">NIC-METROLOGY-NODE VERIFIED • CONSUMER PROTECTION WING</text>
    <text x="740" y="525" text-anchor="end" font-family="monospace" font-size="10" font-weight="600" fill="#7A827B">SEC 36/18 COMPLIANCE VERIFIED</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

