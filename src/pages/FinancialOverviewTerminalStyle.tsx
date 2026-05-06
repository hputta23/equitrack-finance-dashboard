import { Link } from 'react-router-dom';
import { useFinancial } from '../context/FinancialContext';
import { useMemo } from 'react';

export default function FinancialOverviewTerminalStyle() {
  const { state, netWorth, totalDebt, totalAssets } = useFinancial();

  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);
  const monthlySavings = state.monthlyIncome - state.monthlyBurn;
  const savingsRate = state.monthlyIncome > 0 ? ((monthlySavings / state.monthlyIncome) * 100).toFixed(1) : '0.0';
  const debtRatio = netWorth > 0 ? ((totalDebt / netWorth) * 100).toFixed(1) : (totalDebt > 0 ? '∞' : '0.0');
  const tradePnl = (state.trades || []).reduce((s, t) => s + t.pnl, 0);
  const tradeWins = (state.trades || []).filter(t => t.pnl > 0).length;
  const tradeTotal = (state.trades || []).length;
  const winRate = tradeTotal > 0 ? ((tradeWins / tradeTotal) * 100).toFixed(1) : '—';
  const targetProgress = state.userProfile.targetNetWorth > 0 ? Math.min(Math.max((netWorth / state.userProfile.targetNetWorth) * 100, 0), 100) : 0;

  // Recent changelog entries
  const recentChanges = useMemo(() => (state.changelog || []).slice(0, 8), [state.changelog]);

  // Data flow nodes for the workflow visualization
  const flowNodes = [
    { label: 'Income', value: fmt(state.monthlyIncome), icon: 'payments', route: '/strategy', color: 'text-[#4ade80]', sub: '/mo' },
    { label: 'Spending', value: fmt(state.monthlyBurn), icon: 'shopping_cart', route: '/expenses', color: 'text-[#f87171]', sub: '/mo' },
    { label: 'Assets', value: fmt(totalAssets), icon: 'account_balance_wallet', route: '/portfolio', color: 'text-[#60a5fa]', sub: `${state.assets.length} items` },
    { label: 'Debts', value: fmt(totalDebt), icon: 'credit_card', route: '/expenses', color: 'text-[#fbbf24]', sub: `${state.liabilities.length} accounts` },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 p-4 h-full overflow-y-auto">
      {/* Palantir-style header */}
      <header className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface mb-0.5 uppercase tracking-tight">Dashboard</h2>
          <p className="font-mono-data text-[10px] text-on-surface-variant uppercase tracking-widest">
            Your finances at a glance • Updated {new Date().toLocaleTimeString()}
          </p>
        </div>
      </header>

      {/* Row 1: Key Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-[2px] bg-outline-variant/20 mb-4 border border-outline-variant/30">
        {[
          { label: 'NET WORTH', value: fmt(netWorth), delta: netWorth >= 0 ? '▲' : '▼', color: netWorth >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]' },
          { label: 'MONTHLY SAVINGS', value: fmt(monthlySavings), delta: `${savingsRate}% saved`, color: monthlySavings >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]' },
          { label: 'TRADE PROFITS', value: `${tradePnl >= 0 ? '+' : ''}${fmt(tradePnl)}`, delta: `${winRate}% win rate`, color: tradePnl >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]' },
          { label: 'CREDIT SCORE', value: state.creditScore.toString(), delta: `/ 850`, color: 'text-on-surface' },
          { label: 'DEBT RATIO', value: `${debtRatio}%`, delta: 'of net worth', color: Number(debtRatio) > 60 ? 'text-[#f87171]' : 'text-[#4ade80]' },
        ].map(m => (
          <div key={m.label} className="bg-surface-container p-3 flex flex-col">
            <span className="text-[8px] text-on-surface-variant uppercase tracking-widest mb-1">{m.label}</span>
            <span className={`font-mono-data text-lg font-bold ${m.color} leading-tight`}>{m.value}</span>
            <span className="text-[9px] text-on-surface-variant mt-0.5">{m.delta}</span>
          </div>
        ))}
      </div>

      {/* Row 2: Workflow Data Flow + Target Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
        {/* Data Flow Pipeline */}
        <div className="lg:col-span-2 bg-surface-container border border-outline-variant rounded overflow-hidden">
          <div className="px-3 py-2 border-b border-outline-variant bg-surface-container-high flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[14px]">device_hub</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Money Flow</span>
            <span className="ml-auto w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
          </div>
          <div className="p-4">
            {/* Flow visualization */}
            <div className="flex items-center justify-between gap-2 relative">
              {flowNodes.map((node, i) => (
                <Link key={node.label} to={node.route} className="flex-1 group">
                  <div className="bg-surface border border-outline-variant rounded p-3 hover:border-primary/50 transition-all hover:shadow-[0_0_12px_rgba(123,208,255,0.1)] relative">
                    {i < flowNodes.length - 1 && (
                      <div className="absolute -right-[10px] top-1/2 -translate-y-1/2 z-10 text-outline-variant text-xs">→</div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`material-symbols-outlined text-[16px] ${node.color}`}>{node.icon}</span>
                      <span className="text-[9px] text-on-surface-variant uppercase tracking-wider">{node.label}</span>
                    </div>
                    <div className={`font-mono-data text-sm font-bold ${node.color}`}>{node.value}</div>
                    <div className="text-[8px] text-on-surface-variant mt-1">{node.sub}</div>
                  </div>
                </Link>
              ))}
            </div>
            {/* Flow arrow bar */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-[2px] bg-gradient-to-r from-[#4ade80] via-[#60a5fa] to-[#f87171] rounded opacity-40"></div>
              <span className="text-[8px] text-on-surface-variant uppercase tracking-wider">data flow</span>
              <div className="flex-1 h-[2px] bg-gradient-to-r from-[#f87171] via-[#fbbf24] to-[#4ade80] rounded opacity-40"></div>
            </div>
            {/* Net result */}
            <div className="mt-3 bg-surface-container-high border border-outline-variant/50 rounded p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">hub</span>
                <span className="text-[9px] text-on-surface-variant uppercase tracking-wider">Net Position</span>
              </div>
              <div className={`font-mono-data text-lg font-bold ${netWorth >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>{fmt(netWorth)}</div>
              <div className="text-[9px] text-on-surface-variant">
                {state.assets.length} assets → {state.liabilities.length} liabilities → {fmt(monthlySavings)}/mo surplus
              </div>
            </div>
          </div>
        </div>

        {/* Target Progress + Quick Stats */}
        <div className="flex flex-col gap-3">
          {/* Goal Progress */}
          {state.userProfile.targetNetWorth > 0 && (
            <div className="bg-surface-container border border-outline-variant rounded overflow-hidden">
              <div className="px-3 py-2 border-b border-outline-variant bg-surface-container-high flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[14px]">flag</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Goal Tracker</span>
              </div>
              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] text-on-surface-variant uppercase">Progress</span>
                  <span className="font-mono-data text-xs text-primary">{targetProgress.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${targetProgress}%` }} />
                </div>
                <div className="flex justify-between text-[9px] font-mono-data text-on-surface-variant">
                  <span>{fmt(netWorth)}</span>
                  <span>{fmt(state.userProfile.targetNetWorth)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Navigation Tiles */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            {[
              { label: 'My Assets', icon: 'account_balance_wallet', route: '/portfolio', stat: `${state.assets.length} items` },
              { label: 'My Expenses', icon: 'receipt_long', route: '/expenses', stat: `${state.liabilities.length} tracked` },
              { label: 'Trade Log', icon: 'candlestick_chart', route: '/trades', stat: `${tradeTotal} trades` },
              { label: 'Budget', icon: 'savings', route: '/strategy', stat: fmt(state.monthlyIncome) },
            ].map(t => (
              <Link key={t.label} to={t.route} className="bg-surface-container border border-outline-variant rounded p-3 hover:bg-surface-container-high hover:border-primary/30 transition-all group flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors">{t.icon}</span>
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">{t.label}</span>
                </div>
                <span className="font-mono-data text-[10px] text-on-surface-variant">{t.stat}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Version History (Audit Log) */}
      <div className="bg-surface-container border border-outline-variant rounded overflow-hidden">
        <div className="px-3 py-2 border-b border-outline-variant bg-surface-container-high flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[14px]">history</span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Activity Log</span>
          </div>
          <span className="text-[9px] font-mono-data text-on-surface-variant">{(state.changelog || []).length} events</span>
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {recentChanges.length === 0 ? (
            <div className="p-4 text-center text-on-surface-variant text-xs italic">No activity yet. Changes will be logged here automatically.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface-container-high z-10">
                <tr className="text-[8px] uppercase tracking-wider text-outline font-bold">
                  <th className="px-3 py-1.5">Time</th>
                  <th className="px-3 py-1.5">Action</th>
                  <th className="px-3 py-1.5">Module</th>
                  <th className="px-3 py-1.5">Details</th>
                </tr>
              </thead>
              <tbody className="font-mono-data text-[10px]">
                {recentChanges.map(c => (
                  <tr key={c.id} className="border-t border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                    <td className="px-3 py-1 text-on-surface-variant whitespace-nowrap">{new Date(c.timestamp).toLocaleTimeString()}</td>
                    <td className="px-3 py-1">
                      <span className={`px-1.5 py-0.5 rounded text-[7px] uppercase font-bold tracking-wider ${
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
          )}
        </div>
      </div>
    </div>
  );
}
