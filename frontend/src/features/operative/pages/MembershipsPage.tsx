import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useOperativeStore } from '../hooks/useOperativeStore';
import type { Membership, Client, Office, ContractTemplate } from '../types';
import { Users, Building, Plus, X, FileText, CheckCircle, Clock, Layout, Edit3, Trash2, Save, Search } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const SPACE_TYPE_LABELS: Record<string, string> = {
    privada: 'Oficina Privada',
    suite: 'Suite Ejecutiva',
    loft: 'Loft / Espacio Abierto',
    sala_reuniones: 'Sala de Reuniones',
    general: 'General / Por Defecto',
};

const DEFAULT_BODY_HTML = (spaceName: string) => `
<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="color: #4F46E5; margin-bottom: 5px;">NEST COWORKING</h1>
    <h2 style="color: #6B7280; font-weight: normal; margin-top: 0;">CONTRATO DE MEMBRESÍA — ${spaceName}</h2>
  </div>
  <p><strong>FECHA DE EMISIÓN:</strong> {{fecha_emision}}</p>
  <p><strong>N° DE CONTRATO:</strong> {{numero_contrato}}</p>

  <h3 style="border-bottom: 2px solid #E5E7EB; padding-bottom: 5px; margin-top: 30px;">1. LAS PARTES</h3>
  <p>Este acuerdo se celebra entre <strong>Nest Coworking (El Operador)</strong> y:</p>
  <ul style="list-style: none; padding: 0; background: #F9FAFB; padding: 15px; border-radius: 8px;">
    <li><strong>Nombre / Razón Social:</strong> {{nombre_cliente}}</li>
    <li><strong>CI / RIF:</strong> {{ci_rif_cliente}}</li>
    <li><strong>Correo:</strong> {{email_cliente}}</li>
    <li><strong>Teléfono:</strong> {{telefono_cliente}}</li>
  </ul>

  <h3 style="border-bottom: 2px solid #E5E7EB; padding-bottom: 5px; margin-top: 30px;">2. CONDICIONES DEL PLAN</h3>
  <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
    <tr><td style="padding: 8px; border: 1px solid #E5E7EB;"><strong>Plan:</strong></td><td style="padding: 8px; border: 1px solid #E5E7EB;">{{nombre_plan}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #E5E7EB;"><strong>Espacio:</strong></td><td style="padding: 8px; border: 1px solid #E5E7EB;">{{nombre_espacio}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #E5E7EB;"><strong>Inicio:</strong></td><td style="padding: 8px; border: 1px solid #E5E7EB;">{{fecha_inicio}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #E5E7EB;"><strong>Fin:</strong></td><td style="padding: 8px; border: 1px solid #E5E7EB;">{{fecha_fin}}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #E5E7EB;"><strong>Tarifa Mensual:</strong></td><td style="padding: 8px; border: 1px solid #E5E7EB; font-weight: bold; color: #059669;">{{precio_mensual}}</td></tr>
  </table>

  <h3 style="border-bottom: 2px solid #E5E7EB; padding-bottom: 5px; margin-top: 30px;">3. TÉRMINOS Y CONDICIONES</h3>
  <p style="font-size: 0.9em; color: #4B5563;">El Miembro se compromete a abonar la Tarifa Mensual durante los primeros 5 días de cada ciclo de facturación. El uso del Espacio está sujeto a las normativas internas del Coworking.</p>
  <p style="font-size: 0.9em; color: #4B5563;">Nest Coworking se reserva el derecho de dar por terminado este contrato en caso de incumplimiento de pagos o faltas graves.</p>

  <div style="margin-top: 70px; display: flex; justify-content: space-between;">
    <div style="text-align: center; width: 45%;"><div style="border-top: 1px solid #9CA3AF; padding-top: 10px;"><strong>Operador (Nest Coworking)</strong><br/>Firma Autorizada</div></div>
    <div style="text-align: center; width: 45%;"><div style="border-top: 1px solid #9CA3AF; padding-top: 10px;"><strong>El Miembro</strong><br/>{{nombre_cliente}}</div></div>
  </div>
  <div style="margin-top: 40px; text-align: center; font-size: 0.8em; color: #9CA3AF;">Documento generado automáticamente por Nest Coworking OS.</div>
</div>
`;

