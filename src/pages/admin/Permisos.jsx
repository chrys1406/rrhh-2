import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  Clock,
  ChevronDown,
  AlertCircle,
  FileText,
  Calendar,
} from "lucide-react";
import { supabase } from "../../supabase/client";

const TIPO_OPTIONS = ["permiso", "vacacion"];

const estadoBadge = (estado) => {
  const map = {
    aprobado: "bg-green-50 text-green-700 border border-green-200",
    pendiente: "bg-amber-50 text-amber-700 border border-amber-200",
    rechazado: "bg-red-50 text-red-600 border border-red-200",
  };
  return `${map[estado] || "bg-slate-50 text-slate-500"} px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide`;
};

const EstadoIcon = ({ estado }) => {
  if (estado === "aprobado")
    return <Check size={12} className="text-green-600" />;
  if (estado === "pendiente")
    return <Clock size={12} className="text-amber-500" />;
  if (estado === "rechazado") return <X size={12} className="text-red-500" />;
  return null;
};

const iniciales = (nombre, apellido) =>
  `${nombre?.charAt(0) || ""}${apellido?.charAt(0) || ""}`.toUpperCase();

const colorAvatar = (str) => {
  const colores = [
    "bg-blue-100 text-blue-700",
    "bg-indigo-100 text-indigo-700",
    "bg-cyan-100 text-cyan-700",
    "bg-sky-100 text-sky-700",
    "bg-violet-100 text-violet-700",
  ];
  let hash = 0;
  for (let c of str || "") hash += c.charCodeAt(0);
  return colores[hash % colores.length];
};

const FORM_INICIAL = {
  id_empleado: "",
  tipo: "permiso",
  fecha_inicio: "",
  fecha_fin: "",
  motivo: "",
  estado: "pendiente",
};

