import { Pool } from "pg";
import {
  DatosContacto,
  PoliticaClinica,
  PoliticaRepository,
} from "../../../domain/ports/PoliticaRepository";

export class PostgresPoliticaRepository implements PoliticaRepository {
  constructor(private pool: Pool) {}

  private readonly columnas =
    "id, titulo, contenido, tipo, activo";

  async listarPoliticas(): Promise<PoliticaClinica[]> {
    const { rows } = await this.pool.query(
      `SELECT ${this.columnas}
       FROM politicas_clinica
       WHERE activo = true
       ORDER BY id`,
    );
    return rows as PoliticaClinica[];
  }

  async listarTodas(): Promise<PoliticaClinica[]> {
    const { rows } = await this.pool.query(
      `SELECT ${this.columnas}
       FROM politicas_clinica
       ORDER BY id`,
    );
    return rows as PoliticaClinica[];
  }

  async buscarPoliticaPorId(id: number): Promise<PoliticaClinica | null> {
    const { rows } = await this.pool.query(
      `SELECT ${this.columnas} FROM politicas_clinica WHERE id = $1`,
      [id],
    );
    return rows[0] ? (rows[0] as PoliticaClinica) : null;
  }

  async crearPolitica(data: {
    titulo: string;
    contenido: string;
    tipo: string | null;
  }): Promise<PoliticaClinica> {
    const { rows } = await this.pool.query(
      `INSERT INTO politicas_clinica (titulo, contenido, tipo, activo)
       VALUES ($1, $2, $3, true)
       RETURNING ${this.columnas}`,
      [data.titulo, data.contenido, data.tipo],
    );
    return rows[0] as PoliticaClinica;
  }

  async actualizarPolitica(
    id: number,
    data: {
      titulo?: string;
      contenido?: string;
      tipo?: string | null;
      activo?: boolean;
    },
  ): Promise<PoliticaClinica> {
    const { rows } = await this.pool.query(
      `UPDATE politicas_clinica
         SET titulo = COALESCE($2, titulo),
             contenido = COALESCE($3, contenido),
             tipo = COALESCE($4, tipo),
             activo = COALESCE($5, activo)
       WHERE id = $1
       RETURNING ${this.columnas}`,
      [
        id,
        data.titulo ?? null,
        data.contenido ?? null,
        data.tipo ?? null,
        data.activo ?? null,
      ],
    );
    return rows[0] as PoliticaClinica;
  }

  async desactivarPolitica(id: number): Promise<void> {
    await this.pool.query(
      "UPDATE politicas_clinica SET activo = false WHERE id = $1",
      [id],
    );
  }

  async obtenerContacto(): Promise<DatosContacto | null> {
    const { rows } = await this.pool.query(
      `SELECT id, direccion, telefono, email, horario_atencion
       FROM datos_contacto
       ORDER BY id
       LIMIT 1`,
    );
    return rows[0] ? (rows[0] as DatosContacto) : null;
  }

  async actualizarContacto(data: {
    direccion?: string;
    telefono?: string;
    email?: string;
    horarioAtencion?: string;
  }): Promise<DatosContacto> {
    const actual = await this.obtenerContacto();
    if (!actual) {
      const { rows } = await this.pool.query(
        `INSERT INTO datos_contacto (direccion, telefono, email, horario_atencion)
         VALUES ($1, $2, $3, $4)
         RETURNING id, direccion, telefono, email, horario_atencion`,
        [
          data.direccion ?? null,
          data.telefono ?? null,
          data.email ?? null,
          data.horarioAtencion ?? null,
        ],
      );
      return rows[0] as DatosContacto;
    }
    const { rows } = await this.pool.query(
      `UPDATE datos_contacto
         SET direccion = COALESCE($2, direccion),
             telefono = COALESCE($3, telefono),
             email = COALESCE($4, email),
             horario_atencion = COALESCE($5, horario_atencion)
       WHERE id = $1
       RETURNING id, direccion, telefono, email, horario_atencion`,
      [
        actual.id,
        data.direccion ?? null,
        data.telefono ?? null,
        data.email ?? null,
        data.horarioAtencion ?? null,
      ],
    );
    return rows[0] as DatosContacto;
  }
}
