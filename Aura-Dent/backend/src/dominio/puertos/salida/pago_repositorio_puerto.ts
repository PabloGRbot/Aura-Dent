import { EstadoCita } from '../../modelos/cita_medica';
import { Pago } from '../../modelos/pago';

export interface PagoDetalle {
  pago: Pago;
  pacienteNombre: string;
  pacienteDni: string;
  servicio: string | null;
  fechaCita: Date;
  estadoCita: EstadoCita;
}

export interface PagoRepositorioPuerto {
  buscarPorId(id: string): Promise<Pago | null>;
  buscarPorCitaId(citaId: string): Promise<Pago | null>;
  buscarPagosPorCitaId(citaId: string): Promise<Pago[]>;
  listar(): Promise<PagoDetalle[]>;
  guardar(pago: Pago): Promise<void>;
  actualizar(pago: Pago): Promise<void>;
}
