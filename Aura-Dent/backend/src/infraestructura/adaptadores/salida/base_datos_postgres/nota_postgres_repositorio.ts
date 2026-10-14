import { Pool } from 'pg';
import { NotaClinica } from '../../../../dominio/modelos/nota_clinica';
import {
  NotaClinicaDetalle,
  NotaRepositorioPuerto
} from '../../../../dominio/puertos/salida/nota_repositorio_puerto';

interface NotaFila {
  id: string;
  cita_id: string;
  odontologo_id: string;
  contenido: string;
  creado_en: Date;
}

interface NotaDetalleFila extends NotaFila {
  paciente_nombre: string;
  servicio: string | null;
}

export class NotaPostgresRepositorio implements NotaRepositorioPuerto {
  constructor(private readonly pool: Pool) {}

  async guardar(nota: NotaClinica): Promise<void> {
    await this.pool.query(
      `INSERT INTO notas_clinicas (id, cita_id, odontologo_id, contenido, creado_en)
        VALUES ($1, $2, $3, $4, $5)`,
      [nota.id, nota.citaId, nota.odontologoId, nota.contenido, nota.creadoEn]
    );
  }

  async listarPorCita(citaId: string): Promise<NotaClinica[]> {
    const { rows } = await this.pool.query<NotaFila>(
      'SELECT * FROM notas_clinicas WHERE cita_id = $1 ORDER BY creado_en ASC',
      [citaId]
    );
    return rows.map((fila) => this.aDominio(fila));
  }

  async listarPorOdontologo(odontologoId: string): Promise<NotaClinicaDetalle[]> {
    const { rows } = await this.pool.query<NotaDetalleFila>(
      `SELECT n.*, u.nombres || ' ' || u.apellidos AS paciente_nombre, c.servicio
        FROM notas_clinicas n
        JOIN citas c ON c.id = n.cita_id
        JOIN usuarios u ON u.id = c.paciente_id
        WHERE n.odontologo_id = $1
        ORDER BY n.creado_en DESC`,
      [odontologoId]
    );
    return rows.map((fila) => ({
      ...this.aDominio(fila),
      pacienteNombre: fila.paciente_nombre,
      servicio: fila.servicio
    }));
  }

  private aDominio(fila: NotaFila): NotaClinica {
    return new NotaClinica(
      fila.id,
      fila.cita_id,
      fila.odontologo_id,
      fila.contenido,
      new Date(fila.creado_en)
    );
  }
}
