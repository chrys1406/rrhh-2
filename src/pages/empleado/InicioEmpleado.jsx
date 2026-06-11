import React, { useState, useEffect } from "react";
import {
  Clock,
  FileText,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Bell,
  Users,
  PartyPopper,
  Megaphone,
} from "lucide-react";
import { supabase } from "../../supabase/client";
import chatbotAnimation from "../../assets/Live_chatbot.json";

const TIPO_CONFIG = {
  general:    { label: "General",    color: "bg-blue-50 text-blue-700 border-blue-200",     icon: Bell },
  reunion:    { label: "Reunión",    color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: Users },
  feriado:    { label: "Feriado",    color: "bg-green-50 text-green-700 border-green-200",   icon: Calendar },
  cumpleanos: { label: "Cumpleaños", color: "bg-pink-50 text-pink-700 border-pink-200",      icon: PartyPopper },
  otro:       { label: "Otro",       color: "bg-slate-50 text-slate-600 border-slate-200",   icon: Megaphone },
};

function StatCard({ titulo, valor, subtitulo, icon: Icon, colorIcon, colorBg }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[100px]">
      <span className="text-xs font-bold text-slate-500">{titulo}</span>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-3xl font-black text-slate-900">{valor}</span>
      </div>
      {subtitulo && <p className="text-[10px] text-slate-400 mt-1 leading-tight">{subtitulo}</p>}
      <div className={`absolute right-4 bottom-4 ${colorBg} p-2 rounded-xl ${colorIcon}`}>
        <Icon size={16} />
      </div>
    </div>
  );
}

