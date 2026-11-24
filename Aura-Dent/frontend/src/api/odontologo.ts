import { PacienteRecepcion } from './recepcion';
import { peticion } from './cliente';

export function listarMisPacientes(pagina=1): Promise<PacienteRecepcion[]> {
  return peticion<PacienteRecepcion[]>(`/api/odontologo/mis-pacientes?pagina=${pagina}`);
}
