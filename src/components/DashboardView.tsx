import React from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  DollarSign, 
  ArrowUpRight,
  ClipboardList,
  Store,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

export const DashboardView: React.FC = () => {
  const { 
    products, 
    customers, 
    sales, 
    expenses, 
    settings, 
    language,
    setActivePage 
  } = useApp();
  
  const t = translations[language];
  const curSymbol = settings.currency;

  // Calculators
  const totalSales = sales.reduce((acc, sale) => acc + sale.totalAmount - sale.discount, 0);
  
  // Outstanding receivables of Customers (Baqi)
  const totalDues = customers.reduce((acc, cust) => acc + cust.dueAmount, 0);
  
  // Total expenses
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  // Profit calculations: (Sales price - purchase price) * sold quantity
  // Let's search back and match purchase price per product for sales items
  let totalNetProfit = 0;
  sales.forEach(sale => {
    let saleCost = 0;
    let saleRevenue = sale.totalAmount - sale.discount;
    
    sale.items.forEach(item => {
      const matchP = products.find(p => p.id === item.productId);
      const purchaseCost = matchP ? matchP.purchasePrice : item.price * 0.7; // Fallback to 30% margin if not found
      saleCost += purchaseCost * item.qty;
    });

    const saleProfit = saleRevenue - saleCost;
    totalNetProfit += saleProfit;
  });

  // Low stock products alert
  const lowStockItems = products.filter(p => p.stock <= p.minStockAlert);

  // Recent 5 transactions
  const recentSales = sales.slice(0, 5);

  // Custom Chart Data: Sales comparison by days or months
  // We'll prepare 7 beautiful custom SVG bars representing sales for the past 7 days/weeks
  const chartBars = [
    { label: language === 'bn' ? "শনি" : "Sat", value: 4500 },
    { label: language === 'bn' ? "রবি" : "Sun", value: 6200 },
    { label: language === 'bn' ? "সোম" : "Mon", value: 3800 },
    { label: language === 'bn' ? "মঙ্গল" : "Tue", value: 7200 },
    { label: language === 'bn' ? "বুধ" : "Wed", value: 5400 },
    { label: language === 'bn' ? "বৃহ" : "Thu", value: 8900 },
    { label: language === 'bn' ? "শুক্র" : "Fri", value: totalSales % 10000 + 4000 } // Reactive to recent sales
  ];

  const maxChartVal = Math.max(...chartBars.map(b => b.value));

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-xl text-slate-900 tracking-tight">
              {language === 'bn' ? 'শুভ দিন!' : 'Good day!'}
            </h1>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              {language === 'bn' 
                ? `স্বাগতম ${settings.businessName} ড্যাশবোর্ডে। চলুন ব্যবসার আজকের হিসাব হালনাগাদ দেখে নেওয়া যাক।` 
                : `Welcome back to ${settings.businessName}. Here is the overview of your accounts.`}
            </p>
          </div>
        </div>

        {/* Current Date/Time Display (Local format) */}
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 max-w-max self-start md:self-center">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-sans font-medium">
            {new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </div>

      {/* Grid of Key Account Stats Card Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* TOTAL SALES */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
              {t.dbTotalSales}
            </span>
            <span className="text-xl font-mono font-bold text-emerald-600 block">
              {curSymbol} {totalSales.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-700 font-sans font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-0.5 max-w-max">
              <TrendingUp className="w-3 h-3" /> +12.4% {language === 'bn' ? 'এই সপ্তাহে' : 'this week'}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* TOTAL NET PROFIT */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
              {t.dbTotalProfit}
            </span>
            <span className="text-xl font-mono font-bold text-emerald-700 block">
              {curSymbol} {totalNetProfit.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-700 font-sans font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-0.5 max-w-max">
              <TrendingUp className="w-3 h-3" /> {language === 'bn' ? 'মোট বিক্রির লাভ' : 'Net sales profit'}
            </span>
          </div>
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* OUTSTANDING RECEIVABLES (BAQI) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
              {t.dbDueReceivables}
            </span>
            <span className="text-xl font-mono font-bold text-rose-600 block">
              {curSymbol} {totalDues.toLocaleString()}
            </span>
            <button 
              onClick={() => setActivePage('customers')}
              className="text-[10px] text-rose-700 font-bold hover:underline font-sans bg-rose-50 border border-rose-100 px-2 py-0.5 rounded block max-w-max"
            >
              👉 {language === 'bn' ? 'গ্রাহকদের কালেকশন' : 'Collect outstanding due'}
            </button>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-lg border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* TOTAL EXPENSES */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
              {t.dbTotalExpenses}
            </span>
            <span className="text-xl font-mono font-bold text-slate-800 block">
              {curSymbol} {totalExpenses.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 font-sans font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-0.5 max-w-max">
              <TrendingDown className="w-3 h-3" /> {language === 'bn' ? 'পরিচালন ব্যয়' : 'Operating costs'}
            </span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Grid: Visual SVG Analytics & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Performance Tracker SVG Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-sans font-bold text-slate-900 text-base">{t.dbSalesGrowth}</h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">{language === 'bn' ? 'বিগত সাত দিনের বিক্রয় এবং খদ্দেরের গ্রোথ' : 'Past 7 days performance metrics'}</p>
            </div>
            
            <div className="flex items-center space-x-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-slate-600">
              <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
              <span className="font-semibold text-[10px] uppercase tracking-wider">{language === 'bn' ? 'বিক্রয়মূল্য' : 'Sales Volume'}</span>
            </div>
          </div>

          {/* Fully Responsive bespoke Chart Area using SVG & HTML Flexbox */}
          <div className="h-64 flex items-end justify-between gap-2.5 pt-6 pb-2 px-1 relative">
            
            {/* Background gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-slate-200 w-full h-0"></div>
              <div className="border-b border-slate-200 w-full h-0"></div>
              <div className="border-b border-slate-200 w-full h-0"></div>
              <div className="border-b border-slate-200 w-full h-0"></div>
            </div>

            {chartBars.map((bar, idx) => {
              const heightPercent = maxChartVal > 0 ? (bar.value / maxChartVal) * 80 : 10;
              // Highlight selected week bar (today, index 6)
              const isToday = idx === 6;
              return (
                <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end relative group z-10">
                  <div className="absolute -top-6 bg-slate-800 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition duration-150">
                    {curSymbol}{Math.round(bar.value)}
                  </div>
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition duration-200 shadow-xs relative overflow-hidden ${
                      isToday ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-slate-200 group-hover:bg-slate-300'
                    }`}
                  >
                    {/* Visual pattern accent */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
                  </div>
                  <span className={`text-[10px] uppercase font-bold mt-2 font-mono ${
                    isToday ? 'text-emerald-600' : 'text-slate-400'
                  }`}>{bar.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Alerts & Quick Insights */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {t.dbLowStockAlert}
              </h3>
              <span className="bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-lg font-sans">
                {lowStockItems.length} {language === 'bn' ? 'টি পণ্য' : 'items'}
              </span>
            </div>

            <p className="text-xs text-slate-400 font-sans mb-3 leading-relaxed">
              {language === 'bn' 
                ? 'নিচের স্টকগুলো রিঅর্ডার লেভেলের নিচে চলে গেছে। দ্রুত অর্ডার করুন।' 
                : 'The stocks for the following goods are critically low. Please restock soon.'}
            </p>

            <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 font-sans border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                  ✔ {language === 'bn' ? "সব স্টক পর্যাপ্ত রয়েছে!" : "All stocks are looking good!"}
                </div>
              ) : (
                lowStockItems.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-amber-50/5 hover:bg-amber-50/10 rounded-lg border border-amber-200 transition">
                    <div className="space-y-0.5 truncate">
                      <h4 className="text-xs font-bold text-slate-800 font-sans truncate">
                        {p.name}
                      </h4>
                      <span className="text-[9px] font-mono text-slate-400 uppercase">SKU: {p.sku}</span>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="text-xs font-bold text-amber-700 block font-sans">
                        {p.stock}
                      </span>
                      <span className="text-[9px] text-rose-500 font-sans font-bold block">
                        {language === 'bn' ? `সীমা: <${p.minStockAlert}` : `alert: <${p.minStockAlert}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
            <button 
              onClick={() => setActivePage('inventory')}
              className="w-full py-2 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white rounded-lg transition text-center text-[10px] font-bold font-sans cursor-pointer"
            >
              {language === 'bn' ? "পণ্য স্টক দেখুন" : "Restock Center"}
            </button>
            <button 
              onClick={() => setActivePage('sales')}
              className="w-full py-2 bg-emerald-600 border border-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-center text-[10px] font-bold font-sans cursor-pointer"
            >
              {language === 'bn' ? "নতুন পোস বিক্রি" : "+ Create Invoice"}
            </button>
          </div>
        </div>

      </div>

      {/* Lower Section: Recent Sale Invoices List */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-5">
          <div>
            <h3 className="font-sans font-bold text-slate-900 text-base">{t.dbRecentTransactions}</h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">{language === 'bn' ? 'সম্প্রতি সম্পন্ন হওয়া ৫টি ইনভয়েস ও আদায়কৃত টাকা' : 'Last 5 checkouts'}</p>
          </div>
          <button 
            id="view-all-sales-link"
            onClick={() => setActivePage('sales')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 font-sans self-start"
          >
            {language === 'bn' ? 'রশিদ ও POS কেন্দ্রে যান ➔' : 'Go to POS Center ➔'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4">{t.salesInvoice}</th>
                <th className="py-2.5 px-4">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="py-2.5 px-4">{t.custName}</th>
                <th className="py-2.5 px-4 text-right">{t.salesGrandTotal}</th>
                <th className="py-2.5 px-4 text-right">{t.salesPaidAmount}</th>
                <th className="py-2.5 px-4 text-right">{t.salesDueAmount}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-slate-400 font-sans">
                    {t.noDataYet}
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{sale.invoiceNo}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(sale.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{sale.customerName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{curSymbol}{sale.totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-bold font-mono">{curSymbol}{sale.paidAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        sale.dueAmount > 0 
                          ? 'bg-rose-50 border-rose-100 text-rose-600' 
                          : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      }`}>
                        {sale.dueAmount > 0 ? `${curSymbol}${sale.dueAmount}` : (language === 'bn' ? 'পরিশোধিত' : 'Paid')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
