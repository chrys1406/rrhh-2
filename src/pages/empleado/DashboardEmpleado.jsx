import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Clock, FileText, Calendar, LogOut, UserCircle } from 'lucide-react';
import { supabase } from '../../supabase/client';

const menuItems = [
  { name: 'Inicio',        icon: Home,        path: '/empleado' },
  { name: 'Mi Asistencia', icon: Clock,        path: '/empleado/asistencia' },
  { name: 'Mis Permisos',  icon: FileText,     path: '/empleado/permisos' },
  { name: 'Mis Vacaciones', icon: Calendar,    path: '/empleado/vacaciones' },
  { name: 'Mi Perfil',     icon: UserCircle,   path: '/empleado/perfil' },
];

export default function DashboardEmpleado() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const usuario   = JSON.parse(localStorage.getItem('usuario') || '{}');
  const [fotoUrl, setFotoUrl] = useState(null);

  useEffect(() => {
    cargarFoto();
  }, []);

  // escucha cambios de ruta para refrescar foto al volver del perfil
  useEffect(() => {
    cargarFoto();
  }, [location.pathname]);

  const cargarFoto = async () => {
    const { data } = await supabase
      .from('empleado')
      .select('foto_url')
      .eq('id_usuario', usuario.id)
      .single();
    if (data?.foto_url) setFotoUrl(data.foto_url);
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full flex bg-[#eef4fc] font-sans text-slate-800 antialiased p-2">
      <aside className="w-64 bg-white rounded-2xl p-4 flex flex-col justify-between shadow-sm mr-2 shrink-0">
        <div>
          {/* Perfil */}
          <div className="flex items-center gap-3 p-2 mb-6 border-b border-slate-100 pb-4">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt="foto"
                className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-[#d0e3fc]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#004bb4] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {usuario.usuario?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-900 text-sm leading-tight">{usuario.usuario}</h3>
              <p className="text-xs text-slate-500 capitalize">{usuario.rol}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive ? 'bg-[#e2edfd] text-[#004bb4]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-[#004bb4]' : 'text-slate-400'} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-3 space-y-2">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 text-left text-xs text-red-400 hover:text-red-600 font-medium px-2 transition-colors">
            <LogOut size={14} />
            Cerrar sesión
          </button>
          <p className="text-[11px] text-slate-400 px-2">SISTEMA WEB RRHH v1.0</p>
        </div>
      </aside>

      <main className="flex-1 flex flex-col gap-4 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}