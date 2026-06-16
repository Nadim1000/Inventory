import React from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { 
  TrendingUp, 
  TrendingDown, 
  TrendingUp as ProfitIcon,
  Printer, 
  FileText, 
  Activity, 
  DollarSign,
  Briefcase
} from 'lucide-react';
import { motion } from 'motion/react';

export const ReportsView: React.FC = () => {
  const { products, sales, expenses, settings, language } = useApp();
  const t = translations[language];
  const curSymbol = settings.currency;

  // Calculators (Comprehensive calculations of business parameters)
  const totalSalesRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount - sale.discount, 0);
  
  // Calculate Cost of Goods Sold (COGS) based on actual product purchase price * quantity
  let totalCOGS = 0;
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const pMatch = products.find(p => p.id === item.productId);
      const unitPurchase = pMatch ? pMatch.purchasePrice : item.price * 0.7; // Fallback
      totalCOGS += unitPurchase * item.qty;
    });
  });

  const grossProfit = Math.max(0, totalSalesRevenue - totalCOGS);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const netEarnings = grossProfit - totalExpenses;
  const netMarginPct = totalSalesRevenue > 0 ? Math.round((netEarnings / totalSalesRevenue) * 100) : 0;

  // Filter today's transactions for the register closure
  const todayStr = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.date).toDateString() === todayStr);
  const todayExpenses = expenses.filter(e => new Date(e.date).toDateString() === todayStr);

  const todaySalesTotal = todaySales.reduce((acc, sale) => acc + sale.totalAmount - sale.discount, 0);
  const todayExpensesTotal = todayExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  const netTodayRegister = todaySalesTotal - todayExpensesTotal;

  // Print operational report
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Upper Panel */}
      <div id="report-window-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4 print:hidden">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600" />
            {t.navReports}
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            {language === 'bn' 
              ? 'এখানে ব্যবসার লাভ-ক্ষতি, পরিচালন মার্জিন এবং দিন শেষের নগদ মিলানোর (ডে ক্লোজার) হিসাব প্রিন্ট করুন।' 
              : 'Audit gross profit margins, compute cost of goods (COGS), and conduct clean day-closures.'}
          </p>
        </div>

        <button
          id="btn-print-accounting-report"
          onClick={handlePrintReport}
          className="bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-semibold px-4.5 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 self-start sm:self-center"
        >
          <Printer className="w-4 h-4" />
          {t.repGeneratePdf}
        </button>
      </div>

      {/* Main Print Container Wrapper */}
      <div id="printable-report-body" className="space-y-6">
        
        {/* Printable Letterhead Header (Only appears on Print!) */}
        <div className="hidden print:block text-center border-b pb-4 space-y-1 font-mono text-[11px]">
          <h2 className="text-lg font-bold font-sans">{settings.businessName}</h2>
          <p className="font-sans">{settings.businessAddress}</p>
          <p>Contact: {settings.businessPhone}</p>
          <p className="text-xs font-bold pt-2">VOUCHER AUDIT SUMMARY REPORT</p>
          <p className="text-[10px] text-slate-500">Generated: {new Date().toLocaleString()}</p>
        </div>

        {/* Financial Statement: Profit & Loss (P&L Card) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
          {/* Visual gradient corner decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>

          <h3 className="font-sans font-bold text-slate-900 text-base mb-5 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            {language === 'bn' ? 'আর্থিক বিবরণী (লাভ-ক্ষতির হিসাব)' : 'Comprehensive Statement of Income (P&L)'}
          </h3>

          <div className="space-y-3.5 max-w-2xl">
            
            {/* Sales revenue */}
            <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
              <span className="text-xs font-medium text-slate-500 font-sans">
                {language === 'bn' ? '১. মোট বিক্রয় রেভিনিউ :' : '1. Gross Sales Revenue'}
              </span>
              <span className="text-sm font-bold text-slate-900 font-sans">
                {curSymbol} {totalSalesRevenue.toLocaleString()}
              </span>
            </div>

            {/* Cost of goods sold */}
            <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
              <span className="text-xs font-medium text-slate-500 font-sans">
                {language === 'bn' ? '২. বাদ: বিক্রিত পণ্যের ক্রয়মূল্য (COGS) :' : '2. Less: Cost of Goods Sold (COGS)'}
              </span>
              <span className="text-sm font-bold text-slate-600 font-sans">
                -{curSymbol} {totalCOGS.toLocaleString()}
              </span>
            </div>

            {/* Gross margin */}
            <div className="flex justify-between items-center py-2.5 border-b border-slate-200 bg-slate-50/50 px-2 rounded-lg">
              <span className="text-xs font-bold text-slate-700 font-sans">
                {language === 'bn' ? '৩. মোট লাভ (গ্রস প্রফিট) :' : '3. Gross Operating Profit'}
              </span>
              <span className="text-sm font-extrabold text-emerald-600 font-sans">
                {curSymbol} {grossProfit.toLocaleString()}
              </span>
            </div>

            {/* Expenses */}
            <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
              <span className="text-xs font-medium text-slate-500 font-sans">
                {language === 'bn' ? '৪. বাদ: পরিচালন খরচ (খরচের খাতসমূহ) :' : '4. Less: Operating Expenses'}
              </span>
              <span className="text-sm font-bold text-slate-600 font-sans">
                -{curSymbol} {totalExpenses.toLocaleString()}
              </span>
            </div>

            {/* Net profitability */}
            <div className={`flex justify-between items-center py-3.5 px-3 rounded-xl border ${
              netEarnings >= 0 ? 'bg-emerald-500/5 border-emerald-100' : 'bg-rose-50 border-rose-100'
            }`}>
              <div className="font-sans">
                <span className="text-xs font-black text-slate-900 block">
                  {language === 'bn' ? '৫. নিট লাভ (নেট ইনকাম) :' : '5. Net Business Profit'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {language === 'bn' ? `লাভের মার্জিন অনুপাত: ${netMarginPct}%` : `Net profitability ratio: ${netMarginPct}%`}
                </span>
              </div>
              <span className={`text-lg font-black font-sans ${
                netEarnings >= 0 ? 'text-emerald-600' : 'text-red-500'
              }`}>
                {curSymbol} {netEarnings.toLocaleString()}
              </span>
            </div>

          </div>
        </div>

        {/* Grid: Daily closed register tally / visual summary widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Daily Registers summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-sans font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-slate-600" />
              {t.repDailySalesSummary}
            </h3>

            <p className="text-xs text-slate-400 font-sans mb-4 leading-relaxed">
              {language === 'bn' 
                ? 'আজকের দিন শেষে ক্যাশ ড্রয়ার মিলানোর জন্য নিচের দৈনিক ক্যাশ সারাংশ দেখতে পারেন।' 
                : 'Summary of all recorded financial ledger accounts generated for today.'}
            </p>

            <div className="space-y-3.5 border-t border-slate-200 pt-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-sans">{language === 'bn' ? "আজকের মোট বিক্রি :" : "Today's Total Sales:"}</span>
                <span className="font-bold font-sans text-slate-800">{curSymbol}{todaySalesTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-sans">{language === 'bn' ? "আজকের মোট খরচ :" : "Today's Total Expense:"}</span>
                <span className="font-bold font-sans text-rose-500">-{curSymbol}{todayExpensesTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-2.5 border-t border-dashed border-slate-200">
                <span className="text-slate-800 font-sans">{language === 'bn' ? "আজকের ক্যাশ উদ্বৃত্ত :" : "Today's Net Cash Settle:"}</span>
                <span className={`font-sans font-black ${netTodayRegister >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {curSymbol}{netTodayRegister.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick tips about auditing */}
          <div className="bg-[#111827] text-gray-300 rounded-xl p-6 flex flex-col justify-between select-none border border-slate-800 relative overflow-hidden print:hidden">
            <div className="space-y-3.5 relative z-10">
              <div className="bg-emerald-500 px-2.5 py-0.5 rounded text-[9px] font-black tracking-widest text-white uppercase max-w-max">
                {language === 'bn' ? "অফলাইন মিলকরণ" : "OFFLINE AUDITING"}
              </div>
              <h4 className="font-sans font-bold text-white text-base">
                {language === 'bn' ? "হিসাব ডায়েরি ব্যাকআপ প্রোটোকল" : "Amar Hisab Security Protocol"}
              </h4>
              <p className="text-xs text-gray-400 font-sans leading-relaxed">
                {language === 'bn' 
                  ? "এই অ্যাপের যাবতীয় হিসাবপত্র সুরক্ষিতভাবে আপনার নিজের ডিভাইসেই জমা থাকে। সেটিংস থেকে ক্লাউড ডাটাবেজ অন করে দিলে স্বয়ংক্রিয়ভাবে রিয়েল-টাইমে সুপাবেস ক্লাউডে ডেটা চলে যাবে।" 
                  : "All logs and financial registers are kept private in your sandboxed local runtime storage context. You can sync in real-time by adding your credentials in Settings."}
              </p>
            </div>

            <div className="mt-5 border-t border-gray-800 pt-3.5 flex justify-between items-center text-[10px] text-gray-500 font-mono">
              <span>SYSTEM: LOCAL_SANDBOX_STABLE</span>
              <span>SECURE COMPLIANT</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
