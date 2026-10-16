import { Pool } from 'pg';
import { Comprobante, EstadoComprobante, TipoComprobante } from '../../../../dominio/modelos/comprobante';
import { ComprobanteSalidaPuerto } from '../../../../dominio/puertos/salida/comprobante_repositorio_puerto';

interface ComprobanteFila {
  id: string;
  pago_id: string;
  cita_id: string;
  tipo: TipoComprobante;
  serie: string;
  correlativo: number;
  ruc_cliente: string | null;
  razon_social: string | null;
  subtotal: number;
  igv: number;
  total: number;
  moneda: string;
  estado: EstadoComprobante;
  emitido_en: Date;
  anulado_en: Date | null;
}

interface SerieFila {
  tipo: string;
  serie: string;
  ultimo_correlativo: number;
}

export class ComprobantePostgresRepositorio implements ComprobanteSalidaPuerto {
  constructor(private readonly pool: Pool) {}

  async guardar(comprobante: Comprobante): Promise<void> {
    await this.pool.query(
      `INSERT INTO comprobantes (id, pago_id, cita_id, tipo, serie, correlativo, ruc_cliente,
        razon_social, subtotal, igv, total, moneda, estado, emitido_en, anulado_en)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        comprobante.id,
        comprobante.pagoId,
        comprobante.citaId,
        comprobante.tipo,
        comprobante.serie,
        comprobante.correlativo,
        comprobante.rucCliente,
        comprobante.razonSocial,
        comprobante.subtotal,
        comprobante.igv,
        comprobante.total,
        comprobante.moneda,
        comprobante.estado,
        comprobante.emitidoEn,
        comprobante.anuladoEn
      ]
    );
  }

  async buscarPorId(id: string): Promise<Comprobante | null> {
    const { rows } = await this.pool.query<ComprobanteFila>(
      'SELECT * FROM comprobantes WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows.length > 0 ? this.aDominio(rows[0]) : null;
  }

  async buscarPorPagoId(pagoId: string): Promise<Comprobante | null> {
    const { rows } = await this.pool.query<ComprobanteFila>(
      'SELECT * FROM comprobantes WHERE pago_id = $1 LIMIT 1',
      [pagoId]
    );
    return rows.length > 0 ? this.aDominio(rows[0]) : null;
  }

  async listar(): Promise<Comprobante[]> {
    const { rows } = await this.pool.query<ComprobanteFila>(
      'SELECT * FROM comprobantes ORDER BY emitido_en DESC'
    );
    return rows.map((fila) => this.aDominio(fila));
  }

  async listarPorPaciente(pacienteId: string): Promise<Comprobante[]> {
    const { rows } = await this.pool.query<ComprobanteFila>(
      `SELECT comprobantes.* FROM comprobantes
        JOIN citas ON citas.id = comprobantes.cita_id
        WHERE citas.paciente_id = $1
        ORDER BY comprobantes.emitido_en DESC`,
      [pacienteId]
    );
    return rows.map((fila) => this.aDominio(fila));
  }

  async siguienteCorrelativo(tipo: string, serie: string): Promise<number> {
    const { rows } = await this.pool.query<SerieFila>(
      'SELECT * FROM series_comprobante WHERE tipo = $1 AND serie = $2',
      [tipo, serie]
    );
    let correlativo = 1;
    if (rows.length > 0) {
      correlativo = rows[0].ultimo_correlativo + 1;
      await this.pool.query(
        'UPDATE series_comprobante SET ultimo_correlativo = $1 WHERE tipo = $2 AND serie = $3',
        [correlativo, tipo, serie]
      );
    } else {
      await this.pool.query(
        'INSERT INTO series_comprobante (tipo, serie, ultimo_correlativo) VALUES ($1, $2, $3)',
        [tipo, serie, correlativo]
      );
    }
    return correlativo;
  }

  async anular(id: string): Promise<void> {
    await this.pool.query('UPDATE comprobantes SET estado = $2, anulado_en = $3 WHERE id = $1', [
      id,
      'ANULADO',
      new Date()
    ]);
  }

  private aDominio(fila: ComprobanteFila): Comprobante {
    return new Comprobante(
      fila.id,
      fila.pago_id,
      fila.cita_id,
      fila.tipo,
      fila.serie,
      Number(fila.correlativo),
      fila.ruc_cliente,
      fila.razon_social,
      Number(fila.subtotal),
      Number(fila.igv),
      Number(fila.total),
      fila.moneda,
      fila.estado,
      new Date(fila.emitido_en),
      fila.anulado_en ? new Date(fila.anulado_en) : null
    );
  }
}
