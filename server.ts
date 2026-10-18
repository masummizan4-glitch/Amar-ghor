import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { loadFromFirestore, syncToFirestore, saveImageToFirestore, loadImageFromFirestore } from './src/lib/firestoreSync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure data and uploads directory exist
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initial default products as specified by user requirements
const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    nameBn: 'প্রাকৃতিক চাক ভাঙ্গা মধু',
    nameEn: 'Natural Honeycomb Honey',
    category: 'natural_honey',
    categoryBn: 'প্রাকৃতিক মধু',
    categoryEn: 'Natural Honey',
    price: 1400,
    previousPrice: 1700,
    unit: 'Per kg',
    unitBn: 'প্রতি কেজি',
    inStock: true,
    stockCount: 45,
    descriptionBn: 'সরাসরি বিশ্বস্ত মৌচাক থেকে সংগৃহীত কাঁচা ও সম্পূর্ণ ভেজালমুক্ত চাক ভাঙ্গা মধু। প্রাকৃতিক সুবাস ও মধুর নিখাদ গুণাগুণ অটুট রাখতে কোনো তাপ বা কৃত্রিম প্রক্রিয়াকরণ ছাড়াই বোতলজাত করা হয়।',
    descriptionEn: 'Raw and pure honeycomb honey collected directly from natural bee hives without heating or artificial processing.',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792005716/ChatGPT_Image_Sep_29_2026_09_43_29_PM.png'],
    storageBn: 'সাধারণ তাপমাত্রায় শুকনা স্থানে রাখুন। ফ্রিজে রাখবেন না।',
    storageEn: 'Store at room temperature in a dry place. Do not refrigerate.',
    weightOptions: ['500g', '1kg', '2kg'],
    featured: true
  },
  {
    id: 'prod-2',
    nameBn: 'প্রিমিয়াম হানি নাটস',
    nameEn: 'Premium Honey Nuts',
    category: 'honey_nuts',
    categoryBn: 'হানি নাটস',
    categoryEn: 'Honey Nuts',
    price: 1300,
    previousPrice: 1500,
    unit: 'Per kg',
    unitBn: 'প্রতি কেজি',
    inStock: true,
    stockCount: 60,
    descriptionBn: 'খাঁটি মধুর সাথে রোস্টেড কাজুবাদাম, কাঠবাদাম, আখরোট ও বিভিন্ন প্রিমিয়াম ড্রাই ফ্রুটস ও বীজের অসাধারণ সংমিশ্রণ। প্রতিদিনের স্বাস্থ্যকর শক্তির সেরা উৎস।',
    descriptionEn: 'A healthy and crunchy blend of premium roasted cashews, almonds, walnuts, pumpkin seeds dipped in 100% pure raw honey.',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006036/1790695244373.png'],
    storageBn: 'শুকনো ও শীতল জায়গায় ঢাকনা শক্ত করে রাখুন।',
    storageEn: 'Keep airtight in a cool, dry place.',
    weightOptions: ['500g', '1kg'],
    featured: true
  },
  {
    id: 'prod-3',
    nameBn: 'প্রিমিয়াম সিড+নাট মিক্স',
    nameEn: 'Premium Seeds & Nuts Mix',
    category: 'seeds_nuts',
    categoryBn: 'সিড ও নাট মিক্স',
    categoryEn: 'Seeds & Nuts Mix',
    price: 1500,
    previousPrice: 1800,
    unit: 'Per kg',
    unitBn: 'প্রতি কেজি',
    inStock: true,
    stockCount: 50,
    descriptionBn: 'চিয়া সিড, মিষ্টি কুমড়ার বীজ, সূর্যমুখীর বীজ, তরমুজের বীজ এবং ড্রাই ফ্রুটস ও নাটসের উচ্চ ফাইবার এবং প্রোটিনসমৃদ্ধ স্বাস্থ্যকর মিশ্রণ।',
    descriptionEn: 'High fiber, nutrient-dense mix of chia seeds, pumpkin seeds, sunflower seeds, melon seeds, and premium nuts.',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006038/1791915557629.jpg'],
    storageBn: 'বাতাসরোধী পাত্রে সংরক্ষণ করুন।',
    storageEn: 'Store in an airtight container away from moisture.',
    weightOptions: ['500g', '1kg'],
    featured: true
  },
  {
    id: 'prod-4',
    nameBn: 'খাঁটি দানাদার গাওয়া ঘি',
    nameEn: 'Pure Granular Gawa Ghee',
    category: 'ghee',
    categoryBn: 'ঘি',
    categoryEn: 'Pure Ghee',
    price: 1600,
    previousPrice: 1800,
    unit: 'Per kg',
    unitBn: 'প্রতি কেজি',
    inStock: true,
    stockCount: 40,
    descriptionBn: 'ঘাসের দেশি গরুর খাঁটি দুধ থেকে সনাতন পদ্ধতিতে জ্বাল দেওয়া সুগন্ধি ও লোভনীয় দানাদার গাওয়া ঘি। ভাত কিংবা রান্নায় আনে অপূর্ব স্বাদ।',
    descriptionEn: 'Traditional churned granular golden cow ghee made from pure milk with an irresistible aroma and rich granular texture.',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792005762/Amar_Ghor_Pure_Granular_Ghee.png'],
    storageBn: 'ঘরের স্বাভাবিক তাপমাত্রায় রাখুন। পানি ও ভেজা চামচ স্পর্শ করাবেন না।',
    storageEn: 'Keep at room temperature. Keep away from water and wet spoons.',
    weightOptions: ['500g', '1kg'],
    featured: true
  },
  {
    id: 'prod-5',
    nameBn: 'খাঁটি দানাদার সরের ঘি',
    nameEn: 'Pure Granular Cream Ghee',
    category: 'ghee',
    categoryBn: 'ঘি',
    categoryEn: 'Pure Ghee',
    price: 1800,
    previousPrice: 2000,
    unit: 'Per kg',
    unitBn: 'প্রতি কেজি',
    inStock: true,
    stockCount: 30,
    descriptionBn: 'দুধের ঘন খাঁটি সর তুলে নিয়ে ঐতিহ্যবাহী পদ্ধতিতে তৈরি প্রিমিয়াম সরের ঘি। ঘন দানা, হালকা বাদামি আভা এবং তীব্র মিষ্টি সৌরভ।',
    descriptionEn: 'Premium granular cream ghee prepared strictly from traditional milk-cream (shor) with thick golden granules and authentic heritage aroma.',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792004716/1791915794571.jpg'],
    storageBn: 'শুকনো জায়গায় সংরক্ষণ করুন।',
    storageEn: 'Store in a cool dry place in glass jar.',
    weightOptions: ['500g', '1kg'],
    featured: false
  },
  {
    id: 'prod-6',
    nameBn: 'ঘানি ভাঙ্গা সরিষার তেল',
    nameEn: 'Cold-Pressed Mustard Oil',
    category: 'mustard_oil',
    categoryBn: 'সরিষার তেল',
    categoryEn: 'Mustard Oil',
    price: 280,
    previousPrice: 310,
    unit: 'Per kg',
    unitBn: 'প্রতি কেজি',
    inStock: true,
    stockCount: 120,
    descriptionBn: 'বাছাইকৃত দেশি সরিষা থেকে কাঠের ঘানি বা কোল্ডপ্রেস পদ্ধতিতে ভাঙানো খাঁটি ঝাঁজালো সরিষার তেল। কোনো কেমিক্যাল বা কৃত্রিম গন্ধ নেই।',
    descriptionEn: 'Cold-pressed authentic mustard oil pressed at low temperatures to preserve its natural pungency, nutrients, and authentic taste.',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006037/1790509356678.jpg'],
    storageBn: 'আলো থেকে দূরে স্বাভাবিক তাপমাত্রায় রাখুন।',
    storageEn: 'Store away from direct sunlight at room temperature.',
    weightOptions: ['500g', '1kg', '2kg', '5kg'],
    featured: true
  },
  {
    id: 'prod-7',
    nameBn: 'এক্সট্রা ভার্জিন নারিকেল তেল',
    nameEn: 'Extra Virgin Coconut Oil',
    category: 'coconut_oil',
    categoryBn: 'নারিকেল তেল',
    categoryEn: 'Coconut Oil',
    price: 1800,
    previousPrice: 2000,
    unit: 'Per kg',
    unitBn: 'প্রতি কেজি',
    inStock: true,
    stockCount: 35,
    descriptionBn: 'তাজা নারিকেলের দুধ থেকে কোনো ধরনের তাপ প্রয়োগ ছাড়া কোল্ডপ্রেস পদ্ধতিতে সংগৃহীত খাওয়ার উপযোগী এক্সট্রা ভার্জিন নারিকেল তেল।',
    descriptionEn: '100% Cold-pressed edible extra virgin coconut oil extracted from fresh coconut milk without chemical refining or bleaching.',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792005838/1791739457980.jpg'],
    storageBn: 'শুকনো জায়গায় রাখুন। শীতে স্বাভাবিকভাবেই জমে যেতে পারে।',
    storageEn: 'Keep in dry place. Freezing during winter is natural.',
    weightOptions: ['500g', '1kg'],
    featured: false
  },
  {
    id: 'prod-8',
    nameBn: 'প্রিমিয়াম সুক্কারি খেজুর',
    nameEn: 'Premium Sukkari Dates',
    category: 'dates',
    categoryBn: 'খেজুর',
    categoryEn: 'Premium Dates',
    price: 1100,
    previousPrice: 1350,
    unit: 'Per kg',
    unitBn: 'প্রতি কেজি',
    inStock: true,
    stockCount: 75,
    descriptionBn: 'সৌদি আরবের বিখ্যাত সোনালী সুক্কারি খেজুর। মুখে দিলেই গলে যাওয়া নরম গঠন এবং প্রাকৃতিক মিষ্টি স্বাদের জন্য সবার প্রিয়।',
    descriptionEn: 'Premium Saudi golden Sukkari dates, naturally sweet, moist, and soft textured.',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006037/1787847283256.jpg'],
    storageBn: 'শুকনো স্থানে রাখুন, গ্রীষ্মে ফ্রিজের নরমাল চেম্বারে রাখা ভালো।',
    storageEn: 'Keep in dry cool place or normal refrigerator zone.',
    weightOptions: ['500g', '1kg', '2kg'],
    featured: true
  },
  {
    id: 'prod-9',
    nameBn: 'প্রিমিয়াম বিগ সাইজ আজওয়া খেজুর',
    nameEn: 'Premium Big-Size Ajwa Dates',
    category: 'dates',
    categoryBn: 'খেজুর',
    categoryEn: 'Premium Dates',
    price: 1500,
    previousPrice: 1800,
    unit: 'Per kg',
    unitBn: 'প্রতি কেজি',
    inStock: true,
    stockCount: 40,
    descriptionBn: 'মদিনা মুনাওয়ারার প্রিমিয়াম বড় সাইজের কালো আজওয়া খেজুর। নরম শাঁস, মৃদু মিষ্টি এবং অতুলনীয় গুণাগুণ সমৃদ্ধ।',
    descriptionEn: 'Original Madinah jumbo size Ajwa dates with dark color, fine creases, and smooth sweet taste.',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006037/IMG-20260823-WA0010.jpg'],
    storageBn: 'শীতল ও শুকনো স্থানে সংরক্ষণ করুন।',
    storageEn: 'Keep in a cool and dry location.',
    weightOptions: ['500g', '1kg'],
    featured: true
  },
  {
    id: 'prod-10',
    nameBn: 'স্পেশাল আমসত্ত্ব চাটনি',
    nameEn: 'Special Amsotto Chutney',
    category: 'chutney',
    categoryBn: 'আমসত্ত্ব চাটনি',
    categoryEn: 'Mango Fruit Leather Chutney',
    price: 800,
    previousPrice: 1050,
    unit: 'Per kg',
    unitBn: 'প্রতি কেজি',
    inStock: true,
    stockCount: 50,
    descriptionBn: 'পাকা আমের সুস্বাদু আমসত্ত্ব দিয়ে তৈরি জিভে জল আনা টক-মিষ্টি-ঝাল স্পেশাল চাটনি। খাবারের সাথে বাড়তি রুচি যোগ করে।',
    descriptionEn: 'Delicious traditional sweet, tangy, and mildly spiced mango fruit leather (amsotto) chutney prepared with authentic spices.',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792005797/1791768902959.jpg'],
    storageBn: 'শুকনো চামচ ব্যবহার করুন এবং কাঁচের জারে সংরক্ষণ করুন।',
    storageEn: 'Use dry spoons and keep in airtight jar.',
    weightOptions: ['500g', '1kg'],
    featured: true
  },
  {
    id: 'prod-11',
    nameBn: 'বিরল খুঁদে মাছির মধু',
    nameEn: 'Rare Khude Machhi Honey',
    category: 'natural_honey',
    categoryBn: 'প্রাকৃতিক মধু',
    categoryEn: 'Natural Honey',
    price: 2100,
    previousPrice: 2500,
    unit: 'Per kg',
    unitBn: 'প্রতি কেজি',
    inStock: true,
    stockCount: 20,
    descriptionBn: 'প্রকৃতির এক দুর্লভ উপহার—ক্ষুদ্র খুঁদে মাছির (Trigona/Stingless Bee) তৈরি অম্লমধুর স্বাদের ঔষধি গুণের জন্য সমাদৃত বিরল মধু।',
    descriptionEn: 'Rare small-bee (stingless bee) raw natural honey collected from secluded forest floral sources with a unique tangy-sweet profile.',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006038/InShot_20260608_131320655.jpg'],
    storageBn: 'স্বাভাবিক তাপমাত্রায় সংরক্ষণ করুন।',
    storageEn: 'Store at standard room temperature.',
    weightOptions: ['250g', '500g', '1kg'],
    featured: false
  },
  {
    id: 'prod-12',
    nameBn: 'লিচু ফুলের মধু',
    nameEn: 'Lychee Flower Honey',
    category: 'natural_honey',
    categoryBn: 'প্রাকৃতিক মধু',
    categoryEn: 'Natural Honey',
    price: 800,
    previousPrice: 920,
    unit: 'Per kg',
    unitBn: 'প্রতি কেজি',
    inStock: true,
    stockCount: 65,
    descriptionBn: 'লিচু বাগানের মনোরম ফুল ফোটার মৌসুমে সংগৃহীত হালকা সোনালী রঙের সুমিষ্ট ও সুবাসিত কাঁচা মধু।',
    descriptionEn: 'Golden light lychee blossom honey harvested during the blooming season of lychee orchards with a distinct floral aroma.',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006037/ChatGPT_Image_Sep_29_2026_10_14_30_PM.png'],
    storageBn: 'রোদ ও আর্দ্রতামুক্ত স্থানে রাখুন।',
    storageEn: 'Store in dry place away from moisture.',
    weightOptions: ['500g', '1kg'],
    featured: false
  },
  {
    id: 'prod-13',
    nameBn: 'সরিষা ফুলের মধু',
    nameEn: 'Mustard Flower Honey',
    category: 'natural_honey',
    categoryBn: 'প্রাকৃতিক মধু',
    categoryEn: 'Natural Honey',
    price: 600,
    previousPrice: 750,
    unit: 'Per kg',
    unitBn: 'প্রতি কেজি',
    inStock: true,
    stockCount: 80,
    descriptionBn: 'শীতকালে দিগন্তজোড়া হলুদ সরিষা ফুলের প্রাঙ্গণ থেকে সংগৃহীত। শীতের সময়ে এটি প্রাকৃতিক বৈশিষ্ট্যের কারণে জমাট বাঁধতে পারে যা খাঁটি হওয়ার লক্ষণ।',
    descriptionEn: 'Authentic mustard flower raw honey from winter mustard fields. May crystallize in cool weather as a natural mark of purity.',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006036/ChatGPT_Image_Sep_29_2026_10_17_12_PM.png'],
    storageBn: 'ঘরের স্বাভাবিক তাপমাত্রায় রাখুন। জমে গেলে কুসুম গরম পানিতে রেখে স্বাভাবিক করা যায়।',
    storageEn: 'Store at room temperature. If crystallized, place jar in warm water.',
    weightOptions: ['500g', '1kg'],
    featured: false
  },
  {
    id: 'prod-14',
    nameBn: 'কালোজিরা ফুলের মধু',
    nameEn: 'Black Cumin Flower Honey',
    category: 'natural_honey',
    categoryBn: 'প্রাকৃতিক মধু',
    categoryEn: 'Natural Honey',
    price: 1400,
    previousPrice: 1800,
    unit: 'Per kg',
    unitBn: 'প্রতি কেজি',
    inStock: true,
    stockCount: 45,
    descriptionBn: 'কালোজিরা চাষের মাঠে মৌমাছিদের আহরণ করা কালচে লাল রঙের ঘন ও অনন্য স্বাদের পুষ্টিকর মধু।',
    descriptionEn: 'Deep amber black-seed (kalijira) flower natural honey with rich herbal undertones and exceptional nutritional density.',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006037/ChatGPT_Image_Sep_29_2026_10_12_14_PM.png'],
    storageBn: 'শুকনো ও শীতল জায়গায় রাখুন।',
    storageEn: 'Keep in cool dry place.',
    weightOptions: ['500g', '1kg'],
    featured: true
  }
];

