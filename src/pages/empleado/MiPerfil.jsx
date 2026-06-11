import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase/client";
import {
  Camera,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  User,
  Edit2,
  X,
} from "lucide-react";

export default function MiPerfil() {
  const [empleado, setEmpleado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState("");
  const [error, setError] = useState("");

  const [formPass, setFormPass] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  const [telefono, setTelefono] = useState("");
  const [editandoTel, setEditandoTel] = useState(false);
  const [guardandoTel, setGuardandoTel] = useState(false);
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("empleado")
      .select("*, area:id_area(nombre_area), cargo:id_cargo(nombre_cargo)")
      .eq("id_usuario", usuario.id)
      .single();
    setEmpleado(data);
    setTelefono(data?.telefono || "");
    setLoading(false);
  };

  const calcularAntiguedad = (fechaIngreso) => {
    if (!fechaIngreso) return "—";
    const años =
      (new Date() - new Date(fechaIngreso)) / (1000 * 60 * 60 * 24 * 365.25);
    const a = Math.floor(años);
    const m = Math.floor((años - a) * 12);
    if (a === 0) return `${m} mes${m !== 1 ? "es" : ""}`;
    return `${a} año${a !== 1 ? "s" : ""} ${m > 0 ? `y ${m} mes${m !== 1 ? "es" : ""}` : ""}`;
  };

  const subirFoto = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    if (archivo.size > 2 * 1024 * 1024) {
      setError("La imagen no debe superar 2MB.");
      return;
    }
    setSubiendo(true);
    setError("");

    const ext = archivo.name.split(".").pop();
    const nombreArchivo = `empleado-${empleado.id_empleado}.${ext}`;

    const { error: errUp } = await supabase.storage
      .from("fotos-empleados")
      .upload(nombreArchivo, archivo, { upsert: true });

    if (errUp) {
      setError("Error al subir la foto.");
      setSubiendo(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("fotos-empleados")
      .getPublicUrl(nombreArchivo);

    const fotoUrl = urlData.publicUrl + "?t=" + Date.now();

    await supabase
      .from("empleado")
      .update({ foto_url: fotoUrl })
      .eq("id_empleado", empleado.id_empleado);
    setEmpleado({ ...empleado, foto_url: fotoUrl });
    setExito("Foto actualizada correctamente");
    setTimeout(() => setExito(""), 3000);
    setSubiendo(false);
  };

  const cambiarPassword = async () => {
    setError("");
    setExito("");
    if (!formPass.actual || !formPass.nueva || !formPass.confirmar) {
      setError("Completa todos los campos.");
      return;
    }
    if (formPass.nueva.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (formPass.nueva !== formPass.confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setGuardando(true);

    const { data } = await supabase
      .from("usuario")
      .select("id_usuario")
      .eq("usuario", usuario.usuario)
      .eq("contrasena", formPass.actual)
      .single();

    if (!data) {
      setError("La contraseña actual es incorrecta.");
      setGuardando(false);
      return;
    }

    const { error: err } = await supabase
      .from("usuario")
      .update({ contrasena: formPass.nueva })
      .eq("id_usuario", data.id_usuario);

    if (err) {
      setError("Error al actualizar la contraseña.");
    } else {
      setExito("Contraseña actualizada correctamente");
      setFormPass({ actual: "", nueva: "", confirmar: "" });
      setTimeout(() => setExito(""), 3000);
    }
    setGuardando(false);
  };
  const guardarTelefono = async () => {
    setGuardandoTel(true);
    const { error: err } = await supabase
      .from("empleado")
      .update({ telefono })
      .eq("id_empleado", empleado.id_empleado);
    if (err) {
      setError("Error al actualizar el teléfono.");
    } else {
      setEmpleado({ ...empleado, telefono });
      setEditandoTel(false);
      setExito("Teléfono actualizado correctamente");
      setTimeout(() => setExito(""), 3000);
    }
    setGuardandoTel(false);
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#004bb4] font-semibold text-lg animate-pulse">
          Cargando perfil...
        </p>
      </div>
    );

  const ini =
    `${empleado?.nombre?.charAt(0)}${empleado?.apellido?.charAt(0)}`.toUpperCase();

  return (
    <>
      {/* HEADER */}
      <header className="bg-[#d0e3fc] rounded-2xl px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="font-extrabold text-[#002d6b] tracking-wide text-sm uppercase">
            Mi Perfil
          </h2>
          <p className="text-xs text-[#002d6b]/60 mt-0.5">
            Tu información personal y configuración de cuenta
          </p>
        </div>
        <span className="text-xs font-semibold text-[#002d6b]/80 bg-white/40 px-3 py-1 rounded-full">
          {new Date().toLocaleDateString("es-BO", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* COLUMNA IZQUIERDA — foto + info básica */}
        <div className="flex flex-col gap-4">
          {/* foto */}
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center gap-4">
            <div className="relative">
              {empleado?.foto_url ? (
                <img
                  src={empleado.foto_url}
                  alt="Foto de perfil"
                  className="w-28 h-28 rounded-full object-cover border-4 border-[#d0e3fc] shadow"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-[#eef4fc] border-4 border-[#d0e3fc] flex items-center justify-center shadow">
                  <span className="text-3xl font-black text-[#004bb4]">
                    {ini}
                  </span>
                </div>
              )}
              {/* botón cambiar foto */}
              <label
                className={`absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#004bb4] hover:bg-[#003a8c] flex items-center justify-center cursor-pointer shadow-md transition-colors ${subiendo ? "opacity-60 pointer-events-none" : ""}`}
              >
                <Camera size={15} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={subirFoto}
                  className="hidden"
                />
              </label>
            </div>

            {subiendo && (
              <p className="text-xs text-[#004bb4] animate-pulse font-medium">
                Subiendo foto...
              </p>
            )}

            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-base">
                {empleado?.nombre} {empleado?.apellido}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {empleado?.cargo?.nombre_cargo}
              </p>
              <span className="inline-block mt-2 bg-[#eef4fc] text-[#004bb4] text-[10px] font-bold px-3 py-1 rounded-full border border-[#004bb4]/20">
                {empleado?.area?.nombre_area}
              </span>
            </div>

            <div className="w-full border-t border-slate-100 pt-4 space-y-2">
              {[
                { label: "CI", value: empleado?.ci },
                { label: "Ingreso", value: empleado?.fecha_ingreso },
                {
                  label: "Antigüedad",
                  value: calcularAntiguedad(empleado?.fecha_ingreso),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center"
                >
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    {item.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {item.value}
                  </span>
                </div>
              ))}

              {/* teléfono editable — fuera del map */}
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                  Teléfono
                </span>
                {editandoTel ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-28 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4]"
                    />
                    <button
                      onClick={guardarTelefono}
                      disabled={guardandoTel}
                      className="p-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => {
                        setEditandoTel(false);
                        setTelefono(empleado?.telefono || "");
                      }}
                      className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      {empleado?.telefono || "—"}
                    </span>
                    <button
                      onClick={() => setEditandoTel(true)}
                      className="p-1 rounded-lg text-slate-300 hover:text-[#004bb4] hover:bg-[#eef4fc] transition-colors"
                    >
                      <Edit2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* usuario */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <User size={15} className="text-[#004bb4]" />
              <h4 className="text-sm font-bold text-slate-900">Cuenta</h4>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Usuario
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {usuario.usuario}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Rol
              </span>
              <span className="text-xs font-bold bg-[#eef4fc] text-[#004bb4] px-2 py-0.5 rounded-md capitalize">
                {usuario.rol}
              </span>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA — cambiar contraseña */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <KeyRound size={15} className="text-[#004bb4]" />
              <h4 className="text-sm font-bold text-slate-900">
                Cambiar Contraseña
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* actual */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Contraseña actual
                </label>
                <div className="relative">
                  <input
                    type={verActual ? "text" : "password"}
                    value={formPass.actual}
                    onChange={(e) =>
                      setFormPass({ ...formPass, actual: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
                    placeholder="Tu contraseña actual"
                  />
                  <button
                    onClick={() => setVerActual(!verActual)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {verActual ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* nueva */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={verNueva ? "text" : "password"}
                    value={formPass.nueva}
                    onChange={(e) =>
                      setFormPass({ ...formPass, nueva: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    onClick={() => setVerNueva(!verNueva)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {verNueva ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* confirmar */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={verConfirmar ? "text" : "password"}
                    value={formPass.confirmar}
                    onChange={(e) =>
                      setFormPass({ ...formPass, confirmar: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
                    placeholder="Repite la nueva contraseña"
                  />
                  <button
                    onClick={() => setVerConfirmar(!verConfirmar)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {verConfirmar ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* indicador fortaleza */}
            {formPass.nueva && (
              <div className="mt-3">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        formPass.nueva.length >= n * 3
                          ? n <= 1
                            ? "bg-red-400"
                            : n <= 2
                              ? "bg-amber-400"
                              : n <= 3
                                ? "bg-blue-400"
                                : "bg-green-400"
                          : "bg-slate-100"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  {formPass.nueva.length < 4
                    ? "Muy débil"
                    : formPass.nueva.length < 7
                      ? "Débil"
                      : formPass.nueva.length < 10
                        ? "Buena"
                        : "Fuerte"}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-4 py-2.5 rounded-xl">
                <AlertCircle size={13} /> {error}
              </div>
            )}
            {exito && (
              <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-4 py-2.5 rounded-xl">
                <Check size={13} /> {exito}
              </div>
            )}

            <div className="flex justify-end mt-5">
              <button
                onClick={cambiarPassword}
                disabled={guardando}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#004bb4] hover:bg-[#003a8c] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                <KeyRound size={15} />
                {guardando ? "Guardando..." : "Cambiar Contraseña"}
              </button>
            </div>
          </div>

          {/* info adicional */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h4 className="text-sm font-bold text-slate-900 mb-4">
              Información del Puesto
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Área", value: empleado?.area?.nombre_area },
                { label: "Cargo", value: empleado?.cargo?.nombre_cargo },
                { label: "Fecha de ingreso", value: empleado?.fecha_ingreso },
                {
                  label: "Antigüedad",
                  value: calcularAntiguedad(empleado?.fecha_ingreso),
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
        </div>
      </div>
    </>
  );
}
