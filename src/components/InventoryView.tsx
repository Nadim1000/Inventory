import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { Product } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  AlertCircle, 
  Filter, 
  Package,
  Boxes,
  Barcode
} from 'lucide-react';
import { motion } from 'motion/react';

export const InventoryView: React.FC = () => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    settings, 
    language,
    customCategories,
    addCustomCategory,
    deleteCustomCategory
  } = useApp();
  const t = translations[language];
  const curSymbol = settings.currency;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form standard list of accessible product categories based on custom definitions AND existing products
  const activeProductCategories = Array.from(new Set([
    ...customCategories,
    ...products.map(p => p.category).filter(Boolean)
  ])).filter(c => typeof c === 'string' && c.trim() !== '');

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('10');
  const [purchasePrice, setPurchasePrice] = useState('100');
  const [salesPrice, setSalesPrice] = useState('120');
  const [category, setCategory] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('5');

  // Mini inline category manager state
  const [newCatName, setNewCatName] = useState('');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);

  // Set initial category value once categories are calculated or changed
  React.useEffect(() => {
    if (!category && activeProductCategories.length > 0) {
      setCategory(activeProductCategories[0]);
    }
  }, [activeProductCategories, category]);

  // Filtering products
  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase();
    const nameMatch = p.name.toLowerCase().includes(query);
    const skuMatch = p.sku.toLowerCase().includes(query);
    const categoryMatch = selectedCategory === 'all' || p.category === selectedCategory;
    return (nameMatch || skuMatch) && categoryMatch;
  });

  const clearForm = () => {
    setName('');
    setSku('');
    setStock('10');
    setPurchasePrice('100');
    setSalesPrice('120');
    setCategory(activeProductCategories[0] || (language === 'bn' ? "সাধারণ" : "General"));
    setMinStockAlert('5');
    setEditingProduct(null);
    setNewCatName('');
    setIsAddingNewCat(false);
  };

  const handleOpenAddModal = () => {
    clearForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setStock(p.stock.toString());
    setPurchasePrice(p.purchasePrice.toString());
    setSalesPrice(p.salesPrice.toString());
    setCategory(p.category);
    setMinStockAlert(p.minStockAlert.toString());
    setShowAddModal(true);
    setNewCatName('');
    setIsAddingNewCat(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedData = {
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      stock: parseInt(stock) || 0,
      purchasePrice: parseFloat(purchasePrice) || 0,
      salesPrice: parseFloat(salesPrice) || 0,
      category,
      unit: 'pcs',
      minStockAlert: parseInt(minStockAlert) || 0
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, parsedData);
    } else {
      addProduct(parsedData);
    }

    setShowAddModal(false);
    clearForm();
  };

  const handleDelete = (id: string) => {
    const confirmation = window.confirm(
      language === 'bn' 
        ? "আপনি কি নিশ্চিত যে পণ্যটি মুছে ফেলতে চান?" 
        : "Are you sure you want to delete this product?"
    );
    if (confirmation) {
      deleteProduct(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Action Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-7 h-7 text-emerald-600" />
            {t.navInventory}
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            {language === 'bn' 
              ? 'এখানে পণ্যের স্টক ট্র্যাক, ক্রয়-বিক্রয় মূল্য নির্ধারণ এবং রিঅর্ডার এলার্ট ডায়েরি পরিচালনা করুন।' 
              : 'Add products, view stock counts, track margins, and manage categories.'}
          </p>
        </div>

        <button
          id="btn-add-product-modal"
          onClick={handleOpenAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-md shadow-emerald-600/15 transition flex items-center justify-center gap-1.5 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          {t.invAddProduct}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            id="product-search-input"
            type="text"
            placeholder={language === 'bn' ? "পণ্যের নাম বা SKU/বারকোড দিয়ে খুঁজুন..." : "Search by product name or SKU/barcode..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-sans pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400 text-slate-800"
          />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 font-sans">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            {t.filter}:
          </span>
          <select
            id="product-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
          >
            <option value="all">{t.all}</option>
            {activeProductCategories.map(catVal => (
              <option key={catVal} value={catVal}>
                {t.invCategories[catVal as keyof typeof t.invCategories] || catVal}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Table Inventory */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">{language === 'bn' ? 'পণ্য ও SKU' : 'Item Description'}</th>
                <th className="py-3.5 px-4">{t.invCategory}</th>
                <th className="py-3.5 px-4 text-right">{t.invStock}</th>
                <th className="py-3.5 px-4 text-right">{t.invPurchasePrice}</th>
                <th className="py-3.5 px-4 text-right">{t.invSalesPrice}</th>
                <th className="py-3.5 px-4 text-right">{language === 'bn' ? 'লাভ মার্জিন' : 'Profit Margin'}</th>
                <th className="py-3.5 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Package className="w-10 h-10 text-slate-300" />
                      <span className="text-xs font-sans">{t.noDataYet}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minStockAlert;
                  const marginAmt = p.salesPrice - p.purchasePrice;
                  const marginPct = p.purchasePrice > 0 ? Math.round((marginAmt / p.purchasePrice) * 100) : 0;
                  
                  return (
                    <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50/50 transition">
                      {/* Product Name & Brand details */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {p.name}
                          </h4>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                            <span className="font-bold bg-slate-100 px-1 py-0.5 rounded uppercase flex items-center gap-0.5">
                              <Barcode className="w-3 h-3" /> {p.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Item Category */}
                      <td className="py-4 px-4">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                          {t.invCategories[p.category as keyof typeof t.invCategories] || p.category}
                        </span>
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-4 px-4 text-right">
                        <div className="space-y-0.5">
                          <span className={`font-black text-sm ${isLow ? 'text-red-500 font-extrabold' : 'text-slate-800'}`}>
                            {p.stock}
                          </span>
                          {isLow && (
                            <span className="text-[9px] font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded inline-block">
                              ⚠ {language === 'bn' ? 'স্টক শেষ!' : 'low stock!'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Purchase unit Cost */}
                      <td className="py-4 px-4 text-right font-bold text-slate-700">
                        {curSymbol}{(p.purchasePrice || 0).toLocaleString()}
                      </td>

                      {/* Sales customer price */}
                      <td className="py-4 px-4 text-right font-black text-slate-950">
                        {curSymbol}{(p.salesPrice || 0).toLocaleString()}
                      </td>

                      {/* Net Margin Profit Margin */}
                      <td className="py-4 px-4 text-right">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-emerald-600 block">
                            +{curSymbol}{(marginAmt || 0).toLocaleString()}
                          </span>
                          <span className="text-[9px] text-emerald-500 font-bold bg-emerald-50 px-1 py-0.5 rounded">
                            {marginPct}% {language === 'bn' ? 'লাভ' : 'Profit'}
                          </span>
                        </div>
                      </td>

                      {/* Quick Modifiers Actions */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            id={`btn-edit-product-${p.id}`}
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title={t.edit}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-delete-product-${p.id}`}
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title={t.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal overlay dialogue drawer */}
      {showAddModal && (
        <div id="add-product-modal-container" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 relative animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="font-sans font-extrabold text-slate-900 text-lg">
                {editingProduct ? t.invEditProduct : t.invAddProduct}
              </h2>
              <button 
                id="btn-close-product-modal"
                onClick={() => {
                  setShowAddModal(false);
                  clearForm();
                }} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form body */}
            <form onSubmit={handleFormSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans">
                  {t.invItemName} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-product-name"
                  type="text"
                  required
                  placeholder={language === 'bn' ? "যেমন: মিনিকেট চাল ২৫ কেজি" : "e.g. Miniket Rice 25kg"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans">
                    {t.invSku}
                  </label>
                  <input
                    id="form-product-sku"
                    type="text"
                    placeholder="OIL-RUP-05"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide font-sans">
                      {t.invCategory}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-0.5 font-sans"
                    >
                      {isAddingNewCat 
                        ? (language === 'bn' ? '✓ তালিকা দেখুন' : '✓ View List') 
                        : (language === 'bn' ? '+ নতুন ক্যাটাগরি' : '+ Add New')}
                    </button>
                  </div>

                  {isAddingNewCat ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      <input
                        type="text"
                        placeholder={language === 'bn' ? "ক্যাটাগরির নাম লিখুন..." : "Enter category name..."}
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="flex-1 text-xs font-sans px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newCatName.trim()) {
                              addCustomCategory(newCatName.trim());
                              setCategory(newCatName.trim());
                              setNewCatName('');
                              setIsAddingNewCat(false);
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCatName.trim()) {
                            addCustomCategory(newCatName.trim());
                            setCategory(newCatName.trim());
                            setNewCatName('');
                            setIsAddingNewCat(false);
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition"
                      >
                        {language === 'bn' ? 'যোগ করুন' : 'Add'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <select
                        id="form-product-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="flex-1 text-xs font-sans px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                      >
                        {activeProductCategories.map(catVal => (
                          <option key={catVal} value={catVal}>
                            {t.invCategories[catVal as keyof typeof t.invCategories] || catVal}
                          </option>
                        ))}
                        {activeProductCategories.length === 0 && (
                          <option value="">{language === 'bn' ? "কোনো ক্যাটাগরি নেই" : "No Category Available"}</option>
                        )}
                      </select>

                      {category && customCategories.includes(category) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(language === 'bn' ? `আপনি কি "${category}" ক্যাটাগরি মুছে ফেলতে চান?` : `Are you sure you want to delete "${category}"?`)) {
                              deleteCustomCategory(category);
                              setCategory(activeProductCategories.find(c => c !== category) || '');
                            }
                          }}
                          className="px-2.5 py-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition"
                          title={language === 'bn' ? "ক্যাটাগরি মুছুন" : "Delete category"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans">
                    {t.invStock}
                  </label>
                  <input
                    id="form-product-stock"
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full text-xs font-sans px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans">
                    {t.invPurchasePrice} ({curSymbol}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-product-purchase-price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full text-xs font-sans px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans">
                    {t.invSalesPrice} ({curSymbol}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-product-sales-price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(e.target.value)}
                    className="w-full text-xs font-sans px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1-5 font-sans flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  {t.invMinAlert}
                </label>
                <input
                  id="form-product-min-stock-alert"
                  type="number"
                  min="0"
                  required
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  id="form-product-cancel"
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    clearForm();
                  }}
                  className="px-4.5 py-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 font-sans transition"
                >
                  {t.cancel}
                </button>
                <button
                  id="form-product-submit"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold font-sans shadow shadow-emerald-600/10 transition"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
