import { Cita } from "../../domain/entities/Cita";
import { CitaRepository } from "../../domain/ports/CitaRepository";
import { PacienteRepository } from "../../domain/ports/PacienteRepository";

/**
 * RF10: el paciente consulta su historial de citas. El JWT entrega el id del
 * usuario, por lo que primero se resuelve el perfil de paciente asociado.
 */
export class ListarCitasPaciente {
  constructor(
    private citaRepo: CitaRepository,
    private pacienteRepo: PacienteRepository,
  ) {}

  async ejecutar(usuarioId: string): Promise<Cita[]> {
    const paciente = await this.pacienteRepo.buscarPorUsuarioId(usuarioId);
    if (!paciente) return [];
    return this.citaRepo.listarPorPaciente(paciente.id);
  }
}
