import { peticion } from './cliente';

export interface Odontologo {
  id: string;
  nombres: string;
  apellidos: string;
}

export function listarOdontologos(): Promise<Odontologo[]> {
  return peticion<Odontologo[]>('/api/odontologos');
}
