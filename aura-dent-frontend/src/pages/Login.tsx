import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ChatWidget } from "../components/ChatWidget";

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(correo, password);
      const u = JSON.parse(localStorage.getItem("usuario")!);
      if (u.rol === 1) navigate("/paciente");
      else if (u.rol === 2) navigate("/recepcion");
      else if (u.rol === 3) navigate("/odontologo");
      else navigate("/admin");
    } catch (err: any) {
      setError(err.response?.data?.error || "Credenciales incorrectas");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700 dark:text-cyan-400">
            🦷 Aura Dent
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Plataforma odontológica inteligente
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <label className="block mb-4">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Correo
          </span>
          <input
            type="email"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="tu@correo.com"
            className="w-full mt-1 p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Contraseña
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full mt-1 p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold transition disabled:opacity-50"
        >
          {cargando ? "Ingresando..." : "Ingresar"}
        </button>

        <p className="text-center text-sm mt-4 text-slate-500">
          ¿No tienes cuenta?{" "}
          <Link
            to="/registro"
            className="text-blue-600 hover:underline font-medium"
          >
            Regístrate
          </Link>
        </p>

        <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mb-2">
            🔑 Usuarios demo (pass: aura2026)
          </p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <li>admin@auradent.pe — Admin</li>
            <li>recepcion@auradent.pe — Recepción</li>
            <li>carlos@auradent.pe — Odontólogo</li>
            <li>pablo@auradent.pe — Paciente</li>
          </ul>
        </div>
      </form>
      <ChatWidget />
    </div>
  );
};
