import React, { useState, useEffect } from 'react';

// Generates pseudo-random deterministic numbers based on string seed
const getDeterministicStat = (seedStr, min, max, decimalPlaces = 0) => {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
  }
  const randomizer = Math.abs(hash) / 2147483647; // 0 to 1
  const result = min + (randomizer * (max - min));
  return parseFloat(result.toFixed(decimalPlaces));
};

export default function SoilIntelligenceCard({ fieldId, cropType }) {
  // Use field properties to stick deterministic stats
  const seed = `${fieldId}-${cropType}`;
  
  const baseMoisture = getDeterministicStat(seed + 'moist', 20, 60, 0);
  const basePh = getDeterministicStat(seed + 'ph', 5.5, 7.5, 1);
  const baseNLevel = getDeterministicStat(seed + 'n', 30, 80, 0);
  const baseTemp = getDeterministicStat(seed + 'temp', 14, 28, 1);

  const [jitter, setJitter] = useState({ m: 0, p: 0, n: 0, t: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setJitter({
        m: Math.floor(Math.random() * 3) - 1,       // -1, 0, 1
        p: (Math.random() * 0.2 - 0.1),             // -0.1 to 0.1
        n: Math.floor(Math.random() * 5) - 2,       // -2 to 2
        t: (Math.random() * 0.4 - 0.2)              // -0.2 to 0.2
      });
    }, 3000); // Ticks every 3 seconds
    return () => clearInterval(interval);
  }, [fieldId]);

  const moisture = Math.max(0, baseMoisture + jitter.m);
  const ph = Math.max(0, (basePh + jitter.p).toFixed(1));
  const nLevel = Math.max(0, baseNLevel + jitter.n);
  const temp = (baseTemp + jitter.t).toFixed(1);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-soft p-6 border border-outline-variant/20 mb-6">
      <div className="flex justify-between items-center mb-6">
         <h3 className="text-[16px] font-semibold text-on-surface">Soil Intelligence</h3>
         <span className="text-[12px] uppercase font-bold text-on-surface-variant tracking-widest bg-surface-container px-3 py-1 rounded-full">
           Live Telemetry
         </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Moisture Content</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-bold tracking-tight text-on-surface">{moisture}%</span>
            <span className="text-[12px] font-bold text-healthy uppercase">Optimal</span>
          </div>
        </div>

        <div>
           <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">pH Balance</p>
           <div className="flex items-baseline gap-2">
             <span className="text-[32px] font-bold tracking-tight text-on-surface">{ph}</span>
             <span className="text-[12px] font-bold text-on-surface-variant">Neutral</span>
           </div>
        </div>

        <div>
           <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Nitrogen Level</p>
           <div className="flex items-baseline gap-2">
             <span className="text-[32px] font-bold tracking-tight text-on-surface">{nLevel}</span>
             <span className="text-[12px] font-bold text-on-surface-variant">mg/kg</span>
           </div>
        </div>

        <div>
           <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Temp @ 10cm</p>
           <div className="flex items-baseline gap-2">
             <span className="text-[32px] font-bold tracking-tight text-on-surface">{temp}°C</span>
           </div>
        </div>
      </div>
    </div>
  );
}
