import { Pago } from '../../modelos/pago';
import { CitaAgendaItem } from '../salida/cita_repositorio_puerto';
import { PagoDetalle } from '../salida/pago_repositorio_puerto';

export interface ListarCitasTodasPuerto {
  listar(): Promise<CitaAgendaItem[]>;
}

export interface ListarPagosPuerto {
  listar(): Promise<PagoDetalle[]>;
}

export interface ConfirmarPagoPuerto {
  confirmar(pagoId: string): Promise<Pago>;
}

export interface RechazarPagoPuerto {
  rechazar(pagoId: string): Promise<Pago>;
}
