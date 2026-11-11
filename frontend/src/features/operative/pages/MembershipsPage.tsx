import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useOperativeStore } from '../hooks/useOperativeStore';
import type { Membership, Client, Office, ContractTemplate } from '../types';
import type { Service } from '../../financial/types';
import { operativeService } from '../services/operative.service';
import { Users, Building, Plus, X, FileText, CheckCircle, Clock, Layout, Edit3, Trash2, Save, Search, Box } from 'lucide-react';
import QuillEditor from '../components/QuillEditor';

const QUILL_MODULES = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'align': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['pagebreak'],
        ['clean'],
        ['link']
    ],
};

// MASTER CONTRACT CSS - Shared between Editor and Preview
const CONTRACT_CSS = `
    .contract-document {
        font-family: 'Times New Roman', Times, serif !important;
        font-size: 12pt !important;
        line-height: 1.5 !important;
        color: #000 !important;
        width: 100%;
        margin: 0;
        box-sizing: border-box;
    }
    .contract-document p {
        margin-top: 0;
        margin-bottom: 15px;
        text-align: justify;
    }
    .contract-document h1, .contract-document h2, .contract-document h3 {
        margin-top: 15px;
        margin-bottom: 15px;
    }
    .pdf-render-wrapper {
        padding: 0 !important;
    }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    td, th { border: 1px solid #000; padding: 5px; }
`;

// Helper para impresión nativa (Papel Sellado / Legal)
const printContent = (htmlContent: string, documentTitle: string) => {
    const printWindow = window.open('', '', 'width=800,height=800');
    if (!printWindow) {
        alert("Por favor, permite las ventanas emergentes (pop-ups) para imprimir el contrato.");
        return;
    }
    
    const printHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${documentTitle}</title>
            <style>
                @page { 
                    size: 215.9mm 330.2mm; /* 8.5 x 13 inches - Legal Venezolano */
                }
                @page :first { margin: 55mm 20mm 15mm 30mm; }
                @page :right { margin: 25mm 20mm 15mm 30mm; }
                @page :left  { margin: 25mm 30mm 15mm 20mm; }
                
                body {
                    margin: 0;
                    padding: 0;
                    background: none;
                }
                
                ${CONTRACT_CSS}
            </style>
        </head>
        <body>
            ${htmlContent}
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        window.close();
                    }, 250);
                };
            </script>
        </body>
        </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
};



