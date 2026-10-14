import {
  BloqueDisponibilidad,
  DisponibilidadRepository,
} from "../../domain/ports/DisponibilidadRepository";

/**
 * Caso de uso RF09 / RD02: gestión de la disponibilidad horaria médica.
 */
export class GestionarDisponibilidad {
  constructor(private disponibilidadRepo: DisponibilidadRepository) {}

  async listar(odontologoId: string): Promise<BloqueDisponibilidad[]> {
    if (!odontologoId) throw new Error("Odontólogo no especificado");
    return this.disponibilidadRepo.listarPorOdontologo(odontologoId);
  }

  async crear(
    odontologoId: string,
    data: { diaSemana: number; horaInicio: string; horaFin: string },
  ): Promise<BloqueDisponibilidad> {
    const dia = Number(data.diaSemana);
    if (!odontologoId) throw new Error("Odontólogo no especificado");
    if (!Number.isInteger(dia) || dia < 1 || dia > 7) {
      throw new Error("El día de la semana debe estar entre 1 y 7");
    }
    if (!data.horaInicio || !data.horaFin) {
      throw new Error("La hora de inicio y fin son obligatorias");
    }
    if (data.horaInicio >= data.horaFin) {
      throw new Error("La hora de inicio debe ser menor que la hora de fin");
    }
    return this.disponibilidadRepo.crear(odontologoId, {
      diaSemana: dia,
      horaInicio: data.horaInicio,
      horaFin: data.horaFin,
    });
  }

  async desactivar(id: number): Promise<void> {
    return this.disponibilidadRepo.eliminar(id);
  }
}
