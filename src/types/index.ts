export type Language = 'bn' | 'en';

export interface Product {
  id: string;
  nameBn: string;
  nameEn: string;
  category: string;
  categoryBn: string;
  categoryEn: string;
  price: number;
  previousPrice: number;
  unit: string;
  unitBn: string;
  inStock: boolean;
  stockCount: number;
  descriptionBn: string;
  descriptionEn: string;
  images: string[];
  storageBn?: string;
  storageEn?: string;
  weightOptions?: string[];
  weightKg?: number;
  featured?: boolean;
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedWeight: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address: string;
  district: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  nameBn: string;
  nameEn: string;
  price: number;
  unit: string;
  unitBn: string;
  quantity: number;
  selectedWeight: string;
  weightKg?: number;
  total: number;
  image?: string;
}

export interface Order {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  totalWeightKg?: number;
  deliveryBreakdown?: string;
  total: number;
  paymentMethod: 'cod' | 'bkash' | 'nagad';
  transactionId?: string;
  paymentStatus: 'unpaid' | 'paid' | 'pending_verification';
  riskLevel?: 'real' | 'suspicious' | 'fake' | 'blacklisted';
  riskScore?: number; // 0 (100% genuine) to 100 (high risk fake)
  riskReasons?: string[];
  verifiedByAdmin?: boolean;
}

export interface BlacklistEntry {
  phone: string;
  reason: string;
  addedAt: string;
  customerName?: string;
}

export interface CustomerProfile {
  phone: string;
  name: string;
  email?: string;
  address: string;
  district: string;
  totalOrders: number;
  totalSpent: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  firstOrderDate: string;
  lastOrderDate: string;
  status: 'vip' | 'regular' | 'new' | 'suspicious' | 'blacklisted';
  riskScore?: number;
  notes?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  createdAt: string;
}

export interface CustomerReview {
  id: string;
  name: string;
  district?: string;
  rating: number; // 1 to 5
  comment: string;
  productName?: string;
  verifiedPurchase?: boolean;
  createdAt: string;
  approved?: boolean;
}

export interface ScreenshotReview {
  id: string;
  imageUrl: string;
  platform: 'whatsapp' | 'facebook' | 'messenger' | 'google' | 'other';
  title?: string;
  caption?: string;
  customerName?: string;
  rating?: number;
  featured?: boolean;
  createdAt: string;
}

export interface SiteFeatures {
  showAnnouncement?: boolean;
  showLanguageSwitcher?: boolean;
  showFontSwitcher?: boolean;
  showSearchBar?: boolean;
  showHeroSection?: boolean;
  showCategoryBar?: boolean;
  showHomeDecorSection?: boolean;
  showTrustBanner?: boolean;
  showReviewsSection?: boolean;
  showScreenshotReviews?: boolean;
  showAboutSection?: boolean;
  showContactSection?: boolean;
  showFloatingWhatsApp?: boolean;
  showProductWhatsAppBtn?: boolean;
  showStockBadge?: boolean;
  showCheckoutEmailField?: boolean;
  enableOrderNotes?: boolean;
}

export interface SiteSettings {
  brandNameBn: string;
  brandNameEn: string;
  taglineBn: string;
  taglineEn: string;
  phone: string;
  whatsapp: string;
  email: string;
  addressBn: string;
  addressEn: string;
  announcementBn: string;
  announcementEn: string;
  deliveryPricingType?: 'weight_based' | 'flat_zone';
  deliveryHalfKgRate?: number;
  deliveryBase1KgRate?: number;
  deliveryExtraPerKgRate?: number;
  deliveryInsideDhaka: number;
  deliveryOutsideDhaka: number;
  paymentMethods: {
    cod: boolean;
    bkash: boolean;
    nagad: boolean;
    bkashNumber: string;
    nagadNumber: string;
  };
  features?: SiteFeatures;
  // Hero customizations
  heroBadgeBn?: string;
  heroBadgeEn?: string;
  heroHeadlineBn?: string;
  heroHeadlineEn?: string;
  heroSubheadlineBn?: string;
  heroSubheadlineEn?: string;
  // Trust banner 3 cards customizations
  trustCard1TitleBn?: string;
  trustCard1TitleEn?: string;
  trustCard1DescBn?: string;
  trustCard1DescEn?: string;
  trustCard2TitleBn?: string;
  trustCard2TitleEn?: string;
  trustCard2DescBn?: string;
  trustCard2DescEn?: string;
  trustCard3TitleBn?: string;
  trustCard3TitleEn?: string;
  trustCard3DescBn?: string;
  trustCard3DescEn?: string;
  aboutBn: string;
  aboutEn: string;
  businessHoursBn: string;
  businessHoursEn: string;
  privacyPolicyBn: string;
  termsBn: string;
  returnPolicyBn: string;
  bengaliFont?: 'hind' | 'noto' | 'anek' | 'tiro';
  logoUrl?: string;
  logoDisplayMode?: 'icon_and_text' | 'image_only';
  // Fraud & Security settings
  enableFakeDetection?: boolean;
  blockBlacklistedDirectly?: boolean;
  minAddressLength?: number;
  maxOrdersPerPhoneDay?: number;
  screenshotReviews?: ScreenshotReview[];
}
