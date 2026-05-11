import { useState, useMemo, useRef } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import PnlBarChart from '../components/PnlBarChart';

export default function TradingJournal() {
  const { state, addTrade, removeTrade, addToast } = useFinancial();
  const trades = state.trades;
  const printRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form state
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    date: today, ticker: '', companyName: '', direction: 'LONG' as 'LONG' | 'SHORT',
    shares: '', entryPrice: '', exitPrice: '', fees: '', notes: '', tags: ''
  });
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'ytd' | 'yearly' | 'alltime'>('daily');

  // Date helpers
  const isToday = (d: string) => d === today;
  const isThisWeek = (d: string) => {
    const date = new Date(d); const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0,0,0,0);
    return date >= weekStart;
  };
  const isThisMonth = (d: string) => {
    const date = new Date(d); const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  const filteredTrades = useMemo(() => {
    if (timeFilter === 'today') return trades.filter(t => isToday(t.date));
    if (timeFilter === 'week') return trades.filter(t => isThisWeek(t.date));
    if (timeFilter === 'month') return trades.filter(t => isThisMonth(t.date));
    return trades;
  }, [trades, timeFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const t = filteredTrades;
    if (t.length === 0) return null;
    const totalPnl = t.reduce((s, tr) => s + tr.pnl, 0);
    const wins = t.filter(tr => tr.pnl > 0);
    const losses = t.filter(tr => tr.pnl <= 0);
    const winRate = (wins.length / t.length) * 100;
    const avgWin = wins.length > 0 ? wins.reduce((s, tr) => s + tr.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((s, tr) => s + tr.pnl, 0) / losses.length : 0;
    const largestWin = wins.length > 0 ? Math.max(...wins.map(tr => tr.pnl)) : 0;
    const largestLoss = losses.length > 0 ? Math.min(...losses.map(tr => tr.pnl)) : 0;
    const profitFactor = Math.abs(avgLoss) > 0 ? avgWin / Math.abs(avgLoss) : avgWin > 0 ? Infinity : 0;
    const totalVolume = t.reduce((s, tr) => s + (tr.shares * tr.entryPrice), 0);
    const totalFees = t.reduce((s, tr) => s + tr.fees, 0);
    // Streak: iterate newest-first (trades are stored newest-first, so slice is correct)
    let streak = 0; let streakType: 'W' | 'L' | '' = '';
    const sortedByDate = [...t].sort((a, b) => b.date.localeCompare(a.date));
    for (const tr of sortedByDate) {
      if (streakType === '') { streakType = tr.pnl > 0 ? 'W' : 'L'; streak = 1; }
      else if ((tr.pnl > 0 && streakType === 'W') || (tr.pnl <= 0 && streakType === 'L')) streak++;
      else break;
    }
    return { totalPnl, winRate, avgWin, avgLoss, largestWin, largestLoss, profitFactor, totalVolume, totalFees, totalTrades: t.length, wins: wins.length, losses: losses.length, streak, streakType };
  }, [filteredTrades]);

  // Chart aggregation helpers
  const getWeekLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const start = new Date(d); start.setDate(d.getDate() - d.getDay());
    return `${start.getMonth() + 1}/${start.getDate()}`;
  };
  const getMonthLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };
  const getYearLabel = (dateStr: string) => new Date(dateStr + 'T12:00:00').getFullYear().toString();

  // Daily P&L (last 14 days)
  const dailyChartData = useMemo(() => {
    const map = new Map<string, number>();
    trades.forEach(t => map.set(t.date, (map.get(t.date) || 0) + t.pnl));
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, pnl]) => ({
        label: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
        value: pnl
      }));
  }, [trades]);

  // Weekly P&L (last 12 weeks)
  const weeklyChartData = useMemo(() => {
    const map = new Map<string, number>();
    trades.forEach(t => {
      const key = getWeekLabel(t.date);
      map.set(key, (map.get(key) || 0) + t.pnl);
    });
    return Array.from(map.entries()).slice(-12).map(([label, value]) => ({ label, value }));
  }, [trades]);

  // Monthly P&L (last 12 months)
  const monthlyChartData = useMemo(() => {
    const map = new Map<string, number>();
    trades.forEach(t => {
      const key = getMonthLabel(t.date);
      map.set(key, (map.get(key) || 0) + t.pnl);
    });
    return Array.from(map.entries()).slice(-12).map(([label, value]) => ({ label, value }));
  }, [trades]);

  // Yearly P&L
  const yearlyChartData = useMemo(() => {
    const map = new Map<string, number>();
    trades.forEach(t => {
      const key = getYearLabel(t.date);
      map.set(key, (map.get(key) || 0) + t.pnl);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([label, value]) => ({ label, value }));
  }, [trades]);

  // YTD P&L (monthly buckets for current year only)
  const ytdChartData = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const map = new Map<string, number>();
    trades.filter(t => new Date(t.date + 'T12:00:00').getFullYear() === thisYear).forEach(t => {
      const key = getMonthLabel(t.date);
      map.set(key, (map.get(key) || 0) + t.pnl);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [trades]);

  // All-time cumulative by month
  const alltimeChartData = useMemo(() => {
    const map = new Map<string, number>();
    trades.forEach(t => {
      const key = getMonthLabel(t.date);
      map.set(key, (map.get(key) || 0) + t.pnl);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [trades]);

  // Active chart data based on selector
  const activeChartData = useMemo(() => {
    switch (chartPeriod) {
      case 'daily': return dailyChartData;
      case 'weekly': return weeklyChartData;
      case 'monthly': return monthlyChartData;
      case 'ytd': return ytdChartData;
      case 'yearly': return yearlyChartData;
      case 'alltime': return alltimeChartData;
      default: return dailyChartData;
    }
  }, [chartPeriod, dailyChartData, weeklyChartData, monthlyChartData, ytdChartData, yearlyChartData, alltimeChartData]);

  const chartTitles: Record<typeof chartPeriod, string> = {
    daily: 'Daily P&L (Last 14 Days)',
    weekly: 'Weekly P&L (Last 12 Weeks)',
    monthly: 'Monthly P&L (Last 12 Months)',
    ytd: `YTD P&L (${new Date().getFullYear()})`,
    yearly: 'Yearly P&L',
    alltime: 'All-Time P&L (by Month)',
  };

  const handleSubmit = () => {
    if (!form.ticker || !form.shares || !form.entryPrice || !form.exitPrice) return;
    addTrade({
      date: form.date, ticker: form.ticker.toUpperCase(), companyName: form.companyName,
      direction: form.direction, shares: Number(form.shares), entryPrice: Number(form.entryPrice),
      exitPrice: Number(form.exitPrice), fees: Number(form.fees) || 0, notes: form.notes,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : []
    });
    setForm({ date: today, ticker: '', companyName: '', direction: 'LONG', shares: '', entryPrice: '', exitPrice: '', fees: '', notes: '', tags: '' });
  };

  const fmt = (v: number) => (v >= 0 ? '+' : '') + '$' + Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pnlColor = (v: number) => v > 0 ? 'text-[#4ade80]' : v < 0 ? 'text-error' : 'text-on-surface-variant';

  // PDF Export via html2canvas and jsPDF
  const exportPDF = async () => {
    const content = printRef.current;
    if (!content) return;
    
    addToast('Generating PDF... Please wait.');
    
    try {
      // Temporarily remove overflow to capture the entire scrolling content
      const originalOverflow = content.style.overflow;
      const originalHeight = content.style.height;
      content.style.overflow = 'visible';
      content.style.height = 'auto';
      
      const canvas = await html2canvas(content, {
        scale: 2, // Higher resolution
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#0f1418', // Dynamic background
        logging: false,
      });
      
      // Restore original styles
      content.style.overflow = originalOverflow;
      content.style.height = originalHeight;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Save the file
      pdf.save(`Trading_Journal_${new Date().toISOString().split('T')[0]}.pdf`);
      addToast('PDF exported successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to generate PDF.', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4" ref={printRef}>
        <header className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h1 className="font-h1 text-primary uppercase tracking-tight">Trading Journal</h1>
            <p className="text-on-surface-variant font-body-base text-xs mt-1">Log trades, track performance, and analyze patterns.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-xs font-mono-data rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-fluid-14">add</span> Log
            </button>
            <button onClick={exportPDF} className="px-3 py-1 bg-surface-container border border-outline-variant text-on-surface text-xs font-mono-data rounded hover:bg-surface-container-high transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-fluid-14">picture_as_pdf</span> PDF
            </button>
          </div>
        </header>

        {/* Time Filter */}
        <div className="flex gap-2 mb-4">
          {(['all', 'today', 'week', 'month'] as const).map(f => (
            <button key={f} onClick={() => setTimeFilter(f)} className={`px-3 py-1 text-fluid-10 uppercase font-mono tracking-wider border rounded transition-colors ${timeFilter === f ? 'bg-primary/20 border-primary text-primary' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}>
              {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {/* Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
            <div className="bg-surface-container border border-outline-variant p-3 text-center">
              <div className="text-fluid-9 text-on-surface-variant uppercase tracking-wider mb-1">Total P&L</div>
              <div className={`font-mono-data text-lg font-bold ${pnlColor(metrics.totalPnl)}`}>{fmt(metrics.totalPnl)}</div>
            </div>
            <div className="bg-surface-container border border-outline-variant p-3 text-center">
              <div className="text-fluid-9 text-on-surface-variant uppercase tracking-wider mb-1">Win Rate</div>
              <div className={`font-mono-data text-lg font-bold ${metrics.winRate >= 50 ? 'text-[#4ade80]' : 'text-error'}`}>{metrics.winRate.toFixed(1)}%</div>
              <div className="text-fluid-9 text-on-surface-variant">{metrics.wins}W / {metrics.losses}L</div>
            </div>
            <div className="bg-surface-container border border-outline-variant p-3 text-center">
              <div className="text-fluid-9 text-on-surface-variant uppercase tracking-wider mb-1">Avg Win</div>
              <div className="font-mono-data text-sm text-[#4ade80]">{fmt(metrics.avgWin)}</div>
              <div className="text-fluid-9 text-on-surface-variant mt-0.5">Avg Loss: {fmt(metrics.avgLoss)}</div>
            </div>
            <div className="bg-surface-container border border-outline-variant p-3 text-center">
              <div className="text-fluid-9 text-on-surface-variant uppercase tracking-wider mb-1">Profit Factor</div>
              <div className={`font-mono-data text-lg font-bold ${metrics.profitFactor >= 1.5 ? 'text-[#4ade80]' : metrics.profitFactor >= 1 ? 'text-tertiary' : 'text-error'}`}>
                {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
              </div>
            </div>
            <div className="bg-surface-container border border-outline-variant p-3 text-center">
              <div className="text-fluid-9 text-on-surface-variant uppercase tracking-wider mb-1">Streak</div>
              <div className={`font-mono-data text-lg font-bold ${metrics.streakType === 'W' ? 'text-[#4ade80]' : 'text-error'}`}>
                {metrics.streak}{metrics.streakType}
              </div>
            </div>
            <div className="bg-surface-container border border-outline-variant p-3 text-center">
              <div className="text-fluid-9 text-on-surface-variant uppercase tracking-wider mb-1">Total Fees</div>
              <div className="font-mono-data text-sm text-error">${metrics.totalFees.toFixed(2)}</div>
              <div className="text-fluid-9 text-on-surface-variant">{metrics.totalTrades} trades</div>
            </div>
          </div>
        )}

        {/* Extremes Row */}
        {metrics && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 mb-4">
            <div className="bg-surface-container border border-outline-variant p-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4ade80] text-fluid-18">arrow_upward</span>
              <div><div className="text-fluid-9 text-on-surface-variant uppercase">Best Trade</div><div className="font-mono-data text-sm text-[#4ade80]">{fmt(metrics.largestWin)}</div></div>
            </div>
            <div className="bg-surface-container border border-outline-variant p-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-fluid-18">arrow_downward</span>
              <div><div className="text-fluid-9 text-on-surface-variant uppercase">Worst Trade</div><div className="font-mono-data text-sm text-error">{fmt(metrics.largestLoss)}</div></div>
            </div>
            <div className="bg-surface-container border border-outline-variant p-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-fluid-18">bar_chart</span>
              <div><div className="text-fluid-9 text-on-surface-variant uppercase">Volume</div><div className="font-mono-data text-sm text-on-surface">${metrics.totalVolume.toLocaleString()}</div></div>
            </div>
            <div className="bg-surface-container border border-outline-variant p-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-fluid-18">percent</span>
              <div><div className="text-fluid-9 text-on-surface-variant uppercase">Avg Return</div><div className={`font-mono-data text-sm ${pnlColor(metrics.totalPnl / metrics.totalTrades)}`}>{(filteredTrades.reduce((s,t) => s + t.pnlPercent, 0) / metrics.totalTrades).toFixed(2)}%</div></div>
            </div>
          </div>
        )}

        {/* Unified P&L Chart with Period Selector */}
        {trades.length > 0 && (
          <div className="mb-4 bg-surface-container border border-outline-variant rounded overflow-hidden">
            <div className="px-3 py-2 border-b border-outline-variant flex items-center justify-between bg-surface-container-high">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-fluid-16">bar_chart</span>
                <span className="text-fluid-10 text-on-surface-variant uppercase tracking-wider font-bold">{chartTitles[chartPeriod]}</span>
              </div>
              <div className="flex gap-1">
                {(['daily', 'weekly', 'monthly', 'ytd', 'yearly', 'alltime'] as const).map(p => (
                  <button key={p} onClick={() => setChartPeriod(p)} className={`px-2 py-0.5 text-fluid-9 uppercase font-mono tracking-wider border rounded transition-colors ${chartPeriod === p ? 'bg-primary/20 border-primary text-primary' : 'border-outline-variant/50 text-on-surface-variant hover:bg-surface-container'}`}>
                    {p === 'alltime' ? 'All' : p === 'ytd' ? 'YTD' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <PnlBarChart data={activeChartData} title="" icon="" height={200} />
          </div>
        )}

        {/* Trade History */}
        <div className="border border-outline-variant">
          <div className="bg-surface-container-high px-4 py-2 flex items-center gap-2 border-b border-outline-variant">
            <span className="material-symbols-outlined text-primary text-fluid-16">receipt_long</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Trade History</span>
            <span className="ml-auto text-fluid-10 font-mono-data text-on-surface-variant">{filteredTrades.length} trades</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-container-high text-fluid-9 uppercase tracking-wider text-outline font-bold">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Ticker</th>
                  <th className="px-3 py-2">Dir</th>
                  <th className="px-3 py-2 text-right">Shares</th>
                  <th className="px-3 py-2 text-right">Entry</th>
                  <th className="px-3 py-2 text-right">Exit</th>
                  <th className="px-3 py-2 text-right">Fees</th>
                  <th className="px-3 py-2 text-right">P&L</th>
                  <th className="px-3 py-2 text-right">P&L %</th>
                  <th className="px-3 py-2">Notes</th>
                  <th className="px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="font-mono-data text-xs">
                {filteredTrades.length === 0 && (
                  <tr><td colSpan={11} className="text-center py-10 text-on-surface-variant italic">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-outline">show_chart</span>
                    No trades logged yet. Use the form to enter your first trade →
                  </td></tr>
                )}
                {filteredTrades.map(t => (
                  <tr key={t.id} className="border-t border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                    <td className="px-3 py-1.5 text-on-surface-variant">{new Date(t.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td className="px-3 py-1.5">
                      <span className="text-on-surface font-bold">{t.ticker}</span>
                      {t.companyName && <span className="text-on-surface-variant ml-1 text-fluid-9">{t.companyName}</span>}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`px-1.5 py-0.5 text-fluid-8 uppercase font-bold tracking-wider rounded ${t.direction === 'LONG' ? 'bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/30' : 'bg-error/15 text-error border border-error/30'}`}>{t.direction}</span>
                    </td>
                    <td className="px-3 py-1.5 text-right text-on-surface">{t.shares}</td>
                    <td className="px-3 py-1.5 text-right text-on-surface">${t.entryPrice.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right text-on-surface">${t.exitPrice.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right text-on-surface-variant">${t.fees.toFixed(2)}</td>
                    <td className={`px-3 py-1.5 text-right font-bold ${pnlColor(t.pnl)}`}>{fmt(t.pnl)}</td>
                    <td className={`px-3 py-1.5 text-right ${pnlColor(t.pnlPercent)}`}>{t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%</td>
                    <td className="px-3 py-1.5 text-on-surface-variant max-w-[120px] truncate" title={t.notes}>{t.notes || '—'}</td>
                    <td className="px-3 py-1.5 text-center">
                      <button onClick={() => removeTrade(t.id)} className="text-error text-fluid-9 uppercase hover:underline">Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Entry Form Sidebar */}
      {sidebarOpen && <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed md:relative right-0 top-0 z-50 md:z-auto w-80 h-full bg-surface-container border-l border-outline-variant flex flex-col p-4 overflow-y-auto shrink-0 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">edit_note</span>
          <h2 className="font-h3 text-h3 text-on-surface uppercase">Log Trade</h2>
        </div>
        <div className="space-y-3 flex-1">
          <div>
            <label className="font-label-caps text-fluid-10 text-on-surface-variant uppercase mb-0.5 block">Date</label>
            <input type="date" className="w-full bg-surface-container-low border border-outline-variant p-2 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="font-label-caps text-fluid-10 text-on-surface-variant uppercase mb-0.5 block">Ticker</label>
              <input className="w-full bg-surface-container-low border border-outline-variant p-2 text-sm font-mono-data text-on-surface focus:border-primary outline-none uppercase" value={form.ticker} onChange={e => setForm(f => ({...f, ticker: e.target.value}))} placeholder="AAPL" />
            </div>
            <div>
              <label className="font-label-caps text-fluid-10 text-on-surface-variant uppercase mb-0.5 block">Direction</label>
              <div className="flex border border-outline-variant overflow-hidden">
                <button onClick={() => setForm(f => ({...f, direction: 'LONG'}))} className={`flex-1 py-2 text-fluid-10 font-mono uppercase transition-colors ${form.direction === 'LONG' ? 'bg-[#4ade80]/20 text-[#4ade80] border-r border-[#4ade80]/30' : 'bg-surface-container-low text-on-surface-variant border-r border-outline-variant hover:bg-surface-container'}`}>Long</button>
                <button onClick={() => setForm(f => ({...f, direction: 'SHORT'}))} className={`flex-1 py-2 text-fluid-10 font-mono uppercase transition-colors ${form.direction === 'SHORT' ? 'bg-error/20 text-error' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}>Short</button>
              </div>
            </div>
          </div>
          <div>
            <label className="font-label-caps text-fluid-10 text-on-surface-variant uppercase mb-0.5 block">Company Name (opt.)</label>
            <input className="w-full bg-surface-container-low border border-outline-variant p-2 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={form.companyName} onChange={e => setForm(f => ({...f, companyName: e.target.value}))} placeholder="Apple Inc." />
          </div>
          <div>
            <label className="font-label-caps text-fluid-10 text-on-surface-variant uppercase mb-0.5 block">Shares</label>
            <input type="number" className="w-full bg-surface-container-low border border-outline-variant p-2 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={form.shares} onChange={e => setForm(f => ({...f, shares: e.target.value}))} placeholder="100" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="font-label-caps text-fluid-10 text-on-surface-variant uppercase mb-0.5 block">{form.direction === 'LONG' ? 'Bought At' : 'Shorted At'}</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">$</span>
                <input type="number" step="0.01" className="w-full bg-surface-container-low border border-outline-variant p-2 pl-5 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={form.entryPrice} onChange={e => setForm(f => ({...f, entryPrice: e.target.value}))} placeholder="150.00" />
              </div>
            </div>
            <div>
              <label className="font-label-caps text-fluid-10 text-on-surface-variant uppercase mb-0.5 block">{form.direction === 'LONG' ? 'Sold At' : 'Covered At'}</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">$</span>
                <input type="number" step="0.01" className="w-full bg-surface-container-low border border-outline-variant p-2 pl-5 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={form.exitPrice} onChange={e => setForm(f => ({...f, exitPrice: e.target.value}))} placeholder="155.00" />
              </div>
            </div>
          </div>

          {/* Live P&L Preview */}
          {form.shares && form.entryPrice && form.exitPrice && (
            <div className="bg-surface-container-low border border-outline-variant p-2 rounded">
              <div className="text-fluid-9 text-on-surface-variant uppercase mb-1">P&L Preview</div>
              {(() => {
                const pnl = form.direction === 'LONG'
                  ? (Number(form.exitPrice) - Number(form.entryPrice)) * Number(form.shares) - (Number(form.fees) || 0)
                  : (Number(form.entryPrice) - Number(form.exitPrice)) * Number(form.shares) - (Number(form.fees) || 0);
                return <div className={`font-mono-data text-lg font-bold ${pnlColor(pnl)}`}>{fmt(pnl)}</div>;
              })()}
            </div>
          )}

          <div>
            <label className="font-label-caps text-fluid-10 text-on-surface-variant uppercase mb-0.5 block">Fees / Commission</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">$</span>
              <input type="number" step="0.01" className="w-full bg-surface-container-low border border-outline-variant p-2 pl-5 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={form.fees} onChange={e => setForm(f => ({...f, fees: e.target.value}))} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="font-label-caps text-fluid-10 text-on-surface-variant uppercase mb-0.5 block">Notes</label>
            <textarea className="w-full bg-surface-container-low border border-outline-variant p-2 text-sm font-mono-data text-on-surface focus:border-primary outline-none resize-none h-16" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Entry thesis, exit reason..." />
          </div>
          <div>
            <label className="font-label-caps text-fluid-10 text-on-surface-variant uppercase mb-0.5 block">Tags (comma separated)</label>
            <input className="w-full bg-surface-container-low border border-outline-variant p-2 text-sm font-mono-data text-on-surface focus:border-primary outline-none" value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="breakout, earnings, scalp" />
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!form.ticker || !form.shares || !form.entryPrice || !form.exitPrice}
          className="mt-3 w-full bg-primary text-on-primary font-bold py-3 uppercase tracking-tighter text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-sm">add_chart</span>
          Log Trade
        </button>
      </aside>
    </div>
  );
}
