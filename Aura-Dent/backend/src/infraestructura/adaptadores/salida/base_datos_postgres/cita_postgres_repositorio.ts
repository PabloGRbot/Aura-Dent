import { Pool, PoolClient } from 'pg';
import { conTransaccion, parametrosListado } from './contexto_operacion';
import { ErrorAplicacion } from '../../../../compartido/error_aplicacion';
import { CitaMedica, EstadoCita } from '../../../../dominio/modelos/cita_medica';
import {
  CitaAgendaItem,
  CitaRepositorioPuerto
} from '../../../../dominio/puertos/salida/cita_repositorio_puerto';

interface CitaFila {
  id: string;
  paciente_id: string;
  odontologo_id: string | null;
  fecha: Date;
  duracion_minutos: number;
  servicio: string | null;
  estado: EstadoCita;
  pago_id: string | null;
  expira_en: Date | null;
  fecha_original: Date | null;
  primer_pago_en: Date | null;
  creado_en: Date | null;
  politica_version: string | null;
}

interface CitaAgendaFila extends CitaFila {
  paciente_nombre: string;
  paciente_dni: string;
}

export class CitaPostgresRepositorio implements CitaRepositorioPuerto {
  constructor(private readonly pool: Pool, private readonly cliente?: PoolClient) {}

