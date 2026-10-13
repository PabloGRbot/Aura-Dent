import { Pool } from "pg";
import { Paciente } from "../../../domain/entities/Paciente";
import { PacienteRepository } from "../../../domain/ports/PacienteRepository";

export class PostgresPacienteRepository implements PacienteRepository {
  constructor(private pool: Pool) {}

  async crear(p: Paciente): Promise<Paciente> {
    const query = `
      INSERT INTO pacientes (id, usuario_id, fecha_nacimiento, direccion, alergias)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `;
    const values = [
      p.id,
      p.usuarioId,
      p.fechaNacimiento,
      p.direccion,
      p.alergias,
    ];
    const { rows } = await this.pool.query(query, values);
    return this.map(rows[0]);
  }

  async buscarPorId(id: string): Promise<Paciente | null> {
    const { rows } = await this.pool.query(
      "SELECT * FROM pacientes WHERE id = $1",
      [id],
    );
    return rows[0] ? this.map(rows[0]) : null;
  }

  async buscarPorUsuarioId(usuarioId: string): Promise<Paciente | null> {
    const { rows } = await this.pool.query(
      "SELECT * FROM pacientes WHERE usuario_id = $1",
      [usuarioId],
    );
    return rows[0] ? this.map(rows[0]) : null;
  }

  async listar(): Promise<Paciente[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM pacientes ORDER BY created_at DESC",
    );
    return rows.map((r) => this.map(r));
  }

  async actualizar(p: Paciente): Promise<Paciente> {
    await this.pool.query(
      `UPDATE pacientes
       SET fecha_nacimiento=$1, direccion=$2, alergias=$3, updated_at=NOW()
       WHERE id=$4`,
      [p.fechaNacimiento, p.direccion, p.alergias, p.id],
    );
    return p;
  }

  private map(r: any): Paciente {
    return new Paciente(
      r.id,
      r.usuario_id,
      r.fecha_nacimiento,
      r.direccion,
      r.alergias,
    );
  }
}
