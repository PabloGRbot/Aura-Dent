import { Pool } from 'pg';
import { EstadoCita } from '../../../../dominio/modelos/cita_medica';
import { EstadoPago, MetodoPago, Pago, TipoPago } from '../../../../dominio/modelos/pago';
import {
  PagoDetalle,
  PagoRepositorioPuerto
} from '../../../../dominio/puertos/salida/pago_repositorio_puerto';

interface PagoFila {
  id: string;
  cita_id: string;
  monto: string;
  estado: EstadoPago;
  moneda: string;
  metodo: MetodoPago;
  tipo: TipoPago;
  referencia_qr: string | null;
  pagado_en: Date | null;
}

interface PagoDetalleFila extends PagoFila {
  paciente_nombre: string;
  paciente_dni: string;
  servicio: string | null;
  fecha_cita: Date;
  estado_cita: EstadoCita;
}

export class PagoPostgresRepositorio implements PagoRepositorioPuerto {
  constructor(private readonly pool: Pool) {}

  async buscarPorId(id: string): Promise<Pago | null> {
    const { rows } = await this.pool.query<PagoFila>(
      'SELECT * FROM pagos WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows.length > 0 ? this.aDominio(rows[0]) : null;
  }

  async buscarPorCitaId(citaId: string): Promise<Pago | null> {
    const { rows } = await this.pool.query<PagoFila>(
      'SELECT * FROM pagos WHERE cita_id = $1 LIMIT 1',
      [citaId]
    );
    return rows.length > 0 ? this.aDominio(rows[0]) : null;
  }

  async buscarPagosPorCitaId(citaId: string): Promise<Pago[]> {
    const { rows } = await this.pool.query<PagoFila>(
      'SELECT * FROM pagos WHERE cita_id = $1 ORDER BY pagado_en ASC NULLS FIRST, creado_en ASC',
      [citaId]
    );
    return rows.map((fila) => this.aDominio(fila));
  }

  async listar(): Promise<PagoDetalle[]> {
    const { rows } = await this.pool.query<PagoDetalleFila>(
      `SELECT p.*,
              c.fecha AS fecha_cita, c.servicio, c.estado AS estado_cita,
              u.nombres || ' ' || u.apellidos AS paciente_nombre,
              u.dni_ce AS paciente_dni
        FROM pagos p
        JOIN citas c ON c.id = p.cita_id
        JOIN usuarios u ON u.id = c.paciente_id
        ORDER BY c.fecha DESC`
    );
    return rows.map((fila) => ({
      pago: this.aDominio(fila),
      pacienteNombre: fila.paciente_nombre,
      pacienteDni: fila.paciente_dni,
      servicio: fila.servicio,
      fechaCita: new Date(fila.fecha_cita),
      estadoCita: fila.estado_cita
    }));
  }

  async guardar(pago: Pago): Promise<void> {
    await this.pool.query(
      `INSERT INTO pagos (id, cita_id, monto, estado, moneda, metodo, tipo, referencia_qr, pagado_en)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        pago.id,
        pago.citaId,
        pago.monto,
        pago.estado,
        pago.moneda,
        pago.metodo,
        pago.tipo,
        pago.referenciaQr,
        pago.pagadoEn
      ]
    );
  }

  async actualizar(pago: Pago): Promise<void> {
    await this.pool.query(
      'UPDATE pagos SET monto = $1, estado = $2, referencia_qr = $3, pagado_en = $4 WHERE id = $5',
      [pago.monto, pago.estado, pago.referenciaQr, pago.pagadoEn, pago.id]
    );
  }

  private aDominio(fila: PagoFila): Pago {
    return new Pago(
      fila.id,
      fila.cita_id,
      Number(fila.monto),
      fila.estado,
      fila.moneda,
      fila.metodo,
      fila.tipo,
      fila.referencia_qr,
      fila.pagado_en
    );
  }
}
