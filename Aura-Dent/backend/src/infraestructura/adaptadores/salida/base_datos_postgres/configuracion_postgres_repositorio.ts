import { Pool } from 'pg';
import { ConfiguracionRepositorioPuerto } from '../../../../dominio/puertos/salida/configuracion_repositorio_puerto';

interface ConfiguracionFila {
  clave: string;
  valor: string;
}

export class ConfiguracionPostgresRepositorio implements ConfiguracionRepositorioPuerto {
  constructor(private readonly pool: Pool) {}

  async obtenerTodos(): Promise<Record<string, string>> {
    const { rows } = await this.pool.query<ConfiguracionFila>(
      'SELECT clave, valor FROM configuracion ORDER BY clave'
    );
    const resultado: Record<string, string> = {};
    for (const fila of rows) {
      resultado[fila.clave] = fila.valor;
    }
    return resultado;
  }

  async guardarVarios(valores: Record<string, string>): Promise<void> {
    const claves = Object.keys(valores);
    if (claves.length === 0) {
      return;
    }

    const cliente = await this.pool.connect();
    try {
      await cliente.query('BEGIN');
      for (const clave of claves) {
        await cliente.query(
          `INSERT INTO configuracion (clave, valor) VALUES ($1, $2)
            ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor`,
          [clave, String(valores[clave])]
        );
      }
      await cliente.query('COMMIT');
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    } finally {
      cliente.release();
    }
  }
}
