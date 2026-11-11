import React, { useState, useEffect } from 'react';
import { useClientStore } from '../store/clientStore';
import { User, Mail, Phone, MapPin, CreditCard, Save } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { profile, updateProfile, fetchProfile } = useClientStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    ci_rif: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        ci_rif: profile.ci_rif || ''
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    const success = await updateProfile(profile.id, formData);
    setIsSaving(false);

    if (success) {
      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente.' });
      fetchProfile();
    } else {
      setMessage({ type: 'error', text: 'Error al actualizar el perfil.' });
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mi Perfil</h1>
        <p className="text-slate-500 font-medium">Actualiza tu información personal y de contacto.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {message.text && (
            <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center">
                <User size={16} className="mr-2 text-indigo-500" /> Nombre Completo
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center">
                <CreditCard size={16} className="mr-2 text-indigo-500" /> CI / RIF
              </label>
              <input
                type="text"
                name="ci_rif"
                value={formData.ci_rif}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700 flex items-center">
                <Mail size={16} className="mr-2 text-slate-400" /> Correo Electrónico
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 font-medium">El correo no puede ser modificado.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center">
                <Phone size={16} className="mr-2 text-indigo-500" /> Teléfono
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700 flex items-center">
                <MapPin size={16} className="mr-2 text-indigo-500" /> Dirección
              </label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center px-8 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Save size={18} className="mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
