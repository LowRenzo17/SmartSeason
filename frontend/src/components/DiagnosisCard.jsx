import { AlertTriangle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

const severityStyles = {
  Low: 'text-active bg-primary/10',
  Medium: 'text-secondary bg-secondary-container/60',
  High: 'text-atrisk bg-atrisk/10'
};

export default function DiagnosisCard({ diagnosis, compact = false }) {
  const severityClass = severityStyles[diagnosis.severity] || severityStyles.Medium;
  const sourceLabel = {
    openai: 'OpenAI Vision',
    gemini: 'Gemini Vision'
  }[diagnosis.source] || 'Demo Assist';

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden shadow-soft">
      <div className="p-4 border-b border-outline-variant/30 flex items-start gap-4">
        {!compact && (
          <img
            src={diagnosis.imageDataUrl}
            alt="Diagnosed crop"
            className="w-20 h-20 rounded-lg object-cover border border-outline-variant/40 bg-surface"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${severityClass}`}>
              {diagnosis.severity}
            </span>
            <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-surface-container text-on-surface-variant">
              {diagnosis.confidence}% Confidence
            </span>
            <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary flex items-center gap-1">
              <Sparkles size={12} /> {sourceLabel}
            </span>
          </div>
          <h3 className="text-[18px] font-bold text-on-surface leading-tight">{diagnosis.suspectedIssue}</h3>
          <p className="text-[12px] text-on-surface-variant mt-1">
            {diagnosis.fieldName || 'Field'} - {new Date(diagnosis.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-[14px] text-on-surface leading-relaxed">{diagnosis.summary}</p>

        {diagnosis.symptoms && (
          <div className="bg-surface-container rounded-lg p-3">
            <p className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">Reported Symptoms</p>
            <p className="text-[14px] text-on-surface">{diagnosis.symptoms}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] uppercase tracking-widest font-bold text-primary mb-2">
              <CheckCircle2 size={14} /> Possible Remedies
            </div>
            <ul className="space-y-2">
              {(diagnosis.remedies || []).map((item, index) => (
                <li key={index} className="text-[14px] text-on-surface leading-relaxed bg-surface-container rounded-lg p-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 text-[12px] uppercase tracking-widest font-bold text-primary mb-2">
              <ShieldCheck size={14} /> Prevention
            </div>
            <ul className="space-y-2">
              {(diagnosis.prevention || []).map((item, index) => (
                <li key={index} className="text-[14px] text-on-surface leading-relaxed bg-surface-container rounded-lg p-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex gap-3 bg-atrisk/10 text-on-surface rounded-lg p-3 border border-atrisk/20">
          <AlertTriangle size={18} className="text-atrisk shrink-0 mt-0.5" />
          <p className="text-[13px] leading-relaxed">{diagnosis.escalation}</p>
        </div>
      </div>
    </div>
  );
}
