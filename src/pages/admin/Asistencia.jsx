import React, { useState, useEffect } from 'react';
import { Search, LogIn, LogOut, Pencil, X } from 'lucide-react';
import { supabase } from '../../supabase/client';

const INPUT_BASE = "w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004bb4] focus:border-transparent transition-all text-sm bg-slate-50/50";

const ESTADO_BADGE = {
  presente:  'bg-green-50 text-green-600',
  tardanza:  'bg-orange-50 text-orange-500',
  ausente:   'bg-red-50 text-red-500',
};

function AvatarInicial({ nombre, apellido }) {
  const iniciales = `${nombre?.charAt(0) ?? ''}${apellido?.charAt(0) ?? ''}`.toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-[#004bb4] flex items-center justify-center text-white font-bold text-xs shrink-0">
      {iniciales}
    </div>
  );
}

function Modal({ titulo, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">{titulo}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

export default function Asistencia() {
  const [empleados, setEmpleados] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalEditar, setModalEditar] = useState(null);
  const [formEditar, setFormEditar] = useState({ hora_entrada: '', hora_salida: '', estado: '' });
  const [guardando, setGuardando] = useState(false);
  const hoy = new Date().toISOString().split('T')[0];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const [{ data: emps }, { data: asis }] = await Promise.all([
      supabase.from('empleado').select('*, area(nombre_area), cargo(nombre_cargo)').order('nombre'),
      supabase.from('asistencia').select('*').eq('fecha', hoy),
    ]);
    setEmpleados(emps || []);
    setAsistencias(asis || []);
    setLoading(false);
  };

  const getAsistencia = (id_empleado) =>
    asistencias.find(a => a.id_empleado === id_empleado) || null;

  const marcarEntrada = async (empleado) => {
    const yaRegistrado = getAsistencia(empleado.id_empleado);
    if (yaRegistrado) return;

    const horaActual = new Date().toTimeString().slice(0, 5);
    const horaLimite = '08:30';
    const estado = horaActual > horaLimite ? 'tardanza' : 'presente';

    await supabase.from('asistencia').insert({
      id_empleado: empleado.id_empleado,
      fecha: hoy,
      hora_entrada: horaActual,
      estado,
    });
    await cargarDatos();
  };

  const marcarSalida = async (empleado) => {
    const asistencia = getAsistencia(empleado.id_empleado);
    if (!asistencia || asistencia.hora_salida) return;

    const horaActual = new Date().toTimeString().slice(0, 5);
    await supabase.from('asistencia').update({ hora_salida: horaActual }).eq('id_asistencia', asistencia.id_asistencia);
    await cargarDatos();
  };

  const abrirEditar = (empleado) => {
    const asistencia = getAsistencia(empleado.id_empleado);
    if (!asistencia) return;
    setModalEditar(asistencia);
    setFormEditar({
      hora_entrada: asistencia.hora_entrada || '',
      hora_salida: asistencia.hora_salida || '',
      estado: asistencia.estado || 'presente',
    });
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setGuardando(true);
    await supabase.from('asistencia').update({
      hora_entrada: formEditar.hora_entrada,
      hora_salida: formEditar.hora_salida || null,
      estado: formEditar.estado,
    }).eq('id_asistencia', modalEditar.id_asistencia);
    await cargarDatos();
    setModalEditar(null);
    setGuardando(false);
  };

  const empleadosFiltrados = empleados.filter((e) => {
    const texto = busqueda.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(texto) ||
      e.apellido.toLowerCase().includes(texto) ||
      e.ci.toLowerCase().includes(texto) ||
      e.area?.nombre_area?.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <header className="bg-[#d0e3fc] rounded-2xl px-6 py-4 flex justify-between items-center shadow-sm">
        <h2 className="font-extrabold text-[#002d6b] tracking-wide text-sm uppercase">
          Registro y Control de Asistencia
        </h2>
        <span className="text-xs font-semibold text-[#002d6b]/80 bg-white/40 px-3 py-1 rounded-full">
          {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </header>

      {/* Buscador + Botones */}
      <div className="bg-white rounded-2xl px-6 py-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar empleado por nombre, CI o área..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004bb4] focus:border-transparent transition-all text-sm bg-slate-50/50"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-blue-50 text-[#004bb4] text-xs font-semibold px-4 py-2.5 rounded-xl">
            <span>🟢</span>
            <span>Marcar Entrada</span>
          </div>
          <div className="flex items-center gap-1.5 bg-red-50 text-red-500 text-xs font-semibold px-4 py-2.5 rounded-xl">
            <span>🔴</span>
            <span>Marcar Salida</span>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#004bb4] font-semibold animate-pulse">Cargando asistencias...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3">Empleado</th>
                  <th className="px-5 py-3">CI</th>
                  <th className="px-5 py-3">Área</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Hora Entrada</th>
                  <th className="px-5 py-3">Hora Salida</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {empleadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">No se encontraron empleados</td>
                  </tr>
                ) : (
                  empleadosFiltrados.map((emp) => {
                    const asis = getAsistencia(emp.id_empleado);
                    return (
                      <tr key={emp.id_empleado} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <AvatarInicial nombre={emp.nombre} apellido={emp.apellido} />
                            <span className="font-semibold text-slate-800">{emp.nombre} {emp.apellido}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{emp.ci}</td>
                        <td className="px-5 py-3 text-slate-500">{emp.area?.nombre_area}</td>
                        <td className="px-5 py-3 text-slate-500">{hoy}</td>
                        <td className="px-5 py-3 font-semibold text-slate-700">{asis?.hora_entrada ?? '—'}</td>
                        <td className="px-5 py-3 font-semibold text-slate-700">{asis?.hora_salida ?? '—'}</td>
                        <td className="px-5 py-3">
                          {asis ? (
                            <span className={`${ESTADO_BADGE[asis.estado] ?? 'bg-slate-50 text-slate-500'} px-2 py-0.5 rounded-md font-bold text-[10px] capitalize`}>
                              {asis.estado}
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md font-bold text-[10px]">Sin registro</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-center gap-2">
                            {/* Marcar Entrada */}
                            <button
                              onClick={() => marcarEntrada(emp)}
                              disabled={!!asis}
                              title="Marcar Entrada"
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-50 text-[#004bb4] hover:bg-blue-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-semibold"
                            >
                              <LogIn size={12} /> Entrada
                            </button>
                            {/* Marcar Salida */}
                            <button
                              onClick={() => marcarSalida(emp)}
                              disabled={!asis || !!asis?.hora_salida}
                              title="Marcar Salida"
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-semibold"
                            >
                              <LogOut size={12} /> Salida
                            </button>
                            {/* Editar */}
                            <button
                              onClick={() => abrirEditar(emp)}
                              disabled={!asis}
                              title="Editar registro"
                              className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Pencil size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Editar */}
      {modalEditar && (
        <Modal titulo="Editar Registro de Asistencia" onClose={() => setModalEditar(null)}>
          <form onSubmit={handleGuardarEdicion} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hora Entrada</label>
              <input
                type="time"
                value={formEditar.hora_entrada}
                onChange={(e) => setFormEditar({ ...formEditar, hora_entrada: e.target.value })}
                className={INPUT_BASE}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hora Salida</label>
              <input
                type="time"
                value={formEditar.hora_salida}
                onChange={(e) => setFormEditar({ ...formEditar, hora_salida: e.target.value })}
                className={INPUT_BASE}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
              <select
                value={formEditar.estado}
                onChange={(e) => setFormEditar({ ...formEditar, estado: e.target.value })}
                className={INPUT_BASE}
              >
                <option value="presente">Presente</option>
                <option value="tardanza">Tardanza</option>
                <option value="ausente">Ausente</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalEditar(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={guardando} className="px-4 py-2 text-sm font-semibold bg-[#004bb4] hover:bg-[#003785] text-white rounded-xl transition-all disabled:opacity-60">
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}