
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Archive, 
  TrendingDown, 
  LayoutDashboard,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { Expense, Commitment, MonthlyRecord, AppTab } from './types';

// Constants for categories
const DEFAULT_EXPENSE_CATEGORIES = [
  'المياه',
  'الغاز',
  'الكهرباء',
  'الانترنت المنزلي',
  'الخط الارضي',
  'جمعيات',
  'اقساط بنك'
];

const COMMITMENT_TYPES = [
  'جمعيات',
  'اقساط بنك',
  'التزامات اخرى'
];

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.MONTHLY_EXPENSES);
  const [time, setTime] = useState(new Date());
  const [salary, setSalary] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [history, setHistory] = useState<MonthlyRecord[]>([]);
  
  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCommitmentModalOpen, setIsCommitmentModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [customExpenseCategory, setCustomExpenseCategory] = useState('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);

  // New item form states
  const [tempValue, setTempValue] = useState('');
  const [tempDate, setTempDate] = useState('');
  const [tempDesc, setTempDesc] = useState('');

  // --- Clock logic ---
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Persistence ---
  useEffect(() => {
    const savedData = localStorage.getItem('smart_prise_data');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setSalary(parsed.salary || 0);
      setExpenses(parsed.expenses || []);
      setCommitments(parsed.commitments || []);
      setHistory(parsed.history || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('smart_prise_data', JSON.stringify({ salary, expenses, commitments, history }));
  }, [salary, expenses, commitments, history]);

  // --- Calculations ---
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.value, 0);
  const balance = salary - totalExpenses;

  // --- Handlers ---
  const handleAddExpense = () => {
    if (!tempValue || isNaN(Number(tempValue))) return;
    
    const newExpense: Expense = {
      id: Date.now().toString(),
      name: isAddingCustomCategory ? customExpenseCategory : selectedCategory,
      value: parseFloat(tempValue),
      dueDate: tempDate || new Date().toISOString().split('T')[0],
      category: isAddingCustomCategory ? customExpenseCategory : selectedCategory,
    };

    setExpenses([...expenses, newExpense]);
    setIsExpenseModalOpen(false);
    resetTempStates();
  };

  const handleAddCommitment = () => {
    if (!tempValue || isNaN(Number(tempValue))) return;
    
    const newCommitment: Commitment = {
      id: Date.now().toString(),
      type: selectedCategory,
      value: parseFloat(tempValue),
      description: tempDesc
    };

    setCommitments([...commitments, newCommitment]);
    setIsCommitmentModalOpen(false);
    resetTempStates();
  };

  const handleTransfer = () => {
    if (expenses.length === 0) return;
    
    const now = new Date();
    const monthName = now.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
    
    const record: MonthlyRecord = {
      id: Date.now().toString(),
      monthName,
      salary,
      totalExpenses,
      expenses: [...expenses],
      date: now.toISOString()
    };

    setHistory([record, ...history]);
    setExpenses([]);
    alert('تم ترحيل البيانات بنجاح إلى الأرشيف');
  };

  const resetTempStates = () => {
    setTempValue('');
    setTempDate('');
    setTempDesc('');
    setCustomExpenseCategory('');
    setIsAddingCustomCategory(false);
  };

  // --- UI Formatters ---
  const formattedDate = time.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = time.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shadow-sm z-20">
        <div className="p-6 border-b border-slate-100 bg-blue-600 text-white">
          <h1 className="text-2xl font-bold tracking-tight">Smart Prise</h1>
          <p className="text-blue-100 text-xs mt-1">نظام الإدارة المالية الذكي</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setActiveTab(AppTab.MONTHLY_EXPENSES)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === AppTab.MONTHLY_EXPENSES ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <LayoutDashboard size={20} />
            <span>المصروفات الشهرية</span>
          </button>
          
          <button 
            onClick={() => setActiveTab(AppTab.COMMITMENTS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === AppTab.COMMITMENTS ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <ShieldCheck size={20} />
            <span>الالتزامات</span>
          </button>

          <button 
            onClick={() => setActiveTab(AppTab.PREVIOUS_MONTHS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === AppTab.PREVIOUS_MONTHS ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Archive size={20} />
            <span>الأشهر السابقة</span>
          </button>
        </nav>

        {/* DateTime Widget on Left (Bottom of sidebar area) */}
        <div className="p-6 bg-slate-100 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3 text-slate-600">
            <Calendar size={18} />
            <span className="text-sm font-medium">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-3 text-blue-600 font-bold">
            <Clock size={18} />
            <span className="text-lg tabular-nums" dir="ltr">{formattedTime}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Header Summary */}
        <header className="bg-white border-b border-slate-200 p-6 flex flex-wrap items-center justify-between gap-6 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wider">الراتب الشهري</p>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={salary}
                  onChange={(e) => setSalary(Number(e.target.value))}
                  placeholder="أدخل الراتب"
                  className="text-2xl font-bold bg-transparent border-none focus:ring-0 w-32 outline-none border-b-2 border-transparent hover:border-slate-200 transition-colors"
                />
                <span className="text-slate-400 font-medium">ج.م</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-center px-6 border-r border-slate-100">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">إجمالي المصروفات</p>
              <p className="text-xl font-bold text-red-500">{totalExpenses.toLocaleString()} ج.م</p>
            </div>
            <div className="text-center px-6">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">المبلغ المتبقي</p>
              <p className={`text-2xl font-black ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {balance.toLocaleString()} ج.م
              </p>
            </div>
          </div>
        </header>

        {/* Content Tabs */}
        <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">
          
          {activeTab === AppTab.MONTHLY_EXPENSES && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">مصروفات شهرية</h2>
                  <p className="text-slate-500 text-sm mt-1">تتبع كافة مدفوعاتك واحتياجاتك الأساسية</p>
                </div>
                <button 
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95"
                >
                  <Plus size={20} />
                  <span>أضف مصروفات</span>
                </button>
              </div>

              {expenses.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingDown className="text-slate-300" size={40} />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700">لا يوجد مصروفات مسجلة</h3>
                  <p className="text-slate-500 mt-2 max-w-xs mx-auto">ابدأ بإضافة أول مصروف لك من خلال زر الإضافة أعلاه.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl text-slate-600">
                          <LayoutDashboard size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{expense.name}</h4>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              موعد السداد: {expense.dueDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-lg font-bold text-slate-700">{expense.value.toLocaleString()} ج.م</span>
                        <button 
                          onClick={() => setExpenses(expenses.filter(e => e.id !== expense.id))}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-12 flex justify-center">
                    <button 
                      onClick={handleTransfer}
                      className="flex items-center gap-3 bg-slate-800 text-white px-10 py-4 rounded-2xl hover:bg-slate-900 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                      disabled={expenses.length === 0}
                    >
                      <Archive size={20} />
                      <span className="font-bold text-lg">ترحيل الشهر الحالي</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === AppTab.COMMITMENTS && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">الالتزامات المالية</h2>
                    <p className="text-slate-500 text-sm mt-1">إدارة الديون والأقساط والجمعيات طويلة المدى</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedCategory(COMMITMENT_TYPES[0]);
                      setIsCommitmentModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 shadow-md transition-all active:scale-95"
                  >
                    <Plus size={20} />
                    <span>أضف التزام جديد</span>
                  </button>
                </div>

                {commitments.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="text-slate-300" size={40} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700">لا يوجد التزامات حالية</h3>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {commitments.map((com) => (
                      <div key={com.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-4">
                          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                            <ShieldCheck size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">{com.type}</h4>
                            <p className="text-xs text-slate-400 mt-1">{com.description || 'بدون وصف إضافي'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-lg font-bold text-emerald-700">{com.value.toLocaleString()} ج.م</span>
                          <button 
                            onClick={() => setCommitments(commitments.filter(c => c.id !== com.id))}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          )}

          {activeTab === AppTab.PREVIOUS_MONTHS && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h2 className="text-2xl font-bold text-slate-800 mb-8">سجل الشهور السابقة</h2>
                
                {history.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                    <Archive className="text-slate-300 mx-auto mb-4" size={40} />
                    <h3 className="text-lg font-semibold text-slate-700">الأرشيف فارغ حالياً</h3>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {history.map((record) => (
                      <div key={record.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                          <h4 className="font-bold text-slate-700">{record.monthName}</h4>
                          <span className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full font-bold">
                            الراتب: {record.salary.toLocaleString()} ج.م
                          </span>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between text-sm mb-4">
                            <span className="text-slate-500">إجمالي المصروفات: <span className="text-red-500 font-bold">{record.totalExpenses.toLocaleString()} ج.م</span></span>
                            <span className="text-slate-500">المتبقي: <span className="text-green-600 font-bold">{(record.salary - record.totalExpenses).toLocaleString()} ج.م</span></span>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 max-h-40 overflow-y-auto">
                            {record.expenses.map(exp => (
                              <div key={exp.id} className="flex justify-between text-xs py-1 border-b border-slate-200 last:border-0">
                                <span>{exp.name}</span>
                                <span className="font-semibold">{exp.value.toLocaleString()} ج.م</span>
                              </div>
                            ))}
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

      {/* --- Expense Modal --- */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 transform animate-in slide-in-from-scale-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 mb-6">إضافة مصروف جديد</h3>
            
            <div className="space-y-5">
              <div className="flex gap-2">
                {!isAddingCustomCategory ? (
                  <>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">اختر النوع</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        {DEFAULT_EXPENSE_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={() => setIsAddingCustomCategory(true)}
                      className="mt-6 bg-slate-100 p-3 rounded-xl hover:bg-slate-200 text-slate-600 transition-all"
                      title="إضافة نوع جديد"
                    >
                      <Plus size={24} />
                    </button>
                  </>
                ) : (
                  <div className="flex-1 space-y-1 animate-in slide-in-from-left-2 duration-200">
                    <label className="text-xs font-bold text-slate-400 uppercase">نوع المصروف الجديد</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={customExpenseCategory}
                        onChange={(e) => setCustomExpenseCategory(e.target.value)}
                        placeholder="مثلاً: صيانة السيارة"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                         onClick={() => {setIsAddingCustomCategory(false); setCustomExpenseCategory('');}}
                         className="bg-slate-100 p-3 rounded-xl hover:bg-slate-200 text-slate-600"
                      >
                        <ChevronLeft size={24} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">القيمة (ج.م)</label>
                <input 
                  type="number" 
                  autoFocus
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xl font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">موعد السداد</label>
                <input 
                  type="date" 
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                onClick={handleAddExpense}
                className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
              >
                تأكيد الإضافة
              </button>
              <button 
                onClick={() => { setIsExpenseModalOpen(false); resetTempStates(); }}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Commitment Modal --- */}
      {isCommitmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 transform animate-in slide-in-from-scale-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 mb-6">إضافة التزام مالي</h3>
            
            <div className="space-y-5">
              <div className="flex gap-2">
                {!isAddingCustomCategory ? (
                   <>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">نوع الالتزام</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        {COMMITMENT_TYPES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={() => setIsAddingCustomCategory(true)}
                      className="mt-6 bg-slate-100 p-3 rounded-xl hover:bg-slate-200 text-slate-600 transition-all"
                    >
                      <Plus size={24} />
                    </button>
                  </>
                ) : (
                  <div className="flex-1 space-y-1 animate-in slide-in-from-left-2 duration-200">
                    <label className="text-xs font-bold text-slate-400 uppercase">نوع التزام جديد</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={customExpenseCategory}
                        onChange={(e) => setCustomExpenseCategory(e.target.value)}
                        placeholder="مثلاً: اشتراك نادي"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button 
                         onClick={() => {setIsAddingCustomCategory(false); setCustomExpenseCategory('');}}
                         className="bg-slate-100 p-3 rounded-xl hover:bg-slate-200 text-slate-600"
                      >
                        <ChevronLeft size={24} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">القيمة الإجمالية (ج.م)</label>
                <input 
                  type="number" 
                  autoFocus
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xl font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">ملاحظات إضافية</label>
                <textarea 
                  value={tempDesc}
                  onChange={(e) => setTempDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 h-24 resize-none"
                  placeholder="اكتب تفاصيل إضافية هنا..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                onClick={handleAddCommitment}
                className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
              >
                تأكيد الإضافة
              </button>
              <button 
                onClick={() => { setIsCommitmentModalOpen(false); resetTempStates(); }}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
