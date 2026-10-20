import { CustomerReview, ScreenshotReview } from '../types';

export const INITIAL_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-1',
    name: 'তানভীর আহমেদ',
    district: 'ঢাকা (Dhaka)',
    rating: 5,
    comment: 'আলহামদুলিল্লাহ, চাক ভাঙ্গা সুন্দরবনের মধুটা সত্যি অসাধারণ! ঘ্রাণ আর স্বাদেই বোঝা যায় আসল প্রাকৃতিক মধু। পরিবারের সবাই খুব পছন্দ করেছে।',
    productName: 'প্রাকৃতিক চাক ভাঙ্গা মধু',
    verifiedPurchase: true,
    createdAt: '2026-10-15T14:30:00.000Z',
    approved: true
  },
  {
    id: 'rev-2',
    name: 'রফিকুল ইসলাম',
    district: 'চট্টগ্রাম (Chattogram)',
    rating: 5,
    comment: 'ঘানি ভাঙ্গা সরিষার তেলের আসল ঝাঁজ অনেক দিন পর পেলাম। রান্নায় চমৎকার সুবাস ও স্বাদ এনে দেয়। ডেলিভারিও খুব দ্রুত পেয়েছি।',
    productName: 'ঘানি ভাঙ্গা সরিষার তেল',
    verifiedPurchase: true,
    createdAt: '2026-10-12T10:15:00.000Z',
    approved: true
  },
  {
    id: 'rev-3',
    name: 'আফরোজা বেগম',
    district: 'সিলেট (Sylhet)',
    rating: 5,
    comment: 'গাওয়া ঘিয়ের দানাদার টেক্সচার এবং সুবাস মনে করিয়ে দেয় শৈশবের খাঁটি খাবারের কথা। কাচের জারের প্যাকিং নিখুঁত ছিল।',
    productName: 'খাঁটি গাওয়া ঘি',
    verifiedPurchase: true,
    createdAt: '2026-10-09T18:45:00.000Z',
    approved: true
  },
  {
    id: 'rev-4',
    name: 'মাহফুজুর রহমান',
    district: 'কুমিল্লা (Cumilla)',
    rating: 5,
    comment: 'হানি নাটস মিক্স অর্ডার করেছিলাম। বাদামগুলো মচমচে এবং মধুর অনুপাত একদম ব্যালান্সড। শারীরিক শক্তির জন্য দারুণ উপকারী।',
    productName: 'প্রিমিয়াম হানি নাটস',
    verifiedPurchase: true,
    createdAt: '2026-10-05T09:20:00.000Z',
    approved: true
  },
  {
    id: 'rev-5',
    name: 'শারমিন সুলতানা',
    district: 'রাজশাহী (Rajshahi)',
    rating: 5,
    comment: 'সৌদি সুগাই খেজুরগুলো যেমন নরম তেমনই মিষ্টি। কোনো বালু বা পোকা ছিল না, একদম ফ্রেশ বক্স। ক্যাশ অন ডেলিভারি পেয়ে ভালো লেগেছে।',
    productName: 'স্পেশাল সৌদিয়া সুগাই খেজুর',
    verifiedPurchase: true,
    createdAt: '2026-09-28T16:10:00.000Z',
    approved: true
  },
  {
    id: 'rev-6',
    name: 'ইঞ্জিনিয়ার মোশাররফ হোসেন',
    district: 'ময়মনসিংহ (Mymensingh)',
    rating: 5,
    comment: 'হোম ডেকোরের হস্তশিল্প সামগ্রীটি আমাদের ড্রয়িং রুমের পরিবেশ সম্পূর্ণ বদলে দিয়েছে। দেশীয় পণ্যের এমন রুচিশীল উপস্থাপনা প্রশংসনীয়।',
    productName: 'আমার ঘর নান্দনিক হোম ডেকোর',
    verifiedPurchase: true,
    createdAt: '2026-09-22T11:05:00.000Z',
    approved: true
  }
];

export const INITIAL_SCREENSHOT_REVIEWS: ScreenshotReview[] = [
  {
    id: 'ss-1',
    imageUrl: '/reviews/whatsapp_review_1.jpg',
    platform: 'whatsapp',
    title: 'হোয়াটসঅ্যাপ চ্যাট রিভিউ',
    caption: '“ভাইয়া আপনাদের সুন্দরবনের মধু আর গাওয়া ঘি হাতে পেয়েছি, মাশাল্লাহ স্বাদ ও ঘ্রাণ অসাধারণ খাঁটি!”',
    customerName: 'রিনা করিম (ঢাকা)',
    rating: 5,
    featured: true,
    createdAt: '2026-10-16T12:00:00.000Z'
  },
  {
    id: 'ss-2',
    imageUrl: '/reviews/facebook_review_1.jpg',
    platform: 'facebook',
    title: 'ফেসবুক পেজ কাস্টমার রিকমেন্ডেশন',
    caption: '“সরিষার তেল ও খেজুর অর্ডার করেছিলাম। প্যাকেজিং খুব সুরক্ষিত ছিল এবং তেলের খাঁটি ঝাঁজ এক কথায় সেরা!”',
    customerName: 'সুমাইয়া আক্তার (ফরিদপুর)',
    rating: 5,
    featured: true,
    createdAt: '2026-10-14T08:30:00.000Z'
  }
];
