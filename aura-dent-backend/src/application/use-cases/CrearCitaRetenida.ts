import { randomUUID } from "crypto";
import { Cita } from "../../domain/entities/Cita";
import { CitaRepository } from "../../domain/ports/CitaRepository";

export interface CrearCitaRetenidaDTO {
  pacienteId: string;
  odontologoId: string;
  servicioId: number;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
}

const MINUTOS_RETENCION = 15;

export class CrearCitaRetenida {
  constructor(private citaRepo: CitaRepository) {}

  async ejecutar(data: CrearCitaRetenidaDTO): Promise<Cita> {
    // RNF08: Verificar que el turno no esté ocupado
    const ocupado = await this.citaRepo.buscarTurnoOcupado(
      data.odontologoId,
      data.fecha,
      data.horaInicio,
      data.horaFin,
    );

    if (ocupado) {
      throw new Error("El turno ya está ocupado o retenido");
    }

    const fechaExpiracion = new Date(
      Date.now() + MINUTOS_RETENCION * 60 * 1000,
    );

    const cita = new Cita(
      randomUUID(),
      data.pacienteId,
      data.odontologoId,
      data.servicioId,
      data.fecha,
      data.horaInicio,
      data.horaFin,
      2, // Estado "retenido"
      this.generarCodigo(),
      fechaExpiracion,
    );

    const creada = await this.citaRepo.crear(cita);

    await this.citaRepo.registrarHistorial(
      creada.id,
      null,
      2,
      data.pacienteId,
      "Retención inicial",
    );

    return creada;
  }

  private generarCodigo(): string {
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `AURA-${random}`;
  }
}
