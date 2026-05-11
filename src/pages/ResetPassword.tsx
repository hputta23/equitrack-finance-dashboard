import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancial } from '../context/FinancialContext';
import { supabase } from '../lib/supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { updatePassword } = useFinancial();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a session (the link from email should have authenticated the user)
    const checkSession = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If no session, they might have accessed this page directly without a valid link
        navigate('/login');
      }
    };
    checkSession();
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password !== confirmPassword) {
      setErrorMsg('Passwords must match and be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    
    const success = await updatePassword(password);
    setLoading(false);
    
    if (success) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container border border-outline-variant rounded-lg p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary mb-4 shadow-[0_0_15px_rgba(142,213,255,0.3)]">
            <span className="material-symbols-outlined text-2xl">lock_reset</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface font-mono uppercase tracking-widest">Update Key</h1>
          <p className="text-on-surface-variant text-sm mt-1">Establish New Access Credentials</p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          <div>
            <label className="block text-sm font-label-caps text-on-surface-variant uppercase mb-2">New Access Key</label>
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
              <input
                type="password"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded py-3 pl-10 pr-4 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                placeholder="New password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
              />
            </div>

            <label className="block text-sm font-label-caps text-on-surface-variant uppercase mb-2">Confirm Key</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
              <input
                type="password"
                className={`w-full bg-surface-container-lowest border ${errorMsg ? 'border-error' : 'border-outline-variant'} rounded py-3 pl-10 pr-4 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono`}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrorMsg(''); }}
              />
            </div>
            {errorMsg && <p className="text-error text-xs mt-2 font-mono">{errorMsg}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-3 rounded hover:bg-on-primary-fixed-variant transition-colors font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Update and Authenticate'}
            {!loading && <span className="material-symbols-outlined text-lg">check_circle</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
