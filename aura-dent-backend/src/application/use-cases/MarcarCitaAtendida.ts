import { Cita } from "../../domain/entities/Cita";
import { CitaRepository } from "../../domain/ports/CitaRepository";
import { OdontologoRepository } from "../../domain/ports/OdontologoRepository";

/**
 * RF13: el odontólogo marca una cita como atendida. El JWT entrega el id del
 * usuario, por lo que se resuelve el odontólogo asociado antes de validar.
 */
export class MarcarCitaAtendida {
  constructor(
    private citaRepo: CitaRepository,
    private odontologoRepo: OdontologoRepository,
  ) {}

  async ejecutar(citaId: string, usuarioId: string): Promise<Cita> {
    const cita = await this.citaRepo.buscarPorId(citaId);
    if (!cita) throw new Error("Cita no encontrada");

    const odontologo = await this.odontologoRepo.buscarPorUsuarioId(usuarioId);
    if (!odontologo || cita.odontologoId !== odontologo.id) {
      throw new Error("No tienes permiso para modificar esta cita");
    }

    if (cita.estadoId !== 3) {
      throw new Error(
        "La cita debe estar confirmada para marcarla como atendida",
      );
    }

    cita.estadoId = 6; // atendida
    await this.citaRepo.actualizar(cita);
    await this.citaRepo.registrarHistorial(
      cita.id,
      3,
      6,
      usuarioId,
      "Atención completada",
    );

    return cita;
  }
}
