import { Comprobante, TipoComprobante } from '../../modelos/comprobante';

export interface ComprobanteRepositorioPuerto {
  guardar(comprobante: Comprobante): Promise<void>;
  buscarPorId(id: string): Promise<Comprobante | null>;
  buscarPorPagoId(pagoId: string): Promise<Comprobante | null>;
  listar(): Promise<Comprobante[]>;
  listarPorPaciente(pacienteId: string): Promise<Comprobante[]>;
  siguienteCorrelativo(tipo: TipoComprobante, serie: string): Promise<number>;
  anular(id: string): Promise<void>;
}

export interface ListarComprobantesPuerto {
  listar(): Promise<Comprobante[]>;
}

export interface ListarComprobantesPacientePuerto {
  listarPorPaciente(pacienteId: string): Promise<Comprobante[]>;
}

export interface ObtenerComprobantePuerto {
  obtener(id: string): Promise<Comprobante | null>;
}

export interface EmitirComprobantePuerto {
  emitir(solicitud: SolicitudEmitirComprobante): Promise<Comprobante>;
}

export interface AnularComprobantePuerto {
  anular(id: string): Promise<void>;
}

export interface SolicitudEmitirComprobante {
  pagoId: string;
  citaId: string;
  tipo: TipoComprobante;
  serie: string;
  rucCliente?: string | null;
  razonSocial?: string | null;
}
