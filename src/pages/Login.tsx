import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancial } from '../context/FinancialContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login, resetPassword, state } = useFinancial();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (!isResetMode && !password)) {
      setErrorMsg('Required fields missing');
      return;
    }
    if (!isResetMode && isSignUp && password.length < 8) {
      setErrorMsg('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    
    if (isResetMode) {
      const success = await resetPassword(email);
      setLoading(false);
      if (success) setIsResetMode(false);
      return;
    }

    const success = await login(email, password, isSignUp);
    setLoading(false);
    
    if (success && isSignUp) {
      // Signup success — toast shown by context; prompt user to check email
      setIsSignUp(false);
      setPassword('');
    } else if (success && !isSignUp) {
      // Sign-in success: navigate based on onboarding state
      if (state.hasCompletedOnboarding) {
        navigate('/');
      } else {
        navigate('/onboarding');
      }
    } else if (!success) {
      setErrorMsg('Authentication failed. Check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container border border-outline-variant rounded-lg p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary mb-4 shadow-[0_0_15px_rgba(142,213,255,0.3)]">
            <span className="material-symbols-outlined text-2xl">account_balance</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface font-mono uppercase tracking-widest">2026Track</h1>
          <p className="text-on-surface-variant text-sm mt-1">{isResetMode ? 'Secure Key Recovery' : 'Secure Institutional Dashboard'}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-label-caps text-on-surface-variant uppercase mb-2">Email Identity</label>
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">mail</span>
              <input
                type="email"
                className="w-full bg-surface-container-lowest border border-outline-variant rounded py-3 pl-10 pr-4 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                placeholder="commander@2026track.app"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
              />
            </div>

            {!isResetMode && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-label-caps text-on-surface-variant uppercase">Access Key</label>
                  <button 
                    type="button"
                    onClick={() => setIsResetMode(true)}
                    className="text-xs text-primary hover:underline font-mono uppercase"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
                  <input
                    type="password"
                    className={`w-full bg-surface-container-lowest border ${errorMsg ? 'border-error' : 'border-outline-variant'} rounded py-3 pl-10 pr-4 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono`}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                  />
                </div>
              </>
            )}
            
            {errorMsg && <p className="text-error text-xs mt-2 font-mono">{errorMsg}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-3 rounded hover:bg-on-primary-fixed-variant transition-colors font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isResetMode ? 'Send Recovery Link' : (isSignUp ? 'Initialize Profile' : 'Authenticate'))}
            {!loading && <span className="material-symbols-outlined text-lg">{isResetMode ? 'key' : (isSignUp ? 'person_add' : 'login')}</span>}
          </button>
          
          {isResetMode && (
            <button 
              type="button"
              onClick={() => setIsResetMode(false)}
              className="w-full text-on-surface-variant text-xs font-mono hover:underline uppercase"
            >
              Back to Authentication
            </button>
          )}
        </form>
        
        {!isResetMode && (
          <div className="mt-6 pt-4 border-t border-outline-variant text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary text-sm font-mono hover:underline"
            >
              {isSignUp ? 'Already have a profile? Authenticate.' : 'No profile? Initialize one.'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
