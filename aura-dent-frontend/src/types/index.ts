export type RolNombre =
  | "Paciente"
  | "Recepcion"
  | "Odontologo"
  | "Administrador";
export type EstadoCita =
  | "pendiente_pago"
  | "retenido"
  | "confirmada"
  | "cancelada"
  | "expirada"
  | "atendida";

export interface Usuario {
  id: string;
  rolId: number;
  nombres: string;
  apellidos: string;
  documentoIdentidad: string;
  telefono: string;
  correo: string;
  activo: boolean;
}

export interface Cita {
  id: string;
  pacienteId: string;
  odontologoId: string;
  servicioId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estadoId: number;
  codigoReserva: string;
  fechaExpiracion: string | null;
}

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  montoReserva: number;
  especialidadId: number | null;
  activo: boolean;
}

export interface Pago {
  id: string;
  citaId: string;
  monto: number;
  metodoPago: string | null;
  codigoOperacion: string | null;
  estadoId: number;
}

export interface MensajeChat {
  rol: "user" | "ia";
  texto: string;
  timestamp?: string;
}
