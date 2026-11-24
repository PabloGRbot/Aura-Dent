import { ReactNode, useState } from 'react';
import { Globe, LogOut, Menu, Sparkles, X } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { MENU_POR_ROL, NOMBRE_ROL, RUTA_INICIO_POR_ROL } from '../navegacion';
import { MenuDesplegable } from './MenuDesplegable';

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, cerrarSesion } = useAutenticacion();
  const navegar = useNavigate();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  function salir(): void {
    cerrarSesion();
    navegar('/login');
  }

  const inicio = usuario ? RUTA_INICIO_POR_ROL[usuario.rol] : '/';
  const iniciales = usuario
    ? `${usuario.nombres.charAt(0)}${usuario.apellidos.charAt(0)}`.toUpperCase()
    : 'AD';

  return (
    <div className="min-h-screen flex bg-canvas text-deep-ink">
      {/* Backdrop móvil */}
      {menuMovilAbierto && (
        <div
          className="fixed inset-0 z-40 bg-deep-ink/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuMovilAbierto(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 bg-deep-ink text-white flex flex-col justify-between p-5 transition-transform duration-300 lg:translate-x-0 ${
          menuMovilAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6 overflow-y-auto scrollbar-hide">
          <div className="flex items-center justify-between px-2">
            <Link
              to={inicio}
              className="flex items-center gap-2.5 font-hedvig text-heading-sm font-bold text-white"
              onClick={() => setMenuMovilAbierto(false)}
            >
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-hi-yellow text-deep-ink">
                <Sparkles size={18} />
              </span>
              <span>Aura-Dent</span>
            </Link>
            <button
              type="button"
              className="lg:hidden text-white/70 hover:text-white p-1"
              onClick={() => setMenuMovilAbierto(false)}
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          </div>

          {usuario && (
            <nav className="flex flex-col gap-1.5" aria-label="Navegación principal">
              {MENU_POR_ROL[usuario.rol].map((opcion) =>
                opcion.hijos ? (
                  <MenuDesplegable
                    key={opcion.etiqueta}
                    opcion={opcion}
                    alNavegar={() => setMenuMovilAbierto(false)}
                  />
                ) : (
                  <NavLink
                    key={opcion.ruta}
                    to={opcion.ruta ?? '#'}
                    end
                    onClick={() => setMenuMovilAbierto(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 font-inter font-medium text-body-sm rounded-pill px-4 py-2.5 transition-all duration-200 ${
                        isActive
                          ? 'bg-hi-yellow text-deep-ink'
                          : 'text-white/75 hover:text-white hover:bg-white/10'
                      }`
                    }
                  >
                    <span>{opcion.etiqueta}</span>
                  </NavLink>
                )
              )}
            </nav>
          )}
        </div>

        <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-inter text-body-sm text-white/70 hover:text-white rounded-pill px-4 py-2 transition-colors"
          >
            <Globe size={16} />
            <span>Inicio público</span>
          </Link>
          <button
            type="button"
            onClick={salir}
            className="flex items-center gap-2.5 font-inter text-body-sm text-white/70 hover:text-hi-yellow rounded-pill px-4 py-2 transition-colors text-left"
          >
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-soft-meadow/90 backdrop-blur-md border-b border-deep-ink/10 px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-full bg-canvas text-deep-ink border border-deep-ink/15"
              onClick={() => setMenuMovilAbierto(true)}
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-deep-ink text-hi-yellow font-inter font-semibold text-body-sm">
                {iniciales}
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                <span className="font-inter font-medium text-body-sm text-deep-ink">
                  {usuario ? `${usuario.nombres} ${usuario.apellidos}` : ''}
                </span>
                {usuario && (
                  <span className="badge badge-yellow">{NOMBRE_ROL[usuario.rol]}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 font-inter font-medium text-body-sm text-deep-ink hover:bg-canvas rounded-pill px-4 py-2 transition-colors"
            >
              <Globe size={15} />
              <span>Inicio público</span>
            </Link>
            <button
              type="button"
              onClick={salir}
              className="inline-flex items-center gap-1.5 bg-deep-ink text-white font-inter font-medium text-body-sm rounded-pill px-4 py-2 hover:brightness-115 transition-all"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-page w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
