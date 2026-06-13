import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  MessageSquare,
  Send,
} from "lucide-react";
import { supabase } from "../../supabase/client";

const INPUT_BASE =
  "w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004bb4] focus:border-transparent transition-all text-sm bg-slate-50/50";

const ESTADO_BADGE = {
  activo: "bg-green-50 text-green-600",
  inactivo: "bg-red-50 text-red-500",
};

function Modal({ titulo, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
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

function AvatarEmpleado({ nombre, apellido, foto_url }) {
  const iniciales =
    `${nombre?.charAt(0) ?? ""}${apellido?.charAt(0) ?? ""}`.toUpperCase();
  if (foto_url) {
    return (
      <img
        src={foto_url}
        alt={`${nombre} ${apellido}`}
        className="w-9 h-9 rounded-full object-cover shrink-0 border-2 border-[#d0e3fc]"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-[#004bb4] flex items-center justify-center text-white font-bold text-xs shrink-0">
      {iniciales}
    </div>
  );
}

const FORM_INICIAL = {
  nombre: "",
  apellido: "",
  ci: "",
  telefono: "",
  fecha_ingreso: "",
  id_area: "",
  id_cargo: "",
  estado: "activo",
};

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [areas, setAreas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [modalPerfil, setModalPerfil] = useState(null);

  const [mensajesChat, setMensajesChat] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const hoy = new Date().toISOString().split("T")[0];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const [{ data: emps }, { data: ars }, { data: cars }] = await Promise.all([
      supabase
        .from("empleado")
        .select("*, area(nombre_area), cargo(nombre_cargo), foto_url")
        .order("id_empleado"),
      supabase.from("area").select("*"),
      supabase.from("cargo").select("*"),
    ]);
    setEmpleados(emps || []);
    setAreas(ars || []);
    setCargos(cars || []);
    setLoading(false);
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setError("");
    setModalAbierto(true);
  };

  const abrirEditar = (emp) => {
    setEditando(emp.id_empleado);
    setForm({
      nombre: emp.nombre,
      apellido: emp.apellido,
      ci: emp.ci,
      telefono: emp.telefono,
      fecha_ingreso: emp.fecha_ingreso,
      id_area: emp.id_area,
      id_cargo: emp.id_cargo,
      estado: emp.estado ?? "activo",
    });
    setError("");
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
    setForm(FORM_INICIAL);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError("");

    const payload = {
      nombre: form.nombre,
      apellido: form.apellido,
      ci: form.ci,
      telefono: form.telefono,
      fecha_ingreso: form.fecha_ingreso,
      id_area: parseInt(form.id_area),
      id_cargo: parseInt(form.id_cargo),
      estado: form.estado,
    };

    if (editando) {
      // Solo actualizar datos del empleado
      const { error: err } = await supabase
        .from("empleado")
        .update(payload)
        .eq("id_empleado", editando);
      if (err) {
        setError("Error al actualizar empleado.");
        setGuardando(false);
        return;
      }
    } else {
      // 1. Crear usuario con rol empleado (id_rol = 2) y CI como contraseña
      const { data: nuevoUsuario, error: errUsuario } = await supabase
        .from("usuario")
        .insert({
          usuario: form.ci, // usuario = su CI
          contrasena: form.ci, // contraseña = su CI
          id_rol: 2, // rol empleado
        })
        .select()
        .single();

      if (errUsuario) {
        setError("Error al crear usuario del empleado.");
        setGuardando(false);
        return;
      }

      // 2. Crear empleado vinculado al usuario recién creado
      const { error: errEmp } = await supabase
        .from("empleado")
        .insert({ ...payload, id_usuario: nuevoUsuario.id_usuario });

      if (errEmp) {
        // Si falla, eliminar el usuario creado para no dejar basura
        await supabase
          .from("usuario")
          .delete()
          .eq("id_usuario", nuevoUsuario.id_usuario);
        setError("Error al registrar empleado.");
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
      .from("empleado")
      .delete()
      .eq("id_empleado", modalEliminar.id_empleado);
    setModalEliminar(null);
    await cargarDatos();
  };

  const empleadosFiltrados = empleados.filter((e) => {
    const texto = busqueda.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(texto) ||
      e.apellido.toLowerCase().includes(texto) ||
      e.ci.toLowerCase().includes(texto) ||
      e.area?.nombre_area?.toLowerCase().includes(texto) ||
      e.cargo?.nombre_cargo?.toLowerCase().includes(texto)
    );
  });

  const abrirPerfil = async (emp) => {
    setModalPerfil(emp);
    setNuevoMensaje("");
    // Cargar mensajes de hoy entre admin y este empleado
    const { data } = await supabase
      .from("mensaje")
      .select("*")
      .or(
        `and(id_remitente.eq.${usuario.id},id_destinatario.eq.${emp.id_usuario}),and(id_remitente.eq.${emp.id_usuario},id_destinatario.eq.${usuario.id})`,
      )
      .gte("created_at", `${hoy}T00:00:00`)
      .order("created_at", { ascending: true });
    setMensajesChat(data || []);
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !modalPerfil) return;
    setEnviando(true);
    await supabase.from("mensaje").insert({
      id_remitente: usuario.id,
      id_destinatario: modalPerfil.id_usuario,
      contenido: nuevoMensaje.trim(),
      leido: false,
    });
    setNuevoMensaje("");
    // Recargar mensajes
    const { data } = await supabase
      .from("mensaje")
      .select("*")
      .or(
        `and(id_remitente.eq.${usuario.id},id_destinatario.eq.${modalPerfil.id_usuario}),and(id_remitente.eq.${modalPerfil.id_usuario},id_destinatario.eq.${usuario.id})`,
      )
      .gte("created_at", `${hoy}T00:00:00`)
      .order("created_at", { ascending: true });
    setMensajesChat(data || []);
    setEnviando(false);
  };
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <header className="bg-[#d0e3fc] rounded-2xl px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-[#002d6b]" />
          <h2 className="font-extrabold text-[#002d6b] tracking-wide text-sm uppercase">
            Gestión de Empleados
          </h2>
        </div>
        <span className="text-xs font-semibold text-[#002d6b]/80 bg-white/40 px-3 py-1 rounded-full">
          {empleados.length} empleados
        </span>
      </header>

      {/* Buscador + Botón */}
      <div className="bg-white rounded-2xl px-6 py-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, CI, área o cargo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004bb4] focus:border-transparent transition-all text-sm bg-slate-50/50"
          />
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 bg-[#004bb4] hover:bg-[#003785] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 shrink-0"
        >
          <Plus size={16} />
          Registrar Empleado
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#004bb4] font-semibold animate-pulse">
            Cargando empleados...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3">Empleado</th>
                  <th className="px-5 py-3">CI</th>
                  <th className="px-5 py-3">Cargo</th>
                  <th className="px-5 py-3">Área</th>
                  <th className="px-5 py-3">Fecha Ingreso</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-center">Perfil</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {empleadosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-slate-400"
                    >
                      No se encontraron empleados
                    </td>
                  </tr>
                ) : (
                  empleadosFiltrados.map((emp) => (
                    <tr
                      key={emp.id_empleado}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <AvatarEmpleado
                            nombre={emp.nombre}
                            apellido={emp.apellido}
                            foto_url={emp.foto_url}
                          />
                          <span className="font-semibold text-slate-800">
                            {emp.nombre} {emp.apellido}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{emp.ci}</td>
                      <td className="px-5 py-3 text-slate-500">
                        {emp.cargo?.nombre_cargo}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {emp.area?.nombre_area}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {emp.fecha_ingreso}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`${ESTADO_BADGE[emp.estado] ?? "bg-slate-50 text-slate-500"} px-2 py-0.5 rounded-md font-bold text-[10px] capitalize`}
                        >
                          {emp.estado ?? "activo"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => abrirPerfil(emp)}
                          className="p-1.5 rounded-lg bg-[#eef4fc] text-[#004bb4] hover:bg-[#d0e3fc] transition-colors"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirEditar(emp)}
                            className="p-1.5 rounded-lg bg-blue-50 text-[#004bb4] hover:bg-blue-100 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setModalEliminar(emp)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {modalAbierto && (
        <Modal
          titulo={editando ? "Editar Empleado" : "Registrar Empleado"}
          onClose={cerrarModal}
        >
          <form onSubmit={handleGuardar} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre
                </label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  className={INPUT_BASE}
                  placeholder="Nombre"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apellido
                </label>
                <input
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  required
                  className={INPUT_BASE}
                  placeholder="Apellido"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CI
                </label>
                <input
                  name="ci"
                  value={form.ci}
                  onChange={handleChange}
                  required
                  className={INPUT_BASE}
                  placeholder="CI"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono
                </label>
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className={INPUT_BASE}
                  placeholder="Teléfono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de Ingreso
              </label>
              <input
                name="fecha_ingreso"
                type="date"
                value={form.fecha_ingreso}
                onChange={handleChange}
                required
                className={INPUT_BASE}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Área
                </label>
                <select
                  name="id_area"
                  value={form.id_area}
                  onChange={handleChange}
                  required
                  className={INPUT_BASE}
                >
                  <option value="">Seleccionar...</option>
                  {areas.map((a) => (
                    <option key={a.id_area} value={a.id_area}>
                      {a.nombre_area}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cargo
                </label>
                <select
                  name="id_cargo"
                  value={form.id_cargo}
                  onChange={handleChange}
                  required
                  className={INPUT_BASE}
                >
                  <option value="">Seleccionar...</option>
                  {cargos.map((c) => (
                    <option key={c.id_cargo} value={c.id_cargo}>
                      {c.nombre_cargo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado
              </label>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className={INPUT_BASE}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
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
                disabled={guardando}
                className="px-4 py-2 text-sm font-semibold bg-[#004bb4] hover:bg-[#003785] text-white rounded-xl transition-all disabled:opacity-60"
              >
                {guardando
                  ? "Guardando..."
                  : editando
                    ? "Actualizar"
                    : "Registrar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Eliminar */}
      {modalEliminar && (
        <Modal
          titulo="Eliminar Empleado"
          onClose={() => setModalEliminar(null)}
        >
          <p className="text-sm text-slate-600 mb-6">
            ¿Estás seguro de eliminar a{" "}
            <span className="font-bold text-slate-900">
              {modalEliminar.nombre} {modalEliminar.apellido}
            </span>
            ? Esta acción no se puede deshacer.
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
      {/* Modal Perfil */}
      {modalPerfil && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Perfil del Empleado
              </h3>
              <button
                onClick={() => setModalPerfil(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col sm:flex-row gap-6">
              {/* Columna izquierda: foto + nombre */}
              <div className="flex flex-col items-center gap-3 sm:w-48 shrink-0">
                {modalPerfil.foto_url ? (
                  <img
                    src={modalPerfil.foto_url}
                    alt="Foto empleado"
                    className="w-28 h-28 rounded-full object-cover border-4 border-[#d0e3fc] shadow"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-[#eef4fc] border-4 border-[#d0e3fc] flex items-center justify-center shadow">
                    <span className="text-3xl font-black text-[#004bb4]">
                      {`${modalPerfil.nombre?.charAt(0)}${modalPerfil.apellido?.charAt(0)}`.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <p className="font-bold text-slate-900 text-sm">
                    {modalPerfil.nombre} {modalPerfil.apellido}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {modalPerfil.cargo?.nombre_cargo}
                  </p>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded-md font-bold text-[10px] capitalize ${
                      modalPerfil.estado === "activo"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {modalPerfil.estado ?? "activo"}
                  </span>
                </div>
              </div>

              {/* Columna derecha: info */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                {[
                  { label: "CI", value: modalPerfil.ci },
                  { label: "Teléfono", value: modalPerfil.telefono ?? "—" },
                  { label: "Área", value: modalPerfil.area?.nombre_area },
                  { label: "Cargo", value: modalPerfil.cargo?.nombre_cargo },
                  {
                    label: "Fecha de Ingreso",
                    value: modalPerfil.fecha_ingreso,
                  },
                  {
                    label: "Antigüedad",
                    value: (() => {
                      if (!modalPerfil.fecha_ingreso) return "—";
                      const años =
                        (new Date() - new Date(modalPerfil.fecha_ingreso)) /
                        (1000 * 60 * 60 * 24 * 365.25);
                      const a = Math.floor(años);
                      const m = Math.floor((años - a) * 12);
                      if (a === 0) return `${m} mes${m !== 1 ? "es" : ""}`;
                      return `${a} año${a !== 1 ? "s" : ""} ${m > 0 ? `y ${m} mes${m !== 1 ? "es" : ""}` : ""}`;
                    })(),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-slate-50 rounded-xl px-4 py-3"
                  >
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat */}
            <div className="border-t border-slate-100">
              <div className="px-6 py-3 flex items-center gap-2 border-b border-slate-50">
                <MessageSquare size={14} className="text-[#004bb4]" />
                <p className="text-xs font-bold text-slate-700">Chat del día</p>
                <span className="text-[10px] text-slate-400 ml-auto">
                  ID: #{modalPerfil.id_empleado}
                </span>
              </div>

              {/* Mensajes */}
              <div className="px-6 py-3 flex flex-col gap-2 min-h-[150px] max-h-[200px] overflow-y-auto">
                {mensajesChat.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-1">
                    <MessageSquare size={24} className="text-slate-200" />
                    <p className="text-xs font-semibold text-slate-400">
                      Sin mensajes hoy
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Escribe un mensaje para iniciar
                    </p>
                  </div>
                ) : (
                  mensajesChat.map((m) => {
                    const esMio = m.id_remitente === usuario.id;
                    return (
                      <div
                        key={m.id_mensaje}
                        className={`flex ${esMio ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2 rounded-2xl text-xs ${
                            esMio
                              ? "bg-[#004bb4] text-white rounded-br-sm"
                              : "bg-slate-100 text-slate-800 rounded-bl-sm"
                          }`}
                        >
                          <p className="leading-relaxed">{m.contenido}</p>
                          <p
                            className={`text-[10px] mt-1 ${esMio ? "text-blue-200" : "text-slate-400"}`}
                          >
                            {new Date(m.created_at).toLocaleTimeString(
                              "es-BO",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              <div className="px-6 py-3 border-t border-slate-50 flex gap-2 items-center">
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
                  placeholder={`Mensaje para ${modalPerfil.nombre}...`}
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
                />
                <button
                  onClick={enviarMensaje}
                  disabled={!nuevoMensaje.trim() || enviando}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#004bb4] hover:bg-[#003785] disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all"
                >
                  <Send size={13} />
                  {enviando ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
