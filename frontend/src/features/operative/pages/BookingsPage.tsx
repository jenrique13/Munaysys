import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useOperativeStore } from '../hooks/useOperativeStore';
import { useConfigurationStore } from '../../configuration/hooks/useConfigurationStore';
import type { Booking } from '../types';
import { CalendarDays, Plus, X, ChevronLeft, ChevronRight, Check, XCircle, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

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
    const [form, setForm] = useState({ room_id: 0, client_id: 0, start_time: '', end_time: '', notes: '' });
    const [conflict, setConflict] = useState(false);

    useEffect(() => { fetchClients(selectedBranchId ?? undefined); fetchRooms(selectedBranchId ?? undefined); }, [selectedBranchId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setConflict(false);
        const result = await createBooking({
            ...form,
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
                            <select required value={form.room_id} onChange={e => setForm(p => ({ ...p, room_id: +e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                                <option value={0} disabled>Seleccionar…</option>
                                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                            <select required value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: +e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                                <option value={0} disabled>Seleccionar…</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Inicio *</label>
                            <input type="datetime-local" required value={form.start_time}
                                onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fin *</label>
                            <input type="datetime-local" required value={form.end_time}
                                onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
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
            </div>
        </div>
    );
};

// ── Day Cell ──────────────────────────────────────────────────────────────────
const DayCell: React.FC<{ day: Date; bookings: Booking[]; currentMonth: Date; isToday: boolean; branches?: any[]; showBranch?: boolean }> = ({ day, bookings, currentMonth, isToday, branches, showBranch }) => {
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const dayBookings = bookings.filter(b => isSameDay(new Date(b.start_time), day));
    return (
        <div className={`min-h-[90px] p-1.5 border-b border-r border-gray-100 ${!isCurrentMonth ? 'bg-gray-50' : 'bg-white'}`}>
            <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1
        ${isToday ? 'bg-indigo-600 text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                {format(day, 'd')}
            </div>
            <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map(b => {
                    const branchName = showBranch && branches ? branches.find(br => br.id === b.room?.branch_id)?.name : null;
                    return (
                        <div key={b.id} className={`text-xs px-1 py-0.5 rounded truncate 
            ${b.status === 'confirmed' ? 'bg-indigo-100 text-indigo-700' : b.status === 'cancelled' ? 'bg-red-50 text-red-400' : 'bg-amber-50 text-amber-600'}`}>
                            {format(new Date(b.start_time), 'HH:mm')} {b.room?.name ?? ''} {branchName ? `(${branchName})` : ''}
                        </div>
                    );
                })}
                {dayBookings.length > 3 && (
                    <div className="text-xs text-gray-400 pl-1">+{dayBookings.length - 3} más</div>
                )}
            </div>
        </div>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const BookingsPage: React.FC = () => {
    const { bookings, fetchBookings, updateBookingStatus } = useOperativeStore();
    const { branches } = useConfigurationStore();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const { selectedBranchId } = useAuthStore();
    const [showModal, setShowModal] = useState(false);
    const today = new Date();

    useEffect(() => { fetchBookings(selectedBranchId ?? undefined); }, [selectedBranchId]);

    const calStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const calEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calStart, end: calEnd });
    const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const upcomingBookings = bookings
        .filter(b => new Date(b.start_time) >= today && b.status !== 'cancelled')
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        .slice(0, 5);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <CalendarDays size={22} className="text-indigo-600" /> Reservas
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Calendario interactivo de reservas de salas.</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors">
                    <Plus size={16} /> Nueva Reserva
                </button>
            </div>

            <div className="flex-1 overflow-auto flex gap-0">
                {/* Calendar */}
                <div className="flex-1 overflow-auto flex flex-col min-w-0">
                    {/* Month Nav */}
                    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center gap-3 shrink-0">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600"><ChevronLeft size={16} /></button>
                        <span className="font-semibold text-gray-800 capitalize min-w-40 text-center">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </span>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600"><ChevronRight size={16} /></button>
                        <button onClick={() => setCurrentMonth(today)}
                            className="ml-2 text-xs px-2 py-1 border border-gray-300 rounded text-gray-600 hover:bg-gray-50">Hoy</button>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 border-t border-l border-gray-100 flex-1">
                        {WEEK_DAYS.map(d => (
                            <div key={d} className="text-xs font-bold text-gray-400 text-center py-2 border-b border-r border-gray-100 bg-gray-50">{d}</div>
                        ))}
                        {days.map(day => (
                            <DayCell key={day.toISOString()} day={day} bookings={bookings} currentMonth={currentMonth} isToday={isSameDay(day, today)} branches={branches} showBranch={selectedBranchId === 0} />
                        ))}
                    </div>
                </div>

                {/* Sidebar: Upcoming */}
                <div className="w-72 border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-700 text-sm">Próximas Reservas</h2>
                    </div>
                    {upcomingBookings.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm mt-4">Sin reservas próximas</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {upcomingBookings.map(b => (
                                <div key={b.id} className="px-4 py-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-800 text-sm">{b.room?.name}</span>
                                            {selectedBranchId === 0 && (
                                                <span className="text-[10px] text-gray-500 font-medium">
                                                    {branches.find(br => br.id === b.room?.branch_id)?.name}
                                                </span>
                                            )}
                                        </div>
                                        <BookingBadge status={b.status} />
                                    </div>
                                    <p className="text-xs text-gray-500">{b.client?.name}</p>
                                    <div className="flex items-center text-xs text-gray-400 mt-1 gap-1">
                                        <Clock size={11} />
                                        {format(new Date(b.start_time), "d MMM, HH:mm", { locale: es })} – {format(new Date(b.end_time), "HH:mm")}
                                    </div>
                                    <div className="flex gap-1 mt-2">
                                        {b.status !== 'cancelled' && (
                                            <button onClick={() => updateBookingStatus(b.id, 'cancelled')}
                                                className="text-xs px-2 py-0.5 text-red-600 border border-red-200 rounded hover:bg-red-50">
                                                Cancelar
                                            </button>
                                        )}
                                        {b.status === 'pending' && (
                                            <button onClick={() => updateBookingStatus(b.id, 'confirmed')}
                                                className="flex items-center gap-1 text-xs px-2 py-0.5 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-50">
                                                <Check size={11} /> Confirmar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showModal && <NewBookingModal onClose={() => setShowModal(false)} />}
        </div>
    );
};

export default BookingsPage;
