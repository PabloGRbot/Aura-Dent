import { Link, useLocation } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { MENU_POR_ROL, OpcionMenu, RUTA_INICIO_POR_ROL } from '../navegacion';

function buscarEtiqueta(opciones: OpcionMenu[], ruta: string): string | undefined {
  for (const opcion of opciones) {
    if (opcion.ruta === ruta) {
      return opcion.etiqueta;
    }
    if (opcion.hijos) {
      const encontrado = buscarEtiqueta(opcion.hijos, ruta);
      if (encontrado) {
        return encontrado;
      }
    }
  }
  return undefined;
}

export function PaginaPlaceholder() {
  const { usuario } = useAutenticacion();
  const ubicacion = useLocation();

  if (!usuario) {
    return null;
  }

  const titulo = buscarEtiqueta(MENU_POR_ROL[usuario.rol], ubicacion.pathname);

  return (
    <section className="panel">
      <h1>Página no encontrada</h1>
      <p className="subtitulo">
        {titulo
          ? `La sección “${titulo}” todavía no tiene una ruta disponible.`
          : 'La dirección que buscas no existe.'}
      </p>
      <Link className="boton-secundario" to={RUTA_INICIO_POR_ROL[usuario.rol]}>
        Volver al inicio
      </Link>
    </section>
  );
}