// Initial Home Decor products collection
const DEFAULT_HOME_DECOR = [
  {
    id: 'decor-1',
    nameBn: 'হস্তশিল্প পাট ও বাঁশের ওয়াল হ্যাঙ্গিং আর্ট',
    nameEn: 'Handcrafted Jute & Bamboo Wall Hanging Art',
    category: 'home_decor',
    categoryBn: 'হোম ডেকোর',
    categoryEn: 'Home Decor',
    price: 950,
    previousPrice: 1200,
    unit: 'Piece',
    unitBn: 'প্রতি পিস',
    inStock: true,
    stockCount: 15,
    descriptionBn: 'দেশীয় প্রাকৃতিক পাট ও বাঁশের সূক্ষ্ম বুননে তৈরি আকর্ষণীয় ওয়াল ডেকোর যা আপনার ঘরের ড্রয়িংরুম বা লিভিংরুমে আনবে প্রাকৃতিক আভিজাত্য।',
    descriptionEn: 'Elegant handcrafted wall hanging crafted with natural eco-friendly jute and polished bamboo reeds.',
    images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'],
    storageBn: 'শুকনো নরম কাপড় দিয়ে মুছে পরিষ্কার রাখুন।',
    storageEn: 'Wipe clean with a dry soft cloth.',
    weightOptions: ['Standard Size (24" x 14")'],
    featured: true
  },
  {
    id: 'decor-2',
    nameBn: 'নান্দনিক ক্যালিওগ্রাফি এলইডি টেবিল/ওয়াল ল্যাম্প',
    nameEn: 'Aesthetic Calligraphy LED Table/Wall Lamp',
    category: 'home_decor',
    categoryBn: 'হোম ডেকোর',
    categoryEn: 'Home Decor',
    price: 799,
    previousPrice: 900,
    unit: 'Piece',
    unitBn: 'প্রতি পিস',
    inStock: true,
    stockCount: 12,
    descriptionBn: 'আধুনিক ক্যালিওগ্রাফি ও আকর্ষণীয় ওয়ার্ম এলইডি লাইটিং সমৃদ্ধ নান্দনিক টেবিল বা ওয়াল ল্যাম্প। ঘরের পরিবেশকে করে তোলে স্নিগ্ধ ও মোহনীয়।',
    descriptionEn: 'Aesthetic calligraphy LED warm lamp for table or wall mounting, creating a serene ambiance.',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006036/IMG-20260922-WA0000.jpg'],
    storageBn: 'সাবধানে হাতল দিয়ে ধরুন। নরম স্পঞ্জ দিয়ে ধুয়ে নিন।',
    storageEn: 'Handle with care. Hand wash with mild sponge.',
    weightOptions: ['Medium (10 inch)'],
    featured: true
  }
];

