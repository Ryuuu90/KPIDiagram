import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import toast from 'react-hot-toast';
import keycloak from '../keycloak';
import {
  Users, Database, Plus, Search, Trash2, Edit3, Save, X, ChevronLeft, ChevronRight, Shield, LogOut, Info
} from 'lucide-react';
import finansiaLogo from '../public/finansia-logo.jpeg';

// ─── Available collections ────────────────────────────────────────────────────
const MODELS = [
  { key: 'baseelements',   label: 'BaseElements',   description: 'Accounting indicators & their children' },
  { key: 'globalelements', label: 'GlobalElements', description: 'KPI formulas, categories, typologies' },
];

function avatarColor(name) {
  const colors = ['#f97316','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
  let h = 0;
  for (let c of (name || 'U')) h = c.charCodeAt(0) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

// ─── Component to edit arrays (flat strings or objects) inline ───────────────
const ArrayTableEditor = ({ value, onChange }) => {
  const arr = Array.isArray(value) ? value : [];
  const isFlat = arr.length > 0 && typeof arr[0] !== 'object';
  
  // Get all unique keys across all objects in the array
  const allKeys = Array.from(new Set(arr.flatMap(item => typeof item === 'object' && item !== null ? Object.keys(item) : [])));
  const keys = allKeys.length > 0 ? allKeys : ['id', 'name'];

  const updateObjField = (idx, key, val) => {
    const newArr = [...arr];
    newArr[idx] = { ...newArr[idx], [key]: val };
    onChange(newArr);
  };

  const updateFlatField = (idx, val) => {
    const newArr = [...arr];
    newArr[idx] = val;
    onChange(newArr);
  };

  const addObjRow = () => {
    const newObj = {};
    keys.forEach(k => newObj[k] = '');
    onChange([...arr, newObj]);
  };

  const addFlatRow = () => {
    onChange([...arr, '']);
  };

  const removeRow = (idx) => {
    onChange(arr.filter((_, i) => i !== idx));
  };

  return (
    <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 min-w-[300px]">
      {isFlat || arr.length === 0 ? (
        <div className="flex flex-col gap-2">
          {arr.map((val, idx) => (
            <div key={idx} className="flex gap-2">
              <input 
                value={typeof val === 'string' ? val : ''} 
                onChange={e => updateFlatField(idx, e.target.value)} 
                className="flex-1 p-1.5 text-xs border rounded bg-white focus:outline-none focus:border-orange-400" 
              />
              <button onClick={() => removeRow(idx)} className="text-red-500 hover:bg-red-50 px-1 rounded"><X size={14}/></button>
            </div>
          ))}
          <div className="flex gap-3 mt-1">
            <button onClick={addFlatRow} className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded">
              <Plus size={14} /> Add String
            </button>
            <button onClick={addObjRow} className="text-xs text-green-600 font-bold flex items-center gap-1 hover:bg-green-50 px-2 py-1 rounded" title="If this should be an object array instead">
              <Plus size={14} /> Add Object
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr>
                {keys.map(k => <th key={k} className="font-semibold text-slate-500 pb-1 border-b border-slate-200">{k}</th>)}
                <th className="border-b border-slate-200"></th>
              </tr>
            </thead>
            <tbody>
              {arr.map((row, idx) => (
                <tr key={idx}>
                  {keys.map(k => (
                    <td key={k} className="p-0.5">
                      <input 
                        value={row[k] || ''} 
                        onChange={e => updateObjField(idx, k, e.target.value)}
                        className="w-full p-1 border rounded bg-white focus:outline-none focus:border-orange-400"
                      />
                    </td>
                  ))}
                  <td className="p-0.5 w-6 text-center">
                    <button onClick={() => removeRow(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={12}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addObjRow} className="text-xs text-blue-600 font-bold self-start flex items-center gap-1 mt-1 hover:bg-blue-50 px-2 py-1 rounded">
            <Plus size={14} /> Add Row
          </button>
        </div>
      )}
    </div>
  );
};

const FounderDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');

  // ── User management state ──
  const [clients, setClients]       = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch]         = useState('');
  const [panelOpen, setPanelOpen]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, username }
  const [submitting, setSubmitting]  = useState(false);
  const [newUser, setNewUser] = useState({
    username: '', email: '', password: '', firstName: '', lastName: '',
    roles: 'user', companyName: '', department: '', isActive: true,
  });
  const [showPassword, setShowPassword] = useState(false);

  // ── Model editor state ──
  const [selectedModel, setSelectedModel] = useState(MODELS[0].key);
  const [modelDocs, setModelDocs]   = useState([]);
  const [modelMeta, setModelMeta]   = useState({ total: 0, page: 1, limit: 20 });
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [savingRow, setSavingRow]   = useState(null);
  const [confirmDocDelete, setConfirmDocDelete] = useState(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // Users API
  // ═══════════════════════════════════════════════════════════════════════════
  const fetchClients = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const { data } = await api.get('/founder/clients');
      setClients(data);
    } catch (err) {
      toast.error('Failed to load clients');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.username.trim()) return toast.error('Username is required');
    if (newUser.password.length < 6) return toast.error('Password must be at least 6 characters');

    setSubmitting(true);
    try {
      await api.post('/founder/clients', {
        ...newUser,
        roles: [newUser.roles],
      });
      toast.success(`User "${newUser.username}" created successfully!`);
      setNewUser({ username:'', email:'', password:'', firstName:'', lastName:'', roles:'user', companyName:'', department:'', isActive:true });
      setPanelOpen(false);
      fetchClients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, current) => {
    try {
      await api.put(`/founder/clients/${id}`, { isActive: !current });
      toast.success(`User ${!current ? 'activated' : 'deactivated'}`);
      fetchClients();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const doDeleteUser = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/founder/clients/${confirmDelete.id}`);
      toast.success(`Deleted "${confirmDelete.username}"`);
      setConfirmDelete(null);
      fetchClients();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const filtered = clients.filter(c =>
    !search || c.username.includes(search.toLowerCase()) || (c.email || '').includes(search.toLowerCase())
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Model API
  // ═══════════════════════════════════════════════════════════════════════════
  const fetchDocs = useCallback(async (page = 1) => {
    setLoadingDocs(true);
    try {
      const { data } = await api.get(`/founder/models/${selectedModel}?page=${page}&limit=${modelMeta.limit}`);
      setModelDocs(data.docs);
      setModelMeta({ total: data.total, page: data.page, limit: data.limit });
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoadingDocs(false);
    }
  }, [selectedModel, modelMeta.limit]);

  useEffect(() => {
    if (activeTab === 'models') fetchDocs(1);
  }, [selectedModel, activeTab, fetchDocs]);

  const startEdit = (doc) => {
    const { _id, __v, ...fields } = doc;
    setEditingRow({ id: _id, data: { ...fields }, originalDoc: doc });
  };
  const cancelEdit = () => setEditingRow(null);

  const saveEdit = async () => {
    if (!editingRow) return;

    setSavingRow(editingRow.id);
    try {
      await api.put(`/founder/models/${selectedModel}/${editingRow.id}`, editingRow.data);
      toast.success('Document updated');
      setEditingRow(null);
      fetchDocs(modelMeta.page);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingRow(null);
    }
  };

  const doDeleteDoc = async () => {
    if (!confirmDocDelete) return;
    try {
      await api.delete(`/founder/models/${confirmDocDelete.model}/${confirmDocDelete.id}`);
      toast.success('Document deleted');
      setConfirmDocDelete(null);
      fetchDocs(modelMeta.page);
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const columns = modelDocs.length > 0 ? Object.keys(modelDocs[0]).filter(k => k !== '__v') : [];

  return (
    <div className="min-h-screen bg-[#fef3e8]/30 flex flex-col font-sans">
      
      {/* Navbar (replaces Sidebar) */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-orange-100 flex items-center justify-between px-6 py-3 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <img src={finansiaLogo} alt="Finansia Logo" className="h-10 w-auto object-contain" />
          <span className="h-6 w-px bg-slate-200"></span>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-orange-500" size={24} /> Founder Panel
          </h1>
        </div>
        <button 
          onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-colors"
        >
          <LogOut size={16} /> {t('sidebar.deconnexion') || 'Logout'}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full animate-fade-in">

        {/* Tabs & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex bg-white/60 p-1.5 rounded-2xl border border-orange-100 shadow-sm">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'users' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users size={18} /> User Management
              <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs">{clients.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'models' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Database size={18} /> Data Models
            </button>
          </div>

          {activeTab === 'users' && (
            <button 
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-orange-200 transition-all active:scale-95"
            >
              <Plus size={18} /> Create New User
            </button>
          )}
        </div>

        {/* ════════════════ TAB 1: USERS ════════════════ */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-sm transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Users Grid */}
            {loadingUsers ? (
              <div className="text-center py-20 text-slate-400 font-medium animate-pulse">Loading users...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-slate-500 bg-white/50 rounded-3xl border border-dashed border-slate-300">
                No users found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(client => {
                  const initials = (client.firstName?.[0] || client.username?.[0] || 'U').toUpperCase();
                  return (
                    <div key={client._id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-5 relative overflow-hidden group">
                      
                      {/* Top row */}
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-inner"
                          style={{ backgroundColor: avatarColor(client.username) }}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-800 truncate leading-tight">{client.username}</h3>
                          <p className="text-xs text-slate-500 truncate">{client.email || 'No email provided'}</p>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400 text-xs font-medium mb-1">Company</p>
                          <p className="text-slate-700 font-medium truncate">{client.companyName || '—'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs font-medium mb-1">Status</p>
                          <button
                            onClick={() => toggleStatus(client._id, client.isActive)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                              client.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${client.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {client.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </div>

                      {/* Roles */}
                      <div>
                        <p className="text-slate-400 text-xs font-medium mb-2">Roles</p>
                        <div className="flex flex-wrap gap-2">
                          {(client.roles || []).map(r => (
                            <span key={r} className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                              r === 'founder' ? 'bg-orange-100 text-orange-600' : 
                              r === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-auto pt-4 border-t border-slate-50 flex justify-end">
                        <button 
                          onClick={() => setConfirmDelete({ id: client._id, username: client.username })}
                          className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} /> Delete User
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════ TAB 2: MODELS ════════════════ */}
        {activeTab === 'models' && (
          <div className="space-y-6">
            
            {/* Model Selector */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-orange-100 flex flex-wrap gap-2">
              {MODELS.map(m => (
                <button
                  key={m.key}
                  onClick={() => { setSelectedModel(m.key); setEditingRow(null); }}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedModel === m.key ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
              <Info className="text-blue-500" size={20} />
              <div>
                <p className="text-sm font-semibold text-blue-900">{MODELS.find(m => m.key === selectedModel)?.label}</p>
                <p className="text-xs text-blue-700">{MODELS.find(m => m.key === selectedModel)?.description} — {modelMeta.total} records total.</p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                      {columns.map(col => <th key={col} className="p-4 font-bold">{col === '_id' ? 'ID' : col}</th>)}
                      <th className="p-4 text-right font-bold sticky right-0 bg-slate-50">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                    {loadingDocs ? (
                      <tr><td colSpan={columns.length + 1} className="p-10 text-center text-slate-400">Loading...</td></tr>
                    ) : modelDocs.length === 0 ? (
                      <tr><td colSpan={columns.length + 1} className="p-10 text-center text-slate-400">No documents found.</td></tr>
                    ) : (
                      modelDocs.map(doc => {
                        const isEditing = editingRow?.id === doc._id;
                        return (
                          <tr key={doc._id} className={`hover:bg-slate-50/50 transition-colors ${isEditing ? 'bg-orange-50/30' : ''}`}>
                            {columns.map(col => {
                              const isObj = typeof doc[col] === 'object' && doc[col] !== null;
                              return (
                                <td key={col} className="p-4 align-middle">
                                  {col === '_id' ? (
                                    <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">{String(doc._id).slice(-6)}</span>
                                  ) : isEditing ? (
                                    Array.isArray(editingRow.originalDoc[col]) ? (
                                      <ArrayTableEditor 
                                        value={editingRow.data[col]} 
                                        onChange={newVal => setEditingRow(prev => ({ ...prev, data: { ...prev.data, [col]: newVal } }))} 
                                      />
                                    ) : typeof editingRow.originalDoc[col] === 'object' && editingRow.originalDoc[col] !== null ? (
                                      <textarea
                                        value={typeof editingRow.data[col] === 'object' ? JSON.stringify(editingRow.data[col], null, 2) : editingRow.data[col] || ''}
                                        onChange={e => {
                                          try {
                                            const parsed = JSON.parse(e.target.value);
                                            setEditingRow(prev => ({ ...prev, data: { ...prev.data, [col]: parsed } }));
                                          } catch {
                                            setEditingRow(prev => ({ ...prev, data: { ...prev.data, [col]: e.target.value } }));
                                          }
                                        }}
                                        className="w-full min-w-[250px] p-2 bg-white border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-xs font-mono custom-scrollbar"
                                        rows={4}
                                      />
                                    ) : (
                                      <input
                                        value={editingRow.data[col] == null ? '' : String(editingRow.data[col])}
                                        onChange={e => setEditingRow(prev => ({ ...prev, data: { ...prev.data, [col]: e.target.value } }))}
                                        className="w-full min-w-[100px] p-2 bg-white border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                                      />
                                    )
                                  ) : isObj ? (
                                    <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto custom-scrollbar max-w-[300px]">
                                      {Array.isArray(doc[col]) ? (
                                        doc[col].length > 0 ? (
                                          doc[col].map((item, i) => (
                                            <span key={i} className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded whitespace-nowrap text-slate-600">
                                              {typeof item === 'object' && item !== null ? Object.values(item).join(' - ') : String(item)}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-xs text-slate-400 italic">Empty array</span>
                                        )
                                      ) : (
                                        <span className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                                          {JSON.stringify(doc[col])}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="line-clamp-2 max-w-[250px]" title={String(doc[col])}>
                                      {doc[col] == null ? <span className="text-slate-300">—</span> : String(doc[col])}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="p-4 text-right sticky right-0 bg-white group-hover:bg-slate-50/50 transition-colors">
                              {isEditing ? (
                                <div className="flex gap-2 justify-end">
                                  <button onClick={cancelEdit} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                                  <button onClick={saveEdit} disabled={savingRow === doc._id} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg font-medium flex items-center gap-1">
                                    <Save size={16} /> Save
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2 justify-end text-slate-400 transition-opacity">
                                  <button onClick={() => startEdit(doc)} className="p-2 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit Record"><Edit3 size={16} /></button>
                                  <button onClick={() => setConfirmDocDelete({ id: doc._id, model: selectedModel })} className="p-2 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Delete Record"><Trash2 size={16} /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {modelMeta.total > modelMeta.limit && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-medium">Showing page {modelMeta.page} of {Math.ceil(modelMeta.total / modelMeta.limit)}</p>
                  <div className="flex gap-2">
                    <button disabled={modelMeta.page <= 1} onClick={() => fetchDocs(modelMeta.page - 1)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50"><ChevronLeft size={16} /></button>
                    <button disabled={modelMeta.page >= Math.ceil(modelMeta.total / modelMeta.limit)} onClick={() => fetchDocs(modelMeta.page + 1)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50"><ChevronRight size={16} /></button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      {/* ════════════════ SLIDE-IN PANEL ════════════════ */}
      {panelOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl animate-slide-in-right flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">Create New User</h2>
              <button onClick={() => setPanelOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Username <span className="text-red-500">*</span></label>
                    <input required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm" placeholder="johndoe" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Password <span className="text-red-500">*</span></label>
                    <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm" placeholder="Min. 6 characters" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email</label>
                    <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm" placeholder="john@company.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">First Name</label>
                    <input value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm" placeholder="John" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Last Name</label>
                    <input value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm" placeholder="Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Role</label>
                    <select value={newUser.roles} onChange={e => setNewUser({...newUser, roles: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm">
                      <option value="user">User</option>
                      <option value="founder">Founder</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Company</label>
                    <input value={newUser.companyName} onChange={e => setNewUser({...newUser, companyName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm" placeholder="Acme Corp" />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-700">Account Active</span>
                  <button type="button" onClick={() => setNewUser({...newUser, isActive: !newUser.isActive})} className={`relative w-12 h-6 rounded-full transition-colors ${newUser.isActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${newUser.isActive ? 'translate-x-6' : ''}`} />
                  </button>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <button form="create-user-form" type="submit" disabled={submitting} className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all active:scale-95 disabled:opacity-50">
                {submitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ MODALS ════════════════ */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete User?</h3>
            <p className="text-slate-500 text-sm mb-6">Are you sure you want to permanently delete <strong className="text-slate-700">{confirmDelete.username}</strong>? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Cancel</button>
              <button onClick={doDeleteUser} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {confirmDocDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Document?</h3>
            <p className="text-slate-500 text-sm mb-6">This document will be removed from <strong className="text-slate-700">{MODELS.find(m => m.key === confirmDocDelete.model)?.label}</strong>. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDocDelete(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Cancel</button>
              <button onClick={doDeleteDoc} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in-right { animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
};

export default FounderDashboard;
