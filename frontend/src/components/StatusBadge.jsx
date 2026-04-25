import React from 'react';

export default function StatusBadge({ status }) {
  // Map backend status to UI spec
  let bgClass = '';
  let textClass = '';

  if (status === 'Active') {
    bgClass = 'bg-healthy';
    textClass = 'text-primary';
  } else if (status === 'At Risk') {
    bgClass = 'bg-atrisk';
    textClass = 'text-white';
  } else {
    // Completed -> Dormant visual
    bgClass = 'bg-dormant';
    textClass = 'text-on-surface-variant';
  }

  // Display text override: Active->Healthy, Completed->Dormant
  const displayText = status === 'Active' ? 'Healthy' : status === 'Completed' ? 'Dormant' : status;

  return (
    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[12px] font-semibold uppercase tracking-[0.05em] ${bgClass} ${textClass}`}>
      {displayText}
    </span>
  );
}
