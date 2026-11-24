import { Pool } from 'pg';
import { readFile,readdir,mkdir,writeFile } from 'fs/promises';
import { join } from 'path';
import { cpus, totalmem } from 'os';
import { performance } from 'perf_hooks';
import express from 'express';
import { AddressInfo } from 'net';
import { variablesEntorno } from '../src/infraestructura/configuracion/variables_entorno';
import { GestionCitasPostgres } from '../src/infraestructura/adaptadores/salida/base_datos_postgres/gestion_citas_postgres';
import { crearGestionCitasControlador } from '../src/infraestructura/adaptadores/entrada/controladores_web/gestion_citas_controlador';
import { SolicitudAutenticada } from '../src/infraestructura/adaptadores/entrada/middlewares/autenticacion_middleware';
import { contextoOperacion } from '../src/infraestructura/adaptadores/salida/base_datos_postgres/contexto_operacion';

async function principal(){
  const c=variablesEntorno.postgres,config={host:c.host,port:c.puerto,user:c.usuario,password:c.contrasena,database:c.baseDatos,ssl:c.ssl?{rejectUnauthorized:false}:false};
  const admin=new Pool(config),mediciones=[];
  const ddl=(await readFile(join(__dirname,'preparar_bd.ts'),'utf8')).match(/const ESQUEMA = `([\s\S]*?)`;/)?.[1];if(!ddl)throw new Error('Esquema no encontrado');
  try{for(const cantidad of [100000,1000000]){
    const esquema=`aura_benchmark_${process.pid}_${cantidad}_${Date.now()}`;
    await admin.query(`CREATE SCHEMA "${esquema}"`);
    const pool=new Pool({...config,options:`-c search_path=${esquema}`,max:10});
    let servidor:ReturnType<express.Express['listen']>|undefined;
    try{
      await pool.query(ddl);
      // Datos exclusivamente sintéticos, cargados antes de instalar los triggers.
      await pool.query(`INSERT INTO usuarios(id,nombres,apellidos,email,password_hash,dni_ce,rol)
        SELECT md5('persona'||g)::uuid,'Sintético',g::text,g||'@benchmark.invalid','sin-login',g::text,
        CASE WHEN g<=1000 THEN 'Odontologo' ELSE 'Paciente' END FROM generate_series(1,11000) g`);
      await pool.query(`INSERT INTO citas(id,paciente_id,odontologo_id,fecha,duracion_minutos,servicio,estado)
        SELECT md5('cita'||g)::uuid,md5('persona'||(1001+g%10000))::uuid,md5('persona'||(1+g%1000))::uuid,
        now()-interval '3 years'+((g::bigint*7919)%1576800)*interval '1 minute',30,'Consulta general','ATENDIDA' FROM generate_series(1,$1::int) g`,[cantidad]);
      // Se cargan como pendientes para que no se simule una aprobación tardía de una cita finalizada.
      await pool.query(`INSERT INTO pagos(id,cita_id,monto,estado,tipo,pagado_en)
        SELECT md5('pago'||g)::uuid,md5('cita'||g)::uuid,10,'APROBADO','ADELANTO',
        now()-interval '3 years'+((g::bigint*7919)%1576800)*interval '1 minute' FROM generate_series(1,$1::int) g`,[cantidad]);
      for(const archivo of (await readdir(join(__dirname,'../migrations'))).filter(n=>n.endsWith('.sql')).sort())await pool.query(await readFile(join(__dirname,'../migrations',archivo),'utf8'));
      await pool.query('ANALYZE');
      const gestion=new GestionCitasPostgres(pool,{generarQr:async()=>'',validarPago:async r=>({aprobado:true,referencia:r,mensaje:'Prueba'})});
      const app=express();app.use((_q,_s,n)=>contextoOperacion.run({operacion:'benchmark'},n));
      app.use(crearGestionCitasControlador(pool,gestion,(req,_res,next)=>{const a=req as SolicitudAutenticada;a.rol='Administrador';a.usuarioId='00000000-0000-0000-0000-000000000000';next();}));
      servidor=app.listen(0,'127.0.0.1');await new Promise<void>(r=>servidor!.once('listening',r));
      const url=`http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
      const medir=async(nombre:string,accion:()=>Promise<unknown>,objetivo:number)=>{
        await accion();const tiempos=[];for(let n=0;n<20;n++){const inicio=performance.now();await accion();tiempos.push(performance.now()-inicio);}
        tiempos.sort((a,b)=>a-b);const p95=tiempos[Math.ceil(tiempos.length*.95)-1];return {nombre,muestras:20,p50Ms:+tiempos[10].toFixed(2),p95Ms:+p95.toFixed(2),objetivoMs:objetivo,cumple:p95<objetivo};
      };
      const consultas=[];
      consultas.push(await medir('Mis citas + pagos (servicio real)',()=>gestion.listarPorPaciente(''+require('crypto').createHash('md5').update('persona1001').digest('hex'),1,50),1000));
      consultas.push(await medir('Resumen gerencial anual HTTP',async()=>{const r=await fetch(url+'/reportes/resumen?periodo=anio');const d=await r.json() as any;if(r.status!==200)throw new Error(d.mensaje);return d;},3000));
      consultas.push(await medir('Disponibilidad odontólogo',()=>gestion.disponibilidad(''+require('crypto').createHash('md5').update('persona1').digest('hex'),new Date(Date.now()+10*86400000).toISOString().slice(0,10)),1000));
      const planes=[];
      for(const sql of ["SELECT * FROM citas WHERE paciente_id=md5('persona1001')::uuid ORDER BY fecha DESC,id DESC LIMIT 50",
        "SELECT sum(monto) FROM pagos WHERE estado='APROBADO' AND pagado_en>=now()-interval '1 year' AND pagado_en<now()"]){planes.push((await pool.query(`EXPLAIN(ANALYZE,BUFFERS,FORMAT JSON) ${sql}`)).rows[0]['QUERY PLAN']);}
      mediciones.push({citas:cantidad,pagos:cantidad,usuarios:11000,consultas,planes});console.log(JSON.stringify({citas:cantidad,consultas}));
    }finally{
      if(servidor)await new Promise<void>(r=>servidor!.close(()=>r()));await pool.end();
      if(/^aura_benchmark_\d+_\d+_\d+$/.test(esquema))await admin.query(`DROP SCHEMA "${esquema}" CASCADE`);
    }
  }}finally{await admin.end();}
  const destino=join(__dirname,'../informes');await mkdir(destino,{recursive:true});
  await writeFile(join(destino,'rendimiento.json'),JSON.stringify({fecha:new Date().toISOString(),entorno:{node:process.version,cpu:cpus()[0]?.model,nucleos:cpus().length,memoriaGB:+(totalmem()/1024**3).toFixed(1)},condiciones:'Local, caché caliente, 20 muestras secuenciales, sin concurrencia ni latencia externa. Datos sintéticos en esquemas aislados eliminados al terminar.',mediciones},null,2));
}
principal().catch(e=>{console.error(e);process.exitCode=1;});
