import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, CheckSquare, Calendar, Flag } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { supabase } from '../../supabase/client';

const COLORS = ['#002d6b', '#1e40af', '#2563eb', '#3b82f6', '#06b6d4', '#0ea5e9', '#93c5fd'];

const estadoBadge = (estado) => {
  const estilos = {
    aprobado: 'bg-green-50 text-green-600',
    pendiente: 'bg-orange-50 text-orange-500',
    rechazado: 'bg-red-50 text-red-500',
  };
  return `${estilos[estado] || 'bg-slate-50 text-slate-500'} px-2 py-0.5 rounded-md font-bold text-[10px]`;
};

export default function Resumen() {
  const [stats, setStats] = useState({
    totalEmpleados: 0,
    asistenciasHoy: 0,
    tardanzasHoy: 0,
    permisosPendientes: 0,
    vacacionesAprobadas: 0,
  });
  const [vacacionesRecientes, setVacacionesRecientes] = useState([]);
  const [tardanzasRecientes, setTardanzasRecientes] = useState([]);
  const [asistenciaSemanal, setAsistenciaSemanal] = useState([]);
  const [distribucionAreas, setDistribucionAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    await Promise.all([
      cargarStats(),
      cargarVacacionesRecientes(),
      cargarTardanzasRecientes(),
      cargarAsistenciaSemanal(),
      cargarDistribucionAreas(),
    ]);
    setLoading(false);
  };

  const cargarStats = async () => {
    const hoy = new Date().toISOString().split('T')[0];
    const [{ count: totalEmpleados }, { count: asistenciasHoy },
           { count: tardanzasHoy }, { count: permisosPendientes },
           { count: vacacionesAprobadas }] = await Promise.all([
      supabase.from('empleado').select('*', { count: 'exact', head: true }),
      supabase.from('asistencia').select('*', { count: 'exact', head: true }).eq('fecha', hoy),
      supabase.from('asistencia').select('*', { count: 'exact', head: true }).eq('fecha', hoy).eq('estado', 'tardanza'),
      supabase.from('permiso').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('vacacion').select('*', { count: 'exact', head: true }).eq('estado', 'aprobado'),
    ]);
    setStats({ totalEmpleados, asistenciasHoy, tardanzasHoy, permisosPendientes, vacacionesAprobadas });
  };

  const cargarVacacionesRecientes = async () => {
    const { data } = await supabase
      .from('vacacion')
      .select('*, empleado(nombre, apellido)')
      .order('fecha_inicio', { ascending: false })
      .limit(3);
    setVacacionesRecientes(data || []);
  };

  const cargarTardanzasRecientes = async () => {
    const hoy = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('asistencia')
      .select('*, empleado(nombre, apellido, id_area, area:id_area(nombre_area))')
      .eq('estado', 'tardanza')
      .eq('fecha', hoy)
      .limit(3);
    setTardanzasRecientes(data || []);
  };

  const cargarAsistenciaSemanal = async () => {
    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1);

    const promesas = dias.map((dia, i) => {
      const fecha = new Date(lunes);
      fecha.setDate(lunes.getDate() + i);
      const fechaStr = fecha.toISOString().split('T')[0];
      return Promise.all([
        supabase.from('asistencia').select('*', { count: 'exact', head: true }).eq('fecha', fechaStr),
        supabase.from('asistencia').select('*', { count: 'exact', head: true }).eq('fecha', fechaStr).eq('estado', 'tardanza'),
      ]).then(([{ count: asistencia }, { count: tardanzas }]) => ({
        name: dia, Asistencia: asistencia || 0, Tardanzas: tardanzas || 0,
      }));
    });

    setAsistenciaSemanal(await Promise.all(promesas));
  };

  const cargarDistribucionAreas = async () => {
    const { data: areas } = await supabase.from('area').select('id_area, nombre_area');
    const { data: empleados } = await supabase.from('empleado').select('id_area');
    if (!areas || !empleados) return;
    setDistribucionAreas(
      areas.map(area => ({
        name: area.nombre_area,
        value: empleados.filter(e => e.id_area === area.id_area).length,
      })).filter(a => a.value > 0)
    );
  };

  const porcentajeAsistencia = stats.totalEmpleados > 0
    ? Math.round((stats.asistenciasHoy / stats.totalEmpleados) * 100) : 0;

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-[#004bb4] font-semibold text-lg animate-pulse">Cargando dashboard...</p>
    </div>
  );

  return (
    <>
      {/* Header */}
      <header className="bg-[#d0e3fc] rounded-2xl px-6 py-4 flex justify-between items-center shadow-sm">
        <h2 className="font-extrabold text-[#002d6b] tracking-wide text-sm uppercase">
          SISTEMA WEB RRHH - DASHBOARD
        </h2>
        <span className="text-xs font-semibold text-[#002d6b]/80 bg-white/40 px-3 py-1 rounded-full">
          {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </header>

      {/* TARJETAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500">Empleados Activos</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-[#0066cc]">{stats.totalEmpleados}</span>
          </div>
          <div className="absolute right-4 bottom-4 bg-blue-50 p-2 rounded-xl text-[#0066cc]">
            <Users size={16} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500">Asistencias del Día</span>
          <div className="mt-2">
            <span className="text-3xl font-black text-[#0066cc]">{stats.asistenciasHoy}</span>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
              <span>Estatus</span>
              <span className="font-bold text-slate-700">{porcentajeAsistencia}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
              <div className="bg-[#0066cc] h-full rounded-full" style={{ width: `${porcentajeAsistencia}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500">Tardanzas Registradas</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900">{stats.tardanzasHoy}</span>
          </div>
          <div className="absolute right-4 bottom-4 bg-orange-50 p-2 rounded-xl text-orange-500">
            <AlertTriangle size={16} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500">Permisos Pendientes</span>
          <div className="mt-1">
            <span className="text-3xl font-black text-slate-900">{stats.permisosPendientes}</span>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">Pendientes por revisar</p>
          </div>
          <div className="absolute right-4 bottom-4 bg-cyan-50 p-2 rounded-xl text-cyan-600">
            <CheckSquare size={16} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500">Vacaciones Aprobadas</span>
          <div className="mt-1">
            <span className="text-3xl font-black text-slate-900">{stats.vacacionesAprobadas}</span>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">Próximas a iniciar</p>
          </div>
          <div className="absolute right-4 bottom-4 bg-blue-50 p-2 rounded-xl text-[#0066cc]">
            <Calendar size={16} />
          </div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-white p-5 rounded-2xl shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Asistencia Semanal vs Tardanzas</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={asistenciaSemanal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="Asistencia" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="Tardanzas" fill="#475569" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Distribución por Área</h3>
          <div className="h-52 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribucionAreas} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {distribucionAreas.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 text-[10px] text-slate-500 font-medium">
              {distribucionAreas.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full block" style={{ backgroundColor: COLORS[index] }}></span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TABLAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-2">
        <div className="bg-white p-5 rounded-2xl shadow-sm overflow-hidden">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Últimas Solicitudes de Vacaciones</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100">
                  <th className="py-2">Empleado</th>
                  <th className="py-2">Fechas</th>
                  <th className="py-2">Días</th>
                  <th className="py-2 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {vacacionesRecientes.map((v) => (
                  <tr key={v.id_vacacion} className="hover:bg-slate-50/50">
                    <td className="py-2.5 font-medium">{v.empleado?.nombre} {v.empleado?.apellido}</td>
                    <td className="py-2.5 text-slate-500">{v.fecha_inicio} - {v.fecha_fin}</td>
                    <td className="py-2.5 text-slate-500">{v.dias}d</td>
                    <td className="py-2.5 text-right">
                      <span className={estadoBadge(v.estado)}>{v.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm overflow-hidden">
          <h3 className="text-sm font-bold text-slate-900">Alertas de Tardanzas Recientes</h3>
          <p className="text-[11px] text-slate-400 mb-4">Tardanzas registradas hoy</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100">
                  <th className="py-2">Empleado</th>
                  <th className="py-2">Área</th>
                  <th className="py-2">Hora Entrada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tardanzasRecientes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400">Sin tardanzas hoy 🎉</td>
                  </tr>
                ) : (
                  tardanzasRecientes.map((t) => (
                    <tr key={t.id_asistencia} className="hover:bg-slate-50/50 text-slate-600">
                      <td className="py-2.5 flex items-center gap-2 font-medium text-slate-800">
                        <Flag size={14} className="text-red-500 fill-red-500 shrink-0" />
                        {t.empleado?.nombre} {t.empleado?.apellido}
                      </td>
                      <td className="py-2.5">{t.empleado?.area?.nombre_area}</td>
                      <td className="py-2.5 font-semibold text-slate-700">{t.hora_entrada}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}