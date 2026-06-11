import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  Megaphone,
  Calendar,
  Users,
  PartyPopper,
  Clock,
  Bell,
} from "lucide-react";
import { supabase } from "../../supabase/client";

const TIPOS = [
  {
    value: "general",
    label: "General",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Bell,
  },
  {
    value: "reunion",
    label: "Reunión",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Users,
  },
  {
    value: "feriado",
    label: "Feriado",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: Calendar,
  },
  {
    value: "cumpleanos",
    label: "Cumpleaños",
    color: "bg-pink-50 text-pink-700 border-pink-200",
    icon: PartyPopper,
  },
  {
    value: "otro",
    label: "Otro",
    color: "bg-slate-50 text-slate-600 border-slate-200",
    icon: Megaphone,
  },
];

const getTipo = (val) => TIPOS.find((t) => t.value === val) || TIPOS[0];

const FORM_INICIAL = {
  titulo: "",
  descripcion: "",
  tipo: "general",
  fecha_evento: "",
  activo: true,
};

export default function Avisos() {
  const [avisos, setAvisos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ ...FORM_INICIAL });
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [modalEliminar, setModalEliminar] = useState(null);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("aviso")
      .select("*")
      .order("fecha_creacion", { ascending: false });
    setAvisos(data || []);
    setLoading(false);
  };

  const avisosFiltrados = avisos.filter((a) =>
    filtro === "todos"
      ? true
      : filtro === "activos"
        ? a.activo
        : filtro === "inactivos"
          ? !a.activo
          : a.tipo === filtro,
  );

  const abrirNuevo = () => {
    setForm({ ...FORM_INICIAL });
    setEditando(null);
    setError("");
    setMostrarForm(true);
  };

  const abrirEditar = (a) => {
    setForm({
      titulo: a.titulo,
      descripcion: a.descripcion || "",
      tipo: a.tipo,
      fecha_evento: a.fecha_evento || "",
      activo: a.activo,
    });
    setEditando(a);
    setError("");
    setMostrarForm(true);
  };

  const cerrar = () => {
    setMostrarForm(false);
    setEditando(null);
    setForm({ ...FORM_INICIAL });
    setError("");
  };

  const guardar = async () => {
    if (!form.titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setGuardando(true);
    setError("");

    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      tipo: form.tipo,
      fecha_evento: form.fecha_evento || null,
      activo: form.activo,
    };

    let err;
    if (editando) {
      ({ error: err } = await supabase
        .from("aviso")
        .update(payload)
        .eq("id_aviso", editando.id_aviso));
    } else {
      ({ error: err } = await supabase.from("aviso").insert(payload));
    }

    if (err) {
      setError("Error al guardar.");
    } else {
      await cargar();
      cerrar();
    }
    setGuardando(false);
  };

  const toggleActivo = async (aviso) => {
    await supabase
      .from("aviso")
      .update({ activo: !aviso.activo })
      .eq("id_aviso", aviso.id_aviso);
    await cargar();
  };

  const confirmarEliminar = async () => {
    await supabase
      .from("aviso")
      .delete()
      .eq("id_aviso", modalEliminar.id_aviso);
    setModalEliminar(null);
    await cargar();
  };

  const totalActivos = avisos.filter((a) => a.activo).length;

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#004bb4] font-semibold text-lg animate-pulse">
          Cargando avisos...
        </p>
      </div>
    );

  return (
    <>
      {/* MODAL ELIMINAR */}
      {modalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Eliminar aviso
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 mb-5">
              ¿Eliminar el aviso{" "}
              <span className="font-semibold text-slate-800">
                "{modalEliminar.titulo}"
              </span>
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalEliminar(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-[#d0e3fc] rounded-2xl px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="font-extrabold text-[#002d6b] tracking-wide text-sm uppercase">
            Avisos y Comunicados
          </h2>
          <p className="text-xs text-[#002d6b]/60 mt-0.5">
            Publica anuncios visibles para todos los empleados
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalActivos > 0 && (
            <span className="flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200">
              <Bell size={12} />
              {totalActivos} activo{totalActivos > 1 ? "s" : ""}
            </span>
          )}
          <span className="text-xs font-semibold text-[#002d6b]/80 bg-white/40 px-3 py-1 rounded-full">
            {new Date().toLocaleDateString("es-BO", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </header>

      {/* TARJETAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TIPOS.map((t) => {
          const Icon = t.icon;
          const count = avisos.filter((a) => a.tipo === t.value).length;
          return (
            <div
              key={t.value}
              className="bg-white p-4 rounded-2xl shadow-sm flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {t.label}
                </span>
                <span className={`p-1.5 rounded-lg border ${t.color}`}>
                  <Icon size={13} />
                </span>
              </div>
              <span className="text-3xl font-black text-slate-900">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* FORMULARIO */}
      {mostrarForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-[#eef4fc] px-6 py-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#002d6b]">
              {editando ? "Editar Aviso" : "Nuevo Aviso"}
            </h3>
            <button
              onClick={cerrar}
              className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-500"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Título */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Título *
              </label>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej: Reunión general el viernes..."
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
              />
            </div>

            {/* Tipo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Tipo
              </label>
              <div className="relative">
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
                >
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Fecha evento */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Fecha del evento{" "}
                <span className="normal-case text-slate-400 font-normal">
                  (opcional)
                </span>
              </label>
              <input
                type="date"
                value={form.fecha_evento}
                onChange={(e) =>
                  setForm({ ...form, fecha_evento: e.target.value })
                }
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
              />
            </div>

            {/* Descripción */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Descripción{" "}
                <span className="normal-case text-slate-400 font-normal">
                  (opcional)
                </span>
              </label>
              <textarea
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
                rows={3}
                placeholder="Detalles adicionales del aviso..."
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all resize-none"
              />
            </div>

            {/* Toggle activo */}
            <div className="flex items-center gap-3 sm:col-span-2">
              <button
                onClick={() => setForm({ ...form, activo: !form.activo })}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${form.activo ? "bg-[#004bb4]" : "bg-slate-200"}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.activo ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </button>
              <span className="text-sm text-slate-600 font-medium">
                {form.activo
                  ? "Aviso activo — visible para empleados"
                  : "Aviso inactivo — no visible"}
              </span>
            </div>
          </div>

          {error && (
            <div className="mx-6 mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-4 py-2.5 rounded-xl">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="px-6 pb-6 flex justify-end gap-3">
            <button
              onClick={cerrar}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#004bb4] hover:bg-[#003a8c] disabled:opacity-60 transition-colors"
            >
              <Check size={15} />
              {guardando
                ? "Guardando..."
                : editando
                  ? "Actualizar"
                  : "Publicar Aviso"}
            </button>
          </div>
        </div>
      )}

      {/* LISTA */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Todos los Avisos</h3>
          <div className="flex flex-wrap gap-2 items-center">
            {/* filtros */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { value: "todos", label: "Todos" },
                { value: "activos", label: "Activos" },
                { value: "inactivos", label: "Inactivos" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFiltro(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filtro === f.value
                      ? "bg-white text-[#004bb4] shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {!mostrarForm && (
              <button
                onClick={abrirNuevo}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#004bb4] hover:bg-[#003a8c] text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Plus size={14} />
                Nuevo Aviso
              </button>
            )}
          </div>
        </div>

        {/* cards de avisos */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {avisosFiltrados.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3 py-10 flex flex-col items-center gap-2 text-slate-400">
              <Megaphone size={28} className="text-slate-300" />
              <p className="font-medium text-sm">Sin avisos para mostrar</p>
            </div>
          ) : (
            avisosFiltrados.map((a) => {
              const tipo = getTipo(a.tipo);
              const Icon = tipo.icon;
              return (
                <div
                  key={a.id_aviso}
                  className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
                    a.activo
                      ? "bg-white border-slate-100"
                      : "bg-slate-50 border-slate-100 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`p-1.5 rounded-lg border ${tipo.color} shrink-0`}
                      >
                        <Icon size={13} />
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide border px-2 py-0.5 rounded-md ${tipo.color}`}
                      >
                        {tipo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* toggle activo */}
                      <button
                        onClick={() => toggleActivo(a)}
                        className={`w-9 h-5 rounded-full transition-colors relative shrink-0 flex items-center px-0.5 ${a.activo ? "bg-[#004bb4]" : "bg-slate-200"}`}
                        title={a.activo ? "Desactivar" : "Activar"}
                      >
                        <span
                          className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${a.activo ? "translate-x-4" : "translate-x-0"}`}
                        />
                      </button>
                      <button
                        onClick={() => abrirEditar(a)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#004bb4] hover:bg-[#eef4fc] transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setModalEliminar(a)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800 leading-tight">
                      {a.titulo}
                    </h4>
                    {a.descripcion && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                        {a.descripcion}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                    {a.fecha_evento ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#004bb4] bg-[#eef4fc] px-2 py-1 rounded-lg">
                        <Calendar size={10} />
                        {new Date(
                          a.fecha_evento + "T00:00:00",
                        ).toLocaleDateString("es-BO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300">
                        Sin fecha de evento
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(a.fecha_creacion).toLocaleDateString("es-BO", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {avisosFiltrados.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              <span className="font-semibold text-slate-600">
                {avisosFiltrados.length}
              </span>{" "}
              aviso{avisosFiltrados.length !== 1 ? "s" : ""}
              {" · "}
              <span className="font-semibold text-green-600">
                {totalActivos} activo{totalActivos !== 1 ? "s" : ""}
              </span>
            </span>
          </div>
        )}
      </div>
    </>
  );
}
