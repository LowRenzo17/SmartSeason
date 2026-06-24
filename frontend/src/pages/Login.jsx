import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Leaf, Lock, User, Shield, Eye, EyeOff, Sun, Moon, Loader2, LogIn, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('AGENT'); // 'AGENT' or 'ADMIN'
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Handle dark mode toggle
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Reset fields when switching tabs
  const handleTabChange = (registering) => {
    setIsRegistering(registering);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setRole('AGENT');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = await login(username, password);
    if (success) {
      toast.success('Signed in successfully');
      navigate('/');
    } else {
      setError('Invalid username or password');
      toast.error('Sign in failed');
    }
    setIsLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Client-side validations
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      toast.error('Registration failed');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Registration failed');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Registration failed');
      setIsLoading(false);
      return;
    }

    const result = await register(username, password, role);
    if (result.success) {
      toast.success('Account created successfully');
      navigate('/');
    } else {
      setError(result.message);
      toast.error(result.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-surface flex items-center justify-center p-4 overflow-hidden transition-colors duration-300">
      {/* Immersive background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-healthy/10 dark:bg-healthy/5 rounded-full blur-[80px] pointer-events-none animate-pulse duration-[6000ms]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-container/10 dark:bg-secondary-container/5 rounded-full blur-[80px] pointer-events-none animate-pulse duration-[8000ms]"></div>
      
      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary-container)/4%,_transparent_60%)] pointer-events-none"></div>

      {/* Floating Theme Toggle */}
      <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="absolute top-6 right-6 p-2.5 rounded-[12px] bg-surface-container-lowest border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all shadow-soft cursor-pointer z-10"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-surface-container-lowest/80 dark:bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/40 shadow-soft rounded-[16px] p-8 z-10 transition-all duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 bg-surface-container flex items-center justify-center rounded-[14px] mb-3 text-primary border border-outline-variant/30 hover:scale-105 transition-transform duration-300">
            <Leaf size={28} className="animate-spin-slow text-emerald-700 dark:text-emerald-400" />
          </div>
          <h2 className="text-[28px] font-bold text-on-surface tracking-tight leading-tight">SmartSeason</h2>
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-on-surface-variant/80 mt-1">Agri-Intelligence Portal</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-surface-container p-1 rounded-[12px] mb-6 border border-outline-variant/20">
          <button
            type="button"
            onClick={() => handleTabChange(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-semibold rounded-[9px] transition-all cursor-pointer ${
              !isRegistering
                ? 'bg-surface-container-lowest text-on-surface shadow-soft border border-outline-variant/20'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'
            }`}
          >
            <LogIn size={15} />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabChange(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-semibold rounded-[9px] transition-all cursor-pointer ${
              isRegistering
                ? 'bg-surface-container-lowest text-on-surface shadow-soft border border-outline-variant/20'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'
            }`}
          >
            <UserPlus size={15} />
            Create Account
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-secondary-container/30 text-secondary text-[13px] font-medium py-3 px-4 rounded-[10px] mb-5 border border-secondary/40 text-center animate-shake">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-[10px] text-on-surface-variant/60" size={18} />
              <input 
                type="text" 
                placeholder="Enter username"
                className="w-full h-[38px] pl-10 pr-3 bg-surface-container-lowest border border-outline-variant rounded-[10px] text-[14px] text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-[10px] text-on-surface-variant/60" size={18} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Enter password"
                className="w-full h-[38px] pl-10 pr-10 bg-surface-container-lowest border border-outline-variant rounded-[10px] text-[14px] text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[9px] text-on-surface-variant/60 hover:text-on-surface transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Registration specific fields */}
          {isRegistering && (
            <>
              <div>
                <label className="block text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-[10px] text-on-surface-variant/60" size={18} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Confirm password"
                    className="w-full h-[38px] pl-10 pr-10 bg-surface-container-lowest border border-outline-variant rounded-[10px] text-[14px] text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-1.5">Select Portal Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('AGENT')}
                    className={`flex flex-col items-center p-2.5 rounded-[10px] border transition-all text-left cursor-pointer ${
                      role === 'AGENT'
                        ? 'border-primary bg-primary/5 text-primary dark:text-emerald-400 dark:border-emerald-500'
                        : 'border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container/50'
                    }`}
                  >
                    <User size={16} className="mb-1" />
                    <span className="text-[12px] font-bold">Field Agent</span>
                    <span className="text-[9px] opacity-75 text-center leading-tight mt-0.5">Collect field & crop information</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`flex flex-col items-center p-2.5 rounded-[10px] border transition-all text-left cursor-pointer ${
                      role === 'ADMIN'
                        ? 'border-primary bg-primary/5 text-primary dark:text-emerald-400 dark:border-emerald-500'
                        : 'border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container/50'
                    }`}
                  >
                    <Shield size={16} className="mb-1" />
                    <span className="text-[12px] font-bold">Administrator</span>
                    <span className="text-[9px] opacity-75 text-center leading-tight mt-0.5">Full access & user delegation</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-[40px] mt-4 bg-primary text-white text-[12px] font-bold uppercase tracking-[0.05em] rounded-[10px] hover:bg-primary-container transition-all disabled:opacity-70 flex items-center justify-center shadow-soft hover:shadow-hover cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              isRegistering ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        {/* Demo Accounts Panel - Only show when signing in */}
        {!isRegistering && (
          <div className="mt-8 pt-6 border-t border-outline-variant/30">
            <h4 className="text-[10px] font-bold tracking-[0.1em] uppercase text-on-surface-variant/80 text-center mb-3">Quick Demo Access</h4>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => { setUsername('admin'); setPassword('admin123'); }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-surface-container border border-outline-variant/20 hover:bg-surface-container-high text-on-surface text-[11px] font-bold uppercase tracking-[0.05em] py-2 rounded-[8px] transition-colors cursor-pointer"
              >
                <Shield size={12} className="text-secondary" />
                Admin
              </button>
              <button 
                type="button"
                onClick={() => { setUsername('agent1'); setPassword('agent123'); }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-surface-container border border-outline-variant/20 hover:bg-surface-container-high text-on-surface text-[11px] font-bold uppercase tracking-[0.05em] py-2 rounded-[8px] transition-colors cursor-pointer"
              >
                <User size={12} className="text-primary dark:text-emerald-400" />
                Agent
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
