import { Comprobante } from '../../modelos/comprobante';

export interface ComprobanteSalidaPuerto {
  guardar(comprobante: Comprobante): Promise<void>;
  buscarPorId(id: string): Promise<Comprobante | null>;
  buscarPorPagoId(pagoId: string): Promise<Comprobante | null>;
  listar(): Promise<Comprobante[]>;
  listarPorPaciente(pacienteId: string): Promise<Comprobante[]>;
  siguienteCorrelativo(tipo: string, serie: string): Promise<number>;
  anular(id: string): Promise<void>;
}
