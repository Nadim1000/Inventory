import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { 
  Settings, 
  Database, 
  Check, 
  HelpCircle, 
  Copy, 
  ShieldCheck,
  Building,
  DollarSign,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    supabaseConfig, 
    setSupabaseConfig, 
    syncLocalToSupabase,
    language 
  } = useApp();

  const t = translations[language];

  // Forms state
  const [bizName, setBizName] = useState(settings.businessName);
  const [bizPhone, setBizPhone] = useState(settings.businessPhone);
  const [bizAddress, setBizAddress] = useState(settings.businessAddress);
  const [currency, setCurrency] = useState(settings.currency);

  // Supabase states
  const [sbUrl, setSbUrl] = useState(supabaseConfig.url);
  const [sbAnonKey, setSbAnonKey] = useState(supabaseConfig.anonKey);
  const [copiedCode, setCopiedCode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      businessName: bizName,
      businessPhone: bizPhone,
      businessAddress: bizAddress,
      currency,
      taxRate: 0
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseConfig({
      url: sbUrl,
      anonKey: sbAnonKey
    });
    alert(language === 'bn' ? "সুপাবেস ডাটাবেজ লিংক হালনাগাদ হয়েছে! এখন ক্লাউড সিঙ্ক করতে পারেন।" : "Supabase connection metadata updated successfully! You can now run a backup database sync mapping.");
  };

  const handleSyncData = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await syncLocalToSupabase();
      if (res.success) {
        setSyncMsg({ type: 'success', text: res.message });
      } else {
        setSyncMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setSyncMsg({ type: 'error', text: err.message || 'Sync failed.' });
    } finally {
      setSyncing(false);
    }
  };

  const copyCodeToClipboard = () => {
    const code = `
-- Create 4 tables in your Supabase SQL Editor:

-- 1. PRODUCTS TABLE
create table products (
  id text primary key,
  user_id text not null,
  name text not null,
  sku text,
  stock int default 0,
  purchase_price numeric,
  sales_price numeric,
  category text,
  unit text default 'pcs',
  min_stock_alert int default 5,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CUSTOMERS TABLE
create table customers (
  id text primary key,
  user_id text not null,
  name text not null,
  phone text not null,
  email text,
  address text,
  total_spent numeric default 0,
  due_amount numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. SALES TABLE
create table sales (
  id text primary key,
  user_id text not null,
  invoice_no text not null,
  items jsonb not null,
  total_amount numeric default 0,
  discount numeric default 0,
  paid_amount numeric default 0,
  due_amount numeric default 0,
  customer_id text,
  customer_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. EXPENSES TABLE
create table expenses (
  id text primary key,
  user_id text not null,
  category text not null,
  amount numeric default 0,
  description text,
  payment_method text default 'cash',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
`;
    
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Upper Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="font-sans font-extrabold text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-emerald-600" />
            {t.navSettings}
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            {t.setSubtitle}
          </p>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: Business details Configuration form */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <h3 className="font-sans font-bold text-slate-900 text-base mb-2 flex items-center gap-1.5">
              <Building className="w-5 h-5 text-emerald-600" />
              {language === 'bn' ? 'দোকান ও ব্যবসা কোয়ালিশন' : 'Business Configurations'}
            </h3>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-700 font-sans flex items-center gap-2 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {language === 'bn' ? "ব্যবসায়ীক সেটিংস সফলভাবে সংরক্ষিত হয়েছে!" : "Business settings updated successfully!"}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
                {t.businessName} <span className="text-rose-500">*</span>
              </label>
              <input
                id="set-biz-name"
                type="text"
                required
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="w-full text-xs font-sans px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
                {t.businessPhone} <span className="text-rose-500">*</span>
              </label>
              <input
                id="set-biz-phone"
                type="tel"
                required
                value={bizPhone}
                onChange={(e) => setBizPhone(e.target.value)}
                className="w-full text-xs font-sans px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
                {t.businessAddress}
              </label>
              <input
                id="set-biz-address"
                type="text"
                value={bizAddress}
                onChange={(e) => setBizAddress(e.target.value)}
                className="w-full text-xs font-sans px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 font-sans">
                  {t.setCurrencySymbol}
                </label>
                <input
                  id="set-currency"
                  type="text"
                  required
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs font-mono px-3.5 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-bold"
                />
              </div>
            </div>

            <button
              id="set-save-btn"
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold font-sans shadow shadow-emerald-600/10 transition mt-4"
            >
              {t.setSavePref}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Database sync integration with Supabase (Prepared Frontend!) */}
        <div className="space-y-6">
          
          {/* Supabase settings credentials */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-sans font-bold text-slate-900 text-base mb-1.5 flex items-center gap-1.5">
              <Database className="w-5 h-5 text-emerald-600" />
              {t.setSupabaseHeading}
            </h3>
            <p className="text-xs text-slate-400 font-sans mb-4 leading-relaxed">
              {t.setSupabaseDesc}
            </p>

            <form onSubmit={handleSaveSupabase} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans">
                  Supabase API Project URL
                </label>
                <input
                  id="set-supabase-url"
                  type="url"
                  placeholder="https://yourprojectid.supabase.co"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  className="w-full text-xs font-mono px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 font-sans">
                  Supabase Service Role / Anon API key
                </label>
                <input
                  id="set-supabase-anon-key"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={sbAnonKey}
                  onChange={(e) => setSbAnonKey(e.target.value)}
                  className="w-full text-xs font-mono px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <button
                id="set-supabase-save-btn"
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-bold rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5" />
                {language === 'bn' ? "ডাটাবেজ লিংক কানেক্ট করুন" : "Set Credentials Protocol"}
              </button>
            </form>

            {/* Cloud Sync Manual Trigger Block */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                {language === 'bn' ? "ক্লাউড ডাটা সুসংগতকরণ" : "Cloud Data Backup Synchronization"}
              </span>
              <button
                id="btn-sync-supabase"
                onClick={handleSyncData}
                disabled={syncing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-sans text-xs font-bold rounded-lg cursor-pointer transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/10"
              >
                {syncing ? (
                  <span className="flex items-center gap-1.5 animate-pulse">
                    ⏳ {language === 'bn' ? "সিঙ্ক হচ্ছে..." : "Syncing to Cloud..."}
                  </span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {language === 'bn' ? "১-ক্লিকে সব ডাটা সুপাবেসে ব্যাকআপ করুন" : "1-Click Sync Local Data to Supabase"}
                  </>
                )}
              </button>

              {syncMsg && (
                <div
                  id="sync-status-msg"
                  className={`p-3 rounded-xl text-xs font-sans border flex items-start gap-1.5 ${
                    syncMsg.type === 'success'
                      ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
                      : 'bg-rose-50/50 border-rose-100 text-rose-800'
                  }`}
                >
                  <span className="text-sm mt-0.5">{syncMsg.type === 'success' ? '✔' : '❌'}</span>
                  <div className="flex-1 leading-relaxed">
                    <p className="font-bold">
                      {syncMsg.type === 'success' 
                        ? (language === 'bn' ? 'সফল সিঙ্ক!' : 'Successfully Synced!') 
                        : (language === 'bn' ? 'সিঙ্ক ত্রুটি!' : 'Sync Details:')}
                    </p>
                    <p className="text-[11px] opacity-90">{syncMsg.text}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick instructions / Schema copy paste */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 font-sans space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider">
                💡 DB integration checklist
              </span>

              <button
                id="copy-sql-snippet-btn"
                onClick={copyCodeToClipboard}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied' : 'Copy Schema'}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              {language === 'bn' 
                ? "আপনার সুপাবেস ড্যাশবোর্ডের SQL এডিটরে গিয়ে কপি করা কোডটি পেস্ট করে টেবিলগুলো বানিয়ে নিন। এই অ্যাপে ব্যবহৃত ডাটা ফিল্ডিংগুলির সাথে সুপাবেস ডাটাবেজের সরাসরি সামঞ্জস্য রয়েছে।" 
                : "Copy the PostgreSQL schema above and paste it directly into your Supabase SQL editor to scaffold the structure for instant cloud transition."}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
