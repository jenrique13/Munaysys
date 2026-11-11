import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, CheckCircle2, ChevronRight, Info, Search } from 'lucide-react';
import type { Service } from '../types';

export const calculateDuration = (date: string, start: string, end: string): { duration: number, raw: number } => {
    if (!date || !start || !end) return { duration: 0, raw: 0 };
    const d1 = new Date(`${date}T${start}`);
    const d2 = new Date(`${date}T${end}`);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return { duration: 0, raw: 0 };
    const diffMs = d2.getTime() - d1.getTime();
    if (diffMs <= 0) return { duration: 0, raw: 0 };
    const hours = diffMs / (1000 * 60 * 60);
    
    // Applying business rules: 60 min rounding and 1h minimum
    const rounded = Math.ceil(hours);
    const finalDuration = Math.max(1, rounded);
    
    return { duration: finalDuration, raw: Number(hours.toFixed(2)) };
};

interface RoomBookingPickerProps {
    room: { id: number; name: string };
    services: Service[];
    onConfirm: (data: { serviceId: number; startTime: string; endTime: string; qty: number; price: number; serviceName: string }) => void;
    onCancel: () => void;
}

export const RoomBookingPicker: React.FC<RoomBookingPickerProps> = ({ room, services, onConfirm, onCancel }) => {
    const roomServices = services.filter(s => s.is_room_rate);
    const [selectedServiceId, setSelectedServiceId] = useState<number>(roomServices[0]?.id || 0);
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('09:00');
    const [calc, setCalc] = useState({ duration: 0, raw: 0 });
    const [searchTerm, setSearchTerm] = useState('');

    const filteredServices = roomServices.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setCalc(calculateDuration(bookingDate, startTime, endTime));
    }, [bookingDate, startTime, endTime]);

    const selectedService = roomServices.find(s => s.id === selectedServiceId);
    const totalPrice = (selectedService?.price || 0) * calc.duration;

    const isValid = selectedServiceId > 0 && bookingDate && startTime && endTime && calc.duration > 0;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onCancel} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b bg-indigo-600 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg leading-none">Configurar Reserva</h2>
                            <p className="text-xs text-indigo-100 mt-1 opacity-80">{room.name}</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                    {/* Tarifa Selection */}
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <ChevronRight size={14} className="text-indigo-500" /> Seleccionar Tarifa
                            </label>
                            
                            {/* Search Input */}
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Buscar tarifa..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                                />
                                {searchTerm && (
                                    <button 
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
                            {filteredServices.length === 0 ? (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                                    <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700">
                                        {searchTerm ? 'No se encontraron tarifas con ese nombre.' : 'No hay servicios configurados como tarifas de sala.'}
                                    </p>
                                </div>
                            ) : (
                                filteredServices.map(s => (
                                    <button 
                                        key={s.id} 
                                        type="button"
                                        onClick={() => setSelectedServiceId(s.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                                            selectedServiceId === s.id 
                                            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600' 
                                            : 'border-slate-100 hover:border-slate-200 bg-white'
                                        }`}
                                    >
                                        <div className="text-left">
                                            <p className="font-bold text-sm text-slate-800">{s.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Tarifa por hora</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-indigo-600 text-lg">${s.price.toFixed(2)}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Calendar size={14} className="text-indigo-500" /> Fecha de Reserva
                            </label>
                            <input 
                                type="date" 
                                value={bookingDate}
                                onChange={e => setBookingDate(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Clock size={14} className="text-indigo-500" /> Hora Inicio
                                </label>
                                <input 
                                    type="time" 
                                    value={startTime}
                                    onChange={e => setStartTime(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Clock size={14} className="text-indigo-500" /> Hora Fin
                                </label>
                                <input 
                                    type="time" 
                                    value={endTime}
                                    onChange={e => setEndTime(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                                />
                            </div>
                        </div>
                    </div>

                    {calc.duration > 0 && totalPrice > 0 && (
                        <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3 relative overflow-hidden shadow-lg shadow-slate-200">
                             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <Calendar size={80} />
                            </div>
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Duración seleccionada</span>
                                    <span className="text-sm font-bold text-slate-300">{calc.raw} <span className="text-xs font-normal opacity-70">hrs</span></span>
                                </div>
                                <div className="text-right flex flex-col">
                                    <span className="text-[10px] text-indigo-300 font-medium uppercase tracking-widest text-right">Tiempo a cobrar</span>
                                    <span className="text-lg font-black text-white">{calc.duration} <span className="text-xs font-normal opacity-70">hrs</span></span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center relative z-10 pt-2 border-t border-white/10">
                                <span className="text-xs text-slate-400 font-medium uppercase tracking-widest text-indigo-300">Total a Cotizar</span>
                                <span className="text-2xl font-black text-indigo-400">${totalPrice.toFixed(2)}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 italic mt-1">* Se cobra con un mínimo de 1 hora y redondeo al bloque de 60 min.</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button 
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-white text-slate-600 font-bold text-sm rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        disabled={!isValid}
                        onClick={() => selectedService && onConfirm({
                            serviceId: selectedService.id,
                            startTime: new Date(`${bookingDate}T${startTime}:00`).toISOString(),
                            endTime: new Date(`${bookingDate}T${endTime}:00`).toISOString(),
                            qty: calc.duration,
                            price: selectedService.price,
                            serviceName: selectedService.name
                        })}
                        className="flex-2 px-8 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={18} /> Confirmar Reserva
                    </button>
                </div>
            </div>
        </div>
    );
};
