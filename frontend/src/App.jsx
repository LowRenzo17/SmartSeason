import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

import Login from './pages/Login';
import Layout from './components/Layout';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const FieldDetail = React.lazy(() => import('./pages/FieldDetail'));
const CropDoctor = React.lazy(() => import('./pages/CropDoctor'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen w-full bg-surface">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-primary" size={32} />
      <p className="text-[14px] font-medium text-on-surface-variant tracking-tight">Loading SmartSeason...</p>
    </div>
  </div>
);

const InactivityMonitor = () => {
  const { user, logout } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    let timeoutId;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 5 minutes of inactivity triggers logout
      timeoutId = setTimeout(() => {
        logout();
      }, 5 * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [user, logout]);

  return null;
};

// Initialize dark mode before paint
const initializeTheme = () => {
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};
initializeTheme();

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'dark:bg-surface-container-highest dark:text-on-surface text-[14px] font-medium shadow-hover rounded-lg border border-outline-variant/30',
          success: {
            iconTheme: { primary: '#276b4a', secondary: '#ffffff' },
          },
        }}
      />
      <InactivityMonitor />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/fields/:id"
            element={
              <PrivateRoute>
                <FieldDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/diagnose"
            element={
              <PrivateRoute>
                <CropDoctor />
              </PrivateRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
