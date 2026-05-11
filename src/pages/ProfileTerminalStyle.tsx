import { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import type { ThemeMode } from '../context/FinancialContext';

export default function ProfileTerminalStyle() {
  const { state, updateMetrics, syncToGoogleSheets, logout, addToast, setThemeMode } = useFinancial();
  const [sheetUrl, setSheetUrl] = useState(state.googleSheetUrl || '');
  const [isSyncing, setIsSyncing] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(state.userProfile.name);
  const [profileTarget, setProfileTarget] = useState(state.userProfile.targetNetWorth.toString());
  const [profileIncome, setProfileIncome] = useState(state.monthlyIncome.toString());
  const [profileBurn, setProfileBurn] = useState(state.monthlyBurn.toString());
  const [profileCredit, setProfileCredit] = useState(state.creditScore.toString());

  const handleSaveSettings = () => {
    updateMetrics({ googleSheetUrl: sheetUrl });
    addToast('Connection settings saved locally.');
  };

  const handleForceSync = async () => {
    if (!sheetUrl) { addToast('Please provide a Google Apps Script URL first.', 'error'); return; }
    setIsSyncing(true);
    const success = await syncToGoogleSheets();
    setIsSyncing(false);
    if (!success) addToast('Sync failed. Check console for details.', 'error');
  };

  const handleSaveProfile = () => {
    updateMetrics({
      userProfile: { name: profileName, targetNetWorth: Number(profileTarget) || 0 },
      monthlyIncome: Number(profileIncome) || 0,
      monthlyBurn: Number(profileBurn) || 0,
      creditScore: Number(profileCredit) || 0,
    });
    setEditingProfile(false);
    addToast('Profile updated successfully!');
  };

  const themes: { mode: ThemeMode; label: string; desc: string; icon: string }[] = [
    { mode: 'dark', label: 'Dark', desc: 'Default dark mode with colors', icon: 'dark_mode' },
    { mode: 'light', label: 'Light', desc: 'Bright mode for daytime', icon: 'light_mode' },
    { mode: 'monochrome', label: 'Black & White', desc: 'Desaturated monochrome', icon: 'contrast' },
  ];

  return (
    <div className="flex-1 p-margin flex flex-col gap-margin bg-background min-h-full overflow-y-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface mb-unit uppercase font-mono tracking-tight">My Profile</h1>
          <p className="font-body-base text-body-base text-on-surface-variant">Manage your info, appearance, connections, and account.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">

        {/* User Information */}
        <div className="bg-surface-container border border-outline-variant p-md md:col-span-2">
          <div className="flex items-center justify-between mb-md border-b border-outline-variant pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">badge</span>
              <h2 className="font-h3 text-h3 text-on-surface font-mono uppercase">Personal Information</h2>
            </div>
            <button
              onClick={() => editingProfile ? handleSaveProfile() : setEditingProfile(true)}
              className="px-3 py-1 text-sm font-mono uppercase tracking-wider bg-primary/10 text-primary border border-primary hover:bg-primary/20 transition-colors"
            >
              {editingProfile ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Full Name', value: state.userProfile.name || '—', editValue: profileName, setter: setProfileName, type: 'text' },
              { label: 'Target Net Worth', value: `$${state.userProfile.targetNetWorth.toLocaleString()}`, editValue: profileTarget, setter: setProfileTarget, type: 'number' },
              { label: 'Monthly Income', value: `$${state.monthlyIncome.toLocaleString()}`, editValue: profileIncome, setter: setProfileIncome, type: 'number' },
              { label: 'Monthly Expenses', value: `$${state.monthlyBurn.toLocaleString()}`, editValue: profileBurn, setter: setProfileBurn, type: 'number' },
              { label: 'Credit Score', value: state.creditScore.toString(), editValue: profileCredit, setter: setProfileCredit, type: 'number' },
            ].map(f => (
              <div key={f.label} className="space-y-1">
                <label className="font-label-caps text-fluid-10 text-on-surface-variant uppercase tracking-wider">{f.label}</label>
                {editingProfile ? (
                  <input type={f.type} className="w-full bg-surface border border-outline-variant p-2 font-mono text-sm text-on-surface focus:border-primary outline-none" value={f.editValue} onChange={e => f.setter(e.target.value)} />
                ) : (
                  <div className="font-mono text-on-surface text-sm p-2 bg-surface-container-low border border-transparent">{f.value}</div>
                )}
              </div>
            ))}
          </div>

          {editingProfile && (
            <div className="mt-4 flex gap-2">
              <button onClick={() => setEditingProfile(false)} className="px-3 py-1 text-sm font-mono uppercase tracking-wider text-on-surface-variant border border-outline-variant hover:bg-surface-container transition-colors">Cancel</button>
            </div>
          )}
        </div>

        {/* Theme / Appearance Settings */}
        <div className="bg-surface-container border border-outline-variant p-md md:col-span-2">
          <div className="flex items-center gap-2 mb-md border-b border-outline-variant pb-2">
            <span className="material-symbols-outlined text-primary">palette</span>
            <h2 className="font-h3 text-h3 text-on-surface font-mono uppercase">Appearance</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themes.map(t => (
              <button
                key={t.mode}
                onClick={() => setThemeMode(t.mode)}
                className={`p-4 border rounded transition-all text-left ${
                  state.themeMode === t.mode
                    ? 'border-primary bg-primary/10 shadow-[0_0_12px_rgba(123,208,255,0.15)]'
                    : 'border-outline-variant hover:bg-surface-container-high hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-fluid-20">{t.icon}</span>
                  <span className="font-mono text-sm text-on-surface uppercase font-bold tracking-wider">{t.label}</span>
                  {state.themeMode === t.mode && (
                    <span className="ml-auto text-primary material-symbols-outlined text-fluid-16">check_circle</span>
                  )}
                </div>
                <p className="text-fluid-11 text-on-surface-variant">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Connection Settings */}
        <div className="bg-surface-container border border-outline-variant p-md">
          <div className="flex items-center gap-2 mb-md border-b border-outline-variant pb-2">
            <span className="material-symbols-outlined text-primary">cloud_sync</span>
            <h2 className="font-h3 text-h3 text-on-surface font-mono uppercase">Google Sheets Link</h2>
          </div>
          <p className="text-sm text-on-surface-variant mb-3">
            Sync trades & version history to your Google Sheet.
          </p>
          <div className="space-y-4">
            <div>
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-1">Web App URL</label>
              <input type="text" placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-surface border border-outline-variant p-2 font-mono text-sm text-on-surface focus:border-primary outline-none"
                value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} />
            </div>
            <div className="text-fluid-10 text-on-surface-variant bg-surface-container-low p-2 rounded border border-outline-variant/30">
              <span className="font-bold text-primary">Sheet 1:</span> Trading Journal data &nbsp;|&nbsp; <span className="font-bold text-primary">Sheet 2:</span> Version history (changelog)
            </div>
            <div className="flex gap-4">
              <button onClick={handleSaveSettings} className="bg-primary/10 text-primary border border-primary px-4 py-2 text-sm font-mono uppercase tracking-wider hover:bg-primary/20 transition-colors">Save URL</button>
              <button onClick={handleForceSync} disabled={isSyncing} className="bg-primary text-on-primary px-4 py-2 text-sm font-mono uppercase tracking-wider hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-50 flex items-center gap-2">
                {isSyncing ? <span className="material-symbols-outlined animate-spin text-fluid-16">refresh</span> : <span className="material-symbols-outlined text-fluid-16">sync</span>}
                Sync Now
              </button>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-surface-container border border-outline-variant p-md">
          <div className="flex items-center gap-2 mb-md border-b border-outline-variant pb-2">
            <span className="material-symbols-outlined text-primary">security</span>
            <h2 className="font-h3 text-h3 text-on-surface font-mono uppercase">Security Center</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-surface-variant border-dashed">
              <span className="font-label-caps text-secondary uppercase">Access Level</span>
              <span className="font-mono text-primary text-sm bg-primary/10 px-2 py-1 border border-primary/20">Administrator</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-surface-variant border-dashed">
              <span className="font-label-caps text-secondary uppercase">Session Status</span>
              <span className="font-mono text-on-surface text-sm flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Active
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-surface-variant border-dashed">
              <span className="font-label-caps text-secondary uppercase">Theme</span>
              <span className="font-mono text-on-surface text-sm capitalize">{state.themeMode || 'dark'}</span>
            </div>
            <div className="pt-4">
              <button onClick={logout} className="w-full bg-error-container/20 text-error border border-error px-4 py-3 text-sm font-mono uppercase tracking-wider hover:bg-error hover:text-on-error transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-fluid-18">logout</span> Terminate Session
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
