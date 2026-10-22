import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const dbFile = path.join(rootDir, 'data', 'db.json');

// Default initial products fallback
const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    nameBn: 'প্রাকৃতিক চাক ভাঙ্গা মধু',
    nameEn: 'Natural Honeycomb Honey',
    price: 1400,
    descriptionBn: 'সরাসরি বিশ্বস্ত মৌচাক থেকে সংগৃহীত কাঁচা ও সম্পূর্ণ ভেজালমুক্ত চাক ভাঙ্গা মধু। প্রাকৃতিক সুবাস ও মধুর নিখাদ গুণাগুণ অটুট রাখতে কোনো তাপ বা কৃত্রিম প্রক্রিয়াকরণ ছাড়াই বোতলজাত করা হয়।',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792005716/ChatGPT_Image_Sep_29_2026_09_43_29_PM.png']
  },
  {
    id: 'prod-2',
    nameBn: 'প্রিমিয়াম হানি নাটস',
    nameEn: 'Premium Honey Nuts',
    price: 1300,
    descriptionBn: 'খাঁটি মধুর সাথে রোস্টেড কাজুবাদাম, কাঠবাদাম, আখরোট ও বিভিন্ন প্রিমিয়াম ড্রাই ফ্রুটস ও বীজের অসাধারণ সংমিশ্রণ। প্রতিদিনের স্বাস্থ্যকর শক্তির সেরা উৎস।',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006036/1790695244373.png']
  },
  {
    id: 'prod-3',
    nameBn: 'প্রিমিয়াম সিড+নাট মিক্স',
    nameEn: 'Premium Seeds & Nuts Mix',
    price: 1500,
    descriptionBn: 'চিয়া সিড, মিষ্টি কুমড়ার বীজ, সূর্যমুখীর বীজ, তরমুজের বীজ এবং ড্রাই ফ্রুটস ও নাটসের উচ্চ ফাইবার এবং প্রোটিনসমৃদ্ধ স্বাস্থ্যকর মিশ্রণ।',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006038/1791915557629.jpg']
  },
  {
    id: 'prod-4',
    nameBn: 'খাঁটি দানাদার গাওয়া ঘি',
    nameEn: 'Pure Granular Gawa Ghee',
    price: 1600,
    descriptionBn: 'দেশি গাভীর দুধের খাঁটি মাখন থেকে ঐতিহ্যবাহী পদ্ধতিতে জ্বাল দিয়ে তৈরি খাঁটি দানাদার গাওয়া ঘি। তীব্র প্রাকৃতিক সুবাস ও অতুলনীয় স্বাদ।',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006041/1791915557618.jpg']
  },
  {
    id: 'prod-5',
    nameBn: 'ঘানি ভাঙ্গা সরিষার তেল',
    nameEn: 'Wood-Pressed Mustard Oil',
    price: 320,
    descriptionBn: 'কাঠের ঘানিতে ভাঙানো খাঁটি দেশি সরিষার ঝাঁঝালো তেল। কোনো কেমিক্যাল বা কৃত্রিম গন্ধ ছাড়াই খাঁটি প্রাকৃতিক উপায়ে তৈরি।',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006043/1791915557608.jpg']
  },
  {
    id: 'prod-6',
    nameBn: 'মদিনার ভিআইপি সুক্কারি খেজুর',
    nameEn: 'VIP Sukkari Dates',
    price: 950,
    descriptionBn: 'সরাসরি মদিনা মোনাওয়ারা থেকে আমদানিকৃত নরম, রসালো ও মিষ্টি ভিআইপি কোয়ালিটি সুক্কারি খেজুর।',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006044/1791915557597.jpg']
  },
  {
    id: 'prod-7',
    nameBn: 'মদিনার প্রিমিয়াম আজওয়া খেজুর',
    nameEn: 'Premium Ajwa Dates',
    price: 1250,
    descriptionBn: 'রাসূলুল্লাহ (সাঃ) এর প্রিয় মদিনা শরিফের বরকতময় ও রোগ প্রতিরোধক গুণসম্পন্ন আসল প্রিমিয়াম আজওয়া খেজুর।',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006046/1791915557588.jpg']
  },
  {
    id: 'prod-8',
    nameBn: 'খাঁটি এক্সট্রা ভার্জিন নারিকেল তেল',
    nameEn: 'Extra Virgin Coconut Oil',
    price: 650,
    descriptionBn: 'তাজা নারিকেলের কোল্ড-প্রেসড এক্সট্রা ভার্জিন তেল। চুল ও ত্বকের গভীর যত্নের পাশাপাশি রান্নার জন্যও উপযোগী।',
    images: ['https://res.cloudinary.com/hcmtg1sc/image/upload/v1792006047/1791915557579.jpg']
  },
  {
    id: 'prod-9',
    nameBn: 'হাতে তৈরি পাট ও বাঁশের রুচিশীল ল্যাম্পশেড',
    nameEn: 'Handcrafted Jute & Bamboo Lamp',
    price: 850,
    descriptionBn: 'গ্রাম বাংলার ঐতিহ্যবাহী শিল্পী দ্বারা নিপুণ হাতে বোনা ১০০% পরিবেশবান্ধব পাট ও বাঁশের তৈরি ইউনিক ডিজাইনের টেবিল ল্যাম্পশেড।',
    images: ['https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80']
  },
  {
    id: 'prod-10',
    nameBn: 'নান্দনিক ম্যাক্রাম ড্রিমক্যাচার ওয়াল হ্যাংগিং',
    nameEn: 'Boho Macrame Wall Hanging',
    price: 750,
    descriptionBn: 'খাঁটি কটন সুতা দিয়ে বোনা প্রিমিয়াম বোহেমিয়ান স্টাইল ওয়াল হ্যাংগিং আর্ট। বেডরুম ও ড্রয়িংরুমের নান্দনিকতা বাড়াতে অতুলনীয়।',
    images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80']
  }
];

