import { Pool } from 'pg';
import { readFile,readdir } from 'fs/promises';
import { join } from 'path';
import { variablesEntorno } from '../../src/infraestructura/configuracion/variables_entorno';
export async function esquemaPrueba(prefijo='politica') {
  const esquema=`aura_prueba_${prefijo}_${process.pid}_${Date.now()}`;
  const c=variablesEntorno.postgres;
  const conexion={host:c.host,port:c.puerto,user:c.usuario,password:c.contrasena,database:c.baseDatos,ssl:c.ssl?{rejectUnauthorized:false}:false};
  const admin=new Pool(conexion);await admin.query(`CREATE SCHEMA "${esquema}"`);
  const pool=new Pool({...conexion,options:`-c search_path=${esquema}`,max:10});
  const script=await readFile(join(__dirname,'../../scripts/preparar_bd.ts'),'utf8');
  const ddl=script.match(/const ESQUEMA = `([\s\S]*?)`;/)?.[1];if(!ddl)throw new Error('Falta esquema');
  await pool.query(ddl);
  for(const archivo of (await readdir(join(__dirname,'../../migrations'))).filter(n=>n.endsWith('.sql')).sort()) await pool.query(await readFile(join(__dirname,'../../migrations',archivo),'utf8'));
  return {pool,async cerrar(){await pool.end();if(/^aura_prueba_[a-z]+_\d+_\d+$/.test(esquema))await admin.query(`DROP SCHEMA "${esquema}" CASCADE`);await admin.end();}};
}
