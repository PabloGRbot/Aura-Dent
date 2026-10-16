export type Rol = 'Paciente' | 'Recepcion' | 'Odontologo' | 'Administrador';

export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  dniCe?: string;
  fechaNacimiento?: string | null;
  alergias?: string | null;
  rol: Rol;
}

export interface SesionAutenticacion {
  token: string;
  usuario: Usuario;
}

export interface ReservaTemporal {
  reservaId: string;
  expiraEn: string;
  monto: number;
}

export type EstadoCita =
  | 'TEMPORAL'
  | 'PENDIENTE_PAGO'
  | 'CONFIRMADA'
  | 'CANCELADA'
  | 'ATENDIDA';

export interface Cita {
  id: string;
  pacienteId: string;
  odontologoId: string | null;
  fecha: string;
  duracionMinutos: number;
  servicio: string | null;
  estado: EstadoCita;
  pagoId: string | null;
  pago: Pago | null;
}

export interface CitaAgenda {
  id: string;
  pacienteNombre: string;
  pacienteDni: string;
  odontologoId: string | null;
  fecha: string;
  duracionMinutos: number;
  servicio: string | null;
  estado: EstadoCita;
}

export interface NotaClinica {
  id: string;
  citaId: string;
  odontologoId: string;
  contenido: string;
  creadoEn: string;
}

export interface NotaClinicaDetalle extends NotaClinica {
  pacienteNombre: string;
  servicio: string | null;
}

export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN' | 'QR';
export type TipoPago = 'ADELANTO' | 'SALDO' | 'UNICO';

export interface Pago {
  id: string;
  citaId: string;
  monto: number;
  estado: EstadoPago;
  moneda: string;
  metodo: MetodoPago;
  tipo: TipoPago;
  referenciaQr: string | null;
  pagadoEn: string | null;
}

export interface PagoDetalle extends Pago {
  pacienteNombre: string;
  pacienteDni: string;
  servicio: string | null;
  fechaCita: string;
  estadoCita: EstadoCita;
}

export type TipoComprobante = 'BOLETA' | 'FACTURA';
export type EstadoComprobante = 'EMITIDO' | 'ANULADO';

export interface Comprobante {
  id: string;
  pagoId: string;
  citaId: string;
  tipo: TipoComprobante;
  serie: string;
  correlativo: number;
  rucCliente: string | null;
  razonSocial: string | null;
  subtotal: number;
  igv: number;
  total: number;
  moneda: string;
  estado: EstadoComprobante;
  emitidoEn: string;
  anuladoEn: string | null;
}
