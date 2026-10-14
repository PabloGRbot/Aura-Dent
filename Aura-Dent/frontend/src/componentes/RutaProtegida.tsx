import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { RUTA_INICIO_POR_ROL } from '../navegacion';
import { Rol } from '../tipos';

interface Props {
  children: ReactNode;
  roles?: Rol[];
}

export function RutaProtegida({ children, roles }: Props) {
  const { usuario, cargando } = useAutenticacion();

  if (cargando) {
    return <p className="cargando">Cargando...</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to={RUTA_INICIO_POR_ROL[usuario.rol]} replace />;
  }

  return <>{children}</>;
}