export default function InicioEmpleado() {
  const [empleado, setEmpleado]           = useState(null);
  const [stats, setStats]                 = useState({ asistenciasMes: 0, tardanzasMes: 0, permisosPendientes: 0, vacacionesPendientes: 0 });
  const [asistenciaHoy, setAsistenciaHoy] = useState(null);
  const [avisos, setAvisos]               = useState([]);
  const [loading, setLoading]             = useState(true);

  const usuario   = JSON.parse(localStorage.getItem("usuario") || "{}");
  const hoy       = new Date().toISOString().split("T")[0];
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const { data: emp } = await supabase
      .from("empleado")
      .select("*, area(nombre_area), cargo(nombre_cargo)")
      .eq("id_usuario", usuario.id)
      .single();

    if (!emp) { setLoading(false); return; }
    setEmpleado(emp);

    const [
      { count: asistenciasMes },
      { count: tardanzasMes },
      { count: permisosPendientes },
      { count: vacacionesPendientes },
      { data: asisHoy },
      { data: avisosData },
    ] = await Promise.all([
      supabase.from("asistencia").select("*", { count: "exact", head: true }).eq("id_empleado", emp.id_empleado).gte("fecha", inicioMes),
      supabase.from("asistencia").select("*", { count: "exact", head: true }).eq("id_empleado", emp.id_empleado).eq("estado", "tardanza").gte("fecha", inicioMes),
      supabase.from("permiso").select("*", { count: "exact", head: true }).eq("id_empleado", emp.id_empleado).eq("estado", "pendiente"),
      supabase.from("vacacion").select("*", { count: "exact", head: true }).eq("id_empleado", emp.id_empleado).eq("estado", "pendiente"),
      supabase.from("asistencia").select("*").eq("id_empleado", emp.id_empleado).eq("fecha", hoy).maybeSingle(),
      supabase.from("aviso").select("*").eq("activo", true).order("fecha_creacion", { ascending: false }),
    ]);

    setStats({ asistenciasMes, tardanzasMes, permisosPendientes, vacacionesPendientes });
    setAsistenciaHoy(asisHoy);
    setAvisos(avisosData || []);
    setLoading(false);
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-[#004bb4] font-semibold text-lg animate-pulse">Cargando...</p>
    </div>
  );

  return (
    <>
      {/* HEADER */}
      <header className="bg-[#d0e3fc] rounded-2xl px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="font-extrabold text-[#002d6b] tracking-wide text-sm uppercase">
            Bienvenido, {empleado?.nombre} {empleado?.apellido} 👋
          </h2>
          <p className="text-xs text-[#002d6b]/70 mt-0.5">
            {empleado?.cargo?.nombre_cargo} — {empleado?.area?.nombre_area}
          </p>
        </div>
        <span className="text-xs font-semibold text-[#002d6b]/80 bg-white/40 px-3 py-1 rounded-full">
          {new Date().toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" })}
        </span>
      </header>

      {/* ESTADO ASISTENCIA HOY */}
      <div className={`rounded-2xl px-6 py-4 shadow-sm flex items-center gap-4 ${
        !asistenciaHoy ? "bg-orange-50 border border-orange-100" :
        asistenciaHoy.hora_salida ? "bg-green-50 border border-green-100" :
        "bg-blue-50 border border-blue-100"
      }`}>
        <div className={`p-2 rounded-xl shrink-0 ${
          !asistenciaHoy ? "bg-orange-100 text-orange-500" :
          asistenciaHoy.hora_salida ? "bg-green-100 text-green-600" :
          "bg-blue-100 text-[#004bb4]"
        }`}>
          {!asistenciaHoy ? <AlertTriangle size={20} /> :
           asistenciaHoy.hora_salida ? <CheckCircle size={20} /> :
           <Clock size={20} />}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">
            {!asistenciaHoy ? "Aún no has marcado tu entrada hoy" :
             asistenciaHoy.hora_salida ? `Jornada completada — Entrada: ${asistenciaHoy.hora_entrada} / Salida: ${asistenciaHoy.hora_salida}` :
             `Entrada registrada a las ${asistenciaHoy.hora_entrada} — Pendiente marcar salida`}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {!asistenciaHoy ? "Ve a Mi Asistencia para registrarte" :
             asistenciaHoy.hora_salida ? "¡Buen trabajo hoy!" :
             "Recuerda marcar tu salida al terminar"}
          </p>
        </div>
      </div>

      {/* TARJETAS STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard titulo="Asistencias del Mes" valor={stats.asistenciasMes} subtitulo="Días registrados este mes" icon={CheckCircle} colorIcon="text-[#004bb4]" colorBg="bg-blue-50" />
        <StatCard titulo="Tardanzas del Mes" valor={stats.tardanzasMes} subtitulo="Llegadas tarde este mes" icon={AlertTriangle} colorIcon="text-orange-500" colorBg="bg-orange-50" />
        <StatCard titulo="Permisos Pendientes" valor={stats.permisosPendientes} subtitulo="Esperando aprobación" icon={FileText} colorIcon="text-cyan-600" colorBg="bg-cyan-50" />
        <StatCard titulo="Vacaciones Pendientes" valor={stats.vacacionesPendientes} subtitulo="Solicitudes en revisión" icon={Calendar} colorIcon="text-green-600" colorBg="bg-green-50" />
      </div>

      {/* AVISOS */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-2">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Avisos y Comunicados</h3>
            <p className="text-xs text-slate-400 mt-0.5">Novedades publicadas por RRHH</p>
          </div>
          {avisos.length > 0 && (
            <span className="flex items-center gap-1.5 bg-[#eef4fc] text-[#004bb4] text-xs font-bold px-3 py-1.5 rounded-full border border-[#004bb4]/20">
              <Bell size={12} />
              {avisos.length} nuevo{avisos.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* avisos primero */}
        {avisos.length > 0 && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {avisos.map((a) => {
              const config = TIPO_CONFIG[a.tipo] || TIPO_CONFIG.general;
              const Icon = config.icon;
              return (
                <div key={a.id_aviso} className="rounded-2xl border border-slate-100 p-4 flex flex-col gap-3 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg border shrink-0 ${config.color}`}>
                      <Icon size={13} />
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wide border px-2 py-0.5 rounded-md ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 leading-tight">{a.titulo}</h4>
                    {a.descripcion && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">{a.descripcion}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                    {a.fecha_evento ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#004bb4] bg-[#eef4fc] px-2 py-1 rounded-lg">
                        <Calendar size={10} />
                        {new Date(a.fecha_evento + "T00:00:00").toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300">—</span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(a.fecha_creacion).toLocaleDateString("es-BO", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* lottie siempre al fondo */}
        <div className="flex flex-col items-center justify-center pt-4 pb-6 gap-2">
          <div className="w-64 h-64">
            <lottie-player
              src={JSON.stringify(chatbotAnimation)}
              background="transparent"
              speed="1"
              loop
              autoplay
            />
          </div>
          {avisos.length === 0 && (
            <>
              <p className="text-sm font-semibold text-slate-500">Sin avisos por el momento</p>
              <p className="text-xs text-slate-400">Cuando RRHH publique un comunicado aparecerá aquí</p>
            </>
          )}
        </div>

      </div>
    </>
  );
}