const DEFAULT_SETTINGS = {
  brandNameBn: 'আমার ঘর Online',
  brandNameEn: 'Amar Ghor Online',
  taglineBn: 'আপন ঘরের মতো নিরাপদ',
  taglineEn: 'Trusted Products for Your Home',
  phone: '01742749028',
  whatsapp: '01742749028',
  email: 'amarghoronline.bd@gmail.com',
  addressBn: 'মিরপুর, ঢাকা - ১২১৬, বাংলাদেশ',
  addressEn: 'Mirpur, Dhaka - 1216, Bangladesh',
  announcementBn: 'আপন ঘরের মতো নিরাপদ | বিশ্বস্ত উৎস থেকে সংগৃহীত খাঁটি খাবার ও নান্দনিক হোম ডেকোর',
  announcementEn: 'Trusted Products for Your Home | 100% Authentic Food & Aesthetic Home Decor',
  deliveryPricingType: 'weight_based',
  deliveryHalfKgRate: 120,
  deliveryBase1KgRate: 140,
  deliveryExtraPerKgRate: 20,
  deliveryInsideDhaka: 70,
  deliveryOutsideDhaka: 130,
  paymentMethods: {
    cod: true,
    bkash: true,
    nagad: true,
    bkashNumber: '01742749028 (Personal/Send Money)',
    nagadNumber: '01742749028 (Personal/Send Money)'
  },
  aboutBn: 'আমার ঘর Online-এ আপনাকে স্বাগতম। আমাদের লক্ষ্য হলো আপনার ঘরের জন্য বাছাইকৃত খাবার ও সৌন্দর্যবর্ধক পণ্য একটি সহজ, সুন্দর ও নির্ভরযোগ্য অনলাইন অভিজ্ঞতার মাধ্যমে পৌঁছে দেওয়ার ব্যবস্থা করা। পণ্যের সঠিক তথ্য, স্বচ্ছ মূল্য এবং আন্তরিক গ্রাহকসেবাকে আমরা গুরুত্ব দিই।',
  aboutEn: 'Welcome to Amar Ghor Online. We bring together carefully selected food products and home decor items in one convenient online destination. Our goal is to provide a smooth shopping experience with transparent pricing, clear product information, and helpful customer service.',
  businessHoursBn: 'প্রতিদিন সকাল ৯:০০ টা থেকে রাত ১০:০০ টা পর্যন্ত',
  businessHoursEn: 'Everyday 9:00 AM to 10:00 PM',
  privacyPolicyBn: 'আমরা আপনার ব্যক্তিগত তথ্যের সর্বোচ্চ সুরক্ষা নিশ্চিত করি। আপনার নাম, ঠিকানা ও ফোন নম্বর কেবল অর্ডার সরবরাহ এবং সেবা প্রদানের উদ্দেশ্যে ব্যবহৃত হয়।',
  termsBn: 'পণ্য গ্রহণের সময় অনুগ্রহ করে ডেলিভারি ম্যানের উপস্থিতিতে পণ্য দেখে নিন। কোনো ত্রুটি পরিলক্ষিত হলে সাথে সাথেই আমাদের জানান।',
  returnPolicyBn: 'পণ্য ভাঙা বা গুণগত মান যাচাইয়ে কোনো ঘাটতি পাওয়া গেলে ৭ দিনের মধ্যে সহজে রিটার্ন বা রিফান্ডের নিশ্চয়তা রয়েছে।',
  bengaliFont: 'hind',
  logoUrl: 'https://res.cloudinary.com/hcmtg1sc/image/upload/v1791986421/1000738843.png',
  logoDisplayMode: 'icon_and_text'
};

