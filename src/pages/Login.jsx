import React, { useState } from "react";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";

const INPUT_BASE =
  "w-full py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004bb4] focus:border-transparent transition-all placeholder:text-slate-300 bg-slate-50/50";

function InputField({ label, icon: Icon, rightElement, ...props }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Icon size={18} />
        </span>
        <input
          className={`${INPUT_BASE} pl-10 ${rightElement ? "pr-10" : "pr-4"}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginRRHH() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Buscar usuario en la tabla usuario
      const { data, error: dbError } = await supabase
        .from("usuario")
        .select("*, rol(nombre_rol)")
        .eq("usuario", username)
        .eq("contrasena", password)
        .maybeSingle();

      if (dbError || !data) {
        setError("Usuario o contraseña incorrectos.");
        setLoading(false);
        return;
      }

      // Guardar sesión en localStorage
      localStorage.setItem(
        "usuario",
        JSON.stringify({
          id: data.id_usuario,
          usuario: data.usuario,
          rol: data.rol.nombre_rol,
        }),
      );

      if (data.rol.nombre_rol === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/empleado");
      }
    } catch (err) {
      console.log("Error completo:", err);
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-white font-sans text-slate-800 overflow-hidden">
      {/* IZQUIERDA: Formulario */}
      <div className="w-full md:w-[35%] flex flex-col justify-between px-6 sm:px-12 pt-10 pb-8 bg-white shadow-xl z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src="logo-fab.jpeg"
            alt="Logo Polímeros Innovadores"
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0"
          />
          <div>
            <h1 className="font-extrabold tracking-tight text-[#002d6b] leading-tight">
              <span className="block text-2xl">POLÍMEROS</span>
              <span className="block text-sm font-semibold">
                INNOVADORES S.A.
              </span>
            </h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sistema de Gestión de RRHH
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
            Acceso al Portal de Empleados
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <InputField
              label="Usuario"
              icon={User}
              type="text"
              placeholder="nombre.apellido"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <InputField
              label="Contraseña"
              icon={Lock}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {/* Mensaje de error */}
            {error && (
              <p className="text-sm text-red-500 font-medium text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#004bb4] hover:bg-[#003785] text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Verificando..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="mt-8 text-center space-y-2">
            <a
              href="#recuperar"
              className="block text-sm font-medium text-[#004bb4] hover:underline"
            >
              ¿Olvidó su contraseña?
            </a>
            <a
              href="#ayuda"
              className="block text-xs font-medium text-slate-400 hover:text-slate-600"
            >
              Ayuda al usuario
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400 text-left">
          &copy; {new Date().getFullYear()} Polímeros Innovadores S.A. | Todos
          los derechos reservados.
        </p>
      </div>

      {/* DERECHA: Imagen */}
      <div className="hidden md:block md:w-[65%] my-[20px] mr-[20px] relative overflow-hidden rounded-2xl">
        <img
          src="fabrica.jpeg"
          alt="Producción de rollos de plástico"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
