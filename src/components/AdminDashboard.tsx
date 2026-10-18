import React, { useState, useEffect } from 'react';
import { 
  Lock, X, Package, ShoppingCart, Settings, MessageSquare, LogOut, Plus, Edit, Trash2, 
  Check, AlertCircle, Upload, Save, RefreshCw, Eye, Printer, DollarSign, CheckCircle2,
  Image as ImageIcon, Truck, Scale, Edit3, ArrowRight, Mail, MapPin, User,
  Sliders, Sparkles, Layout, Globe, Type, MessageCircle, Phone, Search, FileText, 
  CreditCard, Bell, ChevronRight, ToggleLeft, ToggleRight, ShieldCheck,
  ShieldAlert, UserX, UserCheck, Users, Ban, Download, Filter, HelpCircle, Shield,
  History, Star, PhoneCall
} from 'lucide-react';
import { Product, Order, SiteSettings, ContactMessage, SiteFeatures, BlacklistEntry, CustomerProfile } from '../types';
import { formatPrice, toBnNumber, extractProductPackWeight, getProductWeightOptions, calculateItemPrice, formatWeightLabel } from '../utils/formatters';
import { CATEGORIES } from './CategoryBar';
import { BrandLogo } from './BrandLogo';
import { BD_DISTRICTS } from './CheckoutModal';
import { saveProductsToCloud, saveSettingsToCloud, saveImageToCloud } from '../lib/clientFirebase';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRefreshProducts: () => void;
  settings: SiteSettings;
  onUpdateSettings: (newSettings: Partial<SiteSettings>) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  products,
  onRefreshProducts,
  settings,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  // Authentication State
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('amarghor_admin_token'));
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'customers' | 'blacklist' | 'messages' | 'settings'>('products');

  // Orders State & Filters
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderRiskFilter, setOrderRiskFilter] = useState<'all' | 'real' | 'suspicious' | 'fake' | 'blacklisted'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<'all' | 'cod' | 'bkash' | 'nagad'>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [updatingRiskOrderId, setUpdatingRiskOrderId] = useState<string | null>(null);

  // Blacklist Management State
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [blacklistLoading, setBlacklistLoading] = useState(false);
  const [blacklistSearch, setBlacklistSearch] = useState('');
  const [newBlacklistPhone, setNewBlacklistPhone] = useState('');
  const [newBlacklistReason, setNewBlacklistReason] = useState('');
  const [newBlacklistName, setNewBlacklistName] = useState('');
  const [addingToBlacklist, setAddingToBlacklist] = useState(false);

  // Customer Intelligence / CRM State
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<'all' | 'vip' | 'regular' | 'new' | 'suspicious' | 'blacklisted'>('all');
  const [viewingCustomerOrders, setViewingCustomerOrders] = useState<CustomerProfile | null>(null);
  const [editingCustomerNotePhone, setEditingCustomerNotePhone] = useState<string | null>(null);
  const [customerNoteText, setCustomerNoteText] = useState('');
  const [savingCustomerNote, setSavingCustomerNote] = useState(false);

  // Messages State
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  // Product Editor Modal State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Sync settings when props update
  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // Toggle Feature Helper
  const handleToggleFeature = (featureKey: keyof SiteFeatures) => {
    setSettingsForm((prev) => {
      const prevFeatures: SiteFeatures = prev.features || {
        showAnnouncement: true,
        showLanguageSwitcher: true,
        showFontSwitcher: true,
        showSearchBar: true,
        showHeroSection: true,
        showCategoryBar: true,
        showHomeDecorSection: true,
        showTrustBanner: true,
        showAboutSection: true,
        showContactSection: true,
        showFloatingWhatsApp: true,
        showProductWhatsAppBtn: true,
        showStockBadge: true,
        showCheckoutEmailField: true,
        enableOrderNotes: true
      };
      const currentVal = prevFeatures[featureKey] !== false;
      return {
        ...prev,
        features: {
          ...prevFeatures,
          [featureKey]: !currentVal
        }
      };
    });
  };

  // Password Change State
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [passwordChangeMsg, setPasswordChangeMsg] = useState('');

  // Manual Order Delivery Override State
  const [editingOrderDelivery, setEditingOrderDelivery] = useState<boolean>(false);
  const [orderDeliveryInput, setOrderDeliveryInput] = useState<number>(0);
  const [savingOrderDelivery, setSavingOrderDelivery] = useState<boolean>(false);
  const [simWeight, setSimWeight] = useState<number>(1.5);

  // Customer Info Edit State (Name, Phone, Gmail, Address, District, Notes)
  const [editingCustomerInfo, setEditingCustomerInfo] = useState<boolean>(false);
  const [savingCustomerInfo, setSavingCustomerInfo] = useState<boolean>(false);
  const [customerEditForm, setCustomerEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    district: 'ঢাকা (Dhaka)',
    notes: ''
  });

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ভুল পাসওয়ার্ড');
      }

      localStorage.setItem('amarghor_admin_token', data.token);
      setToken(data.token);
    } catch (err: any) {
      setLoginError(err.message || 'লগইন ব্যর্থ হয়েছে।');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('amarghor_admin_token');
    setToken(null);
  };

  // Fetch Orders
  const fetchOrders = async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch Messages
  const fetchMessages = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/contact', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  // Fetch Blacklist
  const fetchBlacklist = async () => {
    if (!token) return;
    setBlacklistLoading(true);
    try {
      const res = await fetch('/api/admin/blacklist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setBlacklist(data);
      }
    } catch (err) {
      console.error('Failed to fetch blacklist:', err);
    } finally {
      setBlacklistLoading(false);
    }
  };

  // Fetch Customers CRM
  const fetchCustomers = async () => {
    if (!token) return;
    setCustomersLoading(true);
    try {
      const res = await fetch('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setCustomersLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
      fetchMessages();
      fetchBlacklist();
      fetchCustomers();
    }
  }, [token]);

  // Handle Add to Blacklist
  const handleAddToBlacklist = async (phone: string, reason?: string, customerName?: string) => {
    if (!token || !phone) return;
    setAddingToBlacklist(true);
    try {
      const res = await fetch('/api/admin/blacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone, reason, customerName })
      });
      const data = await res.json();
      if (data.success) {
        setBlacklist(data.blacklist || []);
        setNewBlacklistPhone('');
        setNewBlacklistReason('');
        setNewBlacklistName('');
        fetchOrders();
        fetchCustomers();
      }
    } catch (err) {
      console.error('Failed to add to blacklist:', err);
    } finally {
      setAddingToBlacklist(false);
    }
  };

  // Handle Remove from Blacklist
  const handleRemoveFromBlacklist = async (phone: string) => {
    if (!token || !phone) return;
    try {
      const res = await fetch(`/api/admin/blacklist/${encodeURIComponent(phone)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBlacklist(data.blacklist || []);
        fetchOrders();
        fetchCustomers();
      }
    } catch (err) {
      console.error('Failed to remove from blacklist:', err);
    }
  };

  // Handle Override Order Risk
  const handleOverrideRisk = async (
    orderId: string, 
    riskLevel: 'real' | 'suspicious' | 'fake' | 'blacklisted', 
    riskScore: number,
    reasonNote?: string
  ) => {
    if (!token) return;
    setUpdatingRiskOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/risk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          riskLevel,
          riskScore,
          verifiedByAdmin: true,
          riskReasons: reasonNote ? [reasonNote] : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        fetchCustomers();
        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch (err) {
      console.error('Failed to update risk level:', err);
    } finally {
      setUpdatingRiskOrderId(null);
    }
  };

  // Handle Save Customer Note
  const handleSaveCustomerNote = async (phone: string, notes: string) => {
    if (!token || !phone) return;
    setSavingCustomerNote(true);
    try {
      const res = await fetch('/api/admin/customers/note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone, notes })
      });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) => prev.map(c => c.phone === phone ? { ...c, notes } : c));
        setEditingCustomerNotePhone(null);
        setCustomerNoteText('');
      }
    } catch (err) {
      console.error('Failed to save customer note:', err);
    } finally {
      setSavingCustomerNote(false);
    }
  };

  // Handle Export Customers CSV
  const handleExportCustomersCSV = () => {
    if (!customers || customers.length === 0) return;
    const headers = ['নাম', 'মোবাইল নম্বর', 'ইমেইল', 'ঠিকানা', 'জেলা', 'মোট অর্ডার', 'মোট ব্যয় (টাকা)', 'ডেলিভার্ড অর্ডার', 'বাতিল অর্ডার', 'গ্রাহকের ধরন', 'প্রথম অর্ডার', 'সর্বশেষ অর্ডার', 'নোট'];
    const rows = customers.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${c.district || ''}"`,
      c.totalOrders,
      c.totalSpent,
      c.deliveredOrders,
      c.cancelledOrders,
      c.status === 'vip' ? 'ভিআইপি (VIP)' : c.status === 'regular' ? 'নিয়মিত' : c.status === 'suspicious' ? 'সন্দেহজনক' : c.status === 'blacklisted' ? 'ব্লকলিস্টেড' : 'নতুন',
      c.firstOrderDate ? new Date(c.firstOrderDate).toLocaleDateString('bn-BD') : '',
      c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('bn-BD') : '',
      `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Amar_Ghor_Customer_Database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: string, paymentStatus?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, paymentStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Manual Delivery Charge Override for Order
  const handleSaveOrderDelivery = async (orderId: string) => {
    if (!token) return;
    setSavingOrderDelivery(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ deliveryCharge: Number(orderDeliveryInput) })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder(data.order);
        }
        setEditingOrderDelivery(false);
      }
    } catch (err) {
      console.error('Failed to update delivery charge:', err);
    } finally {
      setSavingOrderDelivery(false);
    }
  };

  // Start Editing Order Customer Info
  const handleStartEditCustomer = (order: Order) => {
    setCustomerEditForm({
      name: order.customer.name || '',
      phone: order.customer.phone || '',
      email: order.customer.email || '',
      address: order.customer.address || '',
      district: order.customer.district || 'ঢাকা (Dhaka)',
      notes: order.customer.notes || ''
    });
    setEditingCustomerInfo(true);
  };

  // Save Updated Customer Info (Address, District, Gmail, Phone, etc.)
  const handleSaveCustomerInfo = async (orderId: string) => {
    if (!token) return;
    setSavingCustomerInfo(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customer: customerEditForm
        })
      });
      const data = await res.json();
      if (data.success) {
        setEditingCustomerInfo(false);
        fetchOrders();
        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch (err) {
      console.error('Failed to update customer info:', err);
    } finally {
      setSavingCustomerInfo(false);
    }
  };

  // Product Save (Add or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingProduct(true);

    try {
      const isEdit = !isNewProduct && editingProduct.id;
      const url = isEdit ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      // Auto-extract pack weight and build proportional options if applicable
      const detected = extractProductPackWeight(editingProduct);
      const productToSave = { ...editingProduct };
      if (detected) {
        if (!productToSave.weightKg || productToSave.weightKg === 1) {
          productToSave.weightKg = detected.kg;
        }
        if (!productToSave.weightOptions || productToSave.weightOptions.length === 0 || (productToSave.weightOptions.length === 2 && productToSave.weightOptions.includes('500g') && productToSave.weightOptions.includes('1kg'))) {
          productToSave.weightOptions = getProductWeightOptions(productToSave);
        }
      }

      let saved = false;
      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminToken: token,
            product: productToSave
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) saved = true;
        }
      } catch (e) {
        console.warn('API /api/products save unreachable, saving to Cloud Firestore:', e);
      }

      // If backend was unreachable or on Netlify, update products and sync directly to Cloud Firestore
      if (!saved) {
        let updatedList: Product[];
        const exists = products.some((p) => p.id === productToSave.id);
        if (exists) {
          updatedList = products.map((p) => (p.id === productToSave.id ? (productToSave as Product) : p));
        } else {
          updatedList = [productToSave as Product, ...products];
        }
        await saveProductsToCloud(updatedList).catch((e) => console.warn('Cloud product sync warning:', e));
      }

      setEditingProduct(null);
      onRefreshProducts();
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    } finally {
      setSavingProduct(false);
    }
  };

  // Product Delete
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই পণ্যটি মুছে ফেলতে চান?')) return;

    try {
      let deletedOnServer = false;
      try {
        const res = await fetch(`/api/products/${productId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) deletedOnServer = true;
      } catch (e) {
        console.warn('Backend delete unreachable:', e);
      }

      // Sync to cloud Firestore directly
      const remaining = products.filter((p) => p.id !== productId);
      await saveProductsToCloud(remaining).catch(() => {});
      onRefreshProducts();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Image compressor helper for mobile & desktop uploads (resizes and optimizes before sending to Cloud Firestore)
  const compressImageFile = (file: File, maxWidth = 1200, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Image Upload handler (File -> Compressed Base64 -> Cloud Firestore & Disk)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // Compress to optimal dimensions so base64 never exceeds Firestore 1MB quota
      const compressedDataUrl = await compressImageFile(file, 900, 0.78);
      let uploadedUrl = '';

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminToken: token,
            dataUrl: compressedDataUrl,
            fileName: file.name
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.url) {
            uploadedUrl = data.url;
          }
        }
      } catch (err) {
        console.warn('Backend upload unreachable, saving directly to Cloud Firestore:', err);
      }

      // If backend was unreachable (e.g. Netlify deployment), save directly to Firestore
      if (!uploadedUrl) {
        const imageId = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        await saveImageToCloud(imageId, compressedDataUrl);
        uploadedUrl = compressedDataUrl;
      }

      if (uploadedUrl) {
        setEditingProduct((prev) => ({
          ...prev,
          images: [...(prev?.images || []), uploadedUrl]
        }));
      } else {
        throw new Error('ইমেজ সংরক্ষণ সম্ভব হয়নি।');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert('ইমেজ আপলোড করতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Logo Upload handler (File -> Base64 -> Cloud & Disk)
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 500, 0.85);
      let logoUrl = '';

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminToken: token,
            dataUrl: compressedDataUrl,
            fileName: 'logo-' + file.name
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.url) {
            logoUrl = data.url;
          }
        }
      } catch (err) {
        console.warn('Backend upload unreachable for logo, saving to cloud:', err);
      }

      if (!logoUrl) {
        const logoId = 'logo_' + Date.now();
        await saveImageToCloud(logoId, compressedDataUrl);
        logoUrl = compressedDataUrl;
      }

      if (logoUrl) {
        const updated = {
          ...settingsForm,
          logoUrl
        };
        setSettingsForm(updated);
        onUpdateSettings({ logoUrl });
        await saveSettingsToCloud({ logoUrl }).catch(() => {});

        // Try server settings update if available
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminToken: token,
            settings: { logoUrl }
          })
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('Logo upload failed:', err);
      alert('লোগো আপলোড করতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);

    try {
      let saved = false;
      try {
        const res = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminToken: token,
            settings: settingsForm
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            onUpdateSettings(data.settings);
            saved = true;
          }
        }
      } catch (e) {
        console.warn('Backend settings save unreachable, saving to cloud:', e);
      }

      // Always persist to Cloud Firestore for permanent multi-platform availability
      await saveSettingsToCloud(settingsForm).catch((e) => console.warn('Cloud settings sync warning:', e));

      onUpdateSettings(settingsForm);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      console.error('Settings save failed:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMsg('');

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: newAdminPassword })
      });
      const data = await res.json();
      if (data.success) {
        setPasswordChangeMsg('পাসওয়ার্ড সফলভাবে হালনাগাদ করা হয়েছে!');
        setNewAdminPassword('');
      } else {
        setPasswordChangeMsg(data.error || 'ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      setPasswordChangeMsg(err.message || 'ব্যর্থ হয়েছে');
    }
  };

  // Filtered Orders Calculation
  const filteredOrders = orders.filter((ord) => {
    if (orderRiskFilter !== 'all') {
      const risk = ord.riskLevel || 'real';
      if (risk !== orderRiskFilter) return false;
    }
    if (orderStatusFilter !== 'all' && ord.status !== orderStatusFilter) {
      return false;
    }
    if (orderPaymentFilter !== 'all' && ord.paymentMethod !== orderPaymentFilter) {
      return false;
    }
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase().trim();
      const matchNum = ord.orderNumber?.toLowerCase().includes(q);
      const matchName = ord.customer?.name?.toLowerCase().includes(q);
      const matchPhone = ord.customer?.phone?.toLowerCase().includes(q);
      const matchDistrict = ord.customer?.district?.toLowerCase().includes(q);
      const matchAddr = ord.customer?.address?.toLowerCase().includes(q);
      const matchEmail = ord.customer?.email?.toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchPhone && !matchDistrict && !matchAddr && !matchEmail) {
        return false;
      }
    }
    return true;
  });

  const orderStats = {
    total: orders.length,
    real: orders.filter((o) => !o.riskLevel || o.riskLevel === 'real').length,
    suspicious: orders.filter((o) => o.riskLevel === 'suspicious').length,
    fake: orders.filter((o) => o.riskLevel === 'fake').length,
    blacklisted: orders.filter((o) => o.riskLevel === 'blacklisted').length,
    revenue: orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + (Number(o.total) || 0), 0)
  };

  // Filtered Customers Calculation
  const filteredCustomers = customers.filter((cust) => {
    if (customerStatusFilter !== 'all' && cust.status !== customerStatusFilter) {
      return false;
    }
    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase().trim();
      const matchName = cust.name?.toLowerCase().includes(q);
      const matchPhone = cust.phone?.toLowerCase().includes(q);
      const matchDistrict = cust.district?.toLowerCase().includes(q);
      const matchAddr = cust.address?.toLowerCase().includes(q);
      const matchEmail = cust.email?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchDistrict && !matchAddr && !matchEmail) {
        return false;
      }
    }
    return true;
  });

  const customerStats = {
    total: customers.length,
    vip: customers.filter(c => c.status === 'vip').length,
    regular: customers.filter(c => c.status === 'regular').length,
    new: customers.filter(c => c.status === 'new').length,
    suspicious: customers.filter(c => c.status === 'suspicious').length,
    blacklisted: customers.filter(c => c.status === 'blacklisted').length,
    totalSpent: customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0)
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative bg-[#FAF8F5] rounded-3xl max-w-6xl w-full max-h-[94vh] overflow-hidden shadow-2xl border border-[#DDD5C7] flex flex-col">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8E2D8] bg-[#133E2B] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <BrandLogo 
              size="sm" 
              dark 
              logoUrl={settingsForm.logoUrl} 
              mode={settingsForm.logoDisplayMode} 
              showTagline={false}
            />
            <div className="hidden sm:block border-l border-emerald-700/60 pl-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold">
                  অ্যাডমিন কন্ট্রোল প্যানেল
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-900/80 border border-emerald-400/30 text-emerald-200 text-[10px] font-bold rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ক্লাউড ফায়ারবেস সক্রিয়</span>
                </span>
              </div>
              <p className="text-[11px] text-emerald-200">
                পণ্য ক্যাটালগ, গ্রাহক অর্ডার, মূল্য ও সাইট সেটিংস নিয়ন্ত্রণ (স্থায়ী ক্লাউড ডাটাবেস)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {token && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-red-800/80 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-emerald-200 hover:text-white rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Not Logged In View */}
        {!token ? (
          <div className="p-8 sm:p-12 flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#DDD5C7] flex items-center justify-center text-[#133E2B] shadow-sm">
              <Lock className="w-8 h-8 text-[#2D6A4F]" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#133E2B]">
                অ্যাডমিন প্রবেশাধিকার
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                মালিক ও ব্যবস্থাপকদের জন্য নিরাপদ ড্যাশবোর্ড (ডিফল্ট পাসওয়ার্ড: <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800 font-mono">admin123</code>)
              </p>
            </div>

            {loginError && (
              <div className="w-full p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="w-full space-y-3">
              <input
                type="password"
                required
                placeholder="অ্যাডমিন পাসওয়ার্ড লিখুন"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#DDD5C7] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-[#133E2B] text-white font-bold text-sm rounded-xl hover:bg-[#1B4332] transition-colors shadow-md cursor-pointer"
              >
                {loginLoading ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন'}
              </button>
            </form>
          </div>
        ) : (
          /* Logged In Dashboard View */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Navigation Tabs */}
            <div className="bg-white border-b border-[#E8E2D8] px-4 sm:px-6 flex gap-2 sm:gap-3 overflow-x-auto shrink-0 scrollbar-none">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-3.5 px-3 border-b-2 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'border-[#133E2B] text-[#133E2B]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>পণ্য ও স্টক ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`py-3.5 px-3 border-b-2 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-[#133E2B] text-[#133E2B]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>গ্রাহক অর্ডারসমূহ ({orders.length})</span>
                {orders.some(o => o.riskLevel === 'suspicious' || o.riskLevel === 'fake') && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="যাচাই প্রয়োজন" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('customers')}
                className={`py-3.5 px-3 border-b-2 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'customers'
                    ? 'border-[#133E2B] text-[#133E2B]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-700" />
                <span>কাস্টমার ডেটাব্যাংক ({customers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('blacklist')}
                className={`py-3.5 px-3 border-b-2 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'blacklist'
                    ? 'border-[#133E2B] text-[#133E2B]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Ban className="w-4 h-4 text-red-600" />
                <span>ফেইক ও ব্লকলিস্ট ({blacklist.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('messages')}
                className={`py-3.5 px-3 border-b-2 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'messages'
                    ? 'border-[#133E2B] text-[#133E2B]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>যোগাযোগ বার্তা ({messages.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`py-3.5 px-3 border-b-2 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'border-[#133E2B] text-[#133E2B]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>সাইট সেটিংস ও সিকিউরিটি</span>
              </button>
            </div>

            {/* Tab 1: Products Management */}
            {activeTab === 'products' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E8E2D8]">
                  <div>
                    <h3 className="font-bold text-base text-[#133E2B]">
                      পণ্য তালিকা ও স্টক ব্যবস্থাপনা
                    </h3>
                    <p className="text-xs text-gray-500">
                      পণ্য যোগ করুন, বর্তমান ও রেফারেন্স মূল্য পরিবর্তন করুন, নতুন ছবি দিন
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsNewProduct(true);
                        setEditingProduct({
                          nameBn: '',
                          nameEn: '',
                          category: 'natural_honey',
                          categoryBn: 'প্রাকৃতিক মধু',
                          categoryEn: 'Natural Honey',
                          price: 1000,
                          previousPrice: 1200,
                          unit: 'Per kg',
                          unitBn: 'প্রতি কেজি',
                          inStock: true,
                          stockCount: 50,
                          descriptionBn: '',
                          descriptionEn: '',
                          images: ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'],
                          weightOptions: ['500g', '1kg']
                        });
                      }}
                      className="px-4 py-2 bg-[#133E2B] text-white font-bold text-xs rounded-xl hover:bg-[#1B4332] flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-4 h-4 text-[#E8C547]" />
                      <span>নতুন পণ্য যোগ করুন</span>
                    </button>
                  </div>
                </div>

                {/* Products Table */}
                <div className="bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-700">
                      <thead className="bg-[#FAF8F5] border-b border-[#E8E2D8] text-[11px] uppercase tracking-wider text-gray-600 font-bold">
                        <tr>
                          <th className="p-3.5">ছবি</th>
                          <th className="p-3.5">পণ্যের নাম (বাংলা / English)</th>
                          <th className="p-3.5">ক্যাটাগরি</th>
                          <th className="p-3.5">বর্তমান মূল্য</th>
                          <th className="p-3.5">পূর্বমূল্য</th>
                          <th className="p-3.5">একক / ইউনিট</th>
                          <th className="p-3.5">স্টক</th>
                          <th className="p-3.5 text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F2EDE4]">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                            <td className="p-3">
                              <img
                                src={p.images?.[0]}
                                alt={p.nameBn}
                                className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-[#DDD5C7]"
                              />
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-gray-900 text-sm">{p.nameBn}</div>
                              <div className="text-[11px] text-gray-500">{p.nameEn}</div>
                            </td>
                            <td className="p-3">
                              <span className="font-medium text-[#2D6A4F]">{p.categoryBn}</span>
                            </td>
                            <td className="p-3 font-extrabold text-[#133E2B] text-sm">
                              {formatPrice(p.price, 'bn')}
                            </td>
                            <td className="p-3 text-gray-400 line-through">
                              {formatPrice(p.previousPrice, 'bn')}
                            </td>
                            <td className="p-3">
                              <span className="bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#DDD5C7]">
                                {p.unitBn}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.inStock
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {p.inStock ? 'মজুদ আছে' : 'স্টক শেষ'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setIsNewProduct(false);
                                    setEditingProduct({ ...p });
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="সম্পাদনা করুন"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Orders Management & Fraud Filtering */}
            {activeTab === 'orders' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                
                {/* Orders Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E8E2D8]">
                  <div>
                    <h3 className="font-extrabold text-base text-[#133E2B] flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-700" />
                      <span>গ্রাহক অর্ডার তালিকা ও ফ্রড ফিল্টারিং</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      স্মার্ট ফেইক ও রিয়েল অর্ডার নির্ণয়, ঝুঁকি স্কোরিং, এক-ক্লিক ব্লকলিস্ট এবং কুরিয়ার স্ট্যাটাস নিয়ন্ত্রণ
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchOrders}
                      disabled={ordersLoading}
                      className="px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl hover:bg-[#F2EDE4] transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-gray-700"
                      title="রিফ্রেশ করুন"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-gray-700 ${ordersLoading ? 'animate-spin' : ''}`} />
                      <span>রিফ্রেশ</span>
                    </button>
                  </div>
                </div>

                {/* Orders Metric Counter Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <div 
                    onClick={() => { setOrderRiskFilter('all'); setOrderStatusFilter('all'); }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      orderRiskFilter === 'all' && orderStatusFilter === 'all'
                        ? 'bg-[#133E2B] text-white border-[#133E2B] shadow-xs'
                        : 'bg-white hover:bg-[#FAF8F5] border-[#E8E2D8] text-gray-800'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase opacity-80">মোট অর্ডার</div>
                    <div className="text-lg font-black mt-0.5">{orderStats.total}টি</div>
                    <div className="text-[10px] opacity-70">সর্বমোট রেকর্ড</div>
                  </div>

                  <div 
                    onClick={() => setOrderRiskFilter('real')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      orderRiskFilter === 'real'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-emerald-50/50 hover:bg-emerald-100/60 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>আসল অর্ডার</span>
                    </div>
                    <div className="text-lg font-black mt-0.5 text-emerald-950">{orderStats.real}টি</div>
                    <div className="text-[10px] text-emerald-700 font-medium">নিরাপদ ও ভেরিফাইড</div>
                  </div>

                  <div 
                    onClick={() => setOrderRiskFilter('suspicious')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      orderRiskFilter === 'suspicious'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-amber-50/60 hover:bg-amber-100/70 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span>সন্দেহজনক</span>
                    </div>
                    <div className="text-lg font-black mt-0.5 text-amber-950">{orderStats.suspicious}টি</div>
                    <div className="text-[10px] text-amber-700 font-medium">যাচাই প্রয়োজন</div>
                  </div>

                  <div 
                    onClick={() => setOrderRiskFilter('fake')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      orderRiskFilter === 'fake'
                        ? 'bg-red-700 text-white border-red-700 shadow-xs'
                        : 'bg-red-50/60 hover:bg-red-100/70 border-red-200 text-red-900'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      <span>ফেইক সন্দেহ</span>
                    </div>
                    <div className="text-lg font-black mt-0.5 text-red-950">{orderStats.fake}টি</div>
                    <div className="text-[10px] text-red-700 font-medium">উচ্চ ঝুঁকি</div>
                  </div>

                  <div 
                    onClick={() => setOrderRiskFilter('blacklisted')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      orderRiskFilter === 'blacklisted'
                        ? 'bg-gray-800 text-white border-gray-800 shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                      <Ban className="w-2.5 h-2.5 text-red-600" />
                      <span>ব্লকলিস্টেড</span>
                    </div>
                    <div className="text-lg font-black mt-0.5">{orderStats.blacklisted}টি</div>
                    <div className="text-[10px] text-gray-500 font-medium">অর্ডার নিষিদ্ধ</div>
                  </div>

                  <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/40 text-[#133E2B]">
                    <div className="text-[10px] font-bold uppercase text-emerald-800">মোট বিক্রয় (৳)</div>
                    <div className="text-lg font-black mt-0.5 text-[#133E2B]">{formatPrice(orderStats.revenue, 'bn')}</div>
                    <div className="text-[10px] text-emerald-700 font-medium">ডেলিভারিযোগ্য মোট</div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white p-3.5 rounded-2xl border border-[#E8E2D8] space-y-3">
                  {/* Risk Level Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                    <span className="text-[11px] font-bold text-gray-500 mr-1 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5 text-emerald-700" />
                      <span>রিস্ক ফিল্টার:</span>
                    </span>
                    <button
                      onClick={() => setOrderRiskFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        orderRiskFilter === 'all'
                          ? 'bg-[#133E2B] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      সকল ({orderStats.total})
                    </button>
                    <button
                      onClick={() => setOrderRiskFilter('real')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        orderRiskFilter === 'real'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>🟢 আসল / নিরাপদ ({orderStats.real})</span>
                    </button>
                    <button
                      onClick={() => setOrderRiskFilter('suspicious')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        orderRiskFilter === 'suspicious'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>🟡 সন্দেহজনক ({orderStats.suspicious})</span>
                    </button>
                    <button
                      onClick={() => setOrderRiskFilter('fake')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        orderRiskFilter === 'fake'
                          ? 'bg-red-700 text-white'
                          : 'bg-red-50 text-red-900 hover:bg-red-100 border border-red-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      <span>🔴 ফেইক অর্ডার ({orderStats.fake})</span>
                    </button>
                    <button
                      onClick={() => setOrderRiskFilter('blacklisted')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        orderRiskFilter === 'blacklisted'
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      <Ban className="w-3 h-3 text-red-600" />
                      <span>⛔ ব্লকলিস্টেড ({orderStats.blacklisted})</span>
                    </button>
                  </div>

                  {/* Search and Secondary Dropdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1 border-t border-[#F2EDE4]">
                    <div className="sm:col-span-6 relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="অর্ডার নং, নাম, মোবাইল নম্বর, জেলা বা ঠিকানা খুঁজুন..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                      {orderSearch && (
                        <button
                          onClick={() => setOrderSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="sm:col-span-3">
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs font-medium text-gray-700"
                      >
                        <option value="all">সকল ডেলিভারি স্ট্যাটাস</option>
                        <option value="pending">পেন্ডিং (Pending)</option>
                        <option value="processing">প্রসেসিং (Processing)</option>
                        <option value="shipped">শিপড (Shipped)</option>
                        <option value="delivered">ডেলিভার্ড (Delivered)</option>
                        <option value="cancelled">বাতিল (Cancelled)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-1.5">
                      <select
                        value={orderPaymentFilter}
                        onChange={(e) => setOrderPaymentFilter(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs font-medium text-gray-700"
                      >
                        <option value="all">সকল পেমেন্ট মাধ্যম</option>
                        <option value="cod">ক্যাশ অন ডেলিভারি (COD)</option>
                        <option value="bkash">বিকাশ (bKash)</option>
                        <option value="nagad">নগদ (Nagad)</option>
                      </select>
                      {(orderRiskFilter !== 'all' || orderStatusFilter !== 'all' || orderPaymentFilter !== 'all' || orderSearch) && (
                        <button
                          onClick={() => {
                            setOrderRiskFilter('all');
                            setOrderStatusFilter('all');
                            setOrderPaymentFilter('all');
                            setOrderSearch('');
                          }}
                          className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold shrink-0"
                          title="ফিল্টার ক্লিয়ার করুন"
                        >
                          ক্লিয়ার
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 text-center text-gray-500 border border-[#E8E2D8] space-y-2">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-1" />
                    <p className="font-bold text-gray-700">কোনো অর্ডার পাওয়া যায়নি।</p>
                    <p className="text-xs text-gray-400">
                      {orderSearch || orderRiskFilter !== 'all' || orderStatusFilter !== 'all'
                        ? 'আপনার ফিল্টারের সাথে মিলে এমন কোনো অর্ডার নেই। ফিল্টার ক্লিয়ার করে আবার চেষ্টা করুন।'
                        : 'গ্রাহক চেকআউট সম্পন্ন করলে এখানে তালিকা স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Orders List Table */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden shadow-xs">
                      <div className="p-3 bg-[#FAF8F5] border-b border-[#E8E2D8] flex items-center justify-between text-xs text-gray-600 font-semibold">
                        <span>মোট প্রদর্শিত অর্ডার: <strong>{filteredOrders.length}টি</strong></span>
                        <span className="text-[11px] text-gray-400">অর্ডারে ক্লিক করে ফ্রড এনালাইসিস দেখুন</span>
                      </div>
                      <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
                        <table className="w-full text-left text-xs text-gray-700">
                          <thead className="bg-[#FAF8F5] border-b border-[#E8E2D8] text-[10px] uppercase font-bold text-gray-600 sticky top-0 z-10">
                            <tr>
                              <th className="p-3">অর্ডার নং</th>
                              <th className="p-3">গ্রাহক ও ফোন</th>
                              <th className="p-3">জেলা</th>
                              <th className="p-3">মোট টাকা</th>
                              <th className="p-3">রিস্ক অবস্থা</th>
                              <th className="p-3">স্ট্যাটাস</th>
                              <th className="p-3 text-right">বিস্তারিত</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F2EDE4]">
                            {filteredOrders.map((ord) => {
                              const isSelected = selectedOrder?.orderId === ord.orderId;
                              const risk = ord.riskLevel || 'real';
                              return (
                                <tr
                                  key={ord.orderId}
                                  onClick={() => {
                                    setSelectedOrder(ord);
                                    setEditingCustomerInfo(false);
                                    setEditingOrderDelivery(false);
                                  }}
                                  className={`cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-emerald-50 border-l-4 border-l-emerald-700'
                                      : 'hover:bg-[#FAF8F5]'
                                  }`}
                                >
                                  <td className="p-3 whitespace-nowrap">
                                    <div className="font-extrabold text-[#133E2B]">{ord.orderNumber}</div>
                                    <div className="text-[10px] text-gray-400">
                                      {new Date(ord.createdAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="font-bold text-gray-900 truncate max-w-[130px]">{ord.customer.name}</div>
                                    <div className="text-[11px] font-mono text-gray-600">{ord.customer.phone}</div>
                                  </td>
                                  <td className="p-3 whitespace-nowrap text-gray-600">{ord.customer.district}</td>
                                  <td className="p-3 font-extrabold text-[#133E2B] whitespace-nowrap">
                                    {formatPrice(ord.total, 'bn')}
                                  </td>
                                  <td className="p-3 whitespace-nowrap">
                                    {risk === 'real' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                        <span>আসল</span>
                                      </span>
                                    )}
                                    {risk === 'suspicious' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                                        <span>সন্দেহজনক</span>
                                      </span>
                                    )}
                                    {risk === 'fake' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                                        <AlertCircle className="w-2.5 h-2.5 text-red-600" />
                                        <span>ফেইক</span>
                                      </span>
                                    )}
                                    {risk === 'blacklisted' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-900 text-white">
                                        <Ban className="w-2.5 h-2.5 text-red-400" />
                                        <span>ব্লকড</span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 whitespace-nowrap">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        ord.status === 'delivered'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : ord.status === 'shipped'
                                          ? 'bg-blue-100 text-blue-800'
                                          : ord.status === 'processing'
                                          ? 'bg-amber-100 text-amber-800'
                                          : ord.status === 'cancelled'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {ord.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <button className="p-1 text-[#2D6A4F] hover:bg-emerald-50 rounded">
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Order Details Drawer / Right Card */}
                    <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E8E2D8] p-5 shadow-xs space-y-4 sticky top-4">
                      {selectedOrder ? (
                        <>
                          <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
                            <div>
                              <span className="text-[10px] text-gray-500 uppercase font-semibold">অর্ডার বিবরণী</span>
                              <h4 className="text-lg font-bold text-[#133E2B] flex items-center gap-2">
                                <span>{selectedOrder.orderNumber}</span>
                                {selectedOrder.verifiedByAdmin && (
                                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                                    <span>এডমিন ভেরিফাইড</span>
                                  </span>
                                )}
                              </h4>
                            </div>
                            <span className="text-xs text-gray-400 font-mono">
                              {new Date(selectedOrder.createdAt).toLocaleDateString('bn-BD', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* 1. SMART FRAUD & RISK ANALYSIS CARD */}
                          <div className={`p-4 rounded-xl border space-y-3 ${
                            (selectedOrder.riskLevel === 'blacklisted')
                              ? 'bg-gray-900 text-white border-gray-800'
                              : (selectedOrder.riskLevel === 'fake')
                              ? 'bg-red-50/80 border-red-300 text-red-950'
                              : (selectedOrder.riskLevel === 'suspicious')
                              ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                              : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                          }`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                                  অর্ডার ইন্টেলিজেন্স ও ফ্রড নির্ণয়
                                </span>
                                <h5 className="font-extrabold text-sm flex items-center gap-1.5 mt-0.5">
                                  {selectedOrder.riskLevel === 'blacklisted' && (
                                    <>
                                      <Ban className="w-4 h-4 text-red-400" />
                                      <span>নিষিদ্ধ / ব্লকলিস্টেড নম্বর (১০০% ঝুঁকি)</span>
                                    </>
                                  )}
                                  {selectedOrder.riskLevel === 'fake' && (
                                    <>
                                      <ShieldAlert className="w-4 h-4 text-red-600" />
                                      <span>সম্ভাব্য ফেইক অর্ডার (ঝুঁকি: {selectedOrder.riskScore || 70}%)</span>
                                    </>
                                  )}
                                  {selectedOrder.riskLevel === 'suspicious' && (
                                    <>
                                      <AlertCircle className="w-4 h-4 text-amber-600" />
                                      <span>সন্দেহজনক অর্ডার - যাচাই করুন (ঝুঁকি: {selectedOrder.riskScore || 40}%)</span>
                                    </>
                                  )}
                                  {(!selectedOrder.riskLevel || selectedOrder.riskLevel === 'real') && (
                                    <>
                                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                                      <span>নিরাপদ ও আসল অর্ডার (ঝুঁকি: {selectedOrder.riskScore || 0}%)</span>
                                    </>
                                  )}
                                </h5>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[11px] font-black ${
                                selectedOrder.riskLevel === 'blacklisted'
                                  ? 'bg-red-600 text-white'
                                  : selectedOrder.riskLevel === 'fake'
                                  ? 'bg-red-200 text-red-900'
                                  : selectedOrder.riskLevel === 'suspicious'
                                  ? 'bg-amber-200 text-amber-950'
                                  : 'bg-emerald-200 text-emerald-950'
                              }`}>
                                {selectedOrder.riskScore ?? 0}% ঝুঁকি
                              </span>
                            </div>

                            {/* Detected Reasons List */}
                            {selectedOrder.riskReasons && selectedOrder.riskReasons.length > 0 && (
                              <div className="space-y-1 text-xs pt-1 border-t border-black/10">
                                <span className="text-[10px] font-bold uppercase opacity-80 block">সিস্টেম যাচাই ফলাফল:</span>
                                {selectedOrder.riskReasons.map((r, i) => (
                                  <div key={i} className="flex items-start gap-1.5 text-[11px] leading-relaxed">
                                    <span className="shrink-0">{r.startsWith('✓') || r.startsWith('🌟') ? '🟢' : '🔴'}</span>
                                    <span className="font-medium">{r}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Risk Override & Fraud Action Buttons */}
                            <div className="pt-2 border-t border-black/10 flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                disabled={updatingRiskOrderId === selectedOrder.orderId}
                                onClick={() => handleOverrideRisk(selectedOrder.orderId, 'real', 0, 'অ্যাডমিন কর্তৃক ম্যানুয়ালি যাচাইকৃত আসল গ্রাহক')}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              >
                                <Check className="w-3 h-3 text-[#E8C547]" />
                                <span>আসল হিসেবে মার্ক করুন</span>
                              </button>

                              <button
                                type="button"
                                disabled={updatingRiskOrderId === selectedOrder.orderId}
                                onClick={() => handleOverrideRisk(selectedOrder.orderId, 'fake', 85, 'অ্যাডমিন কর্তৃক চিহ্নিত ভুয়া/ফেইক অর্ডার')}
                                className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              >
                                <ShieldAlert className="w-3 h-3" />
                                <span>ফেইক মার্ক করুন</span>
                              </button>

                              <button
                                type="button"
                                disabled={addingToBlacklist}
                                onClick={() => {
                                  if (confirm(`আপনি কি নিশ্চিত এই নম্বর (${selectedOrder.customer.phone}) ব্লকলিস্টে যোগ করতে চান? ভবিষ্যতে এই নম্বর থেকে আর অর্ডার আসবে না।`)) {
                                    handleAddToBlacklist(selectedOrder.customer.phone, 'ফেইক অর্ডার করার কারণে অ্যাডমিন ব্লক করেছে', selectedOrder.customer.name);
                                  }
                                }}
                                className="px-2.5 py-1 bg-gray-900 hover:bg-black text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              >
                                <Ban className="w-3 h-3 text-red-400" />
                                <span>নম্বর ব্লক করুন</span>
                              </button>
                            </div>

                            {/* Fast Direct Contact for Verification */}
                            <div className="pt-1.5 flex items-center gap-2 text-xs">
                              <a
                                href={`https://wa.me/${(selectedOrder.customer.phone || '').replace(/[^\d]/g, '').replace(/^0/, '880')}?text=${encodeURIComponent(`আসসালামু আলাইকুম ${selectedOrder.customer.name},\nআমার ঘর Online থেকে আপনার অর্ডার নং ${selectedOrder.orderNumber} (মোট: ৳${selectedOrder.total}) কনফার্মেশনের জন্য যোগাযোগ করা হয়েছে। অর্ডারটি ডেলিভারির জন্য প্রস্তুত করতে আপনার সম্মতি জানান। ধন্যবাদ!`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-1 px-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-lg font-bold flex items-center justify-center gap-1 shadow-xs text-center text-[11px]"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp যাচাই মেসেজ</span>
                              </a>
                              <a
                                href={`tel:${selectedOrder.customer.phone}`}
                                className="py-1 px-3 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg font-bold flex items-center gap-1 text-[11px]"
                              >
                                <PhoneCall className="w-3 h-3 text-emerald-700" />
                                <span>সরাসরি কল</span>
                              </a>
                            </div>
                          </div>

                          {/* Customer info & Address Management */}
                          <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E2D8] space-y-2 text-xs">
                            <div className="flex items-center justify-between pb-1.5 border-b border-[#E8E2D8]">
                              <span className="font-bold text-[#133E2B] flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-emerald-700" />
                                <span>গ্রাহকের তথ্য ও ডেলিভারি ঠিকানা</span>
                              </span>
                              {!editingCustomerInfo ? (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditCustomer(selectedOrder)}
                                  className="text-[11px] text-blue-600 hover:text-blue-800 underline font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>জিমেইল ও ঠিকানা এডিট</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-amber-600 font-bold">এডিটিং মোড...</span>
                              )}
                            </div>

                            {!editingCustomerInfo ? (
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-start">
                                  <span className="text-gray-500">গ্রাহকের নাম:</span>
                                  <strong className="text-gray-900 text-right">{selectedOrder.customer.name}</strong>
                                </div>
                                <div className="flex justify-between items-start">
                                  <span className="text-gray-500">ফোন নম্বর:</span>
                                  <a href={`tel:${selectedOrder.customer.phone}`} className="text-[#133E2B] font-bold underline text-right">
                                    {selectedOrder.customer.phone}
                                  </a>
                                </div>
                                <div className="flex justify-between items-start">
                                  <span className="text-gray-500 flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-gray-400" />
                                    <span>জিমেইল / ইমেইল:</span>
                                  </span>
                                  <span className="text-gray-900 font-medium text-right">
                                    {selectedOrder.customer.email ? (
                                      <a href={`mailto:${selectedOrder.customer.email}`} className="text-blue-600 hover:underline">
                                        {selectedOrder.customer.email}
                                      </a>
                                    ) : (
                                      <span className="text-gray-400 italic">দেওয়া হয়নি</span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between items-start pt-1 border-t border-dashed border-[#E8E2D8]">
                                  <span className="text-gray-500 flex items-center gap-1 shrink-0">
                                    <MapPin className="w-3 h-3 text-emerald-700" />
                                    <span>ডেলিভারি ঠিকানা:</span>
                                  </span>
                                  <span className="text-gray-900 text-right font-medium max-w-[65%]">
                                    {selectedOrder.customer.address}, <span className="font-bold text-[#133E2B]">{selectedOrder.customer.district}</span>
                                  </span>
                                </div>
                                {selectedOrder.customer.notes && (
                                  <div className="pt-1 text-[11px] text-gray-500 italic bg-amber-50/50 p-1.5 rounded border border-amber-100">
                                    <strong>নোট:</strong> {selectedOrder.customer.notes}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">গ্রাহকের নাম</label>
                                    <input
                                      type="text"
                                      value={customerEditForm.name}
                                      onChange={(e) => setCustomerEditForm({ ...customerEditForm, name: e.target.value })}
                                      className="w-full px-2 py-1 text-xs border rounded bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5">মোবাইল নম্বর</label>
                                    <input
                                      type="text"
                                      value={customerEditForm.phone}
                                      onChange={(e) => setCustomerEditForm({ ...customerEditForm, phone: e.target.value })}
                                      className="w-full px-2 py-1 text-xs border rounded bg-white"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5 flex items-center gap-1">
                                      <Mail className="w-2.5 h-2.5 text-emerald-700" />
                                      <span>গ্রাহকের জিমেইল / ইমেইল</span>
                                    </label>
                                    <input
                                      type="email"
                                      placeholder="customer@gmail.com"
                                      value={customerEditForm.email}
                                      onChange={(e) => setCustomerEditForm({ ...customerEditForm, email: e.target.value })}
                                      className="w-full px-2 py-1 text-xs border rounded bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-gray-700 mb-0.5 flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5 text-emerald-700" />
                                      <span>জেলা (District)</span>
                                    </label>
                                    <select
                                      value={customerEditForm.district}
                                      onChange={(e) => setCustomerEditForm({ ...customerEditForm, district: e.target.value })}
                                      className="w-full px-2 py-1 text-xs border rounded bg-white"
                                    >
                                      {BD_DISTRICTS.map((dist) => (
                                        <option key={dist} value={dist}>
                                          {dist}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                    সম্পূর্ণ ডেলিভারি ঠিকানা (বাসা/রোড/এলাকা/উপজেলা)
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={customerEditForm.address}
                                    onChange={(e) => setCustomerEditForm({ ...customerEditForm, address: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border rounded bg-white"
                                    placeholder="বাড়ি নং, রোড নং, থানা, জেলা"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-gray-700 mb-0.5">অর্ডার নোট / বিশেষ নির্দেশনা</label>
                                  <input
                                    type="text"
                                    value={customerEditForm.notes}
                                    onChange={(e) => setCustomerEditForm({ ...customerEditForm, notes: e.target.value })}
                                    className="w-full px-2 py-1 text-xs border rounded bg-white"
                                  />
                                </div>

                                <div className="flex items-center gap-2 pt-1 border-t border-[#E8E2D8]">
                                  <button
                                    type="button"
                                    disabled={savingCustomerInfo}
                                    onClick={() => handleSaveCustomerInfo(selectedOrder.orderId)}
                                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                                  >
                                    <Save className="w-3 h-3 text-[#E8C547]" />
                                    <span>{savingCustomerInfo ? 'সংরক্ষণ হচ্ছে...' : 'ঠিকানা ও তথ্য সেভ করুন'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCustomerInfo(false)}
                                    className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs"
                                  >
                                    বাতিল
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Ordered items */}
                          <div className="space-y-2">
                            <h5 className="text-xs font-bold text-gray-700 uppercase">অর্ডারকৃত পণ্যসমূহ:</h5>
                            <div className="divide-y divide-[#F2EDE4] max-h-48 overflow-y-auto pr-1">
                              {selectedOrder.items.map((it, idx) => (
                                <div key={idx} className="py-2 flex justify-between items-center text-xs">
                                  <div>
                                    <div className="font-bold text-gray-900">{it.nameBn}</div>
                                    <div className="text-[11px] text-gray-500">{it.selectedWeight} × {it.quantity}</div>
                                  </div>
                                  <span className="font-extrabold text-[#133E2B]">৳{it.price * it.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Price summary */}
                          <div className="border-t border-[#E8E2D8] pt-2 space-y-1.5 text-xs">
                            <div className="flex justify-between text-gray-600">
                              <span>সাবটোটাল:</span>
                              <span className="font-bold">৳{selectedOrder.subtotal}</span>
                            </div>

                            {selectedOrder.totalWeightKg && (
                              <div className="flex justify-between text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Scale className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>মোট ওজন:</span>
                                </span>
                                <span className="font-bold text-emerald-800">{selectedOrder.totalWeightKg} কেজি</span>
                              </div>
                            )}

                            <div className="bg-[#FAF8F5] p-2 rounded-lg border border-[#E8E2D8] space-y-1.5">
                              <div className="flex justify-between items-center text-gray-700">
                                <span className="flex items-center gap-1 font-semibold">
                                  <Truck className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>কুরিয়ার চার্জ:</span>
                                </span>
                                
                                {!editingOrderDelivery ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-[#133E2B]">৳{selectedOrder.deliveryCharge}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOrderDeliveryInput(selectedOrder.deliveryCharge);
                                        setEditingOrderDelivery(true);
                                      }}
                                      className="text-[10px] text-blue-600 hover:text-blue-800 underline font-semibold flex items-center gap-0.5"
                                    >
                                      <Edit3 className="w-2.5 h-2.5" />
                                      <span>ম্যানুয়াল পরিবর্তন</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      value={orderDeliveryInput}
                                      onChange={(e) => setOrderDeliveryInput(Number(e.target.value))}
                                      className="w-16 px-1.5 py-0.5 border rounded text-xs text-right font-bold"
                                    />
                                    <button
                                      type="button"
                                      disabled={savingOrderDelivery}
                                      onClick={() => handleSaveOrderDelivery(selectedOrder.orderId)}
                                      className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[11px] font-bold hover:bg-emerald-800"
                                    >
                                      {savingOrderDelivery ? '...' : 'সেভ'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingOrderDelivery(false)}
                                      className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-[11px] hover:bg-gray-300"
                                    >
                                      বাতিল
                                    </button>
                                  </div>
                                )}
                              </div>

                              {selectedOrder.deliveryBreakdown && (
                                <p className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 font-medium">
                                  {selectedOrder.deliveryBreakdown}
                                </p>
                              )}
                            </div>

                            <div className="flex justify-between font-extrabold text-sm text-[#133E2B] pt-1 border-t">
                              <span>মোট প্রদেয়:</span>
                              <span className="text-base">৳{selectedOrder.total}</span>
                            </div>
                          </div>

                          {/* Status changer */}
                          <div className="pt-2 border-t border-[#E8E2D8] space-y-2">
                            <label className="block text-xs font-bold text-gray-700">ডেলিভারি স্ট্যাটাস পরিবর্তন করুন:</label>
                            <div className="grid grid-cols-2 gap-2">
                              {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                                <button
                                  key={st}
                                  onClick={() => handleUpdateOrderStatus(selectedOrder.orderId, st)}
                                  className={`py-1.5 px-2 text-xs font-semibold rounded-lg border capitalize transition-all cursor-pointer ${
                                    selectedOrder.status === st
                                      ? 'bg-[#133E2B] text-white border-[#133E2B]'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-8 text-center text-gray-400 text-xs">
                          বামপাশ থেকে যেকোনো অর্ডারে ক্লিক করে ফ্রড বিশ্লেষণ ও বিস্তারিত দেখুন
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* Tab 2.5: Customer Intelligence & CRM Data (কাস্টমার ডেটাব্যাংক) */}
            {activeTab === 'customers' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                
                {/* Header with CSV Export */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E8E2D8]">
                  <div>
                    <h3 className="font-extrabold text-base text-[#133E2B] flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-700" />
                      <span>কাস্টমার ডেটাব্যাংক ও ইন্টেলিজেন্স (Customer CRM)</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      সকল গ্রাহকের নাম, ফোন নম্বর, সম্পূর্ণ ডেলিভারি ঠিকানা, মোট ব্যয় ও অর্ডার ইতিহাস সংগ্রহ
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportCustomersCSV}
                      disabled={customers.length === 0}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      title="এক্সেল ফাইল ডাউনলোড"
                    >
                      <Download className="w-4 h-4 text-[#E8C547]" />
                      <span>এক্সেল / CSV ডাউনলোড ({customers.length})</span>
                    </button>
                    <button
                      onClick={fetchCustomers}
                      disabled={customersLoading}
                      className="p-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl hover:bg-[#F2EDE4] transition-colors"
                      title="রিফ্রেশ করুন"
                    >
                      <RefreshCw className={`w-4 h-4 text-gray-700 ${customersLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Customer CRM Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <div 
                    onClick={() => setCustomerStatusFilter('all')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      customerStatusFilter === 'all'
                        ? 'bg-[#133E2B] text-white border-[#133E2B]'
                        : 'bg-white hover:bg-[#FAF8F5] border-[#E8E2D8] text-gray-800'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase opacity-80">মোট কাস্টমার</div>
                    <div className="text-lg font-black mt-0.5">{customerStats.total} জন</div>
                    <div className="text-[10px] opacity-70">ইউনিক ক্রেতা প্রোফাইল</div>
                  </div>

                  <div 
                    onClick={() => setCustomerStatusFilter('vip')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      customerStatusFilter === 'vip'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-amber-50/60 hover:bg-amber-100/70 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>ভিআইপি কাস্টমার</span>
                    </div>
                    <div className="text-lg font-black mt-0.5 text-amber-950">{customerStats.vip} জন</div>
                    <div className="text-[10px] text-amber-700 font-medium">৩+ অর্ডার বা ৫০০০+ ৳</div>
                  </div>

                  <div 
                    onClick={() => setCustomerStatusFilter('regular')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      customerStatusFilter === 'regular'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-emerald-50/50 hover:bg-emerald-100/60 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-600" />
                      <span>নিয়মিত ক্রেতা</span>
                    </div>
                    <div className="text-lg font-black mt-0.5 text-emerald-950">{customerStats.regular} জন</div>
                    <div className="text-[10px] text-emerald-700 font-medium">সফল ডেলিভারি সম্পন্ন</div>
                  </div>

                  <div 
                    onClick={() => setCustomerStatusFilter('new')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      customerStatusFilter === 'new'
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-blue-50/50 hover:bg-blue-100/60 border-blue-200 text-blue-900'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                      <User className="w-3 h-3 text-blue-600" />
                      <span>নতুন গ্রাহক</span>
                    </div>
                    <div className="text-lg font-black mt-0.5 text-blue-950">{customerStats.new} জন</div>
                    <div className="text-[10px] text-blue-700 font-medium">প্রথমবার অর্ডারকারী</div>
                  </div>

                  <div 
                    onClick={() => setCustomerStatusFilter('blacklisted')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      customerStatusFilter === 'blacklisted'
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                      <Ban className="w-3 h-3 text-red-600" />
                      <span>ব্লকড গ্রাহক</span>
                    </div>
                    <div className="text-lg font-black mt-0.5">{customerStats.blacklisted} জন</div>
                    <div className="text-[10px] text-gray-500 font-medium">ফেইক / নিষিদ্ধ</div>
                  </div>

                  <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/40 text-[#133E2B]">
                    <div className="text-[10px] font-bold uppercase text-emerald-800">মোট গ্রাহক ক্রয়</div>
                    <div className="text-lg font-black mt-0.5 text-[#133E2B]">{formatPrice(customerStats.totalSpent, 'bn')}</div>
                    <div className="text-[10px] text-emerald-700 font-medium">লাইফটাইম সেলস</div>
                  </div>
                </div>

                {/* Search Bar for Customers */}
                <div className="bg-white p-3 rounded-2xl border border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="নাম, মোবাইল নম্বর, ইমেইল, জেলা বা ঠিকানা লিখে কাস্টমার খুঁজুন..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                    {customerSearch && (
                      <button onClick={() => setCustomerSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs">
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <button
                      onClick={() => setCustomerStatusFilter('all')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        customerStatusFilter === 'all' ? 'bg-[#133E2B] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      সবাই ({customerStats.total})
                    </button>
                    <button
                      onClick={() => setCustomerStatusFilter('vip')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        customerStatusFilter === 'vip' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>ভিআইপি ({customerStats.vip})</span>
                    </button>
                    <button
                      onClick={() => setCustomerStatusFilter('regular')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        customerStatusFilter === 'regular' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      নিয়মিত ({customerStats.regular})
                    </button>
                    <button
                      onClick={() => setCustomerStatusFilter('blacklisted')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        customerStatusFilter === 'blacklisted' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      ব্লকড ({customerStats.blacklisted})
                    </button>
                  </div>
                </div>

                {/* Customers Table */}
                {filteredCustomers.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 text-center text-gray-500 border border-[#E8E2D8]">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold">কোনো কাস্টমার পাওয়া যায়নি।</p>
                    <p className="text-xs mt-1 text-gray-400">গ্রাহক অর্ডার সম্পন্ন করলে তাদের তথ্য স্বয়ংক্রিয়ভাবে এখানে সংগ্রহ হবে।</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-700">
                        <thead className="bg-[#FAF8F5] border-b border-[#E8E2D8] text-[10px] uppercase font-bold text-gray-600 tracking-wider">
                          <tr>
                            <th className="p-3.5">গ্রাহকের নাম ও ফোন</th>
                            <th className="p-3.5">ইমেইল / জিমেইল</th>
                            <th className="p-3.5">ডেলিভারি ঠিকানা ও জেলা</th>
                            <th className="p-3.5 text-center">মোট অর্ডার</th>
                            <th className="p-3.5">মোট ব্যয় (৳)</th>
                            <th className="p-3.5">সফল ডেলিভারি</th>
                            <th className="p-3.5">কাস্টমার ধরন</th>
                            <th className="p-3.5">এডমিন নোট</th>
                            <th className="p-3.5 text-right">যোগাযোগ ও অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F2EDE4]">
                          {filteredCustomers.map((cust) => {
                            const isBlacklisted = cust.status === 'blacklisted';
                            const isVip = cust.status === 'vip';
                            return (
                              <tr key={cust.phone} className="hover:bg-[#FAF8F5]/80 transition-colors">
                                <td className="p-3.5">
                                  <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                                    <span>{cust.name}</span>
                                    {isVip && (
                                      <span title="ভিআইপি ক্রেতা">
                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs font-mono font-semibold text-[#133E2B] flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-emerald-700" />
                                    <a href={`tel:${cust.phone}`} className="hover:underline">{cust.phone}</a>
                                  </div>
                                </td>

                                <td className="p-3.5">
                                  {cust.email ? (
                                    <a href={`mailto:${cust.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                                      <Mail className="w-3 h-3 text-gray-400" />
                                      <span className="truncate max-w-[150px]">{cust.email}</span>
                                    </a>
                                  ) : (
                                    <span className="text-gray-400 italic text-[11px]">নেই</span>
                                  )}
                                </td>

                                <td className="p-3.5 max-w-[200px]">
                                  <div className="font-medium text-gray-800 truncate" title={cust.address}>{cust.address}</div>
                                  <div className="text-[11px] font-bold text-[#133E2B]">{cust.district}</div>
                                </td>

                                <td className="p-3.5 text-center font-bold text-gray-900">
                                  <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                                    {cust.totalOrders}টি
                                  </span>
                                </td>

                                <td className="p-3.5 font-extrabold text-[#133E2B] text-sm whitespace-nowrap">
                                  {formatPrice(cust.totalSpent, 'bn')}
                                </td>

                                <td className="p-3.5 whitespace-nowrap">
                                  <div className="text-xs font-bold text-emerald-700">
                                    ✓ {cust.deliveredOrders}টি সফল
                                  </div>
                                  {cust.cancelledOrders > 0 && (
                                    <div className="text-[10px] text-red-600 font-medium">
                                      ✗ {cust.cancelledOrders}টি বাতিল
                                    </div>
                                  )}
                                </td>

                                <td className="p-3.5 whitespace-nowrap">
                                  {cust.status === 'vip' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-fit">
                                      <Star className="w-2.5 h-2.5 text-amber-600 fill-amber-600" />
                                      <span>ভিআইপি (VIP)</span>
                                    </span>
                                  )}
                                  {cust.status === 'regular' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 w-fit">
                                      নিয়মিত ক্রেতা
                                    </span>
                                  )}
                                  {cust.status === 'new' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 w-fit">
                                      নতুন গ্রাহক
                                    </span>
                                  )}
                                  {cust.status === 'suspicious' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 w-fit">
                                      সন্দেহজনক
                                    </span>
                                  )}
                                  {cust.status === 'blacklisted' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-900 text-white border border-gray-900 flex items-center gap-1 w-fit">
                                      <Ban className="w-2.5 h-2.5 text-red-400" />
                                      <span>ব্লকলিস্টেড</span>
                                    </span>
                                  )}
                                </td>

                                <td className="p-3.5 max-w-[160px]">
                                  {editingCustomerNotePhone === cust.phone ? (
                                    <div className="space-y-1">
                                      <input
                                        type="text"
                                        value={customerNoteText}
                                        onChange={(e) => setCustomerNoteText(e.target.value)}
                                        placeholder="নোট লিখুন..."
                                        className="w-full px-2 py-1 text-xs border rounded bg-white"
                                      />
                                      <div className="flex gap-1">
                                        <button
                                          type="button"
                                          disabled={savingCustomerNote}
                                          onClick={() => handleSaveCustomerNote(cust.phone, customerNoteText)}
                                          className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[10px] font-bold"
                                        >
                                          সেভ
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingCustomerNotePhone(null)}
                                          className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px]"
                                        >
                                          বাতিল
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[11px] text-gray-600 truncate">{cust.notes || <span className="text-gray-300 italic">নোট নেই</span>}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCustomerNotePhone(cust.phone);
                                          setCustomerNoteText(cust.notes || '');
                                        }}
                                        className="text-gray-400 hover:text-emerald-700 p-0.5"
                                        title="নোট লিখুন"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </td>

                                <td className="p-3.5 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <a
                                      href={`https://wa.me/${(cust.phone || '').replace(/[^\d]/g, '').replace(/^0/, '880')}?text=${encodeURIComponent(`আসসালামু আলাইকুম ${cust.name},\nআমার ঘর Online থেকে আপনার সাথে যোগাযোগ করা হচ্ছে।`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200"
                                      title="WhatsApp মেসেজ"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </a>

                                    <a
                                      href={`tel:${cust.phone}`}
                                      className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200"
                                      title="ফোন কল"
                                    >
                                      <PhoneCall className="w-3.5 h-3.5" />
                                    </a>

                                    <button
                                      type="button"
                                      onClick={() => setViewingCustomerOrders(cust)}
                                      className="px-2.5 py-1 text-xs font-bold text-[#133E2B] bg-[#FAF8F5] hover:bg-[#E8EFE9] border border-[#DDD5C7] rounded-lg flex items-center gap-1"
                                      title="এই গ্রাহকের সকল অর্ডার দেখুন"
                                    >
                                      <History className="w-3 h-3 text-emerald-700" />
                                      <span>অর্ডার ({cust.totalOrders})</span>
                                    </button>

                                    {!isBlacklisted ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (confirm(`আপনি কি এই গ্রাহককে (${cust.phone}) ব্লক করতে চান?`)) {
                                            handleAddToBlacklist(cust.phone, 'এডমিন কর্তৃক ব্লকড', cust.name);
                                          }
                                        }}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                                        title="ব্লকলিস্টে যোগ করুন"
                                      >
                                        <Ban className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (confirm(`এই গ্রাহককে (${cust.phone}) আনব্লক করতে চান?`)) {
                                            handleRemoveFromBlacklist(cust.phone);
                                          }
                                        }}
                                        className="px-2 py-1 text-[10px] font-bold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
                                        title="আনব্লক করুন"
                                      >
                                        আনব্লক
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2.8: Blacklist & Fraud Prevention System */}
            {activeTab === 'blacklist' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E8E2D8]">
                  <div>
                    <h3 className="font-extrabold text-base text-red-900 flex items-center gap-2">
                      <Ban className="w-5 h-5 text-red-600" />
                      <span>ফেইক অর্ডার রোধ ও ব্লকলিস্ট ম্যানেজমেন্ট (Blacklist & Security)</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      যেসব নম্বর থেকে ফেইক অর্ডার বা বারবার ডেলিভারি বাতিল করা হয় তাদের নম্বর এখানে ব্লক করে রাখা যায়
                    </p>
                  </div>
                  <button
                    onClick={fetchBlacklist}
                    disabled={blacklistLoading}
                    className="p-2 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl hover:bg-[#F2EDE4] transition-colors"
                    title="রিফ্রেশ করুন"
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-700 ${blacklistLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Add to Blacklist Form */}
                <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E2D8] space-y-3">
                  <h4 className="font-bold text-sm text-[#133E2B] flex items-center gap-1.5">
                    <UserX className="w-4 h-4 text-red-600" />
                    <span>নতুন নম্বর ব্লকলিস্টে যোগ করুন</span>
                  </h4>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddToBlacklist(newBlacklistPhone, newBlacklistReason, newBlacklistName);
                    }}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                  >
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">মোবাইল নম্বর (১১ ডিজিট) *</label>
                      <input
                        type="text"
                        required
                        placeholder="017xxxxxxxx"
                        value={newBlacklistPhone}
                        onChange={(e) => setNewBlacklistPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs border rounded-xl bg-white font-mono font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">গ্রাহকের নাম (ঐচ্ছিক)</label>
                      <input
                        type="text"
                        placeholder="গ্রাহকের নাম"
                        value={newBlacklistName}
                        onChange={(e) => setNewBlacklistName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">ব্লক করার কারণ *</label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: বারবার ফেইক অর্ডার / পার্সেল রিসিভ করে না"
                        value={newBlacklistReason}
                        onChange={(e) => setNewBlacklistReason(e.target.value)}
                        className="w-full px-3 py-2 text-xs border rounded-xl bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={addingToBlacklist}
                        className="w-full py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{addingToBlacklist ? 'যোগ হচ্ছে...' : 'ব্লক করুন'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Blacklisted Numbers List */}
                <div className="bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden shadow-xs">
                  <div className="p-3 bg-[#FAF8F5] border-b border-[#E8E2D8] flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">ব্লকলিস্টভুক্ত নম্বরসমূহ ({blacklist.length}টি)</span>
                    <div className="relative w-64">
                      <Search className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="ব্লকলিস্টে খুঁজুন..."
                        value={blacklistSearch}
                        onChange={(e) => setBlacklistSearch(e.target.value)}
                        className="w-full pl-7 pr-3 py-1 bg-white border border-[#DDD5C7] rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {blacklist.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 space-y-1">
                      <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-1" />
                      <p className="font-bold text-gray-700">বর্তমানে কোনো নম্বর ব্লকলিস্টে নেই।</p>
                      <p className="text-xs text-gray-400">কোনো সন্দেহজনক বা ফেইক নম্বর চিহ্নিত হলে উপরে ফর্ম থেকে যোগ করতে পারেন।</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-gray-700">
                        <thead className="bg-[#FAF8F5] border-b border-[#E8E2D8] text-[10px] uppercase font-bold text-gray-600">
                          <tr>
                            <th className="p-3.5">ব্লকড মোবাইল নম্বর</th>
                            <th className="p-3.5">গ্রাহকের নাম</th>
                            <th className="p-3.5">ব্লক করার কারণ</th>
                            <th className="p-3.5">ব্লক করার তারিখ</th>
                            <th className="p-3.5 text-right">অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F2EDE4]">
                          {blacklist
                            .filter(b => !blacklistSearch || b.phone.includes(blacklistSearch) || b.reason?.toLowerCase().includes(blacklistSearch.toLowerCase()))
                            .map((item) => (
                              <tr key={item.phone} className="hover:bg-red-50/40 transition-colors">
                                <td className="p-3.5 font-mono font-bold text-red-700 flex items-center gap-1.5">
                                  <Ban className="w-3.5 h-3.5 text-red-500" />
                                  <span>{item.phone}</span>
                                </td>
                                <td className="p-3.5 font-medium text-gray-900">{item.customerName || <span className="text-gray-400 italic">দেওয়া হয়নি</span>}</td>
                                <td className="p-3.5 text-gray-700 font-medium">{item.reason}</td>
                                <td className="p-3.5 text-gray-500 text-[11px]">
                                  {new Date(item.addedAt).toLocaleDateString('bn-BD', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </td>
                                <td className="p-3.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`আপনি কি এই নম্বর (${item.phone}) ব্লকলিস্ট থেকে মুক্ত (আনব্লক) করতে চান?`)) {
                                        handleRemoveFromBlacklist(item.phone);
                                      }
                                    }}
                                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    আনব্লক করুন
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Smart Fraud Intelligence Help Card */}
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2 text-xs text-emerald-950">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>আমার ঘর Online - স্মার্ট ফেইক অর্ডার প্রোটেকশন কীভাবে কাজ করে?</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-900/90">
                    আমাদের সিস্টেমে স্বয়ংক্রিয় ফ্রড ডিটেকশন এলগরিদম প্রতিটি অর্ডার আসার সাথে সাথে ৫টি প্যারামিটারে বিশ্লেষণ করে:
                    <strong> (১) ১১ ডিজিটের সঠিক বাংলাদেশি মোবাইল অপারেটর কোড</strong>, 
                    <strong> (২) ০১৭০০০০০০০০ বা পুনরাবৃত্তিমূলক টেস্ট নম্বর সনাক্তকরণ</strong>, 
                    <strong> (৩) অর্থপূর্ণ নাম ও সম্পূর্ণ ডেলিভারি ঠিকানা যাচাই</strong>, 
                    <strong> (৪) গত ২৪ ঘণ্টায় অতিরিক্ত অর্ডার ফ্রিকোয়েন্সি লিমিট</strong>, এবং 
                    <strong> (৫) পূর্ববর্তী সফল ডেলিভারি ট্র্যাক রেকর্ড</strong>।
                    আপনি সাইট সেটিংস থেকে ব্লকলিস্টেড নম্বর সরাসরি অর্ডার জমা দেওয়া নিষিদ্ধ করার অপশনও চালু রাখতে পারেন।
                  </p>
                </div>
              </div>
            )}

            {/* Customer Orders History Modal */}
            {viewingCustomerOrders && (
              <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[#DDD5C7] flex flex-col">
                  <div className="p-4 sm:p-5 border-b border-[#E8E2D8] bg-[#133E2B] text-white flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-base flex items-center gap-2">
                        <History className="w-4 h-4 text-[#E8C547]" />
                        <span>{viewingCustomerOrders.name} - এর পূর্ববর্তী অর্ডারসমূহ</span>
                      </h4>
                      <p className="text-xs text-emerald-200 font-mono mt-0.5">
                        মোবাইল: {viewingCustomerOrders.phone} | মোট ক্রয়: {formatPrice(viewingCustomerOrders.totalSpent, 'bn')}
                      </p>
                    </div>
                    <button
                      onClick={() => setViewingCustomerOrders(null)}
                      className="p-1.5 text-emerald-200 hover:text-white rounded-lg cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
                    {orders
                      .filter(o => o.customer?.phone?.replace(/[^\d]/g, '').endsWith(viewingCustomerOrders.phone.replace(/[^\d]/g, '').slice(-10)))
                      .map((ord) => (
                        <div key={ord.orderId} className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E8E2D8]">
                            <div>
                              <span className="font-bold text-[#133E2B] text-sm">{ord.orderNumber}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {new Date(ord.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                ord.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : ord.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-800'
                              }`}>
                                {ord.status}
                              </span>
                              <span className="text-sm font-extrabold text-[#133E2B]">{formatPrice(ord.total, 'bn')}</span>
                            </div>
                          </div>

                          <div className="text-xs space-y-1">
                            <div className="font-semibold text-gray-700">অর্ডারকৃত পণ্যসমূহ:</div>
                            <div className="divide-y divide-gray-200">
                              {ord.items.map((it, idx) => (
                                <div key={idx} className="py-1 flex justify-between text-gray-600">
                                  <span>{it.nameBn} ({it.selectedWeight} × {it.quantity})</span>
                                  <span className="font-bold">৳{it.price * it.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="text-[11px] text-gray-500 pt-1 border-t border-dashed border-[#DDD5C7] flex justify-between">
                            <span>ঠিকানা: {ord.customer.address}, {ord.customer.district}</span>
                            <span>পেমেন্ট: {ord.paymentMethod.toUpperCase()}</span>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="p-3 border-t bg-[#FAF8F5] flex justify-end">
                    <button
                      type="button"
                      onClick={() => setViewingCustomerOrders(null)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      বন্ধ করুন
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Contact Messages */}
            {activeTab === 'messages' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-[#E8E2D8]">
                  <h3 className="font-bold text-base text-[#133E2B]">
                    গ্রাহক বার্তা ও জিজ্ঞাসা
                  </h3>
                  <p className="text-xs text-gray-500">
                    ওয়েবসাইটের যোগাযোগ ফর্ম থেকে পাঠানো বার্তা
                  </p>
                </div>

                {messages.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 text-center text-gray-500 border border-[#E8E2D8]">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold">কোনো নতুন বার্তা নেই।</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {messages.map((m) => (
                      <div key={m.id} className="bg-white p-4 rounded-2xl border border-[#E8E2D8] space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-[#133E2B]">{m.name}</h4>
                            <a href={`tel:${m.phone}`} className="text-xs text-gray-600 underline">{m.phone}</a>
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {new Date(m.createdAt).toLocaleDateString('bn-BD')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D8] leading-relaxed">
                          {m.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Store Settings */}
            {activeTab === 'settings' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-[#E8E2D8] space-y-6">
                  {/* Top Bar Header & Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E2D8] pb-4">
                    <div>
                      <h3 className="font-extrabold text-lg text-[#133E2B] flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-[#D4AF37]" />
                        <span>ওয়েবসাইট ফিচার ও কাস্টমাইজেশন কন্ট্রোল প্যানেল</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        ওয়েবসাইটের প্রতিটি ফিচার চালু/বন্ধ করুন এবং সকল তথ্য, কুরিয়ার চার্জ ও লেখা কাস্টমাইজ করুন
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {settingsSuccess && (
                        <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>সকল সেটিংস সংরক্ষিত হয়েছে!</span>
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={savingSettings}
                        className="px-5 py-2.5 bg-[#133E2B] text-white font-bold text-xs rounded-xl hover:bg-[#1B4332] shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
                      >
                        <Save className="w-4 h-4 text-[#E8C547]" />
                        <span>{savingSettings ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. MASTER FEATURE TOGGLES (ফিচার চালু বা বন্ধ করার অপশন) */}
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E2D8] space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E2D8] pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#133E2B] text-white flex items-center justify-center shrink-0">
                          <Sliders className="w-4 h-4 text-[#E8C547]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#133E2B]">ফিচার ও অপশন কন্ট্রোল (Feature Toggles)</h4>
                          <p className="text-[11px] text-gray-500">যেকোনো ফিচার এক ক্লিকে চালু (ON) বা বন্ধ (OFF) করুন</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSettingsForm((prev) => ({
                              ...prev,
                              features: {
                                showAnnouncement: true,
                                showLanguageSwitcher: true,
                                showFontSwitcher: true,
                                showSearchBar: true,
                                showHeroSection: true,
                                showCategoryBar: true,
                                showHomeDecorSection: true,
                                showTrustBanner: true,
                                showAboutSection: true,
                                showContactSection: true,
                                showFloatingWhatsApp: true,
                                showProductWhatsAppBtn: true,
                                showStockBadge: true,
                                showCheckoutEmailField: true,
                                enableOrderNotes: true
                              },
                              paymentMethods: {
                                ...prev.paymentMethods,
                                cod: true,
                                bkash: true,
                                nagad: true
                              }
                            }));
                          }}
                          className="px-3 py-1 bg-white hover:bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-300 transition-colors"
                        >
                          সব ফিচার চালু করুন
                        </button>
                      </div>
                    </div>

                    {/* Toggle Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        {
                          key: 'showAnnouncement' as const,
                          icon: <Bell className="w-4 h-4 text-emerald-700" />,
                          titleBn: 'টপ নোটিশ / অ্যানাউন্সমেন্ট বার',
                          titleEn: 'Top Announcement Bar',
                          desc: 'হেডারের উপরে লাল/সবুজ নোটিশ বার প্রদর্শন',
                          active: settingsForm.features?.showAnnouncement !== false
                        },
                        {
                          key: 'showHeroSection' as const,
                          icon: <Sparkles className="w-4 h-4 text-amber-600" />,
                          titleBn: 'হিরো ব্যানার সেকশন',
                          titleEn: 'Hero Banner Section',
                          desc: 'হোমপেজের মূল বড় হেডলাইন ও ব্যানার সেকশন',
                          active: settingsForm.features?.showHeroSection !== false
                        },
                        {
                          key: 'showCategoryBar' as const,
                          icon: <Layout className="w-4 h-4 text-blue-600" />,
                          titleBn: 'ক্যাটাগরি ফিল্টার বার',
                          titleEn: 'Category Filter Bar',
                          desc: 'মধু, ঘি, তেল, ড্রাই ফ্রুটস ইত্যাদি ক্যাটাগরি বাটন',
                          active: settingsForm.features?.showCategoryBar !== false
                        },
                        {
                          key: 'showSearchBar' as const,
                          icon: <Search className="w-4 h-4 text-purple-600" />,
                          titleBn: 'সার্চ বার (পণ্য অনুসন্ধান)',
                          titleEn: 'Product Search Bar',
                          desc: 'হেডারে সরাসরি পণ্য খোঁজার সার্চ ইনপুট',
                          active: settingsForm.features?.showSearchBar !== false
                        },
                        {
                          key: 'showHomeDecorSection' as const,
                          icon: <Package className="w-4 h-4 text-amber-700" />,
                          titleBn: 'হোম ডেকোর শোকেস সেকশন',
                          titleEn: 'Home Decor Section',
                          desc: 'হোমপেজে হস্তশিল্প ও নান্দনিক সাজসজ্জা সেকশন',
                          active: settingsForm.features?.showHomeDecorSection !== false
                        },
                        {
                          key: 'showTrustBanner' as const,
                          icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
                          titleBn: '৩টি গ্যারান্টি ও ট্রাস্ট কার্ড',
                          titleEn: '3 Trust Guarantee Cards',
                          desc: 'নিরাপদ খাদ্য, ডেলিভারি ও ক্যাশ অন ডেলিভারি হাইলাইট',
                          active: settingsForm.features?.showTrustBanner !== false
                        },
                        {
                          key: 'showAboutSection' as const,
                          icon: <FileText className="w-4 h-4 text-teal-600" />,
                          titleBn: 'আমাদের সম্পর্কে সেকশন',
                          titleEn: 'About Us Section on Home',
                          desc: 'হোমপেজে ব্র্যান্ডের গল্প ও পরিচিতি প্রদর্শন',
                          active: settingsForm.features?.showAboutSection !== false
                        },
                        {
                          key: 'showContactSection' as const,
                          icon: <Mail className="w-4 h-4 text-indigo-600" />,
                          titleBn: 'যোগাযোগ ও মেসেজ ফর্ম',
                          titleEn: 'Contact & Inquiry Form',
                          desc: 'গ্রাহকদের সরাসরি মেসেজ পাঠানো ও যোগাযোগের অপশন',
                          active: settingsForm.features?.showContactSection !== false
                        },
                        {
                          key: 'showFloatingWhatsApp' as const,
                          icon: <MessageCircle className="w-4 h-4 text-emerald-500" />,
                          titleBn: 'ভাসমান হোয়াটসঅ্যাপ ও কল বাটন',
                          titleEn: 'Floating Quick Contact',
                          desc: 'স্ক্রিনের নিচে ডানপাশে ভাসমান চ্যাট ও কল বাটন',
                          active: settingsForm.features?.showFloatingWhatsApp !== false
                        },
                        {
                          key: 'showLanguageSwitcher' as const,
                          icon: <Globe className="w-4 h-4 text-blue-500" />,
                          titleBn: 'ভাষা পরিবর্তন (বাংলা/English)',
                          titleEn: 'Language Switcher',
                          desc: 'হেডারে বাংলা ও ইংরেজি ভাষা পরিবর্তনের বাটন',
                          active: settingsForm.features?.showLanguageSwitcher !== false
                        },
                        {
                          key: 'showFontSwitcher' as const,
                          icon: <Type className="w-4 h-4 text-orange-600" />,
                          titleBn: 'বাংলা ফন্ট পরিবর্তন ড্রপডাউন',
                          titleEn: 'Font Switcher Dropdown',
                          desc: 'হেডারে গ্রাহকের পছন্দমতো ফন্ট পরিবর্তনের মেনু',
                          active: settingsForm.features?.showFontSwitcher !== false
                        },
                        {
                          key: 'showProductWhatsAppBtn' as const,
                          icon: <MessageCircle className="w-4 h-4 text-emerald-600" />,
                          titleBn: 'কার্ডে সরাসরি হোয়াটসঅ্যাপ অর্ডার',
                          titleEn: 'Product WhatsApp Button',
                          desc: 'প্রতিটি পণ্যের কার্ডে সরাসরি হোয়াটসঅ্যাপে অর্ডারের লিংক',
                          active: settingsForm.features?.showProductWhatsAppBtn !== false
                        },
                        {
                          key: 'showStockBadge' as const,
                          icon: <Package className="w-4 h-4 text-rose-600" />,
                          titleBn: 'স্টক স্ট্যাটাস ব্যাজ',
                          titleEn: 'Stock Status Badge',
                          desc: 'স্টক শেষ হলে পণ্যের উপর স্টক আউট ব্যাজ দেখানো',
                          active: settingsForm.features?.showStockBadge !== false
                        },
                        {
                          key: 'showCheckoutEmailField' as const,
                          icon: <Mail className="w-4 h-4 text-cyan-600" />,
                          titleBn: 'অর্ডারে জিমেইল ইনপুট অপশন',
                          titleEn: 'Checkout Gmail Field',
                          desc: 'চেকআউট ফর্মে গ্রাহকের ঐচ্ছিক জিমেইল ইনপুট ফিল্ড',
                          active: settingsForm.features?.showCheckoutEmailField !== false
                        },
                        {
                          key: 'enableOrderNotes' as const,
                          icon: <FileText className="w-4 h-4 text-stone-600" />,
                          titleBn: 'অর্ডারে বিশেষ নির্দেশনা নোট',
                          titleEn: 'Order Special Notes',
                          desc: 'গ্রাহকের জন্য বিশেষ কোনো নির্দেশনা লেখার ফিল্ড',
                          active: settingsForm.features?.enableOrderNotes !== false
                        }
                      ].map((item) => (
                        <div
                          key={item.key}
                          className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                            item.active
                              ? 'bg-white border-[#DDD5C7] shadow-xs'
                              : 'bg-gray-50/80 border-gray-200 opacity-75'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {item.icon}
                              <h5 className="font-bold text-xs text-gray-900 leading-tight">
                                {item.titleBn}
                              </h5>
                            </div>
                            <p className="text-[10px] text-gray-500 leading-normal">
                              {item.desc}
                            </p>
                            <span
                              className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                item.active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {item.active ? 'সক্রিয় (ON)' : 'বন্ধ (OFF)'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleFeature(item.key)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              item.active ? 'bg-[#133E2B]' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                item.active ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Payment Gateways Toggles */}
                    <div className="pt-3 border-t border-[#E8E2D8]">
                      <h5 className="font-bold text-xs text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-[#133E2B]" />
                        <span>পেমেন্ট মেথড সুইচ (Payment Gateways On/Off):</span>
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* COD Toggle */}
                        <div
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                            settingsForm.paymentMethods.cod ? 'bg-white border-[#DDD5C7]' : 'bg-gray-50 border-gray-200 opacity-70'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs text-gray-800 block">ক্যাশ অন ডেলিভারি (COD)</span>
                            <span className="text-[10px] text-gray-500">পণ্য হাতে পেয়ে মূল্য পরিশোধ</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({
                                ...settingsForm,
                                paymentMethods: {
                                  ...settingsForm.paymentMethods,
                                  cod: !settingsForm.paymentMethods.cod
                                }
                              })
                            }
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                              settingsForm.paymentMethods.cod ? 'bg-[#133E2B]' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                                settingsForm.paymentMethods.cod ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* bKash Toggle */}
                        <div
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                            settingsForm.paymentMethods.bkash ? 'bg-white border-[#DDD5C7]' : 'bg-gray-50 border-gray-200 opacity-70'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs text-[#E2136E] block">বিকাশ পেমেন্ট (bKash)</span>
                            <span className="text-[10px] text-gray-500">বিকাশ সেন্ড মানি ও ট্রানজেকশন</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({
                                ...settingsForm,
                                paymentMethods: {
                                  ...settingsForm.paymentMethods,
                                  bkash: !settingsForm.paymentMethods.bkash
                                }
                              })
                            }
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                              settingsForm.paymentMethods.bkash ? 'bg-[#E2136E]' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                                settingsForm.paymentMethods.bkash ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Nagad Toggle */}
                        <div
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                            settingsForm.paymentMethods.nagad ? 'bg-white border-[#DDD5C7]' : 'bg-gray-50 border-gray-200 opacity-70'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs text-[#F7931E] block">নগদ পেমেন্ট (Nagad)</span>
                            <span className="text-[10px] text-gray-500">নগদ সেন্ড মানি ও ট্রানজেকশন</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({
                                ...settingsForm,
                                paymentMethods: {
                                  ...settingsForm.paymentMethods,
                                  nagad: !settingsForm.paymentMethods.nagad
                                }
                              })
                            }
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                              settingsForm.paymentMethods.nagad ? 'bg-[#F7931E]' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                                settingsForm.paymentMethods.nagad ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. BRAND NAME, SLOGAN & IDENTITY */}
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E2D8] space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-[#E8E2D8] pb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#133E2B] text-white flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-[#E8C547]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#133E2B]">ব্র্যান্ডের নাম ও স্লোগান (Brand Identity)</h4>
                        <p className="text-[11px] text-gray-500">হেডার, ফুটার এবং ব্রাউজার মেটাট্যাগে প্রদর্শিত হবে</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">ব্র্যান্ড নাম (বাংলা)</label>
                        <input
                          type="text"
                          value={settingsForm.brandNameBn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, brandNameBn: e.target.value })}
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white font-medium"
                          placeholder="আমার ঘর Online"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Brand Name (English)</label>
                        <input
                          type="text"
                          value={settingsForm.brandNameEn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, brandNameEn: e.target.value })}
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white font-medium"
                          placeholder="Amar Ghor Online"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">ট্যাগলাইন / স্লোগান (বাংলা)</label>
                        <input
                          type="text"
                          value={settingsForm.taglineBn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, taglineBn: e.target.value })}
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                          placeholder="আপন ঘরের মতো নিরাপদ"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Tagline / Slogan (English)</label>
                        <input
                          type="text"
                          value={settingsForm.taglineEn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, taglineEn: e.target.value })}
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                          placeholder="Trusted Products for Your Home"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. BRAND LOGO, FAVICON & BENGALI FONT */}
                  <div className="p-4 sm:p-5 bg-[#FAF8F5] rounded-2xl border border-[#E8E2D8] space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E8E2D8] pb-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#133E2B]" />
                        <h4 className="text-xs font-bold text-[#133E2B] uppercase tracking-wider">
                          ব্র্যান্ড লোগো, ফ্যাভিকন ও ফন্ট (Logo & Font)
                        </h4>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                        {settingsForm.logoUrl ? 'কাস্টম লোগো সক্রিয়' : 'ডিফল্ট ভেক্টর লোগো সক্রিয়'}
                      </span>
                    </div>

                    {/* Live Previews */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      <div className="bg-white p-3 rounded-lg border border-[#E8E2D8] space-y-1.5 shadow-xs">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                          ওয়েবসাইট হেডার প্রিভিউ:
                        </span>
                        <div className="py-2 px-1 border-t border-gray-100">
                          <BrandLogo 
                            size="sm" 
                            logoUrl={settingsForm.logoUrl} 
                            mode={settingsForm.logoDisplayMode || 'icon_and_text'} 
                            showTagline={true}
                          />
                        </div>
                      </div>

                      <div className="bg-[#133E2B] p-3 rounded-lg border border-[#2D6A4F] space-y-1.5 shadow-xs text-white">
                        <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
                          ফুটার প্রিভিউ (ডার্ক):
                        </span>
                        <div className="py-2 px-1 border-t border-emerald-800/60">
                          <BrandLogo 
                            size="sm" 
                            dark 
                            logoUrl={settingsForm.logoUrl} 
                            mode={settingsForm.logoDisplayMode || 'icon_and_text'} 
                            showTagline={true}
                          />
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-[#E8E2D8] space-y-1.5 shadow-xs">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                          ব্রাউজার ট্যাব আইকন (Favicon):
                        </span>
                        <div className="py-2 px-2 bg-gray-100 rounded-md border border-gray-200 flex items-center gap-2">
                          <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0 bg-white shadow-xs flex items-center justify-center">
                            {settingsForm.logoUrl ? (
                              <img src={settingsForm.logoUrl} alt="Favicon" className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-[8px] font-bold text-emerald-800">আ</span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-700 font-medium truncate">
                            {settingsForm.brandNameBn || 'আমার ঘর Online'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Logo Upload & Controls */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E8E2D8]">
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#133E2B] text-white text-xs font-semibold rounded-lg hover:bg-[#1B4332] cursor-pointer shadow-xs transition-colors">
                        <Upload className="w-3.5 h-3.5 text-[#E8C547]" />
                        <span>{uploadingLogo ? 'লোগো আপলোড হচ্ছে...' : 'নতুন লোগো আপলোড করুন'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingLogo}
                          onChange={handleLogoFileChange}
                          className="hidden"
                        />
                      </label>

                      {settingsForm.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, logoUrl: '' })}
                          className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                        >
                          ডিফল্ট ভেক্টর লোগো রিস্টোর করুন
                        </button>
                      )}
                    </div>

                    {/* Logo Display Mode & Font Selection */}
                    <div className="pt-2 border-t border-[#E8E2D8] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          লোগো প্রদর্শনের ধরন (Display Style):
                        </label>
                        <select
                          value={settingsForm.logoDisplayMode || 'icon_and_text'}
                          onChange={(e) => setSettingsForm({ ...settingsForm, logoDisplayMode: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 border rounded-lg bg-white text-xs"
                        >
                          <option value="icon_and_text">আইকন বক্স + ব্র্যান্ড নাম ও স্লোগান (প্রস্তাবিত)</option>
                          <option value="image_only">শুধুমাত্র সম্পূর্ণ লোগো ছবি (Full Image Logo)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          লোগো ইমেজ লিঙ্ক (Image URL):
                        </label>
                        <input
                          type="text"
                          value={settingsForm.logoUrl || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                          placeholder="/logo.png বা যেকোনো ছবির URL"
                          className="w-full px-2.5 py-1.5 border rounded-lg bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          ওয়েবসাইটের বাংলা ফন্ট (Default Bengali Font):
                        </label>
                        <select
                          value={settingsForm.bengaliFont || 'hind'}
                          onChange={(e) => setSettingsForm({ ...settingsForm, bengaliFont: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 border rounded-lg bg-white text-xs"
                        >
                          <option value="hind">হিন্দ শিলিগুড়ি (Hind Siliguri - মডার্ন ও ক্লিন)</option>
                          <option value="noto">নোটো সান্স বেঙ্গলি (Noto Sans Bengali - গুগল স্ট্যান্ডার্ড)</option>
                          <option value="anek">অনেকা বাংলা (Anek Bangla - আকর্ষণীয় ও বোল্ড)</option>
                          <option value="tiro">তিরো বাংলা (Tiro Bangla - ঐতিহ্যবাহী ও ক্লাসিক্যাল)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 4. BUSINESS CONTACT, GMAIL & ADDRESS SETTINGS */}
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E2D8] space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-[#E8E2D8] pb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#133E2B] text-white flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-[#E8C547]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#133E2B]">জিমেইল ও অফিসের ঠিকানা সেটিংস (Gmail & Address)</h4>
                        <p className="text-[11px] text-gray-500">ফুটার, যোগাযোগ পেজ ও গ্রাহকদের যোগাযোগের জন্য ব্যবহৃত হবে</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-emerald-700" />
                          <span>ব্যবসার জিমেইল / ইমেইল (Gmail)</span>
                        </label>
                        <input
                          type="email"
                          value={settingsForm.email || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                          placeholder="amarghoronline.bd@gmail.com"
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white font-medium"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">ওয়েবসাইটের ফুটার ও কন্টাক্ট পেজে দেখানো হবে</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">ফোন নম্বর (হটলাইন)</label>
                        <input
                          type="text"
                          value={settingsForm.phone}
                          onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white font-medium"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">সরাসরি কল করার নম্বর</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp নম্বর</label>
                        <input
                          type="text"
                          value={settingsForm.whatsapp}
                          onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white font-medium"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">হোয়াটসঅ্যাপে চ্যাট বা অর্ডার</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="bg-white p-3 rounded-xl border border-[#DDD5C7]">
                        <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                          <span>অফিস / শোরুমের ঠিকানা (বাংলা)</span>
                        </label>
                        <textarea
                          rows={2}
                          value={settingsForm.addressBn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, addressBn: e.target.value })}
                          placeholder="গাববাড়ি, কসবা, ব্রাহ্মণবাড়িয়া"
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-[#FAF8F5]"
                        />
                        <p className="text-[10px] text-gray-500 mt-0.5">ফুটার ও যোগাযোগ পেজের বাংলা ঠিকানা</p>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-[#DDD5C7]">
                        <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Office / Showroom Address (English)</span>
                        </label>
                        <textarea
                          rows={2}
                          value={settingsForm.addressEn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, addressEn: e.target.value })}
                          placeholder="Gabbari, Kasba, Brahmanbaria"
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-[#FAF8F5]"
                        />
                        <p className="text-[10px] text-gray-500 mt-0.5">ইংরেজি ভার্সনে এই ঠিকানা প্রদর্শিত হবে</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">ব্যবসার সময়সূচী (বাংলা)</label>
                        <input
                          type="text"
                          value={settingsForm.businessHoursBn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, businessHoursBn: e.target.value })}
                          placeholder="প্রতিদিন সকাল ৯:০০ টা থেকে রাত ১০:০০ টা পর্যন্ত"
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Business Hours (English)</label>
                        <input
                          type="text"
                          value={settingsForm.businessHoursEn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, businessHoursEn: e.target.value })}
                          placeholder="Everyday 9:00 AM to 10:00 PM"
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. COURIER & DELIVERY CHARGE SYSTEM */}
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E2D8] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E2D8] pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#133E2B] text-white flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4 text-[#E8C547]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#133E2B]">কুরিয়ার ও ডেলিভারি চার্জ সেটিংস</h4>
                          <p className="text-[11px] text-gray-500">ওজন অনুযায়ী অটোমেটিক এবং ম্যানুয়াল কুরিয়ার রেট পরিচালনা করুন</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#DDD5C7] text-xs shrink-0 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, deliveryPricingType: 'weight_based' })}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            (settingsForm.deliveryPricingType ?? 'weight_based') === 'weight_based'
                              ? 'bg-[#133E2B] text-white shadow-xs'
                              : 'text-gray-600 hover:text-black'
                          }`}
                        >
                          ওজন অনুযায়ী (Weight-Based)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, deliveryPricingType: 'flat_zone' })}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            settingsForm.deliveryPricingType === 'flat_zone'
                              ? 'bg-[#133E2B] text-white shadow-xs'
                              : 'text-gray-600 hover:text-black'
                          }`}
                        >
                          এলাকা অনুযায়ী (Fixed Zone)
                        </button>
                      </div>
                    </div>

                    {(settingsForm.deliveryPricingType ?? 'weight_based') === 'weight_based' ? (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                          <strong>💡 কুরিয়ার নিয়ম:</strong> সারা বাংলাদেশে হাফ কেজি <strong>৳{settingsForm.deliveryHalfKgRate || 120}</strong>, 
                          ১ম কেজি <strong>৳{settingsForm.deliveryBase1KgRate || 140}</strong>, এবং ১ কেজির বেশি হলে পরবর্তী প্রতি কেজিতে <strong>+৳{settingsForm.deliveryExtraPerKgRate || 20}</strong> স্বয়ংক্রিয়ভাবে যুক্ত হবে।
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-white p-3 rounded-xl border border-[#DDD5C7]">
                            <label className="block text-xs font-bold text-gray-800 mb-1">
                              হাফ কেজি (≤ ০.৫ কেজি) চার্জ (৳)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={settingsForm.deliveryHalfKgRate ?? 120}
                              onChange={(e) => setSettingsForm({ ...settingsForm, deliveryHalfKgRate: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs border rounded-lg font-bold text-[#133E2B]"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">০.৫ কেজি বা তার কম ওজনের চার্জ</p>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-[#DDD5C7]">
                            <label className="block text-xs font-bold text-gray-800 mb-1">
                              ১ম কেজি বেস চার্জ (৳)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={settingsForm.deliveryBase1KgRate ?? 140}
                              onChange={(e) => setSettingsForm({ ...settingsForm, deliveryBase1KgRate: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs border rounded-lg font-bold text-[#133E2B]"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">০.৫ থেকে ১ কেজি পর্যন্ত চার্জ</p>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-[#DDD5C7]">
                            <label className="block text-xs font-bold text-gray-800 mb-1">
                              পরবর্তী প্রতি কেজি অতিরিক্ত (৳)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={settingsForm.deliveryExtraPerKgRate ?? 20}
                              onChange={(e) => setSettingsForm({ ...settingsForm, deliveryExtraPerKgRate: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-xs border rounded-lg font-bold text-[#133E2B]"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">১ কেজির অতিরিক্ত প্রতি ১ কেজিতে যোগ হবে</p>
                          </div>
                        </div>

                        {/* Live Simulator */}
                        <div className="bg-white p-3 rounded-xl border border-[#DDD5C7] space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-gray-700 flex items-center gap-1">
                              <Scale className="w-3.5 h-3.5 text-emerald-700" />
                              <span>কুরিয়ার চার্জ ক্যালকুলেটর টেস্ট (পরীক্ষা করুন):</span>
                            </span>
                            <div className="flex flex-wrap items-center gap-1">
                              {[0.5, 1, 1.5, 2, 3, 5].map((w) => (
                                <button
                                  key={w}
                                  type="button"
                                  onClick={() => setSimWeight(w)}
                                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                                    simWeight === w
                                      ? 'bg-[#133E2B] text-white shadow-xs'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {w} কেজি
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="p-2.5 bg-[#FAF8F5] rounded-lg border border-[#E8E2D8] flex items-center justify-between text-xs">
                            <div>
                              <span className="text-gray-500">টেস্ট ওজন: </span>
                              <strong className="text-gray-900">{simWeight} কেজি</strong>
                              <span className="text-gray-400 mx-2">|</span>
                              <span className="text-gray-500">হিসাব: </span>
                              <span className="text-gray-700 font-medium">
                                {simWeight <= 0.5
                                  ? `হাফ কেজি ফিক্সড রেট`
                                  : simWeight <= 1.0
                                  ? `১ কেজি বেস রেট`
                                  : `১ম কেজি ৳${settingsForm.deliveryBase1KgRate || 140} + অতিরিক্ত ${Math.ceil(simWeight - 1)} কেজি (৳${(settingsForm.deliveryExtraPerKgRate || 20) * Math.ceil(simWeight - 1)})`}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-gray-500 block uppercase">ক্যালকুলেটেড চার্জ</span>
                              <span className="text-base font-extrabold text-[#133E2B]">
                                ৳{simWeight <= 0.5
                                  ? (settingsForm.deliveryHalfKgRate || 120)
                                  : simWeight <= 1.0
                                  ? (settingsForm.deliveryBase1KgRate || 140)
                                  : (settingsForm.deliveryBase1KgRate || 140) + Math.ceil(simWeight - 1) * (settingsForm.deliveryExtraPerKgRate || 20)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                        <div className="bg-white p-3 rounded-xl border border-[#DDD5C7]">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">ঢাকার ভেতর ডেলিভারি চার্জ (৳)</label>
                          <input
                            type="number"
                            value={settingsForm.deliveryInsideDhaka}
                            onChange={(e) => setSettingsForm({ ...settingsForm, deliveryInsideDhaka: Number(e.target.value) })}
                            className="w-full px-3 py-2 text-xs border rounded-lg font-bold"
                          />
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-[#DDD5C7]">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">ঢাকার বাইরে ডেলিভারি চার্জ (৳)</label>
                          <input
                            type="number"
                            value={settingsForm.deliveryOutsideDhaka}
                            onChange={(e) => setSettingsForm({ ...settingsForm, deliveryOutsideDhaka: Number(e.target.value) })}
                            className="w-full px-3 py-2 text-xs border rounded-lg font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 6. PAYMENT NUMBERS (BKASH & NAGAD) */}
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E2D8] space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-[#E8E2D8] pb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#133E2B] text-white flex items-center justify-center shrink-0">
                        <DollarSign className="w-4 h-4 text-[#E8C547]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#133E2B]">বিকাশ ও নগদ সেন্ড মানি অ্যাকাউন্ট সেটিংস</h4>
                        <p className="text-[11px] text-gray-500">গ্রাহকরা চেকআউটে এই নম্বরগুলো দেখে সেন্ড মানি করবেন</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 text-[#E2136E] font-bold">
                          বিকাশ পার্সোনাল নম্বর ও নির্দেশিকা
                        </label>
                        <input
                          type="text"
                          value={settingsForm.paymentMethods.bkashNumber}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            paymentMethods: { ...settingsForm.paymentMethods, bkashNumber: e.target.value }
                          })}
                          placeholder="01742749028 (Personal/Send Money)"
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 text-[#F7931E] font-bold">
                          নগদ পার্সোনাল নম্বর ও নির্দেশিকা
                        </label>
                        <input
                          type="text"
                          value={settingsForm.paymentMethods.nagadNumber}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            paymentMethods: { ...settingsForm.paymentMethods, nagadNumber: e.target.value }
                          })}
                          placeholder="01742749028 (Personal/Send Money)"
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 7. TOP ANNOUNCEMENT & HERO BANNER CUSTOMIZATION */}
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E2D8] space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-[#E8E2D8] pb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#133E2B] text-white flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-[#E8C547]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#133E2B]">টপ নোটিশ ও হিরো ব্যানার টেক্সট কাস্টমাইজেশন</h4>
                        <p className="text-[11px] text-gray-500">হোমপেজের ব্যানার হেডলাইন, সাব-হেডলাইন ও নোটিশ বার বার্তা</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">অ্যানাউন্সমেন্ট বার বার্তা (বাংলা)</label>
                        <input
                          type="text"
                          value={settingsForm.announcementBn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, announcementBn: e.target.value })}
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Announcement Message (English)</label>
                        <input
                          type="text"
                          value={settingsForm.announcementEn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, announcementEn: e.target.value })}
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">হিরো ব্যাজ টেক্সট (বাংলা)</label>
                        <input
                          type="text"
                          value={settingsForm.heroBadgeBn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroBadgeBn: e.target.value })}
                          placeholder="আমার ঘর Online · বিশ্বস্ততার প্রতীক"
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Hero Badge Text (English)</label>
                        <input
                          type="text"
                          value={settingsForm.heroBadgeEn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroBadgeEn: e.target.value })}
                          placeholder="Amar Ghor Online · Symbol of Trust"
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">হিরো প্রধান শিরোনাম (বাংলা)</label>
                        <input
                          type="text"
                          value={settingsForm.heroHeadlineBn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroHeadlineBn: e.target.value })}
                          placeholder="আপন ঘরের মতো নিরাপদ"
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Hero Main Headline (English)</label>
                        <input
                          type="text"
                          value={settingsForm.heroHeadlineEn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroHeadlineEn: e.target.value })}
                          placeholder="Safe & Pure Like Your Own Home"
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">হিরো সাব-শিরোনাম (বাংলা)</label>
                        <textarea
                          rows={2}
                          value={settingsForm.heroSubheadlineBn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroSubheadlineBn: e.target.value })}
                          placeholder="“বিশ্বস্ত উৎস থেকে বাছাইকৃত খাঁটি খাবার ও ঘরের সৌন্দর্য বাড়ানোর পণ্য—সবকিছু এক ঠিকানায়।”"
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Hero Subheadline (English)</label>
                        <textarea
                          rows={2}
                          value={settingsForm.heroSubheadlineEn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroSubheadlineEn: e.target.value })}
                          placeholder="“Authentic Food & Beautiful Home Decor, All in One Place.”"
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 8. TRUST BANNER 3 CARDS CUSTOMIZATION */}
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E2D8] space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-[#E8E2D8] pb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#133E2B] text-white flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-[#E8C547]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#133E2B]">৩টি ট্রাস্ট ও গ্যারান্টি কার্ড কাস্টমাইজেশন</h4>
                        <p className="text-[11px] text-gray-500">হোমপেজে প্রদর্শিত ৩টি মূল ফিচার কার্ডের শিরোনাম ও বিবরণ</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Card 1 */}
                      <div className="p-3 bg-white rounded-xl border border-[#DDD5C7] space-y-2">
                        <span className="text-xs font-bold text-[#133E2B] flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-[#E8C547]" />
                          <span>কার্ড ১: খাঁটি ও নিরাপদ খাদ্যের প্রতিশ্রুতি</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={settingsForm.trustCard1TitleBn || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, trustCard1TitleBn: e.target.value })}
                            placeholder="কার্ড ১ শিরোনাম (বাংলা) - আপন ঘরের মতো নিরাপদ"
                            className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
                          />
                          <input
                            type="text"
                            value={settingsForm.trustCard1DescBn || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, trustCard1DescBn: e.target.value })}
                            placeholder="কার্ড ১ বিবরণ (বাংলা)"
                            className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Card 2 */}
                      <div className="p-3 bg-white rounded-xl border border-[#DDD5C7] space-y-2">
                        <span className="text-xs font-bold text-[#133E2B] flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-[#E8C547]" />
                          <span>কার্ড ২: ডেলিভারি ও কুরিয়ার সুবিধা</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={settingsForm.trustCard2TitleBn || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, trustCard2TitleBn: e.target.value })}
                            placeholder="কার্ড ২ শিরোনাম (বাংলা) - সারাদেশে বিশ্বস্ত ডেলিভারি"
                            className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
                          />
                          <input
                            type="text"
                            value={settingsForm.trustCard2DescBn || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, trustCard2DescBn: e.target.value })}
                            placeholder="কার্ড ২ কাস্টম বিবরণ (খালি রাখলে স্বয়ংক্রিয় কুরিয়ার রেট দেখাবে)"
                            className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Card 3 */}
                      <div className="p-3 bg-white rounded-xl border border-[#DDD5C7] space-y-2">
                        <span className="text-xs font-bold text-[#133E2B] flex items-center gap-1.5">
                          <RefreshCw className="w-4 h-4 text-[#E8C547]" />
                          <span>কার্ড ৩: ক্যাশ অন ডেলিভারি ও ট্রাস্ট</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={settingsForm.trustCard3TitleBn || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, trustCard3TitleBn: e.target.value })}
                            placeholder="কার্ড ৩ শিরোনাম (বাংলা) - ক্যাশ অন ডেলিভারি সুবিধা"
                            className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
                          />
                          <input
                            type="text"
                            value={settingsForm.trustCard3DescBn || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, trustCard3DescBn: e.target.value })}
                            placeholder="কার্ড ৩ বিবরণ (বাংলা)"
                            className="w-full px-2.5 py-1.5 text-xs border rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 9. ABOUT US & SITE POLICIES */}
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E2D8] space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-[#E8E2D8] pb-3">
                      <div className="w-8 h-8 rounded-lg bg-[#133E2B] text-white flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-[#E8C547]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#133E2B]">আমাদের সম্পর্কে ও ওয়েবসাইট নীতিমালা (About & Policies)</h4>
                        <p className="text-[11px] text-gray-500">গ্রাহক আস্থা বৃদ্ধি ও আইনি সুরক্ষার জন্য বিবরণ</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">আমাদের সম্পর্কে বিবরণ (বাংলা)</label>
                        <textarea
                          rows={3}
                          value={settingsForm.aboutBn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, aboutBn: e.target.value })}
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">About Us Narrative (English)</label>
                        <textarea
                          rows={2}
                          value={settingsForm.aboutEn || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, aboutEn: e.target.value })}
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">প্রাইভেসী পলিসি (বাংলা)</label>
                          <textarea
                            rows={2}
                            value={settingsForm.privacyPolicyBn || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, privacyPolicyBn: e.target.value })}
                            className="w-full px-3 py-2 text-xs border rounded-lg bg-white text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">শর্তাবলী ও নিয়ম (Terms)</label>
                          <textarea
                            rows={2}
                            value={settingsForm.termsBn || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, termsBn: e.target.value })}
                            className="w-full px-3 py-2 text-xs border rounded-lg bg-white text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">রিটার্ন ও রিফান্ড পলিসি</label>
                          <textarea
                            rows={2}
                            value={settingsForm.returnPolicyBn || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, returnPolicyBn: e.target.value })}
                            className="w-full px-3 py-2 text-xs border rounded-lg bg-white text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. FRAUD & SECURITY SETTINGS (ফেইক অর্ডার ফিল্টারিং ও নিরাপত্তা সেটিংস) */}
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E8E2D8] space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-[#E8E2D8] pb-3">
                      <div className="w-8 h-8 rounded-lg bg-red-900 text-white flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-4 h-4 text-[#E8C547]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#133E2B]">ফেইক অর্ডার প্রতিরোধ ও নিরাপত্তা সেটিংস (Fraud & Security)</h4>
                        <p className="text-[11px] text-gray-500">স্মার্ট অ্যালগরিদম ও ব্লকলিস্ট সংক্রান্ত নিরাপত্তা সেটিংস কাস্টমাইজ করুন</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Toggle 1: Smart Fake Detection */}
                      <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D8] flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-xs text-gray-900">স্মার্ট ফেইক অর্ডার ডিটেকশন সক্রিয় রাখুন</div>
                          <div className="text-[11px] text-gray-500">১১ ডিজিট ফোন, ডামি নম্বর, সংক্ষিপ্ত ঠিকানা স্বয়ংক্রিয়ভাবে ঝুঁকি স্কোরিং করবে</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, enableFakeDetection: settingsForm.enableFakeDetection === false ? true : false })}
                          className={`p-1 rounded-full transition-colors ${
                            settingsForm.enableFakeDetection !== false ? 'text-emerald-700' : 'text-gray-400'
                          }`}
                        >
                          {settingsForm.enableFakeDetection !== false ? (
                            <ToggleRight className="w-8 h-8" />
                          ) : (
                            <ToggleLeft className="w-8 h-8" />
                          )}
                        </button>
                      </div>

                      {/* Toggle 2: Strict Block on Blacklisted Numbers */}
                      <div className="bg-white p-3.5 rounded-xl border border-[#E8E2D8] flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-xs text-gray-900">ব্লকলিস্টেড নম্বরের অর্ডার সরাসরি ব্লক করুন</div>
                          <div className="text-[11px] text-gray-500">চালু থাকলে নিষিদ্ধ নম্বর থেকে গ্রাহক চেকআউট সাবমিট করতে পারবে না</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, blockBlacklistedDirectly: !settingsForm.blockBlacklistedDirectly })}
                          className={`p-1 rounded-full transition-colors ${
                            settingsForm.blockBlacklistedDirectly ? 'text-red-700' : 'text-gray-400'
                          }`}
                        >
                          {settingsForm.blockBlacklistedDirectly ? (
                            <ToggleRight className="w-8 h-8" />
                          ) : (
                            <ToggleLeft className="w-8 h-8" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          সর্বনিম্ন ডেলিভারি ঠিকানার দৈর্ঘ্য (অক্ষর সংখ্যা)
                        </label>
                        <input
                          type="number"
                          min="4"
                          max="30"
                          value={settingsForm.minAddressLength ?? 8}
                          onChange={(e) => setSettingsForm({ ...settingsForm, minAddressLength: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                        />
                        <span className="text-[10px] text-gray-500">এর কম অক্ষরের ঠিকানা হলে সিস্টেমে ফেইক/সন্দেহজনক ফ্ল্যাগ পড়বে (ডিফল্ট: ৮)</span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          একই মোবাইল নম্বরে ২৪ ঘণ্টায় সর্বোচ্চ অর্ডার লিমিট
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={settingsForm.maxOrdersPerPhoneDay ?? 4}
                          onChange={(e) => setSettingsForm({ ...settingsForm, maxOrdersPerPhoneDay: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                        />
                        <span className="text-[10px] text-gray-500">২৪ ঘণ্টায় এর বেশি অর্ডার করলে উচ্চ অর্ডার ফ্রিকোয়েন্সি সতর্কবার্তা দেখাবে (ডিফল্ট: ৪)</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Save Action Bar */}
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h5 className="font-bold text-xs text-emerald-950">সব পরিবর্তন সংরক্ষণ করতে চান?</h5>
                      <p className="text-[11px] text-emerald-800">সংরক্ষণ করার সাথে সাথেই পুরো ওয়েবসাইটে এই পরিবর্তন কার্যকর হবে।</p>
                    </div>

                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="px-6 py-2.5 bg-[#133E2B] text-white font-bold text-xs rounded-xl hover:bg-[#1B4332] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <Save className="w-4 h-4 text-[#E8C547]" />
                      <span>{savingSettings ? 'সংরক্ষণ হচ্ছে...' : 'সকল সেটিংস ও ফিচার সংরক্ষণ করুন'}</span>
                    </button>
                  </div>
                </form>

                {/* Password Change Form */}
                <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-[#E8E2D8] space-y-4 max-w-md">
                  <h4 className="font-bold text-sm text-[#133E2B]">অ্যাডমিন পাসওয়ার্ড পরিবর্তন</h4>
                  {passwordChangeMsg && (
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-lg">
                      {passwordChangeMsg}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">নতুন পাসওয়ার্ড</label>
                    <input
                      type="password"
                      required
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="কমপক্ষে ৫ অক্ষর"
                      className="w-full px-3 py-2 text-xs border rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-800 text-white font-bold text-xs rounded-xl hover:bg-black"
                  >
                    পাসওয়ার্ড আপডেট করুন
                  </button>
                </form>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Product Add / Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-[#DDD5C7] space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-[#133E2B]">
                {isNewProduct ? 'নতুন পণ্য যুক্ত করুন' : 'পণ্য সম্পাদনা করুন'}
              </h3>
              <button onClick={() => setEditingProduct(null)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">পণ্যের নাম (বাংলা) *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameBn || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameBn: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name (English)</label>
                  <input
                    type="text"
                    value={editingProduct.nameEn || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ক্যাটাগরি</label>
                  <select
                    value={editingProduct.category || 'natural_honey'}
                    onChange={(e) => {
                      const selected = CATEGORIES.find((c) => c.id === e.target.value);
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value,
                        categoryBn: selected?.nameBn || '',
                        categoryEn: selected?.nameEn || ''
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameBn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">বিক্রয় মূল্য (৳) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">পূর্বের মূল্য (৳)</label>
                  <input
                    type="number"
                    value={editingProduct.previousPrice || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, previousPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">একক / ইউনিট (বাংলা)</label>
                  <input
                    type="text"
                    value={editingProduct.unitBn || 'প্রতি কেজি'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unitBn: e.target.value })}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                    placeholder="যেমন: প্রতি কেজি বা ৪৫০ গ্রাম কৌটা"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    কৌটা / প্যাকেটের ওজন (কেজি)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.05"
                    placeholder="যেমন: 0.45 বা 0.5 বা 1"
                    value={editingProduct.weightKg || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, weightKg: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 text-xs border rounded-lg font-medium"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[
                      { label: '২৫০ গ্রাম', val: 0.25 },
                      { label: '৩০০ গ্রাম', val: 0.3 },
                      { label: '৪০০ গ্রাম', val: 0.4 },
                      { label: '৪৫০ গ্রাম', val: 0.45 },
                      { label: '৫০০ গ্রাম', val: 0.5 },
                      { label: '১ কেজি', val: 1.0 },
                    ].map((pre) => (
                      <button
                        key={pre.label}
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, weightKg: pre.val })}
                        className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors cursor-pointer ${
                          editingProduct.weightKg === pre.val
                            ? 'bg-[#133E2B] text-white border-[#133E2B]'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {pre.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">স্টক স্ট্যাটাস</label>
                  <select
                    value={editingProduct.inStock ? 'true' : 'false'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.value === 'true' })}
                    className="w-full px-3 py-2 text-xs border rounded-lg"
                  >
                    <option value="true">মজুদ আছে (In Stock)</option>
                    <option value="false">স্টক শেষ (Out of Stock)</option>
                  </select>
                </div>
              </div>

              {/* Live Proportional Weight & Price Preview */}
              {(() => {
                const detected = extractProductPackWeight(editingProduct);
                const baseRate = Number(editingProduct.price) || 0;
                const calcPrice = detected && baseRate > 0 ? calculateItemPrice(baseRate, `${detected.grams}g`, editingProduct.unitBn) : 0;
                return (
                  <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#D4AF37]/50 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#133E2B]">
                      <Scale className="w-4 h-4 text-[#2D6A4F]" />
                      <span>ওজন অনুপাতে স্বয়ংক্রিয় মূল্য হিসাব:</span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">
                      💡 <b>টিপস:</b> আপনি যদি পণ্যের বিবরণে (Description) ওজন লিখে দেন (যেমন: <i>"কৌটার ওজন ৪৫০ গ্রাম"</i> বা <i>"নেট ওজন ৩০০ গ্রাম"</i>) অথবা উপরের ওজন বক্সে দেন, তবে প্রতি কেজি মূল্যের ভিত্তিতে ওয়েবসাইট স্বয়ংক্রিয়ভাবে সেই ওজনের সমানুপাতিক বিক্রয়মূল্য হিসাব করবে।
                    </p>
                    {detected && baseRate > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs bg-white px-2.5 py-1.5 rounded-lg border border-emerald-300">
                        <span className="text-gray-700">ডিটেক্টেড ওজন: <b>{toBnNumber(detected.grams)} গ্রাম</b> ({detected.kg} কেজি)</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-[#133E2B] font-bold">
                          কৌটার স্বয়ংক্রিয় বিক্রয়মূল্য: <span className="text-[#2D6A4F] text-sm font-extrabold">{formatPrice(calcPrice, 'bn')}</span>
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">(@ {formatPrice(baseRate, 'bn')}/কেজি)</span>
                      </div>
                    ) : null}
                  </div>
                );
              })()}

              {/* Multiple Image Manager */}
              <div className="space-y-2.5 bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E2D8]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-800">
                    পণ্যের ছবি গ্যালারি (একাধিক ছবি যোগ করুন)
                  </label>
                  <span className="text-[11px] font-semibold text-[#2D6A4F] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    মোট {editingProduct.images?.length || 0}টি ছবি
                  </span>
                </div>

                {/* Input for adding new image URL or Uploading file */}
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newProductImageUrl}
                    onChange={(e) => setNewProductImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newProductImageUrl.trim()) {
                          const currentImgs = editingProduct.images || [];
                          setEditingProduct({
                            ...editingProduct,
                            images: [...currentImgs, newProductImageUrl.trim()]
                          });
                          setNewProductImageUrl('');
                        }
                      }
                    }}
                    placeholder="https://... ছবির লিংক পেস্ট করুন"
                    className="flex-1 px-3 py-2 text-xs border rounded-lg bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newProductImageUrl.trim()) {
                        const currentImgs = editingProduct.images || [];
                        setEditingProduct({
                          ...editingProduct,
                          images: [...currentImgs, newProductImageUrl.trim()]
                        });
                        setNewProductImageUrl('');
                      }
                    }}
                    className="px-3 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>যোগ করুন</span>
                  </button>
                  <label className="cursor-pointer px-3 py-2 bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-lg border border-[#E8E2D8] flex items-center gap-1 shrink-0 shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'আপলোড...' : 'ফাইল আপলোড'}</span>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>
                </div>

                {/* Images list / gallery preview */}
                {editingProduct.images && editingProduct.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {editingProduct.images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`relative rounded-xl overflow-hidden border-2 bg-white p-1.5 flex flex-col gap-1.5 transition-all ${
                          idx === 0 ? 'border-[#2D6A4F] shadow-xs ring-2 ring-[#2D6A4F]/20' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-100">
                          <img src={imgUrl} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 bg-[#133E2B] text-[#E8C547] text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                              মূল/কভার ছবি
                            </span>
                          )}
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">
                            #{idx + 1}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          {idx !== 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                const newImgs = [...(editingProduct.images || [])];
                                const [selected] = newImgs.splice(idx, 1);
                                newImgs.unshift(selected);
                                setEditingProduct({ ...editingProduct, images: newImgs });
                              }}
                              className="text-[10px] text-[#2D6A4F] hover:underline font-bold"
                            >
                              মূল ছবি করুন
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-medium">কভার ছবি</span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const newImgs = (editingProduct.images || []).filter((_, i) => i !== idx);
                              setEditingProduct({ ...editingProduct, images: newImgs });
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            title="ছবি মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic py-1">এখনও কোনো ছবি যোগ করা হয়নি। উপরের বক্সে লিংক পেস্ট করে 'যোগ করুন' চাপুন বা ডিভাইস থেকে আপলোড করুন।</p>
                )}
                <p className="text-[11px] text-gray-500 pt-0.5">
                  💡 <span className="font-semibold text-gray-700">টিপস:</span> প্রথম ছবিটি কার্ড ও ক্যাটালগে কভার ছবি হিসেবে দেখাবে। বাকি ছবিগুলো প্রোডাক্টের বিস্তারিত পেজে স্লাইডার/থাম্বনেইল হিসেবে প্রদর্শিত হবে।
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">পণ্যের বিবরণ (বাংলা)</label>
                <textarea
                  rows={3}
                  value={editingProduct.descriptionBn || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, descriptionBn: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2 bg-[#133E2B] text-white rounded-xl text-xs font-bold hover:bg-[#1B4332]"
                >
                  {savingProduct ? 'সংরক্ষণ হচ্ছে...' : 'পণ্য সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