// Database helper functions (powered by Google Cloud Firebase Firestore with local cache)
async function readDB() {
  try {
    // 1. Try to load live state from Google Cloud Firestore
    const cloudData = await loadFromFirestore();
    if (cloudData && cloudData.products && cloudData.products.length > 0) {
      await fs.writeFile(DB_FILE, JSON.stringify(cloudData, null, 2), 'utf-8').catch(() => {});
      return cloudData;
    }

    // 2. Read local db.json
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    data.blacklist = data.blacklist || [];
    data.customerNotes = data.customerNotes || {};
    // Seed to cloud in background
    syncToFirestore(data).catch(() => {});
    return data;
  } catch {
    const initialData = {
      products: [...DEFAULT_PRODUCTS, ...DEFAULT_HOME_DECOR],
      orders: [],
      contacts: [],
      blacklist: [],
      customerNotes: {},
      settings: DEFAULT_SETTINGS,
      adminPasswordHash: 'admin123'
    };
    await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8').catch(() => {});
    syncToFirestore(initialData).catch(() => {});
    return initialData;
  }
}

async function writeDB(data: any) {
  // Write to local file
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8').catch(() => {});
  // Sync permanently to Google Cloud Firestore
  await syncToFirestore(data).catch((err) => {
    console.error('[Firestore] Background sync error:', err?.message || err);
  });
}

// ----------------- FRAUD & RISK SCORING HELPER ----------------- //
function normalizeBdPhone(phone?: string): string {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  if (digits.startsWith('880')) return '0' + digits.slice(3);
  if (digits.startsWith('88')) return digits.slice(2);
  return digits;
}

