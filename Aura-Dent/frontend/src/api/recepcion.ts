import { CitaAgenda, Pago, PagoDetalle } from '../tipos';
import { peticion } from './cliente';

export function listarCitasRecepcion(): Promise<CitaAgenda[]> {
  return peticion<CitaAgenda[]>('/api/recepcion/citas');
}

export function listarPagosRecepcion(): Promise<PagoDetalle[]> {
  return peticion<PagoDetalle[]>('/api/recepcion/pagos');
}

export function confirmarPagoRecepcion(pagoId: string): Promise<Pago> {
  return peticion<Pago>(`/api/recepcion/pagos/${pagoId}/confirmar`, { method: 'POST' });
}

export function rechazarPagoRecepcion(pagoId: string): Promise<Pago> {
  return peticion<Pago>(`/api/recepcion/pagos/${pagoId}/rechazar`, { method: 'POST' });
}
