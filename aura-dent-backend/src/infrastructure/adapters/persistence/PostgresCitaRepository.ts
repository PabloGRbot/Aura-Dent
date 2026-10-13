import { Pool } from "pg";
import { Cita } from "../../../domain/entities/Cita";
import { CitaRepository } from "../../../domain/ports/CitaRepository";

export class PostgresCitaRepository implements CitaRepository {
  constructor(private pool: Pool) {}

  async crear(c: Cita): Promise<Cita> {
    const query = `
      INSERT INTO citas
        (id, paciente_id, odontologo_id, servicio_id, fecha, hora_inicio, hora_fin,
         estado_id, codigo_reserva, fecha_expiracion)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `;
    const values = [
      c.id,
      c.pacienteId,
      c.odontologoId,
      c.servicioId,
      c.fecha,
      c.horaInicio,
      c.horaFin,
      c.estadoId,
      c.codigoReserva,
      c.fechaExpiracion,
    ];
    const { rows } = await this.pool.query(query, values);
    return this.map(rows[0]);
  }

  async buscarPorId(id: string): Promise<Cita | null> {
    const { rows } = await this.pool.query(
      "SELECT * FROM citas WHERE id = $1",
      [id],
    );
    return rows[0] ? this.map(rows[0]) : null;
  }

  async buscarPorCodigo(codigo: string): Promise<Cita | null> {
    const { rows } = await this.pool.query(
      "SELECT * FROM citas WHERE codigo_reserva = $1",
      [codigo],
    );
    return rows[0] ? this.map(rows[0]) : null;
  }

  async listarPorPaciente(pacienteId: string): Promise<Cita[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM citas WHERE paciente_id = $1 ORDER BY fecha DESC, hora_inicio DESC",
      [pacienteId],
    );
    return rows.map((r) => this.map(r));
  }

  async listarPorOdontologoYFecha(
    odontologoId: string,
    fecha: Date,
  ): Promise<Cita[]> {
    const { rows } = await this.pool.query(
      `SELECT * FROM citas
       WHERE odontologo_id = $1 AND fecha = $2
       ORDER BY hora_inicio`,
      [odontologoId, fecha],
    );
    return rows.map((r) => this.map(r));
  }

  async listarTodas(): Promise<Cita[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM citas ORDER BY fecha DESC, hora_inicio",
    );
    return rows.map((r) => this.map(r));
  }

  async actualizar(c: Cita): Promise<Cita> {
    await this.pool.query(
      `UPDATE citas
       SET estado_id=$1, fecha=$2, hora_inicio=$3, hora_fin=$4,
           fecha_expiracion=$5, updated_at=NOW()
       WHERE id=$6`,
      [c.estadoId, c.fecha, c.horaInicio, c.horaFin, c.fechaExpiracion, c.id],
    );
    return c;
  }

  async buscarTurnoOcupado(
    odontologoId: string,
    fecha: Date,
    horaInicio: string,
    horaFin: string,
  ): Promise<Cita | null> {
    const { rows } = await this.pool.query(
      `SELECT * FROM citas
       WHERE odontologo_id = $1
         AND fecha = $2
         AND estado_id IN (2, 3, 6)
         AND (hora_inicio < $4 AND hora_fin > $3)`,
      [odontologoId, fecha, horaInicio, horaFin],
    );
    return rows[0] ? this.map(rows[0]) : null;
  }

  async registrarHistorial(
    citaId: string,
    estadoAnterior: number | null,
    estadoNuevo: number,
    usuarioId: string | null,
    motivo: string | null,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO historial_estados_cita
        (cita_id, estado_anterior_id, estado_nuevo_id, usuario_id, motivo)
       VALUES ($1,$2,$3,$4,$5)`,
      [citaId, estadoAnterior, estadoNuevo, usuarioId, motivo],
    );
  }

  private map(r: any): Cita {
    return new Cita(
      r.id,
      r.paciente_id,
      r.odontologo_id,
      r.servicio_id,
      r.fecha,
      r.hora_inicio,
      r.hora_fin,
      r.estado_id,
      r.codigo_reserva,
      r.fecha_expiracion,
    );
  }
}