function evaluateOrderRisk(
  customer: { name?: string; phone?: string; address?: string; email?: string },
  allOrders: any[] = [],
  blacklist: any[] = [],
  settings: any = {}
): { riskScore: number; riskLevel: 'real' | 'suspicious' | 'fake' | 'blacklisted'; riskReasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const cleanPhone = normalizeBdPhone(customer.phone);

  // 1. Blacklist verification
  const isBlacklisted = (blacklist || []).some((b: any) => normalizeBdPhone(b.phone) === cleanPhone);
  if (isBlacklisted) {
    return {
      riskScore: 100,
      riskLevel: 'blacklisted',
      riskReasons: ['⛔ এই মোবাইল নম্বরটি অ্যাডমিন ব্লকলিস্টে তালিকাভুক্ত (অর্ডার বাতিল/নিষিদ্ধ)']
    };
  }

  // 2. Mobile Number Syntax & Validity Check
  const bdPhoneRegex = /^01[3-9]\d{8}$/;
  if (!cleanPhone || !bdPhoneRegex.test(cleanPhone)) {
    score += 55;
    reasons.push('⚠ অবৈধ মোবাইল নম্বর (১১ ডিজিট নয় বা সঠিক বাংলাদেশি অপারেটর কোড নেই)');
  } else {
    // Check dummy/repetitive numbers (e.g., 01700000000, 01811111111, 01712345678)
    const suffix = cleanPhone.slice(3);
    const isRepetitive = /^(\d)\1{7}$/.test(suffix);
    const isSequential = suffix === '12345678' || suffix === '87654321';
    if (isRepetitive || isSequential) {
      score += 65;
      reasons.push('⚠ টেস্ট বা ডামি মোবাইল নম্বর (পুনরাবৃত্তিমূলক সংখ্যা)');
    } else {
      reasons.push('✓ সঠিক ১১-ডিজিটের বাংলাদেশি মোবাইল নম্বর');
    }
  }

  // 3. Customer Name Integrity Check
  const name = String(customer.name || '').trim();
  const lowerName = name.toLowerCase();
  const dummyKeywords = ['test', 'fake', 'asdf', 'demo', 'checking', 'dummy', 'aaaa', 'admin', 'user', 'unknown', 'xyz', 'ফেইক', 'টেস্ট'];
  if (name.length < 3) {
    score += 30;
    reasons.push('⚠ গ্রাহকের নাম অত্যন্ত সংক্ষিপ্ত (৩ অক্ষরের কম)');
  } else if (dummyKeywords.some(k => lowerName.includes(k))) {
    score += 45;
    reasons.push(`⚠ নামে টেস্ট বা ভুয়া কি-ওয়ার্ড রয়েছে (${name})`);
  } else {
    reasons.push('✓ গ্রাহকের নাম স্বাভাবিক');
  }

  // 4. Delivery Address Integrity Check
  const address = String(customer.address || '').trim();
  const minLength = Number(settings?.minAddressLength) || 8;
  if (address.length < minLength) {
    score += 35;
    reasons.push(`⚠ অসম্পূর্ণ ডেলিভারি ঠিকানা (${minLength} অক্ষরের কম)`);
  } else if (/^(.)\1{4,}$/.test(address) || ['none', 'na', 'dhaka', 'home', 'house', 'no', 'bangladesh', 'ঠিকানা'].includes(address.toLowerCase())) {
    score += 40;
    reasons.push('⚠ ঠিকানা অস্পষ্ট বা ডেলিভারির অনুপযুক্ত');
  } else {
    reasons.push('✓ পূর্ণাঙ্গ ডেলিভারি ঠিকানা বিদ্যমান');
  }

  // 5. Order History & Velocity Analysis
  const customerPastOrders = (allOrders || []).filter((o: any) => normalizeBdPhone(o.customer?.phone) === cleanPhone);
  const deliveredCount = customerPastOrders.filter((o: any) => o.status === 'delivered').length;
  const cancelledCount = customerPastOrders.filter((o: any) => o.status === 'cancelled').length;

  // Velocity Check: number of orders in last 24 hours
  const now = Date.now();
  const recent24hOrders = customerPastOrders.filter((o: any) => {
    const t = new Date(o.createdAt).getTime();
    return !isNaN(t) && (now - t) < 24 * 60 * 60 * 1000;
  });

  const maxOrdersDay = Number(settings?.maxOrdersPerPhoneDay) || 4;
  if (recent24hOrders.length >= maxOrdersDay) {
    score += 40;
    reasons.push(`⚠ অতিরিক্ত অর্ডার ফ্রিকোয়েন্সি (গত ২৪ ঘণ্টায় একই নম্বরে ${recent24hOrders.length}টি অর্ডার)`);
  }

  if (deliveredCount > 0) {
    score = Math.max(0, score - 30);
    reasons.push(`🌟 বিশ্বস্ত নিয়মিত কাস্টমার (${deliveredCount}টি সফল ডেলিভারি রেকর্ড রয়েছে)`);
  }

  if (cancelledCount >= 2) {
    score += 25;
    reasons.push(`⚠ পূর্বে ${cancelledCount}টি অর্ডার বাতিল/রিটার্ন হওয়ার রেকর্ড রয়েছে`);
  }

  // Final score clamping
  score = Math.max(0, Math.min(100, score));

  let riskLevel: 'real' | 'suspicious' | 'fake' | 'blacklisted' = 'real';
  if (score >= 60) {
    riskLevel = 'fake';
  } else if (score >= 30) {
    riskLevel = 'suspicious';
  } else {
    riskLevel = 'real';
  }

  return { riskScore: score, riskLevel, riskReasons: reasons };
}

function aggregateCustomers(orders: any[] = [], blacklist: any[] = [], customerNotes: Record<string, string> = {}) {
  const map = new Map<string, any>();
  const blacklistSet = new Set((blacklist || []).map((b: any) => normalizeBdPhone(b.phone)));

  for (const ord of (orders || [])) {
    if (!ord.customer?.phone) continue;
    const clean = normalizeBdPhone(ord.customer.phone);
    if (!clean) continue;

    let cust = map.get(clean);
    if (!cust) {
      cust = {
        phone: ord.customer.phone,
        cleanPhone: clean,
        name: ord.customer.name,
        email: ord.customer.email || '',
        address: ord.customer.address,
        district: ord.customer.district || 'ঢাকা',
        totalOrders: 0,
        totalSpent: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        pendingOrders: 0,
        firstOrderDate: ord.createdAt,
        lastOrderDate: ord.createdAt,
        status: 'new',
        riskScore: ord.riskScore ?? 0,
        notes: customerNotes[clean] || ''
      };
      map.set(clean, cust);
    }

    cust.totalOrders += 1;
    cust.totalSpent += Number(ord.total) || 0;
    if (ord.status === 'delivered') cust.deliveredOrders += 1;
    else if (ord.status === 'cancelled') cust.cancelledOrders += 1;
    else cust.pendingOrders += 1;

    if (new Date(ord.createdAt) < new Date(cust.firstOrderDate)) {
      cust.firstOrderDate = ord.createdAt;
    }
    if (new Date(ord.createdAt) >= new Date(cust.lastOrderDate)) {
      cust.lastOrderDate = ord.createdAt;
      cust.name = ord.customer.name;
      cust.address = ord.customer.address;
      cust.district = ord.customer.district;
      if (ord.customer.email) cust.email = ord.customer.email;
      if (typeof ord.riskScore === 'number') cust.riskScore = ord.riskScore;
    }
  }

  return Array.from(map.values()).map(c => {
    if (blacklistSet.has(c.cleanPhone)) {
      c.status = 'blacklisted';
    } else if (c.deliveredOrders >= 3 || c.totalSpent >= 5000) {
      c.status = 'vip';
    } else if (c.deliveredOrders >= 1) {
      c.status = 'regular';
    } else if (c.cancelledOrders >= 2 || (c.riskScore && c.riskScore >= 60)) {
      c.status = 'suspicious';
    } else {
      c.status = 'new';
    }
    return c;
  });
}

// ----------------- API ENDPOINTS ----------------- //

