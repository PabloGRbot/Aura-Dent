import { SesionAutenticacion, Usuario } from '../tipos';
import { peticion } from './cliente';

export interface DatosRegistro {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  dniCe: string;
  fechaNacimiento?: string | null;
  alergias?: string | null;
  aceptaTerminos: boolean;
}

export function login(email: string, password: string): Promise<SesionAutenticacion> {
  return peticion<SesionAutenticacion>('/api/autenticacion/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export function registrar(datos: DatosRegistro): Promise<SesionAutenticacion> {
  return peticion<SesionAutenticacion>('/api/autenticacion/registro', {
    method: 'POST',
    body: JSON.stringify(datos)
  });
}

export interface DatosPerfil {
  nombres: string;
  apellidos: string;
  email: string;
  dniCe: string;
  fechaNacimiento: string | null;
  alergias: string | null;
  password?: string;
}

export function obtenerPerfil(): Promise<Usuario> {
  return peticion<Usuario>('/api/usuarios/me');
}

export function actualizarMiPerfil(datos: DatosPerfil): Promise<Usuario> {
  return peticion<Usuario>('/api/usuarios/me', {
    method: 'PUT',
    body: JSON.stringify(datos)
  });
}