// Helper to fill template variables for PDF
function fillTemplate(html: string, vars: Record<string, string>) {
    let result = html;
    for (const [key, val] of Object.entries(vars)) {
        result = result.replaceAll(`{{${key}}}`, val);
    }
    return result;
}

const MembershipsPage: React.FC = () => {
    const {
        clients, offices, memberships, contractTemplates,
        fetchClients, fetchOffices, fetchMemberships, fetchContractTemplates,
        createMembership, deleteMembership,
        createContractTemplate, updateContractTemplate, deleteContractTemplate,
        isLoading
    } = useOperativeStore();
    const { selectedBranchId } = useAuthStore();

    const [activeTab, setActiveTab] = useState<'memberships' | 'templates'>('memberships');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Membership form
    const [form, setForm] = useState<Partial<Membership>>({
        client_id: 0, office_id: 0, plan_name: '',
        start_date: new Date().toISOString().split('T')[0], end_date: '', price: 0, status: 'active'
    });

    // Template state
    const [isTplModalOpen, setIsTplModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
    const [tplForm, setTplForm] = useState<Partial<ContractTemplate>>({
        name: '', space_type: 'privada', body_html: DEFAULT_BODY_HTML('Oficina Privada'), is_active: true
    });
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [clientSearch, setClientSearch] = useState('');
    const [showClientResults, setShowClientResults] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClients(selectedBranchId ?? undefined, clientSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [clientSearch, selectedBranchId, fetchClients]);

    useEffect(() => {
        fetchClients(selectedBranchId ?? undefined);
        fetchOffices(selectedBranchId ?? undefined);
        fetchMemberships();
        fetchContractTemplates();
    }, [selectedBranchId]);

    // ──── Membership handlers ────────────────────────────────

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            ...form,
            office_id: form.office_id === 0 ? undefined : form.office_id,
            end_date: form.end_date ? new Date(form.end_date).toISOString() : undefined,
            start_date: new Date(form.start_date!).toISOString()
        };
        const ok = await createMembership(dataToSave as Partial<Membership>);
        if (ok) { setIsModalOpen(false); fetchMemberships(); }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Eliminar esta membresía?')) {
            await deleteMembership(id);
            fetchMemberships();
        }
    };

    const handleGeneratePDF = (membership: Membership, client: Client | undefined, office: Office | undefined) => {
        if (!client) { alert("No se puede generar contrato: Cliente desconocido."); return; }

        // Look for a template matching the office type
        const spaceType = office?.category || 'general';
        const template = contractTemplates.find(t => t.space_type === spaceType && t.is_active)
            || contractTemplates.find(t => t.space_type === 'general' && t.is_active);

        const vars = {
            fecha_emision: new Date().toLocaleDateString(),
            numero_contrato: `M-${membership.id.toString().padStart(5, '0')}`,
            nombre_cliente: client.name,
            ci_rif_cliente: client.ci_rif || 'No registrado',
            email_cliente: client.email || 'No registrado',
            telefono_cliente: client.phone || 'No registrado',
            nombre_plan: membership.plan_name,
            nombre_espacio: office?.name || 'Sin Asignar',
            fecha_inicio: new Date(membership.start_date).toLocaleDateString(),
            fecha_fin: membership.end_date ? new Date(membership.end_date).toLocaleDateString() : 'Indefinido',
            precio_mensual: `$${membership.price.toFixed(2)} USD`,
        };

        const bodyHtml = template
            ? fillTemplate(template.body_html, vars)
            : fillTemplate(DEFAULT_BODY_HTML(office?.name || ''), vars);

        const opt: any = {
            margin: 0,
            filename: `Contrato_${client.name.replace(/\s+/g, '_')}_${membership.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(bodyHtml).save();
    };

    // ──── Template handlers ──────────────────────────────────

    const openCreateTpl = () => {
        setEditingTemplate(null);
        setTplForm({ name: '', space_type: 'privada', body_html: DEFAULT_BODY_HTML('Oficina Privada'), is_active: true });
        setIsTplModalOpen(true);
    };

    const openEditTpl = (tpl: ContractTemplate) => {
        setEditingTemplate(tpl);
        setTplForm({ name: tpl.name, space_type: tpl.space_type, body_html: tpl.body_html, is_active: tpl.is_active });
        setIsTplModalOpen(true);
    };

    const handleSaveTpl = async (e: React.FormEvent) => {
        e.preventDefault();
        let ok: boolean;
        if (editingTemplate) {
            ok = await updateContractTemplate(editingTemplate.id, tplForm);
        } else {
            ok = await createContractTemplate(tplForm);
        }
        if (ok) { setIsTplModalOpen(false); }
    };

    const handleDeleteTpl = async (id: number) => {
        if (window.confirm('¿Eliminar esta plantilla?')) {
            await deleteContractTemplate(id);
        }
    };

    const filteredMemberships = memberships.filter(m => {
        const client = clients.find(c => c.id === m.client_id);
        const office = offices.find(o => o.id === m.office_id);
        const search = searchTerm.toLowerCase();
        return m.plan_name.toLowerCase().includes(search) || client?.name.toLowerCase().includes(search) || office?.name.toLowerCase().includes(search);
    });

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users size={22} className="text-indigo-600" /> Membresías
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gestión de contratos, espacios asignados y plantillas de contrato.</p>
                </div>
                {activeTab === 'memberships'
                    ? <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                        <Plus size={16} /> Nueva Membresía
                      </button>
                    : <button onClick={openCreateTpl} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                        <Plus size={16} /> Nueva Plantilla
                      </button>
                }
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-6 shrink-0">
                <div className="flex gap-0">
                    <button
                        onClick={() => setActiveTab('memberships')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'memberships' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users size={15} /> Membresías
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'templates' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Layout size={15} /> Plantillas de Contrato
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">

                {/* ── TAB: MEMBERSHIPS ── */}
                {activeTab === 'memberships' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                            <input
                                placeholder="Buscar membresía, cliente o espacio..."
                                className="w-80 px-4 py-2 border rounded-lg text-sm bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-500">Cliente</th>
                                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-500">Plan / Espacio</th>
                                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-500">Contrato</th>
                                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-500 text-right">Tarifa Mensual</th>
                                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-500 text-center">Estado</th>
                                        <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-gray-500 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredMemberships.map(m => {
                                        const c = clients.find(c => c.id === m.client_id);
                                        const space = offices.find(o => o.id === m.office_id);
                                        return (
                                            <tr key={m.id} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-gray-800">{c?.name || 'Desconocido'}</div>
                                                    <div className="text-xs text-gray-500">{c?.email || c?.phone || 'Sin contacto'}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-indigo-700">{m.plan_name}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Building size={12} /> {space ? space.name : 'Flotante (Sin Asignar)'}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600">
                                                    <div className="flex flex-col">
                                                        <span><strong className="text-gray-500 font-medium">Inicio:</strong> {new Date(m.start_date).toLocaleDateString()}</span>
                                                        <span><strong className="text-gray-500 font-medium">Fin:</strong> {m.end_date ? new Date(m.end_date).toLocaleDateString() : 'Indefinido'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-emerald-700">${m.price.toFixed(2)}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${m.status === 'active' ? 'bg-emerald-100 text-emerald-700' : m.status === 'expired' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                                                        {m.status === 'active' ? 'Activa' : m.status === 'expired' ? 'Vencida' : 'Cancelada'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <button onClick={() => handleGeneratePDF(m, c, space)} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded transition-colors" title="Generar Contrato PDF">
                                                            <FileText size={16} />
                                                        </button>
                                                        <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded transition-colors" title="Eliminar Membresía">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredMemberships.length === 0 && (
                                        <tr><td colSpan={6} className="py-8 text-center text-gray-400">No hay membresías registradas</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── TAB: CONTRACT TEMPLATES ── */}
                {activeTab === 'templates' && (
                    <div className="space-y-4">
                        <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 text-sm text-violet-700 flex items-start gap-2">
                            <Layout size={16} className="mt-0.5 shrink-0" />
                            <p>Define una plantilla HTML por cada tipo de espacio. Al generar el PDF de una membresía, se usará automáticamente la plantilla del tipo de espacio correspondiente.
                            Usa variables como <code className="bg-violet-100 px-1 rounded">{'{{nombre_cliente}}'}</code>, <code className="bg-violet-100 px-1 rounded">{'{{nombre_espacio}}'}</code>, <code className="bg-violet-100 px-1 rounded">{'{{fecha_inicio}}'}</code>, <code className="bg-violet-100 px-1 rounded">{'{{precio_mensual}}'}</code>, etc.</p>
                        </div>
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {contractTemplates.map(tpl => (
                                <div key={tpl.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                                                {SPACE_TYPE_LABELS[tpl.space_type] || tpl.space_type}
                                            </span>
                                            <h3 className="font-bold text-gray-800 mt-2">{tpl.name}</h3>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${tpl.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {tpl.is_active ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 italic">Última modificación: {new Date(tpl.created_at).toLocaleDateString()}</p>
                                    <div className="flex gap-2 mt-auto pt-3 border-t">
                                        <button onClick={() => setPreviewHtml(fillTemplate(tpl.body_html, { nombre_cliente: 'Juan Pérez', ci_rif_cliente: 'V-12345678', email_cliente: 'juan@example.com', telefono_cliente: '+1 555-0000', nombre_plan: tpl.name, nombre_espacio: 'Oficina 101', fecha_inicio: new Date().toLocaleDateString(), fecha_fin: 'Indefinido', precio_mensual: '$500.00 USD', fecha_emision: new Date().toLocaleDateString(), numero_contrato: 'M-00001' }))}
                                            className="flex-1 flex items-center justify-center gap-1 text-xs px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border rounded-lg text-gray-600 transition-colors">
                                            <FileText size={13} /> Vista previa
                                        </button>
                                        <button onClick={() => openEditTpl(tpl)}
                                            className="flex items-center justify-center gap-1 text-xs px-3 py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg text-violet-700 transition-colors">
                                            <Edit3 size={13} /> Editar
                                        </button>
                                        <button onClick={() => handleDeleteTpl(tpl.id)}
                                            className="flex items-center justify-center gap-1 text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 transition-colors">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {contractTemplates.length === 0 && (
                                <div className="col-span-3 bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
                                    <Layout size={40} className="mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">Sin plantillas configuradas</p>
                                    <p className="text-sm mt-1">Crea una plantilla por cada tipo de espacio para personalizar los contratos.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modal Vista Previa ── */}
            {previewHtml && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPreviewHtml(null)} />
                    <div className="bg-white rounded-xl shadow-2xl z-10 w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b flex justify-between items-center shrink-0">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2"><FileText size={18} className="text-violet-600" /> Vista previa del contrato</h2>
                            <button onClick={() => setPreviewHtml(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X size={18} /></button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <div className="border rounded-lg overflow-hidden" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Crear/Editar Plantilla ── */}
            {isTplModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsTplModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl z-10 overflow-hidden flex flex-col" style={{ maxHeight: '92vh' }}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <Layout size={18} className="text-violet-600" />
                                {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla de Contrato'}
                            </h2>
                            <button onClick={() => setIsTplModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSaveTpl} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 space-y-4 shrink-0">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la plantilla *</label>
                                        <input required value={tplForm.name} onChange={e => setTplForm(p => ({ ...p, name: e.target.value }))}
                                            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-violet-500"
                                            placeholder="Ej: Contrato Oficina Privada" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Espacio *</label>
                                        <select required value={tplForm.space_type} onChange={e => setTplForm(p => ({ ...p, space_type: e.target.value }))}
                                            className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-violet-500">
                                            {Object.entries(SPACE_TYPE_LABELS).map(([val, label]) => (
                                                <option key={val} value={val}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border">
                                    <strong>Variables disponibles:</strong>{' '}
                                    {['nombre_cliente', 'ci_rif_cliente', 'email_cliente', 'telefono_cliente', 'nombre_plan', 'nombre_espacio', 'fecha_inicio', 'fecha_fin', 'precio_mensual', 'fecha_emision', 'numero_contrato'].map(v => (
                                        <code key={v} className="bg-violet-100 text-violet-700 px-1 rounded mr-1">{`{{${v}}}`}</code>
                                    ))}
                                </div>
                            </div>
                            <div className="px-6 pb-2 shrink-0">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido HTML del Contrato *</label>
                            </div>
                            <div className="flex-1 px-6 overflow-hidden">
                                <textarea
                                    required
                                    value={tplForm.body_html}
                                    onChange={e => setTplForm(p => ({ ...p, body_html: e.target.value }))}
                                    className="w-full h-full font-mono text-xs border rounded-lg p-3 outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                                    style={{ minHeight: '260px' }}
                                />
                            </div>
                            <div className="flex justify-end gap-3 px-6 py-4 border-t mt-2 shrink-0">
                                <button type="button" onClick={() => setIsTplModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                                <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 disabled:opacity-60 shadow-sm">
                                    <Save size={15} />{isLoading ? 'Guardando...' : 'Guardar Plantilla'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Modal Crear Membresía ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2"><CheckCircle size={18} className="text-indigo-600" /> Nueva Membresía</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 overflow-y-auto space-y-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Search size={14} />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente..."
                                        value={clientSearch || (clients.find(c => c.id === form.client_id)?.name || '')}
                                        onChange={e => {
                                            setClientSearch(e.target.value);
                                            setShowClientResults(true);
                                        }}
                                        onFocus={() => setShowClientResults(true)}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                    {showClientResults && (clients.length > 0 || clientSearch) && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-auto">
                                            {clients.length === 0 ? (
                                                <div className="p-3 text-sm text-gray-500 text-center">No se encontraron clientes</div>
                                            ) : (
                                                clients.map(c => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setForm(p => ({ ...p, client_id: c.id }));
                                                            setClientSearch(c.name);
                                                            setShowClientResults(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 flex flex-col border-b last:border-0"
                                                    >
                                                        <span className="font-medium text-gray-800">{c.name}</span>
                                                        <span className="text-[10px] text-gray-400">{c.email || 'Sin correo'} • {c.ci_rif || 'Sin ID'}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                {form.client_id! > 0 && !showClientResults && (
                                    <p className="mt-1 text-[10px] text-indigo-600 font-medium font-sans">
                                        Seleccionado: {clients.find(c => c.id === form.client_id)?.name}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Espacio Físico (Opcional)</label>
                                <select value={form.office_id} onChange={e => setForm(p => ({ ...p, office_id: +e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value={0}>-- Sin Asignar (Membresía Flotante) --</option>
                                    {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Plan *</label>
                                <input required value={form.plan_name} onChange={e => setForm(p => ({ ...p, plan_name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Plan Premium..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio *</label>
                                    <input type="date" required value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin (Opcional)</label>
                                    <input type="date" value={form.end_date} min={form.start_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mensualidad ($) *</label>
                                <input type="number" required min={0} step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: +e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2 mt-4">
                                <Clock size={16} className="shrink-0 mt-0.5" />
                                <p>La facturación mensual se genera automáticamente el día 1 de cada mes si la membresía está activa y dentro del rango de fechas.</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                                <button disabled={isLoading} type="submit" className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 shadow-sm">
                                    {isLoading ? 'Guardando...' : 'Crear Membresía'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipsPage;
