import { CitaAgenda, Pago, PagoDetalle, Comprobante, MetodoPago } from '../tipos';
import { peticion } from './cliente';

export interface PacienteRecepcion {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  dniCe: string;
  fechaNacimiento?: string | null;
  alergias?: string | null;
  rol: string;
  odontologoAsignadoId: string | null;
  passwordTemporal?: string;
}

export interface DatosPaciente {
  nombres: string;
  apellidos: string;
  email: string;
  dniCe: string;
  fechaNacimiento?: string | null;
  alergias?: string | null;
  odontologoAsignadoId?: string | null;
}

export interface DatosCitaPresencial {
  pacienteId: string;
  fecha: string;
  hora?: string;
  duracionMinutos?: number;
  servicio?: string | null;
  odontologoId?: string | null;
}

export function listarCitasRecepcion(pagina=1,q=''): Promise<CitaAgenda[]> {
  return peticion<CitaAgenda[]>(`/api/recepcion/citas?pagina=${pagina}&q=${encodeURIComponent(q)}`);
}

export function listarPagosRecepcion(pagina=1,q=''): Promise<PagoDetalle[]> {
  return peticion<PagoDetalle[]>(`/api/recepcion/pagos?pagina=${pagina}&q=${encodeURIComponent(q)}`);
}

export function listarPacientesRecepcion(pagina=1,q='',odontologoFiltro=''): Promise<PacienteRecepcion[]> {
  return peticion<PacienteRecepcion[]>(`/api/recepcion/pacientes?pagina=${pagina}&q=${encodeURIComponent(q)}&odontologoFiltro=${encodeURIComponent(odontologoFiltro)}`);
}

export function crearPacienteRecepcion(datos: DatosPaciente): Promise<PacienteRecepcion & { passwordTemporal: string }> {
  return peticion<PacienteRecepcion & { passwordTemporal: string }>('/api/recepcion/pacientes', {
    method: 'POST',
    body: JSON.stringify(datos)
  });
}

export function actualizarPacienteRecepcion(id: string, datos: DatosPaciente): Promise<PacienteRecepcion> {
  return peticion<PacienteRecepcion>(`/api/recepcion/pacientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  });
}

export function eliminarPacienteRecepcion(id: string): Promise<void> {
  return peticion<void>(`/api/recepcion/pacientes/${id}`, { method: 'DELETE' });
}

export function crearCitaRecepcion(datos: DatosCitaPresencial): Promise<any> {
  return peticion<any>('/api/recepcion/citas', {
    method: 'POST',
    body: JSON.stringify(datos)
  });
}

export function confirmarPagoRecepcion(pagoId: string): Promise<Pago> {
  return peticion<Pago>(`/api/recepcion/pagos/${pagoId}/confirmar`, { method: 'POST' });
}

export function rechazarPagoRecepcion(pagoId: string): Promise<Pago> {
  return peticion<Pago>(`/api/recepcion/pagos/${pagoId}/rechazar`, { method: 'POST' });
}

export interface SolicitudEmitirComprobante {
  pagoId: string;
  citaId: string;
  tipo: 'BOLETA' | 'FACTURA';
  serie?: string;
  rucCliente?: string | null;
  razonSocial?: string | null;
}

export function listarComprobantesRecepcion(pagina=1): Promise<Comprobante[]> {
  return peticion<Comprobante[]>(`/api/recepcion/comprobantes?pagina=${pagina}`);
}

export function listarMisComprobantes(pagina=1): Promise<Comprobante[]> {
  return peticion<Comprobante[]>(`/api/comprobantes/mis-comprobantes?pagina=${pagina}`);
}

export function listarComprobantesAdmin(pagina=1): Promise<Comprobante[]> {
  return peticion<Comprobante[]>(`/api/comprobantes?pagina=${pagina}`);
}

export function obtenerComprobante(id: string): Promise<Comprobante> {
  return peticion<Comprobante>(`/api/comprobantes/${id}`);
}

export function anularComprobante(id: string): Promise<void> {
  return peticion<void>(`/api/comprobantes/${id}/anular`, { method: 'POST' });
}

export interface DatosPagoManual {
  citaId: string;
  monto: number;
  metodo: MetodoPago;
  tipo?: TipoPago;
}

export type TipoPago = 'ADELANTO' | 'SALDO' | 'UNICO';

export function registrarPagoManual(datos: DatosPagoManual): Promise<Pago> {
  return peticion<Pago>('/api/recepcion/pagos/manual', {
    method: 'POST',
    body: JSON.stringify(datos)
  });
}

export function emitirComprobante(solicitud: SolicitudEmitirComprobante): Promise<Comprobante> {
  return peticion<Comprobante>('/api/recepcion/comprobantes', {
    method: 'POST',
    body: JSON.stringify(solicitud)
  });
}
