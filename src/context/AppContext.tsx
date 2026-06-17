import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Customer, Sale, Expense, BusinessSettings, UserProfile, SaleItem } from '../types';
import { supabase } from '../lib/supabase';

// Let's create a clear config block explaining how to integrate Supabase.
/*
  =========================================
  SUPABASE BACKEND CONNECTIVITY PROTOCOL
  =========================================
  This app is fully prepared to plug directly into a Supabase database.
  To connect with your Supabase backend:
  1. Install the SDK: npm install @supabase/supabase-js
  2. Create a Supabase Client configuration file: /src/lib/supabase.ts
     ```typescript
     import { createClient } from '@supabase/supabase-js';
     const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_URL';
     const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_KEY';
     export const supabase = createClient(supabaseUrl, supabaseAnonKey);
     ```
  3. Replace the functions inside this Context with equivalent Supabase queries:
     Example for fetching Products:
     ```typescript
     const { data, error } = await supabase
       .from('products')
       .select('*')
       .eq('user_id', currentUser.id);
     ```
  4. Ensure your PostgreSQL schema mirrors the interfaces in /src/types.ts, 
     adding a foreign key to `auth.users` for multi-user security (Row-Level Security / RLS).
*/

interface AppContextType {
  // Navigation & Language
  activePage: string;
  setActivePage: (page: string) => void;
  language: 'en' | 'bn';
  setLanguage: (lang: 'en' | 'bn') => void;

  // Authentication State
  userId: string | null;
  currentUser: UserProfile | null;
  loginUser: (email: string, pass: string) => Promise<boolean>;
  signupUser: (email: string, pass: string, bizName: string, bizPhone: string, bizAddr: string) => Promise<boolean>;
  logoutUser: () => void;
  authError: string | null;

  // Data Store
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
  settings: BusinessSettings;

