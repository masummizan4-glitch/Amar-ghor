import { CartItem, SiteSettings } from '../types/index';

export const BN_TO_EN_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function bnToEnNumber(str: string): string {
  return str.replace(/[০-৯]/g, (digit) => BN_TO_EN_DIGITS[digit] || digit);
}

/**
 * Parses item weight into kilograms based on selected weight string, product's weightKg, or unit
 */
export function parseItemWeightInKg(
  selectedWeight?: string,
  productWeightKg?: number,
  unitBn?: string
): number {
  const rawStr = (selectedWeight || '').toLowerCase().trim();
  if (rawStr) {
    const normalizedStr = bnToEnNumber(rawStr);

    // Common keywords for half kg
    if (
      normalizedStr.includes('half') ||
      normalizedStr.includes('হাফ') ||
      normalizedStr.includes('আধা') ||
      normalizedStr.includes('500g') ||
      normalizedStr.includes('500 gm') ||
      normalizedStr.includes('500 গ্রাম') ||
      normalizedStr.includes('0.5')
    ) {
      return 0.5;
    }

    // 250g / quarter kg
    if (
      normalizedStr.includes('250g') ||
      normalizedStr.includes('250 gm') ||
      normalizedStr.includes('250 গ্রাম') ||
      normalizedStr.includes('0.25') ||
      normalizedStr.includes('পোয়া') ||
      normalizedStr.includes('পোয়া')
    ) {
      return 0.25;
    }

    // Gram regex (e.g. 750g, 400 গ্রাম)
    const gmMatch = normalizedStr.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gram|গ্রাম)/i);
    if (gmMatch) {
      const val = parseFloat(gmMatch[1]);
      if (!isNaN(val) && val > 0) {
        return val / 1000;
      }
    }

    // Kg regex (e.g. 1.5 kg, 2 কেজি, 5kg)
    const kgMatch = normalizedStr.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|কেজি|লিটার|ltr|l)/i);
    if (kgMatch) {
      const val = parseFloat(kgMatch[1]);
      if (!isNaN(val) && val > 0) {
        return val;
      }
    }
  }

  if (typeof productWeightKg === 'number' && productWeightKg > 0) {
    return productWeightKg;
  }

  // Default fallback is 1.0 kg
  return 1.0;
}

export interface DeliveryCalculationResult {
  totalWeightKg: number;
  charge: number;
  breakdownBn: string;
  breakdownEn: string;
  pricingType: 'weight_based' | 'flat_zone';
}

/**
 * Calculates delivery fee based on weight or zone
 * Rule requested by user:
 * - Up to 0.5 kg (half kg): 120 TK
 * - Up to 1.0 kg (base): 140 TK
 * - Over 1.0 kg: +20 TK per additional kg (slab rounded up)
 */
export function calculateDeliveryCharge(
  items: Array<{ product?: any; quantity: number; selectedWeight?: string }>,
  district: string = '',
  settings?: Partial<SiteSettings>
): DeliveryCalculationResult {
  const isWeightBased = (settings?.deliveryPricingType ?? 'weight_based') === 'weight_based';
  const isDhaka = district.toLowerCase().includes('dhaka') || district.includes('ঢাকা');

  // Compute total weight across cart
  let totalWeightKg = 0;
  for (const item of items) {
    const unitWeight = parseItemWeightInKg(
      item.selectedWeight,
      item.product?.weightKg,
      item.product?.unitBn
    );
    totalWeightKg += unitWeight * (item.quantity || 1);
  }
  totalWeightKg = Math.round(totalWeightKg * 100) / 100;
  if (totalWeightKg <= 0) totalWeightKg = 1.0;

  if (!isWeightBased) {
    const charge = isDhaka
      ? (settings?.deliveryInsideDhaka ?? 70)
      : (settings?.deliveryOutsideDhaka ?? 130);
    return {
      totalWeightKg,
      charge,
      breakdownBn: isDhaka ? 'ঢাকার ভেতরে নির্ধারিত চার্জ' : 'ঢাকার বাইরে নির্ধারিত চার্জ',
      breakdownEn: isDhaka ? 'Standard Dhaka rate' : 'Outside Dhaka standard rate',
      pricingType: 'flat_zone',
    };
  }

  // Configurable weight-based rates with user defaults
  const halfKgRate = typeof settings?.deliveryHalfKgRate === 'number' && settings.deliveryHalfKgRate > 0
    ? settings.deliveryHalfKgRate
    : 120;
  const base1KgRate = typeof settings?.deliveryBase1KgRate === 'number' && settings.deliveryBase1KgRate > 0
    ? settings.deliveryBase1KgRate
    : 140;
  const extraPerKgRate = typeof settings?.deliveryExtraPerKgRate === 'number' && settings.deliveryExtraPerKgRate >= 0
    ? settings.deliveryExtraPerKgRate
    : 20;

  let charge = 0;
  let breakdownBn = '';
  let breakdownEn = '';

  if (totalWeightKg <= 0.5) {
    charge = halfKgRate;
    breakdownBn = `হাফ কেজি (≤ ০.৫ কেজি) কুরিয়ার চার্জ: ৳${halfKgRate}`;
    breakdownEn = `Half kg (≤ 0.5 kg) courier charge: ৳${halfKgRate}`;
  } else if (totalWeightKg <= 1.0) {
    charge = base1KgRate;
    breakdownBn = `১ কেজি পর্যন্ত কুরিয়ার চার্জ: ৳${base1KgRate}`;
    breakdownEn = `Up to 1 kg courier charge: ৳${base1KgRate}`;
  } else {
    const extraWeight = totalWeightKg - 1.0;
    const extraKgSlabs = Math.ceil(extraWeight);
    const extraCharge = extraKgSlabs * extraPerKgRate;
    charge = base1KgRate + extraCharge;
    breakdownBn = `১ম কেজি ৳${base1KgRate} + অতিরিক্ত ${extraKgSlabs} কেজিতে ৳${extraCharge} (৳${extraPerKgRate}/কেজি)`;
    breakdownEn = `1st kg ৳${base1KgRate} + ${extraKgSlabs} kg extra ৳${extraCharge} (৳${extraPerKgRate}/kg)`;
  }

  return {
    totalWeightKg,
    charge,
    breakdownBn,
    breakdownEn,
    pricingType: 'weight_based',
  };
}
