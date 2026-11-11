import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { Sparkles, Plus, X, Edit, Trash2, Box, Home, List } from 'lucide-react';
import { operativeService } from '../services/operative.service';
import type { AmenityTemplate, AmenityTemplateItem, SpaceCategory, RoomType } from '../types';
import type { Service } from '../../financial/types';

const AmenityTemplatesPage: React.FC = () => {
    const branch_id = useAuthStore(s => s.selectedBranchId);
    const [templates, setTemplates] = useState<AmenityTemplate[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [spaceCategories, setSpaceCategories] = useState<SpaceCategory[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<AmenityTemplate> | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [tData, sData, scData, rtData] = await Promise.all([
                operativeService.getAmenityTemplates(branch_id ?? undefined),
                operativeService.getServices(branch_id ?? undefined),
                operativeService.getSpaceCategories(branch_id ?? undefined),
                operativeService.getRoomTypes(branch_id ?? undefined)
            ]);
            setTemplates(tData);
            setServices(sData.filter(s => s.is_amenity));
            setSpaceCategories(scData);
            setRoomTypes(rtData);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [branch_id]);

    const handleCreate = () => {
        setEditingItem({ name: '', space_type: 'office', category_name: 'privada', items: [], branch_id: branch_id ?? undefined });
        setIsModalOpen(true);
    };

    const handleEdit = (item: AmenityTemplate) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (item: AmenityTemplate) => {
        if (!window.confirm(`¿Seguro que deseas eliminar la plantilla "${item.name}"?`)) return;
        await operativeService.deleteAmenityTemplate(item.id);
        loadData();
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <List size={22} className="text-indigo-600" /> Plantillas de Amenidades
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Configuración de beneficios automáticos por tipo de espacio.</p>
                </div>
                <button onClick={handleCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                    <Plus size={16} /> Nueva Plantilla
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading ? (
                    <div className="text-center text-gray-400 pt-20">Cargando plantillas...</div>
                ) : templates.length === 0 ? (
                    <div className="text-center pt-20 border-2 border-dashed border-gray-200 rounded-2xl bg-white p-10">
                        <Box size={48} className="mx-auto text-gray-200 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">Sin Plantillas</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">Crea una plantilla para asignar horas de sala o impresiones automáticamente al contratar una oficina.</p>
                        <button onClick={handleCreate} className="mt-4 text-indigo-600 font-medium hover:underline flex items-center gap-1 mx-auto">
                           <Plus size={16}/> Empezar ahora
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((t) => (
                            <div key={t.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${t.space_type === 'office' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                            {t.space_type === 'office' ? 'Oficina' : 'Sala'} • {t.category_name}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* We use hover in a parent for these if wanted, but here simple buttons are better */}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-lg mb-1">{t.name}</h3>
                                    <div className="space-y-2 mt-4">
                                        {t.items.map((item, idx) => {
                                            const svc = services.find(s => s.id === item.service_id);
                                            return (
                                                <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-gray-50 last:border-0">
                                                    <span className="text-gray-600">{svc?.name || `Servicio #${item.service_id}`}</span>
                                                    <span className="font-bold text-indigo-600">{item.quantity}</span>
                                                </div>
                                            );
                                        })}
                                        {t.items.length === 0 && <p className="text-xs text-gray-400 italic">Sin amenidades configuradas</p>}
                                    </div>
                                </div>
                                <div className="px-5 py-3 bg-gray-50 border-t flex justify-between items-center">
                                    <span className="text-[10px] text-gray-400 font-medium uppercase">{t.branch_id ? 'Sede Específica' : 'Global'}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(t)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(t)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && editingItem && (
                <TemplateFormModal
                    initialData={editingItem}
                    onClose={() => setIsModalOpen(false)}
                    onSave={loadData}
                    availableServices={services}
                    spaceCategories={spaceCategories}
                    roomTypes={roomTypes}
                    branchId={branch_id ?? 1}
                />
            )}
        </div>
    );
};

// ── Form Modal ──────────────────────────────────────────────────────────────
interface ModalProps { 
    initialData: Partial<AmenityTemplate>; 
    onClose: () => void; 
    onSave: () => void; 
    availableServices: Service[];
    spaceCategories: SpaceCategory[];
    roomTypes: RoomType[];
    branchId: number; 
}

const TemplateFormModal: React.FC<ModalProps> = ({ initialData, onClose, onSave, availableServices, spaceCategories, roomTypes, branchId }) => {
    const isEdit = !!initialData.id;
    const [form, setForm] = useState<Partial<AmenityTemplate>>(initialData);
    const [items, setItems] = useState<Partial<AmenityTemplateItem>[]>(initialData.items || []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...form, items } as any;
        if (isEdit) {
            await operativeService.updateAmenityTemplate(form.id!, payload);
        } else {
            await operativeService.createAmenityTemplate(payload);
        }
        onSave();
        onClose();
    };

    const addItem = () => {
        if (availableServices.length > 0) {
            setItems([...items, { service_id: availableServices[0].id, quantity: 1 }]);
        }
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx: number, field: keyof AmenityTemplateItem, value: any) => {
        const newItems = [...items];
        newItems[idx] = { ...newItems[idx], [field]: value };
        setItems(newItems);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                    <h2 className="font-bold text-gray-800 text-lg">
                        {isEdit ? 'Editar Plantilla' : 'Nueva Plantilla'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre de Plantilla</label>
                            <input required placeholder="Ej: Oficina Premium" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/30" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Espacio</label>
                            <select value={form.space_type || 'office'} onChange={e => setForm(p => ({ ...p, space_type: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/30">
                                <option value="office">Oficina</option>
                                <option value="room">Sala</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría Asociada</label>
                            <select 
                                required 
                                value={form.category_name || ''} 
                                onChange={e => setForm(p => ({ ...p, category_name: e.target.value }))} 
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/30"
                            >
                                <option value="">Seleccione una categoría</option>
                                {form.space_type === 'office' ? (
                                    spaceCategories.map(c => (
                                        <option key={c.id} value={c.name.toLowerCase()}>{c.name}</option>
                                    ))
                                ) : (
                                    roomTypes.map(t => (
                                        <option key={t.id} value={t.name.toLowerCase()}>{t.name}</option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="border-t pt-5">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-gray-500 uppercase">Amenidades Incluidas</label>
                            <button type="button" onClick={addItem} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                <Plus size={14}/> Agregar
                            </button>
                        </div>
                        <div className="space-y-3">
                            {items.map((item, idx) => {
                                const svc = availableServices.find(s => s.id === item.service_id);
                                return (
                                    <div key={idx} className="flex gap-2 items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm group">
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-800">{svc?.name || 'Servicio'}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-medium">{svc?.description || 'Sin descripción'}</p>
                                        </div>
                                        <div className="w-24 flex items-center bg-gray-50 rounded-lg px-2 py-1 border border-gray-100">
                                            <input 
                                                type="number" 
                                                min="1"
                                                step="1"
                                                value={item.quantity} 
                                                onChange={e => updateItem(idx, 'quantity', +e.target.value)}
                                                className="w-full bg-transparent text-center font-bold text-indigo-600 outline-none text-sm"
                                            />
                                            <span className="text-[10px] font-bold text-gray-400 ml-1">QTY</span>
                                        </div>
                                        <button type="button" onClick={() => removeItem(idx)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                            <X size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                            
                            {/* --- AMENITY PICKER --- */}
                            <div className="mt-6 pt-4 border-t border-dashed border-gray-200">
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 block">Catálogo de Amenidades Disponibles</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {availableServices.filter(s => !items.find(it => it.service_id === s.id)).map(s => (
                                        <button 
                                            key={s.id}
                                            type="button"
                                            onClick={() => setItems([...items, { service_id: s.id, quantity: 1 }])}
                                            className="flex flex-col items-start p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-xl transition-all text-left group"
                                        >
                                            <span className="text-xs font-bold text-gray-700 group-hover:text-indigo-700 truncate w-full">{s.name}</span>
                                            <span className="text-[9px] text-gray-400 mt-0.5">€{s.price}</span>
                                        </button>
                                    ))}
                                    {availableServices.filter(s => !items.find(it => it.service_id === s.id)).length === 0 && (
                                        <p className="col-span-2 text-center py-4 text-xs text-gray-400 italic">Todas las amenidades han sido agregadas.</p>
                                    )}
                                </div>
                            </div>

                            {items.length === 0 && availableServices.length > 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm italic bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center gap-2">
                                    <Sparkles size={24} className="text-gray-200" />
                                    <span>Selecciona amenidades del catálogo para incluirlas en la plantilla.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">Guardar Plantilla</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AmenityTemplatesPage;
