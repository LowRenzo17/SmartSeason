import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, Trees, Bell, X } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`fixed top-0 left-0 h-screen w-64 bg-surface-container-lowest border-r border-outline-variant flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div>
        <div className="pt-6 pb-8 px-6 flex justify-between items-center">
          <div>
            <h1 className="text-[20px] font-bold text-primary tracking-tight leading-tight">SmartSeason</h1>
            <p className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-[0.05em] mt-1">
              Agri-Intelligence
            </p>
          </div>
          <button 
            className="lg:hidden text-on-surface-variant hover:text-primary hover:bg-surface-container p-2 rounded-md -mr-2"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="px-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-md text-[14px] font-medium transition-colors ${
                  (isActive && item.path === '/') 
                  ? 'bg-primary-container text-on-primary-container' 
                  : 'text-on-surface-variant hover:bg-surface-container'
                }`
              }
            >
              <item.icon size={18} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-outline-variant">
        <div className="mb-4 px-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-primary font-bold text-sm">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[14px] font-medium text-on-surface tracking-tight">{user?.username}</p>
            <p className="text-[12px] text-on-surface-variant capitalize">{user?.role.toLowerCase()}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-[14px] font-medium text-secondary hover:bg-secondary-container transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
