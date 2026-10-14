import { Cita } from "../../domain/entities/Cita";
import { CitaRepository } from "../../domain/ports/CitaRepository";
import { OdontologoRepository } from "../../domain/ports/OdontologoRepository";

/**
 * RF12: el odontólogo consulta su agenda del día. El id recibido puede ser el
 * del usuario (JWT / frontend) o el del odontólogo; se resuelve en ambos casos.
 */
export class ListarAgendaOdontologo {
  constructor(
    private citaRepo: CitaRepository,
    private odontologoRepo: OdontologoRepository,
  ) {}

  async ejecutar(idOrUsuarioId: string, fecha: Date): Promise<Cita[]> {
    const odontologo = await this.resolverOdontologo(idOrUsuarioId);
    if (!odontologo) return [];
    return this.citaRepo.listarPorOdontologoYFecha(odontologo.id, fecha);
  }

  private async resolverOdontologo(id: string) {
    if (!id) return null;
    const porUsuario = await this.odontologoRepo.buscarPorUsuarioId(id);
    if (porUsuario) return porUsuario;
    return this.odontologoRepo.buscarPorId(id);
  }
}