function prerender() {
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.log('[Prerender] dist/index.html not found, skipping prerender.');
    return;
  }

  const baseHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

  let products = DEFAULT_PRODUCTS;
  if (fs.existsSync(dbFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
      if (Array.isArray(data.products) && data.products.length > 0) {
        products = data.products;
      }
    } catch (e) {
      console.warn('[Prerender] Could not read db.json:', e);
    }
  }

  console.log(`[Prerender] Pre-rendering ${products.length} product landing pages with OpenGraph metadata...`);

  for (const product of products) {
    const title = `${product.nameBn} - ৳${product.price} | আমার ঘর Online`;
    const desc = `${product.nameBn} - ${(product.descriptionBn || '').slice(0, 150)}... খাঁটি ও প্রাকৃতিক পণ্য ক্যাশ অন ডেলিভারিতে অর্ডার করুন।`;
    const imgUrl = product.images?.[0] || 'https://res.cloudinary.com/hcmtg1sc/image/upload/v1792005716/ChatGPT_Image_Sep_29_2026_09_43_29_PM.png';

    let productHtml = baseHtml
      .replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
      .replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${desc}" />`)
      .replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${title}" />`)
      .replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${desc}" />`)
      .replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${imgUrl}" />`)
      .replace(/<meta property="og:image:secure_url" content=".*?" \/>/i, `<meta property="og:image:secure_url" content="${imgUrl}" />`)
      .replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${title}" />`)
      .replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${desc}" />`)
      .replace(/<meta name="twitter:image" content=".*?" \/>/i, `<meta name="twitter:image" content="${imgUrl}" />`);

    const extraTags = `
    <meta property="og:url" content="/product/${product.id}" />
    <meta property="product:price:amount" content="${product.price}" />
    <meta property="product:price:currency" content="BDT" />`;
    productHtml = productHtml.replace('</head>', `${extraTags}\n  </head>`);

    // Write to dist/product/:id/index.html
    const targetDir = path.join(distDir, 'product', product.id);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'index.html'), productHtml, 'utf-8');

    // Also write to dist/p/:id/index.html (short link)
    const shortDir = path.join(distDir, 'p', product.id);
    fs.mkdirSync(shortDir, { recursive: true });
    fs.writeFileSync(path.join(shortDir, 'index.html'), productHtml, 'utf-8');
  }

  console.log(`[Prerender] Successfully generated static landing pages with rich OpenGraph tags for ${products.length} products!`);
}

prerender();