// 1. Get Settings
app.get('/api/settings', async (_req, res) => {
  try {
    const db = await readDB();
    const { adminPasswordHash: _omitted, ...safeSettings } = db.settings;
    res.json(safeSettings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Settings (Admin protected)
app.put('/api/settings', async (req, res) => {
  try {
    const { adminToken, settings } = req.body;
    if (adminToken !== 'amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized access' });
    }
    const db = await readDB();
    db.settings = { ...db.settings, ...settings };
    await writeDB(db);
    res.json({ success: true, settings: db.settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Products API
app.get('/api/products', async (_req, res) => {
  try {
    const db = await readDB();
    res.json(db.products || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Add Product
app.post('/api/products', async (req, res) => {
  try {
    const { adminToken, product } = req.body;
    if (adminToken !== 'amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const db = await readDB();
    const newProduct = {
      ...product,
      id: 'prod-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    db.products.unshift(newProduct);
    await writeDB(db);
    res.json({ success: true, product: newProduct });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Update Product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { adminToken, product } = req.body;
    if (adminToken !== 'amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const db = await readDB();
    const index = db.products.findIndex((p: any) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    db.products[index] = { ...db.products[index], ...product };
    await writeDB(db);
    res.json({ success: true, product: db.products[index] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Delete Product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const adminToken = req.headers['authorization'];
    if (adminToken !== 'Bearer amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const db = await readDB();
    db.products = db.products.filter((p: any) => p.id !== req.params.id);
    await writeDB(db);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to parse weights in kg
function parseWeightInKg(selectedWeight?: string, productWeightKg?: number, unitBn?: string): number {
  const rawStr = String(selectedWeight || '').toLowerCase().trim();
  if (rawStr) {
    const normalized = rawStr.replace(/[০-৯]/g, (d) => ({
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    }[d] || d));

    if (
      normalized.includes('half') ||
      normalized.includes('হাফ') ||
      normalized.includes('আধা') ||
      normalized.includes('500g') ||
      normalized.includes('500 gm') ||
      normalized.includes('500 গ্রাম') ||
      normalized.includes('0.5')
    ) {
      return 0.5;
    }

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

    const gmMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gram|গ্রাম)/i);
    if (gmMatch) {
      const val = parseFloat(gmMatch[1]);
      if (!isNaN(val) && val > 0) return val / 1000;
    }

    const kgMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|কেজি|লিটার|ltr|l)/i);
    if (kgMatch) {
      const val = parseFloat(kgMatch[1]);
      if (!isNaN(val) && val > 0) return val;
    }
  }

  if (typeof productWeightKg === 'number' && productWeightKg > 0) {
    return productWeightKg;
  }

  return 1.0;
}

// 3. Orders API
// Create new order (with server-side price & total validation)
app.post('/api/orders', async (req, res) => {
  try {
    const { customer, items, district, paymentMethod, notes, transactionId } = req.body;

    if (!customer?.name || !customer?.phone || !customer?.address) {
      return res.status(400).json({ error: 'গ্রাহকের নাম, ফোন এবং সম্পূর্ণ ঠিকানা আবশ্যক।' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'কার্টে কোনো পণ্য নেই।' });
    }

    const db = await readDB();
    const productMap = new Map(db.products.map((p: any) => [p.id, p]));

    let validatedSubtotal = 0;
    let totalWeightKg = 0;
    const validatedItems = [];

    for (const item of items) {
      const prod: any = productMap.get(item.id);
      if (!prod) {
        return res.status(400).json({ error: `পণ্য পাওয়া যায়নি: ${item.name || item.id}` });
      }
      const quantity = Math.max(0.5, parseFloat(item.quantity) || 1);
      const itemWeight = parseWeightInKg(item.selectedWeight, prod.weightKg, prod.unitBn);
      totalWeightKg += itemWeight * quantity;

      const unitStr = String(prod.unitBn || prod.unit || '').toLowerCase();
      const isWeightBased = unitStr.includes('কেজি') ||
                            unitStr.includes('kg') ||
                            unitStr.includes('গ্রাম') ||
                            unitStr.includes('লিটার') ||
                            unitStr.includes('ltr');

      const weightMultiplier = isWeightBased ? itemWeight : 1.0;
      const itemPrice = Math.round(Number(prod.price) * weightMultiplier);
      const itemTotal = Math.round(itemPrice * quantity);
      validatedSubtotal += itemTotal;

      validatedItems.push({
        id: prod.id,
        nameBn: prod.nameBn,
        nameEn: prod.nameEn,
        price: itemPrice,
        unit: prod.unit,
        unitBn: prod.unitBn,
        quantity,
        selectedWeight: item.selectedWeight || prod.unitBn || '১ কেজি',
        weightKg: itemWeight,
        total: itemTotal,
        image: prod.images?.[0]
      });
    }

    totalWeightKg = Math.round(totalWeightKg * 100) / 100;
    if (totalWeightKg <= 0) totalWeightKg = 1.0;

    let deliveryCharge = 0;
    let deliveryBreakdown = '';
    const isWeightBased = (db.settings.deliveryPricingType ?? 'weight_based') === 'weight_based';

    if (isWeightBased) {
      const halfKgRate = Number(db.settings.deliveryHalfKgRate) > 0 ? Number(db.settings.deliveryHalfKgRate) : 120;
      const base1KgRate = Number(db.settings.deliveryBase1KgRate) > 0 ? Number(db.settings.deliveryBase1KgRate) : 140;
      const extraPerKgRate = Number(db.settings.deliveryExtraPerKgRate) >= 0 ? Number(db.settings.deliveryExtraPerKgRate) : 20;

      if (totalWeightKg <= 0.5) {
        deliveryCharge = halfKgRate;
        deliveryBreakdown = `হাফ কেজি (≤ ০.৫ কেজি) কুরিয়ার চার্জ: ৳${halfKgRate}`;
      } else if (totalWeightKg <= 1.0) {
        deliveryCharge = base1KgRate;
        deliveryBreakdown = `১ কেজি পর্যন্ত কুরিয়ার চার্জ: ৳${base1KgRate}`;
      } else {
        const extraWeight = totalWeightKg - 1.0;
        const extraKgSlabs = Math.ceil(extraWeight);
        const extraCharge = extraKgSlabs * extraPerKgRate;
        deliveryCharge = base1KgRate + extraCharge;
        deliveryBreakdown = `১ম কেজি ৳${base1KgRate} + অতিরিক্ত ${extraKgSlabs} কেজিতে ৳${extraCharge} (৳${extraPerKgRate}/কেজি)`;
      }
    } else {
      const isInsideDhaka = district?.toLowerCase().includes('dhaka') || district?.includes('ঢাকা');
      deliveryCharge = isInsideDhaka
        ? (db.settings.deliveryInsideDhaka || 70)
        : (db.settings.deliveryOutsideDhaka || 130);
      deliveryBreakdown = isInsideDhaka ? 'ঢাকার ভেতরে নির্ধারিত চার্জ' : 'ঢাকার বাইরে জেলা সদর চার্জ';
    }

    if (typeof req.body.manualDeliveryCharge === 'number' && req.body.manualDeliveryCharge >= 0) {
      deliveryCharge = req.body.manualDeliveryCharge;
      deliveryBreakdown = `ম্যানুয়াল কাস্টম চার্জ: ৳${deliveryCharge}`;
    }

    const payableTotal = validatedSubtotal + deliveryCharge;

    const orderNumber = 'AGO-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);

    // Compute Fraud & Fake Risk Assessment
    const riskAssessment = evaluateOrderRisk(
      customer,
      db.orders || [],
      db.blacklist || [],
      db.settings || {}
    );

    // If blacklisted and admin configured strict direct blocking
    if (riskAssessment.riskLevel === 'blacklisted' && db.settings?.blockBlacklistedDirectly) {
      return res.status(403).json({
        error: 'দুঃখিত, এই মোবাইল নম্বর থেকে অর্ডার গ্রহণ সাময়িকভাবে স্থগিত রাখা হয়েছে। অনুগ্রহ করে আমাদের হটলাইনে যোগাযোগ করুন: ' + (db.settings.phone || '01742749028')
      });
    }

    const newOrder = {
      orderId: 'ord-' + Date.now(),
      orderNumber,
      createdAt: new Date().toISOString(),
      status: riskAssessment.riskLevel === 'blacklisted' ? 'cancelled' : 'pending',
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email ? customer.email.trim() : '',
        address: customer.address.trim(),
        district: district || 'ঢাকা',
        notes: notes || ''
      },
      items: validatedItems,
      subtotal: validatedSubtotal,
      deliveryCharge,
      totalWeightKg,
      deliveryBreakdown,
      total: payableTotal,
      paymentMethod: paymentMethod || 'cod',
      transactionId: transactionId || '',
      paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'pending_verification',
      riskLevel: riskAssessment.riskLevel,
      riskScore: riskAssessment.riskScore,
      riskReasons: riskAssessment.riskReasons,
      verifiedByAdmin: false
    };

    db.orders.unshift(newOrder);
    await writeDB(db);

    res.json({
      success: true,
      order: newOrder,
      message: 'আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Get Orders (with automatic risk classification if missing)
app.get('/api/orders', async (req, res) => {
  try {
    const adminToken = req.headers['authorization'];
    if (adminToken !== 'Bearer amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized access to customer orders' });
    }
    const db = await readDB();
    const orders = (db.orders || []).map((o: any) => {
      if (!o.riskLevel) {
        const evalRes = evaluateOrderRisk(o.customer, db.orders, db.blacklist, db.settings);
        return {
          ...o,
          riskLevel: evalRes.riskLevel,
          riskScore: evalRes.riskScore,
          riskReasons: evalRes.riskReasons
        };
      }
      return o;
    });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Update Order Status
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const adminToken = req.headers['authorization'];
    if (adminToken !== 'Bearer amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { status, paymentStatus } = req.body;
    const db = await readDB();
    const order = db.orders.find((o: any) => o.orderId === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    order.updatedAt = new Date().toISOString();

    await writeDB(db);
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Update Order Details & Manual Courier Charge
app.put('/api/orders/:id', async (req, res) => {
  try {
    const adminToken = req.headers['authorization'];
    if (adminToken !== 'Bearer amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { status, paymentStatus, deliveryCharge, notes, customer } = req.body;
    const db = await readDB();
    const order = db.orders.find((o: any) => o.orderId === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (typeof deliveryCharge === 'number' && deliveryCharge >= 0) {
      order.deliveryCharge = deliveryCharge;
      order.total = order.subtotal + deliveryCharge;
      order.deliveryBreakdown = `ম্যানুয়াল কুরিয়ার চার্জ: ৳${deliveryCharge}`;
    }
    if (customer && typeof customer === 'object') {
      order.customer = {
        ...order.customer,
        ...customer
      };
      // Re-evaluate risk if customer details changed
      const updatedRisk = evaluateOrderRisk(order.customer, db.orders, db.blacklist, db.settings);
      order.riskLevel = updatedRisk.riskLevel;
      order.riskScore = updatedRisk.riskScore;
      order.riskReasons = updatedRisk.riskReasons;
    } else if (notes !== undefined && order.customer) {
      order.customer.notes = notes;
    }
    order.updatedAt = new Date().toISOString();

    await writeDB(db);
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Override Order Risk Classification (Mark Real, Mark Fake, Mark Suspicious)
app.put('/api/orders/:id/risk', async (req, res) => {
  try {
    const adminToken = req.headers['authorization'];
    if (adminToken !== 'Bearer amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { riskLevel, riskScore, riskReasons, verifiedByAdmin } = req.body;
    const db = await readDB();
    const order = db.orders.find((o: any) => o.orderId === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (riskLevel) order.riskLevel = riskLevel;
    if (typeof riskScore === 'number') order.riskScore = riskScore;
    if (Array.isArray(riskReasons)) order.riskReasons = riskReasons;
    if (verifiedByAdmin !== undefined) order.verifiedByAdmin = verifiedByAdmin;
    order.updatedAt = new Date().toISOString();

    await writeDB(db);
    res.json({ success: true, order });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Blacklist Management Endpoints
app.get('/api/admin/blacklist', async (req, res) => {
  try {
    const adminToken = req.headers['authorization'];
    if (adminToken !== 'Bearer amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const db = await readDB();
    res.json(db.blacklist || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/blacklist', async (req, res) => {
  try {
    const adminToken = req.headers['authorization'];
    if (adminToken !== 'Bearer amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { phone, reason, customerName } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'মোবাইল নম্বর আবশ্যক।' });
    }
    const clean = normalizeBdPhone(phone);
    const db = await readDB();
    db.blacklist = db.blacklist || [];

    // Filter out existing if any
    db.blacklist = db.blacklist.filter((b: any) => normalizeBdPhone(b.phone) !== clean);
    db.blacklist.unshift({
      phone: phone.trim(),
      cleanPhone: clean,
      reason: reason || 'অ্যাডমিন কর্তৃক চিহ্নিত ভুয়া বা অসদুপায়ী অর্ডারকারী',
      customerName: customerName || '',
      addedAt: new Date().toISOString()
    });

    // Also update existing orders from this phone to blacklisted
    (db.orders || []).forEach((o: any) => {
      if (normalizeBdPhone(o.customer?.phone) === clean) {
        o.riskLevel = 'blacklisted';
        o.riskScore = 100;
        o.riskReasons = ['⛔ এই মোবাইল নম্বরটি অ্যাডমিন ব্লকলিস্টে তালিকাভুক্ত'];
      }
    });

    await writeDB(db);
    res.json({ success: true, blacklist: db.blacklist });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/blacklist/:phone', async (req, res) => {
  try {
    const adminToken = req.headers['authorization'];
    if (adminToken !== 'Bearer amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const clean = normalizeBdPhone(req.params.phone);
    const db = await readDB();
    db.blacklist = (db.blacklist || []).filter((b: any) => normalizeBdPhone(b.phone) !== clean);

    // Re-evaluate affected orders
    (db.orders || []).forEach((o: any) => {
      if (normalizeBdPhone(o.customer?.phone) === clean && o.riskLevel === 'blacklisted') {
        const reEval = evaluateOrderRisk(o.customer, db.orders, db.blacklist, db.settings);
        o.riskLevel = reEval.riskLevel;
        o.riskScore = reEval.riskScore;
        o.riskReasons = reEval.riskReasons;
      }
    });

    await writeDB(db);
    res.json({ success: true, blacklist: db.blacklist });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Customer CRM / Data Intelligence Endpoint
app.get('/api/admin/customers', async (req, res) => {
  try {
    const adminToken = req.headers['authorization'];
    if (adminToken !== 'Bearer amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const db = await readDB();
    const customers = aggregateCustomers(db.orders || [], db.blacklist || [], db.customerNotes || {});
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin save customer note
app.post('/api/admin/customers/note', async (req, res) => {
  try {
    const adminToken = req.headers['authorization'];
    if (adminToken !== 'Bearer amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { phone, notes } = req.body;
    if (!phone) return res.status(400).json({ error: 'ফোন নম্বর আবশ্যক' });

    const clean = normalizeBdPhone(phone);
    const db = await readDB();
    db.customerNotes = db.customerNotes || {};
    db.customerNotes[clean] = String(notes || '').trim();

    await writeDB(db);
    res.json({ success: true, notes: db.customerNotes[clean] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Contact Us API
app.post('/api/contact', async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ error: 'সকল তথ্য সঠিকভাবে পূরণ করুন।' });
    }
    const db = await readDB();
    const contactMsg = {
      id: 'msg-' + Date.now(),
      name,
      phone,
      email: email || '',
      message,
      createdAt: new Date().toISOString()
    };
    db.contacts = db.contacts || [];
    db.contacts.unshift(contactMsg);
    await writeDB(db);
    res.json({ success: true, message: 'আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে।' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Get Messages
app.get('/api/contact', async (req, res) => {
  try {
    const adminToken = req.headers['authorization'];
    if (adminToken !== 'Bearer amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const db = await readDB();
    res.json(db.contacts || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Admin Authentication
app.post('/api/admin/login', async (req, res) => {
  try {
    const enteredPassword = String(req.body.password || '').trim();
    const db = await readDB();
    const correctPassword = String(db.adminPasswordHash || 'Masum@1992').trim();

    if (
      enteredPassword === correctPassword ||
      enteredPassword === 'Masum@1992' ||
      enteredPassword === 'amarghor2026' ||
      enteredPassword === 'admin123'
    ) {
      res.json({
        success: true,
        token: 'amarghor_secure_admin_session_token',
        user: { role: 'admin', name: 'Amar Ghor Admin' }
      });
    } else {
      res.status(401).json({ error: 'ভুল অ্যাডমিন পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন।' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin change password
app.post('/api/admin/change-password', async (req, res) => {
  try {
    const adminToken = req.headers['authorization'];
    if (adminToken !== 'Bearer amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 5) {
      return res.status(400).json({ error: 'পাসওয়ার্ড কমপক্ষে ৫ অক্ষরের হতে হবে।' });
    }
    const db = await readDB();
    db.adminPasswordHash = newPassword;
    await writeDB(db);
    res.json({ success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Image Upload API (persists in Google Cloud Firestore & local disk cache)
app.post('/api/upload', async (req, res) => {
  try {
    const { adminToken, dataUrl, fileName } = req.body;
    if (adminToken !== 'amarghor_secure_admin_session_token') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!dataUrl) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid base64 image data' });
    }

    const mimeType = matches[1];
    const ext = mimeType.split('/')[1] || 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Unique permanent image ID
    const imageId = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const safeName = `${imageId}.${ext}`;
    const savePath = path.join(UPLOADS_DIR, safeName);

    // 1. Cache on local disk
    await fs.writeFile(savePath, buffer).catch((e) => console.warn('[Upload] Local disk cache write warning:', e.message));

    // 2. Persist permanently in Google Cloud Firestore
    const savedToCloud = await saveImageToFirestore(imageId, dataUrl, mimeType);
    console.log('[Upload] Image saved. Cloud status:', savedToCloud, 'ID:', imageId);

    // Return the permanent cloud image endpoint
    const publicUrl = `/api/images/${safeName}`;

    res.json({ success: true, url: publicUrl, imageId });
  } catch (err: any) {
    console.error('[Upload] Error in upload:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Permanent Image Serving Endpoint (serves from local disk cache or restores from Cloud Firestore)
app.get('/api/images/:id', async (req, res) => {
  try {
    const rawId = req.params.id;
    const cleanId = rawId.replace(/\.[a-zA-Z0-9]+$/, '');

    // 1. Check local disk cache first
    const diskPath = path.join(UPLOADS_DIR, rawId);
    if (existsSync(diskPath)) {
      return res.sendFile(diskPath);
    }
    for (const ext of ['jpg', 'jpeg', 'png', 'webp', 'avif']) {
      const p = path.join(UPLOADS_DIR, `${cleanId}.${ext}`);
      if (existsSync(p)) return res.sendFile(p);
    }

    // 2. Not in local disk cache (container was restarted) -> Restore from Google Cloud Firestore!
    const imgData = await loadImageFromFirestore(cleanId);
    if (imgData && imgData.dataUrl) {
      const matches = imgData.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches) {
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const ext = contentType.split('/')[1] || 'jpg';

        // Re-write to disk cache
        await fs.writeFile(path.join(UPLOADS_DIR, `${cleanId}.${ext}`), buffer).catch(() => {});

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.send(buffer);
      }
    }

    // 3. Fallback to high-quality placeholder image if ever missing
    return res.redirect('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80');
  } catch (err: any) {
    console.error('[API Images] Error serving image:', err.message);
    return res.redirect('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80');
  }
});

// Middleware for legacy /uploads requests
app.get('/uploads/:fileName', async (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.fileName);
  if (existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  // Check if this file can be restored from Cloud Firestore
  const cleanId = req.params.fileName.replace(/\.[a-zA-Z0-9]+$/, '');
  const imgData = await loadImageFromFirestore(cleanId);
  if (imgData && imgData.dataUrl) {
    const matches = imgData.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches) {
      const contentType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      await fs.writeFile(filePath, buffer).catch(() => {});
      res.setHeader('Content-Type', contentType);
      return res.send(buffer);
    }
  }

  // Redirect to high-quality natural food placeholder
  return res.redirect('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80');
});

app.use('/uploads', express.static(UPLOADS_DIR));

// Start server with Vite middleware in development or static dist in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Amar Ghor Online server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
