import React from 'react';

export default function ActivityFeed({ notes }) {
  const isAlert = (text) => {
    const lower = text.toLowerCase();
    return lower.includes('pest') || lower.includes('alert') || lower.includes('drought') || lower.includes('risk');
  };

  const getTitle = (note) => {
    let base = `Update by ${note.authorName || 'User'}`;
    const context = [];
    if (note.fieldName) context.push(note.fieldName);
    if (note.cropType) context.push(note.cropType);
    
    if (context.length > 0) {
      base += ` on ${context.join(' - ')}`;
    }

    if (isAlert(note.content)) return `Alert / Warning${context.length > 0 ? ` on ${context.join(' - ')}` : ''}`;
    return base;
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-soft h-full flex flex-col border border-outline-variant/30">
      <div className="flex justify-between items-center p-5 border-b border-outline-variant/30 bg-surface-container-lowest">
        <h2 className="text-[16px] font-semibold text-on-surface">Recent Updates</h2>
        <button className="text-[12px] uppercase font-bold text-primary hover:underline tracking-widest bg-transparent border-none">
          View All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant text-[14px]">
            No recent activity across fields.
          </div>
        ) : (
          notes.map((note, index) => {
            const alert = isAlert(note.content);
            return (
              <div 
                key={note.id || index} 
                className={`p-4 border-b border-outline-variant/50 flex flex-col gap-1 transition-colors hover:bg-surface/50
                  ${alert ? 'border-l-[3px] border-l-atrisk bg-surface-container-high/30' : 'border-l-[3px] border-l-transparent'}
                `}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[14px] font-bold text-on-surface">{getTitle(note)}</span>
                  <span className="text-[12px] font-semibold tracking-widest uppercase text-on-surface-variant whitespace-nowrap ml-4">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[14px] text-on-surface leading-relaxed mt-1">
                  {note.content}
                </p>
                {alert && (
                   <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-atrisk bg-secondary-container/30 w-max px-2 py-0.5 rounded-full">
                     AT RISK FLAG
                   </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
