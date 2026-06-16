import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { SalesView } from './components/SalesView';
import { CustomersView } from './components/CustomersView';
import { ExpensesView } from './components/ExpensesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { translations } from './translations';

const WorkspaceContent: React.FC = () => {
  const { userId, activePage, currentUser, language } = useApp();
  const t = translations[language];

  // If user is logged out, show Login/Signup page
  if (!userId) {
    return <AuthView />;
  }

  // Active page selector mapping
  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardView />;
      case 'inventory':
        return <InventoryView />;
      case 'sales':
        return <SalesView />;
      case 'customers':
        return <CustomersView />;
      case 'expenses':
        return <ExpensesView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  // Convert active page to translation string key
  // activePage like 'dashboard' -> 'navDashboard'
  const pageNavKey = `nav${activePage.charAt(0).toUpperCase() + activePage.slice(1)}` as keyof typeof t;
  const pageTitle = t[pageNavKey] || activePage;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* On Desktop, a neat top header */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-6 items-center justify-between shrink-0 sticky top-0 z-30">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest font-sans flex items-center gap-2">
              <span className="w-1.5 h-3 bg-emerald-600 rounded-xs"></span>
              {pageTitle}
            </h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Amar Hisab Cockpit Console / secure_session
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">Cloud Sync Status</span>
            </div>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800">{currentUser?.settings.businessName || 'Merchant'}</p>
                <p className="text-[9px] text-slate-400 font-mono">{currentUser?.email}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold font-sans text-xs">
                {(currentUser?.settings.businessName || 'M').substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Views Wrapper */}
        <main id="app-workspace-content-canvas" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {renderActivePage()}
        </main>

        {/* Status Bar Footer */}
        <footer className="h-8 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between shrink-0 text-[10px] text-slate-500 font-mono select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {language === 'bn' ? 'সিস্টেম অনলাইন' : 'System Online'}
            </span>
            <span className="hidden sm:inline">Context: {currentUser?.id ? currentUser.id.substring(0, 8) : 'demo-user'}...</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">{language === 'bn' ? 'মেঘ ডাটাবেজ সমন্বয় সক্রিয়' : 'Synced with Supabase Cloud'}</span>
            <span>v2.5.0-stable</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <WorkspaceContent />
    </AppProvider>
  );
}
