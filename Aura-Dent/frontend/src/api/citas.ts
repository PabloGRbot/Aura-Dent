import { Cita, ReservaTemporal } from '../tipos';
import { peticion } from './cliente';

export function crearCita(
  fecha: string,
  servicio: string,
  duracionMinutos = 30,
  odontologoId?: string | null
): Promise<Cita> {
  return peticion<Cita>('/api/citas', {
    method: 'POST',
    body: JSON.stringify({ fecha, servicio, duracionMinutos, odontologoId })
  });
}

export function obtenerMisCitas(): Promise<Cita[]> {
  return peticion<Cita[]>('/api/citas/mis-citas');
}

export function pagarCita(citaId: string, referenciaQr: string): Promise<Cita> {
  return peticion<Cita>(`/api/citas/${citaId}/pagar`, {
    method: 'POST',
    body: JSON.stringify({ referenciaQr })
  });
}

export interface SolicitudReserva {
  pacienteId: string;
  odontologoId: string;
  fecha: string;
  duracionMinutos: number;
}

export function crearReserva(solicitud: SolicitudReserva): Promise<ReservaTemporal> {
  return peticion<ReservaTemporal>('/api/reservas', {
    method: 'POST',
    body: JSON.stringify(solicitud)
  });
}

export function confirmarCita(reservaId: string, pagoId: string): Promise<void> {
  return peticion<void>(`/api/reservas/${reservaId}/confirmar`, {
    method: 'POST',
    body: JSON.stringify({ pagoId })
  });
}
