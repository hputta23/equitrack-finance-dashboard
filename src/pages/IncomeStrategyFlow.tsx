import { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';

export default function IncomeStrategyFlow() {
  const { state, exportCSV } = useFinancial();

  const [buckets, setBuckets] = useState([
    { name: 'Fixed Expenses', pct: 42, color: 'error', target: 40 },
    { name: 'Investments', pct: 35, color: 'primary', target: 35 },
    { name: 'Obligations', pct: 23, color: 'tertiary', target: 25 },
  ]);

  const grossIncome = state.monthlyIncome > 0 ? state.monthlyIncome : (state.monthlyBurn > 0 ? state.monthlyBurn / (buckets[0].pct / 100) : 0);
  const totalPct = buckets.reduce((s, b) => s + b.pct, 0);

  // Calculate Real-World Actuals
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const DEBT_CATEGORIES = ['Credit Card', 'Mortgage', 'Student Loan', 'Auto Loan', 'Personal', 'Medical', 'Rent'];
  
  const actualExpensesVolume = state.liabilities
    .filter(l => !DEBT_CATEGORIES.includes(l.category) && (l.nextPayment || '').startsWith(currentMonthPrefix))
    .reduce((s, l) => s + l.principal, 0);
  
  const actualDebtVolume = state.liabilities
    .filter(l => DEBT_CATEGORIES.includes(l.category) && l.status !== 'Paid Off')
    .reduce((s, l) => s + (l.minPayment || 0), 0);

  const bucketsWithActuals = buckets.map(b => {
    let actualVolume = 0;
    if (b.name === 'Fixed Expenses') {
      actualVolume = actualExpensesVolume;
    } else if (b.name === 'Obligations') {
      actualVolume = actualDebtVolume;
    } else {
      actualVolume = Math.max(0, grossIncome - actualExpensesVolume - actualDebtVolume);
    }
    const actualPct = grossIncome > 0 ? (actualVolume / grossIncome) * 100 : 0;
    const targetVolume = grossIncome * b.pct / 100;
    return { ...b, actualVolume, actualPct, targetVolume };
  });

  const updateBucket = (index: number, pct: number) => {
    setBuckets(prev => prev.map((b, i) => i === index ? { ...b, pct } : b));
  };

  const getStatus = (actualPct: number, targetPct: number) => {
    const diff = actualPct - targetPct;
    if (diff > 5) return { label: 'OVR', cls: 'bg-error-container text-on-error-container' };
    if (diff < -5) return { label: 'UND', cls: 'bg-surface-container-high border border-outline-variant text-on-surface-variant' };
    if (Math.abs(diff) > 2) return { label: 'WRN', cls: 'bg-tertiary-container text-on-tertiary-container' };
    return { label: 'NOM', cls: 'bg-primary-fixed/20 text-primary border border-primary/30' };
  };

  return (
    <div className="flex-1 overflow-auto p-3 sm:p-container-padding flex flex-col md:flex-row gap-gutter bg-surface-dim h-full">
      {/* Center Column */}
      <div className="flex-1 flex flex-col gap-gutter">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h1 className="font-h1 text-h1 text-on-surface">Income Strategy</h1>
            <p className="font-body text-body text-on-surface-variant">Real-time allocation flows & distribution targets.</p>
          </div>
          <button onClick={exportCSV} className="px-3 py-1 bg-surface-container border border-outline-variant text-on-surface text-xs font-mono-data rounded hover:bg-surface-container-high transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-fluid-14">download</span> EXPORT CSV
          </button>
        </div>

        {/* Flow Visualization */}
        <div className="bg-surface border border-outline-variant rounded-DEFAULT p-4 flex-1 min-h-[300px] flex flex-col relative overflow-hidden">
          <div className="absolute top-4 left-4 font-label-caps text-label-caps text-on-surface-variant z-10">INCOME FLOW TOPOLOGY</div>
          <div className="flex-1 flex items-center justify-between mt-6 px-8 relative">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 800 300">
              <path fill="none" strokeWidth="3" opacity="0.4" className="sankey-path" d="M 220,150 C 400,150 450,50 580,50" stroke="#ffb4ab"></path>
              <path fill="none" strokeWidth="3" opacity="0.4" className="sankey-path" d="M 220,150 C 400,150 450,150 580,150" stroke="#7bd0ff"></path>
              <path fill="none" strokeWidth="3" opacity="0.4" className="sankey-path" d="M 220,150 C 400,150 450,250 580,250" stroke="#ffc176"></path>
            </svg>
            {/* Source */}
            <div className="z-10 w-48 bg-surface-container border border-outline-variant rounded p-3 flex flex-col shadow-[0_0_15px_rgba(123,208,255,0.1)] border-l-2 border-l-primary">
              <div className="text-fluid-10 text-on-surface-variant uppercase tracking-wider mb-1">Gross Income (Mo)</div>
              <div className="font-mono-data text-fluid-18 text-primary">${grossIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            {/* Nodes */}
            <div className="z-10 flex flex-col gap-6 w-48">
              {buckets.map((b) => (
                <div key={b.name} className={`bg-surface-container border border-outline-variant rounded p-2 flex flex-col border-l-2 border-l-${b.color}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-fluid-10 text-on-surface-variant uppercase tracking-wider">{b.name}</span>
                    <span className={`font-mono-data text-fluid-10 text-${b.color}`}>{b.pct}%</span>
                  </div>
                  <div className="font-mono-data text-fluid-14 text-on-surface">
                    ${(grossIncome * b.pct / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* #3: Dynamic Distribution Breakdown Table */}
        <div className="bg-surface border border-outline-variant rounded-DEFAULT flex flex-col h-64 overflow-hidden">
          <div className="p-3 border-b border-outline-variant bg-surface-container-high flex justify-between items-center">
            <span className="font-label-caps text-label-caps text-on-surface-variant">DISTRIBUTION BREAKDOWN</span>
            <span className="material-symbols-outlined text-fluid-16 text-outline">filter_list</span>
          </div>
          <div className="overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface-container-highest z-10">
                <tr>
                  <th className="font-label-caps text-label-caps text-on-surface-variant py-2 px-3 border-b border-outline-variant">BUCKET</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant py-2 px-3 border-b border-outline-variant">TARGET %</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant py-2 px-3 border-b border-outline-variant">ACTUAL %</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant py-2 px-3 border-b border-outline-variant text-right">VOLUME ($)</th>
                  <th className="font-label-caps text-label-caps text-on-surface-variant py-2 px-3 border-b border-outline-variant text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="font-mono-data text-mono-data text-on-surface">
                {bucketsWithActuals.map(b => {
                  const status = getStatus(b.actualPct, b.pct);
                  return (
                    <tr key={b.name} className="border-b border-surface-container hover:bg-surface-container-low transition-colors h-row-height-condensed">
                      <td className="py-1 px-3 flex items-center gap-2"><div className={`w-2 h-2 bg-${b.color} rounded-sm`}></div> {b.name}</td>
                      <td className="py-1 px-3">{b.pct.toFixed(2)}%</td>
                      <td className={`py-1 px-3 ${b.actualPct > b.pct + 5 ? 'text-error' : b.actualPct < b.pct - 5 ? 'text-tertiary' : ''}`}>{b.actualPct.toFixed(2)}%</td>
                      <td className="py-1 px-3 text-right">${b.actualVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-1 px-3 text-center"><span className={`px-1.5 py-0.5 text-fluid-9 uppercase tracking-wider rounded ${status.cls}`}>{status.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Panel: Manual Allocation */}
      <div className="w-full md:w-80 bg-surface border border-outline-variant rounded-DEFAULT flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.5)] shrink-0">
        <div className="p-4 border-b border-outline-variant flex items-center gap-2 bg-surface-container-highest">
          <span className="material-symbols-outlined text-primary text-fluid-18">tune</span>
          <h2 className="font-h2 text-h2 text-on-surface">Manual Allocation</h2>
        </div>
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-6">
          <p className="font-body text-body text-on-surface-variant text-xs">Adjust target distribution ratios. All values are dynamically calculated from your monthly income of ${state.monthlyIncome.toLocaleString() || '0'}.</p>

          {buckets.map((b, i) => (
            <div key={b.name} className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="font-label-caps text-label-caps text-on-surface">{b.name.toUpperCase()}</label>
                <span className={`font-mono-data text-mono-data text-${b.color}`}>{b.pct}%</span>
              </div>
              <input
                className={`w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-${b.color}`}
                max="100" min="0" type="range" value={b.pct}
                onChange={e => updateBucket(i, Number(e.target.value))}
              />
              <div className="flex justify-between text-fluid-10 font-mono-data text-outline">
                <span>0</span>
                <span>${(grossIncome * b.pct / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          ))}

          <div className="mt-auto pt-4 border-t border-outline-variant">
            <div className="flex justify-between items-center mb-4">
              <span className="font-label-caps text-label-caps text-on-surface-variant">TOTAL ALLOCATED</span>
              <span className={`font-mono-data text-mono-data ${totalPct === 100 ? 'text-primary' : 'text-error'}`}>{totalPct}%</span>
            </div>
            <button className={`w-full py-2 font-label-caps text-label-caps rounded transition-colors ${totalPct === 100 ? 'bg-primary text-on-primary hover:bg-primary-fixed active:shadow-[inset_0_0_8px_rgba(0,0,0,0.3)] shadow-[0_0_10px_rgba(142,213,255,0.2)]' : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'}`} disabled={totalPct !== 100}>
              COMMIT CHANGES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
