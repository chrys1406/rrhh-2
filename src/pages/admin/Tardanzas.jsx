import React, { useState, useEffect } from "react";
import { Clock, AlertTriangle, TrendingUp, User, Search } from "lucide-react";
import { supabase } from "../../supabase/client";

function AvatarInicial({ nombre, apellido }) {
  const iniciales =
    `${nombre?.charAt(0) ?? ""}${apellido?.charAt(0) ?? ""}`.toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-[#004bb4] flex items-center justify-center text-white font-bold text-xs shrink-0">
      {iniciales}
    </div>
  );
}

function StatCard({
  titulo,
  valor,
  subtitulo,
  icon: Icon,
  colorIcon,
  colorBg,
}) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
      <span className="text-xs font-bold text-slate-500">{titulo}</span>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-3xl font-black text-slate-900">{valor}</span>
      </div>
      {subtitulo && (
        <p className="text-[10px] text-slate-400 mt-1 leading-tight">
          {subtitulo}
        </p>
      )}
      <div
        className={`absolute right-4 bottom-4 ${colorBg} p-2 rounded-xl ${colorIcon}`}
      >
        <Icon size={16} />
      </div>
    </div>
  );
}

const calcularMinutosTarde = (hora_entrada) => {
  if (!hora_entrada) return 0;
  const [h, m] = hora_entrada.split(":").map(Number);
  const entradaMinutos = h * 60 + m;
  const limiteMinutos = 8 * 60 + 30; // 08:30
  return Math.max(0, entradaMinutos - limiteMinutos);
};

export default function Tardanzas() {
  const [tardanzas, setTardanzas] = useState([]);
  const [stats, setStats] = useState({
    hoy: 0,
    mes: 0,
    masTardanzas: "—",
    promedioMinutos: 0,
  });
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const hoy = new Date().toISOString().split("T")[0];
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const [fechaFiltro, setFechaFiltro] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [fechaFiltro]);

  const cargarDatos = async () => {
    setLoading(true);

    let query = supabase
      .from("asistencia")
      .select("*, empleado(nombre, apellido, area(nombre_area))")
      .eq("estado", "tardanza")
      .order("fecha", { ascending: false });

    if (fechaFiltro) {
      query = query.eq("fecha", fechaFiltro);
    } else {
      query = query.gte("fecha", inicioMes);
    }

    const { data } = await query;

    const todas = data || [];
    setTardanzas(todas);

    // Stats
    const tardanzasHoy = todas.filter((t) => t.fecha === hoy).length;
    const tardanzasMes = todas.length;

    // Empleado con más tardanzas
    const conteo = {};
    todas.forEach((t) => {
      const nombre = `${t.empleado?.nombre} ${t.empleado?.apellido}`;
      conteo[nombre] = (conteo[nombre] || 0) + 1;
    });
    const masTardanzas =
      Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    // Promedio minutos tarde
    const minutos = todas.map((t) => calcularMinutosTarde(t.hora_entrada));
    const promedio =
      minutos.length > 0
        ? Math.round(minutos.reduce((a, b) => a + b, 0) / minutos.length)
        : 0;

    setStats({
      hoy: tardanzasHoy,
      mes: tardanzasMes,
      masTardanzas,
      promedioMinutos: promedio,
    });

    setLoading(false);
  };

  const tardanzasFiltradas = tardanzas.filter((t) => {
    const texto = busqueda.toLowerCase();
    return (
      t.empleado?.nombre?.toLowerCase().includes(texto) ||
      t.empleado?.apellido?.toLowerCase().includes(texto) ||
      t.empleado?.area?.nombre_area?.toLowerCase().includes(texto)
    );
  });

  const getBadgeMinutos = (minutos) => {
    if (minutos <= 15) return "bg-yellow-50 text-yellow-600";
    if (minutos <= 30) return "bg-orange-50 text-orange-500";
    return "bg-red-50 text-red-500";
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <header className="bg-[#d0e3fc] rounded-2xl px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-[#002d6b]" />
          <h2 className="font-extrabold text-[#002d6b] tracking-wide text-sm uppercase">
            Control de Tardanzas
          </h2>
        </div>
        <span className="text-xs font-semibold text-[#002d6b]/80 bg-white/40 px-3 py-1 rounded-full">
          {new Date().toLocaleDateString("es-BO", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </span>
      </header>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          titulo="Tardanzas Hoy"
          valor={stats.hoy}
          subtitulo="Registradas el día de hoy"
          icon={AlertTriangle}
          colorIcon="text-orange-500"
          colorBg="bg-orange-50"
        />
        <StatCard
          titulo="Tardanzas del Mes"
          valor={stats.mes}
          subtitulo="Total acumulado del mes"
          icon={Clock}
          colorIcon="text-[#004bb4]"
          colorBg="bg-blue-50"
        />
        <StatCard
          titulo="Mayor Reincidencia"
          valor={stats.masTardanzas}
          subtitulo="Empleado con más tardanzas"
          icon={User}
          colorIcon="text-red-500"
          colorBg="bg-red-50"
        />
        <StatCard
          titulo="Promedio de Retraso"
          valor={`${stats.promedioMinutos} min`}
          subtitulo="Minutos promedio de retraso"
          icon={TrendingUp}
          colorIcon="text-cyan-600"
          colorBg="bg-cyan-50"
        />
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-2xl px-6 py-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Buscar por empleado o área..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004bb4] focus:border-transparent transition-all text-sm bg-slate-50/50"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Filtrar por fecha:
          </label>
          <input
            type="date"
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
          />
          {fechaFiltro && (
            <button
              onClick={() => setFechaFiltro("")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              ✕ Ver todo el mes
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-[#004bb4] font-semibold animate-pulse">
            Cargando tardanzas...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3">Empleado</th>
                  <th className="px-5 py-3">Área</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Hora Entrada</th>
                  <th className="px-5 py-3">Hora Límite</th>
                  <th className="px-5 py-3">Minutos Tarde</th>
                  <th className="px-5 py-3">Severidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tardanzasFiltradas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-slate-400"
                    >
                      🎉 Sin tardanzas registradas este mes
                    </td>
                  </tr>
                ) : (
                  tardanzasFiltradas.map((t) => {
                    const minutos = calcularMinutosTarde(t.hora_entrada);
                    return (
                      <tr
                        key={t.id_asistencia}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <AvatarInicial
                              nombre={t.empleado?.nombre}
                              apellido={t.empleado?.apellido}
                            />
                            <span className="font-semibold text-slate-800">
                              {t.empleado?.nombre} {t.empleado?.apellido}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {t.empleado?.area?.nombre_area}
                        </td>
                        <td className="px-5 py-3 text-slate-500">{t.fecha}</td>
                        <td className="px-5 py-3 font-semibold text-slate-700">
                          {t.hora_entrada}
                        </td>
                        <td className="px-5 py-3 text-slate-400">08:30</td>
                        <td className="px-5 py-3">
                          <span className="font-black text-slate-800">
                            +{minutos} min
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`${getBadgeMinutos(minutos)} px-2 py-0.5 rounded-md font-bold text-[10px]`}
                          >
                            {minutos <= 15
                              ? "Leve"
                              : minutos <= 30
                                ? "Moderada"
                                : "Grave"}
                          </span>
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
    </div>
  );
}
