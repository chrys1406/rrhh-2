import React, { useState, useEffect } from "react";
import {Search,Filter,Download,Users,Calendar,CalendarCheck,FileText,ChevronDown,BarChart3,Clock,Check,X,AlertCircle,} from "lucide-react";
import { supabase } from "../../supabase/client";
import { generarPDFAsistencia } from "../../reports/pdfAsistencia";
import { generarPDFPermisos } from "../../reports/pdfPermisos";
import { generarPDFVacaciones } from "../../reports/pdfVacaciones";
import { exportarExcel } from "../../reports/exportExcel";

const estadoBadge = (estado) => {
  const map = {
    aprobado: "bg-green-50 text-green-700 border border-green-200",
    pendiente: "bg-amber-50 text-amber-700 border border-amber-200",
    rechazado: "bg-red-50 text-red-600 border border-red-200",
    puntual: "bg-blue-50 text-blue-700 border border-blue-200",
    tardanza: "bg-orange-50 text-orange-700 border border-orange-200",
    falta: "bg-red-50 text-red-600 border border-red-200",
  };
  return `${map[estado] || "bg-slate-50 text-slate-500"} px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide`;
};

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

const TIPOS = [
  {
    value: "asistencia",
    label: "Asistencia",
    icon: <CalendarCheck size={15} />,
  },
  { value: "permisos", label: "Permisos", icon: <FileText size={15} /> },
  { value: "vacaciones", label: "Vacaciones", icon: <Calendar size={15} /> },
];

