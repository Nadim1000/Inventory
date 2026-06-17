import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Receipt, 
  TrendingUp, 
  Settings, 
  LogOut,
  Globe,
  Menu,
  X,
  Store
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { 
    activePage, 
    setActivePage, 
    language, 
    setLanguage, 
    currentUser, 
    logoutUser 
  } = useApp();
  
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[language];

  const menuItems = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'inventory', label: t.navInventory, icon: Package },
    { id: 'sales', label: t.navSales, icon: ShoppingCart },
    { id: 'customers', label: t.navCustomers, icon: Users },
    { id: 'expenses', label: t.navExpenses, icon: Receipt },
    { id: 'reports', label: t.navReports, icon: TrendingUp },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Navigation bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 text-slate-800 px-4 py-3 shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="bg-emerald-600 p-1.5 rounded-lg">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-sm tracking-tight text-slate-800">{t.appName}</h1>
            <p className="text-[10px] text-slate-500 font-mono">
              {currentUser?.settings.businessName || 'Amar Hisab'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mobile Language Switcher button */}
          <button 
            id="mobile-lang-btn"
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="font-sans">{language === 'en' ? 'BN' : 'EN'}</span>
          </button>

          <button 
            id="mobile-menu-toggle"
            onClick={() => setIsOpen(!isOpen)} 
            className="p-1 rounded-lg hover:bg-slate-50 text-slate-600"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Overlay for mobile drawer */}
      {isOpen && (
        <div 
          id="sidebar-overlay"
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backup-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        id="app-sidebar"
        className={`fixed md:sticky top-0 left-0 h-screen bg-white text-slate-700 w-64 flex flex-col justify-between transform transition-transform duration-300 ease-in-out z-50 md:transform-none border-r border-slate-200 shadow-sm
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Upper Brand / Profile section */}
        <div>
          <div className="p-5 border-b border-slate-200 hidden md:flex items-center space-x-3">
            <div className="bg-emerald-600 p-2.5 rounded-xl shadow-sm">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-sans font-extrabold text-slate-900 text-lg tracking-wide">{t.appName}</h2>
              <span className="text-[10px] font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase font-mono">
                {language === 'bn' ? 'ব্যবসায়ীক হিসাব' : 'BUSINESS ID'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col">
            <span className="text-[10px] text-slate-400 font-sans tracking-wide uppercase font-bold">
              {language === 'bn' ? 'পরিচালনাকারী প্রতিষ্ঠান:' : 'Active Merchant Profile:'}
            </span>
            <span className="text-sm font-bold text-slate-800 mt-1 font-sans truncate">
              {currentUser?.settings.businessName || 'My Local Shop'}
            </span>
            <span className="text-xs font-mono text-slate-500 mt-0.5 truncate">
              {currentUser?.email}
            </span>
          </div>

          {/* Navigational List */}
          <nav className="p-3 space-y-1 block max-h-[60vh] overflow-y-auto">
            {menuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  id={`nav-link-${item.id}`}
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition duration-150
                    ${isActive 
                      ? 'bg-emerald-50 text-emerald-700 font-bold border-l-2 border-emerald-600 rounded-l-none' 
                      : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600'}`}
                >
                  <IconComp className={`w-5 h-5 ${isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span className="font-sans tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Language switcher & Logout section */}
        <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50/50">
          {/* Desktop Language Switcher */}
          <div className="hidden md:flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              {language === 'bn' ? 'ভাষা নির্বাচন' : 'Language'}
            </span>
            <div className="flex space-x-1">
              <button
                id="btn-lang-bn"
                onClick={() => setLanguage('bn')}
                className={`text-xs px-2 py-1 rounded font-sans transition duration-150 ${
                  language === 'bn' 
                    ? 'bg-emerald-600 text-white font-medium shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                বাংলা
              </button>
              <button
                id="btn-lang-en"
                onClick={() => setLanguage('en')}
                className={`text-xs px-2 py-1 rounded font-sans transition duration-150 ${
                  language === 'en' 
                    ? 'bg-emerald-600 text-white font-medium shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          <button
            id="btn-sidebar-logout"
            onClick={logoutUser}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition duration-150"
          >
            <LogOut className="w-5 h-5 text-rose-500" />
            <span className="font-sans tracking-wide">{t.logout}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
