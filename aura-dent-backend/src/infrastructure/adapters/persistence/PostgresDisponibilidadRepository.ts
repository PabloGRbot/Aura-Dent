import { Pool } from "pg";
import {
  BloqueDisponibilidad,
  DisponibilidadRepository,
} from "../../../domain/ports/DisponibilidadRepository";

export class PostgresDisponibilidadRepository
  implements DisponibilidadRepository
{
  constructor(private pool: Pool) {}

  async listarPorOdontologo(
    odontologoId: string,
  ): Promise<BloqueDisponibilidad[]> {
    const { rows } = await this.pool.query(
      `SELECT id,
              odontologo_id AS "odontologoId",
              dia_semana AS "diaSemana",
              hora_inicio AS "horaInicio",
              hora_fin AS "horaFin",
              activo
       FROM disponibilidad_horaria
       WHERE odontologo_id = $1 AND activo = true
       ORDER BY dia_semana, hora_inicio`,
      [odontologoId],
    );
    return rows as BloqueDisponibilidad[];
  }

  async crear(
    odontologoId: string,
    data: { diaSemana: number; horaInicio: string; horaFin: string },
  ): Promise<BloqueDisponibilidad> {
    const { rows } = await this.pool.query(
      `INSERT INTO disponibilidad_horaria
        (odontologo_id, dia_semana, hora_inicio, hora_fin, activo)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id,
                 odontologo_id AS "odontologoId",
                 dia_semana AS "diaSemana",
                 hora_inicio AS "horaInicio",
                 hora_fin AS "horaFin",
                 activo`,
      [odontologoId, data.diaSemana, data.horaInicio, data.horaFin],
    );
    return rows[0] as BloqueDisponibilidad;
  }

  async eliminar(id: number): Promise<void> {
    await this.pool.query(
      "UPDATE disponibilidad_horaria SET activo = false WHERE id = $1",
      [id],
    );
  }
}
