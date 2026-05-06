import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface Asset {
  id: string; name: string; category: string; quantity: number; unitPrice: number;
}
export interface Liability {
  id: string; name: string; category: string; principal: number; apr: number; nextPayment: string; status: string;
}
export interface Trade {
  id: string; date: string; ticker: string; companyName: string; direction: 'LONG' | 'SHORT';
  shares: number; entryPrice: number; exitPrice: number; fees: number; notes: string; tags: string[];
  pnl: number; pnlPercent: number;
}
export interface ChangeLogEntry {
  id: string; timestamp: string; action: string; module: string; details: string;
}
export interface UserProfile { name: string; targetNetWorth: number; }
export interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }

export type ThemeMode = 'dark' | 'light' | 'monochrome';

export interface FinancialState {
  isAuthenticated: boolean; hasCompletedOnboarding: boolean; googleSheetUrl: string;
  darkMode: boolean; themeMode: ThemeMode;
  userProfile: UserProfile; assets: Asset[]; liabilities: Liability[]; trades: Trade[];
  changelog: ChangeLogEntry[];
  monthlyIncome: number; monthlyBurn: number; creditScore: number;
}

export interface FinancialContextType {
  state: FinancialState; updateMetrics: (newMetrics: Partial<FinancialState>) => void;
  addAsset: (asset: Omit<Asset, 'id'>) => void; removeAsset: (id: string) => void;
  updateAsset: (id: string, updates: Partial<Omit<Asset, 'id'>>) => void;
  addLiability: (liability: Omit<Liability, 'id'>) => void; removeLiability: (id: string) => void;
  updateLiability: (id: string, updates: Partial<Omit<Liability, 'id'>>) => void;
  addTrade: (trade: Omit<Trade, 'id' | 'pnl' | 'pnlPercent'>) => void; removeTrade: (id: string) => void;
  updateTrade: (id: string, updates: Partial<Omit<Trade, 'id' | 'pnl' | 'pnlPercent'>>) => void;
  login: (password: string) => boolean; logout: () => void;
  syncToGoogleSheets: () => Promise<boolean>; exportCSV: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  netWorth: number; totalDebt: number; totalAssets: number;
  toasts: Toast[]; addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void; toggleDarkMode: () => void;
}

const defaultState: FinancialState = {
  isAuthenticated: false, hasCompletedOnboarding: false, googleSheetUrl: '', darkMode: true,
  themeMode: 'dark', userProfile: { name: '', targetNetWorth: 0 },
  assets: [], liabilities: [], trades: [], changelog: [],
  monthlyIncome: 0, monthlyBurn: 0, creditScore: 0,
};

