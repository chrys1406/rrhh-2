import React, { useState, useEffect } from 'react';
import {
  Users, Calendar, ChevronLeft, ChevronRight,
  TrendingUp, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { supabase } from '../../supabase/client';

const calcularAntiguedad = (fechaIngreso) => {
  const hoy = new Date();
  const ingreso = new Date(fechaIngreso);
  const años = (hoy - ingreso) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.floor(años * 10) / 10;
};

const calcularDiasCorresponden = (fechaIngreso) => {
  const años = calcularAntiguedad(fechaIngreso);
  if (años >= 10) return 30;
  if (años >= 5)  return 20;
  if (años >= 1)  return 15;
  return 0;
};

const colorAvatar = (str) => {
  const colores = [
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-cyan-100 text-cyan-700',
    'bg-sky-100 text-sky-700',
    'bg-violet-100 text-violet-700',
  ];
  let hash = 0;
  for (let c of (str || '')) hash += c.charCodeAt(0);
  return colores[hash % colores.length];
};

const COLORES_CALENDARIO = [
  'bg-blue-400', 'bg-indigo-400', 'bg-cyan-500',
  'bg-violet-400', 'bg-sky-400', 'bg-teal-400',
];

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function Vacaciones() {
  const [empleados, setEmpleados]     = useState([]);
  const [vacaciones, setVacaciones]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [mesActual, setMesActual]     = useState(new Date().getMonth());
  const [añoActual, setAñoActual]     = useState(new Date().getFullYear());

  useEffect(() => { cargarTodo(); }, []);

  const cargarTodo = async () => {
    setLoading(true);
    const [{ data: emps }, { data: vacs }] = await Promise.all([
      supabase.from('empleado').select('*, area:id_area(nombre_area), cargo:id_cargo(nombre_cargo)'),
      supabase.from('vacacion').select('*').eq('estado', 'aprobado'),
    ]);
    setEmpleados(emps || []);
    setVacaciones(vacs || []);
    setLoading(false);
  };

  // días usados en el año actual por empleado
  const diasUsados = (idEmpleado) =>
    vacaciones
      .filter(v =>
        v.id_empleado === idEmpleado &&
        new Date(v.fecha_inicio).getFullYear() === añoActual
      )
      .reduce((acc, v) => acc + v.dias, 0);

  // stats generales
  const totalEmpleadosConDerecho = empleados.filter(e => calcularAntiguedad(e.fecha_ingreso) >= 1).length;
  const totalEnVacacionesHoy = vacaciones.filter(v => {
    const hoy = new Date().toISOString().split('T')[0];
    return v.fecha_inicio <= hoy && v.fecha_fin >= hoy;
  }).length;
  const totalDiasUsadosAño = vacaciones
    .filter(v => new Date(v.fecha_inicio).getFullYear() === añoActual)
    .reduce((acc, v) => acc + v.dias, 0);
  const empleadosSinUsar = empleados.filter(e => {
    const corresponden = calcularDiasCorresponden(e.fecha_ingreso);
    return corresponden > 0 && diasUsados(e.id_empleado) === 0;
  }).length;

  // calendario
  const diasEnMes = new Date(añoActual, mesActual + 1, 0).getDate();
  const primerDia = new Date(añoActual, mesActual, 1).getDay();
  const diasCalendario = Array.from({ length: diasEnMes }, (_, i) => i + 1);

  const vacacionesDelMes = vacaciones.filter(v => {
    const ini = new Date(v.fecha_inicio);
    const fin = new Date(v.fecha_fin);
    const mesIni = new Date(añoActual, mesActual, 1);
    const mesFin = new Date(añoActual, mesActual + 1, 0);
    return ini <= mesFin && fin >= mesIni;
  });

  // asignar color a cada empleado en el calendario
  const colorPorEmpleado = {};
  vacacionesDelMes.forEach((v, i) => {
    if (!colorPorEmpleado[v.id_empleado]) {
      colorPorEmpleado[v.id_empleado] = COLORES_CALENDARIO[i % COLORES_CALENDARIO.length];
    }
  });

  const estaDeVacaciones = (dia) =>
    vacacionesDelMes.filter(v => {
      const fecha = new Date(añoActual, mesActual, dia).toISOString().split('T')[0];
      return v.fecha_inicio <= fecha && v.fecha_fin >= fecha;
    });

  const mesAnterior = () => {
    if (mesActual === 0) { setMesActual(11); setAñoActual(a => a - 1); }
    else setMesActual(m => m - 1);
  };
  const mesSiguiente = () => {
    if (mesActual === 11) { setMesActual(0); setAñoActual(a => a + 1); }
    else setMesActual(m => m + 1);
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-[#004bb4] font-semibold text-lg animate-pulse">Cargando vacaciones...</p>
    </div>
  );

  return (
    <>
      {/* HEADER */}
      <header className="bg-[#d0e3fc] rounded-2xl px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="font-extrabold text-[#002d6b] tracking-wide text-sm uppercase">
            Control de Vacaciones
          </h2>
          <p className="text-xs text-[#002d6b]/60 mt-0.5">
            Antigüedad · Días disponibles · Calendario
          </p>
        </div>
        <span className="text-xs font-semibold text-[#002d6b]/80 bg-white/40 px-3 py-1 rounded-full">
          {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </header>

      {/* TARJETAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Con derecho a vacación', value: totalEmpleadosConDerecho, color: 'text-[#0066cc]', bg: 'bg-blue-50', icon: <Users size={15} /> },
          { label: 'De vacaciones hoy', value: totalEnVacacionesHoy, color: 'text-cyan-600', bg: 'bg-cyan-50', icon: <Calendar size={15} /> },
          { label: `Días usados ${añoActual}`, value: totalDiasUsadosAño, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <CheckCircle size={15} /> },
          { label: 'Sin usar vacación', value: empleadosSinUsar, color: 'text-amber-600', bg: 'bg-amber-50', icon: <AlertCircle size={15} /> },
        ].map((c) => (
          <div key={c.label} className="bg-white p-4 rounded-2xl shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">{c.label}</span>
              <span className={`${c.bg} ${c.color} p-1.5 rounded-lg`}>{c.icon}</span>
            </div>
            <span className={`text-3xl font-black ${c.color}`}>{c.value}</span>
          </div>
        ))}
      </div>

      {/* TABLA CONTROL + CALENDARIO */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">

        {/* TABLA EMPLEADOS — ocupa 3 columnas */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Control de Días por Empleado</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Según antigüedad — Ley boliviana</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 bg-slate-50/50">
                  <th className="py-3 px-5">Empleado</th>
                  <th className="py-3 px-3 text-center">Antigüedad</th>
                  <th className="py-3 px-3 text-center">Corresponde</th>
                  <th className="py-3 px-3 text-center">Usados</th>
                  <th className="py-3 px-3 text-center">Disponibles</th>
                  <th className="py-3 px-5">Progreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {empleados.map((e) => {
                  const antiguedad   = calcularAntiguedad(e.fecha_ingreso);
                  const corresponden = calcularDiasCorresponden(e.fecha_ingreso);
                  const usados       = diasUsados(e.id_empleado);
                  const disponibles  = Math.max(corresponden - usados, 0);
                  const pct          = corresponden > 0 ? Math.round((usados / corresponden) * 100) : 0;
                  const ini          = `${e.nombre?.charAt(0)}${e.apellido?.charAt(0)}`.toUpperCase();
                  const avatarColor  = colorAvatar(ini);

                  return (
                    <tr key={e.id_empleado} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-[10px] font-bold shrink-0`}>
                            {ini}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{e.nombre} {e.apellido}</p>
                            <p className="text-[10px] text-slate-400">{e.area?.nombre_area}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {corresponden === 0 ? (
                          <span className="text-slate-300 italic text-[10px]">Sin derecho</span>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-slate-700">{antiguedad.toFixed(1)} años</span>
                            <span className="text-[10px] text-slate-400">
                              {antiguedad >= 10 ? '+10 años' : antiguedad >= 5 ? '5-10 años' : '1-5 años'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-[#eef4fc] text-[#004bb4] px-2 py-0.5 rounded-md font-bold">
                          {corresponden}d
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold ${
                          usados > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {usados}d
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold ${
                          disponibles === 0 && corresponden > 0
                            ? 'bg-red-50 text-red-500'
                            : disponibles > 0
                            ? 'bg-green-50 text-green-700'
                            : 'bg-slate-50 text-slate-400'
                        }`}>
                          {disponibles}d
                        </span>
                      </td>
                      <td className="py-3 px-5 min-w-[100px]">
                        {corresponden > 0 ? (
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>{pct}% usado</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 100 ? 'bg-red-400' : pct >= 70 ? 'bg-amber-400' : 'bg-[#0066cc]'
                                }`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* leyenda */}
          <div className="px-6 py-3 border-t border-slate-100 flex gap-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0066cc] inline-block"/> 1-5 años → 15 días</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block"/> 5-10 años → 20 días</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500 inline-block"/> +10 años → 30 días</span>
          </div>
        </div>

        {/* CALENDARIO — ocupa 2 columnas */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* nav mes */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <button onClick={mesAnterior} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
              <ChevronLeft size={16} />
            </button>
            <h3 className="text-sm font-bold text-slate-900">
              {MESES[mesActual]} {añoActual}
            </h3>
            <button onClick={mesSiguiente} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* días de semana */}
          <div className="grid grid-cols-7 px-4 pt-3 pb-1">
            {['D','L','M','X','J','V','S'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400">{d}</div>
            ))}
          </div>

          {/* grid días */}
          <div className="grid grid-cols-7 gap-y-1 px-4 pb-4 flex-1">
            {/* espacios vacíos antes del día 1 */}
            {Array.from({ length: primerDia }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {diasCalendario.map(dia => {
              const hoy = new Date();
              const esHoy = dia === hoy.getDate() && mesActual === hoy.getMonth() && añoActual === hoy.getFullYear();
              const vacsDelDia = estaDeVacaciones(dia);

              return (
                <div key={dia} className="flex flex-col items-center py-0.5 relative group">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                    esHoy
                      ? 'bg-[#004bb4] text-white'
                      : vacsDelDia.length > 0
                      ? 'text-slate-700'
                      : 'text-slate-500'
                  }`}>
                    {dia}
                  </span>
                  {/* puntos de empleados de vacaciones */}
                  {vacsDelDia.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {vacsDelDia.slice(0, 3).map(v => (
                        <span
                          key={v.id_vacacion}
                          className={`w-1.5 h-1.5 rounded-full ${colorPorEmpleado[v.id_empleado] || 'bg-blue-400'}`}
                        />
                      ))}
                      {vacsDelDia.length > 3 && (
                        <span className="text-[8px] text-slate-400 font-bold">+{vacsDelDia.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* leyenda empleados en el mes */}
          {vacacionesDelMes.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">De vacaciones este mes</p>
              <div className="flex flex-col gap-1.5">
                {vacacionesDelMes.map(v => {
                  const emp = empleados.find(e => e.id_empleado === v.id_empleado);
                  if (!emp) return null;
                  return (
                    <div key={v.id_vacacion} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${colorPorEmpleado[v.id_empleado]}`} />
                      <span className="text-[11px] font-medium text-slate-700">
                        {emp.nombre} {emp.apellido}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-auto">
                        {v.fecha_inicio} → {v.fecha_fin}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {vacacionesDelMes.length === 0 && (
            <div className="border-t border-slate-100 px-5 py-4 text-center text-[11px] text-slate-400">
              Sin vacaciones programadas este mes
            </div>
          )}
        </div>
      </div>
    </>
  );
}