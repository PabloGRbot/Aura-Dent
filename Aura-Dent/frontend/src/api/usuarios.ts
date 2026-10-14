import { Rol, Usuario } from '../tipos';
import { peticion } from './cliente';

export interface DatosUsuario {
  nombres: string;
  apellidos: string;
  email: string;
  password?: string;
  dniCe: string;
  fechaNacimiento: string | null;
  alergias: string | null;
  rol: Rol;
}

export function listarUsuarios(): Promise<Usuario[]> {
  return peticion<Usuario[]>('/api/usuarios');
}

export function crearUsuario(datos: DatosUsuario): Promise<Usuario> {
  return peticion<Usuario>('/api/usuarios', {
    method: 'POST',
    body: JSON.stringify(datos)
  });
}

export function actualizarUsuario(id: string, datos: DatosUsuario): Promise<Usuario> {
  return peticion<Usuario>(`/api/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  });
}

export function eliminarUsuario(id: string): Promise<void> {
  return peticion<void>(`/api/usuarios/${id}`, { method: 'DELETE' });
}
