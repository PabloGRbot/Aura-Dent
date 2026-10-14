import { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { MENU_POR_ROL, NOMBRE_ROL, RUTA_INICIO_POR_ROL } from '../navegacion';

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, cerrarSesion } = useAutenticacion();
  const navegar = useNavigate();

  function salir(): void {
    cerrarSesion();
    navegar('/login');
  }

  const inicio = usuario ? RUTA_INICIO_POR_ROL[usuario.rol] : '/';

  return (
    <div className="app">
      <aside className="sidebar">
        <Link to={inicio} className="marca">
          Aura-Dent
        </Link>
        {usuario && (
          <nav className="menu">
            {MENU_POR_ROL[usuario.rol].map((opcion) => (
              <NavLink key={opcion.ruta} to={opcion.ruta} end className="menu-enlace">
                {opcion.etiqueta}
              </NavLink>
            ))}
          </nav>
        )}
      </aside>

      <div className="contenido">
        <header className="topbar">
          <span className="topbar-usuario">
            {usuario ? `${usuario.nombres} ${usuario.apellidos}` : ''}
            {usuario && <span className="etiqueta-rol">{NOMBRE_ROL[usuario.rol]}</span>}
          </span>
          <div className="topbar-acciones">
            <Link to="/" className="enlace-suave">
              Inicio público
            </Link>
            <button type="button" onClick={salir}>
              Salir
            </button>
          </div>
        </header>
        <main className="pagina">{children}</main>
      </div>
    </div>
  );
}