export default function Reportes() {
  const [areas, setAreas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [empFiltrados, setEmpFiltrados] = useState([]);
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cargandoInit, setCargandoInit] = useState(true);
  const [generado, setGenerado] = useState(false);

  const hoy = new Date().toISOString().split("T")[0];
  const primerDiaMes = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  )
    .toISOString()
    .split("T")[0];

  const [filtros, setFiltros] = useState({
    tipo: "asistencia",
    fecha_inicio: primerDiaMes,
    fecha_fin: hoy,
    id_area: "",
    id_empleado: "",
  });

  useEffect(() => {
    cargarInicial();
  }, []);

  useEffect(() => {
    if (filtros.id_area) {
      setEmpFiltrados(
        empleados.filter((e) => e.id_area === parseInt(filtros.id_area)),
      );
      setFiltros((f) => ({ ...f, id_empleado: "" }));
    } else {
      setEmpFiltrados(empleados);
    }
  }, [filtros.id_area, empleados]);

  const cargarInicial = async () => {
    const [{ data: a }, { data: e }] = await Promise.all([
      supabase.from("area").select("id_area, nombre_area"),
      supabase
        .from("empleado")
        .select(
          "id_empleado, nombre, apellido, id_area, area:id_area(nombre_area), cargo:id_cargo(nombre_cargo)",
        ),
    ]);
    setAreas(a || []);
    setEmpleados(e || []);
    setEmpFiltrados(e || []);
    setCargandoInit(false);
  };

  const generarReporte = async () => {
    if (!filtros.fecha_inicio || !filtros.fecha_fin) return;
    setLoading(true);
    setGenerado(false);

    let resultado = [];

    if (filtros.tipo === "asistencia") {
      let query = supabase
        .from("asistencia")
        .select(
          "*, empleado(nombre, apellido, id_area, area:id_area(nombre_area), cargo:id_cargo(nombre_cargo))",
        )
        .gte("fecha", filtros.fecha_inicio)
        .lte("fecha", filtros.fecha_fin)
        .order("fecha", { ascending: false });

      if (filtros.id_empleado) {
        query = query.eq("id_empleado", filtros.id_empleado);
      } else if (filtros.id_area) {
        const idsArea = empleados
          .filter((e) => e.id_area === parseInt(filtros.id_area))
          .map((e) => e.id_empleado);
        if (idsArea.length > 0) query = query.in("id_empleado", idsArea);
      }

      const { data } = await query;
      resultado = data || [];
    }

    if (filtros.tipo === "permisos") {
      let query = supabase
        .from("permiso")
        .select(
          "*, empleado(nombre, apellido, id_area, area:id_area(nombre_area), cargo:id_cargo(nombre_cargo))",
        )
        .gte("fecha_inicio", filtros.fecha_inicio)
        .lte("fecha_inicio", filtros.fecha_fin)
        .order("fecha_inicio", { ascending: false });

      if (filtros.id_empleado) {
        query = query.eq("id_empleado", filtros.id_empleado);
      } else if (filtros.id_area) {
        const idsArea = empleados
          .filter((e) => e.id_area === parseInt(filtros.id_area))
          .map((e) => e.id_empleado);
        if (idsArea.length > 0) query = query.in("id_empleado", idsArea);
      }

      const { data } = await query;
      resultado = data || [];
    }

    if (filtros.tipo === "vacaciones") {
      let query = supabase
        .from("vacacion")
        .select(
          "*, empleado(nombre, apellido, id_area, area:id_area(nombre_area), cargo:id_cargo(nombre_cargo))",
        )
        .gte("fecha_inicio", filtros.fecha_inicio)
        .lte("fecha_inicio", filtros.fecha_fin)
        .order("fecha_inicio", { ascending: false });

      if (filtros.id_empleado) {
        query = query.eq("id_empleado", filtros.id_empleado);
      } else if (filtros.id_area) {
        const idsArea = empleados
          .filter((e) => e.id_area === parseInt(filtros.id_area))
          .map((e) => e.id_empleado);
        if (idsArea.length > 0) query = query.in("id_empleado", idsArea);
      }

      const { data } = await query;
      resultado = data || [];
    }

    setDatos(resultado);
    setGenerado(true);
    setLoading(false);
  };

  // stats de la vista previa
  const statsReporte = () => {
    if (!generado || datos.length === 0) return null;
    if (filtros.tipo === "asistencia") {
      const puntuales = datos.filter((d) => d.estado === "puntual").length;
      const tardanzas = datos.filter((d) => d.estado === "tardanza").length;
      const faltas = datos.filter((d) => d.estado === "falta").length;
      return [
        {
          label: "Total registros",
          value: datos.length,
          color: "text-[#0066cc]",
          bg: "bg-blue-50",
        },
        {
          label: "Puntuales",
          value: puntuales,
          color: "text-green-600",
          bg: "bg-green-50",
        },
        {
          label: "Tardanzas",
          value: tardanzas,
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
        {
          label: "Faltas",
          value: faltas,
          color: "text-red-500",
          bg: "bg-red-50",
        },
      ];
    }
    if (filtros.tipo === "permisos") {
      const aprobados = datos.filter((d) => d.estado === "aprobado").length;
      const pendientes = datos.filter((d) => d.estado === "pendiente").length;
      const rechazados = datos.filter((d) => d.estado === "rechazado").length;
      return [
        {
          label: "Total permisos",
          value: datos.length,
          color: "text-[#0066cc]",
          bg: "bg-blue-50",
        },
        {
          label: "Aprobados",
          value: aprobados,
          color: "text-green-600",
          bg: "bg-green-50",
        },
        {
          label: "Pendientes",
          value: pendientes,
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
        {
          label: "Rechazados",
          value: rechazados,
          color: "text-red-500",
          bg: "bg-red-50",
        },
      ];
    }
    if (filtros.tipo === "vacaciones") {
      const aprobados = datos.filter((d) => d.estado === "aprobado").length;
      const pendientes = datos.filter((d) => d.estado === "pendiente").length;
      const totalDias = datos.reduce((acc, d) => acc + (d.dias || 0), 0);
      return [
        {
          label: "Total solicitudes",
          value: datos.length,
          color: "text-[#0066cc]",
          bg: "bg-blue-50",
        },
        {
          label: "Aprobadas",
          value: aprobados,
          color: "text-green-600",
          bg: "bg-green-50",
        },
        {
          label: "Pendientes",
          value: pendientes,
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
        {
          label: "Total días",
          value: totalDias,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
        },
      ];
    }
  };

  if (cargandoInit)
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#004bb4] font-semibold text-lg animate-pulse">
          Cargando reportes...
        </p>
      </div>
    );

  const stats = statsReporte();

  return (
    <>
      {/* HEADER */}
      <header className="bg-[#d0e3fc] rounded-2xl px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="font-extrabold text-[#002d6b] tracking-wide text-sm uppercase">
            Reportes
          </h2>
          <p className="text-xs text-[#002d6b]/60 mt-0.5">
            Genera reportes filtrados por fecha, área o empleado
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

      {/* FORMULARIO FILTROS */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-[#eef4fc] px-6 py-4 flex items-center gap-2">
          <Filter size={15} className="text-[#004bb4]" />
          <h3 className="text-sm font-bold text-[#002d6b]">
            Filtros del Reporte
          </h3>
        </div>

        <div className="p-6 space-y-5">
          {/* Tipo de reporte */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Tipo de Reporte
            </label>
            <div className="flex gap-2 flex-wrap">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setFiltros((f) => ({ ...f, tipo: t.value }));
                    setGenerado(false);
                    setDatos([]);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    filtros.tipo === t.value
                      ? "bg-[#004bb4] text-white border-[#004bb4]"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#004bb4]/50"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Fecha Inicio *
              </label>
              <input
                type="date"
                value={filtros.fecha_inicio}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, fecha_inicio: e.target.value }))
                }
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Fecha Fin *
              </label>
              <input
                type="date"
                value={filtros.fecha_fin}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, fecha_fin: e.target.value }))
                }
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
              />
            </div>

            {/* Área */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Área{" "}
                <span className="normal-case text-slate-400 font-normal">
                  (opcional)
                </span>
              </label>
              <div className="relative">
                <select
                  value={filtros.id_area}
                  onChange={(e) =>
                    setFiltros((f) => ({ ...f, id_area: e.target.value }))
                  }
                  className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
                >
                  <option value="">Todas las áreas</option>
                  {areas.map((a) => (
                    <option key={a.id_area} value={a.id_area}>
                      {a.nombre_area}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>

            {/* Empleado */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Empleado{" "}
                <span className="normal-case text-slate-400 font-normal">
                  (opcional)
                </span>
              </label>
              <div className="relative">
                <select
                  value={filtros.id_empleado}
                  onChange={(e) =>
                    setFiltros((f) => ({ ...f, id_empleado: e.target.value }))
                  }
                  className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
                >
                  <option value="">Todos los empleados</option>
                  {empFiltrados.map((e) => (
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
          </div>

          {/* info del empleado seleccionado */}
          {filtros.id_empleado &&
            (() => {
              const emp = empleados.find(
                (e) => e.id_empleado === parseInt(filtros.id_empleado),
              );
              if (!emp) return null;
              const ini =
                `${emp.nombre?.charAt(0)}${emp.apellido?.charAt(0)}`.toUpperCase();
              return (
                <div className="flex items-center gap-3 bg-[#eef4fc] border border-[#004bb4]/20 rounded-xl px-4 py-3">
                  <div
                    className={`w-8 h-8 rounded-full ${colorAvatar(ini)} flex items-center justify-center text-[11px] font-bold shrink-0`}
                  >
                    {ini}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {emp.nombre} {emp.apellido}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {emp.area?.nombre_area} · {emp.cargo?.nombre_cargo}
                    </p>
                  </div>
                </div>
              );
            })()}

          {/* botones */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={() => {
                setFiltros({
                  tipo: filtros.tipo,
                  fecha_inicio: primerDiaMes,
                  fecha_fin: hoy,
                  id_area: "",
                  id_empleado: "",
                });
                setDatos([]);
                setGenerado(false);
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Limpiar
            </button>
            <button
              onClick={generarReporte}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#004bb4] hover:bg-[#003a8c] disabled:opacity-60 transition-colors"
            >
              {loading ? (
                <span className="animate-pulse">Generando...</span>
              ) : (
                <>
                  <Search size={15} />
                  Generar Reporte
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* VISTA PREVIA */}
      {generado && (
        <>
          {/* stats */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-white p-4 rounded-2xl shadow-sm flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">
                      {s.label}
                    </span>
                    <span
                      className={`${s.bg} ${s.color} w-7 h-7 rounded-lg flex items-center justify-center`}
                    >
                      <BarChart3 size={14} />
                    </span>
                  </div>
                  <span className={`text-3xl font-black ${s.color}`}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* tabla */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Vista Previa del Reporte
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {filtros.fecha_inicio} → {filtros.fecha_fin}
                  {filtros.id_area
                    ? ` · ${areas.find((a) => a.id_area === parseInt(filtros.id_area))?.nombre_area}`
                    : ""}
                  {filtros.id_empleado
                    ? ` · ${empFiltrados.find((e) => e.id_empleado === parseInt(filtros.id_empleado))?.nombre}`
                    : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#004bb4] bg-[#eef4fc] border border-[#004bb4]/20 hover:bg-[#d0e3fc] transition-colors"
                >
                  <Download size={14} />
                  Exportar PDF
                </button>
                <button
                  onClick={handleExcel}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 transition-colors"
                >
                  <Download size={14} />
                  Exportar Excel
                </button>
              </div>
            </div>

            {datos.length === 0 ? (
              <div className="py-14 flex flex-col items-center gap-2 text-slate-400">
                <FileText size={30} className="text-slate-300" />
                <p className="font-medium text-sm">
                  Sin resultados para los filtros seleccionados
                </p>
                <p className="text-xs">
                  Prueba con otro rango de fechas o filtros
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-slate-400 font-semibold border-b border-slate-100 bg-slate-50/50">
                      <th className="py-3 px-5">Empleado</th>
                      <th className="py-3 px-4">Área</th>
                      <th className="py-3 px-4">Cargo</th>
                      {filtros.tipo === "asistencia" && (
                        <>
                          <th className="py-3 px-4">Fecha</th>
                          <th className="py-3 px-4">Entrada</th>
                          <th className="py-3 px-4">Salida</th>
                          <th className="py-3 px-4">Estado</th>
                        </>
                      )}
                      {filtros.tipo === "permisos" && (
                        <>
                          <th className="py-3 px-4">Fecha Inicio</th>
                          <th className="py-3 px-4">Fecha Fin</th>
                          <th className="py-3 px-4">Motivo</th>
                          <th className="py-3 px-4">Estado</th>
                        </>
                      )}
                      {filtros.tipo === "vacaciones" && (
                        <>
                          <th className="py-3 px-4">Fecha Inicio</th>
                          <th className="py-3 px-4">Fecha Fin</th>
                          <th className="py-3 px-4 text-center">Días</th>
                          <th className="py-3 px-4">Estado</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {datos.map((d, i) => {
                      const nombre = d.empleado?.nombre || "";
                      const apellido = d.empleado?.apellido || "";
                      const ini =
                        `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
                      const avatar = colorAvatar(ini);
                      return (
                        <tr
                          key={i}
                          className="hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-full ${avatar} flex items-center justify-center text-[10px] font-bold shrink-0`}
                              >
                                {ini}
                              </div>
                              <span className="font-semibold text-slate-800">
                                {nombre} {apellido}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {d.empleado?.area?.nombre_area}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {d.empleado?.cargo?.nombre_cargo}
                          </td>

                          {filtros.tipo === "asistencia" && (
                            <>
                              <td className="py-3 px-4 font-medium text-slate-700">
                                {d.fecha}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {d.hora_entrada || "—"}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {d.hora_salida || "—"}
                              </td>
                              <td className="py-3 px-4">
                                <span className={estadoBadge(d.estado)}>
                                  {d.estado}
                                </span>
                              </td>
                            </>
                          )}

                          {filtros.tipo === "permisos" && (
                            <>
                              <td className="py-3 px-4 text-slate-700">
                                {d.fecha_inicio}
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {d.fecha_fin}
                              </td>
                              <td className="py-3 px-4 max-w-[160px]">
                                <p
                                  className="text-slate-600 truncate"
                                  title={d.motivo}
                                >
                                  {d.motivo}
                                </p>
                              </td>
                              <td className="py-3 px-4">
                                <span className={estadoBadge(d.estado)}>
                                  {d.estado}
                                </span>
                              </td>
                            </>
                          )}

                          {filtros.tipo === "vacaciones" && (
                            <>
                              <td className="py-3 px-4 text-slate-700">
                                {d.fecha_inicio}
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {d.fecha_fin}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-[#eef4fc] text-[#004bb4] px-2 py-0.5 rounded-md font-bold">
                                  {d.dias}d
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={estadoBadge(d.estado)}>
                                  {d.estado}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {datos.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-600">
                    {datos.length}
                  </span>{" "}
                  registros encontrados
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
