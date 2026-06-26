import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, CloudRain, Sun, Leaf, X, Stethoscope } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ActivityFeed from '../components/ActivityFeed';
import SoilIntelligenceCard from '../components/SoilIntelligenceCard';
import DiagnosisCard from '../components/DiagnosisCard';

export default function FieldDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [field, setField] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  
  // Weather state
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: '', cropType: '' });

  const stages = ['PLANTED', 'GROWING', 'READY', 'HARVESTED'];

  async function fetchField() {
    try {
      const res = await axios.get(`${API_URL}/fields/${id}?t=${Date.now()}`);
      setField(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadField() {
      try {
        const res = await axios.get(`${API_URL}/fields/${id}?t=${Date.now()}`);
        setField(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }

    async function loadDiagnoses() {
      try {
        const res = await axios.get(`${API_URL}/diagnoses?fieldId=${id}&t=${Date.now()}`);
        setDiagnoses(res.data);
      } catch (err) {
        console.error(err);
        setDiagnoses([]);
      }
    }

    async function loadWeather() {
      try {
        const res = await axios.get('https://api.open-meteo.com/v1/forecast?latitude=-1.0833&longitude=35.8667&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=Africa%2FNairobi');
        setWeather(res.data);
        setWeatherLoading(false);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setWeatherLoading(false);
      }
    }

    async function loadAgents() {
      try {
        const res = await axios.get(`${API_URL}/fields/agents?t=${Date.now()}`);
        setAgents(res.data);
      } catch (err) {
        console.error(err);
      }
    }

    loadField();
    loadDiagnoses();
    loadWeather();
    if (user?.role === 'ADMIN') loadAgents();
  }, [id, user]);

  const handleUpdateStage = async (e) => {
    try {
      await axios.put(`${API_URL}/fields/${id}`, { currentStage: e.target.value });
      fetchField();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAgent = async (newAgentId) => {
    try {
      await axios.put(`${API_URL}/fields/${id}`, { agentId: newAgentId || null });
      fetchField();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    try {
      await axios.post(`${API_URL}/fields/${id}/notes`, { content: noteContent });
      setNoteContent('');
      fetchField();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/fields/${id}`, { name: editData.name, cropType: editData.cropType });
      setShowEditModal(false);
      fetchField();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = () => {
    if (!field) return;
    
    // Create CSV content
    const headers = ['Type', 'Date', 'Detail'];
    const rows = [];
    
    rows.push(['FIELD INFO', new Date(field.plantingDate).toISOString(), `Name: ${field.name} | Crop: ${field.cropType} | Stage: ${field.currentStage} | Status: ${field.status}`]);
    
    if (field.notes) {
      field.notes.forEach(note => {
        rows.push(['ACTIVITY', new Date(note.createdAt).toISOString(), `[${note.author.username}] ${note.content.replace(/,/g, ';')}`]);
      });
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${field.name.replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-12 text-on-surface-variant font-medium">Loading Telemetry...</div>;
  if (!field) return <div className="p-12 text-atrisk font-bold">Access Denied or Field Not Found.</div>;

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      <div className="flex items-center gap-2 text-[12px] font-bold tracking-widest uppercase text-on-surface-variant mb-2">
         <Link to="/" className="hover:text-primary transition-colors flex items-center">
            <ArrowLeft size={14} className="mr-1" /> Organization
         </Link>
         <span>/</span>
         <span className="text-on-surface">{field.name}</span>
      </div>

      <div className="flex justify-between items-start bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 flex-col md:flex-row gap-4">
         <div>
            <div className="flex items-center gap-3 mb-2">
               <h1 className="text-[32px] font-bold text-on-surface tracking-[-0.02em] leading-tight flex items-center gap-3">
                 {field.name}
                 <StatusBadge status={field.status} />
               </h1>
            </div>
            <p className="text-[14px] text-on-surface-variant flex items-center gap-2">
              <Leaf size={14} className="text-primary"/> {field.cropType}  •  ID: SS-FLD-{field.id.toString().padStart(4, '0')}  •  Planted {new Date(field.plantingDate).toLocaleDateString()}
            </p>
         </div>
         <div className="flex items-center gap-3">
             <button onClick={handleExport} className="px-5 py-2.5 text-[12px] uppercase font-bold tracking-widest border border-outline-variant rounded-lg text-on-surface hover:bg-surface-container transition-colors">
                 Export Data
             </button>
             <Link to={`/diagnose?fieldId=${field.id}`} className="px-5 py-2.5 text-[12px] uppercase font-bold tracking-widest border border-primary/40 rounded-lg text-primary hover:bg-primary/10 transition-colors flex items-center gap-2">
                 <Stethoscope size={16} /> Diagnose
             </Link>
             {user?.role === 'ADMIN' && (
               <button 
                 onClick={() => { setEditData({ name: field.name, cropType: field.cropType }); setShowEditModal(true); }} 
                 className="px-5 py-2.5 text-[12px] uppercase font-bold tracking-widest bg-primary text-white rounded-lg hover:bg-primary-container transition-colors shadow-soft"
               >
                   Edit Details
               </button>
             )}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
         <div className="lg:col-span-8 flex flex-col gap-6">
            <SoilIntelligenceCard fieldId={field.id} cropType={field.cropType} />
            
            {/* Stage Pipeline control */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/30">
               <h3 className="text-[16px] font-semibold text-on-surface mb-4">Crop Lifecycle Stage</h3>
               <div className="flex gap-4 items-center mb-6">
                  <div className="flex-1 bg-surface-container h-2 rounded-full overflow-hidden">
                     <div 
                       className="bg-primary h-full transition-all duration-1000"
                       style={{ width: `${((stages.indexOf(field.currentStage) + 1) / stages.length) * 100}%` }}
                     />
                  </div>
                  <span className="text-[14px] font-bold text-primary">{Math.round(((stages.indexOf(field.currentStage) + 1) / stages.length) * 100)}%</span>
               </div>
               
               <div className="flex gap-4">
                  <select 
                    value={field.currentStage} 
                    onChange={handleUpdateStage}
                    className="flex-1 bg-surface-container border border-outline-variant/50 rounded-lg p-3 text-[14px] font-semibold text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  {user?.role === 'ADMIN' && (
                    <select 
                      value={field.agentId || ''} 
                      onChange={(e) => handleUpdateAgent(e.target.value)}
                      className="flex-1 bg-surface-container border border-outline-variant/50 rounded-lg p-3 text-[14px] font-semibold text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Unassigned</option>
                      {agents.map(ag => <option key={ag.id} value={ag.id}>{ag.username}</option>)}
                    </select>
                  )}
               </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-soft border border-outline-variant/30">
               <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="text-[16px] font-semibold text-on-surface">Crop Diagnosis History</h3>
                    <p className="text-[13px] text-on-surface-variant mt-1">AI-assisted crop health records saved for this field.</p>
                  </div>
                  <Link to={`/diagnose?fieldId=${field.id}`} className="text-[12px] uppercase font-bold tracking-widest text-primary hover:underline whitespace-nowrap">
                    New Diagnosis
                  </Link>
               </div>
               <div className="space-y-4">
                 {diagnoses.length === 0 ? (
                   <div className="bg-surface-container rounded-lg p-5 text-center text-[14px] text-on-surface-variant">
                     No crop diagnoses saved for this field yet.
                   </div>
                 ) : (
                   diagnoses.slice(0, 3).map(item => (
                     <DiagnosisCard key={item.id} diagnosis={item} compact />
                   ))
                 )}
               </div>
            </div>
         </div>

         <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="h-[400px]">
               <ActivityFeed notes={field.notes.map(n => ({
                 ...n, 
                 fieldName: field.name, 
                 cropType: field.cropType, 
                 authorName: n.author?.username 
               }))} />
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-soft border border-outline-variant/30 flex flex-col justify-between" style={{ backgroundColor: '#012d1d', color: 'white' }}>
               {weatherLoading || !weather ? (
                 <div className="flex justify-center items-center h-full text-[12px] text-inverse-primary">Loading live telemetry...</div>
               ) : (
                 <>
                   <div className="flex justify-between items-center mb-6">
                     <div>
                        <h3 className="text-[14px] font-light">Local Weather</h3>
                        <div className="flex items-baseline gap-2 mt-2">
                           {weather.current_weather.weathercode <= 3 ? <Sun size={32} className="text-secondary-container" /> : <CloudRain size={32} className="text-secondary-container" />}
                           <span className="text-[40px] font-bold tracking-tight">{Math.round(weather.current_weather.temperature)}°C</span>
                        </div>
                        <p className="text-[12px] text-inverse-primary mt-1">
                          {weather.current_weather.windspeed} km/h Wind • Live
                        </p>
                     </div>
                     {weather.current_weather.weathercode <= 3 ? (
                       <Sun size={80} className="text-surface opacity-10 blur-[2px]" />
                     ) : (
                       <CloudRain size={80} className="text-surface opacity-10 blur-[2px]" />
                     )}
                   </div>
                   
                   <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold tracking-widest text-inverse-primary border-t border-primary-container pt-4">
                     {weather.daily.time.slice(1, 5).map((dateStr, idx) => (
                       <div key={dateStr}>
                         {new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                         <br/>
                         <span className="text-white text-[12px]">
                           {Math.round(weather.daily.temperature_2m_max[idx + 1])}°
                         </span>
                       </div>
                     ))}
                   </div>
                 </>
               )}
            </div>

            <form onSubmit={handleAddNote} className="bg-surface-container-lowest rounded-xl shadow-soft border border-outline-variant/30 p-5">
               <h3 className="text-[14px] font-bold text-on-surface mb-3 uppercase tracking-widest">Log Field Update</h3>
               <textarea
                 placeholder="Describe plant health, moisture levels, or equipment..."
                 className="w-full bg-surface-container border border-outline-variant/50 rounded-lg p-3 text-[14px] text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px] mb-3 resize-none"
                 value={noteContent}
                 onChange={(e) => setNoteContent(e.target.value)}
               />
               <button type="submit" className="w-full flex justify-center items-center gap-2 bg-primary text-white py-3 rounded-lg text-[12px] uppercase font-bold tracking-widest hover:bg-primary-container transition-colors">
                  <Save size={16} /> Log Activity Record
               </button>
            </form>
         </div>
      </div>

      {/* Edit Field Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-outline/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-md shadow-soft border border-outline-variant/30 overflow-hidden">
            <div className="px-6 py-5 flex justify-between items-center bg-surface-container border-b border-outline-variant/30">
              <h3 className="text-[16px] font-bold text-on-surface">Edit Field Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-on-surface-variant hover:text-primary"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-1">Field Name</label>
                <input 
                  type="text" required
                  className="w-full h-[40px] px-3 bg-surface border border-outline-variant rounded-[8px] text-[14px] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-1">Crop Type</label>
                <input 
                  type="text" required
                  className="w-full h-[40px] px-3 bg-surface border border-outline-variant rounded-[8px] text-[14px] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={editData.cropType} onChange={e => setEditData({...editData, cropType: e.target.value})}
                />
              </div>
              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2 text-[12px] uppercase font-bold tracking-widest text-secondary hover:bg-secondary-container rounded-[8px] transition-colors border border-transparent">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary text-white text-[12px] uppercase font-bold tracking-widest rounded-[8px] hover:bg-primary-container transition-colors shadow-soft">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
