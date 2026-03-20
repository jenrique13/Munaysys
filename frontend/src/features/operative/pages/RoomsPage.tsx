import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useOperativeStore } from '../hooks/useOperativeStore';
import type { Room } from '../types';
import { DoorOpen, Plus, X, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

const TYPE_META: Record<string, { label: string; color: string }> = {
    sala_reuniones: { label: 'Sala de Reuniones', color: 'bg-blue-100 text-blue-700' },
    auditorio: { label: 'Auditorio', color: 'bg-purple-100 text-purple-700' },
    hot_desk: { label: 'Hot Desk', color: 'bg-teal-100 text-teal-700' },
};

// ── Room Form Modal (Create & Edit) ─────────────────────────────────────────────
const RoomFormModal: React.FC<{ onClose: () => void; currentBranchId: number; initialData?: Room }> = ({ onClose, currentBranchId, initialData }) => {
    const { createRoom, updateRoom, isLoading } = useOperativeStore();
    const isEditing = !!initialData;

    const [form, setForm] = useState<Partial<Room>>(
        initialData ? { ...initialData } : { name: '', branch_id: currentBranchId, type: 'sala_reuniones', capacity: 1, hourly_rate: 0, is_active: true, amenities_json: [] }
    );
    const [tag, setTag] = useState('');

    const addTag = () => {
        if (tag.trim()) { setForm(p => ({ ...p, amenities_json: [...(p.amenities_json ?? []), tag.trim()] })); setTag(''); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let ok = false;
        if (isEditing && form.id) {
            ok = await updateRoom(form.id, form);
        } else {
            ok = await createRoom(form);
        }
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 overflow-y-auto max-h-[90vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 sticky top-0">
                    <h2 className="font-bold text-gray-800 text-lg">{isEditing ? 'Editar Sala' : 'Nueva Sala'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Sala Directorio A" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                {Object.entries(TYPE_META).map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                            <input type="number" min={1} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: +e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa/hora ($)</label>
                            <input type="number" min={0} step="0.01" value={form.hourly_rate} onChange={e => setForm(p => ({ ...p, hourly_rate: +e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amenidades</label>
                        <div className="flex gap-2 mb-2">
                            <input value={tag} onChange={e => setTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="TV, Pizarrón, Proyector..." />
                            <button type="button" onClick={addTag} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">Agregar</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {(form.amenities_json ?? []).map((a, i) => (
                                <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    {a as string}
                                    <button type="button" onClick={() => setForm(p => ({ ...p, amenities_json: (p.amenities_json ?? []).filter((_, j) => j !== i) }))} className="hover:text-red-500"><X size={10} /></button>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button disabled={isLoading} className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60">
                            {isLoading ? 'Guardando...' : 'Guardar Sala'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Room Card ─────────────────────────────────────────────────────────────────
const RoomCard: React.FC<{ room: Room; onEdit: (room: Room) => void; onDelete: (room: Room) => void }> = ({ room, onEdit, onDelete }) => {
    const meta = TYPE_META[room.type] ?? { label: room.type, color: 'bg-gray-100 text-gray-600' };
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-blue-200 transition-all relative group">
            {/* Opciones ocultas en top/right, se muestran en hover */}
            <div className="absolute top-3 right-3 flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 backdrop-blur-sm rounded-lg p-1">
                <button onClick={() => onEdit(room)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Editar Sala">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => onDelete(room)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Eliminar Sala">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>

            <div className="flex justify-between items-start mt-2">
                <div className="pr-16">
                    <h3 className="font-bold text-gray-800">{room.name}</h3>
                    {room.description && <p className="text-xs text-gray-500 mt-0.5">{room.description}</p>}
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${meta.color}`}>{meta.label}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Users size={14} />{room.capacity} pers.</span>
                <span className="flex items-center gap-1 text-green-700 font-semibold"><Clock size={14} />${room.hourly_rate.toLocaleString('es-CL')}/hr</span>
                <span className="flex items-center gap-1 ml-auto">
                    {room.status === 'disponible' && <><CheckCircle size={14} className="text-emerald-500" /><span className="text-emerald-600">Libre</span></>}
                    {room.status === 'ocupado' && <><XCircle size={14} className="text-red-400" /><span className="text-red-500">Reservada</span></>}
                    {room.status === 'mantenimiento' && <><XCircle size={14} className="text-yellow-400" /><span className="text-yellow-600">Mantenimiento</span></>}
                </span>
            </div>
            {(room.amenities_json ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {(room.amenities_json as string[]).map((a, i) => (
                        <span key={i} className="bg-gray-50 text-gray-500 text-xs px-2 py-0.5 rounded-full border border-gray-200">{a}</span>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const RoomsPage: React.FC = () => {
    const { rooms, fetchRooms, deleteRoom, isLoading } = useOperativeStore();
    const { selectedBranchId } = useAuthStore();

    // UI State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [activeType, setActiveType] = useState<string>('all');

    useEffect(() => { fetchRooms(selectedBranchId ?? undefined); }, [selectedBranchId]);

    const handleCreateNew = () => {
        setEditingRoom(null);
        setIsFormOpen(true);
    };

    const handleEdit = (room: Room) => {
        setEditingRoom(room);
        setIsFormOpen(true);
    };

    const handleDelete = async (room: Room) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente la sala "${room.name}"?`)) {
            await deleteRoom(room.id);
        }
    };

    const filtered = activeType === 'all' ? rooms : rooms.filter(r => r.type === activeType);

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <DoorOpen size={22} className="text-blue-600" /> Salas
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Catálogo de salas con disponibilidad en tiempo real.</p>
                </div>
                <button onClick={handleCreateNew}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                    <Plus size={16} /> Nueva Sala
                </button>
            </div>

            <div className="px-6 py-3 bg-white border-b border-gray-100 flex gap-2 shrink-0 overflow-x-auto">
                {[['all', 'Todas'], ...Object.entries(TYPE_META).map(([v, { label }]) => [v, label])].map(([val, label]) => (
                    <button key={val} onClick={() => setActiveType(val)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${activeType === val ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-auto p-6">
                {isLoading && rooms.length === 0 ? (
                    <div className="text-center text-gray-400 pt-20">Cargando salas...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center pt-20">
                        <DoorOpen size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No hay salas configuradas</p>
                        <p className="text-sm text-gray-400 mt-1">Registra una sala para gestionar reservas.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map(r => <RoomCard key={r.id} room={r} onEdit={handleEdit} onDelete={handleDelete} />)}
                    </div>
                )}
            </div>

            {isFormOpen && <RoomFormModal onClose={() => setIsFormOpen(false)} currentBranchId={selectedBranchId ?? 0} initialData={editingRoom ?? undefined} />}
        </div>
    );
};

export default RoomsPage;
