import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { Store, ShieldAlert, KeyRound, Mail, UserPlus, MapPin, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import AppLogoImg from '../assets/images/app_logo_1781719000363.jpg';

export const AuthView: React.FC = () => {
  const { loginUser, signupUser, authError, language, setLanguage } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const t = translations[language];

  // Forms state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration extras
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitting(true);
    if (isLogin) {
      await loginUser(email, password);
    } else {
      if (!businessName || !businessPhone) {
        setIsSubmitting(false);
        return;
      }
      await signupUser(email, password, businessName, businessPhone, businessAddress);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Top language helper bar inside auth */}
      <div className="absolute top-4 right-4 flex space-x-1 bg-white shadow-sm p-1 rounded-lg border border-gray-100">
        <button
          onClick={() => setLanguage('bn')}
          className={`text-xs px-3 py-1.5 rounded font-sans transition ${
            language === 'bn' ? 'bg-emerald-600 text-white font-medium' : 'text-gray-500 hover:bg-slate-100'
          }`}
        >
          বাংলা
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`text-xs px-3 py-1.5 rounded font-sans transition ${
            language === 'en' ? 'bg-emerald-600 text-white font-medium' : 'text-gray-500 hover:bg-slate-100'
          }`}
        >
          EN
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md my-auto">
        {/* Branding header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-1 bg-slate-50 border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 mb-4 w-24 h-24 overflow-hidden">
            <img src={AppLogoImg} alt="Amar Hisab Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <h2 className="font-sans font-extrabold text-3xl text-slate-900 tracking-tight">
            Amar Hisab
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-sans px-4">
            {t.appSubtitle}
          </p>
        </div>

        {/* Card for login/signup */}
        <div className="mt-8 bg-white py-8 px-4 shadow-xl rounded-xl sm:px-10 border border-slate-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Display authentication mistakes */}
            {authError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700 font-sans flex items-center space-x-2 rounded">
                <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 font-sans mb-1.5 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-gray-400" />
                    {t.businessName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="reg-business-name"
                    type="text"
                    required
                    placeholder={language === 'bn' ? "যেমন: মণি স্টোর" : "e.g. Mani General Store"}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 font-sans mb-1.5 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {t.businessPhone} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="reg-business-phone"
                    type="tel"
                    required
                    placeholder="01xxxxxxxxx"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 font-sans mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {t.businessAddress}
                  </label>
                  <input
                    id="reg-business-address"
                    type="text"
                    placeholder={language === 'bn' ? "যেমন: চক বাজার, ঢাকা" : "e.g. Chawkbazar, Dhaka"}
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-sans"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 font-sans mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {t.email} <span className="text-red-500">*</span>
              </label>
              <input
                id="auth-email-input"
                type="email"
                required
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 font-sans mb-1.5 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                {t.password} <span className="text-red-500">*</span>
              </label>
              <input
                id="auth-password-input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-sans"
              />
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-150 disabled:opacity-50 mt-2 font-sans"
            >
              {isSubmitting 
                ? (language === 'bn' ? "অপেক্ষা করুন..." : "Processing...") 
                : (isLogin ? t.login : t.signup)}
            </button>
          </form>



          {/* Toggle link layout */}
          <div className="mt-6 text-center">
            <button
              id="auth-toggle-view"
              onClick={() => {
                setIsLogin(!isLogin);
                setBusinessName('');
                setBusinessPhone('');
                setBusinessAddress('');
              }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 transition duration-150 font-sans"
            >
              {isLogin ? t.dontHaveAccount : t.alreadyHaveAccount}
            </button>
          </div>
        </div>
      </div>

      {/* Footer system details */}
      <div className="text-center text-xs text-slate-400 font-sans mt-8">
        &copy; {new Date().getFullYear()} {t.appName} — {language === 'bn' ? 'স্মার্ট বিজনেস সুপার প্লাস' : 'Local Retail ERP Platform'}. 
        <br />
        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
          No external API dependency. Persisted offline instantly.
        </span>
      </div>
    </div>
  );
};
