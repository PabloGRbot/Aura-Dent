import { Link, useLocation } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { MENU_POR_ROL, RUTA_INICIO_POR_ROL } from '../navegacion';

export function PaginaPlaceholder() {
  const { usuario } = useAutenticacion();
  const ubicacion = useLocation();

  if (!usuario) {
    return null;
  }

  const opcion = MENU_POR_ROL[usuario.rol].find((item) => item.ruta === ubicacion.pathname);
  const titulo = opcion?.etiqueta ?? 'Sección';

  return (
    <section className="panel">
      <h1>{titulo}</h1>
      <p className="subtitulo">Esta sección estará disponible próximamente.</p>
      <Link className="boton-secundario" to={RUTA_INICIO_POR_ROL[usuario.rol]}>
        Volver al inicio
      </Link>
    </section>
  );
}
