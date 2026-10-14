import { Pago } from "../entities/Pago";

export interface PagoRepository {
  crear(p: Pago): Promise<Pago>;
  buscarPorId(id: string): Promise<Pago | null>;
  buscarPorCita(citaId: string): Promise<Pago | null>;
  listar(): Promise<Pago[]>;
  actualizar(p: Pago): Promise<Pago>;
  registrarHistorial(
    pagoId: string,
    estadoAnterior: number | null,
    estadoNuevo: number,
    motivo: string | null,
  ): Promise<void>;
}
