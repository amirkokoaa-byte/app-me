
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, Calendar, Clock, Plus, Trash2, Archive, TrendingDown, 
  LayoutDashboard, ShieldCheck, ChevronLeft, Settings, UserPlus, 
  LogOut, CheckCircle2, MessageCircle, Send, X, Edit3, UserCircle,
  Sun, Moon, Laptop, Leaf, Lock, User as UserIcon, Eye, EyeOff,
  Palette, ShieldAlert, KeyRound
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
  const [showPassword, setShowPassword] = useState(false);

  // --- Theme State ---
  const [theme, setTheme] = useState<ThemeType>('modern-light');

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
  const [newPassword, setNewPassword] = useState('');

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
      setTheme(userData.theme || 'modern-light');
    }
  }, [currentUser]);

  // --- Save Logic ---
  const saveUserData = () => {
    if (currentUser) {
      localStorage.setItem(`sp_data_${currentUser.id}`, JSON.stringify({ salary, expenses, commitments, history, theme }));
    }
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
    if (user) {
      setCurrentUser(user);
    } else {
      alert('خطأ في اسم المستخدم أو كلمة المرور');
    }
  };

  const handleChangePassword = () => {
    if (!newPassword) return;
    const updatedUsers = users.map(u => u.id === currentUser?.id ? { ...u, password: newPassword } : u);
    setUsers(updatedUsers);
    setNewPassword('');
    alert('تم تغيير كلمة المرور بنجاح');
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
    'modern-light': "bg-slate-50 text-slate-900 border-slate-200",
    'dark-classic': "bg-black text-white border-black",
    'deep-ocean': "bg-[#0f172a] text-blue-50 border-blue-900",
    'royal-gold': "bg-[#1c1917] text-[#fef3c7] border-[#44403c]"
  };

  const sidebarClasses = {
    'modern-light': "bg-white border-slate-200",
    'dark-classic': "bg-black border-black",
    'deep-ocean': "bg-[#1e293b] border-blue-950",
    'royal-gold': "bg-[#292524] border-[#44403c]"
  };

  const cardClasses = {
    'modern-light': "bg-white border-slate-100 shadow-sm",
    'dark-classic': "bg-[#0a0a0a] border-[#222] shadow-none",
    'deep-ocean': "bg-[#1e293b] border-[#334155]",
    'royal-gold': "bg-[#292524] border-[#44403c]"
  };

  // --- Render Login ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-['Cairo'] relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
        <div className="bg-white/95 backdrop-blur-xl w-full max-w-[480px] rounded-[3rem] shadow-2xl p-10 md:p-14 text-center z-10 border border-white/20 animate-in fade-in zoom-in-95 duration-700">
          <div className="inline-flex bg-gradient-to-tr from-blue-600 to-blue-400 w-24 h-24 rounded-[2rem] items-center justify-center mb-10 shadow-2xl shadow-blue-500/30">
            <Wallet className="text-white" size={48} />
          </div>
          <div className="mb-10">
            <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Smart Prise</h1>
            <p className="text-slate-500 font-medium">سجل دخولك لإدارة ميزانيتك</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-right space-y-2">
              <label className="text-[11px] font-black text-slate-400 pr-4 uppercase tracking-widest">اسم المستخدم</label>
              <div className="relative">
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 pr-14 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg font-bold"
                  value={loginForm.username}
                  onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                  required
                  placeholder="admin"
                />
                <UserIcon className="absolute top-1/2 right-5 -translate-y-1/2 text-slate-400" size={22} />
              </div>
            </div>
            <div className="text-right space-y-2">
              <label className="text-[11px] font-black text-slate-400 pr-4 uppercase tracking-widest">كلمة المرور</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 pr-14 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg font-bold"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  required
                  placeholder="admin"
                />
                <Lock className="absolute top-1/2 right-5 -translate-y-1/2 text-slate-400" size={22} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 left-5 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-blue-600 transition-all shadow-xl active:scale-[0.98]">
              دخول للنظام
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
        <div className="p-8 border-b border-white/5 bg-blue-600 text-white flex items-center gap-3">
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
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105 font-bold' 
                  : tab.alert ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </div>
              {tab.alert && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </button>
          ))}
        </nav>

        <div className={`p-8 border-t border-white/5 space-y-4 ${theme === 'dark-classic' ? 'bg-black' : ''}`}>
          <div className="flex items-center gap-4 text-slate-500">
            <Calendar size={18} />
            <span className="text-sm font-medium">{time.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <div className={`flex items-center gap-4 font-black ${theme === 'dark-classic' ? 'text-white' : 'text-blue-600'}`}>
            <Clock size={18} />
            <span className="text-2xl tabular-nums" dir="ltr">{time.toLocaleTimeString('ar-EG', { hour12: true, hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <button onClick={() => setCurrentUser(null)} className="w-full flex items-center gap-3 text-red-400 hover:text-red-500 text-sm font-bold pt-4 border-t border-white/5">
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
            <div className="bg-blue-600/10 p-4 rounded-3xl text-blue-500 shadow-inner">
              <Wallet size={32} />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-black mb-1 uppercase tracking-widest">الراتب الشهري</p>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  className="text-3xl font-black bg-transparent border-none focus:ring-0 w-36 outline-none"
                />
                <span className="text-slate-500 font-bold">ج.م</span>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-12 p-4 px-8 rounded-[2rem] border ${theme === 'dark-classic' ? 'bg-[#111] border-black' : 'bg-white/5 border-white/10'}`}>
            <div className="text-center">
              <p className="text-slate-500 text-[10px] font-black uppercase mb-1">المصروفات</p>
              <p className="text-xl font-bold text-red-500">{totalExpensesVal.toLocaleString()} ج.م</p>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="text-center">
              <p className="text-slate-500 text-[10px] font-black uppercase mb-1">المتبقي</p>
              <p className={`text-3xl font-black ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {balance.toLocaleString()}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 max-w-7xl mx-auto w-full">
          
          {activeTab === AppTab.MONTHLY_EXPENSES && (
            <div className="animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black">المصروفات النشطة</h2>
                <button onClick={() => setIsExpenseModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-bold shadow-lg shadow-blue-600/20">
                  <Plus size={24} /> أضف مصروف
                </button>
              </div>

              <div className="grid gap-6">
                {userExpenses.map(exp => (
                  <div key={exp.id} className={`p-6 rounded-3xl border flex items-center justify-between group border-r-8 border-r-blue-500 transition-all ${cardClasses[theme]}`}>
                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl ${theme === 'dark-classic' ? 'bg-[#111]' : 'bg-slate-100'}`}>
                        <TrendingDown size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black uppercase tracking-tight">{exp.name}</h4>
                        <div className="flex gap-4 text-xs font-bold mt-2 opacity-60">
                          <span className="bg-white/5 px-3 py-1 rounded-full">{exp.category}</span>
                          <span className="flex items-center gap-1"><Calendar size={12} /> {exp.dueDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="text-2xl font-black">{exp.value.toLocaleString()} ج.م</span>
                      <div className="flex gap-2">
                        <button onClick={() => togglePaidExpense(exp.id)} className="p-3 bg-green-500/10 text-green-500 rounded-2xl hover:bg-green-500 hover:text-white transition-all">
                          <CheckCircle2 size={24} />
                        </button>
                        <button onClick={() => setExpenses(expenses.filter(e => e.id !== exp.id))} className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
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
            <div className="animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black">الالتزامات والأقساط</h2>
                <button onClick={() => { setSelectedCategory(COMMITMENT_TYPES[0]); setIsCommitmentModalOpen(true); }} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-bold shadow-lg shadow-emerald-600/20">
                  <Plus size={24} /> أضف التزام
                </button>
              </div>
              <div className="grid gap-6 mb-12">
                {commitments.map(com => (
                  <div key={com.id} className={`p-8 rounded-[2.5rem] border flex flex-col gap-6 relative overflow-hidden transition-all ${cardClasses[theme]} ${com.isCompleted ? 'opacity-40 grayscale' : ''}`}>
                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-5">
                        <div className="bg-emerald-500/10 p-4 rounded-3xl text-emerald-500"><ShieldCheck size={32} /></div>
                        <div>
                          <h4 className="text-xl font-black">{com.type}</h4>
                          <p className="text-sm font-bold mt-1 opacity-60">المدة: {com.duration} | التاريخ: {com.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {!com.isCompleted && (
                          <button onClick={() => payCommitmentInstallment(com.id)} className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-black text-sm">دفع قسط</button>
                        )}
                        <button onClick={() => deleteCommitment(com.id)} className="p-2 text-red-400"><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 z-10">
                      <div className="bg-white/5 p-4 rounded-2xl text-center">
                        <p className="text-[10px] font-black opacity-50 uppercase mb-1">الإجمالي</p>
                        <p className="text-lg font-black">{com.totalValue.toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-500/10 p-4 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-blue-400 uppercase mb-1">المدفوع</p>
                        <p className="text-lg font-black text-blue-400">{com.paidAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-red-500/10 p-4 rounded-2xl text-center">
                        <p className="text-[10px] font-black text-red-400 uppercase mb-1">المتبقي</p>
                        <p className="text-lg font-black text-red-400">{com.remainingAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl text-center">
                        <p className="text-[10px] font-black opacity-50 uppercase mb-1">الأقساط</p>
                        <p className="text-lg font-black">{com.installmentsCount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-800 text-white p-10 rounded-[3rem] shadow-2xl flex items-center justify-around gap-10">
                <div className="text-center">
                  <p className="text-slate-400 font-bold mb-2">إجمالي الالتزامات</p>
                  <p className="text-4xl font-black">{totalCommitmentValue.toLocaleString()} ج.م</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 font-bold mb-2">المتبقي الصافي</p>
                  <p className="text-4xl font-black text-emerald-400">{totalCommitmentRemaining.toLocaleString()} ج.م</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === AppTab.SETTINGS && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-3xl font-black mb-10">الإعدادات والأمان</h2>
              <div className="grid md:grid-cols-2 gap-10">
                <div className={`p-8 rounded-[2.5rem] border ${cardClasses[theme]}`}>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <UserCircle className="text-blue-500" size={28}/>
                      <h3 className="text-xl font-black">إدارة الحسابات</h3>
                    </div>
                    {currentUser.isAdmin && (
                      <button onClick={() => setIsSettingsUserModalOpen(true)} className="bg-blue-600 text-white p-2 rounded-xl">
                        <UserPlus size={20} />
                      </button>
                    )}
                  </div>
                  <div className="space-y-4 mb-10">
                    {users.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <p className="font-black">{u.username}</p>
                          {u.isAdmin && <span className="bg-blue-600 text-[9px] px-2 py-1 rounded-full uppercase font-black text-white">Admin</span>}
                        </div>
                        {currentUser.isAdmin && u.username !== 'admin' && (
                          <button onClick={() => setUsers(users.filter(usr => usr.id !== u.id))} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <h4 className="text-sm font-black mb-4 flex items-center gap-2"><KeyRound size={16}/> تغيير كلمة المرور للحساب الحالي</h4>
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="كلمة مرور جديدة"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={handleChangePassword} className="bg-blue-600 text-white px-6 rounded-xl font-bold">تحديث</button>
                    </div>
                  </div>
                </div>

                <div className={`p-8 rounded-[2.5rem] border ${cardClasses[theme]}`}>
                  <div className="flex items-center gap-3 mb-8">
                    <Palette className="text-blue-500" size={28}/>
                    <h3 className="text-xl font-black">مظهر البرنامج</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'modern-light', label: 'كلاسيكي فاتح', icon: Sun, color: 'bg-white' },
                      { id: 'dark-classic', label: 'ليلي (أسود)', icon: Moon, color: 'bg-black' },
                      { id: 'deep-ocean', label: 'المحيط العميق', icon: Laptop, color: 'bg-[#0f172a]' },
                      { id: 'royal-gold', label: 'ذهبي ملكي', icon: Leaf, color: 'bg-[#1c1917]' }
                    ].map(t => (
                      <button 
                        key={t.id}
                        onClick={() => setTheme(t.id as ThemeType)}
                        className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${theme === t.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 hover:bg-white/5'}`}
                      >
                        <div className={`w-12 h-12 rounded-2xl shadow-inner ${t.color} flex items-center justify-center border border-white/10`}>
                          <t.icon size={24} className={theme === t.id ? 'text-blue-500' : 'opacity-40'} />
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
            <div className="animate-in fade-in duration-500">
              <h2 className="text-3xl font-black mb-10">الأرشيف المالي</h2>
              {history.length === 0 ? (
                <div className="bg-white/5 border-4 border-dashed border-white/5 rounded-[3rem] p-24 text-center">
                  <Archive size={64} className="opacity-20 mx-auto mb-6" />
                  <p className="opacity-40 font-black text-xl">الأرشيف فارغ حالياً</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {history.map(record => (
                    <div key={record.id} className={`rounded-[2.5rem] shadow-sm overflow-hidden border ${cardClasses[theme]}`}>
                      <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                        <h4 className="text-xl font-black">{record.monthName}</h4>
                        <span className="bg-white/20 px-4 py-2 rounded-xl text-sm font-bold">الراتب: {record.salary.toLocaleString()}</span>
                      </div>
                      <div className="p-8 grid md:grid-cols-2 gap-10">
                        <div className="space-y-2">
                          {record.expenses.map(e => (
                            <div key={e.id} className="flex justify-between text-sm py-2 border-b border-white/5 font-bold">
                              <span>{e.name}</span>
                              <span className="opacity-60">{e.value.toLocaleString()} ج.م</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-white/5 p-6 rounded-3xl text-center">
                          <p className="text-sm opacity-50 mb-1">المصروفات</p>
                          <p className="text-3xl font-black text-red-500 mb-4">{record.totalExpenses.toLocaleString()}</p>
                          <p className="text-sm opacity-50 mb-1">المتبقي</p>
                          <p className="text-3xl font-black text-green-500">{(record.salary - record.totalExpenses).toLocaleString()}</p>
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
          <button onClick={() => setIsChatOpen(true)} className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
            <MessageCircle size={32} />
          </button>
        ) : (
          <div className={`w-96 h-[500px] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border animate-in slide-in-from-bottom-5 ${cardClasses[theme]}`}>
            <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
              <span className="font-black flex items-center gap-2"><MessageCircle size={20}/> محادثة عامة</span>
              <button onClick={() => setIsChatOpen(false)} className="bg-white/20 p-1 rounded-lg"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white/5">
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.fromUserId === currentUser.id ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-black opacity-40 px-2 mb-1 uppercase tracking-tighter">{msg.fromUsername}</span>
                  <div className={`p-4 rounded-2xl max-w-[80%] text-sm font-bold ${msg.fromUserId === currentUser.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-inherit rounded-tl-none'}`}>
                    {msg.text}
                    <p className="text-[9px] mt-1 opacity-50 text-right">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-white/5 border-t border-white/5">
              <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                {EMOJIS.map(e => <button key={e} onClick={() => setChatInput(p => p + e)} className="p-1 hover:bg-white/10 rounded text-lg">{e}</button>)}
              </div>
              <div className="flex gap-2">
                <input className="flex-1 bg-white/5 border-none rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-blue-500" placeholder="اكتب..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendChatMessage()}/>
                <button onClick={sendChatMessage} className="bg-blue-600 text-white p-3 rounded-xl"><Send size={20}/></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className={`w-full max-w-lg rounded-[3rem] p-12 shadow-2xl relative border ${cardClasses[theme]}`}>
            <h3 className="text-2xl font-black mb-8">إضافة مصروف جديد</h3>
            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1 block">الفئة</label>
                  {!isAddingCustomCategory ? (
                    <select className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                      {DEFAULT_EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
                    </select>
                  ) : (
                    <input className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold" placeholder="أدخل فئة جديدة" value={tempExpense.name} onChange={e => setTempExpense({...tempExpense, name: e.target.value})} />
                  )}
                </div>
                <button onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)} className="mt-5 bg-white/5 p-4 rounded-2xl opacity-40 hover:opacity-100 transition-opacity">
                  {isAddingCustomCategory ? <ChevronLeft size={24}/> : <Plus size={24}/>}
                </button>
              </div>
              <div>
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1 block text-right">القيمة (ج.م)</label>
                <input type="number" className="w-full bg-white/5 p-5 rounded-2xl border border-white/10 outline-none focus:ring-2 focus:ring-blue-500 text-2xl font-black text-blue-500" value={tempExpense.value} onChange={e => setTempExpense({...tempExpense, value: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1 block">موعد السداد</label>
                <input type="date" className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold" value={tempExpense.date} onChange={e => setTempExpense({...tempExpense, date: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={handleAddExpense} className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black shadow-lg shadow-blue-500/20">تأكيد الإضافة</button>
                <button onClick={() => setIsExpenseModalOpen(false)} className="flex-1 bg-white/10 py-5 rounded-2xl font-black">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commitment Modal */}
      {isCommitmentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className={`w-full max-w-xl rounded-[3rem] p-12 shadow-2xl overflow-y-auto max-h-[90vh] border ${cardClasses[theme]}`}>
            <h3 className="text-2xl font-black mb-8">تفاصيل الالتزام الجديد</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black opacity-40 uppercase">النوع</label>
                <select className="w-full bg-white/5 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold" value={tempCommitment.type} onChange={e => setTempCommitment({...tempCommitment, type: e.target.value})}>
                  {COMMITMENT_TYPES.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black opacity-40 uppercase">إجمالي القيمة</label>
                <input type="number" className="w-full bg-white/5 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-black" value={tempCommitment.totalValue} onChange={e => setTempCommitment({...tempCommitment, totalValue: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black opacity-40 uppercase">الأقساط</label>
                <input type="number" className="w-full bg-white/5 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-black" value={tempCommitment.installmentsCount} onChange={e => setTempCommitment({...tempCommitment, installmentsCount: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black opacity-40 uppercase">تاريخ الاستحقاق</label>
                <input type="date" className="w-full bg-white/5 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-black" value={tempCommitment.date} onChange={e => setTempCommitment({...tempCommitment, date: e.target.value})} />
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={handleAddCommitment} className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black">إضافة</button>
              <button onClick={() => setIsCommitmentModalOpen(false)} className="flex-1 bg-white/10 py-5 rounded-2xl font-black">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* User Creation Modal */}
      {isSettingsUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in">
          <div className={`w-full max-w-md rounded-[3rem] p-12 shadow-2xl border ${cardClasses[theme]}`}>
            <h3 className="text-2xl font-black mb-8">إضافة مستخدم جديد</h3>
            <div className="space-y-6">
              <input className="w-full bg-white/5 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="اسم المستخدم" onChange={e => setEditUserForm({...editUserForm, username: e.target.value})} />
              <input type="password" className="w-full bg-white/5 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" placeholder="كلمة المرور" onChange={e => setEditUserForm({...editUserForm, password: e.target.value})} />
              <div className="flex gap-4">
                <button onClick={() => {
                  if (editUserForm.username && editUserForm.password) {
                    setUsers([...users, { id: Date.now().toString(), username: editUserForm.username, password: editUserForm.password, isAdmin: false }]);
                    setIsSettingsUserModalOpen(false);
                    setEditUserForm({});
                  }
                }} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black">إضافة</button>
                <button onClick={() => setIsSettingsUserModalOpen(false)} className="flex-1 bg-white/10 py-4 rounded-2xl font-black">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
