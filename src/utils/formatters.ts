import { Language } from '../types';

export const BN_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯'
};

export function toBnNumber(val: number | string): string {
  const str = String(val);
  return str.replace(/[0-9]/g, (digit) => BN_DIGITS[digit] || digit);
}

export function formatPrice(amount: number, lang: Language = 'bn'): string {
  const formatted = amount.toLocaleString('en-IN');
  if (lang === 'bn') {
    return `৳${toBnNumber(formatted)}`;
  }
  return `৳${formatted}`;
}

export function calculateDiscount(current: number, previous: number): number {
  if (!previous || previous <= current) return 0;
  return Math.round(((previous - current) / previous) * 100);
}

export function createWhatsAppProductUrl(phone: string, productName: string, price: number, quantity: number = 1): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const intPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;
  
  const text = `আসসালামু আলাইকুম! আমার ঘর Online থেকে আমি অর্ডার করতে চাই:\n\nপণ্য: ${productName}\nপরিমাণ: ${quantity} কেজি/পিস\nমূল্য: ৳${price * quantity}\n\nঅনুগ্রহ করে ডেলিভারি প্রক্রিয়া জানান। ধন্যবাদ।`;
  return `https://wa.me/${intPhone}?text=${encodeURIComponent(text)}`;
}

export function createWhatsAppCartUrl(phone: string, items: Array<{ nameBn: string; quantity: number; price: number }>, total: number): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const intPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;

  let text = `আসসালামু আলাইকুম! আমার ঘর Online থেকে আমার অর্ডারের তালিকা:\n\n`;
  items.forEach((item, index) => {
    text += `${index + 1}. ${item.nameBn} - ${item.quantity}টি (৳${item.price * item.quantity})\n`;
  });
  text += `\nমোট প্রদেয় টাকা: ৳${total}\n\nঅনুগ্রহ করে আমার অর্ডারটি নিশ্চিত করুন।`;
  return `https://wa.me/${intPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Resolves product image URLs, normalizing legacy /api/images/ to /uploads/ for Netlify and static deployments.
 */
export function resolveImageUrl(url?: string): string {
  if (!url) return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
  if (url.startsWith('/api/images/')) {
    return url.replace('/api/images/', '/uploads/');
  }
  return url;
}

/**
 * Parses weight multiplier from selected packaging size string (e.g. 450g -> 0.45, 500g -> 0.5, 2kg -> 2.0).
 * If the product is non-weight based (e.g. Piece/Standard Size), returns 1.0.
 */
export function getWeightMultiplier(selectedWeight?: string, unitBn?: string): number {
  const unitStr = String(unitBn || '').toLowerCase();
  const rawStr = String(selectedWeight || unitBn || '').toLowerCase().trim();

  // If item is non-weight based (e.g. piece, inch size)
  if (unitStr.includes('পিস') || unitStr.includes('piece')) {
    if (!rawStr.includes('g') && !rawStr.includes('গ্রাম') && !rawStr.includes('kg') && !rawStr.includes('কেজি')) {
      return 1.0;
    }
  }

  // Normalize Bengali digits to English
  const normalized = rawStr.replace(/[০-৯]/g, (d) => ({
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  }[d] || d));

  // Pure number check (e.g. "0.45" or "0.5")
  if (/^0\.\d+$/.test(normalized)) {
    const val = parseFloat(normalized);
    if (!isNaN(val) && val > 0) return val;
  }

  // Quarter kg / 250g / পোয়া
  if (
    normalized.includes('250g') ||
    normalized.includes('250 gm') ||
    normalized.includes('250 গ্রাম') ||
    normalized.includes('0.25') ||
    normalized.includes('পোয়া') ||
    normalized.includes('পোয়া')
  ) {
    return 0.25;
  }

  // Half kg / 500g
  if (
    normalized.includes('half') ||
    normalized.includes('হাফ') ||
    normalized.includes('আধা') ||
    normalized.includes('500g') ||
    normalized.includes('500 gm') ||
    normalized.includes('500 গ্রাম') ||
    normalized === '0.5' ||
    normalized.includes('0.5kg') ||
    normalized.includes('0.5 kg')
  ) {
    return 0.5;
  }

  // Specific jar/pack multiplier like 2 কৌটা (৯০০ গ্রাম)
  if (normalized.includes('২ কৌটা') || normalized.includes('2 কৌটা') || normalized.includes('2 jars') || normalized.includes('2 packs')) {
    const gmMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gram|গ্রাম)/i);
    if (gmMatch) {
      const val = parseFloat(gmMatch[1]);
      if (!isNaN(val) && val > 0) return val / 1000;
    }
  }

  // General Gram regex (e.g. 450g, 300g, 400g, 750g, 800g, 900g, ৪৫০ গ্রাম)
  const gmMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gram|গ্রাম)/i);
  if (gmMatch) {
    const val = parseFloat(gmMatch[1]);
    if (!isNaN(val) && val > 0) return val / 1000;
  }

  // Kg regex (e.g. 1.5 kg, 2 কেজি, 5kg, 1kg, 0.45 kg)
  const kgMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|কেজি|লিটার|ltr|l)/i);
  if (kgMatch) {
    const val = parseFloat(kgMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  return 1.0;
}

/**
 * Calculates the exact price for a given weight option based on base price.
 * For example: ৳2100/kg product:
 * - 450g -> ৳945 (2100 * 0.45)
 * - 500g -> ৳1050
 * - 900g -> ৳1890 (2 jars)
 * - 1kg -> ৳2100
 */
export function calculateItemPrice(basePrice: number, selectedWeight?: string, unitBn?: string): number {
  if (!basePrice || basePrice <= 0) return 0;
  const multiplier = getWeightMultiplier(selectedWeight, unitBn);
  return Math.round(basePrice * multiplier);
}

export function isWeightBasedProduct(product?: { unitBn?: string; unit?: string } | null): boolean {
  if (!product) return false;
  const u = String(product.unitBn || product.unit || '').toLowerCase();
  if (u.includes('পিস') || u.includes('piece')) return false;
  return (
    u.includes('কেজি') ||
    u.includes('kg') ||
    u.includes('গ্রাম') ||
    u.includes('gm') ||
    u.includes('লিটার') ||
    u.includes('ltr')
  );
}

export interface ExtractedPackWeight {
  grams: number;
  kg: number;
  labelBn: string;
  labelEn: string;
  containerType: 'jar' | 'pack' | 'bottle' | 'box' | 'general';
}

/**
 * Automatically extracts packaging or jar net weight from:
 * 1. product.weightKg (e.g. 0.45 = 450g, 0.3 = 300g, 0.4 = 400g)
 * 2. product.packWeight / product.netWeight
 * 3. product.descriptionBn / product.descriptionEn (e.g. "কৌটার ওজন ৪৫০ গ্রাম", "ওজন: ৩০০ গ্রাম", "৪৫০ গ্রাম কৌটা")
 * 4. product.unitBn / product.nameBn
 */
export function extractProductPackWeight(product: any): ExtractedPackWeight | null {
  if (!product) return null;

  // 1. Check weightKg if defined, positive, and not default 1 kg
  if (typeof product.weightKg === 'number' && product.weightKg > 0 && product.weightKg !== 1) {
    const kg = product.weightKg > 10 ? product.weightKg / 1000 : product.weightKg;
    const grams = Math.round(kg * 1000);
    if (grams > 0 && grams < 50000) {
      return {
        grams,
        kg,
        labelBn: `${toBnNumber(grams)} গ্রাম কৌটা/প্যাক`,
        labelEn: `${grams}g pack/jar`,
        containerType: 'jar'
      };
    }
  }

  // 2. Scan text fields: packWeight, netWeight, unitBn, descriptionBn, descriptionEn, nameBn
  const textToScan = [
    product.packWeight,
    product.netWeight,
    product.unitBn,
    product.descriptionBn,
    product.descriptionEn,
    product.nameBn
  ].filter(Boolean).join(' ');

  if (!textToScan) return null;

  // Normalize Bengali digits
  const normalized = textToScan.replace(/[০-৯]/g, (d) => ({
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  }[d] || d));

  // Pattern A: Explicit weight prefix (ওজন/নেট ওজন/কৌটার ওজন/জার ওজন/প্যাক সাইজ/net weight/pack size)
  const explicitMatch = normalized.match(/(?:ওজন|নেট\s*ওজন|কৌটার\s*ওজন|জার\s*ওজন|প্যাক\s*সাইজ|সাইজ|weight|net\s*wt|net\s*weight)[:\s]*([0-9]+(?:\.[0-9]+)?)\s*(গ্রাম|gm|g|কেজি|kg)/i);
  if (explicitMatch) {
    const val = parseFloat(explicitMatch[1]);
    const unit = explicitMatch[2].toLowerCase();
    const isKg = unit.includes('কেজি') || unit === 'kg';
    const grams = isKg ? Math.round(val * 1000) : Math.round(val);
    const kg = grams / 1000;
    if (grams > 0 && grams < 50000) {
      return {
        grams,
        kg,
        labelBn: `${toBnNumber(grams)} গ্রাম`,
        labelEn: `${grams}g`,
        containerType: 'jar'
      };
    }
  }

  // Pattern B: Container pattern (e.g. 450 গ্রাম কৌটা / 450g jar / 450 গ্রাম এর কৌটা)
  const containerMatch = normalized.match(/([0-9]{2,4})\s*(?:গ্রাম|gm|g)\s*(?:এর\s*)?(কৌটা|জার|প্যাক|বক্স|ডিব্বা|বোতল|কন্টেইনার|jar|pack|pot|can)/i);
  if (containerMatch) {
    const grams = parseInt(containerMatch[1], 10);
    const cType = containerMatch[2].toLowerCase();
    let containerType: ExtractedPackWeight['containerType'] = 'jar';
    if (cType.includes('প্যাক') || cType.includes('pack')) containerType = 'pack';
    if (cType.includes('বোতল') || cType.includes('bottle')) containerType = 'bottle';
    if (cType.includes('বক্স') || cType.includes('box')) containerType = 'box';

    if (grams > 0 && grams < 10000) {
      return {
        grams,
        kg: grams / 1000,
        labelBn: `${toBnNumber(grams)} গ্রাম ${containerMatch[2]}`,
        labelEn: `${grams}g ${cType}`,
        containerType
      };
    }
  }

  // Pattern C: Standalone gram mentions (e.g. 450 গ্রাম, 300 গ্রাম, 400 গ্রাম, 250 গ্রাম) but not 500g or 1000g
  const gramMatches = [...normalized.matchAll(/\b([0-9]{2,4})\s*(?:গ্রাম|gm|g)\b/gi)];
  for (const m of gramMatches) {
    const grams = parseInt(m[1], 10);
    if (grams > 0 && grams !== 500 && grams !== 1000 && grams < 10000) {
      return {
        grams,
        kg: grams / 1000,
        labelBn: `${toBnNumber(grams)} গ্রাম`,
        labelEn: `${grams}g`,
        containerType: 'general'
      };
    }
  }

  return null;
}

/**
 * Returns intelligent weight options for any product.
 * If product is a custom-weight pack (e.g. 450g container):
 * Returns: ['450g', '900g', '1kg'] with proportional prices automatically calculated.
 */
export function getProductWeightOptions(product: any): string[] {
  if (!product) return ['১ পিস'];
  if (!isWeightBasedProduct(product)) {
    return product.weightOptions && product.weightOptions.length > 0
      ? product.weightOptions
      : ['১ পিস'];
  }

  const detected = extractProductPackWeight(product);

  if (detected) {
    const packTag = `${detected.grams}g`;
    const existing = product.weightOptions ? [...product.weightOptions] : [];

    // Check if existing options already cover this pack size
    const hasPackTag = existing.some((opt: string) => {
      const mult = getWeightMultiplier(opt, product.unitBn);
      return Math.abs(mult - detected.kg) < 0.008;
    });

    if (hasPackTag) {
      // Put pack size at the front as primary default
      const sorted = [...existing];
      const idx = sorted.findIndex((opt: string) => Math.abs(getWeightMultiplier(opt, product.unitBn) - detected.kg) < 0.008);
      if (idx > 0) {
        const item = sorted.splice(idx, 1)[0];
        sorted.unshift(item);
      }
      return sorted;
    }

    // Build smart proportional packaging options:
    // Option 1: Detected pack size (e.g. 450g)
    // Option 2: 2 packs (e.g. 900g) if less than 1.5kg
    // Option 3: 1kg (loose / bulk)
    const options: string[] = [packTag];
    if (detected.grams * 2 <= 1000) {
      options.push(`${detected.grams * 2}g`);
    }
    options.push('1kg');

    return options;
  }

  // Standard weight-based options
  if (product.weightOptions && product.weightOptions.length > 0) {
    return product.weightOptions;
  }

  return ['500g', '1kg', '2kg'];
}

/**
 * Returns default selected weight option for a product.
 * If custom pack weight exists (e.g. 450g), defaults to 450g!
 * Otherwise defaults to 1kg or first option.
 */
export function getDefaultProductWeight(product: any): string {
  if (!product) return '১ কেজি';
  if (!isWeightBasedProduct(product)) {
    return product.weightOptions?.[0] || product.unitBn || '১ পিস';
  }

  const detected = extractProductPackWeight(product);
  if (detected) {
    return `${detected.grams}g`;
  }

  const options = getProductWeightOptions(product);
  return options.find((w: string) => w.toLowerCase().includes('1kg') || w.includes('১ কেজি')) || options[0] || '1kg';
}

/**
 * Converts selectedWeight string into numerical kilogram weight for courier and shipping.
 */
export function getItemWeightInKg(selectedWeight?: string, unitBn?: string): number {
  return getWeightMultiplier(selectedWeight, unitBn);
}

export function formatWeightLabel(weight: string, lang: Language = 'bn'): string {
  if (!weight) return '';
  const raw = String(weight).trim();
  const normalized = raw.replace(/[০-৯]/g, (d) => ({
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  }[d] || d)).toLowerCase();

  // 450g jar/pack
  if (normalized.includes('450')) {
    if (normalized.includes('কৌটা') || normalized.includes('জার') || normalized.includes('jar')) {
      return lang === 'bn' ? '৪৫০ গ্রাম (১ কৌটা)' : '450g (1 jar)';
    }
    return lang === 'bn' ? '৪৫০ গ্রাম' : '450g';
  }

  // 900g (2 jars)
  if (normalized.includes('900')) {
    return lang === 'bn' ? '৯০০ গ্রাম (২ কৌটা)' : '900g (2 jars)';
  }

  // 250g / quarter kg / পোয়া
  if (
    normalized.includes('250') ||
    normalized.includes('0.25') ||
    normalized.includes('পোয়া') ||
    normalized.includes('পোয়া')
  ) {
    return lang === 'bn' ? '২৫০ গ্রাম (১ পোয়া)' : '250g (Quarter kg)';
  }

  // 300g
  if (normalized.includes('300')) {
    return lang === 'bn' ? '৩০০ গ্রাম' : '300g';
  }

  // 400g
  if (normalized.includes('400')) {
    return lang === 'bn' ? '৪০০ গ্রাম' : '400g';
  }

  // 800g
  if (normalized.includes('800')) {
    return lang === 'bn' ? '৮০০ গ্রাম' : '800g';
  }

  // 500g / Half kg
  if (
    normalized.includes('500') ||
    normalized.includes('0.5') ||
    normalized.includes('0.50') ||
    normalized.includes('আধা') ||
    normalized.includes('হাফ')
  ) {
    return lang === 'bn' ? '০.৫০ কেজি (৫০০ গ্রাম)' : '0.50 kg (500g)';
  }

  if (normalized === '1kg' || normalized === '1 kg' || normalized === '1 কেজি' || normalized === '১ কেজি') {
    return lang === 'bn' ? '১ কেজি' : '1 kg';
  }

  if (normalized === '2kg' || normalized === '2 kg' || normalized === '2 কেজি' || normalized === '২ কেজি') {
    return lang === 'bn' ? '২ কেজি' : '2 kg';
  }

  if (normalized === '5kg' || normalized === '5 kg' || normalized === '5 কেজি' || normalized === '৫ কেজি') {
    return lang === 'bn' ? '৫ কেজি' : '5 kg';
  }

  // Generic gram matching (e.g. 350g, 150g, 750g)
  const gmMatch = normalized.match(/(\d+)\s*(?:g|gm|gram|গ্রাম)/i);
  if (gmMatch) {
    const val = parseInt(gmMatch[1], 10);
    return lang === 'bn' ? `${toBnNumber(val)} গ্রাম` : `${val}g`;
  }

  // Generic kg matching
  const kgMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:kg|কেজি)/i);
  if (kgMatch) {
    const val = parseFloat(kgMatch[1]);
    return lang === 'bn' ? `${toBnNumber(val)} কেজি` : `${val} kg`;
  }

  return raw;
}

/**
 * Intelligent Bengali and English product search matcher with synonyms and keyword expansions
 */
export function matchProductSearch(p: any, query: string): boolean {
  if (!query || !query.trim()) return true;
  const cleanQuery = query.trim().toLowerCase();
  const terms = cleanQuery.split(/\s+/).filter(Boolean);

  const nameBn = String(p.nameBn || '').toLowerCase();
  const nameEn = String(p.nameEn || '').toLowerCase();
  const catBn = String(p.categoryBn || '').toLowerCase();
  const cat = String(p.category || '').toLowerCase();
  const descBn = String(p.descriptionBn || '').toLowerCase();
  const descEn = String(p.descriptionEn || '').toLowerCase();
  const unitBn = String(p.unitBn || '').toLowerCase();
  const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';

  // Smart Bengali synonyms & keywords expansion
  let extraTerms = '';
  if (nameBn.includes('নাট') || nameBn.includes('মিক্স') || descBn.includes('বাদাম')) {
    extraTerms += ' বাদাম almond cashew nut nuts pistachio walnut বাদাম পেস্তা আখরোট কাজু কাঠবাদাম';
  }
  if (nameBn.includes('মধু') || catBn.includes('মধু') || descBn.includes('মধু')) {
    extraTerms += ' honey সুন্দরবন sundarban মধু চাক মৌমাছি খাঁটি natural pure';
  }
  if (nameBn.includes('ঘি') || catBn.includes('ঘি') || descBn.includes('ঘি')) {
    extraTerms += ' ghee গাওয়া বাটার মাখন butter cream pure';
  }
  if (nameBn.includes('তেল') || catBn.includes('তেল') || descBn.includes('তেল')) {
    extraTerms += ' oil mustard সরিষা সরিষার নারিকেল coconut ghani ঘানি কোল্ডপ্রেস';
  }
  if (nameBn.includes('খেজুর') || catBn.includes('খেজুর') || descBn.includes('খেজুর')) {
    extraTerms += ' dates আজওয়া আজওয়া সুক্কারি khezur khejur makkah madinah মদিনা';
  }
  if (nameBn.includes('আমসত্ত্ব') || nameBn.includes('চাটনি')) {
    extraTerms += ' mango chutney আম আমসত্ত্ব টক মিষ্টি আচার';
  }
  if (cat === 'home_decor' || catBn.includes('ডেকোর') || descBn.includes('হস্তশিল্প')) {
    extraTerms += ' decor ডেকোরেশন লাইট বাতি ল্যাম্প হস্তশিল্প পাট বাঁশ wall hanging lamp টেবিল লাইটিং শিল্প শো পিস আর্ট আলো';
  }

  const searchableText = `${nameBn} ${nameEn} ${catBn} ${cat} ${descBn} ${descEn} ${unitBn} ${tags} ${extraTerms}`;

  return terms.every((term) => searchableText.includes(term));
}

/**
 * Generates an absolute shareable landing page URL for any product.
 * Compatible with all hosting environments, SPA routing, and query fallbacks.
 */
export function getProductShareUrl(productId: string): string {
  if (typeof window === 'undefined') {
    return `/product/${productId}`;
  }
  const origin = window.location.origin;
  return `${origin}/product/${productId}`;
}

/**
 * Creates ready-to-use social share links for a product
 */
export function createSocialShareUrls(product: { id: string; nameBn: string; nameEn?: string; price: number }, lang: Language = 'bn') {
  const shareUrl = getProductShareUrl(product.id);
  const title = lang === 'bn' ? product.nameBn : (product.nameEn || product.nameBn);
  const priceText = formatPrice(product.price, lang);
  
  const textMsg = lang === 'bn'
    ? `আমার ঘর Online - ${title} (মূল্য: ${priceText})\nখাঁটি ও প্রাকৃতিক পণ্য সরাসরি ঘরে বসে অর্ডার করুন:\n${shareUrl}`
    : `Amar Ghor Online - ${title} (${priceText})\nOrder pure & authentic products now:\n${shareUrl}`;

  return {
    shareUrl,
    whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(textMsg)}`,
    facebookUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitterUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(textMsg)}`,
    textMsg
  };
}


