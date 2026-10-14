import { randomUUID } from "crypto";
import { Cita } from "../../domain/entities/Cita";
import { CitaRepository } from "../../domain/ports/CitaRepository";
import { PacienteRepository } from "../../domain/ports/PacienteRepository";

export interface CrearCitaRetenidaDTO {
  usuarioId: string; // el ID del usuario (viene del JWT)
  odontologoId: string;
  servicioId: number;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
}

const MINUTOS_RETENCION = 15;

export class CrearCitaRetenida {
  constructor(
    private citaRepo: CitaRepository,
    private pacienteRepo: PacienteRepository,
  ) {}

  async ejecutar(data: CrearCitaRetenidaDTO): Promise<Cita> {
    // 1. Buscar el paciente asociado al usuario
    const paciente = await this.pacienteRepo.buscarPorUsuarioId(data.usuarioId);
    if (!paciente) {
      throw new Error("No se encontró el perfil de paciente para este usuario");
    }

    // 2. Verificar que el turno no esté ocupado (RNF08)
    const ocupado = await this.citaRepo.buscarTurnoOcupado(
      data.odontologoId,
      data.fecha,
      data.horaInicio,
      data.horaFin,
    );

    if (ocupado) {
      throw new Error("El turno ya está ocupado o retenido");
    }

    // 3. Crear la cita con el paciente.id correcto
    const fechaExpiracion = new Date(
      Date.now() + MINUTOS_RETENCION * 60 * 1000,
    );

    const cita = new Cita(
      randomUUID(),
      paciente.id, // <-- ID de la tabla pacientes
      data.odontologoId,
      data.servicioId,
      data.fecha,
      data.horaInicio,
      data.horaFin,
      2, // retenido
      this.generarCodigo(),
      fechaExpiracion,
    );

    const creada = await this.citaRepo.crear(cita);

    await this.citaRepo.registrarHistorial(
      creada.id,
      null,
      2,
      data.usuarioId,
      "Retención inicial",
    );

    return creada;
  }

  private generarCodigo(): string {
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `AURA-${random}`;
  }
}
