import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useOperativeStore } from '../hooks/useOperativeStore';
import { useConfigurationStore } from '../../configuration/hooks/useConfigurationStore';
import { operativeService } from '../services/operative.service';
import type { Client, Membership, Amenity, AmenityHistory } from '../types';
import type { Service } from '../../financial/types';
import { Users, Plus, Search, Phone, Mail, X, Pencil, Trash2, Sparkles, AlertTriangle } from 'lucide-react';

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, string> = {
        active: 'bg-emerald-100 text-emerald-700',
        inactive: 'bg-gray-100 text-gray-500',
        suspended: 'bg-red-100 text-red-600',
    };
    const labels: Record<string, string> = { active: 'Activo', inactive: 'Inactivo', suspended: 'Suspendido' };
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
            {labels[status] ?? status}
        </span>
    );
};

// ── Membership Badge ──────────────────────────────────────────────────────────
const MembershipBadge: React.FC<{ membershipName?: string; hasMembership?: boolean }> = ({ membershipName, hasMembership }) => {
    if (!hasMembership) return <span className="text-xs text-gray-400 italic">Sin membresía</span>;
    return (
        <div className="text-xs">
            <span className="font-medium text-indigo-700">{membershipName || 'Activa'}</span>
        </div>
    );
};

// ── New/Edit Client Modal ──────────────────────────────────────────────────────
interface ClientFormModalProps {
    onClose: () => void;
    editClient?: Client;
    currentBranchId: number | null;
}
const ClientFormModal: React.FC<ClientFormModalProps> = ({ onClose, editClient, currentBranchId }) => {
    const { createClient, updateClient, isLoading, error } = useOperativeStore();
    const { branches } = useConfigurationStore();
    const [form, setForm] = useState({
        name: editClient?.name ?? '',
        email: editClient?.email ?? '',
        phone: editClient?.phone ?? '',
        ci_rif: editClient?.ci_rif ?? '',
        notes: editClient?.notes ?? '',
        branch_id: editClient?.branch_id ?? (currentBranchId && currentBranchId > 0 ? currentBranchId : undefined),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // branch_id is now optional
        const ok = editClient
            ? await updateClient(editClient.id, form)
            : await createClient(form);
        if (ok) onClose();
    };

    const isEdit = !!editClient;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg">{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Empresa o Persona" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CI / RIF</label>
                            <input value={form.ci_rif} onChange={e => setForm(p => ({ ...p, ci_rif: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="V-12345678" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                        <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>

                    {/* Selector de Sede */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sede de Origen (Opcional)</label>
                        <select
                            value={form.branch_id || ''}
                            onChange={e => setForm(p => ({ ...p, branch_id: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            <option value="">Selecciona una sede (opcional)...</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-gray-400 mt-1">Indica la sede donde se originó el registro.</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                            <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button disabled={isLoading} className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                            {isLoading ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteConfirmModal: React.FC<{ client: Client; onClose: () => void }> = ({ client, onClose }) => {
    const { updateClient } = useOperativeStore();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        // Soft delete: marcar como eliminado (backend oculta status='deleted')
        await updateClient(client.id, { status: 'deleted' });
        setDeleting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-red-50">
                    <h2 className="font-bold text-red-700 text-lg flex items-center gap-2">
                        <Trash2 size={18} /> Eliminar Cliente
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
                </div>
                <div className="p-6">
                    <p className="text-gray-700 text-sm">
                        ¿Estás seguro que deseas eliminar a <strong>{client.name}</strong>?
                        El registro quedará inactivo y podrá ser recuperado después.
                    </p>
                    <div className="flex justify-end gap-3 mt-5">
                        <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button onClick={handleDelete} disabled={deleting}
                            className="px-5 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-60 flex items-center gap-2">
                            <Trash2 size={14} /> {deleting ? 'Eliminando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Amenities View & Buy Modal ──────────────────────────────────────────────
const ClientAmenitiesModal: React.FC<{ client: Client; onClose: () => void }> = ({ client, onClose }) => {
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [history, setHistory] = useState<AmenityHistory[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [servicesCatalog, setServicesCatalog] = useState<Service[]>([]);

    const fetchAmenities = () => {
        setLoading(true);
        // Usar la sede del cliente para filtrar sus amenidades o 0 para todas
        operativeService.getAmenities(client.branch_id, client.id).then(data => {
            setAmenities(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { 
        fetchAmenities();
        // Fetch services marked as amenities
        operativeService.getServices(client.branch_id).then(data => {
            setServicesCatalog(data.filter(s => s.is_amenity));
        });
    }, [client.id, client.branch_id]); // Added client.branch_id to dependencies

    const fetchHistory = () => {
        operativeService.getAmenityHistory(client.branch_id, client.id).then(setHistory);
    };

    const handleBuy = async (service: Service) => {
        setBuying(service.name);
        try {
            await operativeService.createAmenity({
                name: service.name,
                branch_id: client.branch_id,
                client_id: client.id,
                quantity: 1, // Default quantity when buying from service
                unit: 'unidad',
                price: service.price,
                category: 'general',
                available: true,
                is_recurring: false,
                monthly_quota: 0
            });
            fetchAmenities();
        } catch (e) {
            console.error("Error al adquirir servicio", e);
        } finally {
            setBuying(null);
        }
    };

    const handleUpdateQuantity = async (id: number) => {
        const val = parseFloat(editValue);
        if (isNaN(val)) return;
        try {
            await operativeService.updateAmenity(id, { quantity: val });
            setEditingId(null);
            fetchAmenities();
        } catch (e) {
            console.error("Error al actualizar amenidad", e);
        }
    };

    const handleDeleteAmenity = async (id: number) => {
        try {
            await operativeService.deleteAmenity(id);
            setConfirmDeleteId(null);
            fetchAmenities();
        } catch (e) {
            console.error("Error al eliminar amenidad", e);
        }
    };

    // REMOVED handleCreateCustom as per requirements

    const getIcon = (category?: string) => {
        const icons: Record<string, string> = {
            parking: '🚗',
            desk: '🖥️',
            printing: '🖨️',
            hours: '⏳',
            general: '✨'
        };
        return icons[category || ''] ?? '✨';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] relative">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-50 to-violet-50 shrink-0">
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <Sparkles size={16} className="text-indigo-500" /> Servicios y Amenidades — {client.name}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Lista Actual */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Servicios Activos</h3>
                        {loading ? (
                            <p className="text-gray-400 text-sm italic">Cargando...</p>
                        ) : amenities.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Sparkles size={24} className="mx-auto text-gray-200 mb-2" />
                                <p className="text-gray-400 text-xs text-balance">No hay servicios contratados aún.</p>
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {amenities.map(a => (
                                    <li key={a.id} className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-lg">
                                                    {getIcon(a.category)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{a.name}</p>
                                                    <p className="text-xs text-gray-400 capitalize">
                                                        {a.quantity} {a.unit} {a.is_recurring ? ` (Cuota: ${a.monthly_quota})` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => { setEditingId(a.id); setEditValue(a.quantity.toString()); }}
                                                    className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(a.id)}
                                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>

                                        {confirmDeleteId === a.id && (
                                            <div className="mt-2 p-2 bg-red-50 rounded border border-red-100 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                                                <span className="text-[10px] text-red-700 font-medium flex items-center gap-1">
                                                    <AlertTriangle size={10} /> ¿Borrar este servicio?
                                                </span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleDeleteAmenity(a.id)} className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold">Sí, borrar</button>
                                                    <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] text-gray-400 font-bold px-2 py-0.5 bg-white border border-gray-200 rounded">No</button>
                                                </div>
                                            </div>
                                        )}

                                        {editingId === a.id && (
                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
                                                <input
                                                    type="number"
                                                    value={editValue}
                                                    onChange={e => setEditValue(e.target.value)}
                                                    className="w-20 px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                                <button
                                                    onClick={() => handleUpdateQuantity(a.id)}
                                                    className="px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded hover:bg-indigo-700"
                                                >
                                                    Guardar
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="px-2 py-1 text-gray-500 text-[10px] hover:bg-gray-100 rounded"
                                                >
                                                    X
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Catálogo de Compra */}
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4 pt-1">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Adquirir Servicios</h3>
                            <button
                                onClick={() => { setShowHistory(true); fetchHistory(); }}
                                className="text-[10px] font-bold text-indigo-600 bg-white border border-indigo-200 px-2 py-1 rounded hover:bg-indigo-50 transition-colors flex items-center gap-1"
                            >
                                <Users size={10} /> Ver Historial
                            </button>
                        </div>

                        <div className="space-y-3">
                            {servicesCatalog.map(item => (
                                <div key={item.id} className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors group">
                                    <div className="flex justify-between items-center text-sm mb-2">
                                        <div className="flex items-center gap-2">
                                            <span>✨</span>
                                            <span className="font-medium text-gray-700">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-indigo-600">${item.price}</span>
                                    </div>
                                    <button
                                        onClick={() => handleBuy(item)}
                                        disabled={!!buying}
                                        className="w-full py-1.5 bg-gray-50 group-hover:bg-indigo-600 group-hover:text-white text-gray-500 text-xs font-bold rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {buying === item.name ? 'Procesando...' : (
                                            <>
                                                <Plus size={14} /> Adquirir
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                            {servicesCatalog.length === 0 && (
                                <p className="text-xs text-gray-400 italic text-center py-4">No hay servicios de amenidad configurados.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* History Modal Overlay */}
                {showHistory && (
                    <div className="absolute inset-0 z-20 bg-white animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">Historial de Uso — {client.name}</h3>
                            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            {history.length === 0 ? (
                                <p className="text-center text-gray-400 py-12 text-sm italic">No hay registros de uso.</p>
                            ) : (
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-100 text-gray-500">
                                        <tr>
                                            <th className="p-2">Fecha</th>
                                            <th className="p-2">Cambio</th>
                                            <th className="p-2">Saldo</th>
                                            <th className="p-2">Motivo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {history.map(h => (
                                            <tr key={h.id}>
                                                <td className="p-2">{new Date(h.created_at).toLocaleString()}</td>
                                                <td className={`p-2 font-bold ${h.change < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {h.change > 0 ? '+' : ''}{h.change.toFixed(2)}
                                                </td>
                                                <td className="p-2">{h.new_quantity.toFixed(2)}</td>
                                                <td className="p-2 italic text-gray-500">{h.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Client Row ────────────────────────────────────────────────────────────────
interface ClientRowProps {
    client: Client;
    onEdit: (c: Client) => void;
    onDelete: (c: Client) => void;
    onAmenities: (c: Client) => void;
}
const ClientRow: React.FC<ClientRowProps> = ({ client, onEdit, onDelete, onAmenities }) => {
    return (
        <tr className="hover:bg-indigo-50/30 transition-colors group">
            <td className="py-3 px-4">
                <div className="font-medium text-gray-800 text-sm">{client.name}</div>
                {client.email && (
                    <div className="flex items-center text-xs text-gray-400 mt-0.5">
                        <Mail size={11} className="mr-1" />{client.email}
                    </div>
                )}
                {client.ci_rif && (
                    <div className="text-[10px] font-mono text-gray-400 mt-1 bg-gray-50 px-1 rounded inline-block">
                        {client.ci_rif}
                    </div>
                )}
            </td>
            <td className="py-3 px-4">
                {client.phone && (
                    <div className="flex items-center text-xs text-gray-500">
                        <Phone size={11} className="mr-1" />{client.phone}
                    </div>
                )}
            </td>
            <td className="py-3 px-4"><StatusBadge status={client.status} /></td>
            <td className="py-3 px-4">
                <MembershipBadge 
                    membershipName={client.active_membership_name} 
                    hasMembership={client.has_active_membership} 
                />
            </td>
            <td className="py-3 px-4 text-xs text-gray-400">
                {new Date(client.created_at).toLocaleDateString('es-CL')}
            </td>
            {/* ── Acciones ── */}
            <td className="py-3 px-4">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Amenidades */}
                    <button
                        onClick={() => onAmenities(client)}
                        title="Ver amenidades"
                        className="flex items-center gap-1 px-2 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs font-medium transition-colors"
                    >
                        <Sparkles size={12} /> Amenidades
                    </button>
                    {/* Editar */}
                    <button
                        onClick={() => onEdit(client)}
                        title="Editar cliente"
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                        <Pencil size={14} />
                    </button>
                    {/* Eliminar */}
                    <button
                        onClick={() => onDelete(client)}
                        title="Eliminar cliente"
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const ClientsPage: React.FC = () => {
    const { clients, fetchClients, isLoading } = useOperativeStore();
    const { selectedBranchId } = useAuthStore();
    const { branches, fetchBranches } = useConfigurationStore();
    const [search, setSearch] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [editClient, setEditClient] = useState<Client | null>(null);
    const [deleteClient, setDeleteClient] = useState<Client | null>(null);
    const [amenitiesClient, setAmenitiesClient] = useState<Client | null>(null);

    useEffect(() => { 
        // We fetch all clients (unified view)
        fetchClients(undefined); // Explicitly fetch all (unified)
        if (branches.length === 0) fetchBranches();
    }, [fetchClients, branches.length, fetchBranches]);

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.email ?? '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users size={22} className="text-indigo-600" /> Clientes
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gestión de clientes activos y sus membresías.</p>
                </div>
                <button
                    onClick={() => setShowNew(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
                >
                    <Plus size={16} /> Nuevo Cliente
                </button>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-3 bg-white border-b border-gray-100 shrink-0">
                <div className="relative max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o email..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {isLoading && clients.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">Cargando clientes...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Users size={36} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No hay clientes registrados</p>
                            <p className="text-sm mt-1">Haz clic en "Nuevo Cliente" para comenzar.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {['Cliente', 'Teléfono', 'Estado', 'Membresía Activa', 'Registrado', 'Acciones'].map(h => (
                                        <th key={h} className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(c => (
                                    <ClientRow
                                        key={c.id}
                                        client={c}
                                        onEdit={c => setEditClient(c)}
                                        onDelete={c => setDeleteClient(c)}
                                        onAmenities={c => setAmenitiesClient(c)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showNew && <ClientFormModal onClose={() => { setShowNew(false); fetchClients(undefined); }} currentBranchId={selectedBranchId ?? 0} />}
            {editClient && <ClientFormModal editClient={editClient} onClose={() => { setEditClient(null); fetchClients(undefined); }} currentBranchId={selectedBranchId ?? 0} />}
            {deleteClient && <DeleteConfirmModal client={deleteClient} onClose={() => { setDeleteClient(null); fetchClients(undefined); }} />}
            {amenitiesClient && <ClientAmenitiesModal client={amenitiesClient} onClose={() => setAmenitiesClient(null)} />}
        </div>
    );
};

export default ClientsPage;
