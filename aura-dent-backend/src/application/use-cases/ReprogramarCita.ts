import { Cita } from "../../domain/entities/Cita";
import { CitaRepository } from "../../domain/ports/CitaRepository";

export interface ReprogramarCitaDTO {
  citaId: string;
  usuarioId: string;
  nuevaFecha: Date;
  nuevaHoraInicio: string;
  nuevaHoraFin: string;
}

export class ReprogramarCita {
  constructor(private citaRepo: CitaRepository) {}

  async ejecutar(data: ReprogramarCitaDTO): Promise<Cita> {
    const cita = await this.citaRepo.buscarPorId(data.citaId);
    if (!cita) throw new Error("Cita no encontrada");

    if (cita.estadoId !== 3) {
      throw new Error("Solo se pueden reprogramar citas confirmadas");
    }

    // Verificar que el nuevo turno no esté ocupado
    const ocupado = await this.citaRepo.buscarTurnoOcupado(
      cita.odontologoId,
      data.nuevaFecha,
      data.nuevaHoraInicio,
      data.nuevaHoraFin,
    );
    if (ocupado && ocupado.id !== cita.id) {
      throw new Error("El nuevo turno ya está ocupado");
    }

    const fechaAnterior = cita.fecha;
    cita.fecha = data.nuevaFecha;
    cita.horaInicio = data.nuevaHoraInicio;
    cita.horaFin = data.nuevaHoraFin;

    await this.citaRepo.actualizar(cita);
    await this.citaRepo.registrarHistorial(
      cita.id,
      3,
      3,
      data.usuarioId,
      `Reprogramada de ${fechaAnterior} a ${data.nuevaFecha}`,
    );

    return cita;
  }
}
