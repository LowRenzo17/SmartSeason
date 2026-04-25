import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { Leaf, Search, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';

export default function FieldTable({ fields, onRefresh }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterText, setFilterText] = useState('');
  const [fieldToDelete, setFieldToDelete] = useState(null);

  const filteredFields = fields.filter((f) => {
    const text = filterText.toLowerCase();
    return (
      f.name.toLowerCase().includes(text) ||
      f.cropType.toLowerCase().includes(text) ||
      f.currentStage.toLowerCase().includes(text) ||
      (f.status && f.status.toLowerCase().includes(text)) ||
      (f.agentName && f.agentName.toLowerCase().includes(text))
    );
  });

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Crop Type', 'Status', 'Stage', 'Assigned Agent'];
    const rows = filteredFields.map(f => [
      `SS-FLD-${f.id.toString().padStart(4, '0')}`,
      `"${f.name}"`,
      `"${f.cropType}"`,
      `"${f.status}"`,
      `"${f.currentStage}"`,
      `"${f.agentName || 'Unassigned'}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Get organization or generic name for export
    link.setAttribute('download', `SmartSeason_Inventory_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDelete = async (fieldId) => {
    try {
      await axios.delete(`${API_URL}/fields/${fieldId}`);
      toast.success('Field successfully deleted');
      setFieldToDelete(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete field');
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/30">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 border-b border-outline-variant/30 gap-4">
         <h2 className="text-[16px] font-semibold text-on-surface">Field Inventory</h2>
         <div className="flex gap-4 items-center w-full md:w-auto">
           <div className="relative flex-1 md:flex-none">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
               <Search size={14} />
             </div>
             <input
               type="text"
               placeholder="Filter fields..."
               value={filterText}
               onChange={(e) => setFilterText(e.target.value)}
               className="pl-9 pr-4 py-1.5 text-[12px] bg-surface border border-outline-variant/50 rounded-lg text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full md:w-48"
             />
           </div>
           <button 
             onClick={handleExport}
             className="px-4 py-1.5 flex items-center gap-2 text-[12px] uppercase tracking-wider font-semibold border border-secondary text-secondary rounded-lg hover:bg-secondary-container transition-colors shrink-0"
           >
              <Download size={14} /> Export
           </button>
         </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-surface-container border-b border-outline-variant">
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">Field Name</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">Crop Type</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">Status</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">Stage</th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">Assigned Agent</th>
              {user?.role === 'ADMIN' && <th className="px-4 py-3 w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {filteredFields.map((field) => (
              <tr 
                key={field.id}
                onClick={() => navigate(`/fields/${field.id}`)}
                className="border-b border-outline-variant/50 hover:bg-[#f2f4f2] cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-surface border border-outline-variant/30 flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                      <Leaf size={16} />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-on-surface">{field.name}</p>
                      <p className="text-[12px] text-on-surface-variant">ID: SS-FLD-{field.id.toString().padStart(4, '0')}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[14px] text-on-surface">{field.cropType}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={field.status} />
                </td>
                <td className="px-4 py-3 text-[14px] text-on-surface-variant">{field.currentStage}</td>
                <td className="px-4 py-3 text-[14px] text-on-surface-variant">
                   {field.agentName ? field.agentName : 'Unassigned'}
                </td>
                {user?.role === 'ADMIN' && (
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFieldToDelete(field); }}
                      className="p-1.5 text-on-surface-variant hover:text-atrisk hover:bg-surface-container rounded transition-colors"
                      title="Delete Field"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {filteredFields.length === 0 && (
              <tr>
                <td colSpan={user?.role === 'ADMIN' ? 6 : 5} className="px-4 py-8 text-center text-on-surface-variant text-[14px]">
                  No fields match the current filters or assignment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="px-5 py-4 bg-surface-container-lowest text-[12px] text-on-surface-variant font-medium flex justify-between items-center">
         <span>Showing {filteredFields.length > 0 ? 1 : 0}-{filteredFields.length} of {fields.length} total fields</span>
      </div>

      {fieldToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-outline/60 backdrop-blur-sm" onClick={() => setFieldToDelete(null)}>
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-sm shadow-soft border border-outline-variant/30 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-outline-variant/30">
              <h3 className="text-[16px] font-bold text-on-surface flex items-center gap-2">
                 <Trash2 size={18} className="text-atrisk" /> Delete Field
              </h3>
            </div>
            <div className="p-6">
              <p className="text-[14px] text-on-surface-variant mb-6 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-on-surface">{fieldToDelete.name}</strong>? This will also erase all associated activity logs.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setFieldToDelete(null)}
                  className="px-4 py-2 text-[14px] font-medium text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => confirmDelete(fieldToDelete.id)}
                  className="px-4 py-2 text-[14px] font-medium bg-atrisk text-on-primary border border-transparent hover:bg-atrisk/90 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
