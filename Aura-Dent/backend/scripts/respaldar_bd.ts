import { spawnSync } from 'child_process';
import { mkdirSync, chmodSync } from 'fs';
import { join } from 'path';
import { crearConexionPostgres } from '../src/infraestructura/adaptadores/salida/base_datos_postgres/conexion_postgres';
import { variablesEntorno } from '../src/infraestructura/configuracion/variables_entorno';

async function principal() {
  const cfg = variablesEntorno.postgres;
  const carpeta = join(__dirname, '..', '.respaldos');
  mkdirSync(carpeta, { recursive: true });
  const archivo = join(carpeta, `antes_politica_${Date.now()}.dump`);
  const bin = process.env.POSTGRES_BIN ?? 'C:\\Program Files\\PostgreSQL\\17\\bin';
  const env = { ...process.env, PGPASSWORD: cfg.contrasena };
  const conexion = ['-h', cfg.host, '-p', String(cfg.puerto), '-U', cfg.usuario];
  const ejecutar = (programa: string, argumentos: string[]) => {
    const r = spawnSync(join(bin, programa), argumentos, { env, encoding: 'utf8', windowsHide: true });
    if (r.status !== 0) throw new Error(`${programa}: ${r.error?.message ?? r.stderr}`);
  };
  ejecutar('pg_dump', [...conexion, '-Fc', '--no-owner', '--no-acl', '-f', archivo, cfg.baseDatos]);
  chmodSync(archivo, 0o600);
  const pool = crearConexionPostgres();
  const prueba = `aura_respaldo_prueba_${Date.now()}`;
  try {
    const antes = await pool.query(`SELECT (SELECT count(*) FROM citas)::int citas,
      (SELECT count(*) FROM pagos)::int pagos, (SELECT count(*) FROM usuarios)::int usuarios,
      (SELECT count(*) FROM comprobantes)::int comprobantes, (SELECT count(*) FROM notas_clinicas)::int notas`);
    await pool.query(`CREATE DATABASE "${prueba}"`);
    ejecutar('pg_restore', [...conexion, '--no-owner', '--no-acl', '--exit-on-error', '-d', prueba, archivo]);
    const { Pool } = await import('pg');
    const restaurada = new Pool({ host: cfg.host, port: cfg.puerto, user: cfg.usuario, password: cfg.contrasena, database: prueba });
    try {
      const despues = await restaurada.query(`SELECT (SELECT count(*) FROM citas)::int citas,
        (SELECT count(*) FROM pagos)::int pagos, (SELECT count(*) FROM usuarios)::int usuarios,
        (SELECT count(*) FROM comprobantes)::int comprobantes, (SELECT count(*) FROM notas_clinicas)::int notas`);
      if (JSON.stringify(antes.rows) !== JSON.stringify(despues.rows)) throw new Error('Los conteos restaurados no coinciden.');
      console.log(JSON.stringify({ respaldo: archivo, restauracionVerificada: true, conteos: despues.rows[0] }));
    } finally { await restaurada.end(); }
  } finally {
    await pool.query(`DROP DATABASE IF EXISTS "${prueba}"`);
    await pool.end();
  }
}
principal().catch((error) => { console.error(error.message); process.exitCode = 1; });
