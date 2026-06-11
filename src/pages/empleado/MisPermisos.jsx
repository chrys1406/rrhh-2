import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../supabase/client';

const INPUT_BASE = "w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004bb4] focus:border-transparent transition-all text-sm bg-slate-50/50";

const ESTADO_BADGE = {
  pendiente: 'bg-orange-50 text-orange-500',
  aprobado: 'bg-green-50 text-green-600',
  rechazado: 'bg-red-50 text-red-500',
};

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

export default function MisPermisos() {
  const [empleado, setEmpleado] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fecha_inicio: '', fecha_fin: '', motivo: '' });
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const { data: emp } = await supabase
      .from('empleado').select('*')
      .eq('id_usuario', usuario.id).single();
    if (!emp) { setLoading(false); return; }
    setEmpleado(emp);
    const { data } = await supabase
      .from('permiso').select('*')
      .eq('id_empleado', emp.id_empleado)
      .order('fecha_inicio', { ascending: false });
    setPermisos(data || []);
    setLoading(false);
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm({ fecha_inicio: '', fecha_fin: '', motivo: '' });
    setError('');
    setModalAbierto(true);
  };

  const abrirEditar = (permiso) => {
    setEditando(permiso);
    setForm({
      fecha_inicio: permiso.fecha_inicio,
      fecha_fin: permiso.fecha_fin,
      motivo: permiso.motivo,
    });
    setError('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
    setForm({ fecha_inicio: '', fecha_fin: '', motivo: '' });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError('');

    if (form.fecha_fin < form.fecha_inicio) {
      setError('La fecha fin no puede ser menor a la fecha inicio.');
      setGuardando(false);
      return;
    }

    if (editando) {
      const { error: err } = await supabase
        .from('permiso')
        .update({
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin,
          motivo: form.motivo,
        })
        .eq('id_permiso', editando.id_permiso);
      if (err) { setError('Error al actualizar la solicitud.'); setGuardando(false); return; }
    } else {
      const { error: err } = await supabase.from('permiso').insert({
        id_empleado: empleado.id_empleado,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        motivo: form.motivo,
        estado: 'pendiente',
      });
      if (err) { setError('Error al enviar la solicitud.'); setGuardando(false); return; }
    }

    await cargarDatos();
    cerrarModal();
    setGuardando(false);
  };

  const handleEliminar = async () => {
    await supabase.from('permiso').delete().eq('id_permiso', modalEliminar.id_permiso);
    setModalEliminar(null);
    await cargarDatos();
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-[#004bb4] font-semibold text-lg animate-pulse">Cargando...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <header className="bg-[#d0e3fc] rounded-2xl px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-[#002d6b]" />
          <h2 className="font-extrabold text-[#002d6b] tracking-wide text-sm uppercase">
            Mis Permisos
          </h2>
        </div>
        <span className="text-xs font-semibold text-[#002d6b]/80 bg-white/40 px-3 py-1 rounded-full">
          {permisos.length} solicitudes
        </span>
      </header>

      {/* Botón solicitar */}
      <div className="bg-white rounded-2xl px-6 py-4 shadow-sm flex justify-between items-center">
        <div>
          <p className="text-sm font-bold text-slate-800">Solicitar un permiso</p>
          <p className="text-xs text-slate-400 mt-0.5">Solo puedes editar o eliminar solicitudes pendientes</p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 bg-[#004bb4] hover:bg-[#003785] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} /> Nueva Solicitud
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Historial de Solicitudes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3">Fecha Inicio</th>
                <th className="px-5 py-3">Fecha Fin</th>
                <th className="px-5 py-3">Motivo</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {permisos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No tienes solicitudes de permiso aún
                  </td>
                </tr>
              ) : (
                permisos.map((p) => (
                  <tr key={p.id_permiso} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-slate-700 font-medium">{p.fecha_inicio}</td>
                    <td className="px-5 py-3 text-slate-500">{p.fecha_fin}</td>
                    <td className="px-5 py-3 text-slate-500 max-w-[200px] truncate">{p.motivo}</td>
                    <td className="px-5 py-3">
                      <span className={`${ESTADO_BADGE[p.estado] ?? 'bg-slate-50 text-slate-500'} px-2 py-0.5 rounded-md font-bold text-[10px] capitalize`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {p.estado === 'pendiente' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirEditar(p)}
                            className="p-1.5 rounded-lg bg-blue-50 text-[#004bb4] hover:bg-blue-100 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setModalEliminar(p)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {modalAbierto && (
        <Modal
          titulo={editando ? 'Editar Solicitud' : 'Nueva Solicitud de Permiso'}
          onClose={cerrarModal}
        >
          <form onSubmit={handleGuardar} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                className={INPUT_BASE}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Fin</label>
              <input
                type="date"
                value={form.fecha_fin}
                onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                className={INPUT_BASE}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Motivo</label>
              <textarea
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                className={`${INPUT_BASE} resize-none`}
                rows={3}
                placeholder="Describe el motivo de tu permiso..."
                required
              />
            </div>
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={cerrarModal}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={guardando}
                className="px-4 py-2 text-sm font-semibold bg-[#004bb4] hover:bg-[#003785] text-white rounded-xl transition-all disabled:opacity-60">
                {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Eliminar */}
      {modalEliminar && (
        <Modal titulo="Eliminar Solicitud" onClose={() => setModalEliminar(null)}>
          <p className="text-sm text-slate-600 mb-6">
            ¿Estás seguro de eliminar esta solicitud de permiso? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModalEliminar(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
              Cancelar
            </button>
            <button onClick={handleEliminar}
              className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all">
              Eliminar
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}