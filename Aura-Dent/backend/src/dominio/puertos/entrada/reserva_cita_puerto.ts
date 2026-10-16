import { CitaMedica } from '../../modelos/cita_medica';
import { Pago } from '../../modelos/pago';

export interface SolicitudReserva {
  pacienteId: string;
  odontologoId: string;
  fecha: Date;
  duracionMinutos: number;
}

export interface ReservaTemporal {
  reservaId: string;
  expiraEn: Date;
  monto: number;
}

export interface CrearReservaTemporalPuerto {
  crearReservaTemporal(solicitud: SolicitudReserva): Promise<ReservaTemporal>;
}

export interface ConfirmarCitaPuerto {
  confirmarCita(reservaId: string, pagoId: string): Promise<CitaMedica>;
}

export interface SolicitudCita {
  pacienteId: string;
  fecha: Date;
  duracionMinutos: number;
  servicio: string | null;
  odontologoId?: string | null;
}

export interface ResultadoCrearCita {
  cita: CitaMedica;
  pago: Pago;
}

export interface CrearCitaPuerto {
  crearCita(solicitud: SolicitudCita): Promise<ResultadoCrearCita>;
}

export interface CitaConPago {
  cita: CitaMedica;
  pago: Pago | null;
}

export interface ListarCitasPacientePuerto {
  listarPorPaciente(pacienteId: string): Promise<CitaConPago[]>;
}

export interface PagarCitaPuerto {
  pagarCita(pacienteId: string, citaId: string, referenciaQr: string): Promise<CitaConPago>;
}
