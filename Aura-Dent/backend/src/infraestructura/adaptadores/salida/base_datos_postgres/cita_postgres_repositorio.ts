import { Pool } from 'pg';
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
}

interface CitaAgendaFila extends CitaFila {
  paciente_nombre: string;
  paciente_dni: string;
}

export class CitaPostgresRepositorio implements CitaRepositorioPuerto {
  constructor(private readonly pool: Pool) {}

  async buscarPorId(id: string): Promise<CitaMedica | null> {
    const { rows } = await this.pool.query<CitaFila>(
      'SELECT * FROM citas WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows.length > 0 ? this.aDominio(rows[0]) : null;
  }

  async listarPorPaciente(pacienteId: string): Promise<CitaMedica[]> {
    const { rows } = await this.pool.query<CitaFila>(
      'SELECT * FROM citas WHERE paciente_id = $1 ORDER BY fecha DESC',
      [pacienteId]
    );
    return rows.map((fila) => this.aDominio(fila));
  }

  async listarParaAgenda(odontologoId?: string): Promise<CitaAgendaItem[]> {
    if (odontologoId) {
      const { rows } = await this.pool.query<CitaAgendaFila>(
        `SELECT c.*, u.nombres || ' ' || u.apellidos AS paciente_nombre, u.dni_ce AS paciente_dni
          FROM citas c
          JOIN usuarios u ON u.id = c.paciente_id
          WHERE c.estado IN ('CONFIRMADA', 'ATENDIDA')
            AND c.odontologo_id = $1
          ORDER BY c.fecha ASC`,
        [odontologoId]
      );
      return rows.map((fila) => ({
        cita: this.aDominio(fila),
        pacienteNombre: fila.paciente_nombre,
        pacienteDni: fila.paciente_dni
      }));
    }
    const { rows } = await this.pool.query<CitaAgendaFila>(
      `SELECT c.*, u.nombres || ' ' || u.apellidos AS paciente_nombre, u.dni_ce AS paciente_dni
        FROM citas c
        JOIN usuarios u ON u.id = c.paciente_id
        WHERE c.estado IN ('CONFIRMADA', 'ATENDIDA')
        ORDER BY c.fecha ASC`,
      []
    );
    return rows.map((fila) => ({
      cita: this.aDominio(fila),
      pacienteNombre: fila.paciente_nombre,
      pacienteDni: fila.paciente_dni
    }));
  }

  async listarTodas(): Promise<CitaAgendaItem[]> {
    const { rows } = await this.pool.query<CitaAgendaFila>(
      `SELECT c.*, u.nombres || ' ' || u.apellidos AS paciente_nombre, u.dni_ce AS paciente_dni
        FROM citas c
        JOIN usuarios u ON u.id = c.paciente_id
        ORDER BY c.fecha DESC`,
      []
    );
    return rows.map((fila) => ({
      cita: this.aDominio(fila),
      pacienteNombre: fila.paciente_nombre,
      pacienteDni: fila.paciente_dni
    }));
  }

  async buscarPorOdontologoYFecha(odontologoId: string, fecha: Date): Promise<CitaMedica[]> {
    const { rows } = await this.pool.query<CitaFila>(
      'SELECT * FROM citas WHERE odontologo_id = $1 AND fecha::date = $2::date',
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
    const { rows } = await this.pool.query(
      `SELECT 1 FROM citas
        WHERE odontologo_id = $1
          AND estado <> 'CANCELADA'
          AND fecha < $2
          AND fecha + make_interval(mins => duracion_minutos) > $3
        LIMIT 1`,
      [odontologoId, fin, fecha]
    );
    return rows.length > 0;
  }

  async guardar(cita: CitaMedica): Promise<void> {
    await this.pool.query(
      `INSERT INTO citas (id, paciente_id, odontologo_id, fecha, duracion_minutos, servicio, estado, pago_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        cita.id,
        cita.pacienteId,
        cita.odontologoId,
        cita.fecha,
        cita.duracionMinutos,
        cita.servicio,
        cita.estado,
        cita.pagoId
      ]
    );
  }

  async actualizar(cita: CitaMedica): Promise<void> {
    await this.pool.query(
      `UPDATE citas
        SET fecha = $1, duracion_minutos = $2, servicio = $3, estado = $4, pago_id = $5, odontologo_id = $6
        WHERE id = $7`,
      [
        cita.fecha,
        cita.duracionMinutos,
        cita.servicio,
        cita.estado,
        cita.pagoId,
        cita.odontologoId,
        cita.id
      ]
    );
  }

  private aDominio(fila: CitaFila): CitaMedica {
    return new CitaMedica(
      fila.id,
      fila.paciente_id,
      fila.odontologo_id,
      new Date(fila.fecha),
      fila.duracion_minutos,
      fila.estado,
      fila.pago_id,
      fila.servicio
    );
  }
}
