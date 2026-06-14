import React, { useState, useEffect } from "react";
import { Clock, LogIn, LogOut, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "../../supabase/client";

const ESTADO_BADGE = {
  presente: "bg-green-50 text-green-600",
  tardanza: "bg-orange-50 text-orange-500",
  ausente: "bg-red-50 text-red-500",
};

export default function MiAsistencia() {
  const [empleado, setEmpleado] = useState(null);
  const [asistencias, setAsistencias] = useState([]);
  const [asistenciaHoy, setAsistenciaHoy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marcando, setMarcando] = useState(false);
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  const hoy = new Date().toISOString().split("T")[0];
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  console.log("Usuario del localStorage:", usuario);
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

    const [{ data: asis }, { data: hoyData }] = await Promise.all([
      supabase
        .from("asistencia")
        .select("*")
        .eq("id_empleado", emp.id_empleado)
        .gte("fecha", inicioMes)
        .order("fecha", { ascending: false }),
      supabase
        .from("asistencia")
        .select("*")
        .eq("id_empleado", emp.id_empleado)
        .eq("fecha", hoy)
        .maybeSingle(),
    ]);

    setAsistencias(asis || []);
    setAsistenciaHoy(hoyData);
    setLoading(false);
  };

  const marcarEntrada = async () => {
    if (!empleado || asistenciaHoy) return;
    setMarcando(true);
    const horaActual = new Date().toTimeString().slice(0, 5);
    const estado = horaActual > "08:30" ? "tardanza" : "presente";
    await supabase.from("asistencia").insert({
      id_empleado: empleado.id_empleado,
      fecha: hoy,
      hora_entrada: horaActual,
      estado,
    });
    await cargarDatos();
    setMarcando(false);
  };

  const marcarSalida = async () => {
    if (!asistenciaHoy || asistenciaHoy.hora_salida) return;
    setMarcando(true);
    const horaActual = new Date().toTimeString().slice(0, 5);
    await supabase
      .from("asistencia")
      .update({ hora_salida: horaActual })
      .eq("id_asistencia", asistenciaHoy.id_asistencia);
    await cargarDatos();
    setMarcando(false);
  };

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
          <Clock size={18} className="text-[#002d6b]" />
          <h2 className="font-extrabold text-[#002d6b] tracking-wide text-sm uppercase">
            Mi Asistencia
          </h2>
        </div>
        <span className="text-xs font-semibold text-[#002d6b]/80 bg-white/40 px-3 py-1 rounded-full shrink-0">
          {new Date().toLocaleDateString("es-BO", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </span>
      </header>

      {/* Panel marcar asistencia */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          Registro del Día
        </h3>
        <div className="flex flex-col gap-4">
          {/* Estado actual */}
          <div
            className={`rounded-xl px-5 py-4 flex items-center gap-3 ${
              !asistenciaHoy
                ? "bg-orange-50 border border-orange-100"
                : asistenciaHoy.hora_salida
                  ? "bg-green-50 border border-green-100"
                  : "bg-blue-50 border border-blue-100"
            }`}
          >
            <div
              className={`p-2 rounded-xl ${
                !asistenciaHoy
                  ? "bg-orange-100 text-orange-500"
                  : asistenciaHoy.hora_salida
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-[#004bb4]"
              }`}
            >
              {!asistenciaHoy ? (
                <AlertTriangle size={20} />
              ) : asistenciaHoy.hora_salida ? (
                <CheckCircle size={20} />
              ) : (
                <Clock size={20} />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {!asistenciaHoy
                  ? "Sin registro hoy"
                  : asistenciaHoy.hora_salida
                    ? `Entrada: ${asistenciaHoy.hora_entrada} / Salida: ${asistenciaHoy.hora_salida}`
                    : `Entrada: ${asistenciaHoy.hora_entrada} / Salida pendiente`}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {!asistenciaHoy
                  ? "Marca tu entrada para comenzar"
                  : asistenciaHoy.hora_salida
                    ? "¡Jornada completada!"
                    : "Recuerda marcar tu salida"}
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={marcarEntrada}
              disabled={!!asistenciaHoy || marcando}
              className="flex-1 flex items-center justify-center gap-2 bg-[#004bb4] hover:bg-[#003785] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
              <LogIn size={16} /> Marcar Entrada
            </button>
            <button
              onClick={marcarSalida}
              disabled={
                !asistenciaHoy || !!asistenciaHoy?.hora_salida || marcando
              }
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all shadow-lg shadow-red-500/20"
            >
              <LogOut size={16} /> Marcar Salida
            </button>
          </div>
        </div>
      </div>

      {/* Historial del mes */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Historial del Mes
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {asistencias.length} registros este mes
          </p>
        </div>

        {asistencias.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            Sin registros este mes
          </div>
        ) : (
          <>
            {/* Tabla desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3">Fecha</th>
                    <th className="px-5 py-3">Hora Entrada</th>
                    <th className="px-5 py-3">Hora Salida</th>
                    <th className="px-5 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {asistencias.map((a) => (
                    <tr
                      key={a.id_asistencia}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-slate-700">
                        {a.fecha}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {a.hora_entrada ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {a.hora_salida ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`${ESTADO_BADGE[a.estado] ?? "bg-slate-50 text-slate-500"} px-2 py-0.5 rounded-md font-bold text-[10px] capitalize`}
                        >
                          {a.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards móvil */}
            <div className="sm:hidden divide-y divide-slate-50">
              {asistencias.map((a) => (
                <div
                  key={a.id_asistencia}
                  className="px-5 py-3 flex flex-col gap-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700 text-sm">
                      {a.fecha}
                    </span>
                    <span
                      className={`${ESTADO_BADGE[a.estado] ?? "bg-slate-50 text-slate-500"} px-2 py-0.5 rounded-md font-bold text-[10px] capitalize`}
                    >
                      {a.estado}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>
                      Entrada:{" "}
                      <span className="font-semibold text-slate-700">
                        {a.hora_entrada ?? "—"}
                      </span>
                    </span>
                    <span>
                      Salida:{" "}
                      <span className="font-semibold text-slate-700">
                        {a.hora_salida ?? "—"}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
