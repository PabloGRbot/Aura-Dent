import { PacienteRecepcion } from './recepcion';
import { peticion } from './cliente';

export function listarMisPacientes(): Promise<PacienteRecepcion[]> {
  return peticion<PacienteRecepcion[]>('/api/odontologo/mis-pacientes');
}
