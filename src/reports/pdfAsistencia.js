import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/logo.jpeg';

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '—';
  const [year, month, day] = fechaStr.split('-');
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${parseInt(day)} de ${meses[parseInt(month) - 1]} de ${year}`;
};

const calcularEstado = (hora_entrada, hora_salida, fecha) => {
  const diaSemana = fecha ? new Date(fecha + 'T12:00:00').getDay() : -1;
  const esLunes = diaSemana === 1;
  const horaSalidaLimite = esLunes ? '17:00' : '18:00';

  let estadoEntrada = null;
  let estadoSalida = null;

  if (!hora_entrada && !hora_salida) return { texto: 'No Asistió', tipo: 'ausente' };

  if (!hora_entrada && hora_salida) {
    estadoEntrada = 'Sin Registro de Entrada';
  } else {
    estadoEntrada = hora_entrada <= '08:30' ? 'Puntual' : 'Tardanza';
  }

  if (!hora_salida) {
    estadoSalida = null;
  } else {
    estadoSalida = hora_salida >= horaSalidaLimite ? null : 'Salida Anticipada';
  }

  if (estadoSalida) {
    return { texto: `${estadoEntrada} · ${estadoSalida}`, tipo: estadoEntrada === 'Puntual' ? 'puntual_anticipada' : estadoEntrada === 'Tardanza' ? 'tardanza_anticipada' : 'sin_entrada' };
  }

  return {
    texto: estadoEntrada,
    tipo: estadoEntrada === 'Puntual' ? 'puntual' : estadoEntrada === 'Tardanza' ? 'tardanza' : 'sin_entrada'
  };
};

const colorPorTipo = (tipo) => {
  const map = {
    puntual:             [46, 125, 50],
    tardanza:            [239, 108, 0],
    ausente:             [198, 40, 40],
    puntual_anticipada:  [2, 119, 189],
    tardanza_anticipada: [198, 40, 40],
    sin_entrada:         [123, 31, 162],
  };
  return map[tipo] || [80, 80, 80];
};

export const generarPDFAsistencia = (datos, filtros) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });

  // Logo más ancho
  doc.addImage(logo, 'JPEG', 15, 8, 110, 30);

  // Línea separadora
  doc.setDrawColor(220, 226, 235);
  doc.setLineWidth(0.5);
  doc.line(15, 42, 272, 42);

  // Encabezado derecho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 45, 107);
  doc.text('POLÍMEROS INNOVADORES S.A.', 272, 16, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado: ${formatearFecha(new Date().toISOString().split('T')[0])}`, 272, 23, { align: 'right' });
  doc.text(`ID: REP-ASI-${Date.now()}`, 272, 29, { align: 'right' });
  doc.text('Recursos Humanos', 272, 35, { align: 'right' });

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(0, 45, 107);
  doc.text('REPORTE DE ASISTENCIA', 15, 52);

  doc.setFontSize(9.5);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text('PERÍODO: ', 15, 59);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatearFecha(filtros.fecha_inicio)}  —  ${formatearFecha(filtros.fecha_fin)}`, 38, 59);

  // Columnas
  const columnas = [
    { header: 'Empleado', dataKey: 'empleado' },
    { header: 'Área', dataKey: 'area' },
    { header: 'Cargo', dataKey: 'cargo' },
    { header: 'Fecha', dataKey: 'fecha' },
    { header: 'Entrada', dataKey: 'entrada' },
    { header: 'Salida', dataKey: 'salida' },
    { header: 'Estado', dataKey: 'estado' },
  ];

  const filas = datos.map(d => {
    const { texto } = calcularEstado(d.hora_entrada, d.hora_salida, d.fecha);
    return {
      empleado: `${d.empleado?.nombre} ${d.empleado?.apellido}`,
      area: d.empleado?.area?.nombre_area ?? '—',
      cargo: d.empleado?.cargo?.nombre_cargo ?? '—',
      fecha: formatearFecha(d.fecha),
      entrada: d.hora_entrada ?? '—',
      salida: d.hora_salida ?? '—',
      estado: texto,
      _hora_entrada: d.hora_entrada,
      _hora_salida: d.hora_salida,
      _fecha: d.fecha,
    };
  });

  autoTable(doc, {
    startY: 65,
    columns: columnas,
    body: filas,
    margin: { left: 15, right: 15 },
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 4,
      lineColor: [210, 215, 223],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [208, 227, 252],
      textColor: [0, 45, 107],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 9,
      cellPadding: 5,
    },
    // Filas alternadas
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    bodyStyles: {
      textColor: [50, 50, 50],
    },
    columnStyles: {
      fecha:   { halign: 'center' },
      entrada: { halign: 'center' },
      salida:  { halign: 'center' },
      estado:  { halign: 'center' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.dataKey === 'estado') {
        const fila = data.row.raw;
        const { tipo } = calcularEstado(fila._hora_entrada, fila._hora_salida, fila._fecha);
        data.cell.styles.textColor = colorPorTipo(tipo);
        data.cell.styles.fontStyle = 'bold';
      }
    },
    didDrawPage(data) {
      const total = doc.internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text(`Página ${data.pageNumber} de ${total}`, 15, 208);
      doc.text('Documento confidencial — Polímeros Innovadores S.A. — Solo uso interno', 143, 208, { align: 'center' });
      doc.text(new Date().toLocaleDateString('es-BO'), 272, 208, { align: 'right' });
    },
  });

  doc.save(`Reporte_Asistencia_${filtros.fecha_inicio}_${filtros.fecha_fin}.pdf`);
};