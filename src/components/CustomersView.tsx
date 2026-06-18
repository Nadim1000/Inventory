import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { Customer } from '../types';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  PhoneCall, 
  MapPin, 
  PiggyBank, 
  Coins
} from 'lucide-react';
import { motion } from 'motion/react';

export const CustomersView: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, settings, language } = useApp();
  const t = translations[language];
  const curSymbol = settings.currency;

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Collection modal / prompt states
  const [collectingCustId, setCollectingCustId] = useState<string | null>(null);
  const [colAmount, setColAmount] = useState<string>('');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Filtering Customer profiles
  const filteredCustomers = customers.filter(c => {
    const query = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(query) || c.phone.includes(query);
  });

  const clearForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setEditingCustomer(null);
  };

  const handleOpenAddForm = () => {
    clearForm();
    setShowAddForm(true);
  };

  const handleOpenEditForm = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setAddress(c.address || '');
    setShowAddForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedData = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined
    };

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, parsedData);
    } else {
      addCustomer({
        ...parsedData,
        dueAmount: 0 // Default starting dues
      });
    }

    setShowAddForm(false);
    clearForm();
  };

  const handleDelete = (id: string) => {
    const confirmation = window.confirm(
      language === 'bn' 
        ? "আপনি কি নিশ্চিত যে গ্রাহকের অ্যাকাউন্টটি মুছে ফেলতে চান?" 
        : "Are you sure you want to delete this customer account?"
    );
    if (confirmation) {
      deleteCustomer(id);
    }
  };

  // Perform due cash collection (Deduct outstanding receivables)
  const handleCollectDues = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingCustId || !colAmount) return;

    const amt = parseFloat(colAmount) || 0;
    const targetCust = customers.find(c => c.id === collectingCustId);
    if (!targetCust) return;

    if (amt <= 0) {
      alert(language === 'bn' ? "পরিমাণ ০ এর বেশি হতে হবে।" : "Amount must be greater than 0.");
      return;
    }

    if (amt > targetCust.dueAmount) {
      alert(
        language === 'bn' 
          ? `ভুল পরিমাণ! খদ্দেরের মোট বকেয়া ${curSymbol}${targetCust.dueAmount} এর কম বা সমান আদায় দিন।` 
          : `Invalid amount. Outstanding balance is ${curSymbol}${targetCust.dueAmount}.`
      );
      return;
    }

    // Deduct due amount
    updateCustomer(collectingCustId, {
      dueAmount: Math.max(0, targetCust.dueAmount - amt)
    });

    setCollectingCustId(null);
    setColAmount('');
    alert(language === 'bn' ? "বকেয়া আদায় সম্পন্ন এবং খাতায় হিসাব হালনাগাদ হয়েছে।" : "Dues collected successfully and recorded.");
  };

  return (
    <div className="space-y-6">
      {/* Upper Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            {t.navCustomers}
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            {language === 'bn' 
              ? 'এখানে গ্রাহক তথ্য সংরক্ষণ এবং ক্রেতাদের বাকী/খাতা আদায়ের হিসাব নিয়মিত হালনাগাদ করুন।' 
              : 'Keep logs of consumer data, monitor cash pipelines, and settle outstanding due balances.'}
          </p>
        </div>

        <button
          id="btn-add-customer-modal"
          onClick={handleOpenAddForm}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-md shadow-emerald-600/15 transition flex items-center justify-center gap-1.5 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          {t.custAddCustomer}
        </button>
      </div>

      {/* Search Filter input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            id="customer-search-input"
            type="text"
            placeholder={language === 'bn' ? "নাম বা ফোন নাম্বার দিয়ে খদ্দের খুঁজুন..." : "Find clients by name or phone key..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-sans pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400 text-slate-800"
          />
        </div>
      </div>

      {/* Customer profile cards list (Highly polished responsive Grid layout!) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 col-span-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-2">
            <Users className="w-10 h-10 text-slate-300" />
            <span className="text-xs font-sans">{t.noDataYet}</span>
          </div>
        ) : (
          filteredCustomers.map(c => {
            const hasDue = c.dueAmount > 0;
            return (
              <div 
                key={c.id} 
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition flex flex-col justify-between gap-4"
              >
                {/* Profile Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-sans font-bold text-slate-900 text-base">{c.name}</h3>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                        ID: {c.id.slice(-6)}
                      </span>
                    </div>

                    {/* Due Alerts */}
                    <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full ${
                      hasDue ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {hasDue ? (language === 'bn' ? 'বকেয়া আছে' : 'has dues') : (language === 'bn' ? 'পরিশোধিত' : 'clear')}
                    </span>
                  </div>

                  {/* Metadata fields */}
                  <div className="space-y-1.5 text-xs text-slate-500 font-sans pt-1">
                    <a href={`tel:${c.phone}`} className="flex items-center gap-2 hover:text-emerald-600 transition">
                      <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.phone}</span>
                    </a>
                    {c.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Billing Summary of Customer */}
                <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t.custTotalBought}
                    </span>
                    <span className="text-sm font-black text-slate-800 font-sans">
                      {curSymbol}{(c.totalSpent || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t.custDues}
                    </span>
                    <span className={`text-sm font-black font-sans ${hasDue ? 'text-rose-600' : 'text-slate-800'}`}>
                      {curSymbol}{(c.dueAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Action CTA Drawer */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-3.5 mt-1.5">
                  <div className="flex space-x-1">
                    <button
                      id={`cust-edit-idx-${c.id}`}
                      onClick={() => handleOpenEditForm(c)}
                      className="p-1 px-2.5 border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-500 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 font-sans"
                    >
                      <Edit3 className="w-3 h-3" />
                      {t.edit}
                    </button>
                    <button
                      id={`cust-del-idx-${c.id}`}
                      onClick={() => handleDelete(c.id)}
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-red-500 rounded-lg transition"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Due collection cash settling button! */}
                  {hasDue ? (
                    <button
                      id={`cust-due-collection-btn-${c.id}`}
                      onClick={() => {
                        setCollectingCustId(c.id);
                        setColAmount(c.dueAmount.toString());
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow shadow-emerald-600/10 transition flex items-center gap-1 font-sans"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      {language === 'bn' ? 'বাকী আদায়' : 'Collect cash'}
                    </button>
                  ) : (
                    <span className="text-[10px] font-sans font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded">
                      ✔ {language === 'bn' ? 'সব পরিশোধিত' : 'Fully Cleared'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {showAddForm && (
        <div id="customer-form-modal-container" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 relative animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="font-sans font-extrabold text-slate-900 text-lg">
                {editingCustomer ? t.custEditCustomer : t.custAddCustomer}
              </h2>
              <button 
                id="btn-close-customer-modal"
                onClick={() => {
                  setShowAddForm(false);
                  clearForm();
                }} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
                  {t.custName} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-customer-name"
                  type="text"
                  required
                  placeholder={language === 'bn' ? "যেমন: আবদুর রহমান ভাই" : "e.g. Abdur Rahman"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
                  {t.custPhone} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-customer-phone"
                  type="tel"
                  required
                  placeholder="017xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
                  {t.custEmail}
                </label>
                <input
                  id="form-customer-email"
                  type="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
                  {t.custAddress}
                </label>
                <input
                  id="form-customer-address"
                  type="text"
                  placeholder={language === 'bn' ? "যেমন: চক বাজার চত্ত্বর, ঢাকা" : "e.g. Block D, Road 2, Dhanmondi"}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  id="form-customer-cancel"
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    clearForm();
                  }}
                  className="px-4.5 py-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 font-sans transition"
                >
                  {t.cancel}
                </button>
                <button
                  id="form-customer-submit"
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

      {/* Due Cash Collection Settle Modal Dialog */}
      {collectingCustId && (
        <div id="collect-dues-modal-container" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 relative animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="font-sans font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                <Coins className="w-5 h-5 text-emerald-600" />
                {language === 'bn' ? "বকেয়া আদায় করুন (বাকী খাতা)" : "Collect Cash Outstandings"}
              </h2>
              <button 
                id="btn-close-collect-modal"
                onClick={() => setCollectingCustId(null)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Collect Form */}
            <form onSubmit={handleCollectDues} className="space-y-4">
              <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-100 space-y-1 align-center text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  {language === 'bn' ? "মোট বকেয়া ব ব্যালেন্স" : "Outstanding Balance Due"}
                </span>
                <span className="text-3xl font-black text-rose-500 font-sans block">
                  {curSymbol}{(customers.find(c => c.id === collectingCustId)?.dueAmount || 0).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
                  {language === 'bn' ? "আদায়কৃত ক্যাশের পরিমাণ" : "Collected Cash Amount"} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="collect-due-cash-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={colAmount}
                  onChange={(e) => setColAmount(e.target.value)}
                  className="w-full text-sm font-mono font-bold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  id="collect-form-cancel"
                  type="button"
                  onClick={() => setCollectingCustId(null)}
                  className="px-4 py-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 font-sans transition"
                >
                  {t.cancel}
                </button>
                <button
                  id="collect-form-submit"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold font-sans shadow shadow-emerald-600/10 transition"
                >
                  ✔ {language === 'bn' ? "আদায় সম্পন্ন করুন" : "Settle Collection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
