
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Wallet, Calendar, Clock, Plus, Trash2, Archive, TrendingDown, 
  LayoutDashboard, ShieldCheck, ChevronLeft, Settings, UserPlus, 
  LogOut, CheckCircle2, MessageCircle, Send, X, Edit3, UserCircle,
  Sun, Moon, Laptop, Leaf, Lock, User as UserIcon, Eye, EyeOff,
  Palette, KeyRound, Menu, Users, ShieldAlert
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
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // --- Theme & Layout ---
  const [theme, setTheme] = useState<ThemeType>('modern-light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Financial Data (Synced with Firebase) ---
  const [salary, setSalary] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [history, setHistory] = useState<MonthlyRecord[]>([]);

  // --- Chat State ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatRecipient, setChatRecipient] = useState<string>('all'); // 'all' or userId
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Modals ---
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.MONTHLY_EXPENSES);
  const [time, setTime] = useState(new Date());
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
  const [isSettingsUserModalOpen, setIsSettingsUserModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [tempExpense, setTempExpense] = useState({ value: '', date: '', name: '' });
  const [tempCommitment, setTempCommitment] = useState({ 
    totalValue: '', installmentsCount: '', paidAmount: '', duration: '', date: '', type: '' 
  });
  const [editUserForm, setEditUserForm] = useState<Partial<User>>({});
  const [newPassword, setNewPassword] = useState('');

  // --- Clock ---
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Firebase: Global Sync (Users & Messages) ---
  useEffect(() => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList = Object.values(data) as User[];
        setUsers(usersList);
      } else {
        // Create initial admin if no users exist
        const initialAdmin = { id: 'admin_1', username: 'admin', password: 'admin', isAdmin: true };
        set(ref(db, 'users/admin_1'), initialAdmin);
      }
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
  }, []);

  // --- Firebase: User Data Sync ---
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

  // --- Auto-scroll Chat ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  // --- Sync Handlers ---
  const syncFinancialData = (updates: any) => {
    if (currentUser) {
      update(ref(db, `data/${currentUser.id}`), updates);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
    } else {
      alert('خطأ في اسم المستخدم أو كلمة المرور');
    }
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
    const newExpenses = [...expenses, newExp];
    setExpenses(newExpenses);
    syncFinancialData({ expenses: newExpenses });
    setIsExpenseModalOpen(false);
    setTempExpense({ value: '', date: '', name: '' });
  };

  const deleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    syncFinancialData({ expenses: updated });
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
    const updated = [...commitments, newCom];
    setCommitments(updated);
    syncFinancialData({ commitments: updated });
    setIsCommitmentModalOpen(false);
    setTempCommitment({ totalValue: '', installmentsCount: '', paidAmount: '', duration: '', date: '', type: '' });
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !currentUser) return;
    const newMsgRef = push(ref(db, 'messages'));
    const newMsg: Partial<ChatMessage> = {
      fromUserId: currentUser.id,
      fromUsername: currentUser.username,
      toUserId: chatRecipient,
      text: chatInput,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      serverTime: Date.now()
    };
    set(newMsgRef, newMsg);
    setChatInput('');
  };

  const deleteMessage = (msgId: string) => {
    remove(ref(db, `messages/${msgId}`));
  };

  // --- Themes & Helpers ---
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

  const filteredMessages = messages.filter(msg => {
    if (chatRecipient === 'all') return msg.toUserId === 'all';
    // If specific recipient, show only private messages between current user and that recipient
    return (msg.fromUserId === currentUser?.id && msg.toUserId === chatRecipient) ||
           (msg.fromUserId === chatRecipient && msg.toUserId === currentUser?.id);
  });

  const userExpensesCount = expenses.filter(e => !e.isPaid).length;
  const totalExpensesVal = expenses.filter(e => !e.isPaid).reduce((sum, e) => sum + e.value, 0);
  const balance = salary - totalExpensesVal;
  const totalCommitmentRemaining = commitments.reduce((sum, c) => sum + c.remainingAmount, 0);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-['Cairo'] relative overflow-hidden">
        <div className="bg-white/95 backdrop-blur-xl w-full max-w-[480px] rounded-[2rem] md:rounded-[3rem] shadow-2xl p-8 md:p-14 text-center z-10 border border-white/20 animate-in fade-in zoom-in-95 duration-700">
          <div className="inline-flex bg-gradient-to-tr from-blue-600 to-blue-400 w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] items-center justify-center mb-6 md:mb-10 shadow-2xl">
            <Wallet className="text-white" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Smart Prise</h1>
          <p className="text-slate-500 mb-10">سجل دخولك لإدارة ميزانيتك السحابية</p>
          <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
            <div className="text-right space-y-2">
              <label className="text-[11px] font-black text-slate-400 pr-4 uppercase tracking-widest">اسم المستخدم</label>
              <div className="relative">
                <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-6 pr-14 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required placeholder="أدخل اسم المستخدم" />
                <UserIcon className="absolute top-1/2 right-5 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>
            <div className="text-right space-y-2">
              <label className="text-[11px] font-black text-slate-400 pr-4 uppercase tracking-widest">كلمة المرور</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-6 pr-14 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required placeholder="••••••••" />
                <Lock className="absolute top-1/2 right-5 -translate-y-1/2 text-slate-400" size={18} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 left-5 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <button className="w-full bg-slate-900 text-white font-black py-5 rounded-xl hover:bg-blue-600 transition-all shadow-xl">دخول للنظام</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 font-['Cairo'] ${themeClasses[theme]}`}>
      
      {/* Sidebar Content */}
      <aside className={`hidden lg:flex lg:w-72 flex-col shadow-xl z-20 transition-colors duration-300 ${sidebarClasses[theme]}`}>
        <div className="p-8 bg-blue-600 text-white flex items-center gap-3">
          <Wallet size={24} />
          <h1 className="text-xl font-black">Smart Prise</h1>
        </div>
        <nav className="flex-1 p-6 space-y-3">
          {[
            { id: AppTab.MONTHLY_EXPENSES, icon: LayoutDashboard, label: 'المصروفات' },
            { id: AppTab.COMMITMENTS, icon: ShieldCheck, label: 'الالتزامات' },
            { id: AppTab.PREVIOUS_MONTHS, icon: Archive, label: 'الأرشيف' },
            { id: AppTab.SETTINGS, icon: Settings, label: 'الإعدادات' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
              <tab.icon size={20} />
              <span className="font-bold">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 text-slate-500 text-sm"><Calendar size={16}/> {time.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}</div>
          <div className="text-2xl font-black text-blue-600" dir="ltr">{time.toLocaleTimeString('ar-EG', { hour12: true, hour: '2-digit', minute: '2-digit' })}</div>
          <button onClick={() => setCurrentUser(null)} className="text-red-400 font-bold flex items-center gap-2 pt-4 border-t border-white/5"><LogOut size={16}/> خروج</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className={`p-6 md:p-8 flex items-center justify-between shadow-sm ${sidebarClasses[theme]}`}>
          <div className="flex flex-col">
            <span className="text-xs font-black opacity-40 uppercase">الراتب الحالي</span>
            <div className="flex items-center gap-2">
              <input type="number" value={salary} onChange={e => {
                const val = Number(e.target.value);
                setSalary(val);
                syncFinancialData({ salary: val });
              }} className="text-3xl font-black bg-transparent w-32 outline-none focus:text-blue-500 transition-colors" />
              <span className="font-bold opacity-50">ج.م</span>
            </div>
          </div>
          <div className="flex gap-4 md:gap-12">
            <div className="text-center">
              <p className="text-[10px] font-black opacity-40 mb-1">المصروفات</p>
              <p className="text-xl font-bold text-red-500">{totalExpensesVal.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black opacity-40 mb-1">المتبقي</p>
              <p className={`text-3xl font-black ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{balance.toLocaleString()}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {activeTab === AppTab.MONTHLY_EXPENSES && (
            <div className="animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl md:text-3xl font-black">المصروفات النشطة ({userExpensesCount})</h2>
                <button onClick={() => setIsExpenseModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Plus size={20}/> أضف مصروف</button>
              </div>
              <div className="grid gap-4">
                {expenses.filter(e => !e.isPaid).map(exp => (
                  <div key={exp.id} className={`p-6 rounded-3xl border border-r-8 border-r-blue-500 flex items-center justify-between ${cardClasses[theme]}`}>
                    <div className="flex items-center gap-4">
                      <TrendingDown className="opacity-20" size={32}/>
                      <div>
                        <h4 className="font-black text-lg">{exp.name}</h4>
                        <p className="text-xs opacity-50">{exp.category} | {exp.dueDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-xl font-black">{exp.value.toLocaleString()} ج.م</span>
                      <button onClick={() => deleteExpense(exp.id)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={24}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === AppTab.COMMITMENTS && (
            <div className="animate-in fade-in duration-500">
               <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl md:text-3xl font-black">الالتزامات</h2>
                <button onClick={() => setIsCommitmentModalOpen(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Plus size={20}/> أضف التزام</button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {commitments.map(com => (
                  <div key={com.id} className={`p-8 rounded-[2rem] border relative overflow-hidden ${cardClasses[theme]}`}>
                    <div className="flex justify-between items-start mb-6">
                      <ShieldCheck className="text-emerald-500" size={32}/>
                      <button onClick={() => {
                        const updated = commitments.filter(c => c.id !== com.id);
                        setCommitments(updated);
                        syncFinancialData({ commitments: updated });
                      }} className="text-red-400 p-2"><Trash2 size={18}/></button>
                    </div>
                    <h4 className="text-xl font-black mb-1">{com.type}</h4>
                    <p className="text-sm opacity-50 mb-6">{com.duration} | المتبقي: {com.remainingAmount.toLocaleString()}</p>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all" style={{width: `${(com.paidAmount/com.totalValue)*100}%`}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === AppTab.SETTINGS && (
            <div className="animate-in fade-in duration-500">
               <h2 className="text-3xl font-black mb-10">الإعدادات</h2>
               <div className="grid md:grid-cols-2 gap-8">
                 <div className={`p-8 rounded-[2rem] border ${cardClasses[theme]}`}>
                   <h3 className="font-black text-xl mb-6 flex items-center gap-2"><Palette size={20}/> مظهر البرنامج</h3>
                   <div className="grid grid-cols-2 gap-3">
                    {['modern-light', 'dark-classic', 'deep-ocean', 'royal-gold'].map(t => (
                      <button key={t} onClick={() => {
                        setTheme(t as ThemeType);
                        syncFinancialData({ theme: t });
                      }} className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm ${theme === t ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 hover:bg-white/5'}`}>{t}</button>
                    ))}
                   </div>
                 </div>
                 <div className={`p-8 rounded-[2rem] border ${cardClasses[theme]}`}>
                   <h3 className="font-black text-xl mb-6 flex items-center gap-2"><KeyRound size={20}/> الأمان</h3>
                   <div className="space-y-4">
                     <div className="text-sm opacity-60">اسم المستخدم: {currentUser.username}</div>
                     <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="كلمة مرور جديدة" className="w-full bg-white/5 p-4 rounded-xl border border-white/5 outline-none focus:ring-1 focus:ring-blue-500" />
                     <button onClick={() => {
                        if (!newPassword) return;
                        update(ref(db, `users/${currentUser.id}`), { password: newPassword });
                        setNewPassword('');
                        alert('تم التحديث بنجاح');
                     }} className="bg-blue-600 text-white w-full py-3 rounded-xl font-bold">تغيير كلمة المرور</button>
                   </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Advanced Chat */}
      <div className="fixed bottom-8 left-8 z-[100]">
        {!isChatOpen ? (
          <button onClick={() => setIsChatOpen(true)} className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
            <MessageCircle size={32} />
          </button>
        ) : (
          <div className={`w-[calc(100vw-2rem)] sm:w-96 h-[550px] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border animate-in slide-in-from-bottom-5 ${cardClasses[theme]}`}>
            <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2 font-black">
                <MessageCircle size={20}/>
                <span>{chatRecipient === 'all' ? 'المحادثة العامة' : `خاص مع ${users.find(u => u.id === chatRecipient)?.username || 'مستخدم'}`}</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="bg-white/20 p-1 rounded-lg"><X size={18}/></button>
            </div>

            {/* Recipient Selection Bar */}
            <div className="p-3 bg-white/5 border-b border-white/5 flex gap-2 overflow-x-auto scrollbar-hide">
              <button onClick={() => setChatRecipient('all')} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all ${chatRecipient === 'all' ? 'bg-blue-600 text-white' : 'bg-white/10 opacity-50'}`}>الكل</button>
              {users.filter(u => u.id !== currentUser.id).map(u => (
                <button key={u.id} onClick={() => setChatRecipient(u.id)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase whitespace-nowrap transition-all ${chatRecipient === u.id ? 'bg-blue-600 text-white' : 'bg-white/10 opacity-50'}`}>{u.username}</button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white/5">
              {filteredMessages.map(msg => (
                <div key={msg.id} className={`flex flex-col group ${msg.fromUserId === currentUser.id ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1 px-2">
                    <span className="text-[9px] font-black opacity-30 uppercase">{msg.fromUsername}</span>
                    {msg.fromUserId === currentUser.id && (
                      <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-40 hover:!opacity-100 text-red-500 transition-opacity"><Trash2 size={10}/></button>
                    )}
                  </div>
                  <div className={`p-4 rounded-2xl max-w-[85%] text-[13px] font-bold shadow-sm ${msg.fromUserId === currentUser.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-inherit rounded-tl-none'}`}>
                    {msg.text}
                    <p className="text-[8px] mt-1 opacity-40 text-left">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white/5 border-t border-white/5">
               <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                {EMOJIS.map(e => <button key={e} onClick={() => setChatInput(p => p + e)} className="p-1 hover:bg-white/10 rounded text-lg">{e}</button>)}
              </div>
              <div className="flex gap-2">
                <input className="flex-1 bg-white/5 border-none rounded-xl p-3 text-sm outline-none focus:ring-1 focus:ring-blue-500" placeholder="اكتب رسالة..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}/>
                <button onClick={sendChatMessage} className="bg-blue-600 text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-all"><Send size={20}/></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expense Modal (Simplified for sync) */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-[2.5rem] p-8 md:p-12 border ${cardClasses[theme]}`}>
            <h3 className="text-2xl font-black mb-8">إضافة مصروف</h3>
            <div className="space-y-6">
              <div className="flex gap-3">
                <select className="flex-1 bg-white/5 p-4 rounded-xl border border-white/10 outline-none font-bold text-sm" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  {DEFAULT_EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                </select>
                <button onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)} className="bg-white/10 p-4 rounded-xl"><Plus size={20}/></button>
              </div>
              {isAddingCustomCategory && <input placeholder="اسم المصروف المخصص" className="w-full bg-white/5 p-4 rounded-xl border border-white/10 outline-none font-bold" value={tempExpense.name} onChange={e => setTempExpense({...tempExpense, name: e.target.value})} />}
              <input type="number" placeholder="القيمة" className="w-full bg-white/5 p-4 rounded-xl border border-white/10 outline-none font-black text-2xl text-blue-500" value={tempExpense.value} onChange={e => setTempExpense({...tempExpense, value: e.target.value})} />
              <input type="date" className="w-full bg-white/5 p-4 rounded-xl border border-white/10 outline-none font-bold" value={tempExpense.date} onChange={e => setTempExpense({...tempExpense, date: e.target.value})} />
              <div className="flex gap-4 pt-4">
                <button onClick={handleAddExpense} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black">تأكيد</button>
                <button onClick={() => setIsExpenseModalOpen(false)} className="flex-1 bg-white/10 py-4 rounded-2xl font-black">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commitment Modal (Simplified for sync) */}
      {isCommitmentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-[2.5rem] p-8 md:p-12 border ${cardClasses[theme]}`}>
            <h3 className="text-2xl font-black mb-8">إضافة التزام</h3>
            <div className="space-y-4">
              <select className="w-full bg-white/5 p-4 rounded-xl border border-white/10 outline-none font-bold" value={tempCommitment.type} onChange={e => setTempCommitment({...tempCommitment, type: e.target.value})}>
                {COMMITMENT_TYPES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
              </select>
              <input type="number" placeholder="القيمة الإجمالية" className="w-full bg-white/5 p-4 rounded-xl border border-white/10 outline-none font-bold" value={tempCommitment.totalValue} onChange={e => setTempCommitment({...tempCommitment, totalValue: e.target.value})} />
              <input type="number" placeholder="الأقساط" className="w-full bg-white/5 p-4 rounded-xl border border-white/10 outline-none font-bold" value={tempCommitment.installmentsCount} onChange={e => setTempCommitment({...tempCommitment, installmentsCount: e.target.value})} />
              <input placeholder="المدة (مثلاً: 12 شهر)" className="w-full bg-white/5 p-4 rounded-xl border border-white/10 outline-none font-bold" value={tempCommitment.duration} onChange={e => setTempCommitment({...tempCommitment, duration: e.target.value})} />
              <div className="flex gap-4 pt-4">
                <button onClick={handleAddCommitment} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black">إضافة</button>
                <button onClick={() => setIsCommitmentModalOpen(false)} className="flex-1 bg-white/10 py-4 rounded-2xl font-black">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
