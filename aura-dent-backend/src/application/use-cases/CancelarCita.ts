import { Cita } from "../../domain/entities/Cita";
import { CitaRepository } from "../../domain/ports/CitaRepository";

export class CancelarCita {
  constructor(private citaRepo: CitaRepository) {}

  async ejecutar(
    citaId: string,
    usuarioId: string,
    motivo: string,
  ): Promise<Cita> {
    const cita = await this.citaRepo.buscarPorId(citaId);
    if (!cita) throw new Error("Cita no encontrada");

    // Solo se pueden cancelar citas confirmadas
    if (cita.estadoId !== 3) {
      throw new Error("Solo se pueden cancelar citas confirmadas");
    }

    // Validar política: al menos 24h de anticipación
    const fechaCita = new Date(cita.fecha);
    const horasAntelacion =
      (fechaCita.getTime() - Date.now()) / (1000 * 60 * 60);
    if (horasAntelacion < 24) {
      throw new Error("Debes cancelar con al menos 24 horas de anticipación");
    }

    cita.estadoId = 4; // cancelada
    await this.citaRepo.actualizar(cita);
    await this.citaRepo.registrarHistorial(
      cita.id,
      3,
      4,
      usuarioId,
      motivo || "Cancelada por el usuario",
    );

    return cita;
  }
}