  // Storage updates (which map directly to our schema layout)
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'totalSpent' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addSale: (sale: Omit<Sale, 'id' | 'invoiceNo' | 'date'>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  deleteExpense: (id: string) => void;
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;

  // Database alignment
  supabaseConfig: { url: string; anonKey: string };
  setSupabaseConfig: (config: { url: string; anonKey: string }) => void;
  syncLocalToSupabase: () => Promise<{ success: boolean; message: string }>;

  // Manual categories management
  customCategories: string[];
  addCustomCategory: (category: string) => void;
  deleteCustomCategory: (category: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial empty settings
const defaultSettings: BusinessSettings = {
  businessName: "আমার মোড়লার দোকান",
  businessAddress: "বসুন্ধরা আবাসিক এলাকা, ঢাকা ১২১২",
  businessPhone: "01712345678",
  currency: "৳",
  taxRate: 0,
  language: 'bn'
};

// Mappings for Supabase database to frontend TypeScript models
const mapDbProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  sku: p.sku || '',
  stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0,
  purchasePrice: p.purchase_price !== undefined ? parseFloat(p.purchase_price) : 0,
  salesPrice: p.sales_price !== undefined ? parseFloat(p.sales_price) : 0,
  category: p.category || 'other',
  unit: p.unit || 'pcs',
  minStockAlert: p.min_stock_alert !== undefined ? Number(p.min_stock_alert) : 5,
  createdAt: p.created_at || new Date().toISOString()
});

const mapDbCustomer = (c: any): Customer => ({
  id: c.id,
  name: c.name,
  phone: c.phone || '',
  email: c.email || '',
  address: c.address || '',
  totalSpent: c.total_spent !== undefined ? parseFloat(c.total_spent) : 0,
  dueAmount: c.due_amount !== undefined ? parseFloat(c.due_amount) : 0,
  createdAt: c.created_at || new Date().toISOString()
});

const mapDbSale = (s: any): Sale => {
  let itemsParsed: SaleItem[] = [];
  try {
    itemsParsed = typeof s.items === 'string' ? JSON.parse(s.items) : (s.items || []);
  } catch (err) {
    itemsParsed = [];
  }
  return {
    id: s.id,
    invoiceNo: s.invoice_no || '',
    items: itemsParsed,
    totalAmount: s.total_amount !== undefined ? parseFloat(s.total_amount) : 0,
    discount: s.discount !== undefined ? parseFloat(s.discount) : 0,
    paidAmount: s.paid_amount !== undefined ? parseFloat(s.paid_amount) : 0,
    dueAmount: s.due_amount !== undefined ? parseFloat(s.due_amount) : 0,
    customerId: s.customer_id || undefined,
    customerName: s.customer_name || '',
    date: s.created_at || s.date || new Date().toISOString()
  };
};

const mapDbExpense = (e: any): Expense => ({
  id: e.id,
  category: e.category || 'other',
  amount: e.amount !== undefined ? parseFloat(e.amount) : 0,
  description: e.description || '',
  date: e.created_at || e.date || new Date().toISOString(),
  paymentMethod: e.payment_method || 'cash'
});

// Seeding standard high-quality Bangladeshi/Local Business mockup data
const getMockData = () => ({
  products: [],
  customers: [],
  sales: [],
  expenses: [],
  settings: defaultSettings
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Language
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [language, setLanguage] = useState<'en' | 'bn'>('bn');

  // Supabase Sandbox credentials
  const [supabaseConfig, setSupabaseConfig] = useState(() => {
    const saved = localStorage.getItem('amar_hisab_supabase_config');
    return saved ? JSON.parse(saved) : { 
      url: 'https://cwgmmpqusvgaastqosot.supabase.co', 
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3Z21tcHF1c3ZnYWFzdHFvc290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTExNTksImV4cCI6MjA5NzEyNzE1OX0.dqt-sGvQpz7hb9wvPnhi3jGxTseOHvGTB3rgA1EGG0Q' 
    };
  });

  // Load preloaded credential database for local login mimicking
  const [authError, setAuthError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Business state (separated / partitioned by user)
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Load and save custom categories automatically based on language & userId
  useEffect(() => {
    if (!userId) {
      setCustomCategories([]);
      return;
    }
    const saved = localStorage.getItem(`amar_hisab_categories_${userId}`);
    if (saved) {
      try {
        setCustomCategories(JSON.parse(saved));
      } catch (e) {
        setCustomCategories([]);
      }
    } else {
      // Setup a primary default initial category of "সাধারণ" or "General"
      const initial = [language === 'bn' ? "সাধারণ" : "General"];
      setCustomCategories(initial);
      localStorage.setItem(`amar_hisab_categories_${userId}`, JSON.stringify(initial));
    }
  }, [userId, language]);

  const addCustomCategory = (cat: string) => {
    const trimmed = cat.trim();
    if (!trimmed) return;
    if (customCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) return;
    const updated = [...customCategories, trimmed];
    setCustomCategories(updated);
    if (userId) {
      localStorage.setItem(`amar_hisab_categories_${userId}`, JSON.stringify(updated));
    }
  };

  const deleteCustomCategory = (cat: string) => {
    const updated = customCategories.filter(c => c !== cat);
    setCustomCategories(updated);
    if (userId) {
      localStorage.setItem(`amar_hisab_categories_${userId}`, JSON.stringify(updated));
    }
  };

  // Initialize standard default mock credentials so someone can log in immediately
  useEffect(() => {
    const systemUsers = localStorage.getItem('amar_hisab_users');
    if (!systemUsers) {
      const demoUsers = [
        {
          id: "u_demo",
          email: "demo@amarhisab.com",
          password: "demo123Password", // Standard plain demo for local ease
          settings: defaultSettings
        }
      ];
      localStorage.setItem('amar_hisab_users', JSON.stringify(demoUsers));
    }
    
    // Auto login on load with sandbox account for zero friction
    handleSilentLogin();
  }, []);

  const handleSilentLogin = async () => {
    // Check if there is an active session in Supabase Auth first
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const uId = session.user.id;
          const meta = session.user.user_metadata || {};
          const bizSettings: BusinessSettings = {
            businessName: meta.businessName || meta.business_name || "আমার ব্যবসা",
            businessAddress: meta.businessAddress || meta.business_address || '',
            businessPhone: meta.businessPhone || meta.business_phone || '',
            currency: "৳",
            taxRate: 0,
            language: 'bn'
          };

          // Cache details locally
          localStorage.setItem(`amar_hisab_profile_${uId}`, JSON.stringify({
            id: uId,
            email: session.user.email,
            settings: bizSettings
          }));

          await loadUserData(uId);
          return;
        }
      } catch (err) {
        console.warn("Supabase active session read skipped:", err);
      }
    }

    // If there is a last logged in user, boot them
    const lastUser = localStorage.getItem('amar_hisab_last_logged_in');
    if (lastUser) {
      await loadUserData(lastUser);
    }
  };

