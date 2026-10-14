import { EstadoCita, EstadoPago } from './tipos';

export const ETIQUETA_ESTADO: Record<EstadoCita, string> = {
  TEMPORAL: 'Temporal',
  PENDIENTE_PAGO: 'Pendiente de pago',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  ATENDIDA: 'Atendida'
};

export const ETIQUETA_PAGO: Record<EstadoPago, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado'
};

export function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleString('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatearFechaCorta(fechaIso: string): string {
  return new Date(fechaIso).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
