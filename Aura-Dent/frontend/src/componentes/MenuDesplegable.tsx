import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { OpcionMenu } from '../navegacion';

export function MenuDesplegable({ opcion }: { opcion: OpcionMenu }) {
  const ubicacion = useLocation();
  const activo = (opcion.hijos ?? []).some((hijo) => hijo.ruta === ubicacion.pathname);
  const [abierto, setAbierto] = useState(activo);

  useEffect(() => {
    if (activo) {
      setAbierto(true);
    }
  }, [activo]);

  return (
    <div className="menu-grupo">
      <button
        type="button"
        className={`menu-grupo-boton ${activo ? 'activo' : ''}`}
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
      >
        <span>{opcion.etiqueta}</span>
        <span className="menu-flecha">{abierto ? '▾' : '▸'}</span>
      </button>
      {abierto && (
        <div className="menu-sub">
          {(opcion.hijos ?? []).map((hijo) => (
            <NavLink
              key={hijo.ruta}
              to={hijo.ruta ?? '#'}
              end
              className="menu-enlace menu-enlace-sub"
            >
              {hijo.etiqueta}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
