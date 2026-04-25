import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Leaf, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/50 shadow-soft rounded-[12px] p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-surface-container flex items-center justify-center rounded-[12px] mb-4 text-primary">
            <Leaf size={32} />
          </div>
          <h2 className="text-[32px] font-bold text-on-surface tracking-tight leading-tight">SmartSeason</h2>
          <p className="text-[12px] font-semibold tracking-[0.05em] uppercase text-on-surface-variant mt-2">Agri-Intelligence Portal</p>
        </div>

        {error && (
          <div className="bg-secondary-container/50 text-secondary text-[14px] font-semibold py-3 px-4 rounded-[8px] mb-6 border border-secondary p-3 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[12px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-on-surface-variant" size={20} />
              <input 
                type="text" 
                className="w-full h-[40px] pl-10 pr-3 bg-surface-container-lowest border border-outline-variant rounded-[8px] text-[14px] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[12px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-on-surface-variant" size={20} />
              <input 
                type="password" 
                className="w-full h-[40px] pl-10 pr-3 bg-surface-container-lowest border border-outline-variant rounded-[8px] text-[14px] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-[40px] mt-2 bg-primary text-white text-[12px] font-bold uppercase tracking-[0.05em] rounded-[8px] hover:bg-primary-container transition-colors disabled:opacity-70 flex items-center justify-center"
          >
            {isLoading ? <div className="h-4 w-4 border-2 border-surface-container-lowest/30 border-t-white rounded-full animate-spin"></div> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 flex gap-3">
          <button 
             type="button"
             onClick={() => { setUsername('admin'); setPassword('admin123'); }}
             className="flex-1 bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high text-on-surface text-[12px] font-bold uppercase tracking-widest py-2.5 rounded-[8px] transition-colors"
           >
             Admin Demo
          </button>
          <button 
             type="button"
             onClick={() => { setUsername('agent1'); setPassword('agent123'); }}
             className="flex-1 bg-surface-container border border-outline-variant/30 hover:bg-surface-container-high text-on-surface text-[12px] font-bold uppercase tracking-widest py-2.5 rounded-[8px] transition-colors"
           >
             Agent Demo
          </button>
        </div>
      </div>
    </div>
  );
}