  async buscarPorId(id: string): Promise<CitaMedica | null> {
    const { rows } = await (this.cliente ?? this.pool).query<CitaFila>(
      'SELECT * FROM citas WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows.length > 0 ? this.aDominio(rows[0]) : null;
  }

  async listarPorPaciente(pacienteId: string): Promise<CitaMedica[]> {
    const { rows } = await (this.cliente ?? this.pool).query<CitaFila>(
      'SELECT * FROM citas WHERE paciente_id=$1 ORDER BY fecha DESC,id DESC LIMIT $2 OFFSET $3',
      [pacienteId,...parametrosListado().slice(0,2)]
    );
    return rows.map((fila) => this.aDominio(fila));
  }

  async listarParaAgenda(odontologoId?: string): Promise<CitaAgendaItem[]> {
    if (odontologoId) {
      const { rows } = await (this.cliente ?? this.pool).query<CitaAgendaFila>(
        `SELECT c.*, u.nombres || ' ' || u.apellidos AS paciente_nombre, u.dni_ce AS paciente_dni
          FROM citas c
          JOIN usuarios u ON u.id = c.paciente_id
          WHERE c.estado IN ('CONFIRMADA', 'ATENDIDA')
            AND c.odontologo_id = $1
            AND (u.nombres||' '||u.apellidos||' '||u.dni_ce) ILIKE $4
          ORDER BY c.fecha ASC,c.id LIMIT $2 OFFSET $3`,
        [odontologoId,...parametrosListado()]
      );
      return rows.map((fila) => ({
        cita: this.aDominio(fila),
        pacienteNombre: fila.paciente_nombre,
        pacienteDni: fila.paciente_dni
      }));
    }
    const { rows } = await (this.cliente ?? this.pool).query<CitaAgendaFila>(
      `SELECT c.*, u.nombres || ' ' || u.apellidos AS paciente_nombre, u.dni_ce AS paciente_dni
        FROM citas c
        JOIN usuarios u ON u.id = c.paciente_id
        WHERE c.estado IN ('CONFIRMADA', 'ATENDIDA')
          AND (u.nombres||' '||u.apellidos||' '||u.dni_ce) ILIKE $3
        ORDER BY c.fecha ASC,c.id LIMIT $1 OFFSET $2`,
      [...parametrosListado()]
    );
    return rows.map((fila) => ({
      cita: this.aDominio(fila),
      pacienteNombre: fila.paciente_nombre,
      pacienteDni: fila.paciente_dni
    }));
  }

  async listarTodas(): Promise<CitaAgendaItem[]> {
    const { rows } = await (this.cliente ?? this.pool).query<CitaAgendaFila>(
      `SELECT c.*, u.nombres || ' ' || u.apellidos AS paciente_nombre, u.dni_ce AS paciente_dni
        FROM citas c
        JOIN usuarios u ON u.id = c.paciente_id
        WHERE (u.nombres||' '||u.apellidos||' '||u.dni_ce) ILIKE $3
        ORDER BY c.fecha DESC,c.id DESC LIMIT $1 OFFSET $2`,
      [...parametrosListado()]
    );
    return rows.map((fila) => ({
      cita: this.aDominio(fila),
      pacienteNombre: fila.paciente_nombre,
      pacienteDni: fila.paciente_dni
    }));
  }

  async buscarPorOdontologoYFecha(odontologoId: string, fecha: Date): Promise<CitaMedica[]> {
    const { rows } = await (this.cliente ?? this.pool).query<CitaFila>(
      `SELECT * FROM citas WHERE odontologo_id = $1
       AND fecha >= date_trunc('day',$2::timestamptz AT TIME ZONE 'America/Lima') AT TIME ZONE 'America/Lima'
       AND fecha < (date_trunc('day',$2::timestamptz AT TIME ZONE 'America/Lima') + interval '1 day') AT TIME ZONE 'America/Lima'
       AND (estado='CONFIRMADA' OR (estado IN ('TEMPORAL','PENDIENTE_PAGO') AND (expira_en IS NULL OR expira_en>now())))`,
      [odontologoId, fecha]
    );
    return rows.map((fila) => this.aDominio(fila));
  }

  async existeConflicto(
    odontologoId: string,
    fecha: Date,
    duracionMinutos: number
  ): Promise<boolean> {
    const fin = new Date(fecha.getTime() + duracionMinutos * 60000);
    const { rows } = await (this.cliente ?? this.pool).query(
      `SELECT 1 FROM citas
        WHERE odontologo_id = $1
          AND (estado='CONFIRMADA' OR (estado IN ('TEMPORAL','PENDIENTE_PAGO') AND (expira_en IS NULL OR expira_en>now())))
          AND fecha < $2
          AND fecha + make_interval(mins => duracion_minutos) > $3
        LIMIT 1`,
      [odontologoId, fin, fecha]
    );
    return rows.length > 0;
  }

  async guardar(cita: CitaMedica): Promise<void> {
    if (!this.cliente) return conTransaccion(this.pool, c => new CitaPostgresRepositorio(this.pool,c).guardar(cita));
    await (this.cliente ?? this.pool).query(
      `INSERT INTO citas (id, paciente_id, odontologo_id, fecha, duracion_minutos, servicio, estado, pago_id, expira_en)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        cita.id,
        cita.pacienteId,
        cita.odontologoId,
        cita.fecha,
        cita.duracionMinutos,
        cita.servicio,
        cita.estado,
        cita.pagoId,
        cita.expiraEn
      ]
    );
  }

  async actualizar(cita: CitaMedica): Promise<void> {
    if (!this.cliente) return conTransaccion(this.pool, c => new CitaPostgresRepositorio(this.pool,c).actualizar(cita));
    const resultado = await (this.cliente ?? this.pool).query(
      `UPDATE citas
        SET fecha = $1, duracion_minutos = $2, servicio = $3, estado = $4, pago_id = $5, odontologo_id = $6, expira_en = $7
        WHERE id = $8`,
      [
        cita.fecha,
        cita.duracionMinutos,
        cita.servicio,
        cita.estado,
        cita.pagoId,
        cita.odontologoId,
        cita.expiraEn,
        cita.id
      ]
    );
    if (!resultado.rowCount) throw new ErrorAplicacion('La cita ya no existe.', 'CITA_NO_ENCONTRADA');
  }

  async eliminarPendientesVencidas(ahora: Date): Promise<number> {
    const cliente = await this.pool.connect();
    try {
      await cliente.query('BEGIN');
      await cliente.query("SET LOCAL lock_timeout='5s'");
      const candidatas = await cliente.query(
        `SELECT id FROM citas WHERE estado IN ('TEMPORAL', 'PENDIENTE_PAGO')
          AND expira_en IS NOT NULL AND expira_en <= $1 AND pago_id IS NULL
          AND NOT EXISTS(SELECT 1 FROM pagos p WHERE p.cita_id=citas.id AND p.estado='APROBADO')
          ORDER BY expira_en,id LIMIT 200 FOR UPDATE SKIP LOCKED`, [ahora]);
      const ids = candidatas.rows.map(r=>r.id);
      await cliente.query("UPDATE citas SET estado='VENCIDA' WHERE id=ANY($1::uuid[])",[ids]);
      await cliente.query("UPDATE pagos SET estado='ANULADO' WHERE cita_id=ANY($1::uuid[]) AND estado='PENDIENTE'",[ids]);
      await cliente.query('COMMIT');
      return ids.length;
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    } finally {
      cliente.release();
    }
  }

  desdeFila(fila: CitaFila): CitaMedica { return this.aDominio(fila); }
  private aDominio(fila: CitaFila): CitaMedica {
    return new CitaMedica(
      fila.id,
      fila.paciente_id,
      fila.odontologo_id,
      new Date(fila.fecha),
      fila.duracion_minutos,
      fila.estado,
      fila.pago_id,
      fila.servicio,
      fila.expira_en,
      fila.fecha_original,
      fila.primer_pago_en,
      fila.creado_en,
      fila.politica_version
    );
  }
}
