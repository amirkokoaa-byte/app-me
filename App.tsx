
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, Calendar, Clock, Plus, Trash2, Archive, TrendingDown, 
  LayoutDashboard, ShieldCheck, ChevronLeft, Settings, UserPlus, 
  LogOut, CheckCircle2, MessageCircle, Send, X, Edit3, UserCircle,
  Sun, Moon, Laptop, Leaf
} from 'lucide-react';
import { 
  Expense, Commitment, MonthlyRecord, AppTab, 
  User, ThemeType, ChatMessage 
} from './types';

// Constants
const DEFAULT_EXPENSE_CATEGORIES = ['المياه', 'الغاز', 'الكهرباء', 'الانترنت المنزلي', 'الخط الارضي', 'جمعيات', 'اقساط بنك'];
const COMMITMENT_TYPES = ['جمعيات', 'اقساط بنك', 'التزامات اخرى'];
const EMOJIS = ['😊', '💰', '📉', '📊', '✅', '❌', '🏡', '💳', '💡'];

const App: React.FC = () => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // --- Theme State ---
  const [theme, setTheme] = useState<ThemeType>('light');

  // --- Main Data State ---
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.MONTHLY_EXPENSES);
  const [time, setTime] = useState(new Date());
  const [salary, setSalary] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [history, setHistory] = useState<MonthlyRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // --- UI Modals/Local State ---
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsUserModalOpen, setIsSettingsUserModalOpen] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [tempExpense, setTempExpense] = useState({ value: '', date: '', name: '' });
  const [tempCommitment, setTempCommitment] = useState({ 
    totalValue: '', installmentsCount: '', paidAmount: '', duration: '', date: '', type: '' 
  });
  const [chatInput, setChatInput] = useState('');
  const [editUserForm, setEditUserForm] = useState<Partial<User>>({});

  // --- Clock ---
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Initial Load ---
  useEffect(() => {
    const savedUsers = localStorage.getItem('sp_users');
    if (!savedUsers) {
      const initialUsers = [{ id: '1', username: 'admin', password: 'admin', isAdmin: true }];
      localStorage.setItem('sp_users', JSON.stringify(initialUsers));
      setUsers(initialUsers);
    } else {
      setUsers(JSON.parse(savedUsers));
    }

    const savedGlobalData = JSON.parse(localStorage.getItem('sp_global_data') || '{}');
    if (savedGlobalData.messages) setMessages(savedGlobalData.messages);
  }, []);

  // --- Load User Data when logged in ---
  useEffect(() => {
    if (currentUser) {
      const userData = JSON.parse(localStorage.getItem(`sp_data_${currentUser.id}`) || '{}');
      setSalary(userData.salary || 0);
      setExpenses(userData.expenses || []);
      setCommitments(userData.commitments || []);
      setHistory(userData.history || []);
      setTheme(userData.theme || 'light');
    }
  }, [currentUser]);

  // --- Save Logic ---
  const saveUserData = () => {
    if (currentUser) {
      localStorage.setItem(`sp_data_${currentUser.id}`, JSON.stringify({ salary, expenses, commitments, history, theme }));
    }
    // Global data (messages, users)
    localStorage.setItem('sp_users', JSON.stringify(users));
    localStorage.setItem('sp_global_data', JSON.stringify({ messages }));
  };

  useEffect(() => {
    saveUserData();
  }, [salary, expenses, commitments, history, theme, users, messages, currentUser]);

  // --- Derived Calculations ---
  const userExpenses = useMemo(() => expenses.filter(e => !e.isPaid), [expenses]);
  const totalExpensesVal = useMemo(() => userExpenses.reduce((sum, e) => sum + e.value, 0), [userExpenses]);
  const balance = salary - totalExpensesVal;

  const totalCommitmentValue = useMemo(() => commitments.reduce((sum, c) => sum + c.totalValue, 0), [commitments]);
  const totalCommitmentRemaining = useMemo(() => commitments.reduce((sum, c) => sum + c.remainingAmount, 0), [commitments]);

  // Check for due dates today
  const hasDueToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const expDue = expenses.some(e => e.dueDate === today && !e.isPaid);
    const comDue = commitments.some(c => c.date === today && !c.isCompleted);
    return expDue || comDue;
  }, [expenses, commitments]);

  // --- Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) setCurrentUser(user);
    else alert('خطأ في اسم المستخدم أو كلمة المرور');
  };

  const handleAddExpense = () => {
    if (!tempExpense.value) return;
    const newExp: Expense = {
      id: Date.now().toString(),
      name: isAddingCustomCategory ? tempExpense.name : selectedCategory,
      value: Number(tempExpense.value),
      dueDate: tempExpense.date || new Date().toISOString().split('T')[0],
      category: isAddingCustomCategory ? tempExpense.name : selectedCategory,
      isPaid: false,
      userId: currentUser!.id
    };
    setExpenses([...expenses, newExp]);
    setIsExpenseModalOpen(false);
    setTempExpense({ value: '', date: '', name: '' });
  };

  const handleAddCommitment = () => {
    const total = Number(tempCommitment.totalValue);
    const paid = Number(tempCommitment.paidAmount || 0);
    const newCom: Commitment = {
      id: Date.now().toString(),
      type: tempCommitment.type || selectedCategory,
      totalValue: total,
      installmentsCount: Number(tempCommitment.installmentsCount),
      paidAmount: paid,
      remainingAmount: total - paid,
      duration: tempCommitment.duration,
      date: tempCommitment.date || new Date().toISOString().split('T')[0],
      userId: currentUser!.id,
      isCompleted: total - paid <= 0
    };
    setCommitments([...commitments, newCom]);
    setIsCommitmentModalOpen(false);
    setTempCommitment({ totalValue: '', installmentsCount: '', paidAmount: '', duration: '', date: '', type: '' });
  };

  const togglePaidExpense = (id: string) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, isPaid: true } : e));
  };

  const payCommitmentInstallment = (id: string) => {
    setCommitments(commitments.map(c => {
      if (c.id === id) {
        const installmentValue = c.totalValue / c.installmentsCount;
        const newPaid = Math.min(c.paidAmount + installmentValue, c.totalValue);
        return { ...c, paidAmount: newPaid, remainingAmount: c.totalValue - newPaid, isCompleted: c.totalValue - newPaid <= 0 };
      }
      return c;
    }));
  };

  const deleteCommitment = (id: string) => {
    setCommitments(commitments.filter(c => c.id !== id));
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      fromUserId: currentUser!.id,
      fromUsername: currentUser!.username,
      text: chatInput,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMsg]);
    setChatInput('');
  };

  // --- Themes CSS Mapping ---
  const themeClasses = {
    light: "bg-slate-50 text-slate-900 border-slate-200",
    dark: "bg-slate-900 text-slate-100 border-slate-700",
    midnight: "bg-[#0b0e14] text-blue-100 border-blue-900",
    emerald: "bg-[#f0f9f4] text-[#064e3b] border-[#d1fae5]"
  };

  const sidebarClasses = {
    light: "bg-white border-slate-200",
    dark: "bg-slate-800 border-slate-700",
    midnight: "bg-[#151921] border-blue-900",
    emerald: "bg-white border-[#d1fae5]"
  };

  // --- Render Login ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-['Cairo']">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-12 text-center animate-in zoom-in-95 duration-500">
          <div className="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-200">
            <Wallet className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Smart Prise</h1>
          <p className="text-slate-400 mb-10">نظام الإدارة المالية الشخصي</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-right space-y-2">
              <label className="text-xs font-bold text-slate-500 pr-2">اسم المستخدم</label>
              <input 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center"
                value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                required
              />
            </div>
            <div className="text-right space-y-2">
              <label className="text-xs font-bold text-slate-500 pr-2">كلمة المرور</label>
              <input 
                type="password"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                required
              />
            </div>
            <button className="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95">
              تسجيل الدخول
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 font-['Cairo'] ${themeClasses[theme]}`}>
      
      {/* Sidebar */}
      <aside className={`w-72 flex flex-col shadow-xl z-20 transition-colors duration-300 ${sidebarClasses[theme]}`}>
        <div className="p-8 border-b border-opacity-10 bg-blue-600 text-white flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl"><Wallet size={24} /></div>
          <h1 className="text-xl font-black tracking-tight">Smart Prise</h1>
        </div>
        
        <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
          {[
            { id: AppTab.MONTHLY_EXPENSES, icon: LayoutDashboard, label: 'المصروفات الشهرية' },
            { id: AppTab.COMMITMENTS, icon: ShieldCheck, label: 'الالتزامات', alert: hasDueToday },
            { id: AppTab.PREVIOUS_MONTHS, icon: Archive, label: 'الأرشيف' },
            { id: AppTab.SETTINGS, icon: Settings, label: 'الإعدادات' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105 font-bold' 
                  : tab.alert ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </div>
              {tab.alert && <div className="w-2 h-2 bg-white rounded-full shadow-lg"></div>}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-opacity-10 bg-opacity-50 space-y-4">
          <div className="flex items-center gap-4 text-slate-500">
            <Calendar size={18} />
            <span className="text-sm font-medium">{time.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <div className="flex items-center gap-4 text-blue-600 font-black">
            <Clock size={18} />
            <span className="text-2xl tabular-nums" dir="ltr">{time.toLocaleTimeString('ar-EG', { hour12: true, hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <button 
            onClick={() => setCurrentUser(null)}
            className="w-full flex items-center gap-3 text-red-400 hover:text-red-500 text-sm font-bold pt-4 border-t border-slate-100"
          >
            <LogOut size={16} />
            <span>تسجيل الخروج ({currentUser.username})</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header Summary */}
        <header className={`p-8 flex flex-wrap items-center justify-between gap-8 shadow-sm transition-colors ${sidebarClasses[theme]}`}>
          <div className="flex items-center gap-6">
            <div className="bg-blue-50 p-4 rounded-3xl text-blue-600 shadow-inner">
              <Wallet size={32} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black mb-1 uppercase tracking-widest">الراتب الشهري</p>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  className="text-3xl font-black bg-transparent border-none focus:ring-0 w-36 outline-none hover:text-blue-600 transition-colors"
                />
                <span className="text-slate-300 font-bold">ج.م</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-12 bg-slate-50 p-4 px-8 rounded-[2rem] border border-slate-100">
            <div className="text-center">
              <p className="text-slate-400 text-[10px] font-black uppercase mb-1">المصروفات</p>
              <p className="text-xl font-bold text-red-500">{totalExpensesVal.toLocaleString()} ج.م</p>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="text-center">
              <p className="text-slate-400 text-[10px] font-black uppercase mb-1">المتبقي</p>
              <p className={`text-3xl font-black ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {balance.toLocaleString()}
              </p>
            </div>
          </div>
        </header>

        {/* Dynamic View */}
        <div className="flex-1 overflow-y-auto p-10 max-w-7xl mx-auto w-full">
          
          {activeTab === AppTab.MONTHLY_EXPENSES && (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-500">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-black">المصروفات النشطة</h2>
                  <p className="text-slate-400 mt-2 font-medium">إجمالي المصروفات غير المدفوعة حالياً</p>
                </div>
                <button 
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="bg-blue-600 text-white px-8 py-5 rounded-2xl flex items-center gap-3 font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-200"
                >
                  <Plus size={24} />
                  أضف مصروف
                </button>
              </div>

              <div className="grid gap-6">
                {userExpenses.map(exp => (
                  <div key={exp.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-xl transition-all group border-r-8 border-r-blue-500">
                    <div className="flex items-center gap-6">
                      <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                        <TrendingDown size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{exp.name}</h4>
                        <div className="flex gap-4 text-xs text-slate-400 font-bold mt-2">
                          <span className="bg-slate-100 px-3 py-1 rounded-full">{exp.category}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} /> {exp.dueDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="text-2xl font-black text-slate-700">{exp.value.toLocaleString()} ج.م</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => togglePaidExpense(exp.id)}
                          className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                          title="تم السداد"
                        >
                          <CheckCircle2 size={24} />
                        </button>
                        <button 
                          onClick={() => setExpenses(expenses.filter(e => e.id !== exp.id))}
                          className="p-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 size={24} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === AppTab.COMMITMENTS && (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-500">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black">الالتزامات والأقساط</h2>
                <button 
                  onClick={() => { setSelectedCategory(COMMITMENT_TYPES[0]); setIsCommitmentModalOpen(true); }}
                  className="bg-emerald-600 text-white px-8 py-5 rounded-2xl flex items-center gap-3 font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-200"
                >
                  <Plus size={24} />
                  أضف التزام
                </button>
              </div>

              <div className="grid gap-6 mb-12">
                {commitments.map(com => (
                  <div key={com.id} className={`p-8 rounded-[2.5rem] border flex flex-col gap-6 shadow-sm transition-all relative overflow-hidden bg-white ${com.isCompleted ? 'opacity-60 grayscale' : 'border-slate-100'}`}>
                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-5">
                        <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600"><ShieldCheck size={32} /></div>
                        <div>
                          <h4 className="text-xl font-black">{com.type}</h4>
                          <p className="text-slate-400 text-xs font-bold mt-1">المدة: {com.duration} | التاريخ: {com.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {!com.isCompleted && (
                          <button onClick={() => payCommitmentInstallment(com.id)} className="bg-emerald-100 text-emerald-700 px-5 py-2 rounded-xl font-black text-sm hover:bg-emerald-600 hover:text-white transition-all">دفع قسط</button>
                        )}
                        <button className="p-2 text-slate-300 hover:text-blue-500"><Edit3 size={18} /></button>
                        <button onClick={() => deleteCommitment(com.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 z-10">
                      <div className="bg-slate-50 p-4 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">إجمالي الالتزام</p>
                        <p className="text-lg font-black">{com.totalValue.toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-blue-400 uppercase mb-1">المدفوع</p>
                        <p className="text-lg font-black text-blue-600">{com.paidAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-red-400 uppercase mb-1">المتبقي</p>
                        <p className="text-lg font-black text-red-600">{com.remainingAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">عدد الأقساط</p>
                        <p className="text-lg font-black">{com.installmentsCount}</p>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-1000" 
                        style={{ width: `${(com.paidAmount / com.totalValue) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Commitments Summary */}
              <div className="bg-slate-800 text-white p-10 rounded-[3rem] shadow-2xl flex items-center justify-around gap-10">
                <div className="text-center">
                  <p className="text-slate-400 font-bold mb-2">إجمالي الالتزامات (قبل الدفع)</p>
                  <p className="text-4xl font-black">{totalCommitmentValue.toLocaleString()} <span className="text-lg font-normal">ج.م</span></p>
                </div>
                <div className="w-px h-16 bg-white/10"></div>
                <div className="text-center">
                  <p className="text-slate-400 font-bold mb-2">صافي المتبقي حالياً</p>
                  <p className="text-4xl font-black text-emerald-400">{totalCommitmentRemaining.toLocaleString()} <span className="text-lg font-normal">ج.م</span></p>
                </div>
              </div>
            </div>
          )}

          {activeTab === AppTab.SETTINGS && (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-500">
              <h2 className="text-3xl font-black mb-10">إعدادات النظام</h2>
              
              <div className="grid md:grid-cols-2 gap-10">
                {/* User Management */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black">إدارة الحسابات</h3>
                    {currentUser.isAdmin && (
                      <button 
                        onClick={() => setIsSettingsUserModalOpen(true)}
                        className="bg-blue-50 text-blue-600 p-3 rounded-2xl hover:bg-blue-600 hover:text-white transition-all"
                      >
                        <UserPlus size={24} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-4">
                    {users.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="bg-white p-2 rounded-xl text-slate-400"><UserCircle size={24} /></div>
                          <div>
                            <p className="font-black text-slate-800">{u.username}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{u.isAdmin ? 'مدير نظام' : 'مستخدم عادي'}</p>
                          </div>
                        </div>
                        {currentUser.isAdmin && u.username !== 'admin' && (
                          <button 
                            onClick={() => setUsers(users.filter(usr => usr.id !== u.id))}
                            className="text-red-400 hover:text-red-600 p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Theme & Style */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-black mb-8">سمة البرنامج</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'light', label: 'كلاسيكي فاتح', icon: Sun, color: 'bg-white' },
                      { id: 'dark', label: 'ليلي عصري', icon: Moon, color: 'bg-slate-800' },
                      { id: 'midnight', label: 'منتصف الليل', icon: Laptop, color: 'bg-[#0b0e14]' },
                      { id: 'emerald', label: 'طبيعة هادئة', icon: Leaf, color: 'bg-[#f0f9f4]' }
                    ].map(t => (
                      <button 
                        key={t.id}
                        onClick={() => setTheme(t.id as ThemeType)}
                        className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${theme === t.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:bg-slate-50'}`}
                      >
                        <div className={`w-12 h-12 rounded-2xl shadow-inner ${t.color} flex items-center justify-center`}>
                          <t.icon size={24} className={theme === t.id ? 'text-blue-500' : 'text-slate-400'} />
                        </div>
                        <span className="font-bold text-sm">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === AppTab.PREVIOUS_MONTHS && (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-500">
              <h2 className="text-3xl font-black mb-10">الأرشيف المالي</h2>
              {history.length === 0 ? (
                <div className="bg-white border-4 border-dashed border-slate-100 rounded-[3rem] p-24 text-center">
                  <Archive size={64} className="text-slate-200 mx-auto mb-6" />
                  <p className="text-slate-400 font-black text-xl">لا يوجد سجلات مؤرشفة حتى الآن</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {history.map(record => (
                    <div key={record.id} className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-slate-100">
                      <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
                        <h4 className="text-xl font-black">{record.monthName}</h4>
                        <span className="bg-white/20 px-4 py-2 rounded-xl text-sm font-bold">الراتب: {record.salary.toLocaleString()} ج.م</span>
                      </div>
                      <div className="p-8 grid md:grid-cols-2 gap-10">
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest">تفاصيل المصروفات</p>
                          <div className="space-y-2">
                            {record.expenses.map(e => (
                              <div key={e.id} className="flex justify-between text-sm py-2 border-b border-slate-50">
                                <span className="font-bold">{e.name}</span>
                                <span className="text-slate-600">{e.value.toLocaleString()} ج.م</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl flex flex-col justify-center text-center">
                          <p className="text-slate-400 text-sm font-bold mb-1">إجمالي المصروفات</p>
                          <p className="text-3xl font-black text-red-500 mb-4">{record.totalExpenses.toLocaleString()} ج.م</p>
                          <div className="h-px bg-slate-200 mb-4"></div>
                          <p className="text-slate-400 text-sm font-bold mb-1">صافي المتبقي</p>
                          <p className="text-3xl font-black text-green-600">{(record.salary - record.totalExpenses).toLocaleString()} ج.م</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Floating Chat */}
      <div className="fixed bottom-8 left-8 z-[100]">
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-bounce"
          >
            <MessageCircle size={32} />
          </button>
        ) : (
          <div className="bg-white w-96 h-[500px] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-5">
            <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <MessageCircle size={24} />
                <span className="font-black">محادثة عامة</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="bg-white/20 p-1 rounded-lg"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.fromUserId === currentUser.id ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-black text-slate-400 px-2 mb-1 uppercase tracking-tighter">{msg.fromUsername}</span>
                  <div className={`p-4 rounded-2xl max-w-[80%] text-sm font-bold shadow-sm ${msg.fromUserId === currentUser.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none'}`}>
                    {msg.text}
                    <p className={`text-[9px] mt-1 text-right ${msg.fromUserId === currentUser.id ? 'text-blue-200' : 'text-slate-300'}`}>{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 bg-white">
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                {EMOJIS.map(e => <button key={e} onClick={() => setChatInput(p => p + e)} className="p-1 hover:bg-slate-50 rounded text-lg">{e}</button>)}
              </div>
              <div className="flex gap-2">
                <input 
                  className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="اكتب رسالة..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendChatMessage()}
                />
                <button onClick={sendChatMessage} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors"><Send size={20}/></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
            <h3 className="text-2xl font-black mb-8">إضافة مصروف جديد</h3>
            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الفئة</label>
                  {!isAddingCustomCategory ? (
                    <select 
                      className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                    >
                      {DEFAULT_EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input 
                      className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                      placeholder="أدخل فئة جديدة"
                      value={tempExpense.name}
                      onChange={e => setTempExpense({...tempExpense, name: e.target.value})}
                    />
                  )}
                </div>
                <button 
                  onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                  className="mt-6 bg-slate-100 p-4 rounded-2xl text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                >
                  {isAddingCustomCategory ? <ChevronLeft size={24}/> : <Plus size={24}/>}
                </button>
              </div>
              <div className="space-y-2 text-right">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">القيمة (ج.م)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 p-5 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-2xl font-black text-blue-600"
                  value={tempExpense.value}
                  onChange={e => setTempExpense({...tempExpense, value: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">موعد السداد</label>
                <input 
                  type="date"
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                  value={tempExpense.date}
                  onChange={e => setTempExpense({...tempExpense, date: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={handleAddExpense} className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all">إضافة المصروف</button>
                <button onClick={() => setIsExpenseModalOpen(false)} className="flex-1 bg-slate-100 text-slate-400 py-5 rounded-2xl font-black hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commitment Modal */}
      {isCommitmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-12 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-black mb-8">تفاصيل الالتزام الجديد</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">النوع</label>
                <select 
                  className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                  value={tempCommitment.type}
                  onChange={e => setTempCommitment({...tempCommitment, type: e.target.value})}
                >
                  {COMMITMENT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">إجمالي القيمة</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-black"
                  value={tempCommitment.totalValue}
                  onChange={e => setTempCommitment({...tempCommitment, totalValue: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">عدد الأقساط</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-black"
                  value={tempCommitment.installmentsCount}
                  onChange={e => setTempCommitment({...tempCommitment, installmentsCount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">ما تم دفعه</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-black"
                  value={tempCommitment.paidAmount}
                  onChange={e => setTempCommitment({...tempCommitment, paidAmount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">مدة الالتزام (مثلاً: سنتين)</label>
                <input 
                  className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-black"
                  value={tempCommitment.duration}
                  onChange={e => setTempCommitment({...tempCommitment, duration: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase">ميعاد الاستحقاق القادم</label>
                <input 
                  type="date"
                  className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-black"
                  value={tempCommitment.date}
                  onChange={e => setTempCommitment({...tempCommitment, date: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={handleAddCommitment} className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-lg shadow-emerald-100 active:scale-95 transition-all">إضافة الالتزام</button>
              <button onClick={() => setIsCommitmentModalOpen(false)} className="flex-1 bg-slate-100 text-slate-400 py-5 rounded-2xl font-black hover:bg-slate-200 transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* User Creation Modal */}
      {isSettingsUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl">
            <h3 className="text-2xl font-black mb-8">إضافة مستخدم جديد</h3>
            <div className="space-y-6">
              <input 
                className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                placeholder="اسم المستخدم"
                onChange={e => setEditUserForm({...editUserForm, username: e.target.value})}
              />
              <input 
                type="password"
                className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" 
                placeholder="كلمة المرور"
                onChange={e => setEditUserForm({...editUserForm, password: e.target.value})}
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    if (editUserForm.username && editUserForm.password) {
                      setUsers([...users, { id: Date.now().toString(), username: editUserForm.username, password: editUserForm.password, isAdmin: false }]);
                      setIsSettingsUserModalOpen(false);
                      setEditUserForm({});
                    }
                  }}
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black"
                >إضافة</button>
                <button onClick={() => setIsSettingsUserModalOpen(false)} className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-2xl font-black">إغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
