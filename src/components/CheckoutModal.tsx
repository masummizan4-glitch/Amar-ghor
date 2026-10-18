import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, Printer, MessageCircle, AlertCircle, Loader2, Truck, Scale, Plus, Minus } from 'lucide-react';
import { CartItem, Language, SiteSettings, Order } from '../types';
import { formatPrice, toBnNumber, calculateItemPrice, formatWeightLabel, isWeightBasedProduct, getProductWeightOptions, extractProductPackWeight } from '../utils/formatters';
import { calculateDeliveryCharge } from '../utils/delivery';
import { BrandLogo } from './BrandLogo';
import { saveOrderToCloud } from '../lib/clientFirebase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderSuccess: (order: Order) => void;
  lang: Language;
  settings: SiteSettings;
  onUpdateQuantity?: (productId: string, quantity: number, selectedWeight?: string) => void;
}

export const BD_DISTRICTS = [
  'ঢাকা (Dhaka)',
  'চট্টগ্রাম (Chattogram)',
  'রাজশাহী (Rajshahi)',
  'সিলেট (Sylhet)',
  'খুলনা (Khulna)',
  'বরিশাল (Barishal)',
  'রংপুর (Rangpur)',
  'ময়মনসিংহ (Mymensingh)',
  'গাজীপুর (Gazipur)',
  'নারায়ণগঞ্জ (Narayanganj)',
  'কুমিল্লা (Cumilla)',
  'বগুড়া (Bogura)',
  'ফরিদপুর (Faridpur)',
  'যশোর (Jashore)',
  'কুষ্টিয়া (Kushtia)',
  'দিনাজপুর (Dinajpur)',
  'অন্যান্য জেলা (Other District)'
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
  lang,
  settings,
  onUpdateQuantity
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('ঢাকা (Dhaka)');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad'>('cod');
  const [transactionId, setTransactionId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const getItemUnitPrice = (item: CartItem) => calculateItemPrice(item.product.price, item.selectedWeight, item.product.unitBn);
  const subtotal = items.reduce((acc, item) => acc + getItemUnitPrice(item) * item.quantity, 0);

  const deliveryInfo = calculateDeliveryCharge(items, district, settings);
  const deliveryCharge = deliveryInfo.charge;
  const grandTotal = subtotal + deliveryCharge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(lang === 'bn' ? 'অনুগ্রহ করে আপনার নাম লিখুন।' : 'Please enter your name.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 11 || !/^01[3-9]\d{8}$/.test(cleanPhone)) {
      setError(
        lang === 'bn'
          ? 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01742749028)।'
          : 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01742749028).'
      );
      return;
    }

    const minAddr = settings?.minAddressLength || 8;
    if (address.trim().length < minAddr) {
      setError(
        lang === 'bn'
          ? `অনুগ্রহ করে সম্পূর্ণ ডেলিভারি ঠিকানা দিন (কমপক্ষে ${minAddr} অক্ষর, যেমন: বাড়ি নং, রোড নং, এলাকা/উপজেলা)।`
          : `Please enter a complete delivery address (at least ${minAddr} characters).`
      );
      return;
    }

    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !transactionId.trim()) {
      setError(
        lang === 'bn'
          ? 'মোবাইল ব্যাংকিংয়ের ট্রানজেকশন আইডি (TrxID) প্রদান করুন।'
          : 'Please provide the transaction ID.'
      );
      return;
    }

    setLoading(true);

    try {
      let createdOrderObj: Order | null = null;
      const orderPayload = {
        customer: {
          name,
          phone,
          email,
          address,
          district,
          notes
        },
        items: items.map((i) => ({
          id: i.product.id,
          nameBn: i.product.nameBn,
          quantity: i.quantity,
          selectedWeight: i.selectedWeight
        })),
        district,
        paymentMethod,
        transactionId,
        notes,
        manualDeliveryCharge: deliveryCharge
      };

      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await response.json();
            if (data.success && data.order) {
              createdOrderObj = data.order;
            }
          }
        }
      } catch (e) {
        console.warn('API /api/orders failed, switching to cloud/local fallback:', e);
      }

      // If backend was unreachable (e.g. running statically on Netlify), construct order and save to Firestore
      if (!createdOrderObj) {
        const orderNumber = 'AGO-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
        createdOrderObj = {
          orderId: 'ord-' + Date.now(),
          orderNumber,
          createdAt: new Date().toISOString(),
          status: 'pending',
          customer: {
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            address: address.trim(),
            district,
            notes: notes.trim()
          },
          items: items.map((i) => {
            const unitPrice = calculateItemPrice(i.product.price, i.selectedWeight, i.product.unitBn);
            return {
              id: i.product.id,
              nameBn: i.product.nameBn,
              nameEn: i.product.nameEn,
              price: unitPrice,
              unit: i.product.unit,
              unitBn: i.product.unitBn,
              quantity: i.quantity,
              selectedWeight: i.selectedWeight,
              total: unitPrice * i.quantity,
              image: i.product.images?.[0] || ''
            };
          }),
          subtotal,
          deliveryCharge,
          total: grandTotal,
          paymentMethod,
          transactionId,
          paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'pending_verification'
        };

        // Persist to Cloud Firestore so store owner receives the order
        await saveOrderToCloud(createdOrderObj).catch((e) => console.warn('Cloud order write error:', e));

        // Also cache in customer's local storage
        try {
          const savedOrders = JSON.parse(localStorage.getItem('amarghor_orders') || '[]');
          localStorage.setItem('amarghor_orders', JSON.stringify([createdOrderObj, ...savedOrders]));
        } catch {}
      }

      if (createdOrderObj) {
        setCreatedOrder(createdOrderObj);
        onOrderSuccess(createdOrderObj);
      }
    } catch (err: any) {
      setError(err.message || 'একটি ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#DDD5C7] flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-[#E8E2D8] flex items-center justify-between bg-[#FAF8F5] sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-[#133E2B]">
              {createdOrder
                ? (lang === 'bn' ? 'অর্ডার সফলভাবে সম্পন্ন!' : 'Order Placed Successfully!')
                : (lang === 'bn' ? 'চেকআউট ও অর্ডার কনফার্মেশন' : 'Checkout & Order Confirmation')}
            </h2>
            <p className="text-xs text-gray-500">
              {createdOrder
                ? (lang === 'bn' ? 'আপনার অর্ডার নম্বর সংরক্ষণ করুন' : 'Save your order reference number')
                : (lang === 'bn' ? 'অনুগ্রহ করে সঠিক তথ্য দিয়ে অর্ডারটি সম্পন্ন করুন' : 'Provide delivery information to complete order')}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-8">
          {createdOrder ? (
            /* Order Confirmation Success State */
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-[#133E2B]">
                  {lang === 'bn' ? 'ধন্যবাদ! আপনার অর্ডারটি গ্রহণ করা হয়েছে।' : 'Thank You! Your order has been placed.'}
                </h3>
                <p className="text-sm text-gray-600 mt-1 max-w-md mx-auto">
                  {lang === 'bn'
                    ? 'আমাদের প্রতিনিধি দ্রুত আপনার নম্বরে কল করে অর্ডারটি নিশ্চিত করবেন।'
                    : 'Our representative will call your number soon to verify the order.'}
                </p>
              </div>

              {/* Order Reference Box */}
              <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E2D8] text-left space-y-3">
                <div className="flex justify-between items-center border-b border-[#E8E2D8] pb-3">
                  <BrandLogo 
                    size="sm" 
                    logoUrl={settings.logoUrl} 
                    mode={settings.logoDisplayMode} 
                    showTagline={false} 
                  />
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">
                      {lang === 'bn' ? 'অর্ডার নম্বর' : 'Order ID'}
                    </span>
                    <span className="font-extrabold text-[#133E2B] text-sm sm:text-base tracking-wider bg-white px-2.5 py-0.5 rounded-md border border-[#DDD5C7] inline-block">
                      {createdOrder.orderNumber}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block">{lang === 'bn' ? 'গ্রাহকের নাম:' : 'Customer:'}</span>
                    <span className="font-semibold text-gray-900">{createdOrder.customer.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">{lang === 'bn' ? 'মোবাইল নম্বর:' : 'Phone:'}</span>
                    <span className="font-semibold text-gray-900">{createdOrder.customer.phone}</span>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-gray-500 block">{lang === 'bn' ? 'ডেলিভারি ঠিকানা:' : 'Delivery Address:'}</span>
                  <span className="font-semibold text-gray-900">{createdOrder.customer.address}, {createdOrder.customer.district}</span>
                  {createdOrder.customer.email && (
                    <div className="text-[11px] text-gray-600 mt-1">
                      <span className="text-gray-500">{lang === 'bn' ? 'জিমেইল / ইমেইল: ' : 'Email: '}</span>
                      <span className="font-medium text-gray-900">{createdOrder.customer.email}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#E8E2D8] pt-2 flex justify-between text-xs">
                  <span className="text-gray-600">{lang === 'bn' ? 'পেমেন্ট পদ্ধতি:' : 'Payment Method:'}</span>
                  <span className="font-bold text-gray-900 uppercase">{createdOrder.paymentMethod}</span>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-sm font-bold text-[#133E2B]">{lang === 'bn' ? 'সর্বমোট প্রদেয়:' : 'Total Payable:'}</span>
                  <span className="text-xl font-extrabold text-[#133E2B]">
                    {formatPrice(createdOrder.total, lang)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={`https://wa.me/88${settings.whatsapp}?text=${encodeURIComponent(
                    `আসসালামু আলাইকুম! আমি অর্ডার করেছি।\nঅর্ডার নম্বর: ${createdOrder.orderNumber}\nমোট মূল্য: ৳${createdOrder.total}\nনাম: ${createdOrder.customer.name}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 bg-[#25D366] text-white font-bold text-sm rounded-xl hover:bg-[#1EBE5D] transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে আপডেট পান' : 'Get WhatsApp Update'}</span>
                </a>

                <button
                  onClick={handlePrint}
                  className="py-3 px-4 bg-[#FAF8F5] border border-[#DDD5C7] text-gray-700 font-semibold text-sm rounded-xl hover:bg-[#F2EDE4] transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'রসিদ প্রিন্ট' : 'Print Invoice'}</span>
                </button>
              </div>

              <div>
                <button
                  onClick={onClose}
                  className="text-xs text-gray-500 hover:text-gray-800 underline"
                >
                  {lang === 'bn' ? 'কেনাকাটায় ফিরে যান' : 'Back to Shopping'}
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Customer Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#133E2B] uppercase tracking-wider">
                  {lang === 'bn' ? '১. গ্রাহক ও ডেলিভারি তথ্য' : '1. Delivery Details'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {lang === 'bn' ? 'আপনার পূর্ণ নাম *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={lang === 'bn' ? 'যেমন: মোহাম্মদ মিজানুর রহমান' : 'e.g. John Doe'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {lang === 'bn' ? 'মোবাইল নম্বর *' : 'Phone Number *'}
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="017XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {lang === 'bn' ? 'জেলা নির্ধারণ করুন *' : 'Select District *'}
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                    >
                      {BD_DISTRICTS.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>

                  {settings.features?.showCheckoutEmailField !== false && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        {lang === 'bn' ? 'জিমেইল / ইমেইল (ঐচ্ছিক)' : 'Gmail / Email (Optional)'}
                      </label>
                      <input
                        type="email"
                        placeholder={lang === 'bn' ? 'যেমন: example@gmail.com' : 'e.g. example@gmail.com'}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {lang === 'bn' ? 'সম্পূর্ণ ডেলিভারি ঠিকানা (বাসা/রোড/এলাকা) *' : 'Full Delivery Address *'}
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder={lang === 'bn' ? 'যেমন: বাড়ি নং ১২, রোড নং ৫, ব্লক বি, মিরপুর, ঢাকা' : 'House, Road, Area, Thana'}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>

                {settings.features?.enableOrderNotes !== false && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {lang === 'bn' ? 'বিশেষ কোনো নির্দেশনা (ঐচ্ছিক)' : 'Order Notes (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'bn' ? 'যেমন: শুক্রবার ডেলিভারি দিন' : 'Special instructions'}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#DDD5C7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                    />
                  </div>
                )}
              </div>

              {/* Payment Method Section */}
              <div className="space-y-3 pt-3 border-t border-[#E8E2D8]">
                <h3 className="text-sm font-bold text-[#133E2B] uppercase tracking-wider">
                  {lang === 'bn' ? '২. পেমেন্ট পদ্ধতি' : '2. Payment Method'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Cash on delivery */}
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-[#133E2B] bg-[#E8EFE9] font-bold text-[#133E2B]'
                        : 'border-[#DDD5C7] bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-[#133E2B]"
                    />
                    <span className="text-xs">
                      {lang === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}
                    </span>
                  </label>

                  {/* bKash */}
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'bkash'
                        ? 'border-[#D12053] bg-pink-50 font-bold text-[#D12053]'
                        : 'border-[#DDD5C7] bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bkash"
                      checked={paymentMethod === 'bkash'}
                      onChange={() => setPaymentMethod('bkash')}
                      className="accent-[#D12053]"
                    />
                    <span className="text-xs">bKash (বিকাশ)</span>
                  </label>

                  {/* Nagad */}
                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'nagad'
                        ? 'border-[#E04B26] bg-orange-50 font-bold text-[#E04B26]'
                        : 'border-[#DDD5C7] bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="nagad"
                      checked={paymentMethod === 'nagad'}
                      onChange={() => setPaymentMethod('nagad')}
                      className="accent-[#E04B26]"
                    />
                    <span className="text-xs">Nagad (নগদ)</span>
                  </label>
                </div>

                {/* Mobile Banking Instructions */}
                {paymentMethod !== 'cod' && (
                  <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#DDD5C7] space-y-2 text-xs">
                    <p className="font-semibold text-gray-800">
                      {lang === 'bn'
                        ? `অনুগ্রহ করে নিচের নম্বরে Send Money করুন এবং ট্রানজেকশন আইডি নিচে লিখুন:`
                        : `Please Send Money to the number below and enter Transaction ID:`}
                    </p>
                    <p className="text-sm font-bold text-[#133E2B] bg-white px-2 py-1 rounded inline-block border border-gray-300">
                      {paymentMethod === 'bkash'
                        ? settings.paymentMethods.bkashNumber
                        : settings.paymentMethods.nagadNumber}
                    </p>
                    <div>
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? '৮ বা ১০ অক্ষরের TrxID লিখুন' : 'Enter Transaction ID'}
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#DDD5C7] rounded-lg mt-1"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary Breakdown */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E2D8] space-y-2.5 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-gray-800">
                    {lang === 'bn' ? 'অর্ডার সামারি' : 'Order Summary'}
                  </h4>
                  {deliveryInfo.pricingType === 'weight_based' && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                      <Scale className="w-3 h-3 text-emerald-700" />
                      <span>{lang === 'bn' ? `মোট ওজন: ${toBnNumber(deliveryInfo.totalWeightKg)} কেজি` : `Weight: ${deliveryInfo.totalWeightKg} kg`}</span>
                    </span>
                  )}
                </div>

                {/* Items List */}
                <div className="divide-y divide-[#E8E2D8] pb-1 max-h-44 overflow-y-auto pr-1">
                  {items.map((item, idx) => {
                    const unitPrice = getItemUnitPrice(item);
                    const isWeight = isWeightBasedProduct(item.product);
                    const detectedPack = extractProductPackWeight(item.product);
                    const itemOptions = isWeight ? getProductWeightOptions(item.product) : [];
                    const isHalf = item.selectedWeight.toLowerCase().includes('500') ||
                                   item.selectedWeight.includes('আধা') ||
                                   item.selectedWeight.includes('হাফ') ||
                                   item.selectedWeight.includes('০.৫');

                    const handleStepDown = () => {
                      if (!onUpdateQuantity) return;
                      if (item.quantity > 1) {
                        onUpdateQuantity(item.product.id, item.quantity - 1, item.selectedWeight);
                      }
                    };

                    const handleStepUp = () => {
                      if (!onUpdateQuantity) return;
                      onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedWeight);
                    };

                    return (
                      <div key={idx} className="py-2.5 flex flex-col gap-1.5 text-gray-700 border-b border-[#E8E2D8]/80 last:border-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                              {lang === 'bn' ? item.product.nameBn : item.product.nameEn}
                            </div>
                            <div className="text-[11px] text-[#2D6A4F] font-bold mt-0.5">
                              {formatWeightLabel(item.selectedWeight, lang)}
                              <span className="text-gray-400 font-normal ml-1">
                                (@ {formatPrice(unitPrice, lang)})
                              </span>
                            </div>
                          </div>
                          <span className="font-black text-[#133E2B] text-xs sm:text-sm shrink-0 text-right">
                            {formatPrice(unitPrice * item.quantity, lang)}
                          </span>
                        </div>

                        {/* Weight & Quantity Controls directly inside the Order Modal */}
                        {onUpdateQuantity && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                            {/* Weight quick switcher for weight-based products */}
                            {isWeight && itemOptions.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1">
                                {itemOptions.slice(0, 3).map((opt) => {
                                  const isSelected = item.selectedWeight === opt;
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => onUpdateQuantity(item.product.id, 1, opt)}
                                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-[#133E2B] text-[#E8C547] border-[#133E2B] shadow-2xs ring-1 ring-[#D4AF37]'
                                          : 'bg-white text-gray-600 border-[#DDD5C7] hover:border-[#2D6A4F]'
                                      }`}
                                    >
                                      {formatWeightLabel(opt, lang)}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div />
                            )}

                            {/* Stepper */}
                            <div className="inline-flex items-center border border-[#DDD5C7] rounded-lg bg-white shadow-2xs overflow-hidden ml-auto">
                              <button
                                type="button"
                                onClick={handleStepDown}
                                disabled={item.quantity <= 1}
                                className="px-2 py-1 text-gray-600 hover:text-black hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                                title={lang === 'bn' ? 'পরিমাণ কমান' : 'Decrease quantity'}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="min-w-14 px-1.5 text-center font-bold text-xs text-[#133E2B]">
                                {detectedPack && item.selectedWeight.includes(String(detectedPack.grams))
                                  ? (lang === 'bn' ? `${toBnNumber(item.quantity)} কৌটা` : `${item.quantity} jar`)
                                  : isHalf && item.quantity === 1
                                    ? (lang === 'bn' ? '০.৫০ কেজি' : '0.50 kg')
                                    : isWeight
                                      ? (lang === 'bn' ? `${toBnNumber(item.quantity)} কেজি` : `${item.quantity} kg`)
                                      : (lang === 'bn' ? `${toBnNumber(item.quantity)}টি` : `${item.quantity} pcs`)}
                              </span>
                              <button
                                type="button"
                                onClick={handleStepUp}
                                className="px-2 py-1 text-gray-600 hover:text-black hover:bg-gray-100 cursor-pointer transition-colors"
                                title={lang === 'bn' ? 'পরিমাণ বাড়ান' : 'Increase quantity'}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-gray-600 pt-1 border-t border-[#E8E2D8]">
                  <span>{lang === 'bn' ? 'পণ্যের মোট মূল্য:' : 'Subtotal:'}</span>
                  <span className="font-bold text-gray-900">{formatPrice(subtotal, lang)}</span>
                </div>

                <div className="space-y-1 pt-1 border-t border-dashed border-[#E8E2D8]">
                  <div className="flex justify-between text-gray-700 font-medium">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{lang === 'bn' ? 'কুরিয়ার ডেলিভারি চার্জ:' : 'Courier Delivery Fee:'}</span>
                    </span>
                    <span className="font-bold text-gray-900">{formatPrice(deliveryCharge, lang)}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/80 font-medium leading-relaxed">
                    {lang === 'bn' ? deliveryInfo.breakdownBn : deliveryInfo.breakdownEn}
                  </p>
                </div>

                <div className="border-t border-[#E8E2D8] pt-2 flex justify-between items-baseline">
                  <span className="font-bold text-sm text-[#133E2B]">
                    {lang === 'bn' ? 'সর্বমোট প্রদেয় টাকা:' : 'Total Payable:'}
                  </span>
                  <span className="text-xl font-extrabold text-[#133E2B]">
                    {formatPrice(grandTotal, lang)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#133E2B] hover:bg-[#1B4332] active:scale-95 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{lang === 'bn' ? 'অর্ডার প্রসেস হচ্ছে...' : 'Processing Order...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-[#E8C547]" />
                    <span>{lang === 'bn' ? 'অর্ডার কনফার্ম করুন' : 'Confirm Order'}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
