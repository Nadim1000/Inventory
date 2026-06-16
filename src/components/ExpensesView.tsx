import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { Expense } from '../types';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  X, 
  Wallet, 
  Calendar, 
  ArrowDownCircle, 
  Calculator,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, deleteExpense, settings, language } = useApp();
  const t = translations[language];
  const curSymbol = settings.currency;

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [category, setCategory] = useState('rent');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const expenseCategoriesList = [
    { value: 'rent', label: t.expCategories.rent },
    { value: 'utilities', label: t.expCategories.utilities },
    { value: 'salary', label: t.expCategories.salary },
    { value: 'transport', label: t.expCategories.transport },
    { value: 'supplier', label: t.expCategories.supplier },
    { value: 'marketing', label: t.expCategories.marketing },
    { value: 'miscellaneous', label: t.expCategories.miscellaneous }
  ];

  const paymentMethodsList = [
    { value: 'Cash', label: language === 'bn' ? 'ক্যাশ (নগদ)' : 'Cash' },
    { value: 'bKash', label: 'বিকাশ / রকেট / নগদ (MFS)' },
    { value: 'Bank Transfer', label: language === 'bn' ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer' },
    { value: 'Card Payment', label: language === 'bn' ? 'কার্ড পরিশোধ' : 'Card Payment' }
  ];

  // Calculators
  const totalExpenseSum = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  // Spent by category for analytics widgets
  const getCategorySpend = (catKey: string) => {
    return expenses.filter(e => e.category === catKey).reduce((acc, e) => acc + e.amount, 0);
  };

  // Filter list
  const filteredExpenses = expenses.filter(e => {
    const query = searchQuery.toLowerCase();
    const matchesDesc = e.description.toLowerCase().includes(query);
    const categoryLabel = (t.expCategories[e.category as keyof typeof t.expCategories] || '').toLowerCase();
    const matchesCat = categoryLabel.includes(query);
    return matchesDesc || matchesCat;
  });

  const clearForm = () => {
    setCategory('rent');
    setAmount('');
    setDescription('');
    setPaymentMethod('Cash');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    addExpense({
      category,
      amount: parseFloat(amount) || 0,
      description: description.trim(),
      paymentMethod
    });

    setShowAddForm(false);
    clearForm();
  };

  const handleDelete = (id: string) => {
    const confirmation = window.confirm(
      language === 'bn' 
        ? "আপনি কি নিশ্চিত যে ব্যয়ের রেকর্ডটি মুছে ফেলতে চান?" 
        : "Are you sure you want to delete this expense record?"
    );
    if (confirmation) {
      deleteExpense(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-emerald-600" />
            {t.navExpenses}
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            {language === 'bn' 
              ? 'এখানে দোকান ভাড়া, বিদ্যুৎ বিল, কর্মচারীর বেতন ও অন্যান্য আনুষঙ্গিক ব্যয়ের হিসাব রাখুন।' 
              : 'Log daily retail bills, transport dues, raw materials supplier fees, and staff payrolls.'}
          </p>
        </div>

        <button
          id="btn-add-expense-modal"
          onClick={() => {
            clearForm();
            setShowAddForm(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-semibold px-4.5 py-2.5 rounded-xl shadow-md shadow-emerald-600/15 transition flex items-center justify-center gap-1.5 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          {t.expAddExpense}
        </button>
      </div>

      {/* Grid of Custom Category Summary widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL SPENT */}
        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
            {language === 'bn' ? 'সর্বমোট ব্যবসায়ী খরচ' : 'Total Outflow'}
          </span>
          <span className="text-xl font-black text-rose-600 font-sans mt-1 block">
            {curSymbol} {totalExpenseSum.toLocaleString()}
          </span>
        </div>

        {/* SHOP RENT COMPONENT */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
            🏠 {t.expCategories.rent}
          </span>
          <span className="text-xl font-black text-slate-800 font-sans mt-1 block">
            {curSymbol} {getCategorySpend('rent').toLocaleString()}
          </span>
        </div>

        {/* UTILITIES SPENT */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
            💡 {t.expCategories.utilities}
          </span>
          <span className="text-xl font-black text-slate-800 font-sans mt-1 block">
            {curSymbol} {getCategorySpend('utilities').toLocaleString()}
          </span>
        </div>

        {/* SALARIES */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
            👥 {t.expCategories.salary}
          </span>
          <span className="text-xl font-black text-slate-800 font-sans mt-1 block">
            {curSymbol} {getCategorySpend('salary').toLocaleString()}
          </span>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            id="expense-search-input"
            type="text"
            placeholder={language === 'bn' ? "ব্যয়ের কারণ বা খাত দিয়ে খুঁজুন..." : "Filter entries by details or category..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-sans pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400 text-slate-800"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">{t.expCategory}</th>
                <th className="py-3.5 px-4">{t.expDescription}</th>
                <th className="py-3.5 px-4">{t.expPaymentMethod}</th>
                <th className="py-3.5 px-4">{language === 'bn' ? 'তারিখ' : 'Record Date'}</th>
                <th className="py-3.5 px-4 text-right">{t.expAmount}</th>
                <th className="py-3.5 px-4 text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Receipt className="w-10 h-10 text-slate-300" />
                      <span className="text-xs font-sans">{t.noDataYet}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                    {/* Category */}
                    <td className="py-4 px-4 font-bold text-slate-800 uppercase text-[10px] tracking-wide">
                      <span className="bg-red-50 text-red-650 px-2.5 py-1 rounded-full border border-red-100">
                        {t.expCategories[e.category as keyof typeof t.expCategories] || e.category}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-4 font-sans text-slate-700 font-medium">
                      {e.description}
                    </td>

                    {/* Payment Method */}
                    <td className="py-4 px-4 text-slate-500 font-sans">
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-slate-400" />
                        {e.paymentMethod}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-slate-400 font-mono">
                      {new Date(e.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4 text-right font-black text-rose-550 text-sm">
                      {curSymbol}{e.amount.toLocaleString()}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-center">
                      <button
                        id={`btn-del-expense-${e.id}`}
                        onClick={() => handleDelete(e.id)}
                        className="p-1 px-2 hover:bg-rose-50 text-slate-400 hover:text-red-500 rounded transition"
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Cost Form Dialog Overlay */}
      {showAddForm && (
        <div id="expense-modal-container" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 relative animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="font-sans font-extrabold text-slate-900 text-lg">
                {t.expAddExpense}
              </h2>
              <button 
                id="btn-close-expense-modal"
                onClick={() => setShowAddForm(false)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
                  {t.expCategory}
                </label>
                <select
                  id="form-expense-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                >
                  {expenseCategoriesList.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
                  {t.expAmount} ({curSymbol}) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="form-expense-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-sm font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
                  {t.expDescription} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="form-expense-description"
                  required
                  rows={2}
                  placeholder={language === 'bn' ? "যেমন: মে মাসের দোকান ঘর ভাড়া পরিশোধ" : "e.g. Paid shop rent for May"}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
                  {t.expPaymentMethod}
                </label>
                <select
                  id="form-expense-payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800"
                >
                  {paymentMethodsList.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  id="form-expense-cancel"
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4.5 py-2 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 font-sans transition"
                >
                  {t.cancel}
                </button>
                <button
                  id="form-expense-submit"
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
