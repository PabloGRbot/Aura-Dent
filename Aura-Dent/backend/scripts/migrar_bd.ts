import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { crearConexionPostgres } from '../src/infraestructura/adaptadores/salida/base_datos_postgres/conexion_postgres';

async function principal(): Promise<void> {
  const pool = crearConexionPostgres();
  try {
    const cliente = await pool.connect();
    try {
      await cliente.query('SELECT pg_advisory_lock(7301022)');
      await cliente.query('CREATE TABLE IF NOT EXISTS migraciones (nombre TEXT PRIMARY KEY, aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now())');
      const carpeta = join(__dirname, '..', 'migrations');
      for (const nombre of (await readdir(carpeta)).filter(n => /^\d+.*\.sql$/.test(n)).sort()) {
        if ((await cliente.query('SELECT 1 FROM migraciones WHERE nombre=$1', [nombre])).rowCount) continue;
        await cliente.query('BEGIN');
        try {
          await cliente.query(await readFile(join(carpeta, nombre), 'utf8'));
          await cliente.query('INSERT INTO migraciones(nombre) VALUES($1)', [nombre]);
          await cliente.query('COMMIT');
          console.log(`Aplicada: ${nombre}`);
        } catch (error) { await cliente.query('ROLLBACK'); throw error; }
      }
    } finally { await cliente.query('SELECT pg_advisory_unlock(7301022)'); cliente.release(); }
  } finally {
    await pool.end();
  }
}

principal().catch((error) => {
  console.error('No se pudo aplicar la migración:', error);
  process.exitCode = 1;
});
