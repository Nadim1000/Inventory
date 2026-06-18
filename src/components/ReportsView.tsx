import React, { useState } from 'react';
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
  Briefcase,
  Download,
  RotateCcw,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';

export const ReportsView: React.FC = () => {
  const { products, sales, expenses, settings, language } = useApp();
  const t = translations[language];
  const curSymbol = settings.currency;

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Filtering lists of sales and expenses based on selected duration
  const filteredSales = sales.filter(sale => {
    if (!sale.date) return true;
    const sDateOnly = sale.date.split('T')[0];
    if (startDate && sDateOnly < startDate) return false;
    if (endDate && sDateOnly > endDate) return false;
    return true;
  });

  const filteredExpenses = expenses.filter(exp => {
    if (!exp.date) return true;
    const eDateOnly = exp.date.split('T')[0];
    if (startDate && eDateOnly < startDate) return false;
    if (endDate && eDateOnly > endDate) return false;
    return true;
  });

  // Short range shortcut helpers
  const handleSetQuickRange = (range: 'all' | 'today' | 'thisMonth' | 'last30Days') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (range === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (range === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (range === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      // adjust timezone offset to get correct localized YYYY-MM-DD
      const offset = firstDay.getTimezoneOffset();
      const adjustedFirst = new Date(firstDay.getTime() - (offset * 60 * 1000));
      setStartDate(adjustedFirst.toISOString().split('T')[0]);
      
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const adjustedLast = new Date(lastDay.getTime() - (offset * 60 * 1000));
      setEndDate(adjustedLast.toISOString().split('T')[0]);
    } else if (range === 'last30Days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const offset = thirtyDaysAgo.getTimezoneOffset();
      const adjustedThirty = new Date(thirtyDaysAgo.getTime() - (offset * 60 * 1000));
      setStartDate(adjustedThirty.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  // Calculators on filtered datasets
  const totalSalesRevenue = filteredSales.reduce((acc, sale) => acc + sale.totalAmount - sale.discount, 0);
  
  // Calculate Cost of Goods Sold (COGS) based on actual product purchase price * quantity
  let totalCOGS = 0;
  filteredSales.forEach(sale => {
    sale.items.forEach(item => {
      const pMatch = products.find(p => p.id === item.productId);
      const unitPurchase = pMatch ? pMatch.purchasePrice : item.price * 0.7; // Fallback
      totalCOGS += unitPurchase * item.qty;
    });
  });

  const grossProfit = Math.max(0, totalSalesRevenue - totalCOGS);
  const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
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

  // Export report to native CSV sheet format supporting Bengali
  const handleDownloadCSV = () => {
    const label = (bn: string, en: string) => language === 'bn' ? bn : en;
    const headerPrefix = `\uFEFF`; // UTF-8 byte order mark so Excel reads Bengali correctly
    
    let csvRows: string[] = [];
    
    // Brand header
    csvRows.push(`"${settings.businessName || 'Amar Hisab'}"`);
    csvRows.push(`"${settings.businessAddress || ''}"`);
    csvRows.push(`"${label('রিপোর্টের সময়সীমা', 'Report Date Range')}: ${startDate || label('সব সময়', 'All Time')} ${label('থেকে', 'to')} ${endDate || label('সব সময়', 'All Time')}"`);
    csvRows.push(`"${label('রিপোর্ট ডাউনলোড করার সময়', 'Report Downloaded On')}: ${new Date().toLocaleString()}"`);
    csvRows.push('');
    
    // Financial statements table
    csvRows.push(`"${label('আর্থিক বিবরণী বিবরণ', 'Financial Statement Details')}","${label('টাকা / পরিমাণ', 'Amount')}"`);
    csvRows.push(`"${label('১. মোট বিক্রয় রেভিনিউ', '1. Gross Sales Revenue')}","${totalSalesRevenue}"`);
    csvRows.push(`"${label('২. বিক্রিত পণ্যের ক্রয়মূল্য (COGS)', '2. Cost of Goods Sold (COGS)')}","-${totalCOGS}"`);
    csvRows.push(`"${label('৩. গ্রস প্রফিট (মোট লাভ)', '3. Gross Operating Profit')}","${grossProfit}"`);
    csvRows.push(`"${label('৪. মোট পরিচালন খরচ (ব্যয়)', '4. Total Operating Expenses')}","-${totalExpenses}"`);
    csvRows.push(`"${label('৫. নিট লাভ (নিট ইনকাম)', '5. Net Business Profit')}","${netEarnings}"`);
    csvRows.push(`"${label('লাভের মার্জিন অনুপাত (%)', 'Profit Margin Ratio %')}","${netMarginPct}%"`);
    csvRows.push('');
    
    // Detailed Sales Sub-table
    csvRows.push(`"${label('বিক্রয় বিবরণী তালিকা', 'Detailed Sales List')}"`);
    csvRows.push(`"${label('ইনভয়েস নম্বর', 'Invoice No')}","${label('তারিখ', 'Date')}","${label('ক্রেতা', 'Customer')}","${label('মোট টাকা', 'Total Amount')}","${label('ডিসকাউন্ট', 'Discount')}","${label('পরিশোধিত', 'Paid')}","${label('বাকি', 'Due')}"`);
    filteredSales.forEach(s => {
      csvRows.push(`"${s.invoiceNo}","${s.date.split('T')[0]}","${s.customerName}","${s.totalAmount}","${s.discount}","${s.paidAmount}","${s.dueAmount}"`);
    });
    csvRows.push('');
    
    // Detailed Expenses Sub-table
    csvRows.push(`"${label('খরচের বিবরণী তালিকা', 'Detailed Expenses List')}"`);
    csvRows.push(`"${label('খরচের খাত', 'Expense Category')}","${label('তারিখ', 'Date')}","${label('বিবরণ', 'Description')}","${label('টাকা', 'Amount')}","${label('পেমেন্ট মাধ্যম', 'Payment Method')}"`);
    filteredExpenses.forEach(e => {
      csvRows.push(`"${e.category}","${e.date.split('T')[0]}","${e.description}","${e.amount}","${e.paymentMethod}"`);
    });
    
    const csvContent = headerPrefix + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Amar_Hisab_Report_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              ? 'এখানে তারিখ নির্বাচন করে যেকোনো সুনির্দিষ্ট সময়ের লাভ-ক্ষতি, মার্জিনের রিপোর্ট ডাউনলোড অথবা প্রিন্ট করুন।' 
              : 'Audit gross profit margins, compute cost of goods (COGS) for specific date-ranges, and print/download sheets.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-sans text-xs font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
            title={language === 'bn' ? 'এক্সেল ফাইল ডাউনলোড' : 'Download Excel Sheet'}
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">{language === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
          </button>

          <button
            id="btn-print-accounting-report"
            onClick={handlePrintReport}
            className="bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-semibold px-4.5 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 self-start sm:self-center"
          >
            <Printer className="w-4 h-4" />
            {t.repGeneratePdf}
          </button>
        </div>
      </div>

      {/* Modern Date filter pane */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h4 className="font-sans font-bold text-xs text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            {language === 'bn' ? 'তারিখের পরিসীমা দিয়ে খুঁজুন' : 'Filter Ledger by Specific Date Range'}
          </h4>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => handleSetQuickRange('all')}
              className={`text-[11px] px-3 py-1.5 rounded-lg border font-sans font-semibold transition ${
                !startDate && !endDate
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {language === 'bn' ? 'সব সময়ের হিসাব' : 'All Time'}
            </button>
            <button
              onClick={() => handleSetQuickRange('today')}
              className={`text-[11px] px-3 py-1.5 rounded-lg border font-sans font-semibold transition ${
                startDate === new Date().toISOString().split('T')[0] && endDate === new Date().toISOString().split('T')[0]
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {language === 'bn' ? 'আজ' : 'Today'}
            </button>
            <button
              onClick={() => handleSetQuickRange('thisMonth')}
              className={`text-[11px] px-3 py-1.5 rounded-lg border font-sans font-semibold transition ${
                startDate && startDate === new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {language === 'bn' ? 'এই মাস' : 'This Month'}
            </button>
            <button
              onClick={() => handleSetQuickRange('last30Days')}
              className={`text-[11px] px-3 py-1.5 rounded-lg border font-sans font-semibold transition ${
                startDate && startDate === new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {language === 'bn' ? 'গত ৩০ দিন' : 'Last 30 Days'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end pt-1">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
              {language === 'bn' ? 'শুরুর তারিখ' : 'Start Date'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs font-sans px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
              {language === 'bn' ? 'শেষের তারিখ' : 'End Date'}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs font-sans px-3.5 py-2.5 border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 self-stretch h-[38px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {language === 'bn' ? 'রিসেট' : 'Reset'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Print Container Wrapper */}
      <div id="printable-report-body" className="space-y-6">
        
        {/* Printable Letterhead Header (Only appears on Print!) */}
        <div className="hidden print:block text-center border-b pb-4 space-y-1 font-mono text-[11px]">
          <h2 className="text-lg font-bold font-sans mb-1">{settings.businessName}</h2>
          <p className="font-sans text-slate-700">{settings.businessAddress}</p>
          <p className="font-sans text-slate-700">Contact: {settings.businessPhone}</p>
          <p className="text-xs font-semibold pt-2 text-slate-950 uppercase font-sans">
            {language === 'bn' ? 'ব্যবসায়ীক আর্থিক বিবরণী রিপোর্ট' : 'BUSINESS FINANCIAL ACCOUNTING REPORT'}
          </p>
          <p className="text-[10px] text-slate-600 font-bold bg-slate-100 py-1 px-2.5 rounded inline-block">
            {language === 'bn' ? 'রিপোর্ট সময়সীমা: ' : 'Report Duration: '} 
            {startDate || (language === 'bn' ? 'শুরু থেকে' : 'Beginning')} 
            {language === 'bn' ? ' হতে ' : ' to '} 
            {endDate || (language === 'bn' ? 'আজ পর্যন্ত' : 'Present')}
          </p>
          <p className="text-[9px] text-slate-400">Generated: {new Date().toLocaleString()}</p>
        </div>

        {/* Financial Statement: Profit & Loss (P&L Card) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
          {/* Visual gradient corner decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>

          <h3 className="font-sans font-bold text-slate-900 text-base mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              {language === 'bn' ? 'আর্থিক বিবরণী (লাভ-ক্ষতির হিসাব)' : 'Comprehensive Statement of Income (P&L)'}
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2.5 py-1 font-mono hover:opacity-90 leading-none">
              {language === 'bn' ? 'পরিসীমা: ' : 'Range: '}
              {startDate || (language === 'bn' ? 'শুরু' : 'Start')} ➔ {endDate || (language === 'bn' ? 'আজ' : 'Present')}
            </span>
          </h3>

          <div className="space-y-3.5 max-w-2xl">
            
            {/* Sales revenue */}
            <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
              <span className="text-xs font-medium text-slate-500 font-sans">
                {language === 'bn' ? '১. মোট বিক্রয় রেভিনিউ :' : '1. Gross Sales Revenue'}
              </span>
              <span className="text-sm font-bold text-slate-900 font-sans">
                {curSymbol} {(totalSalesRevenue || 0).toLocaleString()}
              </span>
            </div>

            {/* Cost of goods sold */}
            <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
              <span className="text-xs font-medium text-slate-500 font-sans">
                {language === 'bn' ? '২. বাদ: বিক্রিত পণ্যের ক্রয়মূল্য (COGS) :' : '2. Less: Cost of Goods Sold (COGS)'}
              </span>
              <span className="text-sm font-bold text-slate-600 font-sans">
                -{curSymbol} {(totalCOGS || 0).toLocaleString()}
              </span>
            </div>

            {/* Gross margin */}
            <div className="flex justify-between items-center py-2.5 border-b border-slate-200 bg-slate-50/50 px-2 rounded-lg">
              <span className="text-xs font-bold text-slate-700 font-sans">
                {language === 'bn' ? '৩. মোট লাভ (গ্রস প্রফিট) :' : '3. Gross Operating Profit'}
              </span>
              <span className="text-sm font-extrabold text-emerald-600 font-sans">
                {curSymbol} {(grossProfit || 0).toLocaleString()}
              </span>
            </div>

            {/* Expenses */}
            <div className="flex justify-between items-center py-2.5 border-b border-slate-200">
              <span className="text-xs font-medium text-slate-500 font-sans">
                {language === 'bn' ? '৪. বাদ: পরিচালন খরচ (খরচের খাতসমূহ) :' : '4. Less: Operating Expenses'}
              </span>
              <span className="text-sm font-bold text-slate-600 font-sans">
                -{curSymbol} {(totalExpenses || 0).toLocaleString()}
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
                {curSymbol} {(netEarnings || 0).toLocaleString()}
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
                <span className="font-bold font-sans text-slate-800">{curSymbol}{(todaySalesTotal || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-sans">{language === 'bn' ? "আজকের মোট খরচ :" : "Today's Total Expense:"}</span>
                <span className="font-bold font-sans text-rose-500">-{curSymbol}{(todayExpensesTotal || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-2.5 border-t border-dashed border-slate-200">
                <span className="text-slate-800 font-sans">{language === 'bn' ? "আজকের ক্যাশ উদ্বৃত্ত :" : "Today's Net Cash Settle:"}</span>
                <span className={`font-sans font-black ${netTodayRegister >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {curSymbol}{(netTodayRegister || 0).toLocaleString()}
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
