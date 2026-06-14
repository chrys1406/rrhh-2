import React, { useState, useEffect } from "react";
import { Calendar, Plus, X, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../../supabase/client";

const INPUT_BASE =
  "w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004bb4] focus:border-transparent transition-all text-sm bg-slate-50/50";

const ESTADO_BADGE = {
  pendiente: "bg-orange-50 text-orange-500",
  aprobado: "bg-green-50 text-green-600",
  rechazado: "bg-red-50 text-red-500",
};

function Modal({ titulo, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">{titulo}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

const calcularDias = (inicio, fin) => {
  if (!inicio || !fin) return 0;
  const d1 = new Date(inicio);
  const d2 = new Date(fin);
  const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
};

export default function MisVacaciones() {
  const [empleado, setEmpleado] = useState(null);
  const [vacaciones, setVacaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fecha_inicio: "", fecha_fin: "" });
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const { data: emp } = await supabase
      .from("empleado")
      .select("*")
      .eq("id_usuario", usuario.id)
      .single();
    if (!emp) {
      setLoading(false);
      return;
    }
    setEmpleado(emp);
    const { data } = await supabase
      .from("vacacion")
      .select("*")
      .eq("id_empleado", emp.id_empleado)
      .order("fecha_inicio", { ascending: false });
    setVacaciones(data || []);
    setLoading(false);
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm({ fecha_inicio: "", fecha_fin: "" });
    setError("");
    setModalAbierto(true);
  };

  const abrirEditar = (vacacion) => {
    setEditando(vacacion);
    setForm({
      fecha_inicio: vacacion.fecha_inicio,
      fecha_fin: vacacion.fecha_fin,
    });
    setError("");
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
    setForm({ fecha_inicio: "", fecha_fin: "" });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError("");

    if (form.fecha_fin < form.fecha_inicio) {
      setError("La fecha fin no puede ser menor a la fecha inicio.");
      setGuardando(false);
      return;
    }

    const dias = calcularDias(form.fecha_inicio, form.fecha_fin);

    if (editando) {
      const { error: err } = await supabase
        .from("vacacion")
        .update({
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin,
          dias,
        })
        .eq("id_vacacion", editando.id_vacacion);
      if (err) {
        setError("Error al actualizar la solicitud.");
        setGuardando(false);
        return;
      }
    } else {
      const { error: err } = await supabase.from("vacacion").insert({
        id_empleado: empleado.id_empleado,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        dias,
        estado: "pendiente",
      });
      if (err) {
        setError("Error al enviar la solicitud.");
        setGuardando(false);
        return;
      }
    }

    await cargarDatos();
    cerrarModal();
    setGuardando(false);
  };

  const handleEliminar = async () => {
    await supabase
      .from("vacacion")
      .delete()
      .eq("id_vacacion", modalEliminar.id_vacacion);
    setModalEliminar(null);
    await cargarDatos();
  };

  const dias = calcularDias(form.fecha_inicio, form.fecha_fin);

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#004bb4] font-semibold text-lg animate-pulse">
          Cargando...
        </p>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <header className="bg-[#d0e3fc] rounded-2xl px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-[#002d6b]" />
          <h2 className="font-extrabold text-[#002d6b] tracking-wide text-sm uppercase">
            Mis Vacaciones
          </h2>
        </div>
        <span className="text-xs font-semibold text-[#002d6b]/80 bg-white/40 px-3 py-1 rounded-full shrink-0">
          {vacaciones.length} solicitudes
        </span>
      </header>

      {/* Botón solicitar */}
      <div className="bg-white rounded-2xl px-6 py-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="text-sm font-bold text-slate-800">
            Solicitar vacaciones
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Solo puedes editar o eliminar solicitudes pendientes
          </p>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center justify-center gap-2 bg-[#004bb4] hover:bg-[#003785] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 w-full sm:w-auto"
        >
          <Plus size={16} /> Nueva Solicitud
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Historial de Vacaciones
          </h3>
        </div>

        {vacaciones.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            No tienes solicitudes de vacaciones aún
          </div>
        ) : (
          <>
            {/* Tabla desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3">Fecha Inicio</th>
                    <th className="px-5 py-3">Fecha Fin</th>
                    <th className="px-5 py-3">Días</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vacaciones.map((v) => (
                    <tr
                      key={v.id_vacacion}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-slate-700 font-medium">
                        {v.fecha_inicio}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {v.fecha_fin}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-slate-800">
                          {v.dias} días
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`${ESTADO_BADGE[v.estado] ?? "bg-slate-50 text-slate-500"} px-2 py-0.5 rounded-md font-bold text-[10px] capitalize`}
                        >
                          {v.estado}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {v.estado === "pendiente" && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => abrirEditar(v)}
                              className="p-1.5 rounded-lg bg-blue-50 text-[#004bb4] hover:bg-blue-100 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setModalEliminar(v)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards móvil */}
            <div className="sm:hidden divide-y divide-slate-50">
              {vacaciones.map((v) => (
                <div
                  key={v.id_vacacion}
                  className="px-5 py-3 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {v.fecha_inicio} → {v.fecha_fin}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 font-bold">
                        {v.dias} días
                      </p>
                    </div>
                    <span
                      className={`${ESTADO_BADGE[v.estado] ?? "bg-slate-50 text-slate-500"} px-2 py-0.5 rounded-md font-bold text-[10px] capitalize shrink-0`}
                    >
                      {v.estado}
                    </span>
                  </div>
                  {v.estado === "pendiente" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => abrirEditar(v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#004bb4] text-xs font-semibold"
                      >
                        <Pencil size={12} /> Editar
                      </button>
                      <button
                        onClick={() => setModalEliminar(v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-semibold"
                      >
                        <Trash2 size={12} /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {modalAbierto && (
        <Modal
          titulo={
            editando ? "Editar Solicitud" : "Nueva Solicitud de Vacaciones"
          }
          onClose={cerrarModal}
        >
          <form onSubmit={handleGuardar} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) =>
                  setForm({ ...form, fecha_inicio: e.target.value })
                }
                className={INPUT_BASE}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={form.fecha_fin}
                onChange={(e) =>
                  setForm({ ...form, fecha_fin: e.target.value })
                }
                className={INPUT_BASE}
                required
              />
            </div>

            {/* Preview días */}
            {dias > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <p className="text-xs text-[#004bb4] font-semibold">
                  📅 Total de días solicitados:{" "}
                  <span className="text-lg font-black">{dias}</span>
                </p>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={cerrarModal}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || dias === 0}
                className="px-4 py-2 text-sm font-semibold bg-[#004bb4] hover:bg-[#003785] text-white rounded-xl transition-all disabled:opacity-60"
              >
                {guardando
                  ? "Guardando..."
                  : editando
                    ? "Actualizar"
                    : "Enviar Solicitud"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Eliminar */}
      {modalEliminar && (
        <Modal
          titulo="Eliminar Solicitud"
          onClose={() => setModalEliminar(null)}
        >
          <p className="text-sm text-slate-600 mb-6">
            ¿Estás seguro de eliminar esta solicitud de vacaciones? Esta acción
            no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setModalEliminar(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleEliminar}
              className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all"
            >
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
