import * as XLSX from 'xlsx';

const HEADER_STYLE = { font: { bold: true, color: { rgb: '002D6B' } } };

export const exportarExcel = (datos, filtros) => {
  let filas = [];
  let nombreArchivo = '';
  let headers = [];

  if (filtros.tipo === 'asistencia') {
    nombreArchivo = `Asistencia_${filtros.fecha_inicio}_${filtros.fecha_fin}`;
    headers = ['Empleado', 'Área', 'Cargo', 'Fecha', 'Hora Entrada', 'Hora Salida', 'Estado'];
    filas = datos.map(d => ({
      Empleado: `${d.empleado?.nombre} ${d.empleado?.apellido}`,
      Área: d.empleado?.area?.nombre_area ?? '—',
      Cargo: d.empleado?.cargo?.nombre_cargo ?? '—',
      Fecha: d.fecha,
      'Hora Entrada': d.hora_entrada ?? '—',
      'Hora Salida': d.hora_salida ?? '—',
      Estado: d.estado,
    }));
  }

  if (filtros.tipo === 'permisos') {
    nombreArchivo = `Permisos_${filtros.fecha_inicio}_${filtros.fecha_fin}`;
    headers = ['Empleado', 'Área', 'Cargo', 'Fecha Inicio', 'Fecha Fin', 'Motivo', 'Estado'];
    filas = datos.map(d => ({
      Empleado: `${d.empleado?.nombre} ${d.empleado?.apellido}`,
      Área: d.empleado?.area?.nombre_area ?? '—',
      Cargo: d.empleado?.cargo?.nombre_cargo ?? '—',
      'Fecha Inicio': d.fecha_inicio,
      'Fecha Fin': d.fecha_fin,
      Motivo: d.motivo,
      Estado: d.estado,
    }));
  }

  if (filtros.tipo === 'vacaciones') {
    nombreArchivo = `Vacaciones_${filtros.fecha_inicio}_${filtros.fecha_fin}`;
    headers = ['Empleado', 'Área', 'Cargo', 'Fecha Inicio', 'Fecha Fin', 'Días', 'Estado'];
    filas = datos.map(d => ({
      Empleado: `${d.empleado?.nombre} ${d.empleado?.apellido}`,
      Área: d.empleado?.area?.nombre_area ?? '—',
      Cargo: d.empleado?.cargo?.nombre_cargo ?? '—',
      'Fecha Inicio': d.fecha_inicio,
      'Fecha Fin': d.fecha_fin,
      Días: d.dias,
      Estado: d.estado,
    }));
  }

  // Crear hoja
  const hoja = XLSX.utils.json_to_sheet(filas, { header: headers });

  // Ancho de columnas automático
  hoja['!cols'] = headers.map(() => ({ wch: 22 }));

  // Crear libro y descargar
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Reporte');
  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
};