export default function Permisos() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ ...FORM_INICIAL });
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [modalEliminar, setModalEliminar] = useState(null); // guarda la solicitud a eliminar

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    setLoading(true);
    await Promise.all([cargarEmpleados(), cargarSolicitudes()]);
    setLoading(false);
  };

  const cargarEmpleados = async () => {
    const { data } = await supabase
      .from("empleado")
      .select("id_empleado, nombre, apellido, area:id_area(nombre_area)");
    setEmpleados(data || []);
  };

  const cargarSolicitudes = async () => {
    const [{ data: permisos }, { data: vacaciones }] = await Promise.all([
      supabase
        .from("permiso")
        .select("*, empleado(nombre, apellido, area:id_area(nombre_area))")
        .order("fecha_inicio", { ascending: false }),
      supabase
        .from("vacacion")
        .select("*, empleado(nombre, apellido, area:id_area(nombre_area))")
        .order("fecha_inicio", { ascending: false }),
    ]);

    const lista = [
      ...(permisos || []).map((p) => ({
        ...p,
        tipo: "permiso",
        _id: `p-${p.id_permiso}`,
      })),
      ...(vacaciones || []).map((v) => ({
        ...v,
        tipo: "vacacion",
        _id: `v-${v.id_vacacion}`,
      })),
    ].sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio));

    setSolicitudes(lista);
  };

  const calcularDias = (inicio, fin) => {
    if (!inicio || !fin) return 0;
    const d = (new Date(fin) - new Date(inicio)) / (1000 * 60 * 60 * 24) + 1;
    return d > 0 ? d : 0;
  };

  const solicitudesFiltradas = solicitudes.filter((s) => {
    const nombre =
      `${s.empleado?.nombre} ${s.empleado?.apellido}`.toLowerCase();
    const matchBusqueda = nombre.includes(busqueda.toLowerCase());
    const matchTipo = filtroTipo === "todos" || s.tipo === filtroTipo;
    const matchEstado = filtroEstado === "todos" || s.estado === filtroEstado;
    return matchBusqueda && matchTipo && matchEstado;
  });

  const abrirNuevo = () => {
    setForm({ ...FORM_INICIAL });
    setEditando(null);
    setError("");
    setMostrarForm(true);
  };

  const abrirEditar = (s) => {
    setForm({
      id_empleado: s.id_empleado,
      tipo: s.tipo,
      fecha_inicio: s.fecha_inicio,
      fecha_fin: s.fecha_fin,
      motivo: s.motivo || "", // vacacion no tiene motivo, default ''
      estado: s.estado,
    });
    setEditando(s);
    setError("");
    setMostrarForm(true);
  };

  const cerrarForm = () => {
    setMostrarForm(false);
    setEditando(null);
    setForm({ ...FORM_INICIAL });
    setError("");
  };

  const guardar = async () => {
    const motivoTrimmed = (form.motivo || "").trim();

    // vacacion no requiere motivo, permiso sí
    if (!form.id_empleado || !form.fecha_inicio || !form.fecha_fin) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    if (form.tipo === "permiso" && !motivoTrimmed) {
      setError("El motivo es obligatorio para permisos.");
      return;
    }
    if (new Date(form.fecha_fin) < new Date(form.fecha_inicio)) {
      setError("La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }

    setGuardando(true);
    setError("");

    const dias = calcularDias(form.fecha_inicio, form.fecha_fin);
    const tabla = form.tipo === "permiso" ? "permiso" : "vacacion";

    // payload diferente según tabla — vacacion NO tiene columna motivo
    const payload =
      form.tipo === "permiso"
        ? {
            id_empleado: parseInt(form.id_empleado),
            fecha_inicio: form.fecha_inicio,
            fecha_fin: form.fecha_fin,
            motivo: motivoTrimmed,
            estado: form.estado,
          }
        : {
            id_empleado: parseInt(form.id_empleado),
            fecha_inicio: form.fecha_inicio,
            fecha_fin: form.fecha_fin,
            dias,
            estado: form.estado,
          };

    let err;
    if (editando) {
      const tipoCambio = editando.tipo !== form.tipo;
      if (tipoCambio) {
        const tablaVieja = editando.tipo === "permiso" ? "permiso" : "vacacion";
        const campoViejo =
          editando.tipo === "permiso" ? "id_permiso" : "id_vacacion";
        const idViejo =
          editando.tipo === "permiso"
            ? editando.id_permiso
            : editando.id_vacacion;
        const { error: errDel } = await supabase
          .from(tablaVieja)
          .delete()
          .eq(campoViejo, idViejo);
        if (errDel) {
          setError("Error al convertir la solicitud.");
          setGuardando(false);
          return;
        }
        ({ error: err } = await supabase.from(tabla).insert(payload));
      } else {
        const idCampo = form.tipo === "permiso" ? "id_permiso" : "id_vacacion";
        const idValor =
          editando.tipo === "permiso"
            ? editando.id_permiso
            : editando.id_vacacion;
        ({ error: err } = await supabase
          .from(tabla)
          .update(payload)
          .eq(idCampo, idValor));
      }
    } else {
      ({ error: err } = await supabase.from(tabla).insert(payload));
    }

    if (err) {
      setError("Error al guardar. Intenta nuevamente.");
      console.error(err);
    } else {
      await cargarSolicitudes();
      cerrarForm();
    }
    setGuardando(false);
  };

  const confirmarEliminar = async () => {
    if (!modalEliminar) return;
    const s = modalEliminar;
    const tabla = s.tipo === "permiso" ? "permiso" : "vacacion";
    const campo = s.tipo === "permiso" ? "id_permiso" : "id_vacacion";
    const id = s.tipo === "permiso" ? s.id_permiso : s.id_vacacion;
    await supabase.from(tabla).delete().eq(campo, id);
    setModalEliminar(null);
    await cargarSolicitudes();
  };

  const cambiarEstado = async (s, nuevoEstado) => {
    const tabla = s.tipo === "permiso" ? "permiso" : "vacacion";
    const campo = s.tipo === "permiso" ? "id_permiso" : "id_vacacion";
    const id = s.tipo === "permiso" ? s.id_permiso : s.id_vacacion;
    await supabase.from(tabla).update({ estado: nuevoEstado }).eq(campo, id);
    await cargarSolicitudes();
  };

  const totalPendientes = solicitudes.filter(
    (s) => s.estado === "pendiente",
  ).length;

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#004bb4] font-semibold text-lg animate-pulse">
          Cargando permisos...
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
                  Eliminar solicitud
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 mb-5">
              ¿Estás seguro que deseas eliminar la solicitud de{" "}
              <span className="font-semibold text-slate-800">
                {modalEliminar.tipo === "permiso" ? "permiso" : "vacación"}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-slate-800">
                {modalEliminar.empleado?.nombre}{" "}
                {modalEliminar.empleado?.apellido}
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
            Administración de Permisos y Vacaciones
          </h2>
          <p className="text-xs text-[#002d6b]/60 mt-0.5">
            Gestiona las solicitudes del personal
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalPendientes > 0 && (
            <span className="flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200">
              <AlertCircle size={13} />
              {totalPendientes} pendiente{totalPendientes > 1 ? "s" : ""}
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

      {/* TARJETAS RESUMEN */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Total Solicitudes",
            value: solicitudes.length,
            color: "text-[#0066cc]",
            bg: "bg-blue-50",
            icon: <FileText size={15} />,
          },
          {
            label: "Pendientes",
            value: solicitudes.filter((s) => s.estado === "pendiente").length,
            color: "text-amber-600",
            bg: "bg-amber-50",
            icon: <Clock size={15} />,
          },
          {
            label: "Aprobadas",
            value: solicitudes.filter((s) => s.estado === "aprobado").length,
            color: "text-green-600",
            bg: "bg-green-50",
            icon: <Check size={15} />,
          },
          {
            label: "Rechazadas",
            value: solicitudes.filter((s) => s.estado === "rechazado").length,
            color: "text-red-500",
            bg: "bg-red-50",
            icon: <X size={15} />,
          },
          {
            label: "Vacaciones Activas",
            value: solicitudes.filter(
              (s) => s.tipo === "vacacion" && s.estado === "aprobado",
            ).length,
            color: "text-[#0066cc]",
            bg: "bg-blue-50",
            icon: <Calendar size={15} />,
          },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-white p-4 rounded-2xl shadow-sm flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                {c.label}
              </span>
              <span className={`${c.bg} ${c.color} p-1.5 rounded-lg`}>
                {c.icon}
              </span>
            </div>
            <span className={`text-3xl font-black ${c.color}`}>{c.value}</span>
          </div>
        ))}
      </div>

      {/* FORMULARIO */}
      {mostrarForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-[#eef4fc] px-6 py-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#002d6b]">
              {editando ? "Editar Solicitud" : "Nueva Solicitud"}
            </h3>
            <button
              onClick={cerrarForm}
              className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-500"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Empleado */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Empleado *
              </label>
              <div className="relative">
                <select
                  value={form.id_empleado}
                  onChange={(e) =>
                    setForm({ ...form, id_empleado: e.target.value })
                  }
                  disabled={!!editando}
                  className={`w-full appearance-none border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all ${
                    editando
                      ? "text-slate-400 cursor-not-allowed opacity-70"
                      : "text-slate-700"
                  }`}
                >
                  <option value="">Seleccionar empleado...</option>
                  {empleados.map((e) => (
                    <option key={e.id_empleado} value={e.id_empleado}>
                      {e.nombre} {e.apellido}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Tipo */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Tipo *
              </label>
              <div className="flex gap-2">
                {TIPO_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, tipo: t, motivo: "" })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all capitalize ${
                      form.tipo === t
                        ? "bg-[#004bb4] text-white border-[#004bb4]"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#004bb4]/50"
                    }`}
                  >
                    {t === "permiso" ? "📄 Permiso" : "🏖️ Vacación"}
                  </button>
                ))}
              </div>
            </div>

            {/* Estado */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Estado
              </label>
              <div className="relative">
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Fecha inicio */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Fecha Inicio *
              </label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) =>
                  setForm({ ...form, fecha_inicio: e.target.value })
                }
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
              />
            </div>

            {/* Fecha fin */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Fecha Fin *
              </label>
              <input
                type="date"
                value={form.fecha_fin}
                onChange={(e) =>
                  setForm({ ...form, fecha_fin: e.target.value })
                }
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
              />
            </div>

            {/* Días calculados */}
            {form.fecha_inicio && form.fecha_fin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Días
                </label>
                <div className="border border-[#004bb4]/30 bg-[#eef4fc] rounded-xl px-3 py-2.5 text-sm font-bold text-[#004bb4]">
                  {calcularDias(form.fecha_inicio, form.fecha_fin)} día(s)
                </div>
              </div>
            )}

            {/* Motivo — solo para permiso */}
            {form.tipo === "permiso" && (
              <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Motivo *
                </label>
                <textarea
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  rows={3}
                  placeholder="Describe el motivo del permiso..."
                  className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all resize-none"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="mx-6 mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-4 py-2.5 rounded-xl">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="px-6 pb-6 flex justify-end gap-3">
            <button
              onClick={cerrarForm}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#004bb4] hover:bg-[#003a8c] disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {guardando ? (
                <span className="animate-pulse">Guardando...</span>
              ) : (
                <>
                  <Check size={15} />
                  {editando ? "Actualizar" : "Registrar Solicitud"}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* HISTORIAL */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Historial de Solicitudes
          </h3>
          <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-52">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Buscar empleado..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/20 focus:border-[#004bb4] transition-all"
              />
            </div>
            <div className="relative">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/20 focus:border-[#004bb4] transition-all"
              >
                <option value="todos">Todos los tipos</option>
                <option value="permiso">Permiso</option>
                <option value="vacacion">Vacación</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
            <div className="relative">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/20 focus:border-[#004bb4] transition-all"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
            {!mostrarForm && (
              <button
                onClick={abrirNuevo}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#004bb4] hover:bg-[#003a8c] text-white text-xs font-bold rounded-xl transition-colors"
              >
                <Plus size={14} />
                Nueva
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-100 bg-slate-50/50">
                <th className="py-3 px-6">Empleado</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Fechas</th>
                <th className="py-3 px-4">Días</th>
                <th className="py-3 px-4">Motivo</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {solicitudesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={28} className="text-slate-300" />
                      <span className="font-medium">
                        Sin solicitudes encontradas
                      </span>
                      <span className="text-[11px]">
                        Prueba ajustando los filtros
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                solicitudesFiltradas.map((s) => {
                  const nombre = s.empleado?.nombre || "";
                  const apellido = s.empleado?.apellido || "";
                  const ini = iniciales(nombre, apellido);
                  const avatarColor = colorAvatar(ini);
                  const dias = calcularDias(s.fecha_inicio, s.fecha_fin);

                  return (
                    <tr
                      key={s._id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-[11px] font-bold shrink-0`}
                          >
                            {ini}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {nombre} {apellido}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {s.empleado?.area?.nombre_area}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                            s.tipo === "permiso"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              : "bg-cyan-50 text-cyan-700 border border-cyan-100"
                          }`}
                        >
                          {s.tipo === "permiso" ? "📄 Permiso" : "🏖️ Vacación"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700 font-medium">
                          {s.fecha_inicio}
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          → {s.fecha_fin}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-[#eef4fc] text-[#004bb4] px-2 py-0.5 rounded-md font-bold text-[11px]">
                          {dias}d
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[180px]">
                        <p className="text-slate-600 truncate" title={s.motivo}>
                          {s.motivo || (
                            <span className="text-slate-300 italic">—</span>
                          )}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <EstadoIcon estado={s.estado} />
                          <span className={estadoBadge(s.estado)}>
                            {s.estado}
                          </span>
                        </div>
                        {s.estado === "pendiente" && (
                          <div className="flex gap-1 mt-1.5">
                            <button
                              onClick={() => cambiarEstado(s, "aprobado")}
                              className="flex items-center gap-0.5 text-[10px] font-semibold text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 px-1.5 py-0.5 rounded-md transition-colors"
                            >
                              <Check size={10} /> Aprobar
                            </button>
                            <button
                              onClick={() => cambiarEstado(s, "rechazado")}
                              className="flex items-center gap-0.5 text-[10px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 px-1.5 py-0.5 rounded-md transition-colors"
                            >
                              <X size={10} /> Rechazar
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirEditar(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#004bb4] hover:bg-[#eef4fc] transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setModalEliminar(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
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

        {solicitudesFiltradas.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Mostrando{" "}
              <span className="font-semibold text-slate-600">
                {solicitudesFiltradas.length}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-slate-600">
                {solicitudes.length}
              </span>{" "}
              solicitudes
            </span>
            <div className="flex gap-3 text-[11px] text-slate-400">
              <span>
                📄{" "}
                {
                  solicitudesFiltradas.filter((s) => s.tipo === "permiso")
                    .length
                }{" "}
                permisos
              </span>
              <span>
                🏖️{" "}
                {
                  solicitudesFiltradas.filter((s) => s.tipo === "vacacion")
                    .length
                }{" "}
                vacaciones
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
