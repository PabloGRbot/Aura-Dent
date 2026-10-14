import { Pool } from "pg";
import {
  BaseConocimiento,
  BitacoraEntrada,
  ChatbotRepository,
  RegistroBitacora,
} from "../../../domain/ports/ChatbotRepository";

export class PostgresChatbotRepository implements ChatbotRepository {
  constructor(private pool: Pool) {}

  async listarBase(soloActivos = false): Promise<BaseConocimiento[]> {
    const { rows } = await this.pool.query(
      `SELECT id, pregunta, respuesta, categoria, activo
       FROM base_conocimiento_chatbot
       WHERE ($1 = false OR activo = true)
       ORDER BY id`,
      [soloActivos],
    );
    return rows.map((r) => this.map(r));
  }

  async buscarBasePorId(id: number): Promise<BaseConocimiento | null> {
    const { rows } = await this.pool.query(
      `SELECT id, pregunta, respuesta, categoria, activo
       FROM base_conocimiento_chatbot WHERE id = $1`,
      [id],
    );
    return rows[0] ? this.map(rows[0]) : null;
  }

  async crearBase(data: {
    pregunta: string;
    respuesta: string;
    categoria: string | null;
  }): Promise<BaseConocimiento> {
    const { rows } = await this.pool.query(
      `INSERT INTO base_conocimiento_chatbot (pregunta, respuesta, categoria, activo)
       VALUES ($1, $2, $3, true)
       RETURNING id, pregunta, respuesta, categoria, activo`,
      [data.pregunta, data.respuesta, data.categoria],
    );
    return this.map(rows[0]);
  }

  async actualizarBase(
    id: number,
    data: Partial<
      Pick<BaseConocimiento, "pregunta" | "respuesta" | "categoria" | "activo">
    >,
  ): Promise<BaseConocimiento | null> {
    const { rows } = await this.pool.query(
      `UPDATE base_conocimiento_chatbot
       SET pregunta = COALESCE($2, pregunta),
           respuesta = COALESCE($3, respuesta),
           categoria = COALESCE($4, categoria),
           activo = COALESCE($5, activo),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, pregunta, respuesta, categoria, activo`,
      [id, data.pregunta ?? null, data.respuesta ?? null, data.categoria ?? null, data.activo ?? null],
    );
    return rows[0] ? this.map(rows[0]) : null;
  }

  async desactivarBase(id: number): Promise<void> {
    await this.pool.query(
      `UPDATE base_conocimiento_chatbot
       SET activo = false, updated_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  async registrarBitacora(entrada: RegistroBitacora): Promise<void> {
    await this.pool.query(
      `INSERT INTO bitacora_chatbot
        (usuario_id, sesion_id, mensaje_usuario, respuesta_ia, intencion)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        entrada.usuarioId,
        entrada.sesionId,
        entrada.mensajeUsuario,
        entrada.respuestaIa,
        entrada.intencion,
      ],
    );
  }

  async listarBitacora(limit = 200): Promise<BitacoraEntrada[]> {
    const { rows } = await this.pool.query(
      `SELECT id,
              usuario_id AS "usuarioId",
              sesion_id AS "sesionId",
              mensaje_usuario AS "mensajeUsuario",
              respuesta_ia AS "respuestaIa",
              intencion,
              fecha_hora AS "fechaHora"
       FROM bitacora_chatbot
       ORDER BY fecha_hora DESC
       LIMIT $1`,
      [limit],
    );
    return rows as BitacoraEntrada[];
  }

  private map(r: any): BaseConocimiento {
    return {
      id: r.id,
      pregunta: r.pregunta,
      respuesta: r.respuesta,
      categoria: r.categoria,
      activo: r.activo,
    };
  }
}