const DEFAULT_BODY_HTML = (spaceName: string) => `
<div style="font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.5; font-size: 11pt; width: 100%;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 1px solid #000; padding-bottom: 10px;">
    <div style="text-align: left;">
      <h1 style="color: #4F46E5; margin: 0; font-size: 18pt; font-family: sans-serif; letter-spacing: 1px;">NEST COWORKING</h1>
      <p style="margin: 0; font-size: 8pt; color: #666; font-family: sans-serif;">PROMOTORA DE ESPACIOS DE TRABAJO</p>
    </div>
    <div style="text-align: right;">
      <h2 style="margin: 0; font-size: 12pt; font-weight: bold;">CONTRATO DE MEMBRESÍA</h2>
      <p style="margin: 0; font-size: 10pt;">${spaceName.toUpperCase()}</p>
    </div>
  </div>

  <div style="margin-bottom: 20px; text-align: right; font-size: 10pt;">
    <p style="margin: 0;"><strong>FECHA DE EMISIÓN:</strong> {{fecha_emision}}</p>
    <p style="margin: 0;"><strong>N° DE CONTRATO:</strong> {{numero_contrato}}</p>
  </div>

  <h3 style="font-size: 12pt; border-bottom: 1px solid #000; padding-bottom: 2px; margin-top: 20px; text-transform: uppercase;">1. LAS PARTES</h3>
  <p style="text-align: justify; margin-bottom: 15px;">
    Este acuerdo de servicios de coworking se celebra entre la empresa <strong>Nest Coworking (El Operador)</strong>, por una parte, y por la otra, el Miembro cuyos datos se detallan a continuación:
  </p>
  <div style="margin-left: 20px; margin-bottom: 20px; line-height: 1.6;">
    <p style="margin: 2px 0;"><strong>Nombre / Razón Social:</strong> {{nombre_cliente}}</p>
    <p style="margin: 2px 0;"><strong>Documento Identidad / RIF:</strong> {{ci_rif_cliente}}</p>
    <p style="margin: 2px 0;"><strong>Correo Electrónico:</strong> {{email_cliente}}</p>
    <p style="margin: 2px 0;"><strong>Teléfono de Contacto:</strong> {{telefono_cliente}}</p>
    <p style="margin: 2px 0;"><strong>Dirección Fiscal:</strong> {{direccion_fiscal}}</p>
  </div>

  <h3 style="font-size: 12pt; border-bottom: 1px solid #000; padding-bottom: 2px; margin-top: 20px; text-transform: uppercase;">2. CONDICIONES DEL PLAN</h3>
  <p style="text-align: justify; margin-bottom: 10px;">El Operador concede al Miembro el uso del espacio bajo las siguientes condiciones comerciales:</p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr><td style="padding: 5px; border: 1px solid #000; width: 30%;"><strong>Plan Contratado:</strong></td><td style="padding: 5px; border: 1px solid #000;">{{nombre_plan}}</td></tr>
    <tr><td style="padding: 5px; border: 1px solid #000;"><strong>Espacio Asignado:</strong></td><td style="padding: 5px; border: 1px solid #000;">{{nombre_espacio}}</td></tr>
    <tr><td style="padding: 5px; border: 1px solid #000;"><strong>Fecha de Inicio:</strong></td><td style="padding: 5px; border: 1px solid #000;">{{fecha_inicio}}</td></tr>
    <tr><td style="padding: 5px; border: 1px solid #000;"><strong>Fecha de Vencimiento:</strong></td><td style="padding: 5px; border: 1px solid #000;">{{fecha_fin}}</td></tr>
    <tr><td style="padding: 5px; border: 1px solid #000;"><strong>Tarifa Mensual:</strong></td><td style="padding: 5px; border: 1px solid #000;"><strong>{{precio_mensual}}</strong></td></tr>
  </table>

  <h3 style="font-size: 12pt; border-bottom: 1px solid #000; padding-bottom: 2px; margin-top: 20px; text-transform: uppercase;">3. TÉRMINOS Y CONDICIONES</h3>
  <p style="text-align: justify; margin-bottom: 15px;">
    El Miembro declara conocer y aceptar las normas de convivencia de Nest Coworking. La falta de pago puntual (primeros 5 días del ciclo) o el uso indebido de las instalaciones facultará al Operador para la rescisión inmediata del presente acuerdo.
  </p>

  <div style="margin-top: 60px; display: flex; justify-content: space-between;">
    <div style="text-align: center; width: 45%; border-top: 1px solid #000; padding-top: 10px;">
      <p style="margin: 0; font-weight: bold;">Por: Nest Coworking</p>
      <p style="margin: 0; font-size: 10pt;">Firma Autorizada y Sello</p>
    </div>
    <div style="text-align: center; width: 45%; border-top: 1px solid #000; padding-top: 10px;">
      <p style="margin: 0; font-size: 10pt;">{{nombre_cliente}}</p>
      <p style="margin: 0; font-size: 10pt;">El Miembro</p>
    </div>
  </div>
  <div style="margin-top: 40px; text-align: center; font-size: 0.8em; color: #9CA3AF;">Documento generado automáticamente por Nest Coworking OS.</div>
  
  {{personas_autorizadas}}
</div>
`;

// Helper to fill template variables for PDF
function fillTemplate(html: string | null | undefined, vars: Record<string, string>) {
    if (!html) return '';
    let result = html;
    for (const [key, val] of Object.entries(vars)) {
        result = result.replaceAll(`{{${key}}}`, val || '');
    }
    return result;
}

