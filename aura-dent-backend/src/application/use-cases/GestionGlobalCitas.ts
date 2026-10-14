import { Cita } from "../../domain/entities/Cita";
import { CitaRepository } from "../../domain/ports/CitaRepository";

export class GestionGlobalCitas {
  constructor(private citaRepo: CitaRepository) {}

  async listarTodas(): Promise<Cita[]> {
    return this.citaRepo.listarTodas();
  }

  async cancelarEnNombre(citaId: string, motivo: string): Promise<Cita> {
    const cita = await this.citaRepo.buscarPorId(citaId);
    if (!cita) throw new Error("Cita no encontrada");

    cita.estadoId = 4; // cancelada
    await this.citaRepo.actualizar(cita);
    await this.citaRepo.registrarHistorial(
      cita.id,
      null,
      4,
      null,
      `Cancelada por recepción: ${motivo}`,
    );
    return cita;
  }

  async reprogramarEnNombre(
    citaId: string,
    fecha: Date,
    horaInicio: string,
    horaFin: string,
  ): Promise<Cita> {
    const cita = await this.citaRepo.buscarPorId(citaId);
    if (!cita) throw new Error("Cita no encontrada");

    cita.fecha = fecha;
    cita.horaInicio = horaInicio;
    cita.horaFin = horaFin;
    await this.citaRepo.actualizar(cita);
    await this.citaRepo.registrarHistorial(
      cita.id,
      null,
      cita.estadoId,
      null,
      "Reprogramada por recepción",
    );
    return cita;
  }
}
