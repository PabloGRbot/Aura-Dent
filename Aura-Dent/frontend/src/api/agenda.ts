import { CitaAgenda, NotaClinica, NotaClinicaDetalle } from '../tipos';
import { peticion } from './cliente';

export function obtenerAgenda(): Promise<CitaAgenda[]> {
  return peticion<CitaAgenda[]>('/api/citas/agenda');
}

export function asignarCita(citaId: string): Promise<void> {
  return peticion<void>(`/api/citas/${citaId}/asignar`, { method: 'POST' });
}

export function obtenerNotasCita(citaId: string): Promise<NotaClinica[]> {
  return peticion<NotaClinica[]>(`/api/citas/${citaId}/notas`);
}

export function crearNota(citaId: string, contenido: string): Promise<NotaClinica> {
  return peticion<NotaClinica>(`/api/citas/${citaId}/notas`, {
    method: 'POST',
    body: JSON.stringify({ contenido })
  });
}

export function obtenerMisNotas(): Promise<NotaClinicaDetalle[]> {
  return peticion<NotaClinicaDetalle[]>('/api/citas/notas');
}

export function eliminarNota(notaId: string): Promise<void> {
  return peticion<void>(`/api/citas/notas/${notaId}`, { method: 'DELETE' });
}

export function actualizarNota(notaId: string, contenido: string): Promise<void> {
  return peticion<void>(`/api/citas/notas/${notaId}`, {
    method: 'PUT',
    body: JSON.stringify({ contenido })
  });
}
