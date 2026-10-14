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

export interface Pago {
  id: string;
  citaId: string;
  monto: number;
  estado: EstadoPago;
  moneda: string;
  referenciaQr: string | null;
}

export interface PagoDetalle extends Pago {
  pacienteNombre: string;
  pacienteDni: string;
  servicio: string | null;
  fechaCita: string;
  estadoCita: EstadoCita;
}
