import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ChatWidget } from "./ChatWidget";
import { ThemeToggle } from "./ThemeToggle";

const MENU: Record<number, { label: string; ruta: string; icono: string }[]> = {
  1: [
    { label: "Inicio", ruta: "/paciente", icono: "🏠" },
    { label: "Agendar cita", ruta: "/paciente/agendar", icono: "📅" },
    { label: "Mis citas", ruta: "/paciente/citas", icono: "📋" },
    { label: "Mi perfil", ruta: "/paciente/perfil", icono: "👤" },
  ],
  2: [
    { label: "Panel de citas", ruta: "/recepcion", icono: "📋" },
    { label: "Control de pagos", ruta: "/recepcion/pagos", icono: "💳" },
    { label: "Registrar paciente", ruta: "/recepcion/registrar", icono: "➕" },
  ],
  3: [{ label: "Mi agenda", ruta: "/odontologo", icono: "🦷" }],
  4: [
    { label: "Matriz CRUD", ruta: "/admin", icono: "📊" },
    { label: "Usuarios", ruta: "/admin/usuarios", icono: "👥" },
    { label: "Servicios", ruta: "/admin/servicios", icono: "🦷" },
    { label: "Disponibilidad", ruta: "/admin/disponibilidad", icono: "📅" },
    { label: "Base chatbot", ruta: "/admin/chatbot", icono: "🤖" },
    { label: "Políticas", ruta: "/admin/politicas", icono: "📜" },
    { label: "Bitácora IA", ruta: "/admin/bitacora", icono: "📝" },
  ],
};

const ROL_LABEL: Record<number, string> = {
  1: "Paciente",
  2: "Recepción",
  3: "Odontólogo",
  4: "Administrador",
};

export const Layout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-blue-700 dark:text-cyan-400">
            🦷 Aura Dent
          </h2>
          <p className="text-xs text-slate-500 mt-1">{ROL_LABEL[user.rol]}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {MENU[user.rol]?.map((item) => (
            <Link
              key={item.ruta}
              to={item.ruta}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 transition"
            >
              <span>{item.icono}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-sm font-medium"
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-6">
          <span className="text-slate-600 dark:text-slate-300 text-sm">
            Hola, <strong>{user.nombres}</strong>
          </span>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>

      <ChatWidget />
    </div>
  );
};
