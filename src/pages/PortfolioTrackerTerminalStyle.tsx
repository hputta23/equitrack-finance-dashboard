import { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import type { Asset } from '../context/FinancialContext';

export default function PortfolioTrackerTerminalStyle() {
  const { state, addAsset, removeAsset, updateAsset, totalAssets, exportCSV } = useFinancial();

  // Form State
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    name: '', category: 'EQUITIES', quantity: 0, unitPrice: 0
  });

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Asset>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleAddAsset = () => {
    if (!newAsset.name || !newAsset.quantity || !newAsset.unitPrice) return;
    addAsset({
      name: newAsset.name!,
      category: newAsset.category || 'EQUITIES',
      quantity: newAsset.quantity!,
      unitPrice: newAsset.unitPrice!,
    });
    setNewAsset({ name: '', category: 'EQUITIES', quantity: 0, unitPrice: 0 });
  };

  const startEdit = (asset: Asset) => {
    setEditingId(asset.id);
    setEditValues({ quantity: asset.quantity, unitPrice: asset.unitPrice });
  };

  const saveEdit = (id: string) => {
    updateAsset(id, editValues);
    setEditingId(null);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  // Asset class breakdown
  const breakdown = state.assets.reduce((acc, a) => {
    const key = a.category;
    acc[key] = (acc[key] || 0) + (a.quantity * a.unitPrice);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="font-h1 text-primary uppercase tracking-tight">My Assets</h1>
            <p className="text-on-surface-variant font-body-base text-xs mt-1">Real-time asset telemetry and allocation mapping</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-xs font-mono-data rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-fluid-14">add</span> Add
            </button>
            <button onClick={exportCSV} className="px-3 py-1 bg-surface-container border border-outline-variant text-on-surface text-xs font-mono-data rounded hover:bg-surface-container-high transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-fluid-14">download</span> EXPORT
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-surface-container border border-outline-variant p-4 shadow-sm">
            <div className="font-label-caps text-label-caps text-on-surface-variant mb-2 tracking-widest">NET_LIQUIDITY_VALUE</div>
            <div className="font-h1 text-h1 text-on-surface font-monospace-data tracking-tight">
              ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-surface-container border border-outline-variant p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {['EQUITIES', 'CRYPTOCURRENCY', 'REAL_ESTATE', 'CASH_EQUIVALENT'].map(cat => (
                <div key={cat} className="text-center">
                  <div className="text-fluid-10 text-on-surface-variant uppercase tracking-wider">{cat.replace('_', ' ')}</div>
                  <div className="font-mono-data text-sm text-primary">${(breakdown[cat] || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Asset Ledger Table */}
        <div className="border border-outline-variant">
          <div className="bg-surface-container-high px-4 py-2 flex items-center gap-2 border-b border-outline-variant">
            <span className="material-symbols-outlined text-primary text-fluid-16">table_chart</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Complete Asset Ledger</span>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface-container-high text-fluid-10 uppercase tracking-wider text-outline font-bold">
                <th className="px-4 py-2">Asset Name</th>
                <th className="px-4 py-2">Class</th>
                <th className="px-4 py-2 text-right">Vol/Qty</th>
                <th className="px-4 py-2 text-right">Unit Px</th>
                <th className="px-4 py-2 text-right">Notional</th>
                <th className="px-4 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="font-mono-data text-sm">
              {state.assets.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-on-surface-variant italic">No assets. Add your first asset using the form →</td></tr>
              )}
              {state.assets.map(asset => (
                <tr key={asset.id} className="border-t border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-2 text-on-surface">{asset.name}</td>
                  <td className="px-4 py-2 text-on-surface-variant">{asset.category}</td>
                  <td className="px-4 py-2 text-right">
                    {editingId === asset.id ? (
                      <input type="number" className="w-20 bg-surface border border-primary p-1 text-xs font-mono text-on-surface text-right outline-none" value={editValues.quantity} onChange={e => setEditValues(v => ({ ...v, quantity: Number(e.target.value) }))} />
                    ) : (
                      <span className="text-on-surface">{asset.quantity}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {editingId === asset.id ? (
                      <input type="number" className="w-24 bg-surface border border-primary p-1 text-xs font-mono text-on-surface text-right outline-none" value={editValues.unitPrice} onChange={e => setEditValues(v => ({ ...v, unitPrice: Number(e.target.value) }))} />
                    ) : (
                      <span className="text-on-surface">${asset.unitPrice.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-primary">${(asset.quantity * asset.unitPrice).toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">
                    {editingId === asset.id ? (
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => saveEdit(asset.id)} className="text-primary text-xs uppercase hover:underline">Save</button>
                        <button onClick={cancelEdit} className="text-on-surface-variant text-xs uppercase hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => startEdit(asset)} className="text-primary text-xs uppercase hover:underline">Edit</button>
                        <button onClick={() => removeAsset(asset.id)} className="text-error text-xs uppercase hover:underline">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Sidebar — slide-over on mobile */}
      {sidebarOpen && <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed md:relative right-0 top-0 z-50 md:z-auto w-80 h-full bg-surface-container border-l border-outline-variant flex flex-col p-4 overflow-y-auto shrink-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">add_circle</span>
          <h2 className="font-h3 text-h3 text-on-surface uppercase">Add Asset</h2>
        </div>
        <div className="space-y-4 flex-1">
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1 block">Asset Name/Ticker</label>
            <input className="w-full bg-surface-container-low border border-outline-variant p-2 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={newAsset.name} onChange={e => setNewAsset(v => ({ ...v, name: e.target.value }))} placeholder="e.g., AAPL" />
          </div>
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1 block">Asset Class</label>
            <select className="w-full bg-surface-container-low border border-outline-variant p-2 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={newAsset.category} onChange={e => setNewAsset(v => ({ ...v, category: e.target.value }))}>
              <option value="EQUITIES">Equities</option>
              <option value="CRYPTOCURRENCY">Cryptocurrency</option>
              <option value="REAL_ESTATE">Real Estate</option>
              <option value="CASH_EQUIVALENT">Cash Equivalent</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1 block">Quantity</label>
              <input type="number" className="w-full bg-surface-container-low border border-outline-variant p-2 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={newAsset.quantity || ''} onChange={e => setNewAsset(v => ({ ...v, quantity: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1 block">Unit Price ($)</label>
              <input type="number" className="w-full bg-surface-container-low border border-outline-variant p-2 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={newAsset.unitPrice || ''} onChange={e => setNewAsset(v => ({ ...v, unitPrice: Number(e.target.value) }))} />
            </div>
          </div>
        </div>
        <button
          onClick={handleAddAsset}
          disabled={!newAsset.name || !newAsset.quantity || !newAsset.unitPrice}
          className="mt-4 w-full bg-primary text-on-primary font-bold py-3 uppercase tracking-tighter text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-sm">database</span>
          Commit Record
        </button>
      </aside>
    </div>
  );
}