const loadInitialState = (): FinancialState => {
  const saved = localStorage.getItem('equitrack_state');
  if (saved) {
    try { return { ...defaultState, ...JSON.parse(saved) }; } catch { console.error("Failed to parse saved state"); }
  }
  return { ...defaultState };
};

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinancialState>(loadInitialState());
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => { localStorage.setItem('equitrack_state', JSON.stringify(state)); }, [state]);

  // Apply theme classes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'monochrome');
    root.classList.add(state.themeMode || 'dark');
    // Keep darkMode in sync for backward compat
    if (state.themeMode === 'dark' || state.themeMode === 'monochrome') {
      root.classList.add('dark');
    }
  }, [state.themeMode]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback((id: string) => { setToasts(prev => prev.filter(t => t.id !== id)); }, []);

  // Versioning: log every mutation
  const logChange = useCallback((action: string, module: string, details: string) => {
    const entry: ChangeLogEntry = {
      id: Date.now().toString(), timestamp: new Date().toISOString(), action, module, details
    };
    setState(prev => ({
      ...prev,
      changelog: [entry, ...(prev.changelog || [])].slice(0, 500) // keep last 500
    }));
  }, []);

  const updateMetrics = (newMetrics: Partial<FinancialState>) => {
    setState(prev => ({ ...prev, ...newMetrics }));
  };

  const addAsset = (asset: Omit<Asset, 'id'>) => {
    setState(prev => ({ ...prev, assets: [...prev.assets, { ...asset, id: Date.now().toString() }] }));
    logChange('ADD', 'Portfolio', `Added asset "${asset.name}" — $${(asset.quantity * asset.unitPrice).toLocaleString()}`);
    addToast(`Asset "${asset.name}" added successfully`);
  };
  const removeAsset = (id: string) => {
    const name = state.assets.find(a => a.id === id)?.name;
    setState(prev => ({ ...prev, assets: prev.assets.filter(a => a.id !== id) }));
    logChange('DELETE', 'Portfolio', `Removed asset "${name}"`);
    addToast(`Asset "${name}" deleted`, 'info');
  };
  const updateAsset = (id: string, updates: Partial<Omit<Asset, 'id'>>) => {
    setState(prev => ({ ...prev, assets: prev.assets.map(a => a.id === id ? { ...a, ...updates } : a) }));
    logChange('UPDATE', 'Portfolio', `Updated asset id=${id} — ${JSON.stringify(updates)}`);
    addToast('Asset updated successfully');
  };

  const addLiability = (liability: Omit<Liability, 'id'>) => {
    setState(prev => ({ ...prev, liabilities: [...prev.liabilities, { ...liability, id: Date.now().toString() }] }));
    logChange('ADD', 'Expenses', `Added liability "${liability.name}" — $${liability.principal.toLocaleString()}`);
    addToast(`Liability "${liability.name}" added successfully`);
  };
  const removeLiability = (id: string) => {
    const name = state.liabilities.find(l => l.id === id)?.name;
    setState(prev => ({ ...prev, liabilities: prev.liabilities.filter(l => l.id !== id) }));
    logChange('DELETE', 'Expenses', `Removed liability "${name}"`);
    addToast(`Liability "${name}" deleted`, 'info');
  };
  const updateLiability = (id: string, updates: Partial<Omit<Liability, 'id'>>) => {
    setState(prev => ({ ...prev, liabilities: prev.liabilities.map(l => l.id === id ? { ...l, ...updates } : l) }));
    logChange('UPDATE', 'Expenses', `Updated liability id=${id} — ${JSON.stringify(updates)}`);
    addToast('Liability updated successfully');
  };

  const calcTradePnl = (t: Omit<Trade, 'id' | 'pnl' | 'pnlPercent'>) => {
    const gross = t.direction === 'LONG' ? (t.exitPrice - t.entryPrice) * t.shares : (t.entryPrice - t.exitPrice) * t.shares;
    const pnl = gross - (t.fees || 0);
    const pnlPercent = t.entryPrice > 0 ? (pnl / (t.entryPrice * t.shares)) * 100 : 0;
    return { pnl, pnlPercent };
  };
  const addTrade = (trade: Omit<Trade, 'id' | 'pnl' | 'pnlPercent'>) => {
    const { pnl, pnlPercent } = calcTradePnl(trade);
    setState(prev => ({ ...prev, trades: [{ ...trade, id: Date.now().toString(), pnl, pnlPercent }, ...prev.trades] }));
    logChange('ADD', 'Trading', `${trade.direction} ${trade.shares}x ${trade.ticker} @ $${trade.entryPrice} → $${trade.exitPrice} = ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
    addToast(`Trade ${trade.ticker} logged: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`, pnl >= 0 ? 'success' : 'error');
  };
  const removeTrade = (id: string) => {
    const t = state.trades.find(tr => tr.id === id);
    setState(prev => ({ ...prev, trades: prev.trades.filter(tr => tr.id !== id) }));
    logChange('DELETE', 'Trading', `Removed trade ${t?.ticker || ''}`);
    addToast(`Trade ${t?.ticker || ''} removed`, 'info');
  };
  const updateTrade = (id: string, updates: Partial<Omit<Trade, 'id' | 'pnl' | 'pnlPercent'>>) => {
    setState(prev => ({ ...prev, trades: prev.trades.map(tr => { if (tr.id !== id) return tr; const merged = { ...tr, ...updates }; const { pnl, pnlPercent } = calcTradePnl(merged); return { ...merged, pnl, pnlPercent }; }) }));
    logChange('UPDATE', 'Trading', `Updated trade id=${id}`);
    addToast('Trade updated successfully');
  };

  const login = (password: string) => { if (password === 'admin123') { updateMetrics({ isAuthenticated: true }); logChange('AUTH', 'System', 'User logged in'); return true; } return false; };
  const logout = () => { logChange('AUTH', 'System', 'User logged out'); updateMetrics({ isAuthenticated: false }); };

  const syncToGoogleSheets = async () => {
    if (!state.googleSheetUrl) return false;
    try {
      // Send trades to sheet 1
      const tradeRows = state.trades.map(t => ({
        date: t.date, ticker: t.ticker, direction: t.direction, shares: t.shares,
        entry: t.entryPrice, exit: t.exitPrice, fees: t.fees, pnl: t.pnl,
        pnlPct: t.pnlPercent, notes: t.notes, company: t.companyName
      }));
      // Send changelog to sheet 2
      const changelogRows = (state.changelog || []).map(c => ({
        timestamp: c.timestamp, action: c.action, module: c.module, details: c.details
      }));
      const payload = { trades: tradeRows, changelog: changelogRows };
      const response = await fetch(state.googleSheetUrl, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.type === 'opaque' || response.ok) {
        logChange('SYNC', 'System', `Synced ${tradeRows.length} trades and ${changelogRows.length} changelog entries to Google Sheets`);
        addToast('Data synced to Google Sheets!');
        return true;
      }
      throw new Error('Sync failed');
    } catch (error) {
      addToast('Sync failed. Check console.', 'error');
      return false;
    }
  };

  const exportCSV = () => {
    const rows: string[] = ['Type,Name,Category,Value,APR,Status'];
    state.assets.forEach(a => rows.push(`Asset,${a.name},${a.category},${a.quantity * a.unitPrice},,`));
    state.liabilities.forEach(l => rows.push(`Liability,${l.name},${l.category},${l.principal},${l.apr}%,${l.status}`));
    rows.push('', 'Date,Ticker,Direction,Shares,Entry,Exit,Fees,P&L,P&L%,Notes');
    state.trades.forEach(t => rows.push(`${t.date},${t.ticker},${t.direction},${t.shares},${t.entryPrice},${t.exitPrice},${t.fees},${t.pnl.toFixed(2)},${t.pnlPercent.toFixed(2)}%,"${t.notes}"`));
    rows.push('', `Summary,Net Worth,,${totalAssets - totalDebt},,`, `Summary,Total Assets,,${totalAssets},,`, `Summary,Total Debt,,${totalDebt},,`);
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = `equitrack_export_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url);
    logChange('EXPORT', 'System', 'Exported CSV');
    addToast('Financial data exported as CSV');
  };

  const toggleDarkMode = () => {
    setState(prev => {
      const next = prev.themeMode === 'dark' ? 'light' : 'dark';
      return { ...prev, darkMode: next === 'dark', themeMode: next };
    });
  };
  const setThemeMode = (mode: ThemeMode) => {
    setState(prev => ({ ...prev, themeMode: mode, darkMode: mode !== 'light' }));
    logChange('UPDATE', 'Settings', `Theme changed to ${mode}`);
  };

  const totalAssets = state.assets.reduce((sum, asset) => sum + (asset.quantity * asset.unitPrice), 0);
  const totalDebt = state.liabilities.reduce((sum, liab) => sum + liab.principal, 0);
  const netWorth = totalAssets - totalDebt;

  return (
    <FinancialContext.Provider value={{
      state, updateMetrics, addAsset, removeAsset, updateAsset,
      addLiability, removeLiability, updateLiability,
      addTrade, removeTrade, updateTrade,
      login, logout, syncToGoogleSheets, exportCSV, setThemeMode,
      netWorth, totalDebt, totalAssets, toasts, addToast, removeToast, toggleDarkMode
    }}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (!context) throw new Error('useFinancial must be used within a FinancialProvider');
  return context;
}
