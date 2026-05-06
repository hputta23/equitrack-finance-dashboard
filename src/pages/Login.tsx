import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancial } from '../context/FinancialContext';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { login, state } = useFinancial();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(password);
    if (success) {
      if (state.hasCompletedOnboarding) {
        navigate('/');
      } else {
        navigate('/onboarding');
      }
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container border border-outline-variant rounded-lg p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary mb-4 shadow-[0_0_15px_rgba(142,213,255,0.3)]">
            <span className="material-symbols-outlined text-2xl">account_balance</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface font-mono uppercase tracking-widest">EquiTrack</h1>
          <p className="text-on-surface-variant text-sm mt-1">Secure Institutional Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-label-caps text-on-surface-variant uppercase mb-2">Access Key</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
              <input
                type="password"
                className={`w-full bg-surface-container-lowest border ${error ? 'border-error' : 'border-outline-variant'} rounded py-3 pl-10 pr-4 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono`}
                placeholder="Enter password (admin123)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
              />
            </div>
            {error && <p className="text-error text-xs mt-2 font-mono">Invalid access key. Connection refused.</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-on-primary py-3 rounded hover:bg-on-primary-fixed-variant transition-colors font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2"
          >
            Authenticate <span className="material-symbols-outlined text-lg">login</span>
          </button>
        </form>
        
        <div className="mt-8 pt-4 border-t border-outline-variant text-center">
          <p className="text-outline text-xs font-mono">End-to-end encrypted connection.</p>
        </div>
      </div>
    </div>
  );
}
