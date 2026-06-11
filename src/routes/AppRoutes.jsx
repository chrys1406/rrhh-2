import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/admin/Dashboard";
import Resumen from "../pages/admin/Resumen";
import Empleados from "../pages/admin/Empleados";
import Asistencia from "../pages/admin/Asistencia";
import Tardanzas from "../pages/admin/Tardanzas";
import Permisos from "../pages/admin/Permisos";
import Vacaciones from "../pages/admin/Vacaciones";
import Reportes from "../pages/admin/Reportes";
import Configuracion from "../pages/admin/Configuracion";
import Avisos from "../pages/admin/Avisos";


// ------------------- EMPLEADOS------------------//
import DashboardEmpleado from "../pages/empleado/DashboardEmpleado";
import InicioEmpleado from "../pages/empleado/InicioEmpleado";
import MiAsistencia from "../pages/empleado/MiAsistencia";
import MisPermisos from "../pages/empleado/MisPermisos";
import MisVacaciones from "../pages/empleado/MisVacaciones";
import MiPerfil from "../pages/empleado/MiPerfil";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />}>
        <Route index element={<Resumen />} />
        <Route path="empleados" element={<Empleados />} />
        <Route path="asistencia" element={<Asistencia />} />
        <Route path="tardanzas" element={<Tardanzas />} />
        <Route path="permisos" element={<Permisos />} />
        <Route path="vacaciones" element={<Vacaciones />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="avisos" element={<Avisos />} />
        <Route path="configuracion" element={<Configuracion />} />
        
      </Route>

      <Route path="/empleado" element={<DashboardEmpleado />}>
        <Route index element={<InicioEmpleado />} />
        <Route path="asistencia" element={<MiAsistencia />} />
        <Route path="permisos" element={<MisPermisos />} />
        <Route path="vacaciones" element={<MisVacaciones />} />
        <Route path="perfil" element={<MiPerfil />} />
      </Route>
    </Routes>
  );
}
