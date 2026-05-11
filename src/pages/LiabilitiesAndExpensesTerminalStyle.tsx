import { useState, useMemo } from 'react';
import { useFinancial } from '../context/FinancialContext';
import type { Liability } from '../context/FinancialContext';

const EXPENSE_CATEGORIES = [
  { value: 'Food & Dining', icon: 'restaurant', color: 'text-[#f97316]' },
  { value: 'Groceries', icon: 'shopping_cart', color: 'text-[#4ade80]' },
  { value: 'Transport', icon: 'directions_car', color: 'text-[#60a5fa]' },
  { value: 'Shopping', icon: 'shopping_bag', color: 'text-[#f472b6]' },
  { value: 'Entertainment', icon: 'movie', color: 'text-[#a78bfa]' },
  { value: 'Bills & Utilities', icon: 'receipt_long', color: 'text-[#fbbf24]' },
  { value: 'Health', icon: 'favorite', color: 'text-[#f87171]' },
  { value: 'Subscriptions', icon: 'autorenew', color: 'text-[#38bdf8]' },
  { value: 'Rent / Mortgage', icon: 'home', color: 'text-[#34d399]' },
  { value: 'Education', icon: 'school', color: 'text-[#818cf8]' },
  { value: 'Credit Card', icon: 'credit_card', color: 'text-[#fb923c]' },
  { value: 'Other', icon: 'more_horiz', color: 'text-on-surface-variant' },
];

type ViewMode = 'daily' | 'debts';