const MembershipsPage: React.FC = () => {
    const {
        clients, offices, memberships, contractTemplates,
        spaceCategories, roomTypes, amenityTemplates,
        fetchClients, fetchOffices, fetchMemberships, fetchContractTemplates,
        fetchSpaceCategories, fetchRoomTypes, fetchAmenityTemplates,
        createMembership, updateMembership, deleteMembership,
        createContractTemplate, updateContractTemplate, deleteContractTemplate,
        isLoading, error, clearError
    } = useOperativeStore();
    const { selectedBranchId, user } = useAuthStore();

    const isAuthorizedToManageTemplates = !!(user?.role?.name &&
        ["Super Administrador", "Gerente", "Ventas"].includes(user.role.name));

    const [activeTab, setActiveTab] = useState<'memberships' | 'templates'>('memberships');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Membership form
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingContractMembership, setEditingContractMembership] = useState<Membership | null>(null);
    const [contractHtmlForm, setContractHtmlForm] = useState<string>('');
    const [deletingMembershipItem, setDeletingMembershipItem] = useState<Membership | null>(null);
    const [isDeletingMembership, setIsDeletingMembership] = useState(false);
    const [form, setForm] = useState<Partial<Membership>>({
        client_id: 0, office_id: 0, plan_name: '',
        start_date: new Date().toISOString().split('T')[0], end_date: '', price: 0, status: 'active',
        billing_address: '',
        authorized_persons_json: []
    });

    // Template state
    const [isTplModalOpen, setIsTplModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
    const [tplForm, setTplForm] = useState<Partial<ContractTemplate>>({
        name: '', space_type: 'general', body_html: DEFAULT_BODY_HTML('General'), is_active: true
    });
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [clientSearch, setClientSearch] = useState('');
    const [showClientResults, setShowClientResults] = useState(false);
    const [officeSearch, setOfficeSearch] = useState('');
    const [showOfficeResults, setShowOfficeResults] = useState(false);
    const [services, setServices] = useState<Service[]>([]);

    const clientSelectRef = useRef<HTMLDivElement>(null);
    const officeSelectRef = useRef<HTMLDivElement>(null);

    const selectedOfficeForForm = offices.find(o => o.id === form.office_id);
    const matchedAmenityTemplate = selectedOfficeForForm
        ? amenityTemplates.find(t => t.space_type === 'office' && t.category_name.toLowerCase() === selectedOfficeForForm.category.toLowerCase())
        : null;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (clientSelectRef.current && !clientSelectRef.current.contains(event.target as Node)) {
                setShowClientResults(false);
            }
            if (officeSelectRef.current && !officeSelectRef.current.contains(event.target as Node)) {
                setShowOfficeResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        fetchSpaceCategories(selectedBranchId ?? undefined);
        fetchRoomTypes(selectedBranchId ?? undefined);
        fetchAmenityTemplates(selectedBranchId ?? undefined);
        operativeService.getServices(selectedBranchId ?? undefined).then(setServices).catch(console.error);
    }, [selectedBranchId]);

    const getSpaceLabel = (internalName: string) => {
        if (internalName === 'general') return 'General / Por Defecto';
        const sc = spaceCategories.find(c => c.name === internalName);
        if (sc) return sc.name;
        const rt = roomTypes.find(r => r.name === internalName);
        if (rt) return rt.name;
        return internalName;
    };

    // ──── Membership handlers ────────────────────────────────

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.client_id || form.client_id === 0) {
            alert('Por favor, seleccione un cliente válido de la lista.');
            return;
        }
        if (!form.office_id || form.office_id === 0) {
            alert('Por favor, seleccione un espacio físico de la lista.');
            return;
        }

        const dataToSave = {
            ...form,
            office_id: form.office_id === 0 ? undefined : form.office_id,
            end_date: form.end_date ? new Date(form.end_date).toISOString() : undefined,
            start_date: new Date(form.start_date!).toISOString()
        };

        let ok: boolean;
        if (isEditing && editingId) {
            ok = await updateMembership(editingId, dataToSave as Partial<Membership>);
        } else {
            ok = await createMembership(dataToSave as Partial<Membership>);
        }

        if (ok) {
            setIsModalOpen(false);
            setIsEditing(false);
            setEditingId(null);
            fetchMemberships();
        }
    };

    const handleEdit = (m: Membership) => {
        setEditingId(m.id);
        setIsEditing(true);
        setForm({
            client_id: m.client_id,
            office_id: m.office_id || 0,
            plan_name: m.plan_name,
            start_date: new Date(m.start_date).toISOString().split('T')[0],
            end_date: m.end_date ? new Date(m.end_date).toISOString().split('T')[0] : '',
            price: m.price,
            billing_address: m.billing_address || '',
            status: m.status,
            authorized_persons_json: m.authorized_persons_json || []
        });
        setClientSearch(m.client?.name || '');
        setOfficeSearch(m.office?.name || '');
        setShowOfficeResults(false);
        setIsModalOpen(true);
    };

    const handleDeleteMembershipFlow = async () => {
        if (!deletingMembershipItem) return;
        setIsDeletingMembership(true);
        try {
            const m = deletingMembershipItem;
            // 1. Delete all client amenities
            const clientAmenities = await operativeService.getAmenities(undefined, m.client_id);
            for (const amenity of clientAmenities) {
                await operativeService.deleteAmenity(amenity.id);
            }
            // 2. Mark physical space as available
            if (m.office_id) {
                await operativeService.updateOffice(m.office_id, { status: 'disponible' });
            }
            // 3. Delete membership
            await deleteMembership(m.id);
            // 4. Refresh store collections
            fetchMemberships();
            fetchOffices(selectedBranchId ?? undefined);
            fetchClients(selectedBranchId ?? undefined);
            
            // Close modal
            setDeletingMembershipItem(null);
        } catch (err) {
            console.error(err);
            alert('Error al eliminar la membresía.');
        } finally {
            setIsDeletingMembership(false);
        }
    };

    const handleOpenContractEditor = (m: Membership) => {
        const c = m.client;
        const space = m.office;
        
        if (m.custom_contract_html) {
            setContractHtmlForm(m.custom_contract_html);
        } else {
            const spaceType = space?.category || 'general';
            const template = contractTemplates.find(t => t.space_type === spaceType && t.is_active)
                || contractTemplates.find(t => t.space_type === 'general' && t.is_active);

            const vars = {
                fecha_emision: new Date().toLocaleDateString(),
                numero_contrato: `M-${m.id.toString().padStart(5, '0')}`,
                nombre_cliente: c?.name || '',
                ci_rif_cliente: c?.ci_rif || 'No registrado',
                email_cliente: c?.email || 'No registrado',
                telefono_cliente: c?.phone || 'No registrado',
                nombre_plan: m.plan_name,
                nombre_espacio: space?.name || 'Sin Asignar',
                direccion_fiscal: m.billing_address || 'No especificada',
                fecha_inicio: new Date(m.start_date).toLocaleDateString(),
                fecha_fin: m.end_date ? new Date(m.end_date).toLocaleDateString() : 'Indefinido',
                precio_mensual: `€${m.price.toFixed(2)}`,
                personas_autorizadas: (m.authorized_persons_json && m.authorized_persons_json.length > 0)
                    ? `
                    <div style="page-break-inside: avoid; border-top: 1px dashed #000; padding-top: 15px; margin-top: 20px;">
                        <h3 style="font-size: 12pt; text-transform: uppercase;">ANEXO: PERSONAS AUTORIZADAS</h3>
                        <p style="font-size: 10pt; margin-bottom: 15px;">Las siguientes personas están autorizadas para el ingreso y uso de las instalaciones bajo esta membresía:</p>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #F3F4F6;">
                                    <th style="border: 1px solid #000; padding: 8px; text-align: left;">Nombre</th>
                                    <th style="border: 1px solid #000; padding: 8px; text-align: left;">Apellido</th>
                                    <th style="border: 1px solid #000; padding: 8px; text-align: left;">Documento (C.I./RIF/Pass)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${m.authorized_persons_json.map(p => `
                                    <tr>
                                        <td style="border: 1px solid #000; padding: 8px;">${p.name}</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${p.last_name}</td>
                                        <td style="border: 1px solid #000; padding: 8px;">${p.document}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>`
                    : ''
            };

            const bodyHtml = template
                ? fillTemplate(template.body_html, vars)
                : fillTemplate(DEFAULT_BODY_HTML(space?.name || ''), vars);
                
            setContractHtmlForm(bodyHtml);
        }
        setEditingContractMembership(m);
    };

    const handleSaveContract = async () => {
        if (!editingContractMembership) return;
        const ok = await updateMembership(editingContractMembership.id, { custom_contract_html: contractHtmlForm });
        if (ok) {
            setEditingContractMembership(null);
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
            direccion_fiscal: membership.billing_address || 'No especificada',
            fecha_inicio: new Date(membership.start_date).toLocaleDateString(),
            fecha_fin: membership.end_date ? new Date(membership.end_date).toLocaleDateString() : 'Indefinido',
            precio_mensual: `€${membership.price.toFixed(2)}`,
            personas_autorizadas: (membership.authorized_persons_json && membership.authorized_persons_json.length > 0)
                ? `
                <div style="page-break-inside: avoid; border-top: 1px dashed #000; padding-top: 15px; margin-top: 20px;">
                    <h3 style="font-size: 12pt; text-transform: uppercase;">ANEXO: PERSONAS AUTORIZADAS</h3>
                    <p style="font-size: 10pt; margin-bottom: 15px;">Las siguientes personas están autorizadas para el ingreso y uso de las instalaciones bajo esta membresía:</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #F3F4F6;">
                                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Nombre</th>
                                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Apellido</th>
                                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Documento (C.I./RIF/Pass)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${membership.authorized_persons_json.map(p => `
                                <tr>
                                    <td style="border: 1px solid #000; padding: 8px;">${p.name}</td>
                                    <td style="border: 1px solid #000; padding: 8px;">${p.last_name}</td>
                                    <td style="border: 1px solid #000; padding: 8px;">${p.document}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
                : ''
        };

        let bodyHtml = '';
        if (membership.custom_contract_html) {
            bodyHtml = membership.custom_contract_html;
        } else {
            bodyHtml = template
                ? fillTemplate(template.body_html, vars)
                : fillTemplate(DEFAULT_BODY_HTML(office?.name || ''), vars);
        }

        // Inject the master CSS for preview
        const fullHtml = `
            <style>${CONTRACT_CSS}</style>
            <div class="contract-document pdf-render-wrapper">
                ${bodyHtml}
            </div>
        `;

        setPreviewHtml(fullHtml);
    };

    // ──── Template handlers ──────────────────────────────────

    const openCreateTpl = () => {
        setEditingTemplate(null);
        setTplForm({
            name: '',
            space_type: 'general',
            body_html: DEFAULT_BODY_HTML('General'),
            is_active: true,
            branch_id: selectedBranchId || undefined
        });
        clearError?.();
        setIsTplModalOpen(true);
    };

    const openEditTpl = (tpl: ContractTemplate) => {
        if (!tpl) return;
        setEditingTemplate(tpl);
        setTplForm({
            name: tpl.name || '',
            space_type: tpl.space_type || 'general',
            body_html: tpl.body_html || '',
            is_active: !!tpl.is_active,
            branch_id: tpl.branch_id || selectedBranchId || undefined
        });
        clearError?.();
        setIsTplModalOpen(true);
    };

    const handleSaveTpl = async (e: React.FormEvent) => {
        e.preventDefault();
        let ok: boolean;
        const dataToSave = {
            ...tplForm,
            branch_id: tplForm.branch_id || selectedBranchId || undefined
        };

        if (editingTemplate) {
            ok = await updateContractTemplate(editingTemplate.id, dataToSave);
        } else {
            ok = await createContractTemplate(dataToSave);
        }
        if (ok) { setIsTplModalOpen(false); }
    };

    const handleDeleteTpl = async (id: number) => {
        if (window.confirm('¿Eliminar esta plantilla?')) {
            await deleteContractTemplate(id);
        }
    };

    const filteredMemberships = memberships.filter(m => {
        if (m.status === 'cancelled') return false;

        const search = searchTerm.toLowerCase();
        const matchesSearch = (
            m.plan_name.toLowerCase().includes(search) ||
            m.client?.name.toLowerCase().includes(search) ||
            m.office?.name.toLowerCase().includes(search)
        );

        if (!matchesSearch) return false;

        if (!selectedBranchId) return true;

        const officeBranchId = m.office?.branch_id;
        const clientBranchId = m.client?.branch_id;
        const membershipBranchId = officeBranchId !== undefined ? officeBranchId : clientBranchId;

        return membershipBranchId === selectedBranchId;
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
                    ? <button onClick={() => {
                        setIsEditing(false);
                        setEditingId(null);
                        setForm({
                            client_id: 0, office_id: 0, plan_name: '',
                            start_date: new Date().toISOString().split('T')[0], end_date: '', price: 0, status: 'active',
                            billing_address: '',
                            authorized_persons_json: []
                        });
                        setClientSearch('');
                        setOfficeSearch('');
                        setShowOfficeResults(false);
                        setIsModalOpen(true);
                    }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
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
                    {isAuthorizedToManageTemplates && (
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'templates' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <Layout size={15} /> Plantillas de Contrato
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">

                {/* ── TAB: MEMBERSHIPS ── */}
                {activeTab === 'memberships' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Search size={16} />
                                </span>
                                <input
                                    placeholder="Buscar membresía, cliente o espacio..."
                                    className="w-80 pl-9 pr-4 py-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
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
                                    {(filteredMemberships || []).map(m => {
                                        const c = m.client;
                                        const space = m.office;
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
                                                <td className="py-3 px-4 text-right font-bold text-emerald-700">€{m.price.toFixed(2)}</td>
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
                                                        <button onClick={() => handleOpenContractEditor(m)} className="text-violet-600 hover:text-violet-800 p-1 bg-violet-50 rounded transition-colors" title="Personalizar Contrato">
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button onClick={() => handleEdit(m)} className="text-amber-600 hover:text-amber-800 p-1 bg-amber-50 rounded transition-colors" title="Editar Membresía">
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button onClick={() => setDeletingMembershipItem(m)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded transition-colors" title="Eliminar Membresía">
                                                            <Trash2 size={16} />
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
                {activeTab === 'templates' && isAuthorizedToManageTemplates && (
                    <div className="space-y-4">
                        <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-3 text-sm text-violet-700 flex items-start gap-2">
                            <Layout size={16} className="mt-0.5 shrink-0" />
                            <p>Define una plantilla HTML por cada tipo de espacio. Al generar el PDF de una membresía, se usará automáticamente la plantilla del tipo de espacio correspondiente.
                                Usa variables como <code className="bg-violet-100 px-1 rounded">{'{{nombre_cliente}}'}</code>, <code className="bg-violet-100 px-1 rounded">{'{{nombre_espacio}}'}</code>, <code className="bg-violet-100 px-1 rounded">{'{{fecha_inicio}}'}</code>, <code className="bg-violet-100 px-1 rounded">{'{{precio_mensual}}'}</code>, etc.</p>
                        </div>
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                            {(contractTemplates || []).map((tpl, idx) => (
                                <div key={tpl?.id || idx} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                                                {getSpaceLabel(tpl.space_type)}
                                            </span>
                                            <h3 className="font-bold text-gray-800 mt-2">{tpl.name}</h3>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${tpl.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {tpl.is_active ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 italic">Última modificación: {new Date(tpl.created_at).toLocaleDateString()}</p>
                                    <div className="flex gap-2 mt-auto pt-3 border-t">
                                        <button onClick={() => setPreviewHtml(fillTemplate(tpl.body_html || '', { nombre_cliente: 'Juan Pérez', ci_rif_cliente: 'V-12345678', email_cliente: 'juan@example.com', telefono_cliente: '+1 555-0000', direccion_fiscal: 'Av. Siempre Viva 123, Springfield', nombre_plan: tpl.name, nombre_espacio: 'Oficina 101', fecha_inicio: new Date().toLocaleDateString(), fecha_fin: 'Indefinido', precio_mensual: '€500.00', fecha_emision: new Date().toLocaleDateString(), numero_contrato: 'M-00001' }))}
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

            {previewHtml && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPreviewHtml(null)} />
                    <div className="bg-white rounded-xl shadow-2xl z-10 w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center shrink-0 bg-white z-20">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2">
                                <FileText size={18} className="text-violet-600" />
                                Vista previa del contrato (Simulación A4)
                            </h2>
                            <div className="flex items-center gap-3">
                                <button onClick={() => printContent(previewHtml, 'Contrato_Membresia')} className="text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2">
                                    <FileText size={16} /> Imprimir / Guardar PDF
                                </button>
                                <button onClick={() => setPreviewHtml(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X size={18} /></button>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-50 border-b border-blue-100 text-sm text-blue-800 shrink-0 text-center">
                            Para formato legal (Papel Sellado), haz clic en "Imprimir" y selecciona <strong>"Guardar como PDF"</strong>. El sistema aplicará los márgenes alternados automáticamente.
                        </div>
                        <div className="flex-1 overflow-auto bg-gray-200/50 p-8 flex justify-center">
                            {/* Paper Simulation */}
                            <div
                                className="bg-white shadow-2xl p-[20mm] print:p-0 print:shadow-none w-full max-w-[215.9mm] min-h-[330.2mm] border border-gray-100"
                                style={{
                                    fontFamily: "'Times New Roman', Times, serif",
                                    color: '#000',
                                    lineHeight: '1.5'
                                }}
                                dangerouslySetInnerHTML={{ __html: previewHtml }}
                            />
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
                            <button onClick={() => { setIsTplModalOpen(false); clearError?.(); }} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSaveTpl} className="flex flex-col flex-1 overflow-hidden">
                            {error && (
                                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg flex items-center gap-2">
                                    <X size={14} className="shrink-0" /> {error}
                                </div>
                            )}
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
                                            <option value="general">General / Por Defecto</option>
                                            <optgroup label="Categorías de Espacios">
                                                {spaceCategories?.map(sc => (
                                                    <option key={sc?.id} value={sc?.name}>{sc?.name}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Tipos de Salas">
                                                {roomTypes?.map(rt => (
                                                    <option key={rt?.id} value={rt?.name}>{rt?.name}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border">
                                    <strong>Variables disponibles:</strong>{' '}
                                    {['nombre_cliente', 'ci_rif_cliente', 'email_cliente', 'telefono_cliente', 'direccion_fiscal', 'nombre_plan', 'nombre_espacio', 'fecha_inicio', 'fecha_fin', 'precio_mensual', 'fecha_emision', 'numero_contrato'].map(v => (
                                        <code key={v} className="bg-violet-100 text-violet-700 px-1 rounded mr-1">{`{{${v}}}`}</code>
                                    ))}
                                </div>
                            </div>
                            <div className="px-6 pb-2 shrink-0">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contenido HTML del Contrato *</label>
                            </div>
                            <div className="flex-1 px-6 overflow-hidden min-h-[400px]">
                                <QuillEditor
                                    value={tplForm.body_html || ''}
                                    onChange={content => setTplForm(p => ({ ...p, body_html: content }))}
                                    className="h-[300px] mb-12"
                                    modules={QUILL_MODULES}
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
                            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <CheckCircle size={18} className="text-indigo-600" />
                                {isEditing ? `Editar Membresía #${editingId}` : 'Nueva Membresía'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 overflow-y-auto space-y-4">
                            <div ref={clientSelectRef} className="relative">
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
                                    {showClientResults && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-auto">
                                            {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 ? (
                                                <div className="p-3 text-sm text-gray-500 text-center">No se encontraron clientes</div>
                                            ) : (
                                                clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
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
                            <div ref={officeSelectRef} className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Espacio Físico *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Search size={14} />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Buscar espacio disponible..."
                                        value={officeSearch || (offices.find(o => o.id === form.office_id)?.name || '')}
                                        onChange={e => {
                                            setOfficeSearch(e.target.value);
                                            setShowOfficeResults(true);
                                        }}
                                        onFocus={() => setShowOfficeResults(true)}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                    {showOfficeResults && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl max-h-60 overflow-auto">
                                            {(() => {
                                                const filteredOffices = offices.filter(o =>
                                                    (o.is_active && o.status === 'disponible') ||
                                                    (isEditing && o.id === form.office_id)
                                                );
                                                const displayedOffices = filteredOffices.filter(o =>
                                                    (o.name || '').toLowerCase().includes(officeSearch.toLowerCase()) ||
                                                    (o.category || '').toLowerCase().includes(officeSearch.toLowerCase())
                                                );

                                                if (displayedOffices.length === 0) {
                                                    return <div className="p-3 text-sm text-gray-500 text-center">No se encontraron espacios disponibles</div>;
                                                }

                                                return displayedOffices.map(o => (
                                                    <button
                                                        key={o.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setForm(p => ({
                                                                ...p,
                                                                office_id: o.id,
                                                                plan_name: `Membresía ${o.name}`,
                                                                price: o.monthly_rate
                                                            }));
                                                            setOfficeSearch(o.name);
                                                            setShowOfficeResults(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 flex flex-col border-b last:border-0"
                                                    >
                                                        <span className="font-medium text-gray-800">{o.name}</span>
                                                        <span className="text-[10px] text-gray-400 capitalize">
                                                            Categoría: {o.category} • Tarifa: €{o.monthly_rate}/mes • Capacidad: {o.capacity} {o.capacity === 1 ? 'persona' : 'personas'}
                                                        </span>
                                                    </button>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </div>
                                {form.office_id! > 0 && !showOfficeResults && (
                                    <p className="mt-1 text-[10px] text-indigo-600 font-medium font-sans">
                                        Seleccionado: {offices.find(o => o.id === form.office_id)?.name}
                                    </p>
                                )}
                                {selectedOfficeForForm && (
                                    <div className="mt-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm">
                                        <p className="font-semibold text-indigo-800 flex items-center gap-1 mb-1">
                                            <Box size={14} /> Amenidades Incluidas
                                        </p>
                                        {matchedAmenityTemplate ? (
                                            <div>
                                                <p className="text-gray-600 mb-1">Plantilla aplicada: <span className="font-bold">{matchedAmenityTemplate.name}</span></p>
                                                <ul className="text-xs text-gray-500 list-disc list-inside space-y-1 mt-2">
                                                    {matchedAmenityTemplate.items.map((item, idx: any) => {
                                                        const svc = services.find(s => s.id === item.service_id);
                                                        const totalQuantity = item.quantity * (selectedOfficeForForm.capacity || 1);
                                                        return (
                                                            <li key={idx}>
                                                                <span className="font-medium text-gray-700">{svc?.name || `Servicio #${item.service_id}`}</span> - Total: {totalQuantity} <span className="text-[10px] text-gray-400 ml-1">({item.quantity} x {selectedOfficeForForm.capacity || 1} personas)</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500 italic">No hay una plantilla de amenidades configurada para la categoría '{selectedOfficeForForm.category}'.</p>
                                        )}
                                    </div>
                                )}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mensualidad (€) *</label>
                                <input type="number" required min={0} step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: +e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Fiscal para Contrato</label>
                                <textarea rows={2} value={form.billing_address || ''} onChange={e => setForm(p => ({ ...p, billing_address: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Ej. Calle Falsa 123, Ciudad..." />
                            </div>

                            {/* Section: Authorized Persons */}
                            <div className="pt-4 border-t">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <Users size={16} className="text-indigo-600" /> Personas Autorizadas
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setForm(p => ({
                                            ...p,
                                            authorized_persons_json: [...(p.authorized_persons_json || []), { name: '', last_name: '', document: '' }]
                                        }))}
                                        className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                                    >
                                        <Plus size={12} /> Agregar Persona
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {(form.authorized_persons_json || []).map((person, idx) => (
                                        <div key={idx} className="flex gap-2 items-start bg-gray-50 p-2 rounded-lg border border-gray-100 relative group">
                                            <div className="grid grid-cols-3 gap-2 flex-1">
                                                <input
                                                    placeholder="Nombre"
                                                    required
                                                    className="px-2 py-1.5 text-xs border rounded outline-none focus:ring-1 focus:ring-indigo-500"
                                                    value={person.name}
                                                    onChange={e => {
                                                        const newList = [...(form.authorized_persons_json || [])];
                                                        newList[idx].name = e.target.value;
                                                        setForm(p => ({ ...p, authorized_persons_json: newList }));
                                                    }}
                                                />
                                                <input
                                                    placeholder="Apellido"
                                                    required
                                                    className="px-2 py-1.5 text-xs border rounded outline-none focus:ring-1 focus:ring-indigo-500"
                                                    value={person.last_name}
                                                    onChange={e => {
                                                        const newList = [...(form.authorized_persons_json || [])];
                                                        newList[idx].last_name = e.target.value;
                                                        setForm(p => ({ ...p, authorized_persons_json: newList }));
                                                    }}
                                                />
                                                <input
                                                    placeholder="ID / RIF"
                                                    required
                                                    className="px-2 py-1.5 text-xs border rounded outline-none focus:ring-1 focus:ring-indigo-500"
                                                    value={person.document}
                                                    onChange={e => {
                                                        const newList = [...(form.authorized_persons_json || [])];
                                                        newList[idx].document = e.target.value;
                                                        setForm(p => ({ ...p, authorized_persons_json: newList }));
                                                    }}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newList = (form.authorized_persons_json || []).filter((_, i) => i !== idx);
                                                    setForm(p => ({ ...p, authorized_persons_json: newList }));
                                                }}
                                                className="text-gray-400 hover:text-red-500 transition-colors pt-1.5"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {(form.authorized_persons_json || []).length === 0 && (
                                        <p className="text-[10px] text-gray-400 text-center py-2 italic">No hay personas adicionales autorizadas.</p>
                                    )}
                                </div>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2 mt-4">
                                <Clock size={16} className="shrink-0 mt-0.5" />
                                <p>La facturación mensual se genera automáticamente el día 1 de cada mes si la membresía está activa y dentro del rango de fechas.</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                                <button disabled={isLoading} type="submit" className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 shadow-sm">
                                    {isLoading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Membresía')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ── Modal Editar Contrato Personalizado ── */}
            {editingContractMembership && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingContractMembership(null)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl z-10 overflow-hidden flex flex-col" style={{ maxHeight: '92vh' }}>
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <FileText size={18} className="text-violet-600" />
                                Contrato Personalizado - {editingContractMembership.client?.name}
                            </h2>
                            <button onClick={() => setEditingContractMembership(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full"><X size={18} /></button>
                        </div>
                        <div className="p-4 bg-blue-50 border-b border-blue-100 text-sm text-blue-800 shrink-0">
                            <strong>Nota:</strong> Estas modificaciones se guardarán exclusivamente para esta membresía y no afectarán la plantilla general. Al presionar "Generar PDF", se utilizará este contenido.
                        </div>
                        <div className="flex-1 overflow-hidden px-6 pt-4 pb-12 min-h-[400px]">
                            <QuillEditor
                                value={contractHtmlForm}
                                onChange={setContractHtmlForm}
                                className="h-[300px]"
                                modules={QUILL_MODULES}
                            />
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t mt-auto shrink-0 bg-white">
                            <button onClick={() => setEditingContractMembership(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
                            <button onClick={handleSaveContract} className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 shadow-sm transition-colors">
                                <Save size={15} /> Guardar Contrato
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ── Modal de Confirmación de Eliminación Premium ── */}
            {deletingMembershipItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !isDeletingMembership && setDeletingMembershipItem(null)} />
                    
                    {/* Content container */}
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header with warm/warning tone */}
                        <div className="bg-rose-50/50 px-6 py-4 border-b border-rose-100 flex items-center gap-3 shrink-0">
                            <div className="p-2 bg-rose-100 text-rose-700 rounded-full">
                                <Trash2 size={20} className="animate-bounce" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Confirmar Eliminación</h3>
                                <p className="text-xs text-rose-600 font-medium font-sans">Esta acción es irreversible</p>
                            </div>
                        </div>

                        {/* Body content */}
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600 leading-relaxed">
                                ¿Estás seguro de que deseas eliminar la membresía de <strong className="text-gray-900 font-bold">{deletingMembershipItem.client?.name || 'este cliente'}</strong>?
                            </p>

                            {/* Bullet warnings with rich visual styling */}
                            <div className="space-y-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Acciones en cascada a realizar:</h4>
                                
                                <div className="flex gap-3 items-start">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-700 mt-0.5">1</span>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Eliminación de la Membresía</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Se borrará permanentemente el registro del plan <span className="font-semibold text-indigo-700">{deletingMembershipItem.plan_name}</span>.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-start">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700 mt-0.5">2</span>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Eliminación de Amenidades</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Se eliminarán de forma definitiva todas las amenidades activas asignadas a este cliente.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-start">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 mt-0.5">3</span>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Liberación de Espacio</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            El espacio físico <span className="font-semibold text-emerald-700">{deletingMembershipItem.office?.name || 'asignado'}</span> quedará marcado como <strong className="text-emerald-700">disponible</strong> para nuevas asignaciones.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer buttons */}
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                disabled={isDeletingMembership}
                                onClick={() => setDeletingMembershipItem(null)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors disabled:opacity-50 text-sm animate-pulse-subtle"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={isDeletingMembership}
                                onClick={handleDeleteMembershipFlow}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm animate-pulse-subtle"
                            >
                                {isDeletingMembership ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Eliminando...
                                    </>
                                ) : (
                                    'Confirmar y Eliminar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipsPage;
