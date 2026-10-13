import { Paciente } from "../entities/Paciente";

export interface PacienteRepository {
  crear(paciente: Paciente): Promise<Paciente>;
  buscarPorId(id: string): Promise<Paciente | null>;
  buscarPorUsuarioId(usuarioId: string): Promise<Paciente | null>;
  listar(): Promise<Paciente[]>;
  actualizar(paciente: Paciente): Promise<Paciente>;
}
