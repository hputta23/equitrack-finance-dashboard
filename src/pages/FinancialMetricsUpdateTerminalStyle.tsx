import { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';

export default function FinancialMetricsUpdateTerminalStyle() {
  const { state, updateMetrics, netWorth, totalDebt, addToast } = useFinancial();

  const [localMonthlyIncome, setLocalMonthlyIncome] = useState(state.monthlyIncome.toString());
  const [localMonthlyBurn, setLocalMonthlyBurn] = useState(state.monthlyBurn.toString());
  const [localCreditScore, setLocalCreditScore] = useState(state.creditScore.toString());

  const handleCommit = () => {
    updateMetrics({
      monthlyIncome: parseFloat(localMonthlyIncome.replace(/,/g, '')) || 0,
      monthlyBurn: parseFloat(localMonthlyBurn.replace(/,/g, '')) || 0,
      creditScore: parseInt(localCreditScore) || 0,
    });
    addToast('Metrics committed successfully');
  };

  const handleDiscard = () => {
    setLocalMonthlyIncome(state.monthlyIncome.toString());
    setLocalMonthlyBurn(state.monthlyBurn.toString());
    setLocalCreditScore(state.creditScore.toString());
    addToast('Changes discarded', 'info');
  };

  const hasChanges =
    localMonthlyIncome !== state.monthlyIncome.toString() ||
    localMonthlyBurn !== state.monthlyBurn.toString() ||
    localCreditScore !== state.creditScore.toString();

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <header className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="font-h1 text-primary uppercase tracking-tight">Manual Updates</h1>
            <p className="text-on-surface-variant font-body-base text-xs mt-1">Directly update your core numbers and balances.</p>
          </div>
        </header>

        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="material-symbols-outlined text-primary text-lg">monitoring</span>
            <h2 className="text-label-caps text-on-surface uppercase font-bold tracking-widest">Update Your Numbers</h2>
            <div className="flex-1 h-[1px] bg-outline-variant/30"></div>
          </div>
          <div className="grid grid-cols-1 gap-[2px] bg-outline-variant/20 border border-outline-variant/20">
            {/* Header Row */}
            <div className="hidden md:grid md:grid-cols-12 gap-2 bg-surface-container-high px-4 py-2 text-fluid-10 uppercase font-mono tracking-widest text-on-surface-variant">
              <div className="col-span-4">Metric</div>
              <div className="col-span-3">Current Value</div>
              <div className="col-span-5">New Value</div>
            </div>

            {/* Net Worth (Read Only) */}
            <div className="flex flex-col md:grid md:grid-cols-12 gap-2 bg-surface-container md:items-center px-4 py-3 opacity-70">
              <div className="col-span-4 font-mono-data text-xs text-on-surface">Net Worth</div>
              <div className="col-span-3 font-mono-data text-xs text-on-surface-variant">${netWorth.toLocaleString()}</div>
              <div className="col-span-5">
                <div className="w-full bg-surface-container-low border border-outline-variant py-1 px-3 text-xs font-mono-data text-outline italic">
                  Derived from Portfolio Ledger
                </div>
              </div>
            </div>

            {/* Total Debt (Read Only) */}
            <div className="flex flex-col md:grid md:grid-cols-12 gap-2 bg-surface-container md:items-center px-4 py-3 opacity-70">
              <div className="col-span-4 font-mono-data text-xs text-on-surface">Total Debt</div>
              <div className="col-span-3 font-mono-data text-xs text-on-surface-variant">${totalDebt.toLocaleString()}</div>
              <div className="col-span-5">
                <div className="w-full bg-surface-container-low border border-outline-variant py-1 px-3 text-xs font-mono-data text-outline italic">
                  Derived from Expense Ledger
                </div>
              </div>
            </div>

            {/* Monthly Income (Editable) */}
            <div className="flex flex-col md:grid md:grid-cols-12 gap-2 bg-surface-container md:items-center px-4 py-3 group hover:bg-surface-bright transition-colors">
              <div className="col-span-4 font-mono-data text-xs text-on-surface">Monthly Income</div>
              <div className="col-span-3 font-mono-data text-xs text-on-surface-variant">${state.monthlyIncome.toLocaleString()}</div>
              <div className="col-span-5 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono-data text-xs">$</span>
                <input
                  className="w-full bg-surface-container-low border border-outline-variant py-1 pl-6 pr-2 text-xs font-mono-data text-primary focus:border-primary-container focus:ring-0 outline-none"
                  type="text"
                  value={localMonthlyIncome}
                  onChange={(e) => setLocalMonthlyIncome(e.target.value)}
                />
              </div>
            </div>

            {/* Monthly Burn (Editable) */}
            <div className="flex flex-col md:grid md:grid-cols-12 gap-2 bg-surface-container md:items-center px-4 py-3 group hover:bg-surface-bright transition-colors">
              <div className="col-span-4 font-mono-data text-xs text-on-surface">Monthly Expenses</div>
              <div className="col-span-3 font-mono-data text-xs text-on-surface-variant">${state.monthlyBurn.toLocaleString()}</div>
              <div className="col-span-5 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono-data text-xs">$</span>
                <input
                  className="w-full bg-surface-container-low border border-outline-variant py-1 pl-6 pr-2 text-xs font-mono-data text-primary focus:border-primary-container focus:ring-0 outline-none"
                  type="text"
                  value={localMonthlyBurn}
                  onChange={(e) => setLocalMonthlyBurn(e.target.value)}
                />
              </div>
            </div>

            {/* Credit Score (Editable) */}
            <div className="flex flex-col md:grid md:grid-cols-12 gap-2 bg-surface-container md:items-center px-4 py-3 group hover:bg-surface-bright transition-colors">
              <div className="col-span-4 font-mono-data text-xs text-on-surface">Credit Score</div>
              <div className="col-span-3 font-mono-data text-xs text-on-surface-variant">{state.creditScore}</div>
              <div className="col-span-5">
                <input
                  className="w-full bg-surface-container-low border border-outline-variant py-1 px-2 text-xs font-mono-data text-primary focus:border-primary-container focus:ring-0 outline-none"
                  type="text"
                  value={localCreditScore}
                  onChange={(e) => setLocalCreditScore(e.target.value)}
                />
              </div>
            </div>

          </div>
        </section>
      </div>

      <aside className="w-full md:w-80 bg-surface-container border-t md:border-t-0 md:border-l border-outline-variant flex flex-col p-4 overflow-y-auto shrink-0">
        <h3 className="font-label-caps text-on-surface-variant uppercase tracking-[0.2em] mb-4 text-fluid-10">Impact Analysis</h3>
        <div className="space-y-4 mb-8">
          <div className="bg-surface-container-low p-4 border border-outline-variant glow-cyan">
            <p className="text-fluid-10 text-outline font-bold uppercase mb-1">Net Worth Projection</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono-data text-primary">${netWorth.toLocaleString()}</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 border border-outline-variant">
            <p className="text-fluid-10 text-outline font-bold uppercase mb-1">Debt-to-Worth Ratio</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono-data text-on-surface">
                {netWorth > 0 ? ((totalDebt / netWorth) * 100).toFixed(2) : '0.00'}%
              </span>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 border border-outline-variant">
            <p className="text-fluid-10 text-outline font-bold uppercase mb-1">Monthly Savings Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono-data text-primary">
                {state.monthlyIncome > 0 ? (((state.monthlyIncome - state.monthlyBurn) / state.monthlyIncome) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-fluid-10 text-on-surface-variant uppercase font-bold">Unsaved Delta</span>
            <span className={`text-fluid-10 font-mono-data ${hasChanges ? 'text-primary' : 'text-primary-fixed-dim'}`}>
              {hasChanges ? 'PENDING' : 'SYNCED'}
            </span>
          </div>
          <button
            onClick={handleCommit}
            disabled={!hasChanges}
            className={`w-full font-bold py-3 uppercase tracking-tighter text-sm flex items-center justify-center gap-2 transition-colors ${
              hasChanges ? 'bg-primary text-on-primary hover:bg-primary-container cursor-pointer' : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-sm">database</span>
            Commit Changes
          </button>
          <button
            onClick={handleDiscard}
            disabled={!hasChanges}
            className={`w-full bg-transparent border border-outline-variant font-bold py-2 uppercase tracking-tighter text-xs transition-colors ${
              hasChanges ? 'text-on-surface-variant hover:bg-surface-variant cursor-pointer' : 'text-outline cursor-not-allowed opacity-50'
            }`}
          >
            Discard Telemetry
          </button>
        </div>
      </aside>
    </div>
  );
}