  // Load User Data Partition
  const loadUserData = async (uId: string) => {
    setUserId(uId);
    localStorage.setItem('amar_hisab_last_logged_in', uId);

    // Retrieve user profiles
    const systemUsers = JSON.parse(localStorage.getItem('amar_hisab_users') || '[]');
    const userProf = systemUsers.find((u: any) => u.id === uId);
    if (userProf) {
      setCurrentUser({
        id: userProf.id,
        email: userProf.email,
        settings: userProf.settings || defaultSettings
      });
      setSettings(userProf.settings || defaultSettings);
      setLanguage(userProf.settings?.language || 'bn');
    } else {
      // Create user context for custom Supabase Auth Users who may not reside in 'amar_hisab_users' array
      let businessSettings = defaultSettings;
      let userEmail = 'user@supabase.com';

      const savedUserProf = localStorage.getItem(`amar_hisab_profile_${uId}`);
      if (savedUserProf) {
        try {
          const parsed = JSON.parse(savedUserProf);
          businessSettings = parsed.settings || defaultSettings;
          userEmail = parsed.email || userEmail;
        } catch (e) {}
      } else if (supabase) {
        // Fetch from Supabase database fallback! (For multi-device and clean cache)
        try {
          const { data: dbUser } = await supabase
            .from('user_accounts')
            .select('*')
            .eq('id', uId)
            .single();
          if (dbUser) {
            businessSettings = {
              businessName: dbUser.business_name || (language === 'bn' ? "আমার ব্যবসা" : "My Store"),
              businessAddress: dbUser.business_address || '',
              businessPhone: dbUser.business_phone || '',
              currency: dbUser.currency || "৳",
              taxRate: 0,
              language: dbUser.language || 'bn'
            };
            userEmail = dbUser.email;
            
            // Sync locally cache
            localStorage.setItem(`amar_hisab_profile_${uId}`, JSON.stringify({
              id: uId,
              email: userEmail,
              settings: businessSettings
            }));
          }
        } catch (e) {
          console.warn("Could not find user in user_accounts table:", e);
        }
      }
      
      setCurrentUser({
        id: uId,
        email: userEmail,
        settings: businessSettings
      });
      setSettings(businessSettings);
      setLanguage(businessSettings.language || 'bn');
    }

    // Retrieve business dataset matching user id
    const partitionKey = `amar_hisab_data_${uId}`;
    const userSalesData = localStorage.getItem(partitionKey);
    let loadedProducts: Product[] = [];
    let loadedCustomers: Customer[] = [];
    let loadedSales: Sale[] = [];
    let loadedExpenses: Expense[] = [];

    if (userSalesData) {
      const parsed = JSON.parse(userSalesData);
      
      const demoProductIds = ["p1", "p2", "p3", "p4"];
      const demoCustomerIds = ["c1", "c2", "c3"];
      const demoSaleIds = ["s1", "s2"];
      const demoExpenseIds = ["e1", "e2", "e3"];

      loadedProducts = (parsed.products || []).filter((p: any) => !demoProductIds.includes(p.id));
      loadedCustomers = (parsed.customers || []).filter((c: any) => !demoCustomerIds.includes(c.id));
      loadedSales = (parsed.sales || []).filter((s: any) => !demoSaleIds.includes(s.id));
      loadedExpenses = (parsed.expenses || []).filter((e: any) => !demoExpenseIds.includes(e.id));
    }

    setProducts(loadedProducts);
    setCustomers(loadedCustomers);
    setSales(loadedSales);
    setExpenses(loadedExpenses);

    // Asynchronously update records from Supabase
    if (supabase) {
      try {
        const [pRet, cRet, sRet, eRet] = await Promise.all([
          supabase.from('products').select('*').eq('user_id', uId),
          supabase.from('customers').select('*').eq('user_id', uId),
          supabase.from('sales').select('*').eq('user_id', uId),
          supabase.from('expenses').select('*').eq('user_id', uId)
        ]);

        if (pRet.data && pRet.data.length > 0) {
          setProducts(pRet.data.map(mapDbProduct));
        }
        if (cRet.data && cRet.data.length > 0) {
          setCustomers(cRet.data.map(mapDbCustomer));
        }
        if (sRet.data && sRet.data.length > 0) {
          setSales(sRet.data.map(mapDbSale));
        }
        if (eRet.data && eRet.data.length > 0) {
          setExpenses(eRet.data.map(mapDbExpense));
        }
      } catch (err) {
        console.warn("Supabase database fetch skipped or failed (tables pending):", err);
      }
    }
  };

