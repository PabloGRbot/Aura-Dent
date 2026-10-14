import { Pool } from 'pg';
import { variablesEntorno } from '../../../configuracion/variables_entorno';

export function crearConexionPostgres(): Pool {
  return new Pool({
    host: variablesEntorno.postgres.host,
    port: variablesEntorno.postgres.puerto,
    user: variablesEntorno.postgres.usuario,
    password: variablesEntorno.postgres.contrasena,
    database: variablesEntorno.postgres.baseDatos,
    ssl: variablesEntorno.postgres.ssl ? { rejectUnauthorized: false } : false
  });
}
