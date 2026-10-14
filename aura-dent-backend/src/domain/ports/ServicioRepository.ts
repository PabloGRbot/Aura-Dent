import { Servicio } from "../entities/Servicio";

export interface ServicioRepository {
  crear(s: Servicio): Promise<Servicio>;
  listar(): Promise<Servicio[]>;
  buscarPorId(id: number): Promise<Servicio | null>;
  actualizar(s: Servicio): Promise<Servicio>;
  desactivar(id: number): Promise<void>;
}