  // Persist partitioned user records on load changes
  useEffect(() => {
    if (!userId) return;
    const partitionKey = `amar_hisab_data_${userId}`;
    const currentData = { products, customers, sales, expenses };
    localStorage.setItem(partitionKey, JSON.stringify(currentData));
  }, [products, customers, sales, expenses, userId]);

  // Handle Login
  const loginUser = async (email: string, pass: string): Promise<boolean> => {
    setAuthError(null);
    
    // Quick demo login bypasses Supabase config for simple local preview testing
    if (email.toLowerCase() === 'demo@amarhisab.com' && pass === 'demo123Password') {
      await loadUserData("u_demo");
      setActivePage('dashboard');
      return true;
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass
        });

        if (error) {
          // Graceful fallback 1: Check shared credentials table 'user_accounts' in Supabase to assist unconfirmed emails / multi-device
          try {
            const { data: dbUser } = await supabase
              .from('user_accounts')
              .select('*')
              .eq('email', email.toLowerCase())
              .single();

            if (dbUser && dbUser.password === pass) {
              const uId = dbUser.id;
              const bizSettings: BusinessSettings = {
                businessName: dbUser.business_name || (language === 'bn' ? "আমার ব্যবসা" : "My Store"),
                businessAddress: dbUser.business_address || '',
                businessPhone: dbUser.business_phone || '',
                currency: dbUser.currency || "৳",
                taxRate: 0,
                language: dbUser.language || 'bn'
              };

              // Cache settings locally
              localStorage.setItem(`amar_hisab_profile_${uId}`, JSON.stringify({
                id: uId,
                email: dbUser.email,
                settings: bizSettings
              }));

              // Sync user locally to localStorage's register
              const systemUsers = JSON.parse(localStorage.getItem('amar_hisab_users') || '[]');
              if (!systemUsers.some((u: any) => u.id === uId)) {
                systemUsers.push({
                  id: uId,
                  email: dbUser.email,
                  password: pass,
                  settings: bizSettings
                });
                localStorage.setItem('amar_hisab_users', JSON.stringify(systemUsers));
              }

              await loadUserData(uId);
              setActivePage('dashboard');
              return true;
            }
          } catch (dbErr) {
            console.warn("Supabase user_accounts table read failed or skipped:", dbErr);
          }

          // Graceful fallback 2: Check locally stored users inside this specific browser
          const systemUsers = JSON.parse(localStorage.getItem('amar_hisab_users') || '[]');
          const localMatch = systemUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
          
          if (localMatch && localMatch.password === pass) {
            await loadUserData(localMatch.id);
            setActivePage('dashboard');
            return true;
          }

          setAuthError(language === 'bn' 
            ? `লগইন ব্যর্থ হয়েছে: ${error.message}` 
            : `Login failed: ${error.message}`);
          return false;
        }

