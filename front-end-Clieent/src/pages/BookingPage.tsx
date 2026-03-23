import React, { useEffect, useState } from 'react';
import { useClientStore } from '../store/clientStore';
import { DoorOpen, Users, Clock, Send, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { format, addHours, setHours, setMinutes } from 'date-fns';

export const BookingPage: React.FC = () => {
  const { profile, rooms, fetchRooms, createBooking } = useClientStore();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !profile) return;

    setIsSubmitting(true);
    setMessage(null);

    const start = new Date(`${date}T${startTime}:00`);
    const end = addHours(start, parseFloat(duration));

    const bookingData = {
      room_id: selectedRoom.id,
      client_id: profile.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: 'pending',
      notes: 'Reserva solicitada desde el Portal de Clientes'
    };

    const success = await createBooking(bookingData);
    if (success) {
      setMessage({ type: 'success', text: '¡Reserva solicitada con éxito! Pendiente de aprobación.' });
      setSelectedRoom(null);
    } else {
      setMessage({ type: 'error', text: 'Error al solicitar la reserva. Es posible que el horario ya esté ocupado.' });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <div>
         <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reservar Sala</h1>
         <p className="text-slate-500 font-medium">Selecciona un espacio y solicita tu reserva.</p>
      </div>

      {message && (
        <div className={`p-5 rounded-2xl flex items-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} animate-in fade-in slide-in-from-top-4`}>
           {message.type === 'success' ? <CheckCircle2 className="mr-3 shrink-0" /> : <AlertCircle className="mr-3 shrink-0" />}
           <span className="font-bold text-sm">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
           <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <DoorOpen size={20} className="mr-2 text-indigo-600" /> Salas Disponibles
           </h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map(room => (
                 <div 
                   key={room.id} 
                   onClick={() => setSelectedRoom(room)}
                   className={`p-6 rounded-3xl border-2 transition-all cursor-pointer bg-white group ${
                     selectedRoom?.id === room.id 
                       ? 'border-indigo-600 shadow-xl shadow-indigo-600/5' 
                       : 'border-slate-100 hover:border-indigo-200'
                   }`}
                 >
                    <div className="flex justify-between items-start mb-4">
                       <h3 className="font-bold text-slate-900 text-lg">{room.name}</h3>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{room.type.replace('_', ' ')}</span>
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center text-xs text-slate-500 font-medium">
                          <Users size={14} className="mr-2 text-slate-400" /> Capacidad: {room.capacity} personas
                       </div>
                       <div className="flex items-center text-xs text-slate-500 font-medium">
                          <Clock size={14} className="mr-2 text-slate-400" /> Tarifa: ${room.hourly_rate}/hora
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-fit sticky top-8">
           <h3 className="text-xl font-bold text-slate-900 mb-6">Detalles de Reserva</h3>
           
           {selectedRoom ? (
             <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-indigo-50 p-4 rounded-2xl flex items-center mb-6">
                   <Info size={18} className="text-indigo-600 mr-2" />
                   <p className="text-xs font-medium text-indigo-700">Estas reservando: <span className="font-bold">{selectedRoom.name}</span></p>
                </div>

                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Fecha</label>
                   <input 
                     type="date" 
                     value={date}
                     onChange={(e) => setDate(e.target.value)}
                     min={format(new Date(), 'yyyy-MM-dd')}
                     className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-sm"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Hora inicio</label>
                     <input 
                       type="time" 
                       value={startTime}
                       onChange={(e) => setStartTime(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-sm"
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Duración (h)</label>
                     <select 
                       value={duration}
                       onChange={(e) => setDuration(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-sm"
                     >
                        <option value="1">1 hora</option>
                        <option value="2">2 horas</option>
                        <option value="3">3 horas</option>
                        <option value="4">4 horas</option>
                     </select>
                  </div>
                </div>

                <div className="pt-4">
                   <button 
                     type="submit" 
                     disabled={isSubmitting}
                     className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
                   >
                     {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                        <>Solicitar Reserva <Send size={16} className="ml-2" /></>
                     )}
                   </button>
                </div>
             </form>
           ) : (
             <div className="text-center py-20 text-slate-400">
                <DoorOpen size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">Selecciona una sala para ver las opciones de reserva.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
