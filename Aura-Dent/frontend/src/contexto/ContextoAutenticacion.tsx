import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { obtenerPerfil } from '../api/autenticacion';
import { CLAVE_TOKEN } from '../api/cliente';
import { Usuario } from '../tipos';

interface EstadoAutenticacion {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (token: string, usuario: Usuario) => void;
  cerrarSesion: () => void;
}

const Contexto = createContext<EstadoAutenticacion | undefined>(undefined);

export function ProveedorAutenticacion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(CLAVE_TOKEN);
    if (!token) {
      setCargando(false);
      return;
    }

    obtenerPerfil()
      .then(setUsuario)
      .catch(() => localStorage.removeItem(CLAVE_TOKEN))
      .finally(() => setCargando(false));
  }, []);

  function iniciarSesion(token: string, datosUsuario: Usuario): void {
    localStorage.setItem(CLAVE_TOKEN, token);
    setUsuario(datosUsuario);
  }

  function cerrarSesion(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    setUsuario(null);
  }

  return (
    <Contexto.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </Contexto.Provider>
  );
}

export function useAutenticacion(): EstadoAutenticacion {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error('useAutenticacion debe usarse dentro de ProveedorAutenticacion');
  }
  return contexto;
}
