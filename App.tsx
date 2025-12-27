
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Wallet, Calendar, Clock, Plus, Trash2, Archive, TrendingDown, 
  LayoutDashboard, ShieldCheck, ChevronLeft, Settings, UserPlus, 
  LogOut, CheckCircle2, MessageCircle, Send, X, Edit3, UserCircle,
  Sun, Moon, Laptop, Leaf, Lock, User as UserIcon, Eye, EyeOff,
  Palette, KeyRound, Menu, Users, ShieldAlert, DownloadCloud, UserCheck, Loader2
} from 'lucide-react';
import { 
  Expense, Commitment, MonthlyRecord, AppTab, 
  User, ThemeType, ChatMessage 
} from './types';
import { db, ref, set, onValue, push, remove, update } from './firebase';

const DEFAULT_EXPENSE_CATEGORIES = ['المياه', 'الغاز', 'الكهرباء', 'الانترنت المنزلي', 'الخط الارضي', 'جمعيات', 'اقساط بنك'];
const COMMITMENT_TYPES = ['جمعيات', 'اقساط بنك', 'التزامات اخرى'];
const EMOJIS = ['😊', '💰', '📉', '📊', '✅', '❌', '🏡', '💳', '💡'];

const App: React.FC = () => {
  // --- Auth & Users ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // --- Theme & Layout ---
  const [theme, setTheme] = useState<ThemeType>('modern-light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Financial Data ---
  const [salary, setSalary] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [history, setHistory] = useState<MonthlyRecord[]>([]);

  // --- Chat State ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatRecipient, setChatRecipient] = useState<string>('all'); 
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- UI States ---
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.MONTHLY_EXPENSES);
  const [time, setTime] = useState(new Date());
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
  const [isSettingsUserModalOpen, setIsSettingsUserModalOpen] = useState(false);
  const [isAdminPassModalOpen, setIsAdminPassModalOpen] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [tempExpense, setTempExpense] = useState({ value: '', date: '', name: '' });
  const [tempCommitment, setTempCommitment] = useState({ 
    totalValue: '', installmentsCount: '', paidAmount: '', duration: '', date: '', type: '' 
  });
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '', isAdmin: false });
  const [newPassword, setNewPassword] = useState('');

  // --- Clock ---
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Firebase Sync ---
  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList = Object.values(data) as User[];
        setUsers(usersList);
        
        // Ensure admin account exists if for some reason it's missing from an existing data object
        const hasAdmin = usersList.some(u => u.username === 'admin');
        if (!hasAdmin) {
          const adminId = 'admin_1';
          set(ref(db, `users/${adminId}`), { id: adminId, username: 'admin', password: 'admin', isAdmin: true });
        }
      } else {
        // Initial setup
        const adminId = 'admin_1';
        set(ref(db, `users/${adminId}`), { id: adminId, username: 'admin', password: 'admin', isAdmin: true });
      }
      setIsDataLoaded(true);
    });

    const msgsRef = ref(db, 'messages');
    onValue(msgsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgsList = Object.keys(data).map(key => ({ ...data[key], id: key })) as ChatMessage[];
        setMessages(msgsList.sort((a, b) => a.serverTime - b.serverTime));
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribeUsers();
  }, []);

  useEffect(() => {
    if (currentUser) {
      const userDataRef = ref(db, `data/${currentUser.id}`);
      onValue(userDataRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setSalary(data.salary || 0);
          setExpenses(data.expenses || []);
          setCommitments(data.commitments || []);
          setHistory(data.history || []);
          setTheme(data.theme || 'modern-light');
        }
      });
    }
  }, [currentUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  const syncFinancialData = (updates: any) => {
    if (currentUser) {
      update(ref(db, `data/${currentUser.id}`), updates);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDataLoaded) {
      alert('جاري مزامنة البيانات، يرجى الانتظار ثانية...');
      return;
    }
    const user = users.find(u => u.username.toLowerCase() === loginForm.username.toLowerCase() && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
    } else {
      alert('خطأ في اسم المستخدم أو كلمة المرور');
    }
  };

  const handleAddUser = () => {
    if (!newUserForm.username || !newUserForm.password) return;
    const newUserId = `user_${Date.now()}`;
    set(ref(db, `users/${newUserId}`), {
      id: newUserId,
      username: newUserForm.username,
      password: newUserForm.password,
      isAdmin: newUserForm.isAdmin
    });
    setNewUserForm({ username: '', password: '', isAdmin: false });
    setIsSettingsUserModalOpen(false);
    alert('تم إضافة المستخدم بنجاح');
  };

  const deleteUser = (userId: string, username: string) => {
    if (username === 'admin') {
      alert('لا يمكن حذف حساب المدير الأساسي');
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف المستخدم ${username}؟`)) {
      remove(ref(db, `users/${userId}`));
    }
  };

  const handleArchiveMonth = () => {
    if (expenses.length === 0 && salary === 0) return;
    const confirmArchive = window.confirm('هل أنت متأكد من ترحيل بيانات هذا الشهر للأرشيف؟');
    if (!confirmArchive) return;

    const monthName = new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
    const record: MonthlyRecord = {
      id: Date.now().toString(),
      monthName,
      salary,
      totalExpenses: expenses.filter(e => !e.isPaid).reduce((sum, e) => sum + e.value, 0),
      expenses: [...expenses],
      date: new Date().toISOString(),
      userId: currentUser!.id
    };

    const updatedHistory = [record, ...history];
    setHistory(updatedHistory);
    setExpenses([]);
    syncFinancialData({ history: updatedHistory, expenses: [] });
    alert('تم الترحيل للأرشيف بنجاح');
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !currentUser) return;
    const newMsgRef = push(ref(db, 'messages'));
    set(newMsgRef, {
      fromUserId: currentUser.id,
      fromUsername: currentUser.username,
      toUserId: chatRecipient,
      text: chatInput,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour12: true, hour: '2-digit', minute: '2-digit' }),
      serverTime: Date.now()
    });
    setChatInput('');
  };

  const deleteMessage = (msgId: string) => {
    remove(ref(db, `messages/${msgId}`));
  };

  const handleAddExpense = () => {
    const val = Number(tempExpense.value);
    if (!val || isNaN(val)) {
      alert('الرجاء إدخال مبلغ صحيح');
      return;
    }
    const name = isAddingCustomCategory ? tempExpense.name : selectedCategory;
    if (!name) {
      alert('الرجاء إدخال اسم المصروف');
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      name,
      value: val,
      dueDate: tempExpense.date || new Date().toISOString().split('T')[0],
      category: isAddingCustomCategory ? 'أخرى' : selectedCategory,
      isPaid: false,
      userId: currentUser!.id
    };

    const updated = [...expenses, newExpense];
    setExpenses(updated);
    syncFinancialData({ expenses: updated });
    setIsExpenseModalOpen(false);
    setTempExpense({ value: '', date: '', name: '' });
    setIsAddingCustomCategory(false);
  };

  const totalExpensesVal = expenses.filter(e => !e.isPaid).reduce((sum, e) => sum + e.value, 0);
  const balance = salary - totalExpensesVal;
  const filteredMessages = messages.filter(msg => {
    if (chatRecipient === 'all') return msg.toUserId === 'all';
    return (msg.fromUserId === currentUser?.id && msg.toUserId === chatRecipient) ||
           (msg.fromUserId === chatRecipient && msg.toUserId === currentUser?.id);
  });

  const themeClasses = {
    'modern-light': "bg-slate-50 text-slate-900",
    'dark-classic': "bg-black text-white",
    'deep-ocean': "bg-[#0f172a] text-blue-50",
    'royal-gold': "bg-[#1c1917] text-[#fef3c7]"
  };
  const cardClasses = {
    'modern-light': "bg-white border-slate-100",
    'dark-classic': "bg-[#0a0a0a] border-[#222]",
    'deep-ocean': "bg-[#1e293b] border-[#334155]",
    'royal-gold': "bg-[#292524] border-[#44403c]"
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-['Cairo']">
        <div className="bg-white w-full max-w-[440px] rounded-[2.5rem] p-10 text-center shadow-2xl animate-in zoom-in-95">
          <div className="inline-flex bg-blue-600 w-20 h-20 rounded-3xl items-center justify-center mb-8 shadow-xl">
            <Wallet className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Smart Prise</h1>
          <p className="text-slate-500 mb-6 text-sm">أهلاً بك في نظام الإدارة المالية الذكي</p>
          
          {!isDataLoaded && (
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-4 animate-pulse">
              <Loader2 className="animate-spin" size={18} />
              <span className="text-xs font-bold">جاري تحضير النظام...</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-right">
            <div>
              <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">اسم المستخدم</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required placeholder="admin" disabled={!isDataLoaded} />
            </div>
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest">كلمة المرور</label>
              <input type={showPassword ? "text" : "password"} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required placeholder="admin" disabled={!isDataLoaded} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-[38px] left-4 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <button className={`w-full text-white font-black py-5 rounded-2xl transition-all shadow-lg active:scale-95 mt-4 ${isDataLoaded ? 'bg-slate-900 hover:bg-blue-600' : 'bg-slate-300 cursor-not-allowed'}`} disabled={!isDataLoaded}>
              دخول للنظام
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 font-['Cairo'] ${themeClasses[theme]}`}>
      
      {/* Sidebar - LEFT */}
      <aside className={`w-72 flex-col shadow-xl z-20 border-l border-white/5 bg-slate-900 text-white hidden lg:flex`}>
        <div className="p-8 bg-blue-600 flex items-center gap-3">
          <Wallet size={24} />
          <h1 className="text-xl font-black">Smart Prise</h1>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: AppTab.MONTHLY_EXPENSES, icon: LayoutDashboard, label: 'المصروفات' },
            { id: AppTab.COMMITMENTS, icon: ShieldCheck, label: 'الالتزامات' },
            { id: AppTab.PREVIOUS_MONTHS, icon: Archive, label: 'الأرشيف' },
            { id: AppTab.SETTINGS, icon: Settings, label: 'لوحة التحكم' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-blue-600 shadow-lg' : 'hover:bg-white/5 opacity-60'}`}>
              <tab.icon size={20} />
              <span className="font-bold">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-white/5 space-y-4">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2 text-blue-400 font-bold"><Calendar size={16}/> {time.toLocaleDateString('ar-EG', { weekday: 'long' })}</div>
             <div className="text-xs opacity-50">{time.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <div className="text-3xl font-black text-white" dir="ltr">{time.toLocaleTimeString('ar-EG', { hour12: true, hour: '2-digit', minute: '2-digit' })}</div>
          <button onClick={() => setCurrentUser(null)} className="text-red-400 font-bold flex items-center gap-2 pt-4 border-t border-white/5 hover:text-red-300 transition-colors w-full"><LogOut size={16}/> تسجيل الخروج</button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className={`p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 ${cardClasses[theme]}`}>
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-white/5 rounded-xl"><Menu size={24}/></button>
             <div>
                <span className="text-[10px] font-black opacity-40 uppercase block mb-1">الراتب الشهري</span>
                <div className="flex items-center gap-2">
                  <input type="number" value={salary} onChange={e => { const val = Number(e.target.value); setSalary(val); syncFinancialData({ salary: val }); }} className="text-3xl font-black bg-transparent border-none outline-none focus:text-blue-500 w-32" />
                  <span className="font-bold opacity-30">ج.م</span>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-12 w-full md:w-auto justify-between md:justify-end">
            <div className="text-center">
              <p className="text-[10px] font-black opacity-40 mb-1">المصروفات</p>
              <p className="text-xl font-bold text-red-500">{totalExpensesVal.toLocaleString()} ج.م</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black opacity-40 mb-1">المتبقي</p>
              <p className={`text-3xl font-black ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{balance.toLocaleString()}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-32">
          {activeTab === AppTab.MONTHLY_EXPENSES && (
            <div className="animate-in slide-in-from-bottom-5 duration-500">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black">قائمة المصروفات</h2>
                 <button onClick={() => setIsExpenseModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-lg"><Plus size={20}/> أضف مصروف</button>
              </div>
              <div className="grid gap-4">
                {expenses.length === 0 ? (
                  <div className="py-20 text-center opacity-20 border-2 border-dashed border-white/10 rounded-3xl"><TrendingDown size={64} className="mx-auto mb-4" /><p className="font-bold">لا توجد مصروفات مسجلة لهذا الشهر</p></div>
                ) : (
                  expenses.map(exp => (
                    <div key={exp.id} className={`p-6 rounded-[1.5rem] border border-r-8 ${exp.isPaid ? 'border-r-slate-400 opacity-50' : 'border-r-blue-500'} flex items-center justify-between transition-all ${cardClasses[theme]}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${exp.isPaid ? 'bg-slate-500/10' : 'bg-blue-500/10 text-blue-500'}`}><TrendingDown size={24}/></div>
                        <div>
                          <h4 className="font-black text-lg">{exp.name}</h4>
                          <p className="text-xs opacity-50">{exp.dueDate} | {exp.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-xl font-black">{exp.value.toLocaleString()} ج.م</span>
                        <div className="flex gap-2">
                           <button onClick={() => {
                             const updated = expenses.map(e => e.id === exp.id ? {...e, isPaid: !e.isPaid} : e);
                             setExpenses(updated);
                             syncFinancialData({ expenses: updated });
                           }} className={`p-2 rounded-lg transition-colors ${exp.isPaid ? 'text-blue-400' : 'text-green-500 hover:bg-green-500/10'}`}><CheckCircle2 size={24}/></button>
                           <button onClick={() => {
                             const updated = expenses.filter(e => e.id !== exp.id);
                             setExpenses(updated);
                             syncFinancialData({ updatedExpenses: updated }); // Fixed parameter name to match state if needed, but local updated is better
                             syncFinancialData({ expenses: updated });
                           }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={24}/></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {expenses.length > 0 && (
                <div className="mt-12 flex justify-center">
                   <button onClick={handleArchiveMonth} className="bg-slate-800 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 hover:bg-slate-700 shadow-2xl transition-all active:scale-95">
                     <DownloadCloud size={24}/> ترحيل الشهر الحالي للأرشيف
                   </button>
                </div>
              )}
            </div>
          )}

          {activeTab === AppTab.COMMITMENTS && (
            <div className="animate-in slide-in-from-bottom-5 duration-500">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black">الالتزامات والأقساط</h2>
                 <button onClick={() => setIsCommitmentModalOpen(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg"><Plus size={20}/> أضف التزام</button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {commitments.map(com => (
                  <div key={com.id} className={`p-8 rounded-[2rem] border relative overflow-hidden flex flex-col justify-between h-full ${cardClasses[theme]}`}>
                    <div>
                      <div className="flex justify-between mb-4">
                        <ShieldCheck className="text-emerald-500" size={32}/>
                        <button onClick={() => {
                          const updated = commitments.filter(c => c.id !== com.id);
                          setCommitments(updated);
                          syncFinancialData({ commitments: updated });
                        }} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 size={18}/></button>
                      </div>
                      <h4 className="text-xl font-black mb-1">{com.type}</h4>
                      <p className="text-sm opacity-50 mb-6">المبلغ الإجمالي: {com.totalValue.toLocaleString()} ج.م</p>
                    </div>
                    <div>
                       <div className="flex justify-between text-xs font-bold mb-2">
                          <span>المدفوع: {com.paidAmount.toLocaleString()}</span>
                          <span className="text-emerald-500 font-black">المتبقي: {com.remainingAmount.toLocaleString()}</span>
                       </div>
                       <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden mb-4">
                          <div className="bg-emerald-500 h-full transition-all duration-1000" style={{width: `${(com.paidAmount/com.totalValue)*100}%`}}></div>
                       </div>
                       <button onClick={() => {
                          const installment = com.totalValue / com.installmentsCount;
                          const newPaid = Math.min(com.paidAmount + installment, com.totalValue);
                          const updated = commitments.map(c => c.id === com.id ? {...c, paidAmount: newPaid, remainingAmount: c.totalValue - newPaid, isCompleted: newPaid >= c.totalValue} : c);
                          setCommitments(updated);
                          syncFinancialData({ commitments: updated });
                       }} disabled={com.isCompleted} className={`w-full py-4 rounded-xl font-black transition-all ${com.isCompleted ? 'bg-slate-500/20 text-slate-500' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg active:scale-95'}`}>
                          {com.isCompleted ? 'تم السداد بالكامل ✓' : 'دفع قسط جديد'}
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === AppTab.SETTINGS && (
            <div className="animate-in slide-in-from-bottom-5 duration-500">
               <div className="flex justify-between items-center mb-10">
                  <h2 className="text-2xl font-black">إدارة النظام والحسابات</h2>
                  {currentUser.isAdmin && (
                    <button onClick={() => setIsSettingsUserModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg active:scale-95 transition-all"><UserPlus size={20}/> إضافة مستخدم</button>
                  )}
               </div>
               
               <div className="grid md:grid-cols-2 gap-8">
                  {/* Appearance */}
                  <div className={`p-8 rounded-[2rem] border ${cardClasses[theme]}`}>
                    <h3 className="font-black text-xl mb-6 flex items-center gap-2 text-blue-500"><Palette size={24}/> مظهر البرنامج</h3>
                    <div className="grid grid-cols-2 gap-3">
                       {['modern-light', 'dark-classic', 'deep-ocean', 'royal-gold'].map(t => (
                         <button key={t} onClick={() => { setTheme(t as ThemeType); syncFinancialData({ theme: t }); }} className={`p-5 rounded-2xl border-2 transition-all font-bold text-xs uppercase tracking-widest ${theme === t ? 'border-blue-500 bg-blue-500/10 text-blue-500' : 'border-white/5 opacity-50 hover:opacity-100'}`}>{t.replace('-', ' ')}</button>
                       ))}
                    </div>
                  </div>

                  {/* Active Users */}
                  <div className={`p-8 rounded-[2rem] border ${cardClasses[theme]}`}>
                    <h3 className="font-black text-xl mb-6 flex items-center gap-2 text-blue-500"><Users size={24}/> الحسابات النشطة ({users.length})</h3>
                    <div className="space-y-4">
                       {users.map(u => (
                         <div key={u.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3">
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${u.isAdmin ? 'bg-blue-600' : 'bg-slate-600'}`}>
                                 {u.username.charAt(0).toUpperCase()}
                               </div>
                               <div>
                                 <p className="font-black">{u.username}</p>
                                 <p className="text-[10px] opacity-40 uppercase font-black tracking-widest">{u.isAdmin ? 'مدير النظام' : 'مستخدم عادي'}</p>
                               </div>
                            </div>
                            <div className="flex gap-2">
                               {currentUser.isAdmin && u.username === 'admin' && (
                                 <button onClick={() => setIsAdminPassModalOpen(true)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"><Edit3 size={18}/></button>
                               )}
                               {currentUser.isAdmin && u.username !== 'admin' && (
                                 <button onClick={() => deleteUser(u.id, u.username)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18}/></button>
                               )}
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
            </div>
          )}
          
          {activeTab === AppTab.PREVIOUS_MONTHS && (
             <div className="animate-in slide-in-from-bottom-5 duration-500">
                <h2 className="text-2xl font-black mb-8">الأرشيف الشهري</h2>
                {history.length === 0 ? (
                  <div className="py-24 text-center opacity-20 border-2 border-dashed border-white/10 rounded-3xl"><Archive size={64} className="mx-auto mb-4"/><p className="font-bold text-xl">الأرشيف فارغ حالياً</p></div>
                ) : (
                  <div className="space-y-6">
                    {history.map(record => (
                      <div key={record.id} className={`rounded-[2rem] border overflow-hidden ${cardClasses[theme]}`}>
                         <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
                            <h4 className="font-black text-lg">{record.monthName}</h4>
                            <span className="font-bold text-sm bg-white/20 px-4 py-2 rounded-xl">المتبقي: {(record.salary - record.totalExpenses).toLocaleString()} ج.م</span>
                         </div>
                         <div className="p-8 grid md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                               {record.expenses.map(e => (
                                 <div key={e.id} className="flex justify-between text-xs py-2 border-b border-white/5 font-bold">
                                    <span>{e.name}</span>
                                    <span className="opacity-50">{e.value.toLocaleString()} ج.م</span>
                                 </div>
                               ))}
                            </div>
                            <div className="flex flex-col justify-center bg-white/5 p-6 rounded-2xl text-center">
                               <p className="text-sm opacity-50 mb-1">إجمالي المصروفات</p>
                               <p className="text-4xl font-black text-red-500 mb-2">{record.totalExpenses.toLocaleString()}</p>
                               <p className="text-[10px] opacity-40 font-black uppercase">من راتب {record.salary.toLocaleString()}</p>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          )}
        </div>

        {/* Chat Component */}
        <div className="fixed bottom-8 left-8 z-[100]">
          {!isChatOpen ? (
            <button onClick={() => setIsChatOpen(true)} className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-bounce">
              <MessageCircle size={32} />
            </button>
          ) : (
            <div className={`w-[calc(100vw-2rem)] sm:w-96 h-[550px] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border animate-in slide-in-from-bottom-10 ${cardClasses[theme]}`}>
              <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3 font-black">
                   <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Users size={20}/></div>
                   <div>
                      <p className="text-sm">{chatRecipient === 'all' ? 'المحادثة العامة' : `خاص مع ${users.find(u => u.id === chatRecipient)?.username}`}</p>
                      <p className="text-[9px] opacity-60 uppercase tracking-widest">{chatRecipient === 'all' ? 'الجميع يشارك' : 'محادثة مشفرة'}</p>
                   </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all"><X size={18}/></button>
              </div>

              <div className="p-3 bg-white/5 border-b border-white/5 flex gap-2 overflow-x-auto scrollbar-hide">
                <button onClick={() => setChatRecipient('all')} className={`px-4 py-2 rounded-full text-[10px] font-black transition-all whitespace-nowrap ${chatRecipient === 'all' ? 'bg-blue-600 text-white' : 'bg-white/10 opacity-50'}`}>الكل</button>
                {users.filter(u => u.id !== currentUser.id).map(u => (
                  <button key={u.id} onClick={() => setChatRecipient(u.id)} className={`px-4 py-2 rounded-full text-[10px] font-black transition-all whitespace-nowrap ${chatRecipient === u.id ? 'bg-blue-600 text-white' : 'bg-white/10 opacity-50'}`}>{u.username}</button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white/5">
                {filteredMessages.map(msg => (
                  <div key={msg.id} className={`flex flex-col group ${msg.fromUserId === currentUser.id ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 px-2">
                      <span className="text-[9px] font-black opacity-30">{msg.fromUsername}</span>
                      {msg.fromUserId === currentUser.id && (
                        <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-all"><Trash2 size={10}/></button>
                      )}
                    </div>
                    <div className={`p-4 rounded-2xl max-w-[85%] text-[13px] font-bold shadow-sm leading-relaxed ${msg.fromUserId === currentUser.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-inherit rounded-tl-none'}`}>
                      {msg.text}
                      <p className="text-[8px] mt-2 opacity-40 text-left border-t border-white/10 pt-1 uppercase" dir="ltr">{msg.timestamp}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 bg-white/5 border-t border-white/5">
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                  {EMOJIS.map(e => <button key={e} onClick={() => setChatInput(p => p + e)} className="p-2 hover:bg-white/10 rounded-lg text-xl active:scale-125 transition-all">{e}</button>)}
                </div>
                <div className="flex gap-2">
                  <input className="flex-1 bg-white/5 border-none rounded-xl p-4 text-sm outline-none focus:ring-1 focus:ring-blue-500 font-bold" placeholder="أكتب رسالتك..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendChatMessage()}/>
                  <button onClick={sendChatMessage} className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg"><Send size={20}/></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* New User Modal */}
      {isSettingsUserModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
           <div className={`w-full max-md rounded-[2.5rem] p-10 border shadow-2xl ${cardClasses[theme]}`}>
              <h3 className="text-2xl font-black mb-8 flex items-center gap-2 text-blue-500"><UserPlus/> مستخدم جديد</h3>
              <div className="space-y-4">
                 <input className="w-full bg-white/5 p-4 rounded-xl border border-white/10 font-bold outline-none focus:ring-1" placeholder="اسم المستخدم" value={newUserForm.username} onChange={e => setNewUserForm({...newUserForm, username: e.target.value})} />
                 <input type="password" className="w-full bg-white/5 p-4 rounded-xl border border-white/10 font-bold outline-none focus:ring-1" placeholder="كلمة المرور" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})} />
                 <label className="flex items-center gap-3 p-2 font-bold cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
                   <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={newUserForm.isAdmin} onChange={e => setNewUserForm({...newUserForm, isAdmin: e.target.checked})} />
                   صلاحيات مدير (Admin)
                 </label>
                 <div className="flex gap-3 pt-4">
                    <button onClick={handleAddUser} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">إضافة</button>
                    <button onClick={() => setIsSettingsUserModalOpen(false)} className="flex-1 bg-white/10 py-4 rounded-2xl font-black">إلغاء</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Admin Pass Change Modal */}
      {isAdminPassModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4">
           <div className={`w-full max-w-md rounded-[2.5rem] p-10 border shadow-2xl ${cardClasses[theme]}`}>
              <h3 className="text-xl font-black mb-6 flex items-center gap-2"><KeyRound className="text-blue-500"/> تعديل كلمة سر المدير</h3>
              <div className="space-y-4">
                 <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="كلمة المرور الجديدة لـ admin" className="w-full bg-white/5 p-4 rounded-xl border border-white/10 font-bold outline-none focus:ring-1" />
                 <div className="flex gap-3 pt-4">
                    <button onClick={() => {
                       const admin = users.find(u => u.username === 'admin');
                       if (admin) {
                          update(ref(db, `users/${admin.id}`), { password: newPassword });
                          setNewPassword('');
                          setIsAdminPassModalOpen(false);
                          alert('تم تغيير كلمة سر الأدمن بنجاح');
                       }
                    }} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">حفظ</button>
                    <button onClick={() => setIsAdminPassModalOpen(false)} className="flex-1 bg-white/10 py-4 rounded-2xl font-black">إلغاء</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Financial Modals (Standardized) */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-[2.5rem] p-10 border shadow-2xl ${cardClasses[theme]}`}>
            <h3 className="text-2xl font-black mb-8 text-blue-500 flex items-center gap-2"><TrendingDown/> إضافة مصروف</h3>
            <div className="space-y-5">
              <div className="flex gap-2">
                <select className="flex-1 bg-white/5 p-4 rounded-xl border border-white/10 font-bold outline-none" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  {DEFAULT_EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                </select>
                <button onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)} className="bg-blue-600/10 text-blue-500 p-4 rounded-xl"><Plus/></button>
              </div>
              {isAddingCustomCategory && <input placeholder="اسم المصروف" className="w-full bg-white/5 p-4 rounded-xl border border-white/10 font-bold" value={tempExpense.name} onChange={e => setTempExpense({...tempExpense, name: e.target.value})} />}
              <input type="number" placeholder="0.00 ج.م" className="w-full bg-white/5 p-5 rounded-xl border border-white/10 font-black text-3xl text-blue-500" value={tempExpense.value} onChange={e => setTempExpense({...tempExpense, value: e.target.value})} />
              <input type="date" className="w-full bg-white/5 p-4 rounded-xl border border-white/10 font-bold" value={tempExpense.date} onChange={e => setTempExpense({...tempExpense, date: e.target.value})} />
              <div className="flex gap-3 pt-6">
                <button onClick={handleAddExpense} className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black shadow-lg">تأكيد</button>
                <button onClick={() => setIsExpenseModalOpen(false)} className="flex-1 bg-white/10 py-5 rounded-2xl font-black">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCommitmentModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-[2.5rem] p-10 border shadow-2xl ${cardClasses[theme]}`}>
            <h3 className="text-2xl font-black mb-8 text-emerald-500 flex items-center gap-2"><ShieldCheck/> إضافة التزام</h3>
            <div className="space-y-4">
              <select className="w-full bg-white/5 p-4 rounded-xl border border-white/10 font-bold" value={tempCommitment.type} onChange={e => setTempCommitment({...tempCommitment, type: e.target.value})}>
                {COMMITMENT_TYPES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
              </select>
              <input type="number" placeholder="القيمة الإجمالية" className="w-full bg-white/5 p-4 rounded-xl border border-white/10 font-black text-xl" value={tempCommitment.totalValue} onChange={e => setTempCommitment({...tempCommitment, totalValue: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                 <input type="number" placeholder="عدد الأقساط" className="w-full bg-white/5 p-4 rounded-xl border border-white/10 font-bold" value={tempCommitment.installmentsCount} onChange={e => setTempCommitment({...tempCommitment, installmentsCount: e.target.value})} />
                 <input placeholder="المدة (شهور)" className="w-full bg-white/5 p-4 rounded-xl border border-white/10 font-bold" value={tempCommitment.duration} onChange={e => setTempCommitment({...tempCommitment, duration: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-6">
                <button onClick={() => {
                   const total = Number(tempCommitment.totalValue);
                   const newCom = { id: Date.now().toString(), type: tempCommitment.type || COMMITMENT_TYPES[0], totalValue: total, installmentsCount: Number(tempCommitment.installmentsCount), paidAmount: 0, remainingAmount: total, duration: tempCommitment.duration, date: new Date().toISOString().split('T')[0], userId: currentUser.id, isCompleted: false };
                   const updated = [...commitments, newCom];
                   setCommitments(updated);
                   syncFinancialData({ commitments: updated });
                   setIsCommitmentModalOpen(false);
                }} className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-lg">حفظ</button>
                <button onClick={() => setIsCommitmentModalOpen(false)} className="flex-1 bg-white/10 py-5 rounded-2xl font-black">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
