import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useFinancial } from '../context/FinancialContext';
import ToastContainer from './ToastContainer';

export default function TerminalLayout() {
  const { state } = useFinancial();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2 border-l-4 duration-150 transition-all ${
      isActive
        ? 'text-primary border-primary bg-primary-container/20 font-bold'
        : 'text-on-surface-variant border-transparent hover:bg-surface-container-high'
    }`;

  const greeting = state.userProfile.name
    ? `Welcome, ${state.userProfile.name.split(' ')[0]}`
    : '2026Track';

  const navLinks = (
    <>
      <NavLink to="/" end className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        <span className="material-symbols-outlined">dashboard</span>Dashboard
      </NavLink>
      <NavLink to="/expenses" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        <span className="material-symbols-outlined">receipt_long</span>My Expenses
      </NavLink>
      <NavLink to="/portfolio" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        <span className="material-symbols-outlined">account_balance_wallet</span>My Assets
      </NavLink>
      <NavLink to="/strategy" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        <span className="material-symbols-outlined">savings</span>Budget Planner
      </NavLink>
      <NavLink to="/trades" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        <span className="material-symbols-outlined">candlestick_chart</span>Trade Log
      </NavLink>
      <NavLink to="/update" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        <span className="material-symbols-outlined">settings</span>Settings
      </NavLink>
      <NavLink to="/profile" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
        <span className="material-symbols-outlined">person</span>My Profile
      </NavLink>
    </>
  );

  return (
    <div className="h-[100dvh] bg-surface text-on-surface font-body overflow-hidden flex flex-col">
      {/* Mobile Top Navigation */}
      <div className="md:hidden shrink-0 flex items-center justify-between px-4 h-14 w-full bg-surface-container-low border-b border-outline-variant shadow-sm font-sans text-sm">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1">
          <span className="material-symbols-outlined text-on-surface">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
        <div className="flex items-center gap-2 text-lg font-bold text-primary">
          <span className="material-symbols-outlined">account_balance</span>
          <span>2026Track</span>
        </div>
        <div className="w-8"></div> {/* Spacer to keep brand centered if needed */}
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <nav className="w-64 h-full bg-surface-container border-r border-outline-variant py-4 flex flex-col gap-1 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-4 pb-4 border-b border-outline-variant mb-2">
              <p className="text-primary font-bold text-sm">{greeting}</p>
            </div>
            {navLinks}
          </nav>
        </div>
      )}

      <div className="flex flex-1 w-full overflow-hidden">
        {/* Desktop Side Navigation */}
        <nav className="hidden md:flex shrink-0 flex-col w-64 h-full border-r bg-surface-container border-r-outline-variant font-sans text-sm tracking-tight z-40">
          <div className="p-6 border-b border-outline-variant flex items-center gap-3">
            <div className="w-10 h-10 rounded-DEFAULT bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
              <span className="material-symbols-outlined text-xl">account_balance</span>
            </div>
            <div>
              <h1 className="font-black text-primary text-lg leading-tight">2026Track</h1>
              <p className="text-secondary text-fluid-10 uppercase tracking-wider font-semibold">{greeting}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
            {navLinks}
          </div>
          {/* Clean footer — version info only */}
          <div className="p-4 border-t border-outline-variant">
            <div className="flex items-center justify-between text-fluid-10 text-on-surface-variant">
              <span className="uppercase tracking-wider">v2.0</span>
              <span>{state.themeMode?.toUpperCase() || 'DARK'} THEME</span>
            </div>
          </div>
        </nav>

        <main className="flex-1 flex flex-col min-w-0 h-full relative">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
