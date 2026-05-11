import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancial } from '../context/FinancialContext';
import type { Asset, Liability } from '../context/FinancialContext';

export default function OnboardingWizardTerminalStyle() {
  const { updateMetrics, addAsset, addLiability, syncToGoogleSheets, addToast } = useFinancial();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 State
  const [name, setName] = useState('');
  const [targetNetWorth, setTargetNetWorth] = useState('');

  // Step 2 State
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyBurn, setMonthlyBurn] = useState('');
  const [creditScore, setCreditScore] = useState('');

  // Step 3 State (Assets — multi-item)
  const [pendingAssets, setPendingAssets] = useState<Omit<Asset, 'id'>[]>([]);
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('CASH_EQUIVALENT');
  const [assetValue, setAssetValue] = useState('');

  // Step 4 State (Liabilities — multi-item)
  const [pendingLiabilities, setPendingLiabilities] = useState<Omit<Liability, 'id'>[]>([]);
  const [liabilityName, setLiabilityName] = useState('');
  const [liabilityCategory, setLiabilityCategory] = useState('Personal');
  const [liabilityPrincipal, setLiabilityPrincipal] = useState('');
  const [liabilityApr, setLiabilityApr] = useState('');

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const addPendingAsset = () => {
    if (!assetName || !assetValue) return;
    setPendingAssets(prev => [...prev, {
      name: assetName, category: assetCategory, quantity: 1, unitPrice: Number(assetValue)
    }]);
    setAssetName(''); setAssetValue(''); setAssetCategory('CASH_EQUIVALENT');
  };

  const removePendingAsset = (index: number) => {
    setPendingAssets(prev => prev.filter((_, i) => i !== index));
  };

  const addPendingLiability = () => {
    if (!liabilityName || !liabilityPrincipal) return;
    setPendingLiabilities(prev => [...prev, {
      name: liabilityName, category: liabilityCategory,
      principal: Number(liabilityPrincipal), apr: Number(liabilityApr) || 0,
      nextPayment: 'Next Month', status: 'Active', minPayment: 0,
    }]);
    setLiabilityName(''); setLiabilityPrincipal(''); setLiabilityApr(''); setLiabilityCategory('Personal');
  };

  const removePendingLiability = (index: number) => {
    setPendingLiabilities(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);

    updateMetrics({
      userProfile: { name, targetNetWorth: Number(targetNetWorth) || 0 },
      monthlyIncome: Number(monthlyIncome) || 0,
      monthlyBurn: Number(monthlyBurn) || 0,
      creditScore: Number(creditScore) || 0,
      hasCompletedOnboarding: true,
    });

    pendingAssets.forEach(a => addAsset(a));
    pendingLiabilities.forEach(l => addLiability(l));

    await syncToGoogleSheets();
    setIsSubmitting(false);
    addToast('Setup complete! Welcome to 2026Track.', 'success');
    navigate('/');
  };

  const progressPct = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body overflow-x-hidden flex items-center justify-center p-4">
      <main className="w-full max-w-4xl bg-surface-container-lowest border border-outline-variant flex flex-col shadow-2xl min-h-[600px]">
        {/* Header */}
        <header className="px-margin py-md border-b border-surface-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary">account_balance</span>
            <h1 className="font-h3 text-h3 text-on-surface tracking-tight uppercase">2026Track Initialization</h1>
          </div>
          <div className="font-mono text-sm text-on-surface-variant flex gap-2">
            <span className={step >= 1 ? 'text-primary font-bold' : ''}>1. Profile</span>
            <span className={step >= 2 ? 'text-primary font-bold' : ''}>2. Telemetry</span>
            <span className={step >= 3 ? 'text-primary font-bold' : ''}>3. Assets</span>
            <span className={step >= 4 ? 'text-primary font-bold' : ''}>4. Debts</span>
          </div>
        </header>

        {/* #10: Progress Bar */}
        <div className="h-1 bg-surface-container-high relative">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Content */}
        <section className="p-margin flex flex-col gap-xl flex-1">
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="font-h2 text-h2 text-on-surface mb-xs">User Profile</h2>
              <p className="font-body-base text-body-base text-on-surface-variant mb-md">
                Establish your identity and primary financial target.
              </p>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="font-label-caps text-secondary uppercase">Full Name or Alias</label>
                  <input type="text" className="w-full bg-surface border border-outline-variant p-3 font-mono text-on-surface focus:border-primary outline-none" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-secondary uppercase">Target Net Worth ($)</label>
                  <input type="number" className="w-full bg-surface border border-outline-variant p-3 font-mono text-on-surface focus:border-primary outline-none" value={targetNetWorth} onChange={e => setTargetNetWorth(e.target.value)} placeholder="e.g. 1000000" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="font-h2 text-h2 text-on-surface mb-xs">Basic Telemetry</h2>
              <p className="font-body-base text-body-base text-on-surface-variant mb-md">
                Enter baseline metrics used for forecasting.
              </p>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="font-label-caps text-secondary uppercase">Monthly Income ($)</label>
                  <input type="number" className="w-full bg-surface border border-outline-variant p-3 font-mono text-on-surface focus:border-primary outline-none" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} placeholder="e.g. 8000" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-secondary uppercase">Estimated Monthly Expenses ($)</label>
                  <input type="number" className="w-full bg-surface border border-outline-variant p-3 font-mono text-on-surface focus:border-primary outline-none" value={monthlyBurn} onChange={e => setMonthlyBurn(e.target.value)} placeholder="e.g. 4000" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-secondary uppercase">Credit Score</label>
                  <input type="number" className="w-full bg-surface border border-outline-variant p-3 font-mono text-on-surface focus:border-primary outline-none" value={creditScore} onChange={e => setCreditScore(e.target.value)} placeholder="e.g. 750" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="font-h2 text-h2 text-on-surface mb-xs">Initial Asset Ledger</h2>
              <p className="font-body-base text-body-base text-on-surface-variant mb-md">
                Add your assets to start your portfolio. <br/>
                <span className="text-primary italic">You can skip this and add detailed assets later in the Portfolio tab.</span>
              </p>

              {/* Pending assets list */}
              {pendingAssets.length > 0 && (
                <div className="mb-4 border border-outline-variant">
                  <div className="bg-surface-container-high px-4 py-2 text-fluid-10 font-bold text-outline uppercase tracking-wider flex justify-between">
                    <span>Queued Assets ({pendingAssets.length})</span>
                    <span>Total: ${pendingAssets.reduce((s, a) => s + a.unitPrice, 0).toLocaleString()}</span>
                  </div>
                  {pendingAssets.map((a, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2 bg-surface-container border-t border-outline-variant/30 font-mono text-sm">
                      <span className="text-on-surface">{a.name}</span>
                      <span className="text-on-surface-variant">{a.category}</span>
                      <span className="text-primary">${a.unitPrice.toLocaleString()}</span>
                      <button onClick={() => removePendingAsset(i)} className="text-error text-xs hover:text-on-error transition-colors">Remove</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4 max-w-md bg-surface-container p-4 border border-outline-variant">
                <div className="space-y-2">
                  <label className="font-label-caps text-secondary uppercase">Asset Name</label>
                  <input type="text" className="w-full bg-surface border border-outline-variant p-3 font-mono text-on-surface focus:border-primary outline-none" value={assetName} onChange={e => setAssetName(e.target.value)} placeholder="e.g. Checking Account" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-secondary uppercase">Asset Class</label>
                  <select className="w-full bg-surface border border-outline-variant p-3 font-mono text-on-surface focus:border-primary outline-none" value={assetCategory} onChange={e => setAssetCategory(e.target.value)}>
                    <option value="CASH_EQUIVALENT">Cash Equivalent</option>
                    <option value="EQUITIES">Equities</option>
                    <option value="CRYPTOCURRENCY">Cryptocurrency</option>
                    <option value="REAL_ESTATE">Real Estate</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-secondary uppercase">Total Value ($)</label>
                  <input type="number" className="w-full bg-surface border border-outline-variant p-3 font-mono text-on-surface focus:border-primary outline-none" value={assetValue} onChange={e => setAssetValue(e.target.value)} placeholder="e.g. 15000" />
                </div>
                <button
                  onClick={addPendingAsset}
                  disabled={!assetName || !assetValue}
                  className="px-4 py-2 bg-primary/10 text-primary border border-primary font-mono text-sm uppercase tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-fluid-16">add</span>
                  Add Another Asset
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="font-h2 text-h2 text-on-surface mb-xs">Initial Debt Ledger</h2>
              <p className="font-body-base text-body-base text-on-surface-variant mb-md">
                Add your liabilities (Mortgage, Student Loan, Credit Cards, etc). <br/>
                <span className="text-primary italic">You can skip this and add detailed debts later in the Expenses tab.</span>
              </p>

              {/* Pending liabilities list */}
              {pendingLiabilities.length > 0 && (
                <div className="mb-4 border border-outline-variant">
                  <div className="bg-surface-container-high px-4 py-2 text-fluid-10 font-bold text-outline uppercase tracking-wider flex justify-between">
                    <span>Queued Liabilities ({pendingLiabilities.length})</span>
                    <span>Total: ${pendingLiabilities.reduce((s, l) => s + l.principal, 0).toLocaleString()}</span>
                  </div>
                  {pendingLiabilities.map((l, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2 bg-surface-container border-t border-outline-variant/30 font-mono text-sm">
                      <span className="text-on-surface">{l.name}</span>
                      <span className="text-on-surface-variant">{l.apr}% APR</span>
                      <span className="text-error">${l.principal.toLocaleString()}</span>
                      <button onClick={() => removePendingLiability(i)} className="text-error text-xs hover:text-on-error transition-colors">Remove</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4 max-w-md bg-surface-container p-4 border border-outline-variant">
                <div className="space-y-2">
                  <label className="font-label-caps text-secondary uppercase">Liability Name</label>
                  <input type="text" className="w-full bg-surface border border-outline-variant p-3 font-mono text-on-surface focus:border-primary outline-none" value={liabilityName} onChange={e => setLiabilityName(e.target.value)} placeholder="e.g. Student Loan" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-secondary uppercase">Category</label>
                  <select className="w-full bg-surface border border-outline-variant p-3 font-mono text-on-surface focus:border-primary outline-none" value={liabilityCategory} onChange={e => setLiabilityCategory(e.target.value)}>
                    <option value="Personal">Personal Loan</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Mortgage">Mortgage</option>
                    <option value="Student Loan">Student Loan</option>
                    <option value="Auto Loan">Auto Loan</option>
                    <option value="Medical">Medical</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-label-caps text-secondary uppercase">Principal Balance ($)</label>
                    <input type="number" className="w-full bg-surface border border-outline-variant p-3 font-mono text-on-surface focus:border-primary outline-none" value={liabilityPrincipal} onChange={e => setLiabilityPrincipal(e.target.value)} placeholder="e.g. 25000" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-caps text-secondary uppercase">Interest Rate (APR %)</label>
                    <input type="number" className="w-full bg-surface border border-outline-variant p-3 font-mono text-on-surface focus:border-primary outline-none" value={liabilityApr} onChange={e => setLiabilityApr(e.target.value)} placeholder="e.g. 5.5" />
                  </div>
                </div>
                <button
                  onClick={addPendingLiability}
                  disabled={!liabilityName || !liabilityPrincipal}
                  className="px-4 py-2 bg-primary/10 text-primary border border-primary font-mono text-sm uppercase tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-fluid-16">add</span>
                  Add Another Liability
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="p-margin border-t border-surface-variant bg-surface-container-low flex justify-between items-center">
          <div>
            {step > 1 && (
              <button onClick={prevStep} className="px-4 py-2 text-on-surface-variant hover:text-on-surface font-mono uppercase tracking-wider text-sm transition-colors">
                Back
              </button>
            )}
          </div>
          <div className="flex gap-4">
            {step >= 3 && step < 4 && (
              <button onClick={nextStep} className="px-4 py-2 border border-outline-variant text-on-surface font-mono text-sm uppercase tracking-wider hover:bg-surface-container transition-colors">
                Skip for now
              </button>
            )}
            {step === 4 && (
              <button onClick={handleFinish} disabled={isSubmitting} className="px-4 py-2 border border-outline-variant text-on-surface font-mono text-sm uppercase tracking-wider hover:bg-surface-container transition-colors">
                Skip & Finish
              </button>
            )}
            {step < 4 ? (
              <button onClick={nextStep} className="px-6 py-2 bg-primary text-on-primary font-mono text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors">
                Continue
              </button>
            ) : (
              <button onClick={handleFinish} disabled={isSubmitting} className="px-6 py-2 bg-primary text-on-primary font-mono text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-2">
                {isSubmitting ? 'Saving...' : 'Complete Setup'}
                <span className="material-symbols-outlined text-fluid-18">rocket_launch</span>
              </button>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}
