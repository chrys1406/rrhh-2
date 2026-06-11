import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarCheck, Clock,
  FileText, Calendar, BarChart3, Settings, Megaphone
} from 'lucide-react';

const menuItems = [
  { name: 'Resumen', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Empleados', icon: Users, path: '/dashboard/empleados' },
  { name: 'Asistencia', icon: CalendarCheck, path: '/dashboard/asistencia' },
  { name: 'Tardanzas', icon: Clock, path: '/dashboard/tardanzas' },
  { name: 'Permisos', icon: FileText, path: '/dashboard/permisos' },
  { name: 'Vacaciones', icon: Calendar, path: '/dashboard/vacaciones' },
  { name: 'Reportes', icon: BarChart3, path: '/dashboard/reportes' },
  { name: 'Avisos', icon: Megaphone, path: '/dashboard/avisos' },
  { name: 'Configuración', icon: Settings, path: '/dashboard/configuracion' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('usuario');
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full flex bg-[#eef4fc] font-sans text-slate-800 antialiased p-2">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white rounded-2xl p-4 flex flex-col justify-between shadow-sm mr-2 shrink-0">
        <div>
          <div className="flex items-center gap-3 p-2 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-[#004bb4] flex items-center justify-center text-white font-bold text-sm shrink-0">
              {usuario.usuario?.charAt(0).toUpperCase()}
            </div>
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
          <button onClick={handleLogout} className="w-full text-left text-xs text-red-400 hover:text-red-600 font-medium px-2 transition-colors">
            Cerrar sesión
          </button>
          <p className="text-[11px] text-slate-400 px-2">SISTEMA WEB RRHH v1.0</p>
        </div>
      </aside>

      {/* CONTENIDO — Outlet renderiza la página activa */}
      <main className="flex-1 flex flex-col gap-4 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
}