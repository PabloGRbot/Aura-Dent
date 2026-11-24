import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { OpcionMenu } from '../navegacion';

export function MenuDesplegable({
  opcion,
  alNavegar,
}: {
  opcion: OpcionMenu;
  alNavegar?: () => void;
}) {
  const ubicacion = useLocation();
  const activo = (opcion.hijos ?? []).some((hijo) => hijo.ruta === ubicacion.pathname);
  const [abierto, setAbierto] = useState(activo);

  useEffect(() => {
    if (activo) {
      setAbierto(true);
    }
  }, [activo]);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        className={`flex items-center justify-between w-full font-inter font-medium text-body-sm rounded-pill px-4 py-2.5 transition-all duration-200 ${
          activo
            ? 'text-hi-yellow bg-hi-yellow/15'
            : 'text-white/75 hover:text-white hover:bg-white/10'
        }`}
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
      >
        <span>{opcion.etiqueta}</span>
        {abierto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {abierto && (
        <div className="flex flex-col gap-1 pl-4 border-l border-white/15 ml-4 my-1">
          {(opcion.hijos ?? []).map((hijo) => (
            <NavLink
              key={hijo.ruta}
              to={hijo.ruta ?? '#'}
              end
              onClick={alNavegar}
              className={({ isActive }) =>
                `font-inter text-body-sm rounded-pill px-4 py-2 transition-all duration-200 ${
                  isActive
                    ? 'text-deep-ink bg-hi-yellow font-medium'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {hijo.etiqueta}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
