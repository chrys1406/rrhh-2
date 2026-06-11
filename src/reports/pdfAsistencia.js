import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logo from '../assets/logo.jpeg';

export const generarPDFAsistencia = (datos, filtros) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });

  // Logo
  doc.addImage(logo, 'JPEG', 15, 12, 25, 20);

  // Encabezado derecho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 45, 107);
  doc.text('POLÍMEROS INNOVADORES S.A.', 260, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-BO')}`, 260, 25, { align: 'right' });
  doc.text(`ID: REP-ASI-${Date.now()}`, 260, 30, { align: 'right' });

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 45, 107);
  doc.text('REPORTE DE ASISTENCIA', 15, 42);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('PERÍODO: ', 15, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(`${filtros.fecha_inicio} — ${filtros.fecha_fin}`, 37, 50);

  // Columnas
  const columnas = [
    { header: 'Empleado', dataKey: 'empleado' },
    { header: 'Área', dataKey: 'area' },
    { header: 'Cargo', dataKey: 'cargo' },
    { header: 'Fecha', dataKey: 'fecha' },
    { header: 'Hora Entrada', dataKey: 'entrada' },
    { header: 'Hora Salida', dataKey: 'salida' },
    { header: 'Estado', dataKey: 'estado' },
  ];

  const filas = datos.map(d => ({
    empleado: `${d.empleado?.nombre} ${d.empleado?.apellido}`,
    area: d.empleado?.area?.nombre_area ?? '—',
    cargo: d.empleado?.cargo?.nombre_cargo ?? '—',
    fecha: d.fecha,
    entrada: d.hora_entrada ?? '—',
    salida: d.hora_salida ?? '—',
    estado: d.estado?.toUpperCase(),
  }));

  doc.autoTable({
    startY: 57,
    columns: columnas,
    body: filas,
    margin: { left: 15, right: 15 },
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3.5,
      lineColor: [210, 215, 223],
      lineWidth: 0.3,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [208, 227, 252],
      textColor: [0, 45, 107],
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0.3,
    },
    bodyStyles: { textColor: [50, 50, 50] },
    columnStyles: {
      fecha: { halign: 'center' },
      entrada: { halign: 'center' },
      salida: { halign: 'center' },
      estado: { halign: 'center' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.dataKey === 'estado') {
        const v = data.cell.raw;
        if (v === 'PRESENTE') { data.cell.styles.textColor = [46, 125, 50]; data.cell.styles.fontStyle = 'bold'; }
        else if (v === 'TARDANZA') { data.cell.styles.textColor = [239, 108, 0]; data.cell.styles.fontStyle = 'bold'; }
        else if (v === 'AUSENTE') { data.cell.styles.textColor = [198, 40, 40]; data.cell.styles.fontStyle = 'bold'; }
      }
    },
    didDrawPage(data) {
      const total = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Página ${data.pageNumber} de ${total}`, 15, 205);
      doc.text('Documento confidencial — Polímeros Innovadores S.A.', 140, 205, { align: 'center' });
    },
  });

  doc.save(`Reporte_Asistencia_${filtros.fecha_inicio}_${filtros.fecha_fin}.pdf`);
};