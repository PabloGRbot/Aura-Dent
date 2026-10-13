import { Pool } from "pg";
import { Usuario } from "../../../domain/entities/Usuario";
import { UsuarioRepository } from "../../../domain/ports/UsuarioRepository";

export class PostgresUsuarioRepository implements UsuarioRepository {
  constructor(private pool: Pool) {}

  async crear(u: Usuario): Promise<Usuario> {
    const query = `
      INSERT INTO usuarios
        (id, rol_id, nombres, apellidos, documento_identidad, telefono, correo, password_hash, activo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `;
    const values = [
      u.id,
      u.rolId,
      u.nombres,
      u.apellidos,
      u.documentoIdentidad,
      u.telefono,
      u.correo,
      u.passwordHash,
      u.activo,
    ];
    const { rows } = await this.pool.query(query, values);
    return this.map(rows[0]);
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query(
      "SELECT * FROM usuarios WHERE id = $1",
      [id],
    );
    return rows[0] ? this.map(rows[0]) : null;
  }

  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query(
      "SELECT * FROM usuarios WHERE correo = $1",
      [correo],
    );
    return rows[0] ? this.map(rows[0]) : null;
  }

  async buscarPorDocumento(documento: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query(
      "SELECT * FROM usuarios WHERE documento_identidad = $1",
      [documento],
    );
    return rows[0] ? this.map(rows[0]) : null;
  }

  async listar(): Promise<Usuario[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM usuarios WHERE activo = true ORDER BY created_at DESC",
    );
    return rows.map((r) => this.map(r));
  }

  async actualizar(u: Usuario): Promise<Usuario> {
    await this.pool.query(
      `UPDATE usuarios
       SET nombres=$1, apellidos=$2, telefono=$3, correo=$4,
           password_hash=$5, rol_id=$6, updated_at=NOW()
       WHERE id=$7`,
      [
        u.nombres,
        u.apellidos,
        u.telefono,
        u.correo,
        u.passwordHash,
        u.rolId,
        u.id,
      ],
    );
    return u;
  }

  async desactivar(id: string): Promise<void> {
    await this.pool.query(
      "UPDATE usuarios SET activo = false, updated_at = NOW() WHERE id = $1",
      [id],
    );
  }

  private map(r: any): Usuario {
    return new Usuario(
      r.id,
      r.rol_id,
      r.nombres,
      r.apellidos,
      r.documento_identidad,
      r.telefono,
      r.correo,
      r.password_hash,
      r.activo,
    );
  }
}
