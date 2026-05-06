import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="layout-container bp-compact">
      <header className="mobile-header">
        <div className="mobile-brand">
          <span className="material-symbols-outlined">account_balance</span>
          <span>EquiTrack Finance</span>
        </div>
        <div className="mobile-actions">
          <span className="material-symbols-outlined">notifications</span>
          <span className="material-symbols-outlined">help</span>
          <span className="material-symbols-outlined">settings</span>
          <div className="avatar">
            <span className="material-symbols-outlined">person</span>
          </div>
        </div>
      </header>
      
      <div className="main-wrapper">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
