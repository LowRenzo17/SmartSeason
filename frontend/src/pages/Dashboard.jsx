import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { LayoutGrid, CheckCircle2, AlertTriangle, CheckSquare, Plus, X, Shield, UserPlus, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import KPICard from '../components/KPICard';
import FieldTable from '../components/FieldTable';
import ActivityFeed from '../components/ActivityFeed';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [fields, setFields] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);

  // Modal and field creation state
  const [showModal, setShowModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [agents, setAgents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [newField, setNewField] = useState({ name: '', cropType: '', agentId: '' });
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });

  const handleCreateField = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/fields`, newField);
      setShowModal(false);
      setNewField({ name: '', cropType: '', agentId: '' });
      fetchData();
      toast.success('Field created successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Could not create field');
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/admins?t=${Date.now()}`);
      setAdmins(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/admin/admins`, newAdmin);
      setShowAdminModal(false);
      setNewAdmin({ username: '', password: '' });
      fetchAdmins();
      toast.success('Administrator created successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Could not create administrator');
    }
  };

  const fetchData = async () => {
    try {
      const statsRes = await axios.get(`${API_URL}/dashboard/summary?t=${Date.now()}`);
      setStats(statsRes.data);
      
      const fieldsRes = await axios.get(`${API_URL}/fields?t=${Date.now()}`);
      setFields(fieldsRes.data);

      if (statsRes.data.recentNotes) {
        setRecentNotes(statsRes.data.recentNotes);
      }
      
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    axios.get(`${API_URL}/dashboard/summary?t=${Date.now()}`)
      .then((statsRes) => {
        setStats(statsRes.data);
        if (statsRes.data.recentNotes) {
          setRecentNotes(statsRes.data.recentNotes);
        }
      })
      .catch((err) => console.error(err));

    axios.get(`${API_URL}/fields?t=${Date.now()}`)
      .then((fieldsRes) => setFields(fieldsRes.data))
      .catch((err) => console.error(err));

    if (user?.role === 'ADMIN') {
      axios.get(`${API_URL}/fields/agents?t=${Date.now()}`)
        .then((res) => setAgents(res.data))
        .catch((err) => console.error(err));

      axios.get(`${API_URL}/admin/admins?t=${Date.now()}`)
        .then((res) => setAdmins(res.data))
        .catch((err) => console.error(err));
    }
  }, [user]);

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Top Header */}
      <div className="flex justify-between items-center bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/30">
        <div>
           <h1 className="text-[24px] font-semibold text-on-surface leading-tight tracking-[-0.01em]">
             {user?.role === 'ADMIN' ? 'Admin Dashboard' : 'Agent Dashboard'}
           </h1>
           <p className="text-[14px] text-on-surface-variant mt-1">Strategic overview for Spring Operations</p>
        </div>
        <div className="flex gap-4">
           {user?.role === 'ADMIN' && (
             <>
               <button onClick={() => setShowAdminModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-outline-variant text-on-surface rounded-lg text-[12px] uppercase font-bold tracking-widest hover:bg-surface-container transition-colors shadow">
                 <Shield size={16} /> Add Admin
               </button>
               <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-[12px] uppercase font-bold tracking-widest hover:bg-primary-container transition-colors shadow">
                 <Plus size={16} /> Create New Field
               </button>
             </>
           )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
             label="Total Fields" 
             value={stats.totalFields} 
             icon={LayoutGrid} 
             trend="2 this mo"
             trendDirection="up"
          />
          <KPICard 
             label="Active" 
             value={stats.statusBreakdown.active} 
             icon={CheckCircle2} 
             statusPill="Healthy"
          />
          <KPICard 
             label="At Risk" 
             value={stats.statusBreakdown.atRisk} 
             icon={AlertTriangle} 
             trend="Action Req."
             trendDirection="down"
             statusPill="Alert"
          />
          <KPICard 
             label="Completed" 
             value={stats.statusBreakdown.completed} 
             icon={CheckSquare}
             statusPill="Dormant"
          />
        </div>
      )}

      {/* Bottom Layout - Activity & Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-max">
        {/* Left Column 50% - Activity Feed */}
        <div className="flex flex-col h-[600px]">
          <ActivityFeed notes={recentNotes} />
        </div>

        {/* Right Column 50% - Field Table Summary */}
        <div className="flex flex-col h-max overflow-hidden">
          <FieldTable fields={fields} onRefresh={fetchData} />
        </div>
      </div>

      {user?.role === 'ADMIN' && (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/30 flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-on-surface">Administrators</h2>
              <p className="text-[13px] text-on-surface-variant mt-1">Accounts with full dashboard and delegation access.</p>
            </div>
            <button onClick={() => setShowAdminModal(true)} className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-primary text-white hover:bg-primary-container transition-colors" aria-label="Add administrator">
              <UserPlus size={17} />
            </button>
          </div>
          <div className="divide-y divide-outline-variant/30">
            {admins.map(admin => (
              <div key={admin.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-md bg-surface flex items-center justify-center text-primary border border-outline-variant/30">
                    <Shield size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-on-surface truncate">{admin.username}</p>
                    <p className="text-[12px] text-on-surface-variant">{admin.agentCount} managed agents</p>
                  </div>
                </div>
                <span className="text-[11px] uppercase font-bold tracking-[0.05em] text-on-surface-variant">Admin</span>
              </div>
            ))}
            {admins.length === 0 && (
              <div className="px-5 py-6 text-center text-[14px] text-on-surface-variant">
                No administrators found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Field Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-outline/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-md shadow-soft border border-outline-variant/30 overflow-hidden">
            <div className="px-6 py-5 flex justify-between items-center bg-surface-container border-b border-outline-variant/30">
              <h3 className="text-[16px] font-bold text-on-surface">Create New Field</h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-primary"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateField} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-1">Field Name</label>
                <input 
                  type="text" required
                  className="w-full h-[40px] px-3 bg-surface border border-outline-variant rounded-[8px] text-[14px] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={newField.name} onChange={e => setNewField({...newField, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-1">Crop Type</label>
                <input 
                  type="text" required
                  className="w-full h-[40px] px-3 bg-surface border border-outline-variant rounded-[8px] text-[14px] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  placeholder="e.g. Corn, Wheat"
                  value={newField.cropType} onChange={e => setNewField({...newField, cropType: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-1">Assign Agent (Optional)</label>
                <select 
                  className="w-full h-[40px] px-3 bg-surface border border-outline-variant rounded-[8px] text-[14px] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={newField.agentId} onChange={e => setNewField({...newField, agentId: e.target.value})}
                >
                  <option value="">-- Unassigned --</option>
                  {agents.map(ag => (
                    <option key={ag.id} value={ag.id}>{ag.username}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-[12px] uppercase font-bold tracking-widest text-secondary hover:bg-secondary-container rounded-[8px] transition-colors border border-transparent">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary text-white text-[12px] uppercase font-bold tracking-widest rounded-[8px] hover:bg-primary-container transition-colors shadow-soft">Create Field</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-outline/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-md shadow-soft border border-outline-variant/30 overflow-hidden">
            <div className="px-6 py-5 flex justify-between items-center bg-surface-container border-b border-outline-variant/30">
              <h3 className="text-[16px] font-bold text-on-surface">Create Administrator</h3>
              <button onClick={() => setShowAdminModal(false)} className="text-on-surface-variant hover:text-primary"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-1">Username</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-[11px] text-on-surface-variant/60" size={17} />
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={50}
                    className="w-full h-[40px] pl-10 pr-3 bg-surface border border-outline-variant rounded-[8px] text-[14px] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    value={newAdmin.username}
                    onChange={e => setNewAdmin({ ...newAdmin, username: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-1">Temporary Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-[11px] text-on-surface-variant/60" size={17} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    maxLength={100}
                    className="w-full h-[40px] pl-10 pr-3 bg-surface border border-outline-variant rounded-[8px] text-[14px] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    value={newAdmin.password}
                    onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowAdminModal(false)} className="px-5 py-2 text-[12px] uppercase font-bold tracking-widest text-secondary hover:bg-secondary-container rounded-[8px] transition-colors border border-transparent">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary text-white text-[12px] uppercase font-bold tracking-widest rounded-[8px] hover:bg-primary-container transition-colors shadow-soft">Create Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
