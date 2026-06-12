import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo.jpeg";

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '—';

  const [year, month, day] = fechaStr.split('-');

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return `${parseInt(day)} de ${meses[parseInt(month) - 1]} de ${year}`;
};

export const generarPDFVacaciones = (datos, filtros) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "letter",
  });

  doc.addImage(logo, "JPEG", 15, 12, 110, 30);
  doc.setDrawColor(220, 226, 235);
  doc.setLineWidth(0.5);
  doc.line(15, 42, 272, 42);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 45, 107);
  doc.text("POLÍMEROS INNOVADORES S.A.", 260, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-BO")}`, 260, 25, {
    align: "right",
  });
  doc.text(`ID: REP-VAC-${Date.now()}`, 260, 30, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 45, 107);
  doc.text("REPORTE DE VACACIONES", 15, 52);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("PERÍODO: ", 15, 59);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${formatearFecha(filtros.fecha_inicio)}  —  ${formatearFecha(filtros.fecha_fin)}`,
    38,
    59,
  );

  const columnas = [
    { header: "Empleado", dataKey: "empleado" },
    { header: "Área", dataKey: "area" },
    { header: "Cargo", dataKey: "cargo" },
    { header: "Fecha Inicio", dataKey: "fecha_inicio" },
    { header: "Fecha Fin", dataKey: "fecha_fin" },
    { header: "Días", dataKey: "dias" },
    { header: "Estado", dataKey: "estado" },
  ];

  const filas = datos.map((d) => ({
    empleado: `${d.empleado?.nombre} ${d.empleado?.apellido}`,
    area: d.empleado?.area?.nombre_area ?? "—",
    cargo: d.empleado?.cargo?.nombre_cargo ?? "—",
    fecha_inicio: formatearFecha(d.fecha_inicio),
    fecha_fin: formatearFecha(d.fecha_fin),
    dias: `${d.dias} días`,
    estado: d.estado?.toUpperCase(),
  }));

  autoTable(doc, {
    startY: 65,
    columns: columnas,
    body: filas,
    margin: { left: 15, right: 15 },
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3.5,
      lineColor: [210, 215, 223],
      lineWidth: 0.3,
      valign: "middle",
    },
    headStyles: {
      fillColor: [208, 227, 252],
      textColor: [0, 45, 107],
      fontStyle: "bold",
      halign: "center",
      lineWidth: 0.3,
    },
    alternateRowStyles: {
      fillColor: [246, 248, 251],
    },
    bodyStyles: { textColor: [50, 50, 50] },
    columnStyles: {
      fecha_inicio: { halign: "center" },
      fecha_fin: { halign: "center" },
      dias: { halign: "center" },
      estado: { halign: "center" },
    },
    didParseCell(data) {
      if (data.section === "body" && data.column.dataKey === "estado") {
        const v = data.cell.raw;
        if (v === "APROBADO") {
          data.cell.styles.textColor = [46, 125, 50];
          data.cell.styles.fontStyle = "bold";
        } else if (v === "PENDIENTE") {
          data.cell.styles.textColor = [239, 108, 0];
          data.cell.styles.fontStyle = "bold";
        } else if (v === "RECHAZADO") {
          data.cell.styles.textColor = [198, 40, 40];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    didDrawPage(data) {
      const total = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Página ${data.pageNumber} de ${total}`, 15, 205);
      doc.text(
        "Documento confidencial — Polímeros Innovadores S.A.",
        140,
        205,
        { align: "center" },
      );
    },
  });

  doc.save(
    `Reporte_Vacaciones_${filtros.fecha_inicio}_${filtros.fecha_fin}.pdf`,
  );
};
