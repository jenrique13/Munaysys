import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuthStore';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import logo from '../../../assets/nest-logo.png';
export const LoginPage: React.FC = () => {
    const { user, login, isLoading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [validationError, setValidationError] = useState('');

    // Si ya existe sesión, redirigir al Dashboard
    if (user) {
        return <Navigate to="/" replace />;
    }

    const validateForm = () => {
        setValidationError('');
        if (!email.trim()) {
            setValidationError('El correo electrónico es obligatorio.');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setValidationError('Por favor ingresa un correo electrónico válido.');
            return false;
        }
        if (!password.trim()) {
            setValidationError('La contraseña es obligatoria.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();

        if (!validateForm()) return;

        const success = await login({ email, password });
        if (success) {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4 font-sans relative">
            {/* Opcional: Patrón sutil de fondo para textura sin perder el color sólido */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all relative z-10">
                {/* Header */}
                <div className="bg-blue-700 px-8 pt-10 pb-12 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                    </div>

                    <div className="w-20 h-20 mb-4 z-10 flex items-center justify-center overflow-hidden bg-white rounded-xl shadow-lg p-2 relative">
                        <img
                            src={logo}
                            alt="Nest Coworking"
                            className="w-full h-full object-contain z-10 relative"
                            onLoad={(e) => {
                                const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                                if (fallback) fallback.style.display = 'none';
                            }}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback') as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                            }}
                        />
                        <div className="logo-fallback absolute inset-0 flex items-center justify-center text-indigo-600 font-bold text-3xl">
                            N
                        </div>
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight z-10">Nest Coworking</h2>
                    <p className="text-blue-100 mt-2 z-10 font-medium">Inicia sesión en tu cuenta</p>
                </div>

                {/* Body Form */}
                <div className="px-8 py-8 bg-white -mt-4 rounded-t-3xl relative z-20">

                    {/* Error Alerts */}
                    {(error || validationError) && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3 animate-pulse-fade">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <p className="text-sm font-medium">{validationError || error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Correo Electrónico</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); clearError(); setValidationError(''); }}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                                    placeholder="usuario@ejemplo.com"
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Contraseña</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); clearError(); setValidationError(''); }}
                                    className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Iniciando sesión...</span>
                                </>
                            ) : (
                                <span>Ingresar al Sistema</span>
                            )}
                        </button>
                    </form>

                </div>

                {/* Footer */}
                <div className="bg-gray-50 py-4 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">© {new Date().getFullYear()} Nest Coworking. Todos los derechos reservados.</p>
                </div>
            </div>

            {/* Custom inject minimal animation css for error box if needed */}
            <style>{`
                @keyframes pulse-fade {
                    0% { opacity: 0; transform: translateY(-5px); }
                    10% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 1; }
                }
                .animate-pulse-fade {
                    animation: pulse-fade 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
