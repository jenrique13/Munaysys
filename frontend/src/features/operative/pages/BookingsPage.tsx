import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useOperativeStore } from '../hooks/useOperativeStore';
import { useConfigurationStore } from '../../configuration/hooks/useConfigurationStore';
import type { Booking } from '../types';
import { CalendarDays, Plus, X, ChevronLeft, ChevronRight, Check, XCircle, Clock, DoorOpen, Users, Edit2, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { RoomBookingPicker } from '../../financial/components/RoomBookingPicker';
import { financialService } from '../../financial/services/financial.service';
import { operativeService } from '../services/operative.service';
import { SearchableSelect } from '../../../components/molecules/SearchableSelect';

// ── Status Badge ──────────────────────────────────────────────────────────────
const BookingBadge: React.FC<{ status: string }> = ({ status }) => {
    const map: Record<string, string> = {
        confirmed: 'bg-emerald-100 text-emerald-700',
        pending: 'bg-amber-100 text-amber-700',
        cancelled: 'bg-red-100 text-red-500 line-through',
    };
    const labels: Record<string, string> = { confirmed: 'Confirmado', pending: 'Pendiente', cancelled: 'Cancelado' };
    return <span className={`text - xs font - semibold px - 2 py - 0.5 rounded - full ${map[status] ?? 'bg-gray-100'} `}>{labels[status] ?? status}</span>;
};

// ── New Booking Modal ─────────────────────────────────────────────────────────
const NewBookingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { selectedBranchId } = useAuthStore();
    const { createBooking, clients, rooms, fetchClients, fetchRooms, isLoading } = useOperativeStore();
    const [form, setForm] = useState({ room_id: 0, client_id: 0, start_time: '', end_time: '', notes: '', total_hours: 0, total_cost: 0 });
    const [conflict, setConflict] = useState(false);
    const [bookingRoom, setBookingRoom] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [clientAmenities, setClientAmenities] = useState<any[]>([]);

    useEffect(() => {
        fetchClients(selectedBranchId ?? undefined);
        fetchRooms(selectedBranchId ?? undefined);
        financialService.getServices(selectedBranchId || undefined).then(setServices).catch(() => { });
    }, [selectedBranchId]);

    useEffect(() => {
        if (form.client_id > 0) {
            operativeService.getAmenities(selectedBranchId ?? undefined, form.client_id).then(setClientAmenities);
        } else {
            setClientAmenities([]);
        }
    }, [form.client_id, selectedBranchId]);

    const handleRoomChange = (roomId: number) => {
        const room = rooms.find(r => r.id === roomId);
        if (room) {
            setBookingRoom(room);
        }
    };

    const handleConfirmBooking = (data: { serviceId: number; startTime: string; endTime: string; qty: number; price: number; serviceName: string }) => {
        if (!bookingRoom) return;

    // Calculate line price considering amenities
    let linePrice = data.price * data.qty;
    const roomAmenity = clientAmenities.find(a => a.space_type === 'room' && a.space_id === bookingRoom.id && a.quantity > 0)
        || clientAmenities.find(a => a.category === 'hours' && a.quantity > 0);

    if (roomAmenity) {
        const covered = Math.min(data.qty, roomAmenity.quantity);
        linePrice = (data.qty - covered) * data.price;
    }

    setForm(p => ({
        ...p,
        room_id: bookingRoom.id,
        start_time: data.startTime,
        end_time: data.endTime,
        total_hours: data.qty,
        total_cost: linePrice,
        notes: p.notes ? `${p.notes}\nTarifa: ${data.serviceName}` : `Tarifa: ${data.serviceName}`
    }));
    setBookingRoom(null);
};

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflict(false);
    const result = await createBooking({
        ...form,
        start_time: form.start_time.includes('Z') ? form.start_time : new Date(form.start_time).toISOString(),
        end_time: form.end_time.includes('Z') ? form.end_time : new Date(form.end_time).toISOString(),
        room_id: Number(form.room_id),
        client_id: Number(form.client_id),
    });
    if (result.ok) { onClose(); }
    else if (result.conflict) { setConflict(true); }
};

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                <h2 className="font-bold text-gray-800 text-lg">Nueva Reserva</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {conflict && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                        <XCircle size={16} /> La sala ya está reservada en ese horario. Elige otro bloque.
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sala *</label>
                        <select required value={form.room_id} onChange={e => handleRoomChange(+e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                            <option value={0} disabled>Seleccionar…</option>
                            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        {form.room_id > 0 && form.total_hours > 0 && (
                            <div className="mt-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider mb-1">Horario Seleccionado</p>
                                <p className="text-xs font-bold text-indigo-900">
                                    {format(new Date(form.start_time), "d MMM, HH:mm", { locale: es })} - {format(new Date(form.end_time), "HH:mm")}
                                </p>
                                <p className="text-[10px] text-indigo-500 mt-0.5">
                                    {form.total_hours} hrs • Total: ${form.total_cost.toFixed(2)}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => handleRoomChange(form.room_id)}
                                    className="mt-1 text-[10px] text-indigo-600 underline hover:text-indigo-800"
                                >
                                    Cambiar horario
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                        <SearchableSelect 
                            required 
                            value={form.client_id === 0 ? null : form.client_id} 
                            onChange={val => setForm(p => ({ ...p, client_id: val ? Number(val) : 0 }))} 
                            options={clients.map(c => ({ value: c.id, label: c.name }))} 
                            placeholder="Buscar cliente..." 
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                    <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                    <button disabled={isLoading} className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                        {isLoading ? 'Reservando...' : 'Confirmar Reserva'}
                    </button>
                </div>
            </form>
            {bookingRoom && (
                <RoomBookingPicker
                    room={bookingRoom}
                    services={services}
                    onConfirm={handleConfirmBooking}
                    onCancel={() => setBookingRoom(null)}
                />
            )}
        </div>
    </div>
);
};

// ── Edit Notes Modal ──────────────────────────────────────────────────────────
const EditNotesModal: React.FC<{ booking: Booking; onClose: () => void }> = ({ booking, onClose }) => {
    const { updateBooking, isLoading } = useOperativeStore();
    const [notes, setNotes] = useState(booking.notes || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await updateBooking(booking.id, { notes });
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg">Editar Notas</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas / Comentarios</label>
                        <textarea 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            placeholder="Agrega detalles importantes aquí..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button disabled={isLoading} className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-all active:scale-95">
                            {isLoading ? 'Guardando...' : 'Guardar Notas'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Edit Booking Modal ────────────────────────────────────────────────────────
const EditBookingModal: React.FC<{ booking: Booking; onClose: () => void }> = ({ booking, onClose }) => {
    const { selectedBranchId } = useAuthStore();
    const { updateBooking, clients, rooms, fetchClients, fetchRooms, isLoading } = useOperativeStore();
    const [form, setForm] = useState({ 
        room_id: booking.room_id, 
        client_id: booking.client_id, 
        start_time: booking.start_time, 
        end_time: booking.end_time, 
        notes: booking.notes || '',
        total_hours: booking.total_hours,
        total_cost: booking.total_cost,
        service_id: booking.service_id
    });
    const [conflict, setConflict] = useState(false);
    const [bookingRoom, setBookingRoom] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);

    useEffect(() => {
        fetchClients(selectedBranchId ?? undefined);
        fetchRooms(selectedBranchId ?? undefined);
        financialService.getServices(selectedBranchId || undefined).then(setServices).catch(() => { });
    }, [selectedBranchId]);

    const handleRoomChange = (roomId: number) => {
        const room = rooms.find(r => r.id === roomId);
        if (room) {
            setBookingRoom(room);
        }
    };

    const handleConfirmBooking = (data: { serviceId: number; startTime: string; endTime: string; qty: number; price: number; serviceName: string }) => {
        setForm(p => ({
            ...p,
            start_time: data.startTime,
            end_time: data.endTime,
            total_hours: data.qty,
            total_cost: data.price * data.qty,
            service_id: data.serviceId
        }));
        setBookingRoom(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setConflict(false);
        const ok = await updateBooking(booking.id, {
            ...form,
            start_time: form.start_time.includes('Z') ? form.start_time : new Date(form.start_time).toISOString(),
            end_time: form.end_time.includes('Z') ? form.end_time : new Date(form.end_time).toISOString(),
            room_id: Number(form.room_id),
            client_id: Number(form.client_id),
        } as any);
        if (ok) { onClose(); }
        else { setConflict(true); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg z-10 overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800 text-lg">Editar Reserva #{booking.id}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {conflict && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                            <XCircle size={16} /> No se pudo actualizar la reserva. Verifique disponibilidad.
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sala</label>
                            <select required value={form.room_id} onChange={e => setForm(p => ({ ...p, room_id: +e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                            <SearchableSelect 
                                required 
                                value={form.client_id === 0 ? null : form.client_id} 
                                onChange={val => setForm(p => ({ ...p, client_id: val ? Number(val) : 0 }))} 
                                options={clients.map(c => ({ value: c.id, label: c.name }))} 
                                placeholder="Buscar cliente..." 
                            />
                        </div>
                    </div>

                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider mb-1">Horario Seleccionado</p>
                        <p className="text-sm font-bold text-indigo-900">
                            {format(new Date(form.start_time), "d MMM, HH:mm", { locale: es })} - {format(new Date(form.end_time), "HH:mm")}
                        </p>
                        <button type="button" onClick={() => handleRoomChange(form.room_id)} className="mt-1 text-[11px] text-indigo-600 underline font-medium hover:text-indigo-800 transition-colors">Cambiar horario</button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            placeholder="Notas de la reserva..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" rows={2} />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button disabled={isLoading} className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-all active:scale-95">
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
                {bookingRoom && (
                    <RoomBookingPicker
                        room={bookingRoom}
                        services={services}
                        onConfirm={handleConfirmBooking}
                        onCancel={() => setBookingRoom(null)}
                    />
                )}
            </div>
        </div>
    );
};

// ── Day Cell (Month View) ──────────────────────────────────────────────────────
const DayCell: React.FC<{ day: Date; bookings: Booking[]; currentMonth: Date; isToday: boolean; branches?: any[]; showBranch?: boolean; onSelect: (b: Booking) => void }> = ({ day, bookings, currentMonth, isToday, branches, showBranch, onSelect }) => {
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const dayBookings = bookings.filter(b => isSameDay(new Date(b.start_time), day))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return (
        <div className={`min-h-[110px] p-1.5 border-b border-r border-gray-100 ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white'}`}>
            <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1
        ${isToday ? 'bg-indigo-600 text-white shadow-sm' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                {format(day, 'd')}
            </div>
            <div className="space-y-1">
                {dayBookings.slice(0, 4).map(b => {
                    const branchName = showBranch && branches ? branches.find(br => br.id === b.room?.branch_id)?.name : null;
                    return (
                        <div
                            key={b.id}
                            onClick={() => onSelect(b)}
                            className={`text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer transition-all hover:brightness-95 active:scale-95
                            ${b.status === 'confirmed' ? 'bg-indigo-100 text-indigo-700 font-medium' : b.status === 'cancelled' ? 'bg-red-50 text-red-400' : 'bg-amber-50 text-amber-600'}`}
                        >
                            {format(new Date(b.start_time), 'HH:mm')} {b.room?.name ?? ''} {branchName ? `(${branchName})` : ''}
                        </div>
                    );
                })}
                {dayBookings.length > 4 && (
                    <div className="text-[10px] text-gray-400 font-medium pl-1">+{dayBookings.length - 4} más</div>
                )}
            </div>
        </div>
    );
};

// ── List View (Week/Day) ──────────────────────────────────────────────────────
const DayList: React.FC<{ day: Date; bookings: Booking[]; isToday: boolean; onSelect: (b: Booking) => void }> = ({ day, bookings, isToday, onSelect }) => {
    const dayBookings = bookings.filter(b => isSameDay(new Date(b.start_time), day))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return (
        <div className="flex flex-col h-full bg-white">
            <div className={`px-3 py-2 border-b flex justify-between items-center ${isToday ? 'bg-indigo-50/30' : 'bg-gray-50/50'}`}>
                <div className="flex flex-col">
                    <span className={`text-xs font-bold ${isToday ? 'text-indigo-600' : 'text-gray-500 uppercase tracking-tighter'}`}>
                        {format(day, 'EEEE', { locale: es })}
                    </span>
                    <span className={`text-lg font-bold ${isToday ? 'text-indigo-700' : 'text-gray-900'}`}>
                        {format(day, 'd MMM')}
                    </span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[300px]">
                {dayBookings.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-4">
                        <span className="text-[10px] text-gray-300 italic">Sin reservas</span>
                    </div>
                ) : (
                    dayBookings.map(b => (
                        <div
                            key={b.id}
                            onClick={() => onSelect(b)}
                            className={`p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95
                            ${b.status === 'confirmed' ? 'bg-white border-indigo-100' : 'bg-gray-50 border-gray-100'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[11px] font-bold text-gray-900">{b.room?.name}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                                    {format(new Date(b.start_time), 'HH:mm')}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-500 truncate">{b.client?.name}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const BookingsPage: React.FC = () => {
    const { bookings, fetchBookings, updateBookingStatus, deleteBooking } = useOperativeStore();
    const { branches } = useConfigurationStore();
    const { user, selectedBranchId } = useAuthStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');
    const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const today = new Date();

    const roleName = user?.role?.name || '';
    const isPrivileged = ['Super Administrador', 'Gerente', 'Ventas'].includes(roleName) || user?.is_superuser;

    useEffect(() => { fetchBookings(selectedBranchId ?? undefined); }, [selectedBranchId]);

    const selectedBooking = bookings.find(b => b.id === selectedBookingId);

    // ── Navigation Logic ───────────────────────────────────────────────────────
    const handlePrev = () => {
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
        else setCurrentDate(subDays(currentDate, 1));
    };
    const handleNext = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
        else setCurrentDate(addDays(currentDate, 1));
    };

    const upcomingBookings = bookings
        .filter(b => new Date(b.start_time) >= today && b.status !== 'cancelled')
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, 5);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header Main */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <CalendarDays size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
                        <p className="text-sm text-gray-500">Gestión de espacios y salas.</p>
                    </div>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 active:translate-y-0">
                    <Plus size={18} /> Nueva Reserva
                </button>
            </div>

            <div className="flex-1 overflow-hidden flex">
                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    {/* View Switcher & Date Nav */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                {(['month', 'week', 'day'] as const).map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setView(v)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${view === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
                                    </button>
                                ))}
                            </div>
                            <div className="h-6 w-px bg-gray-200 mx-2" />
                            <div className="flex items-center gap-1">
                                <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronLeft size={18} /></button>
                                <span className="font-bold text-gray-800 capitalize min-w-[140px] text-center">
                                    {view === 'day'
                                        ? format(currentDate, 'd MMM yyyy', { locale: es })
                                        : format(currentDate, 'MMMM yyyy', { locale: es })}
                                </span>
                                <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronRight size={18} /></button>
                                <button onClick={() => setCurrentDate(today)}
                                    className="ml-3 text-xs px-3 py-1.5 font-bold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 active:scale-95 transition-all">Hoy</button>
                            </div>
                        </div>
                    </div>

                    {/* View Render */}
                    <div className="flex-1 overflow-y-auto bg-gray-50/30">
                        {view === 'month' && (
                            <div className="grid grid-cols-7 border-l border-gray-100 h-full min-w-[800px]">
                                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                                    <div key={d} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center py-2 border-b border-r border-gray-100 bg-white">{d}</div>
                                ))}
                                {eachDayOfInterval({
                                    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
                                    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
                                }).map(day => (
                                    <DayCell
                                        key={day.toISOString()}
                                        day={day}
                                        bookings={bookings}
                                        currentMonth={currentDate}
                                        isToday={isSameDay(day, today)}
                                        branches={branches}
                                        showBranch={selectedBranchId === 0}
                                        onSelect={(b) => setSelectedBookingId(b.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {view === 'week' && (
                            <div className="grid grid-cols-7 divide-x divide-gray-100 border-b h-full min-w-[900px]">
                                {eachDayOfInterval({
                                    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                                    end: endOfWeek(currentDate, { weekStartsOn: 1 })
                                }).map(day => (
                                    <DayList
                                        key={day.toISOString()}
                                        day={day}
                                        bookings={bookings}
                                        isToday={isSameDay(day, today)}
                                        onSelect={(b) => setSelectedBookingId(b.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {view === 'day' && (
                            <div className="max-w-3xl mx-auto p-6">
                                <DayList
                                    day={currentDate}
                                    bookings={bookings}
                                    isToday={isSameDay(currentDate, today)}
                                    onSelect={(b) => setSelectedBookingId(b.id)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Detail / Upcoming */}
                <div className="w-80 border-l border-gray-200 bg-white flex flex-col shrink-0">
                    {selectedBooking ? (
                        <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
                            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50/20">
                                <h2 className="font-bold text-indigo-900 text-sm">Detalle de Reserva</h2>
                                <button onClick={() => setSelectedBookingId(null)} className="text-indigo-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-lg">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex-1 p-5 space-y-6 overflow-y-auto">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Sala / Espacio</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                                <DoorOpen size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{selectedBooking.room?.name}</p>
                                                <p className="text-xs text-gray-500">ID: #{selectedBooking.id}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Cliente</p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{selectedBooking.client?.name}</p>
                                                <p className="text-xs text-gray-500">{selectedBooking.client?.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Horario</p>
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <div className="flex items-center gap-3 text-gray-700 font-medium">
                                                <Clock size={16} className="text-indigo-500" />
                                                <span className="text-sm">
                                                    {format(new Date(selectedBooking.start_time), "EEEE, d 'de' MMMM", { locale: es })}
                                                </span>
                                            </div>
                                            <div className="mt-2 ml-7 flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Inicio</p>
                                                    <p className="font-bold text-gray-900">{format(new Date(selectedBooking.start_time), "HH:mm")}</p>
                                                </div>
                                                <div className="text-gray-300 h-8 w-px bg-gray-200" />
                                                <div className="text-center">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Fin</p>
                                                    <p className="font-bold text-gray-900">{format(new Date(selectedBooking.end_time), "HH:mm")}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notas</p>
                                            <button 
                                                onClick={() => setShowNotesModal(true)}
                                                className="text-[10px] text-indigo-500 font-bold hover:underline"
                                            >
                                                Editar Notas
                                            </button>
                                        </div>
                                        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 min-h-[80px] relative group">
                                            <p className="text-xs text-amber-800 leading-relaxed italic">
                                                {selectedBooking.notes || "No hay notas adicionales para esta reserva."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 space-y-3">
                                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <span className="text-xs font-bold text-gray-500">Estado:</span>
                                        <BookingBadge status={selectedBooking.status} />
                                    </div>

                                    {isPrivileged && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setShowEditModal(true)}
                                                className="flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 active:scale-95 transition-all"
                                            >
                                                <Edit2 size={14} /> Editar
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('¿Deseas eliminar permanentemente esta reserva?')) {
                                                        deleteBooking(selectedBooking.id).then(ok => {
                                                            if (ok) setSelectedBookingId(null);
                                                        });
                                                    }
                                                }}
                                                className="flex items-center justify-center gap-2 py-2 rounded-xl border border-red-100 text-red-600 font-bold text-xs hover:bg-red-50 active:scale-95 transition-all"
                                            >
                                                <Trash2 size={14} /> Eliminar
                                            </button>
                                        </div>
                                    )}

                                    {selectedBooking.status !== 'cancelled' && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('¿Deseas cancelar esta reserva?')) {
                                                    updateBookingStatus(selectedBooking.id, 'cancelled');
                                                }
                                            }}
                                            className="w-full py-2.5 rounded-xl border-2 border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 active:scale-95 transition-all"
                                        >
                                            Cancelar Reserva
                                        </button>
                                    )}
                                    {selectedBooking.status === 'pending' && (
                                        <button
                                            onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                                            className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all"
                                        >
                                            Confirmar Reserva
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full bg-white animate-in fade-in duration-500">
                            <div className="px-5 py-4 border-b border-gray-100">
                                <h2 className="font-bold text-gray-700 text-sm">Próximas Reservas</h2>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {upcomingBookings.length === 0 ? (
                                    <div className="p-10 text-center space-y-3">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                            <Clock size={24} />
                                        </div>
                                        <p className="text-xs text-gray-400 italic">No hay reservas próximas esta semana.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {upcomingBookings.map(b => (
                                            <div
                                                key={b.id}
                                                onClick={() => setSelectedBookingId(b.id)}
                                                className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition-all border-l-4 border-transparent hover:border-indigo-400"
                                            >
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{b.room?.name}</p>
                                                        <p className="text-[10px] text-gray-500 font-medium">{b.client?.name}</p>
                                                    </div>
                                                    <BookingBadge status={b.status} />
                                                </div>
                                                <div className="flex items-center text-[10px] text-gray-400 gap-1.5">
                                                    <CalendarDays size={12} className="text-indigo-400" />
                                                    {format(new Date(b.start_time), "d MMM, HH:mm", { locale: es })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showModal && <NewBookingModal onClose={() => setShowModal(false)} />}
            {showEditModal && selectedBooking && <EditBookingModal booking={selectedBooking} onClose={() => setShowEditModal(false)} />}
            {showNotesModal && selectedBooking && <EditNotesModal booking={selectedBooking} onClose={() => setShowNotesModal(false)} />}
        </div>
    );
};

export default BookingsPage;
