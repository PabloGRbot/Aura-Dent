import { Pool } from "pg";
import { Servicio } from "../../../domain/entities/Servicio";
import { ServicioRepository } from "../../../domain/ports/ServicioRepository";

export class PostgresServicioRepository implements ServicioRepository {
  constructor(private pool: Pool) {}

  async crear(s: Servicio): Promise<Servicio> {
    const { rows } = await this.pool.query(
      `INSERT INTO servicios
        (nombre, descripcion, precio, duracion_minutos, monto_reserva, especialidad_id, activo)
       VALUES ($1,$2,$3,$4,$5,$6,true)
       RETURNING *`,
      [
        s.nombre,
        s.descripcion,
        s.precio,
        s.duracionMinutos,
        s.montoReserva,
        s.especialidadId,
      ],
    );
    return this.map(rows[0]);
  }

  async listar(): Promise<Servicio[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM servicios WHERE activo = true ORDER BY nombre",
    );
    return rows.map((r) => this.map(r));
  }

  async buscarPorId(id: number): Promise<Servicio | null> {
    const { rows } = await this.pool.query(
      "SELECT * FROM servicios WHERE id = $1",
      [id],
    );
    return rows[0] ? this.map(rows[0]) : null;
  }

  async actualizar(s: Servicio): Promise<Servicio> {
    await this.pool.query(
      `UPDATE servicios
       SET nombre=$1, descripcion=$2, precio=$3, duracion_minutos=$4,
           monto_reserva=$5, especialidad_id=$6, updated_at=NOW()
       WHERE id=$7`,
      [
        s.nombre,
        s.descripcion,
        s.precio,
        s.duracionMinutos,
        s.montoReserva,
        s.especialidadId,
        s.id,
      ],
    );
    return s;
  }

  async desactivar(id: number): Promise<void> {
    await this.pool.query(
      "UPDATE servicios SET activo=false, updated_at=NOW() WHERE id=$1",
      [id],
    );
  }

  private map(r: any): Servicio {
    return new Servicio(
      r.id,
      r.nombre,
      r.descripcion,
      Number(r.precio),
      r.duracion_minutos,
      Number(r.monto_reserva),
      r.especialidad_id,
      r.activo,
    );
  }
}
