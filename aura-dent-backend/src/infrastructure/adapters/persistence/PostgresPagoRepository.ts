import { Pool } from "pg";
import { Pago } from "../../../domain/entities/Pago";
import { PagoRepository } from "../../../domain/ports/PagoRepository";

export class PostgresPagoRepository implements PagoRepository {
  constructor(private pool: Pool) {}

  async crear(p: Pago): Promise<Pago> {
    const { rows } = await this.pool.query(
      `INSERT INTO pagos
        (id, cita_id, monto, metodo_pago, codigo_operacion, estado_id, fecha_pago)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        p.id,
        p.citaId,
        p.monto,
        p.metodoPago,
        p.codigoOperacion,
        p.estadoId,
        p.fechaPago,
      ],
    );
    return this.map(rows[0]);
  }

  async buscarPorId(id: string): Promise<Pago | null> {
    const { rows } = await this.pool.query(
      "SELECT * FROM pagos WHERE id = $1",
      [id],
    );
    return rows[0] ? this.map(rows[0]) : null;
  }

  async buscarPorCita(citaId: string): Promise<Pago | null> {
    const { rows } = await this.pool.query(
      "SELECT * FROM pagos WHERE cita_id = $1 ORDER BY created_at DESC LIMIT 1",
      [citaId],
    );
    return rows[0] ? this.map(rows[0]) : null;
  }

  async listar(): Promise<Pago[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM pagos ORDER BY created_at DESC",
    );
    return rows.map((r) => this.map(r));
  }

  async actualizar(p: Pago): Promise<Pago> {
    await this.pool.query(
      `UPDATE pagos SET monto=$1, metodo_pago=$2, codigo_operacion=$3,
        estado_id=$4, fecha_pago=$5, updated_at=NOW()
       WHERE id=$6`,
      [p.monto, p.metodoPago, p.codigoOperacion, p.estadoId, p.fechaPago, p.id],
    );
    return p;
  }

  async registrarHistorial(
    pagoId: string,
    estadoAnterior: number | null,
    estadoNuevo: number,
    motivo: string | null,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO historial_estados_pago
        (pago_id, estado_anterior_id, estado_nuevo_id, motivo)
       VALUES ($1,$2,$3,$4)`,
      [pagoId, estadoAnterior, estadoNuevo, motivo],
    );
  }

  private map(r: any): Pago {
    return new Pago(
      r.id,
      r.cita_id,
      Number(r.monto),
      r.metodo_pago,
      r.codigo_operacion,
      r.estado_id,
      r.fecha_pago,
    );
  }
}
