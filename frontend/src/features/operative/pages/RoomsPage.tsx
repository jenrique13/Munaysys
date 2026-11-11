import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useOperativeStore } from '../hooks/useOperativeStore';
import type { Room } from '../types';
import { DoorOpen, Plus, X, Users, CheckCircle, XCircle, Edit2, Trash2, Euro, Sparkles } from 'lucide-react';

// ── Room Form Modal (Create & Edit) ─────────────────────────────────────────────
const RoomFormModal: React.FC<{ onClose: () => void; currentBranchId: number; initialData?: Room }> = ({ onClose, currentBranchId, initialData }) => {
    const { createRoom, updateRoom, isLoading, roomTypes } = useOperativeStore();
    const isEditing = !!initialData;

    const [form, setForm] = useState<Partial<Room>>(
        initialData ? { ...initialData } : { name: '', branch_id: currentBranchId, type: roomTypes[0]?.name || '', capacity: 1, hourly_rate: 0, is_active: true, amenities_json: [] }
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
                                {roomTypes.map(rt => <option key={rt.id} value={rt.name}>{rt.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                            <input type="number" min={1} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: +e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa/hora (€)</label>
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

// ── Page ──────────────────────────────────────────────────────────────────────
const RoomsPage: React.FC = () => {
    const { rooms, fetchRooms, deleteRoom, roomTypes, fetchRoomTypes, isLoading } = useOperativeStore();
    const { selectedBranchId } = useAuthStore();

    // UI State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [activeType, setActiveType] = useState<string>('all');

    useEffect(() => { 
        fetchRooms(selectedBranchId ?? undefined); 
        fetchRoomTypes(selectedBranchId ?? undefined);
    }, [selectedBranchId]);

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
            fetchRooms(selectedBranchId ?? undefined);
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
                    <p className="text-sm text-gray-500 mt-1">Gestión detallada de salas en forma de lista.</p>
                </div>
                <button onClick={handleCreateNew}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                    <Plus size={16} /> Nueva Sala
                </button>
            </div>

            <div className="px-6 py-3 bg-white border-b border-gray-100 flex gap-2 shrink-0 overflow-x-auto">
                <button onClick={() => setActiveType('all')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${activeType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    Todas
                </button>
                {roomTypes.map(rt => (
                    <button key={rt.id} onClick={() => setActiveType(rt.name)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 ${activeType === rt.name ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {rt.name}
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre & Tipo</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Capacidad</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tarifa/Hora</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800 flex items-center gap-2">
                                                {r.name}
                                                <span className="bg-gray-100 text-gray-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">{r.type}</span>
                                            </div>
                                            {r.description && <div className="text-xs text-gray-400 mt-1 truncate max-w-[250px]">{r.description}</div>}
                                            {((r.amenities_json ?? []) as string[]).length > 0 && (
                                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                                {((r.amenities_json ?? []) as string[]).slice(0, 3).map((a, i) => <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 rounded">{a}</span>)}
                                                {((r.amenities_json ?? []) as string[]).length > 3 && <span className="text-[10px] bg-gray-50 text-gray-500 px-1.5 rounded">+{((r.amenities_json ?? []) as string[]).length - 3}</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1 text-gray-600">
                                                <Users size={14} /> {r.capacity}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-blue-700 font-semibold">
                                                <Euro size={14} /> {r.hourly_rate.toLocaleString('es-CL')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${
                                                    r.status === 'mantenimiento' ? 'bg-yellow-100 text-yellow-800' :
                                                    r.is_occupied ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {r.status === 'mantenimiento' ? <Sparkles size={12} className="text-yellow-600" /> : 
                                                     r.is_occupied ? <XCircle size={12} className="text-red-600" /> : <CheckCircle size={12} className="text-green-600" />}
                                                    {r.status === 'mantenimiento' ? 'Mantenimiento' : 
                                                     r.is_occupied ? 'Ocupada ahora' : 'Libre ahora'}
                                                </span>
                                                
                                                {/* Occupancy Indicator */}
                                                <div className="w-32">
                                                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                                        <span>Uso hoy (7-23h)</span>
                                                        <span className="font-bold text-gray-600">{r.occupancy_today_pct}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                        <div 
                                                            className={`h-1.5 rounded-full transition-all ${
                                                                (r.occupancy_today_pct ?? 0) > 80 ? 'bg-red-500' : 
                                                                (r.occupancy_today_pct ?? 0) > 40 ? 'bg-indigo-500' : 'bg-emerald-500'
                                                            }`}
                                                            style={{ width: `${r.occupancy_today_pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEdit(r)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Editar">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(r)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors" title="Eliminar">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isFormOpen && <RoomFormModal onClose={() => setIsFormOpen(false)} currentBranchId={selectedBranchId ?? 0} initialData={editingRoom ?? undefined} />}
        </div>
    );
};

export default RoomsPage;
