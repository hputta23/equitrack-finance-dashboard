import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import TerminalLayout from './components/TerminalLayout';
import FinancialOverviewTerminalStyle from './pages/FinancialOverviewTerminalStyle';
import LiabilitiesAndExpensesTerminalStyle from './pages/LiabilitiesAndExpensesTerminalStyle';
import PortfolioTrackerTerminalStyle from './pages/PortfolioTrackerTerminalStyle';
import IncomeStrategyFlow from './pages/IncomeStrategyFlow';
import FinancialMetricsUpdateTerminalStyle from './pages/FinancialMetricsUpdateTerminalStyle';
import OnboardingWizardTerminalStyle from './pages/OnboardingWizardTerminalStyle';
import ProfileTerminalStyle from './pages/ProfileTerminalStyle';
import TradingJournal from './pages/TradingJournal';
import DailyTodos from './pages/DailyTodos';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import { FinancialProvider, useFinancial } from './context/FinancialContext';

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { state } = useFinancial();
  
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!state.hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

// Wrapper for onboarding to check auth but not onboarding completion
const OnboardingRouteWrapper = () => {
  const { state } = useFinancial();
  if (!state.isAuthenticated) return <Navigate to="/login" replace />;
  if (state.hasCompletedOnboarding) return <Navigate to="/" replace />;
  return <OnboardingWizardTerminalStyle />;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Onboarding doesn't use the main TerminalLayout */}
        <Route path="/onboarding" element={<OnboardingRouteWrapper />} />

        {/* Protected Dashboard Routes using TerminalLayout */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<TerminalLayout />}>
            <Route index element={<FinancialOverviewTerminalStyle />} />
            <Route path="expenses" element={<LiabilitiesAndExpensesTerminalStyle />} />
            <Route path="portfolio" element={<PortfolioTrackerTerminalStyle />} />
            <Route path="strategy" element={<IncomeStrategyFlow />} />
            <Route path="trades" element={<TradingJournal />} />
            <Route path="todos" element={<DailyTodos />} />
            <Route path="update" element={<FinancialMetricsUpdateTerminalStyle />} />
            <Route path="profile" element={<ProfileTerminalStyle />} />
          </Route>
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <FinancialProvider>
      <AppRoutes />
    </FinancialProvider>
  );
}

export default App;
