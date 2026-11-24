import { peticion } from './cliente';

export interface Odontologo {
  id: string;
  nombres: string;
  apellidos: string;
}

export function listarOdontologos(q=''): Promise<Odontologo[]> {
  return peticion<Odontologo[]>(`/api/odontologos?q=${encodeURIComponent(q)}`);
}
