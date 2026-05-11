import { Link } from 'react-router-dom';
import { useFinancial } from '../context/FinancialContext';
import { useMemo } from 'react';

export default function FinancialOverviewTerminalStyle() {
  const { state, netWorth, totalDebt, totalAssets } = useFinancial();

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);
  const monthlySavings = state.monthlyIncome - state.monthlyBurn;
  const savingsRate = state.monthlyIncome > 0 ? ((monthlySavings / state.monthlyIncome) * 100) : 0;
  // debt ratio used contextually in UI
  const tradePnl = (state.trades || []).reduce((s, t) => s + t.pnl, 0);
  const tradeWins = (state.trades || []).filter(t => t.pnl > 0).length;
  const tradeTotal = (state.trades || []).length;
  const winRate = tradeTotal > 0 ? ((tradeWins / tradeTotal) * 100) : 0;
  const targetProgress = state.userProfile.targetNetWorth > 0 ? Math.min(Math.max((netWorth / state.userProfile.targetNetWorth) * 100, 0), 100) : 0;

  const recentChanges = useMemo(() => (state.changelog || []).slice(0, 6), [state.changelog]);
  const recentTrades = useMemo(() => (state.trades || []).slice(0, 4), [state.trades]);

  // Debt obligations
  const DEBT_CATEGORIES = ['Credit Card', 'Mortgage', 'Student Loan', 'Auto Loan', 'Personal', 'Medical'];
  const debts = useMemo(() => (state.liabilities || []).filter(l => DEBT_CATEGORIES.includes(l.category)), [state.liabilities]);
  const totalMinPayments = useMemo(() => debts.reduce((s, d) => s + (d.minPayment || 0), 0), [debts]);
  const obligationPct = state.monthlyIncome > 0 ? (totalMinPayments / state.monthlyIncome) * 100 : 0;

  // Portfolio allocation
  const allocation = useMemo(() => {
    const map: Record<string, number> = {};
    state.assets.forEach(a => { map[a.category] = (map[a.category] || 0) + a.quantity * a.unitPrice; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [state.assets]);

  // Credit score tier
  const creditTier = state.creditScore >= 800 ? { label: 'Excellent', color: '#4ade80' } :
    state.creditScore >= 740 ? { label: 'Very Good', color: '#60a5fa' } :
    state.creditScore >= 670 ? { label: 'Good', color: '#fbbf24' } :
    state.creditScore >= 580 ? { label: 'Fair', color: '#fb923c' } :
    { label: 'Poor', color: '#f87171' };
  const creditPct = Math.min((state.creditScore / 850) * 100, 100);

  const greeting = state.userProfile.name
    ? `Welcome back, ${state.userProfile.name.split(' ')[0]}`
    : 'Dashboard';

  const pnlColor = (v: number) => v > 0 ? 'text-[#4ade80]' : v < 0 ? 'text-error' : 'text-on-surface-variant';

  return (
    <div className="flex-1 flex flex-col min-w-0 p-4 h-full overflow-y-auto">
      {/* Header */}
      <header className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface mb-0.5 uppercase tracking-tight">{greeting}</h2>
          <p className="font-mono-data text-fluid-10 text-on-surface-variant uppercase tracking-widest">
            Financial overview • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <Link to="/strategy" className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-xs font-mono-data rounded hover:bg-primary/20 transition-colors flex items-center gap-1.5">
          <span className="material-symbols-outlined text-fluid-14">tune</span> Budget Planner
        </Link>
      </header>

      {/* Row 1: Hero Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Net Worth — Hero Card */}
        <div className="sm:col-span-2 bg-surface-container border border-outline-variant rounded p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-fluid-16">account_balance</span>
            <span className="text-fluid-9 text-on-surface-variant uppercase tracking-widest">Net Worth</span>
          </div>
          <div className={`font-mono-data text-3xl font-bold ${netWorth >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'} leading-tight mb-2`}>
            {fmt(netWorth)}
          </div>
          <div className="flex gap-4 text-fluid-10 font-mono-data text-on-surface-variant">
            <span>Assets: <span className="text-[#60a5fa]">{fmt(totalAssets)}</span></span>
            <span>Debts: <span className="text-[#fbbf24]">{fmt(totalDebt)}</span></span>
          </div>
          {state.userProfile.targetNetWorth > 0 && (
            <div className="mt-3 pt-2 border-t border-outline-variant/30">
              <div className="flex justify-between text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
                <span>Goal: {fmt(state.userProfile.targetNetWorth)}</span>
                <span className="text-primary font-bold">{targetProgress.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${targetProgress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Monthly Cash Flow */}
        <div className="bg-surface-container border border-outline-variant rounded p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#4ade80] text-fluid-16">trending_up</span>
            <span className="text-fluid-9 text-on-surface-variant uppercase tracking-widest">Cash Flow</span>
          </div>
          <div className={`font-mono-data text-xl font-bold ${monthlySavings >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'} mb-1`}>
            {monthlySavings >= 0 ? '+' : ''}{fmt(monthlySavings)}
          </div>
          <div className="text-fluid-10 text-on-surface-variant mb-2">/month</div>
          {/* Savings rate bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${savingsRate >= 20 ? 'bg-[#4ade80]' : savingsRate >= 10 ? 'bg-[#fbbf24]' : 'bg-[#f87171]'}`} style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }} />
            </div>
            <span className="text-fluid-9 font-mono-data text-on-surface-variant">{savingsRate.toFixed(0)}%</span>
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-on-surface-variant">
            <span>In: {fmt(state.monthlyIncome)}</span>
            <span>Out: {fmt(state.monthlyBurn)}</span>
          </div>
        </div>

        {/* Credit Score Gauge */}
        <div className="bg-surface-container border border-outline-variant rounded p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-fluid-16" style={{ color: creditTier.color }}>speed</span>
            <span className="text-fluid-9 text-on-surface-variant uppercase tracking-widest">Credit Score</span>
          </div>
          <div className="font-mono-data text-xl font-bold text-on-surface mb-0.5">{state.creditScore || '—'}</div>
          <div className="text-fluid-10 font-bold uppercase tracking-wider mb-2" style={{ color: creditTier.color }}>{creditTier.label}</div>
          {/* Score bar */}
          <div className="h-1.5 bg-surface rounded-full overflow-hidden mb-1">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${creditPct}%`, backgroundColor: creditTier.color }} />
          </div>
          <div className="flex justify-between text-[10px] text-on-surface-variant">
            <span>300</span><span>850</span>
          </div>
        </div>
      </div>

      {/* Row 2: Money Flow + Allocation + Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        {/* Money Flow */}
        <div className="lg:col-span-1 bg-surface-container border border-outline-variant rounded overflow-hidden">
          <div className="px-3 py-2 border-b border-outline-variant bg-surface-container-high flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-fluid-14">device_hub</span>
            <span className="text-fluid-10 text-on-surface-variant uppercase tracking-widest font-bold">Quick Nav</span>
          </div>
          <div className="p-3 grid grid-cols-2 gap-2">
            {[
              { label: 'Assets', icon: 'account_balance_wallet', route: '/portfolio', value: fmt(totalAssets), color: 'text-[#60a5fa]', count: `${state.assets.length} items` },
              { label: 'Expenses', icon: 'receipt_long', route: '/expenses', value: fmt(totalDebt), color: 'text-[#fbbf24]', count: `${debts.length} debts` },
              { label: 'Trades', icon: 'candlestick_chart', route: '/trades', value: `${tradeTotal}`, color: 'text-[#a78bfa]', count: `${winRate.toFixed(0)}% win` },
              { label: 'Budget', icon: 'savings', route: '/strategy', value: fmt(state.monthlyIncome), color: 'text-[#4ade80]', count: '/month' },
            ].map(n => (
              <Link key={n.label} to={n.route} className="bg-surface border border-outline-variant/50 rounded p-2.5 hover:border-primary/40 transition-all group">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`material-symbols-outlined text-fluid-14 ${n.color} group-hover:text-primary transition-colors`}>{n.icon}</span>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">{n.label}</span>
                </div>
                <div className={`font-mono-data text-xs font-bold ${n.color}`}>{n.value}</div>
                <div className="text-[9px] text-on-surface-variant mt-0.5">{n.count}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Portfolio Allocation */}
        <div className="bg-surface-container border border-outline-variant rounded overflow-hidden">
          <div className="px-3 py-2 border-b border-outline-variant bg-surface-container-high flex items-center gap-2">
            <span className="material-symbols-outlined text-[#60a5fa] text-fluid-14">pie_chart</span>
            <span className="text-fluid-10 text-on-surface-variant uppercase tracking-widest font-bold">Allocation</span>
          </div>
          <div className="p-3">
            {allocation.length === 0 ? (
              <div className="text-center py-4">
                <span className="material-symbols-outlined text-3xl text-outline mb-1 block">add_circle_outline</span>
                <p className="text-on-surface-variant text-xs">No assets yet</p>
                <Link to="/portfolio" className="text-primary text-xs hover:underline mt-1 inline-block">Add your first asset →</Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {allocation.map(([cat, val]) => {
                  const pct = totalAssets > 0 ? (val / totalAssets) * 100 : 0;
                  const color = cat === 'EQUITIES' ? '#60a5fa' : cat === 'CRYPTOCURRENCY' ? '#a78bfa' : cat === 'REAL_ESTATE' ? '#4ade80' : '#fbbf24';
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-on-surface-variant uppercase tracking-wider">{cat.replace(/_/g, ' ')}</span>
                        <span className="font-mono-data text-on-surface">{fmt(val)} <span className="text-on-surface-variant">({pct.toFixed(0)}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-surface-container border border-outline-variant rounded overflow-hidden">
          <div className="px-3 py-2 border-b border-outline-variant bg-surface-container-high flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#a78bfa] text-fluid-14">candlestick_chart</span>
              <span className="text-fluid-10 text-on-surface-variant uppercase tracking-widest font-bold">Recent Trades</span>
            </div>
            {tradeTotal > 0 && (
              <span className={`font-mono-data text-xs font-bold ${tradePnl >= 0 ? 'text-[#4ade80]' : 'text-error'}`}>
                {tradePnl >= 0 ? '+' : ''}{fmt(tradePnl)}
              </span>
            )}
          </div>
          <div className="p-2">
            {recentTrades.length === 0 ? (
              <div className="text-center py-4">
                <span className="material-symbols-outlined text-3xl text-outline mb-1 block">show_chart</span>
                <p className="text-on-surface-variant text-xs">No trades logged</p>
                <Link to="/trades" className="text-primary text-xs hover:underline mt-1 inline-block">Log your first trade →</Link>
              </div>
            ) : (
              <div className="space-y-0.5">
                {recentTrades.map(t => (
                  <div key={t.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.pnl > 0 ? 'bg-[#4ade80]' : 'bg-[#f87171]'}`} />
                      <span className="font-mono-data text-xs font-bold text-on-surface">{t.ticker}</span>
                      <span className={`text-[9px] uppercase font-bold px-1 rounded ${t.direction === 'LONG' ? 'bg-[#4ade80]/10 text-[#4ade80]' : 'bg-error/10 text-error'}`}>{t.direction[0]}</span>
                    </div>
                    <span className={`font-mono-data text-xs font-bold ${pnlColor(t.pnl)}`}>
                      {t.pnl >= 0 ? '+' : ''}{fmt(t.pnl)}
                    </span>
                  </div>
                ))}
                <Link to="/trades" className="block text-center text-primary text-[10px] hover:underline pt-1 uppercase tracking-wider">
                  View all {tradeTotal} trades →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Monthly Debt Obligations */}
      {debts.length > 0 && (
        <div className="mb-4 bg-surface-container border border-outline-variant rounded overflow-hidden">
          <div className="px-3 py-2 border-b border-outline-variant bg-surface-container-high flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-fluid-14">event_repeat</span>
              <span className="text-fluid-10 text-on-surface-variant uppercase tracking-widest font-bold">Monthly Debt Obligations</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-mono-data text-sm font-bold ${
                obligationPct > 35 ? 'text-error' : obligationPct > 20 ? 'text-tertiary' : 'text-[#4ade80]'
              }`}>{fmt(totalMinPayments)}/mo</span>
              {obligationPct > 20 && (
                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                  obligationPct > 35
                    ? 'bg-error/15 text-error border-error/30'
                    : 'bg-tertiary-container/30 text-tertiary border-tertiary/30'
                }`}>
                  {obligationPct > 35 ? '⚠ HIGH RISK' : '⚡ WARNING'}
                </span>
              )}
            </div>
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {debts.filter(d => d.status !== 'Paid Off').map(d => {
              const pct = totalMinPayments > 0 ? ((d.minPayment || 0) / totalMinPayments) * 100 : 0;
              const barColor = d.category === 'Credit Card' ? 'bg-primary' : d.category === 'Mortgage' ? 'bg-[#4ade80]' : d.category === 'Student Loan' ? 'bg-[#a78bfa]' : 'bg-tertiary';
              return (
                <div key={d.id} className="bg-surface border border-outline-variant/50 rounded p-2.5 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <div className="text-on-surface text-xs font-semibold truncate">{d.name}</div>
                      <div className="text-on-surface-variant text-[10px]">{d.category} • {d.apr > 0 ? `${d.apr}% APR` : '0% APR'}{d.isIntroApr ? ' (intro)' : ''}</div>
                    </div>
                    <div className="text-right shrink-0">
                      {d.minPayment ? (
                        <span className="font-mono-data text-xs font-bold text-tertiary">{fmt(d.minPayment)}</span>
                      ) : (
                        <span className="text-[10px] text-on-surface-variant italic">No min set</span>
                      )}
                    </div>
                  </div>
                  <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[9px] text-on-surface-variant flex justify-between">
                    <span>Balance: {fmt(d.principal)}</span>
                    {d.maxLimit ? <span>Limit: {fmt(d.maxLimit)}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Summary bar */}
          <div className="mx-3 mb-3 p-2 bg-surface-container-high border border-outline-variant/50 rounded flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex-1">
              <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Obligations vs Income</div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    obligationPct > 35 ? 'bg-error' : obligationPct > 20 ? 'bg-tertiary' : 'bg-[#4ade80]'
                  }`}
                  style={{ width: `${Math.min(obligationPct, 100)}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <span className={`font-mono-data text-xs font-bold ${
                obligationPct > 35 ? 'text-error' : obligationPct > 20 ? 'text-tertiary' : 'text-[#4ade80]'
              }`}>{obligationPct.toFixed(1)}% of income</span>
              <div className="text-[9px] text-on-surface-variant">{fmt(state.monthlyIncome - totalMinPayments)} left after payments</div>
            </div>
          </div>
        </div>
      )}

      {/* Row 4: Activity Log */}
      <div className="bg-surface-container border border-outline-variant rounded overflow-hidden">
        <div className="px-3 py-2 border-b border-outline-variant bg-surface-container-high flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-fluid-14">history</span>
            <span className="text-fluid-10 text-on-surface-variant uppercase tracking-widest font-bold">Activity Log</span>
          </div>
          <span className="text-fluid-9 font-mono-data text-on-surface-variant">{(state.changelog || []).length} events</span>
        </div>
        <div className="max-h-[180px] overflow-y-auto">
          {recentChanges.length === 0 ? (
            <div className="p-4 text-center text-on-surface-variant text-xs italic">No activity yet. Changes will appear here automatically.</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="sticky top-0 bg-surface-container-high z-10">
                <tr className="text-fluid-8 uppercase tracking-wider text-outline font-bold">
                  <th className="px-3 py-1.5">Time</th>
                  <th className="px-3 py-1.5">Action</th>
                  <th className="px-3 py-1.5">Module</th>
                  <th className="px-3 py-1.5">Details</th>
                </tr>
              </thead>
              <tbody className="font-mono-data text-fluid-10">
                {recentChanges.map(c => (
                  <tr key={c.id} className="border-t border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                    <td className="px-3 py-1 text-on-surface-variant whitespace-nowrap">{new Date(c.timestamp).toLocaleTimeString()}</td>
                    <td className="px-3 py-1">
                      <span className={`px-1.5 py-0.5 rounded text-fluid-7 uppercase font-bold tracking-wider ${
                        c.action === 'ADD' ? 'bg-[#4ade80]/15 text-[#4ade80]' :
                        c.action === 'DELETE' ? 'bg-[#f87171]/15 text-[#f87171]' :
                        c.action === 'UPDATE' ? 'bg-[#60a5fa]/15 text-[#60a5fa]' :
                        c.action === 'SYNC' ? 'bg-[#a78bfa]/15 text-[#a78bfa]' :
                        'bg-surface-container-high text-on-surface-variant'
                      }`}>{c.action}</span>
                    </td>
                    <td className="px-3 py-1 text-on-surface-variant">{c.module}</td>
                    <td className="px-3 py-1 text-on-surface-variant truncate max-w-[300px]" title={c.details}>{c.details}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
