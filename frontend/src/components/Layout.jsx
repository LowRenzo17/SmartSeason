import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  return (
    <div className="flex min-h-screen bg-surface font-sans text-on-surface overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-outline/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <main className={`flex-1 transition-all duration-300 ease-in-out flex flex-col h-screen overflow-hidden ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        {/* Header - Always visible to allow toggling */}
        <div className="flex items-center justify-between p-4 bg-surface-container-lowest border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 text-on-surface-variant hover:bg-surface-container rounded-md text-primary transition-colors">
              <Menu size={24} />
            </button>
            <span className={`font-bold text-primary tracking-tight transition-opacity duration-300 ${sidebarOpen ? 'lg:opacity-0 lg:w-0 overflow-hidden' : 'opacity-100'}`}>SmartSeason</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-[1440px] mx-auto min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
