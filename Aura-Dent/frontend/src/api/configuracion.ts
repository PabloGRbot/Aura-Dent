import { peticion } from './cliente';

export type Configuracion = Record<string, string>;

export function obtenerConfiguracion(): Promise<Configuracion> {
  return peticion<Configuracion>('/api/configuracion');
}

export function guardarConfiguracion(valores: Configuracion): Promise<Configuracion> {
  return peticion<Configuracion>('/api/configuracion', {
    method: 'PUT',
    body: JSON.stringify(valores)
  });
}
