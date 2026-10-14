import { Pool } from "pg";
import { Odontologo } from "../../../domain/entities/Odontologo";
import { OdontologoRepository } from "../../../domain/ports/OdontologoRepository";

export class PostgresOdontologoRepository implements OdontologoRepository {
  constructor(private pool: Pool) {}

  async crear(o: Odontologo): Promise<Odontologo> {
    const { rows } = await this.pool.query(
      `INSERT INTO odontologos (id, usuario_id, numero_colegiatura)
       VALUES ($1,$2,$3) RETURNING *`,
      [o.id, o.usuarioId, o.numeroColegiatura],
    );
    return new Odontologo(
      rows[0].id,
      rows[0].usuario_id,
      rows[0].numero_colegiatura,
    );
  }

  async buscarPorId(id: string): Promise<Odontologo | null> {
    const { rows } = await this.pool.query(
      "SELECT * FROM odontologos WHERE id = $1",
      [id],
    );
    return rows[0]
      ? new Odontologo(
          rows[0].id,
          rows[0].usuario_id,
          rows[0].numero_colegiatura,
        )
      : null;
  }

  async buscarPorUsuarioId(usuarioId: string): Promise<Odontologo | null> {
    const { rows } = await this.pool.query(
      "SELECT * FROM odontologos WHERE usuario_id = $1",
      [usuarioId],
    );
    return rows[0]
      ? new Odontologo(
          rows[0].id,
          rows[0].usuario_id,
          rows[0].numero_colegiatura,
        )
      : null;
  }

  async listar(): Promise<any[]> {
    const { rows } = await this.pool.query(`
      SELECT o.id, o.numero_colegiatura, u.nombres, u.apellidos, u.correo
      FROM odontologos o
      JOIN usuarios u ON u.id = o.usuario_id
      WHERE u.activo = true
      ORDER BY u.nombres
    `);
    return rows;
  }

  async asignarEspecialidad(
    odontologoId: string,
    especialidadId: number,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO odontologo_especialidad (odontologo_id, especialidad_id)
       VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [odontologoId, especialidadId],
    );
  }
}
