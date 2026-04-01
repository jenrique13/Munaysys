import re

with open('src/pages/DashboardPage.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'import \{ useClientStore \} from \'\.\./store/clientStore\';', "import { useNavigate } from 'react-router-dom';\nimport { useClientStore } from '../store/clientStore';", text)
text = re.sub(r'const \{ profile, statement, memberships, fetchStatement, fetchMemberships \} = useClientStore\(\);', "const { profile, statement, memberships, fetchStatement, fetchMemberships } = useClientStore();\n  const navigate = useNavigate();", text)
text = re.sub(r'<div className=\"mt-6\">\s*<button className=\"w-full bg-slate-900 text-white rounded-xl py-2\.5 text-sm font-bold hover:bg-slate-800 transition-colors\">Pagar Ahora</button>\s*</div>', '', text)
text = re.sub(r'(<button)(\s+className=\"w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all\">\s*\+ Nueva Reserva\s*</button>)', r"\1 onClick={() => navigate('/booking')}\2", text)
text = re.sub(r'(<button)(\s+className=\"bg-white text-indigo-600 py-3\.5 px-8 rounded-2xl font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all relative z-10\">\s*Ir a Reservas\s*</button>)', r"\1 onClick={() => navigate('/booking')}\2", text)

with open('src/pages/DashboardPage.tsx', 'w', encoding='utf-8', newline='') as f:
    f.write(text)
print("SUCCESS")
