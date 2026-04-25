import React from 'react';

export default function KPICard({ label, value, trend, icon: Icon, trendDirection, statusPill }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-soft hover:shadow-hover transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-primary">
          {Icon && <Icon size={20} />}
        </div>
        
        {trend && (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${trendDirection === 'up' ? 'bg-healthy text-primary' : trendDirection === 'down' ? 'bg-secondary-container text-secondary' : 'bg-surface text-on-surface-variant'}`}>
            {trendDirection === 'up' ? '+' : ''}{trend}
          </span>
        )}
        
        {statusPill && (
             <span className="px-3 py-1 rounded-full text-[12px] font-semibold bg-surface-container-high text-on-surface-variant tracking-[0.05em] uppercase">
               {statusPill}
             </span>
        )}
      </div>
      
      <div>
        <h3 className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-[0.05em] mb-1">
          {label}
        </h3>
        <p className="text-[32px] font-bold text-on-surface leading-tight tracking-[-0.02em]">
          {value}
        </p>
      </div>
    </div>
  );
}