        if (data.user) {
          const uId = data.user.id;
          const meta = data.user.user_metadata || {};
          const bizSettings: BusinessSettings = {
            businessName: meta.businessName || meta.business_name || (language === 'bn' ? "আমার ব্যবসা" : "My Store"),
            businessAddress: meta.businessAddress || meta.business_address || '',
            businessPhone: meta.businessPhone || meta.business_phone || '',
            currency: "৳",
            taxRate: 0,
            language: language
          };

          // Cache profile settings locally
          localStorage.setItem(`amar_hisab_profile_${uId}`, JSON.stringify({
            id: uId,
            email: data.user.email,
            settings: bizSettings
          }));

          // Add user structure locally
          const systemUsers = JSON.parse(localStorage.getItem('amar_hisab_users') || '[]');
          if (!systemUsers.some((u: any) => u.id === uId)) {
            systemUsers.push({
              id: uId,
              email: data.user.email,
              password: pass,
              settings: bizSettings
            });
            localStorage.setItem('amar_hisab_users', JSON.stringify(systemUsers));
          }

          await loadUserData(uId);
          setActivePage('dashboard');
          return true;
        }
      } catch (err: any) {
        console.error("Supabase authentication connection skipped:", err);
      }
    }

    // Local fallback
    const systemUsers = JSON.parse(localStorage.getItem('amar_hisab_users') || '[]');
    const match = systemUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!match) {
      setAuthError(language === 'bn' ? "এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।" : "No user profile found with this email Address.");
      return false;
    }
    
    if (match.password !== pass) {
      setAuthError(language === 'bn' ? "ভুল পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।" : "Incorrect Password key. Please try again.");
      return false;
    }

    await loadUserData(match.id);
    setActivePage('dashboard');
    return true;
  };

  // Handle Signup (Multi-User)
  const signupUser = async (email: string, pass: string, bizName: string, bizPhone: string, bizAddr: string): Promise<boolean> => {
    setAuthError(null);

    let createdUserId = `u_${Date.now()}`;
    const personalizedSettings: BusinessSettings = {
      businessName: bizName,
      businessAddress: bizAddr,
      businessPhone: bizPhone,
      currency: "৳",
      taxRate: 0,
      language: 'bn'
    };

    if (supabase) {
      try {
        const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: pass,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              businessName: bizName,
              business_name: bizName,
              businessPhone: bizPhone,
              business_phone: bizPhone,
              businessAddress: bizAddr,
              business_address: bizAddr
            }
          }
        });

        if (error) {
          setAuthError(language === 'bn' 
            ? `নিবন্ধন ব্যর্থ হয়েছে: ${error.message}` 
            : `Registration failed: ${error.message}`);
          return false;
        }

        if (data.user) {
          createdUserId = data.user.id;
          
          localStorage.setItem(`amar_hisab_profile_${createdUserId}`, JSON.stringify({
            id: createdUserId,
            email,
            settings: personalizedSettings
          }));

          // Backup credentials to custom database table immediately to enable login on any device even without email verification
          try {
            await supabase.from('user_accounts').insert({
              id: createdUserId,
              email: email.toLowerCase(),
              password: pass,
              business_name: bizName,
              business_phone: bizPhone,
              business_address: bizAddr,
              currency: "৳",
              language: 'bn'
            });
          } catch (dbErr) {
            console.warn("Could not record backup fallback user credentials:", dbErr);
          }
        }
      } catch (err: any) {
        console.error("Supabase signUp exception:", err);
      }
    }

    const systemUsers = JSON.parse(localStorage.getItem('amar_hisab_users') || '[]');
    const exists = systemUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!exists) {
      const newUsersList = [
        ...systemUsers,
        {
          id: createdUserId,
          email,
          password: pass,
          settings: personalizedSettings
        }
      ];
      localStorage.setItem('amar_hisab_users', JSON.stringify(newUsersList));
    }
    
    // Seed blank / empty lists for completely distinct registration
    const userPartitionKey = `amar_hisab_data_${createdUserId}`;
    const freshData = {
      products: [],
      customers: [],
      sales: [],
      expenses: []
    };
    localStorage.setItem(userPartitionKey, JSON.stringify(freshData));

    await loadUserData(createdUserId);
    setActivePage('dashboard');
    return true;
  };

  // Logout
  const logoutUser = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Supabase auth logout exception skipped:", err);
      }
    }
    setUserId(null);
    setCurrentUser(null);
    setProducts([]);
    setCustomers([]);
    setSales([]);
    setExpenses([]);
    localStorage.removeItem('amar_hisab_last_logged_in');
    setActivePage('login');
  };

  // Product Operations
  const addProduct = (prod: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...prod,
      id: `p_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setProducts(prev => [newProduct, ...prev]);

    if (supabase && userId) {
      supabase.from('products').insert({
        id: newProduct.id,
        user_id: userId,
        name: newProduct.name,
        sku: newProduct.sku,
        stock: newProduct.stock,
        purchase_price: newProduct.purchasePrice,
        sales_price: newProduct.salesPrice,
        category: newProduct.category,
        unit: newProduct.unit,
        min_stock_alert: newProduct.minStockAlert,
        created_at: newProduct.createdAt
      }).then(({ error }) => {
        if (error) console.error("Supabase insert product error:", error.message);
      });
    }

    return newProduct;
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));

    if (supabase) {
      const dbFields: any = {};
      if (updatedFields.name !== undefined) dbFields.name = updatedFields.name;
      if (updatedFields.sku !== undefined) dbFields.sku = updatedFields.sku;
      if (updatedFields.stock !== undefined) dbFields.stock = updatedFields.stock;
      if (updatedFields.purchasePrice !== undefined) dbFields.purchase_price = updatedFields.purchasePrice;
      if (updatedFields.salesPrice !== undefined) dbFields.sales_price = updatedFields.salesPrice;
      if (updatedFields.category !== undefined) dbFields.category = updatedFields.category;
      if (updatedFields.unit !== undefined) dbFields.unit = updatedFields.unit;
      if (updatedFields.minStockAlert !== undefined) dbFields.min_stock_alert = updatedFields.minStockAlert;

      supabase.from('products').update(dbFields).eq('id', id).then(({ error }) => {
        if (error) console.error("Supabase update product error:", error.message);
      });
    }
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    if (supabase) {
      supabase.from('products').delete().eq('id', id).then(({ error }) => {
        if (error) console.error("Supabase delete product error:", error.message);
      });
    }
  };

  // Customer Operations
  const addCustomer = (cust: Omit<Customer, 'id' | 'totalSpent' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...cust,
      id: `c_${Date.now()}`,
      totalSpent: 0,
      createdAt: new Date().toISOString()
    };
    setCustomers(prev => [newCustomer, ...prev]);

    if (supabase && userId) {
      supabase.from('customers').insert({
        id: newCustomer.id,
        user_id: userId,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email || '',
        address: newCustomer.address || '',
        total_spent: newCustomer.totalSpent,
        due_amount: newCustomer.dueAmount,
        created_at: newCustomer.createdAt
      }).then(({ error }) => {
        if (error) console.error("Supabase insert customer error:", error.message);
      });
    }

    return newCustomer;
  };

  const updateCustomer = (id: string, updatedFields: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));

    if (supabase) {
      const dbFields: any = {};
      if (updatedFields.name !== undefined) dbFields.name = updatedFields.name;
      if (updatedFields.phone !== undefined) dbFields.phone = updatedFields.phone;
      if (updatedFields.email !== undefined) dbFields.email = updatedFields.email;
      if (updatedFields.address !== undefined) dbFields.address = updatedFields.address;
      if (updatedFields.totalSpent !== undefined) dbFields.total_spent = updatedFields.totalSpent;
      if (updatedFields.dueAmount !== undefined) dbFields.due_amount = updatedFields.dueAmount;

      supabase.from('customers').update(dbFields).eq('id', id).then(({ error }) => {
        if (error) console.error("Supabase update customer error:", error.message);
      });
    }
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (supabase) {
      supabase.from('customers').delete().eq('id', id).then(({ error }) => {
        if (error) console.error("Supabase delete customer error:", error.message);
      });
    }
  };

  // Sales Operations
  const addSale = (saleData: Omit<Sale, 'id' | 'invoiceNo' | 'date'>) => {
    const nextInvoiceNo = `INV-${new Date().getFullYear()}-${String(sales.length + 1).padStart(4, '0')}`;
    const newSale: Sale = {
      ...saleData,
      id: `s_${Date.now()}`,
      invoiceNo: nextInvoiceNo,
      date: new Date().toISOString()
    };

    setSales(prev => [newSale, ...prev]);

    // Side effect: update product stock values & customer sales records/dues!
    saleData.items.forEach(item => {
      setProducts(prev => prev.map(p => {
        if (p.id === item.productId) {
          const updatedStock = Math.max(0, p.stock - item.qty);
          if (supabase) {
            supabase.from('products').update({ stock: updatedStock }).eq('id', p.id).then(({ error }) => {
              if (error) console.error("Supabase update product stock error:", error.message);
            });
          }
          return { ...p, stock: updatedStock };
        }
        return p;
      }));
    });

    if (saleData.customerId) {
      setCustomers(prev => prev.map(c => {
        if (c.id === saleData.customerId) {
          const newSpent = c.totalSpent + saleData.totalAmount - saleData.discount;
          const newDue = c.dueAmount + saleData.dueAmount;
          if (supabase) {
            supabase.from('customers').update({ total_spent: newSpent, due_amount: newDue }).eq('id', c.id).then(({ error }) => {
              if (error) console.error("Supabase update customer dues/spent error:", error.message);
            });
          }
          return {
            ...c,
            totalSpent: newSpent,
            dueAmount: newDue
          };
        }
        return c;
      }));
    }

    if (supabase && userId) {
      supabase.from('sales').insert({
        id: newSale.id,
        user_id: userId,
        invoice_no: newSale.invoiceNo,
        items: typeof newSale.items === 'string' ? newSale.items : JSON.stringify(newSale.items),
        total_amount: newSale.totalAmount,
        discount: newSale.discount,
        paid_amount: newSale.paidAmount,
        due_amount: newSale.dueAmount,
        customer_id: newSale.customerId || null,
        customer_name: newSale.customerName,
        created_at: newSale.date
      }).then(({ error }) => {
        if (error) console.error("Supabase insert sale error:", error.message);
      });
    }
  };

  // Expenses Operations
  const addExpense = (expData: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expData,
      id: `e_${Date.now()}`,
      date: new Date().toISOString()
    };
    setExpenses(prev => [newExpense, ...prev]);

    if (supabase && userId) {
      supabase.from('expenses').insert({
        id: newExpense.id,
        user_id: userId,
        category: newExpense.category,
        amount: newExpense.amount,
        description: newExpense.description,
        payment_method: newExpense.paymentMethod,
        created_at: newExpense.date
      }).then(({ error }) => {
        if (error) console.error("Supabase insert expense error:", error.message);
      });
    }
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (supabase) {
      supabase.from('expenses').delete().eq('id', id).then(({ error }) => {
        if (error) console.error("Supabase delete expense error:", error.message);
      });
    }
  };

  // Settings Update
  const updateSettings = (newSet: Partial<BusinessSettings>) => {
    const updated = { ...settings, ...newSet };
    setSettings(updated);
    if (newSet.language) setLanguage(newSet.language);

    // Persist profile configurations
    if (userId) {
      const systemUsers = JSON.parse(localStorage.getItem('amar_hisab_users') || '[]');
      const updatedUsers = systemUsers.map((u: any) => {
        if (u.id === userId) {
          return { ...u, settings: updated };
        }
        return u;
      });
      localStorage.setItem('amar_hisab_users', JSON.stringify(updatedUsers));
      setCurrentUser(prev => prev ? { ...prev, settings: updated } : null);
    }
  };

  // Sync Supabase Config
  const saveSupabaseConfig = (cfg: { url: string; anonKey: string }) => {
    setSupabaseConfig(cfg);
    localStorage.setItem('amar_hisab_supabase_config', JSON.stringify(cfg));
  };

  // Backup and Sync Local Transactions to Supabase in 1-Click
  const syncLocalToSupabase = async (): Promise<{ success: boolean; message: string }> => {
    if (!supabase) {
      return { success: false, message: "Supabase client is not initialized properly." };
    }
    if (!userId) {
      return { success: false, message: "Please log in to sync your data." };
    }

    try {
      // Pack Products Payload
      const productsPayload = products.map(p => ({
        id: p.id,
        user_id: userId,
        name: p.name,
        sku: p.sku || '',
        stock: p.stock,
        purchase_price: p.purchasePrice,
        sales_price: p.salesPrice,
        category: p.category,
        unit: p.unit || 'pcs',
        min_stock_alert: p.minStockAlert,
        created_at: p.createdAt
      }));

      // Pack Customers Payload
      const customersPayload = customers.map(c => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        total_spent: c.totalSpent,
        due_amount: c.dueAmount,
        created_at: c.createdAt
      }));

      // Pack Sales Payload
      const salesPayload = sales.map(s => ({
        id: s.id,
        user_id: userId,
        invoice_no: s.invoiceNo,
        items: typeof s.items === 'string' ? s.items : JSON.stringify(s.items),
        total_amount: s.totalAmount,
        discount: s.discount,
        paid_amount: s.paidAmount,
        due_amount: s.dueAmount,
        customer_id: s.customerId || null,
        customer_name: s.customerName || '',
        created_at: s.date
      }));

      // Pack Expenses Payload
      const expensesPayload = expenses.map(e => ({
        id: e.id,
        user_id: userId,
        category: e.category,
        amount: e.amount,
        description: e.description || '',
        payment_method: e.paymentMethod || 'cash',
        created_at: e.date
      }));

      // Push arrays to database tables using Supabase .upsert()
      if (productsPayload.length > 0) {
        const { error } = await supabase.from('products').upsert(productsPayload);
        if (error) throw new Error(`Products sync failed: ${error.message}`);
      }
      if (customersPayload.length > 0) {
        const { error } = await supabase.from('customers').upsert(customersPayload);
        if (error) throw new Error(`Customers sync failed: ${error.message}`);
      }
      if (salesPayload.length > 0) {
        const { error } = await supabase.from('sales').upsert(salesPayload);
        if (error) throw new Error(`Sales sync failed: ${error.message}`);
      }
      if (expensesPayload.length > 0) {
        const { error } = await supabase.from('expenses').upsert(expensesPayload);
        if (error) throw new Error(`Expenses sync failed: ${error.message}`);
      }

      return {
        success: true,
        message: language === 'bn'
          ? "লোকাল ডাটা সফলভাবে ক্লাউড সুপাবেস ডাটাবেজের সাথে সিঙ্ক হয়েছে!"
          : "Local data has been backed up successfully to Supabase cloud!"
      };
    } catch (err: any) {
      console.error("Local sync execution failure:", err);
      return {
        success: false,
        message: language === 'bn'
          ? `সিঙ্ক ব্যর্থ হয়েছে: ${err.message || 'টেবিলগুলো তৈরি করা আছে কি না যাচাই করুন'}`
          : `Sync failed: ${err.message || 'Check if you created the tables inside your SQL editor'}`
      };
    }
  };

  return (
    <AppContext.Provider value={{
      activePage,
      setActivePage,
      language,
      setLanguage: (lang) => {
        setLanguage(lang);
        updateSettings({ language: lang });
      },
      userId,
      currentUser,
      loginUser,
      signupUser,
      logoutUser,
      authError,

      products,
      customers,
      sales,
      expenses,
      settings,

      addProduct,
      updateProduct,
      deleteProduct,

      addCustomer,
      updateCustomer,
      deleteCustomer,

      addSale,
      addExpense,
      deleteExpense,
      updateSettings,

      supabaseConfig,
      setSupabaseConfig: saveSupabaseConfig,
      syncLocalToSupabase,

      // Custom categories exposed
      customCategories,
      addCustomCategory,
      deleteCustomCategory
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
