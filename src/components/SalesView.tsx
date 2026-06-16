import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { Product, Customer, SaleItem } from '../types';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  UserCheck, 
  Printer, 
  CheckCircle,
  X,
  CreditCard,
  Percent,
  Calculator
} from 'lucide-react';
import { motion } from 'motion/react';

export const SalesView: React.FC = () => {
  const { 
    products, 
    customers, 
    addSale, 
    addCustomer,
    addProduct, 
    settings, 
    language 
  } = useApp();

  const t = translations[language];
  const curSymbol = settings.currency;

  // Search & Cart states
  const [productQuery, setProductQuery] = useState('');
  const [cartItems, setCartItems] = useState<{ product: Product; qty: number }[]>([]);
  
  // Billing details
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  
  // Direct Add Customer Quickform state inside POS helper
  const [showAddCustomerQuick, setShowAddCustomerQuick] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustDetails, setNewCustDetails] = useState('');
  const [customerType, setCustomerType] = useState<'walkin' | 'existing' | 'new'>('walkin');

  // Left column view tab selector
  const [activeLeftTab, setActiveLeftTab] = useState<'search' | 'custom'>('search');

  // New custom product states
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('groceries');
  const [customSalesPrice, setCustomSalesPrice] = useState('100');
  const [customPurchasePrice, setCustomPurchasePrice] = useState('80');
  const [customStock, setCustomStock] = useState('50');
  const [customQty, setCustomQty] = useState('1');
  const [customSku, setCustomSku] = useState('');

  // Finished Invoice modal
  const [showInvoiceReceipt, setShowInvoiceReceipt] = useState<boolean>(false);
  const [lastRecordedSale, setLastRecordedSale] = useState<any>(null);

  // Products filtering for quick adding
  const filteredProducts = products.filter(p => {
    const query = productQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) || 
           p.sku.toLowerCase().includes(query);
  });

  // Selected customer details
  const activeCustomerObj = customers.find(c => c.id === selectedCustomerId);

  // Math totals
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.salesPrice * item.qty), 0);
  const taxAmount = Math.round(subtotal * (settings.taxRate / 100));
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  // Cart operations
  const addToCart = (prod: Product) => {
    if (prod.stock <= 0) {
      alert(language === 'bn' ? "পণ্যটি স্টকে নেই!" : "Product has no available stock!");
      return;
    }
    
    setCartItems(prev => {
      const match = prev.find(item => item.product.id === prod.id);
      if (match) {
        if (match.qty >= prod.stock) {
          alert(language === 'bn' ? `স্টকে সর্বোচ্চ ${prod.stock} পিস রয়েছে!` : `Only ${prod.stock} items left in stock.`);
          return prev;
        }
        return prev.map(item => item.product.id === prod.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product: prod, qty: 1 }];
    });
  };

  const updateCartQty = (prodId: string, delta: number) => {
    const productDef = products.find(p => p.id === prodId);
    if (!productDef) return;

    setCartItems(prev => {
      return prev.map(item => {
        if (item.product.id === prodId) {
          const nextQty = item.qty + delta;
          if (nextQty <= 0) return null;
          if (nextQty > productDef.stock) {
            alert(language === 'bn' ? `স্টকে সর্বোচ্চ ${productDef.stock} পিস রয়েছে!` : `Only ${productDef.stock} items left in stock.`);
            return item;
          }
          return { ...item, qty: nextQty };
        }
        return item;
      }).filter(Boolean) as { product: Product; qty: number }[];
    });
  };

  const removeFromCart = (prodId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== prodId));
  };

  // Quick Customer setup
  const handleQuickCustomerAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    const created = addCustomer({
      name: newCustName,
      phone: newCustPhone,
      address: newCustDetails,
      email: ''
    });

    // Auto set inside POS
    setSelectedCustomerId(created.id);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustDetails('');
    setShowAddCustomerQuick(false);
  };

  // Custom product adding mechanism
  const handleAddCustomProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      alert(language === 'bn' ? "পণ্যের নাম দিতে হবে!" : "Product Name is required!");
      return;
    }

    const sPrice = parseFloat(customSalesPrice) || 0;
    const pPrice = parseFloat(customPurchasePrice) || Math.round(sPrice * 0.8);
    const initialStk = parseInt(customStock) || 50;
    const sQty = parseInt(customQty) || 1;

    if (sQty > initialStk) {
      alert(language === 'bn' ? "বিক্রির পরিমাণ মোট স্টকের চেয়ে বেশি হতে পারে না!" : "Sell quantity cannot exceed total stock!");
      return;
    }

    const skuVal = customSku.trim() || `SKU-${Date.now().toString().slice(-6)}`;

    // Create the product in the global inventory store
    const newProd = addProduct({
      name: customName.trim(),
      sku: skuVal,
      stock: initialStk,
      purchasePrice: pPrice,
      salesPrice: sPrice,
      category: customCategory,
      unit: 'pcs',
      minStockAlert: 5
    });

    // Add this new product to the checkout cart right away!
    setCartItems(prev => {
      const match = prev.find(item => item.product.id === newProd.id);
      if (match) {
        return prev; // shouldn't happen for brand new products
      }
      return [...prev, { product: newProd, qty: sQty }];
    });

    // Clean form inputs
    setCustomName('');
    setCustomSku('');
    setCustomSalesPrice('100');
    setCustomPurchasePrice('80');
    setCustomStock('50');
    setCustomQty('1');

    // Automatically switch back to search tab
    setActiveLeftTab('search');
    setProductQuery('');
  };

  // Record Sale and trigger Thermal invoice
  const handleRecordCheckout = () => {
    if (cartItems.length === 0) {
      alert(language === 'bn' ? "অনুগ্রহ করে অন্তত ১টি পণ্য যুক্ত করুন।" : "Please add at least 1 item to the billing cart.");
      return;
    }

    let targetCustomerId: string | undefined = selectedCustomerId || undefined;
    let targetCustomerName = activeCustomerObj ? activeCustomerObj.name : (language === 'bn' ? 'খুচরা ক্রেতা (Walk-in)' : 'Walk-in Customer');
    let targetCustomerPhone = activeCustomerObj ? activeCustomerObj.phone : undefined;
    let targetCustomerAddress = activeCustomerObj ? activeCustomerObj.address : undefined;

    // Direct Inline Add Customer Mode for current sale
    if (customerType === 'new') {
      const nameClean = newCustName.trim();
      const phoneClean = newCustPhone.trim();

      if (!nameClean || !phoneClean) {
        alert(language === 'bn' ? "নতুন গ্রাহকের নাম এবং মোবাইল নম্বর আবশ্যক!" : "New customer name and phone details are required!");
        return;
      }

      // Add to main global customer records beautifully
      const created = addCustomer({
        name: nameClean,
        phone: phoneClean,
        address: newCustDetails.trim(),
        email: ''
      });

      targetCustomerId = created.id;
      targetCustomerName = created.name;
      targetCustomerPhone = created.phone;
      targetCustomerAddress = created.address;

      // Clean customer inputs
      setNewCustName('');
      setNewCustPhone('');
      setNewCustDetails('');
    } else if (customerType === 'walkin') {
      targetCustomerId = undefined;
      targetCustomerName = language === 'bn' ? 'খুচরা ক্রেতা (Walk-in)' : 'Walk-in Customer';
      targetCustomerPhone = undefined;
      targetCustomerAddress = undefined;
    }

    const saleItems: SaleItem[] = cartItems.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      qty: item.qty,
      price: item.product.salesPrice
    }));

    const finalSale = {
      items: saleItems,
      totalAmount: grandTotal,
      discount: discountAmount,
      paidAmount: paidAmount,
      dueAmount: dueAmount,
      customerId: targetCustomerId,
      customerName: targetCustomerName,
      customerPhone: targetCustomerPhone,
      customerAddress: targetCustomerAddress
    };

    addSale(finalSale);

    // Save configuration parameters to display in immediate receipt popup drawer
    setLastRecordedSale({
      invoiceNo: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      ...finalSale
    });

    setShowInvoiceReceipt(true);

    // Reset checkout fields
    setCartItems([]);
    setDiscountAmount(0);
    setPaidAmount(0);
    setSelectedCustomerId('');
    setCustomerType('walkin');
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-emerald-600" />
            {t.salesPosTitle}
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            {language === 'bn' 
              ? 'বিক্রয়ের পণ্য নির্বাচন করে ঝটপট রশিদ তৈরি করুন। বাকী টাকা স্বয়ংক্রিয়ভাবে গ্রাহক খেরো খাতায় যুক্ত হবে।' 
              : 'Add products to cart, record customer sales payments, track outstandings, and emit billing vouchers.'}
          </p>
        </div>
      </div>

      {/* Main Dual Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: Search & Add Products (col-span 3) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm col-span-1 lg:col-span-3 flex flex-col h-[70vh]">
          {/* Dual Tab bar for Search vs Custom Product */}
          <div className="flex border-b border-slate-100 mb-4 flex-shrink-0">
            <button
              id="tab-search-products"
              type="button"
              onClick={() => setActiveLeftTab('search')}
              className={`flex-1 py-2 text-center text-xs font-bold font-sans border-b-2 transition ${
                activeLeftTab === 'search'
                  ? 'border-emerald-600 text-emerald-600 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              🔍 {language === 'bn' ? "মজুদ পণ্য খুঁজুন" : "Search Stock"}
            </button>
            <button
              id="tab-custom-product"
              type="button"
              onClick={() => setActiveLeftTab('custom')}
              className={`flex-1 py-2 text-center text-xs font-bold font-sans border-b-2 transition ${
                activeLeftTab === 'custom'
                  ? 'border-emerald-600 text-emerald-600 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              📝 {language === 'bn' ? "নতুন কাস্টম বিন্ত্রয় / পণ্য টাইপ" : "Type Custom Product & Sell"}
            </button>
          </div>

          {activeLeftTab === 'search' ? (
            <>
              {/* Search bar inside left panel */}
              <div className="relative mb-4 flex-shrink-0">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="pos-product-search"
                  type="text"
                  placeholder={language === 'bn' ? "পণ্য বা বারকোড দিয়ে বিল এড করুন..." : "Search goods or barcodes to add..."}
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  className="w-full text-xs font-sans pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400 text-slate-800"
                />
              </div>

              {/* List area with custom scroll */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 font-sans text-xs">
                    {language === 'bn' ? "পণ্যটি খুঁজে পাওয়া যায়নি।" : "No matching stock items."}
                  </div>
                ) : (
                  filteredProducts.map(p => {
                    const isOutOfStock = p.stock <= 0;
                    return (
                      <div 
                        key={p.id} 
                        className={`p-3.5 border rounded-xl flex items-center justify-between transition
                          ${isOutOfStock 
                            ? 'opacity-50 bg-slate-50 border-slate-200' 
                            : 'border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/10'}`}
                      >
                        <div className="space-y-1 truncate flex-1">
                          <h4 className="text-xs font-bold text-slate-800 font-sans truncate">
                            {p.name}
                          </h4>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                            <span className="bg-slate-100 px-1 py-0.25 rounded">SKU: {p.sku}</span>
                            <span>•</span>
                            <span className={`font-bold ${p.stock <= p.minStockAlert ? 'text-rose-500' : 'text-slate-500'}`}>
                              {language === 'bn' ? `স্টক: ${p.stock}টি` : `Stock: ${p.stock} units`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 flex-shrink-0 ml-3">
                          <span className="font-extrabold text-slate-900 text-sm font-sans">
                            {curSymbol}{p.salesPrice.toLocaleString()}
                          </span>
                          <button
                            id={`btn-pos-add-${p.id}`}
                            onClick={() => addToCart(p)}
                            disabled={isOutOfStock}
                            className="p-1 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold font-sans transition flex items-center gap-1 shadow-sm shadow-emerald-600/10"
                          >
                            <Plus className="w-3 h-3" />
                            {t.salesAddToCart}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1">
              <form onSubmit={handleAddCustomProduct} className="space-y-3 pr-1 py-1">
                {/* Product Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 font-sans">
                    {language === 'bn' ? "পণ্যের নাম (যা কিনে নিয়েছে)" : "PRODUCT NAME TAKEN"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="custom-prod-name"
                    type="text"
                    required
                    placeholder={language === 'bn' ? "যেমন: মিনিকেট চাল ২৫ কেজি" : "e.g. Miniket Rice 25kg"}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                  />
                </div>

                {/* Grid 1: SKU, Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 font-sans">
                      {language === 'bn' ? "বারকোড / এসকেইউ (ঐচ্ছিক)" : "SKU / Barcode (Optional)"}
                    </label>
                    <input
                      id="custom-prod-sku"
                      type="text"
                      placeholder="e.g. 590023"
                      value={customSku}
                      onChange={(e) => setCustomSku(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 font-sans">
                      {language === 'bn' ? "ক্যাটাগরি" : "Category"}
                    </label>
                    <select
                      id="custom-prod-category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="groceries">{t.invCategories.groceries}</option>
                      <option value="electronics">{t.invCategories.electronics}</option>
                      <option value="clothing">{t.invCategories.clothing}</option>
                      <option value="cosmetics">{t.invCategories.cosmetics}</option>
                      <option value="pharmacy">{t.invCategories.pharmacy}</option>
                      <option value="stationery">{t.invCategories.stationery}</option>
                      <option value="other">{t.invCategories.other}</option>
                    </select>
                  </div>
                </div>

                {/* Grid 2: Purchases Cost, Selling Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 font-sans">
                      {language === 'bn' ? "ক্রয় মূল্য / কেনা দাম" : "Purchase Price"}
                    </label>
                    <input
                      id="custom-prod-purchase"
                      type="number"
                      min="0"
                      placeholder="80"
                      value={customPurchasePrice}
                      onChange={(e) => setCustomPurchasePrice(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 font-sans">
                      {language === 'bn' ? "বিক্রয় মূল্য" : "Selling Price"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="custom-prod-sales"
                      type="number"
                      min="0"
                      required
                      placeholder="100"
                      value={customSalesPrice}
                      onChange={(e) => {
                        setCustomSalesPrice(e.target.value);
                        const val = parseFloat(e.target.value) || 0;
                        setCustomPurchasePrice(Math.round(val * 0.8).toString());
                      }}
                      className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                </div>

                {/* Grid 3: Initial Stock, Buy Quantity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 font-sans">
                      {language === 'bn' ? "মোট নতুন স্টক পরিমাণ" : "Total Stock to Create"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="custom-prod-stock"
                      type="number"
                      min="1"
                      required
                      placeholder="50"
                      value={customStock}
                      onChange={(e) => setCustomStock(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-emerald-700 font-bold"
                    />
                    <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                      {language === 'bn' 
                        ? "পণ্যটি এই পরিমাণ মোট স্টক সহ স্থায়ীভাবে ইনভেন্টরিতে সেভ হয়ে থাকবে।" 
                        : "Creates a database record with this stock."}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans text-emerald-600">
                      {language === 'bn' ? "এখন বিক্রয়ের পরিমাণ" : "Qty to Sell Now"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="custom-prod-qty"
                      type="number"
                      min="1"
                      required
                      placeholder="1"
                      value={customQty}
                      onChange={(e) => setCustomQty(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 border border-emerald-300 bg-emerald-500/5 rounded-lg text-emerald-800 font-bold text-sm"
                    />
                    <p className="text-[9px] text-emerald-600/70 mt-0.5 leading-tight">
                      {language === 'bn' 
                        ? "এই বিক্রয়ের পরিমাণটি সাথে সাথে বিলের ঝুড়িতে যুক্ত হবে।" 
                        : "Instantly adds this quantity to current POS checkout receipt."}
                    </p>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    id="btn-submit-custom-product"
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow shadow-emerald-600/10"
                  >
                    <Plus className="w-4 h-4" />
                    {language === 'bn' ? "ইনভেন্টরিতে সেভ করে বিলে যুক্ত করুন" : "Save to Inventory & Bill"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: POS Billing Cart (col-span 2) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2 flex flex-col h-[70vh]">
          <h3 className="font-sans font-bold text-slate-900 text-base mb-3.5 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            {language === 'bn' ? 'চলতি বিল তালিকা' : 'Active Checkout Cart'}
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full font-sans">
              {cartItems.length}
            </span>
          </h3>

          {/* Cart items list with scroll */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 border-b border-slate-100 pb-3">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-sans text-xs border-2 border-dashed border-slate-200 rounded-xl my-2">
                🛒 {language === 'bn' ? "বিল ঝুড়ি খালি" : "Cart is empty."}
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.product.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-0.5 truncate flex-1 md:max-w-[50%] mr-2">
                    <h5 className="text-xs font-bold text-slate-800 font-sans truncate">
                      {item.product.name}
                    </h5>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {curSymbol}{item.product.salesPrice}
                    </span>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <button
                      id={`btn-cart-dec-${item.product.id}`}
                      onClick={() => updateCartQty(item.product.id, -1)}
                      className="p-1 bg-white hover:bg-slate-200 text-slate-600 rounded border border-slate-200 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold font-mono px-1 w-5 text-center text-slate-800">
                      {item.qty}
                    </span>
                    <button
                      id={`btn-cart-inc-${item.product.id}`}
                      onClick={() => updateCartQty(item.product.id, 1)}
                      className="p-1 bg-white hover:bg-slate-200 text-slate-600 rounded border border-slate-200 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    
                    <button
                      id={`btn-cart-del-${item.product.id}`}
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded ml-2"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Billing Inputs & Pricing summary */}
          <div className="pt-3.5 space-y-3 bg-[#fdfdfd] border-t border-slate-200 flex-shrink-0">
            
            {/* Elegant Segmented Customer Selection Tabs */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide font-sans flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                {language === 'bn' ? 'কাস্টমার অপশন (ক্রেতার তথ্য)' : 'Customer Details Option'}
              </label>

              {/* Segmented select tab headers */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  id="cust-type-walkin"
                  type="button"
                  onClick={() => {
                    setCustomerType('walkin');
                    setSelectedCustomerId('');
                  }}
                  className={`py-1.5 text-center text-[10px] sm:text-xs font-bold font-sans rounded-lg transition ${
                    customerType === 'walkin'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {language === 'bn' ? "খুচরা ক্রেতা" : "Walk-In"}
                </button>
                <button
                  id="cust-type-existing"
                  type="button"
                  onClick={() => setCustomerType('existing')}
                  className={`py-1.5 text-center text-[10px] sm:text-xs font-bold font-sans rounded-lg transition ${
                    customerType === 'existing'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {language === 'bn' ? "সংরক্ষিত" : "Saved"}
                </button>
                <button
                  id="cust-type-new"
                  type="button"
                  onClick={() => setCustomerType('new')}
                  className={`py-1.5 text-center text-[10px] sm:text-xs font-bold font-sans rounded-lg transition ${
                    customerType === 'new'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {language === 'bn' ? "নতুন টাইপ" : "+ নতুন"}
                </button>
              </div>

              {/* Content Panel depending on Segment item chosen */}
              {customerType === 'walkin' && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 font-sans">
                  ℹ {language === 'bn' ? "খুচরা ক্রেতা (কোনো কাস্টমার লিস্ট সেভ হবে না - সাধারণ বিক্রয়)" : "Walk-in Retail Customer (Normal checkout without saving logs to customer list)."}
                </div>
              )}

              {customerType === 'existing' && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <select
                    id="pos-customer-dropdown"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">👤 -- {language === 'bn' ? 'সংরক্ষিত কাস্টমার নির্বাচন করুন' : 'Select Pre-saved Customer'} --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>👤 {c.name} ({c.phone})</option>
                    ))}
                  </select>
                  {activeCustomerObj && (
                    <div className="p-2 bg-emerald-50/20 border border-emerald-100/50 rounded-lg text-[10px] text-slate-600 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{activeCustomerObj.name}</span>
                        <span className="font-mono font-medium text-slate-500">{activeCustomerObj.phone}</span>
                      </div>
                      {activeCustomerObj.address && (
                        <p className="text-slate-400 font-sans text-[10px]">
                          📍 {activeCustomerObj.address}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {customerType === 'new' && (
                <div className="p-3 bg-emerald-50/10 border border-emerald-100 rounded-xl space-y-2 animate-in fade-in duration-150">
                  <div className="text-[10px] font-bold text-emerald-700 mb-1">
                    📝 {language === 'bn' ? "গ্রাহকের বিস্তারিত তথ্য দিন (কাস্টমার অপশনে সেভ হয়ে যাবে)" : "Enter customer specs (automatically saved to Customers list)"}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      id="pos-new-cust-name"
                      type="text"
                      required
                      placeholder={t.custName + " *"}
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="text-xs font-sans px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                    <input
                      id="pos-new-cust-phone"
                      type="tel"
                      required
                      placeholder={t.custPhone + " *"}
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="text-xs font-sans px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                    />
                    <input
                      id="pos-new-cust-address"
                      type="text"
                      placeholder={language === 'bn' ? "ঠিকানা অথবা কাস্টমার ডিটেইলস (ঐচ্ছিক)" : "Customer specification details / address (Optional)"}
                      value={newCustDetails}
                      onChange={(e) => setNewCustDetails(e.target.value)}
                      className="w-full text-xs font-sans px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white col-span-2"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Custom Discount input */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1 font-sans flex items-center gap-0.5">
                  <Percent className="w-2.5 h-2.5" /> {t.salesDiscount}
                </label>
                <input
                  id="pos-discount-input"
                  type="number"
                  min="0"
                  value={discountAmount || ''}
                  placeholder="0.00"
                  onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full text-xs font-mono px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-emerald-600 uppercase tracking-wide mb-1 font-sans flex items-center gap-0.5">
                  💵 {t.salesPaidAmount}
                </label>
                <input
                  id="pos-paid-input"
                  type="number"
                  min="0"
                  value={paidAmount || ''}
                  placeholder={`${curSymbol} 0.00`}
                  onChange={(e) => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full text-xs font-mono px-2.5 py-1.5 border border-emerald-500/25 bg-emerald-500/5 text-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-bold"
                />
              </div>
            </div>

            {/* Maths Summarization */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{t.salesSubtotal}:</span>
                <span className="font-mono">{curSymbol}{subtotal.toLocaleString()}</span>
              </div>
              {settings.taxRate > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{t.salesTax} ({settings.taxRate}%):</span>
                  <span className="font-mono">+{curSymbol}{taxAmount.toLocaleString()}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-rose-500">
                  <span>{t.salesDiscount}:</span>
                  <span className="font-mono">-{curSymbol}{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-base font-black text-slate-900 border-t border-slate-200/60 pt-1.5">
                <span>{t.salesGrandTotal}:</span>
                <span className="font-mono text-emerald-600">{curSymbol}{grandTotal.toLocaleString()}</span>
              </div>

              {/* Outstanding Baqi Details */}
              {dueAmount > 0 && (
                <div className="flex items-center justify-between text-xs font-bold text-rose-600 border-t border-dashed border-red-200 pt-1 flex-wrap">
                  <span>👇 {t.salesDueAmount}:</span>
                  <span className="font-mono">{curSymbol}{dueAmount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Complete checkout Button */}
            <button
              id="pos-checkout-btn"
              onClick={handleRecordCheckout}
              disabled={cartItems.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-sans text-xs font-bold py-2.5 rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {t.salesRecordSale}
            </button>

          </div>
        </div>

      </div>

      {/* Thermic Invoice Receipt Printing Popup */}
      {showInvoiceReceipt && lastRecordedSale && (
        <div id="receipt-modal-container" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            {/* Top Close */}
            <button 
              id="btn-close-receipt-modal"
              onClick={() => setShowInvoiceReceipt(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Thermic Paper Receipt design */}
            <div className="flex-1 overflow-y-auto pr-1 pb-4">
              <div id="print-area-thermal" className="p-4 border-2 border-slate-200 bg-slate-50/50 rounded-xl font-mono text-[11px] text-slate-800 space-y-4">
                {/* Store Header */}
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                  <h3 className="font-sans font-bold text-sm text-slate-900 uppercase">
                    {settings.businessName}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-sans">{settings.businessAddress}</p>
                  <p className="text-[10px] text-slate-500">Mob: {settings.businessPhone}</p>
                  <div className="text-[9px] text-slate-400 pt-1">
                    {new Date(lastRecordedSale.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>

                {/* Voucher Meta details */}
                <div className="space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                  <div>VOUCHER: <span className="font-bold">{lastRecordedSale.invoiceNo}</span></div>
                  <div>CLIENT: <span className="font-bold">{lastRecordedSale.customerName}</span></div>
                  {lastRecordedSale.customerPhone && <div>PHONE: <span className="font-bold">{lastRecordedSale.customerPhone}</span></div>}
                  {lastRecordedSale.customerAddress && <div>DETAILS: <span className="font-bold">{lastRecordedSale.customerAddress}</span></div>}
                  <div>STORE: SAFE CLOUD CLY-09</div>
                </div>

                {/* Items listing table */}
                <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
                  <div className="flex justify-between font-bold border-b border-slate-200 pb-1 text-[10px] text-slate-400">
                    <span>ITEM</span>
                    <span>QTY x PRICE</span>
                    <span className="text-right">TOTAL</span>
                  </div>
                  {lastRecordedSale.items.map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between gap-2">
                      <span className="truncate flex-1 max-w-[50%]">{it.productName}</span>
                      <span className="text-slate-500">{it.qty} x {curSymbol}{it.price}</span>
                      <span className="text-right font-bold">{curSymbol}{(it.qty * it.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Calculation breakdown values */}
                <div className="space-y-1 text-right">
                  {settings.taxRate > 0 && (
                    <div className="flex justify-between">
                      <span>Vat / Tax:</span>
                      <span>+{curSymbol}{Math.round(lastRecordedSale.totalAmount * (settings.taxRate / 100))}</span>
                    </div>
                  )}
                  {lastRecordedSale.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount:</span>
                      <span>-{curSymbol}{lastRecordedSale.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-slate-900 border-t border-slate-200 pt-1.5 text-xs">
                    <span>NET RECEIVABLE:</span>
                    <span>{curSymbol}{lastRecordedSale.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold border-t border-dashed border-slate-200 pt-1">
                    <span>CASH PAID:</span>
                    <span>{curSymbol}{lastRecordedSale.paidAmount.toLocaleString()}</span>
                  </div>
                  
                  {/* Outstandings */}
                  {lastRecordedSale.dueAmount > 0 && (
                    <div className="flex justify-between text-rose-500 font-extrabold border-t border-dashed border-red-200 pt-1">
                      <span>DUE / OUTSTANDING (Baqi):</span>
                      <span>{curSymbol}{lastRecordedSale.dueAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="text-center pt-4 border-t border-dashed border-slate-300 space-y-1">
                  <h5 className="font-sans font-bold text-[9px] text-slate-400 uppercase">
                    *** {language === 'bn' ? 'আমন্ত্রণ রইল - হিসাবের ডায়েরি' : 'THANK YOU FOR VISITING'} ***
                  </h5>
                  <p className="text-[8px] text-slate-400">Powered by Amar Hisab (আমার হিসাব)</p>
                </div>
              </div>
            </div>

            {/* Action buttons inside Receipt */}
            <div className="border-t border-slate-100 pt-4 flex space-x-2">
              <button
                id="btn-print-receipt-paper"
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-850 text-white font-sans text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                {t.printInvoice}
              </button>
              <button
                id="btn-print-close-receipt"
                onClick={() => setShowInvoiceReceipt(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-bold rounded-xl transition"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