export default function LiabilitiesAndExpensesTerminalStyle() {
  const { state, addLiability, removeLiability, updateLiability, totalDebt, exportCSV } = useFinancial();

  const [viewMode, setViewMode] = useState<ViewMode>('daily');

  // Quick expense form
  const [expName, setExpName] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Food & Dining');
  const [selectedQuickCat, setSelectedQuickCat] = useState<string | null>(null);

  // Debt form
  const [newLiability, setNewLiability] = useState<Partial<Liability>>({ name: '', category: 'Credit Card', principal: 0, apr: 0, maxLimit: 0, isIntroApr: false, minPayment: 0 });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Liability>>({});

  // Filter
  const [filter, setFilter] = useState<'all' | 'Active' | 'Paid Off'>('all');

  // Separate daily expenses from debts
  const dailyExpenses = useMemo(() =>
    state.liabilities.filter(l => !['Credit Card', 'Mortgage', 'Student Loan', 'Auto Loan', 'Personal', 'Medical'].includes(l.category))
      .sort((a, b) => b.id.localeCompare(a.id)),
    [state.liabilities]
  );
  const debts = useMemo(() =>
    state.liabilities.filter(l => ['Credit Card', 'Mortgage', 'Student Loan', 'Auto Loan', 'Personal', 'Medical'].includes(l.category)),
    [state.liabilities]
  );

  const filteredLiabilities = filter === 'all' ? debts : debts.filter(l => l.status === filter);

  const todayTotal = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return dailyExpenses.filter(e => e.nextPayment === today).reduce((s, e) => s + e.principal, 0);
  }, [dailyExpenses]);

  const handleQuickExpense = () => {
    if (!expName || !expAmount) return;
    const cat = selectedQuickCat || expCategory;
    addLiability({
      name: expName, category: cat, principal: Number(expAmount),
      apr: 0, nextPayment: new Date().toISOString().split('T')[0], status: 'Active',
    });
    setExpName(''); setExpAmount(''); setSelectedQuickCat(null);
  };

  const handleAddDebt = () => {
    if (!newLiability.name || !newLiability.principal) return;
    addLiability({
      name: newLiability.name!, category: newLiability.category || 'Credit Card',
      principal: newLiability.principal!, apr: newLiability.apr || 0,
      nextPayment: 'Monthly', status: 'Active',
      maxLimit: newLiability.category === 'Credit Card' ? (newLiability.maxLimit || 0) : undefined,
      isIntroApr: newLiability.category === 'Credit Card' ? (newLiability.isIntroApr || false) : undefined,
      minPayment: newLiability.minPayment || 0,
    });
    setNewLiability({ name: '', category: 'Credit Card', principal: 0, apr: 0, maxLimit: 0, isIntroApr: false, minPayment: 0 });
  };

  const startEdit = (l: Liability) => { setEditingId(l.id); setEditValues({ principal: l.principal, apr: l.apr, status: l.status, minPayment: l.minPayment }); };
  const saveEdit = (id: string) => { updateLiability(id, editValues); setEditingId(null); };
  const cancelEdit = () => { setEditingId(null); setEditValues({}); };

  const getCategoryInfo = (cat: string) => EXPENSE_CATEGORIES.find(c => c.value === cat) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <header className="mb-4 flex justify-between items-end">
          <div>
            <h1 className="font-h1 text-primary-container uppercase tracking-tight">My Expenses</h1>
            <p className="text-on-surface-variant font-body-base text-xs mt-1">Track daily spending and manage your debts in one place.</p>
          </div>
          <button onClick={exportCSV} className="px-3 py-1 bg-surface-container border border-outline-variant text-on-surface text-xs font-mono-data rounded hover:bg-surface-container-high transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-fluid-14">download</span> EXPORT
          </button>
        </header>

        {/* View Toggle */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setViewMode('daily')} className={`px-4 py-1.5 text-fluid-11 uppercase font-mono tracking-wider border rounded transition-colors flex items-center gap-1.5 ${viewMode === 'daily' ? 'bg-primary/20 border-primary text-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}>
            <span className="material-symbols-outlined text-fluid-14">today</span> Daily Spending
          </button>
          <button onClick={() => setViewMode('debts')} className={`px-4 py-1.5 text-fluid-11 uppercase font-mono tracking-wider border rounded transition-colors flex items-center gap-1.5 ${viewMode === 'debts' ? 'bg-primary/20 border-primary text-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}>
            <span className="material-symbols-outlined text-fluid-14">credit_card</span> Debts & Loans
          </button>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
          <div className="bg-surface-container border border-outline-variant p-3">
            <div className="text-fluid-9 text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-fluid-12">today</span> Today's Spending
            </div>
            <div className="font-mono-data text-lg font-bold text-on-surface">${todayTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-surface-container border border-outline-variant p-3">
            <div className="text-fluid-9 text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-fluid-12">calendar_month</span> Monthly Budget
            </div>
            <div className="font-mono-data text-lg font-bold text-on-surface">${state.monthlyBurn.toLocaleString()}</div>
            <div className="text-fluid-9 text-on-surface-variant">/month</div>
          </div>
          <div className="bg-surface-container border border-outline-variant p-3">
            <div className="text-fluid-9 text-on-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-fluid-12">credit_card</span> Total Debt
            </div>
            <div className={`font-mono-data text-lg font-bold ${totalDebt > 0 ? 'text-[#f87171]' : 'text-[#4ade80]'}`}>${totalDebt.toLocaleString()}</div>
          </div>
        </div>

        {viewMode === 'daily' ? (
          <>
            {/* Recent Expenses List */}
            <div className="border border-outline-variant rounded overflow-hidden">
              <div className="bg-surface-container-high px-4 py-2 flex items-center justify-between border-b border-outline-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-fluid-16">receipt</span>
                  <span className="text-fluid-10 text-on-surface-variant uppercase tracking-widest font-bold">Recent Expenses</span>
                </div>
                <span className="text-fluid-9 font-mono-data text-on-surface-variant">{dailyExpenses.length} items</span>
              </div>
              {dailyExpenses.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant text-xs italic">
                  <span className="material-symbols-outlined text-3xl block mb-2 text-outline">receipt_long</span>
                  No expenses yet. Use the quick-add form to log your first expense →
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/20">
                  {dailyExpenses.map(e => {
                    const cat = getCategoryInfo(e.category);
                    return (
                      <div key={e.id} className="flex items-center px-4 py-2.5 hover:bg-surface-container-low transition-colors">
                        <div className={`w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center mr-3 ${cat.color}`}>
                          <span className="material-symbols-outlined text-fluid-16">{cat.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-on-surface text-sm font-medium truncate">{e.name}</div>
                          <div className="text-on-surface-variant text-fluid-10">{e.category} • {e.nextPayment}</div>
                        </div>
                        <div className="font-mono-data text-sm font-bold text-[#f87171] mr-3">
                          -${e.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <button onClick={() => removeLiability(e.id)} className="text-on-surface-variant hover:text-error transition-colors">
                          <span className="material-symbols-outlined text-fluid-16">close</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Debts Table */}
            <div className="border border-outline-variant rounded overflow-hidden">
              <div className="bg-surface-container-high px-4 py-2 flex items-center justify-between border-b border-outline-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-fluid-16">credit_card</span>
                  <span className="text-fluid-10 text-on-surface-variant uppercase tracking-widest font-bold">My Debts & Loans</span>
                </div>
                <div className="flex gap-2">
                  {(['all', 'Active', 'Paid Off'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-2 py-0.5 text-fluid-10 uppercase font-mono tracking-wider border rounded transition-colors ${filter === f ? 'bg-primary/20 border-primary text-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}>
                      {f === 'all' ? 'All' : f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-surface-container-high text-fluid-9 uppercase tracking-wider text-outline font-bold">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2 text-right">Balance</th>
                    <th className="px-4 py-2 text-right">Interest</th>
                    <th className="px-4 py-2">Payment</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-mono-data text-sm">
                  {filteredLiabilities.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-on-surface-variant italic">No debts tracked yet. Add your first debt below →</td></tr>
                  )}
                  {filteredLiabilities.map(l => (
                    <tr key={l.id} className="border-t border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-2">
                        <div className="text-on-surface font-semibold">{l.name}</div>
                        <div className="text-on-surface-variant text-fluid-10">{l.category}</div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        {editingId === l.id ? (
                          <input type="number" className="w-28 bg-surface border border-primary p-1 text-xs font-mono text-on-surface text-right outline-none" value={editValues.principal} onChange={e => setEditValues(v => ({ ...v, principal: Number(e.target.value) }))} />
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-on-surface">${l.principal.toLocaleString()}</span>
                            {l.maxLimit ? <span className="text-on-surface-variant text-[10px] mt-0.5 uppercase tracking-wider">Limit: ${l.maxLimit.toLocaleString()}</span> : null}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {editingId === l.id ? (
                          <input type="number" className="w-20 bg-surface border border-primary p-1 text-xs font-mono text-on-surface text-right outline-none" value={editValues.apr} onChange={e => setEditValues(v => ({ ...v, apr: Number(e.target.value) }))} />
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className={l.apr >= 15 ? 'text-error font-bold' : 'text-on-surface'}>{l.apr.toFixed(1)}%</span>
                            {l.isIntroApr && <span className="text-primary text-[9px] uppercase font-bold tracking-widest bg-primary/10 px-1 mt-0.5 rounded border border-primary/20">Intro APR</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-on-surface-variant">
                        {editingId === l.id ? (
                           <input type="number" className="w-20 bg-surface border border-primary p-1 text-xs font-mono text-on-surface outline-none" value={editValues.minPayment || ''} onChange={e => setEditValues(v => ({ ...v, minPayment: Number(e.target.value) }))} placeholder="Min $" />
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-on-surface">${l.minPayment?.toLocaleString() || '0'}/mo</span>
                            <span className="text-fluid-10">{l.nextPayment}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {editingId === l.id ? (
                          <select className="bg-surface border border-primary p-1 text-xs font-mono text-on-surface outline-none" value={editValues.status} onChange={e => setEditValues(v => ({ ...v, status: e.target.value }))}>
                            <option value="Active">Active</option><option value="Paid Off">Paid Off</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 text-fluid-10 uppercase font-bold rounded ${l.status === 'Active' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface-container text-on-surface-variant border border-outline-variant'}`}>{l.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {editingId === l.id ? (
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => saveEdit(l.id)} className="text-primary text-xs uppercase hover:underline">Save</button>
                            <button onClick={cancelEdit} className="text-on-surface-variant text-xs uppercase hover:underline">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => startEdit(l)} className="text-primary text-xs uppercase hover:underline">Edit</button>
                            <button onClick={() => removeLiability(l.id)} className="text-error text-xs uppercase hover:underline">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sidebar — context-aware add form */}
      <aside className="w-full md:w-80 bg-surface-container border-t md:border-t-0 md:border-l border-outline-variant flex flex-col p-4 overflow-y-auto shrink-0">
        {viewMode === 'daily' ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">add_circle</span>
              <h2 className="font-h3 text-h3 text-on-surface uppercase">Quick Add</h2>
            </div>

            {/* Category quick-pick chips */}
            <div className="mb-3">
              <label className="text-fluid-10 text-on-surface-variant uppercase tracking-wider mb-2 block">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {EXPENSE_CATEGORIES.slice(0, 8).map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => { setSelectedQuickCat(cat.value); setExpCategory(cat.value); }}
                    className={`px-2 py-1 text-fluid-9 rounded border flex items-center gap-1 transition-colors ${
                      (selectedQuickCat || expCategory) === cat.value
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-fluid-12 ${cat.color}`}>{cat.icon}</span>
                    {cat.value.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div>
                <label className="text-fluid-10 text-on-surface-variant uppercase tracking-wider mb-0.5 block">What did you spend on?</label>
                <input className="w-full bg-surface-container-low border border-outline-variant p-2 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={expName} onChange={e => setExpName(e.target.value)} placeholder="Coffee, lunch, Uber ride..." />
              </div>
              <div>
                <label className="text-fluid-10 text-on-surface-variant uppercase tracking-wider mb-0.5 block">Amount</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">$</span>
                  <input type="number" step="0.01" className="w-full bg-surface-container-low border border-outline-variant p-2 pl-5 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" />
                </div>
              </div>

              {/* Quick amount buttons */}
              <div className="flex gap-1.5">
                {[5, 10, 20, 50, 100].map(v => (
                  <button key={v} onClick={() => setExpAmount(v.toString())} className="flex-1 py-1 text-fluid-10 font-mono border border-outline-variant text-on-surface-variant hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors rounded">
                    ${v}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleQuickExpense}
              disabled={!expName || !expAmount}
              className="mt-3 w-full bg-primary text-on-primary font-bold py-3 uppercase tracking-tighter text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Expense
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">credit_card</span>
              <h2 className="font-h3 text-h3 text-on-surface uppercase">Add Debt</h2>
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <label className="text-fluid-10 text-on-surface-variant uppercase tracking-wider mb-0.5 block">Name</label>
                <input className="w-full bg-surface-container-low border border-outline-variant p-2 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={newLiability.name} onChange={e => setNewLiability(v => ({ ...v, name: e.target.value }))} placeholder="e.g., Chase Visa" />
              </div>
              <div>
                <label className="text-fluid-10 text-on-surface-variant uppercase tracking-wider mb-0.5 block">Type</label>
                <select className="w-full bg-surface-container-low border border-outline-variant p-2 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={newLiability.category} onChange={e => setNewLiability(v => ({ ...v, category: e.target.value }))}>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Personal">Personal Loan</option>
                  <option value="Mortgage">Mortgage</option>
                  <option value="Student Loan">Student Loan</option>
                  <option value="Auto Loan">Auto / Car Loan</option>
                  <option value="Medical">Medical Bill</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-fluid-10 text-on-surface-variant uppercase tracking-wider mb-0.5 block">Balance Owed</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">$</span>
                    <input type="number" className="w-full bg-surface-container-low border border-outline-variant p-2 pl-5 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={newLiability.principal || ''} onChange={e => setNewLiability(v => ({ ...v, principal: Number(e.target.value) }))} />
                  </div>
                </div>
                <div>
                  <label className="text-fluid-10 text-on-surface-variant uppercase tracking-wider mb-0.5 block">Interest Rate</label>
                  <div className="relative">
                    <input type="number" className="w-full bg-surface-container-low border border-outline-variant p-2 pr-5 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={newLiability.apr || ''} onChange={e => setNewLiability(v => ({ ...v, apr: Number(e.target.value) }))} />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-fluid-10 text-on-surface-variant uppercase tracking-wider mb-0.5 block">Min Payment</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">$</span>
                    <input type="number" className="w-full bg-surface-container-low border border-outline-variant p-2 pl-5 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={newLiability.minPayment || ''} onChange={e => setNewLiability(v => ({ ...v, minPayment: Number(e.target.value) }))} />
                  </div>
                </div>
              </div>
              
              {newLiability.category === 'Credit Card' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-outline-variant/30 mt-2">
                  <div>
                    <label className="text-fluid-10 text-primary uppercase tracking-wider mb-0.5 block flex items-center gap-1">
                      Max Limit
                    </label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">$</span>
                      <input type="number" className="w-full bg-surface-container-low border border-outline-variant p-2 pl-5 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={newLiability.maxLimit || ''} onChange={e => setNewLiability(v => ({ ...v, maxLimit: Number(e.target.value) }))} placeholder="0.00" />
                    </div>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-primary" checked={newLiability.isIntroApr || false} onChange={e => setNewLiability(v => ({ ...v, isIntroApr: e.target.checked }))} />
                      <span className="text-fluid-10 text-on-surface-variant uppercase tracking-wider">Is Intro APR?</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
            <button onClick={handleAddDebt} disabled={!newLiability.name || !newLiability.principal}
              className="mt-3 w-full bg-primary text-on-primary font-bold py-3 uppercase tracking-tighter text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded">
              <span className="material-symbols-outlined text-sm">add</span> Add Debt
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
