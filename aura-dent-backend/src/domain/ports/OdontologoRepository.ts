import { Odontologo } from "../entities/Odontologo";

export interface OdontologoRepository {
  crear(o: Odontologo): Promise<Odontologo>;
  buscarPorId(id: string): Promise<Odontologo | null>;
  buscarPorUsuarioId(usuarioId: string): Promise<Odontologo | null>;
  listar(): Promise<any[]>;
  asignarEspecialidad(
    odontologoId: string,
    especialidadId: number,
  ): Promise<void>;
}
