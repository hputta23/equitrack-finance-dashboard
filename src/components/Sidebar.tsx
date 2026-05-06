import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: 'dashboard', label: 'Dashboard' },
    { path: '/expenses', icon: 'payments', label: 'Expenses' },
    { path: '/portfolio', icon: 'account_balance_wallet', label: 'Portfolio' },
    { path: '/strategy', icon: 'insights', label: 'Strategy' },
  ];

  return (
    <nav className="desktop-sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">
          <span className="material-symbols-outlined">account_balance</span>
        </div>
        <div className="brand-text">
          <h1>WealthManager</h1>
          <p>Institutional Grade</p>
        </div>
      </div>
      
      <div className="sidebar-nav">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
      
      <div className="sidebar-footer">
        <button className="add-btn">
          <span className="material-symbols-outlined">add</span>
          Add Transaction
        </button>
        <a href="#" className="footer-link">
          <span className="material-symbols-outlined">contact_support</span>
          Support
        </a>
        <a href="#" className="footer-link">
          <span className="material-symbols-outlined">logout</span>
          Sign Out
        </a>
      </div>
    </nav>
  );
}
