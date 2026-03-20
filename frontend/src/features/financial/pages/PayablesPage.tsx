import React, { useEffect, useState } from 'react';
import { useProvidersStore } from '../hooks/useProvidersStore';
import { Plus, Search, Calendar, CheckCircle } from 'lucide-react';
import type { CreatePayableDTO } from '../services/providers.service';

const PayablesPage: React.FC = () => {
    const { payables, providers, isLoading, fetchPayables, fetchProviders, createPayable, updatePayable } = useProvidersStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState<Omit<CreatePayableDTO, 'branch_id'>>({
        provider_id: 0,
        reference: '',
        amount: 0,
        due_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        paid_date: null,
        expense_id: null,
        purchase_id: null
    });

    useEffect(() => {
        fetchPayables();
        fetchProviders(); // Needed for the dropdown
    }, [fetchPayables, fetchProviders]);

    const filteredPayables = payables.filter(p => {
        const matchesSearch =
            (p.provider?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.reference && p.reference.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

        return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createPayable(formData);
            closeModal();
        } catch (error) {
            console.error(error);
            alert("Error al registrar cuenta por pagar");
        }
    };

    const handleMarkAsPaid = async (id: number) => {
        if (window.confirm('¿Confirmar pago de esta cuenta/factura?')) {
            await updatePayable(id, {
                status: 'paid',
                paid_date: new Date().toISOString()
            });
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({
            provider_id: 0,
            reference: '',
            amount: 0,
            due_date: new Date().toISOString().split('T')[0],
            status: 'pending',
            paid_date: null,
            expense_id: null,
            purchase_id: null
        });
    };

    const isOverdue = (dateString: string) => {
        return new Date(dateString) < new Date() && new Date(dateString).toDateString() !== new Date().toDateString();
    };

    const isDueToday = (dateString: string) => {
        return new Date(dateString).toDateString() === new Date().toDateString();
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cuentas por Pagar</h1>
                    <p className="text-sm text-gray-500 mt-1">Control de pagos pendientes y recordatorios</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Registrar Deuda
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por proveedor o referencia..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="pending">Pendientes</option>
                            <option value="paid">Pagados</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Cargando cuentas...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha Límite
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Proveedor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Referencia / Factura
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Monto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPayables.map((payable) => (
                                    <tr key={payable.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Calendar className={`w-4 h-4 mr-2 ${payable.status === 'paid' ? 'text-gray-400' :
                                                    isOverdue(payable.due_date) ? 'text-red-500' :
                                                        isDueToday(payable.due_date) ? 'text-yellow-500' : 'text-gray-400'
                                                    }`} />
                                                <span className={`text-sm ${payable.status === 'pending' && isOverdue(payable.due_date) ? 'text-red-600 font-medium' :
                                                    payable.status === 'pending' && isDueToday(payable.due_date) ? 'text-yellow-600 font-medium' : 'text-gray-900'
                                                    }`}>
                                                    {new Date(payable.due_date).toLocaleDateString()}
                                                    {payable.status === 'pending' && isOverdue(payable.due_date) && ' (Vencido)'}
                                                    {payable.status === 'pending' && isDueToday(payable.due_date) && ' (Vence hoy)'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{payable.provider?.name || `ID: ${payable.provider_id}`}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {payable.reference || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            ${payable.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${payable.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                payable.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {payable.status === 'paid' ? 'Pagado' : payable.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {payable.status === 'pending' && (
                                                <button
                                                    onClick={() => handleMarkAsPaid(payable.id)}
                                                    className="text-green-600 hover:text-green-900 flex items-center justify-end w-full"
                                                    title="Marcar como pagado"
                                                >
                                                    <CheckCircle className="w-5 h-5 mr-1" />
                                                    Pagar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredPayables.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No se encontraron cuentas por pagar
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Crear */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black bg-opacity-50">
                    <div className="relative w-full max-w-md mx-auto my-6">
                        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
                            <div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                                <h3 className="text-xl font-semibold">
                                    Registrar Deuda / Pago Pendiente
                                </h3>
                                <button
                                    className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                                    onClick={closeModal}
                                >
                                    <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                                        ×
                                    </span>
                                </button>
                            </div>
                            <div className="relative p-6 flex-auto">
                                <form id="payable-form" onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
                                        <select
                                            required
                                            value={formData.provider_id}
                                            onChange={(e) => setFormData({ ...formData, provider_id: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="0" disabled>Seleccione un proveedor</option>
                                            {providers.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Concepto / Referencia / Factura</label>
                                        <input
                                            type="text"
                                            value={formData.reference || ''}
                                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                            placeholder="Ej: Factura 1234, Alquiler Marzo"
                                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Monto * ($)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                required
                                                value={formData.amount || ''}
                                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de pago (Vencimiento) *</label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.due_date}
                                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                                <button
                                    className="text-gray-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                                    type="button"
                                    onClick={closeModal}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="bg-blue-600 text-white active:bg-blue-700 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                                    type="submit"
                                    form="payable-form"
                                    disabled={!formData.provider_id || formData.amount <= 0}
                                >
                                    Registrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className={`${isModalOpen ? 'opacity-25 fixed inset-0 z-40 bg-black' : 'hidden'}`}></div>
        </div>
    );
};

export default PayablesPage;
