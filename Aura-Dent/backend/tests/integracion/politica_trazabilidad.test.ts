import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import express from 'express';
import { AddressInfo } from 'net';
import { esquemaPrueba } from '../soporte/postgres';
import { GestionCitasPostgres } from '../../src/infraestructura/adaptadores/salida/base_datos_postgres/gestion_citas_postgres';
import { OperacionesReservaPostgres } from '../../src/infraestructura/adaptadores/salida/base_datos_postgres/operaciones_reserva_postgres';
import { CitaPostgresRepositorio } from '../../src/infraestructura/adaptadores/salida/base_datos_postgres/cita_postgres_repositorio';
import { contextoOperacion } from '../../src/infraestructura/adaptadores/salida/base_datos_postgres/contexto_operacion';
import { VERSION_POLITICA } from '../../src/dominio/servicios/politica_citas';
import { crearGestionCitasControlador } from '../../src/infraestructura/adaptadores/entrada/controladores_web/gestion_citas_controlador';
import { crearAutenticador } from '../../src/infraestructura/adaptadores/entrada/middlewares/autenticacion_middleware';
import { TokenJwt } from '../../src/infraestructura/adaptadores/salida/seguridad/token_jwt';
import { crearChatControlador } from '../../src/infraestructura/adaptadores/entrada/chat_ia_widget/chat_controlador';
import { Rol } from '../../src/dominio/modelos/usuario';
import { crearCitasControlador } from '../../src/infraestructura/adaptadores/entrada/controladores_web/citas_controlador';
import { crearPagosControlador } from '../../src/infraestructura/adaptadores/entrada/controladores_web/pagos_controlador';
const suite=process.env.PROBAR_POSTGRES==='1'?describe:describe.skip;
suite('Política, API y trazabilidad transaccional',()=>{
  let fixture:Awaited<ReturnType<typeof esquemaPrueba>>,pool:Pool,gestion:GestionCitasPostgres,operaciones:OperacionesReservaPostgres;
  const pasarela={generarQr:async()=> 'CIP-PRUEBA',validarPago:async(referencia:string)=>({aprobado:true,referencia,mensaje:'Simulado'})};
  let paciente:string,recepcion:string,admin:string,base:string,servidor:ReturnType<express.Express['listen']>;
  const token=new TokenJwt();
  async function usuario(rol:Rol){const id=randomUUID();await pool.query(`INSERT INTO usuarios(id,nombres,apellidos,email,password_hash,dni_ce,rol,politica_version,politica_aceptada_en) VALUES($1,'Prueba','Aislada',$2,'sin-login',$3,$4,$5,now())`,[id,`${id}@prueba.local`,id.slice(0,8),rol,VERSION_POLITICA]);return id;}
  const actor=<T>(id:string,rol:string,accion:()=>Promise<T>)=>contextoOperacion.run({actorId:id,rol,operacion:randomUUID()},accion);
  function futura(){const d=new Date();d.setUTCDate(d.getUTCDate()+10);while([0,6].includes(d.getUTCDay()))d.setUTCDate(d.getUTCDate()+1);d.setUTCHours(14,0,0,0);return d;}
  async function nueva(){const doctor=await usuario('Odontologo');const r=await actor(paciente,'Paciente',()=>gestion.crearCita({pacienteId:paciente,odontologoId:doctor,fecha:futura(),duracionMinutos:30,servicio:'Consulta general'}));return {...r,doctor};}
  async function api(ruta:string,id:string,rol:Rol,body?:unknown){const r=await fetch(base+ruta,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token.generar({sub:id,rol})}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()};}
  beforeAll(async()=>{
    fixture=await esquemaPrueba();pool=fixture.pool;gestion=new GestionCitasPostgres(pool,pasarela);operaciones=new OperacionesReservaPostgres(pool,pasarela,{generar:randomUUID});
    paciente=await usuario('Paciente');recepcion=await usuario('Recepcion');admin=await usuario('Administrador');
    const app=express();app.use(express.json());app.use((_q,_s,n)=>contextoOperacion.run({operacion:randomUUID()},n));
    app.use('/api',crearGestionCitasControlador(pool,gestion,crearAutenticador(token,pool)));
    app.use('/api',crearCitasControlador(gestion,gestion,gestion,gestion,operaciones,crearAutenticador(token,pool),{listarPorRol:async()=>[]},operaciones));
    app.use('/api',crearPagosControlador(operaciones,crearAutenticador(token,pool)));
    app.use('/api',crearChatControlador(gestion,{responder:async()=> 'Información pública'}));
    servidor=app.listen(0);await new Promise<void>(r=>servidor.once('listening',r));base=`http://127.0.0.1:${(servidor.address() as AddressInfo).port}/api`;
  });
  afterAll(async()=>{await new Promise<void>(r=>servidor?.close(()=>r()));await fixture?.cerrar();});
  it('crea cita y pago juntos, con actor y sin datos clínicos en los eventos',async()=>{
    const r=await nueva();const e=await pool.query('SELECT * FROM eventos_cita WHERE cita_id=$1',[r.cita.id]);
    expect(e.rows.some(e=>e.tipo==='CREACION'&&e.actor_id===paciente)).toBe(true);expect(JSON.stringify(e.rows)).not.toContain('password');
    expect(r.cita.fechaOriginal?.getTime()).toBe(r.cita.fecha.getTime());
  });
  it('serializa dos reservas simultáneas del mismo odontólogo',async()=>{
    const doctor=await usuario('Odontologo');const s={pacienteId:paciente,odontologoId:doctor,fecha:futura(),duracionMinutos:30,servicio:'Consulta general'};
    const r=await Promise.allSettled([gestion.crearCita(s),gestion.crearCita(s)]);expect(r.filter(x=>x.status==='fulfilled')).toHaveLength(1);
    expect((await pool.query('SELECT p.id FROM pagos p JOIN citas c ON c.id=p.cita_id WHERE c.odontologo_id=$1',[doctor])).rowCount).toBe(1);
  });
  it('revierte también la cita si falla el pago pendiente',async()=>{
    const doctor=await usuario('Odontologo');
    const mala=new GestionCitasPostgres(pool,{...pasarela,generarQr:async()=> 'x'.repeat(121)});
    await expect(mala.crearCita({pacienteId:paciente,odontologoId:doctor,fecha:futura(),duracionMinutos:30,servicio:'Consulta general'})).rejects.toThrow();
    expect((await pool.query('SELECT 1 FROM citas WHERE odontologo_id=$1',[doctor])).rowCount).toBe(0);
  });
  it('permite cambios repetidos y conserva pago original y servicio',async()=>{
    const r=await nueva();await actor(paciente,'Paciente',()=>operaciones.pagarCita(paciente,r.cita.id,'CIP-PRUEBA'));
    const primero=(await pool.query('SELECT primer_pago_en FROM citas WHERE id=$1',[r.cita.id])).rows[0].primer_pago_en;
    for(const minutos of [30,60])await actor(paciente,'Paciente',()=>gestion.reprogramar(r.cita.id,paciente,'Paciente',new Date(r.cita.fecha.getTime()+minutos*60000),r.doctor));
    const f=(await pool.query('SELECT * FROM citas WHERE id=$1',[r.cita.id])).rows[0];expect(f.primer_pago_en).toEqual(primero);expect(f.fecha_original).toEqual(r.cita.fecha);expect(f.servicio).toBe('Consulta general');
    expect((await pool.query("SELECT id FROM eventos_cita WHERE cita_id=$1 AND tipo='MODIFICACION'",[r.cita.id])).rowCount).toBe(2);
  });
  it('no duplica solicitud ni entrega y conserva pagos y comprobantes',async()=>{
    const r=await nueva();await operaciones.pagarCita(paciente,r.cita.id,'CIP-PRUEBA');
    for(let n=0;n<2;n++)await actor(paciente,'Paciente',()=>gestion.cancelar(r.cita.id,paciente,'Paciente','Cancelación de prueba',true));
    const d=(await pool.query('SELECT * FROM devoluciones WHERE cita_id=$1',[r.cita.id])).rows;expect(d).toHaveLength(1);expect(Number(d[0].monto)).toBe(10);
    await actor(recepcion,'Recepcion',()=>gestion.entregar(d[0].id,recepcion,'Entrega de prueba'));
    await actor(recepcion,'Recepcion',()=>gestion.entregar(d[0].id,recepcion,'No duplicar'));
    expect((await pool.query("SELECT id FROM eventos_cita WHERE cita_id=$1 AND tipo='DEVOLUCION_ENTREGADA'",[r.cita.id])).rowCount).toBe(1);
    expect((await pool.query('SELECT id FROM comprobantes WHERE cita_id=$1',[r.cita.id])).rowCount).toBe(1);
    expect((await pool.query('SELECT estado FROM pagos WHERE cita_id=$1',[r.cita.id])).rows[0].estado).toBe('APROBADO');
  });
  it('vence por lotes y mantiene reservas antiguas sin vencimiento',async()=>{
    const r=await nueva();await pool.query('UPDATE citas SET expira_en=now()-interval \'1 second\' WHERE id=$1',[r.cita.id]);
    expect((await gestion.disponibilidad(r.doctor,r.cita.fecha.toISOString().slice(0,10))).intervalos.find(i=>i.horaInicio==='09:00')?.disponible).toBe(true);
    const repo=new CitaPostgresRepositorio(pool);expect(await repo.eliminarPendientesVencidas(new Date())).toBe(1);
    expect((await repo.buscarPorId(r.cita.id))?.estado).toBe('VENCIDA');expect((await pool.query('SELECT estado FROM pagos WHERE cita_id=$1',[r.cita.id])).rows[0].estado).toBe('ANULADO');
    const antigua=await nueva();await pool.query('UPDATE citas SET expira_en=NULL WHERE id=$1',[antigua.cita.id]);await repo.eliminarPendientesVencidas(new Date());expect((await repo.buscarPorId(antigua.cita.id))?.estado).toBe('PENDIENTE_PAGO');
  });
  it('respeta propiedad y permisos; la IA sigue siendo pública',async()=>{
    const r=await nueva(),otro=await usuario('Paciente');
    expect((await api(`/citas/${r.cita.id}/cancelar`,otro,'Paciente',{motivo:'Ajena'})).status).toBe(403);
    expect((await api(`/citas/${r.cita.id}/eventos`,otro,'Paciente')).status).toBe(403);
    expect((await api('/reportes/resumen',paciente,'Paciente')).status).toBe(403);
    expect((await fetch(base+'/asistente/pregunta',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mensaje:'Horarios'})})).status).toBe(200);
    expect((await fetch(base+'/devoluciones')).status).toBe(401);
  });
  it('reporta importes cobrados y entregados sin multiplicar el catálogo',async()=>{
    const r=await api('/reportes/resumen?periodo=mes',admin,'Administrador');expect(r.status).toBe(200);
    const total=Number((await pool.query("SELECT sum(monto) total FROM pagos WHERE estado='APROBADO' AND pagado_en IS NOT NULL")).rows[0].total);
    expect(r.body.cobros).toBe(total);expect(r.body.devolucionesEntregadas).toBe(10);expect(r.body.flujoNeto).toBe(total-10);expect(r.body.puntos).toHaveLength(12);
  });
  it('no admite borrados ni alteración de eventos',async()=>{
    const r=await nueva();await expect(pool.query('DELETE FROM citas WHERE id=$1',[r.cita.id])).rejects.toMatchObject({code:'23514'});
    await expect(pool.query("UPDATE eventos_cita SET tipo='FALSO' WHERE cita_id=$1",[r.cita.id])).rejects.toMatchObject({code:'23514'});
  });
  it('vence como máximo 200 por ejecución y conserva todas las filas',async()=>{
    await pool.query(`INSERT INTO citas(id,paciente_id,fecha,duracion_minutos,estado,expira_en)
      SELECT md5($1||g)::uuid,$2,now()+interval '10 days',30,'PENDIENTE_PAGO',now()-interval '1 minute' FROM generate_series(1,205) g`,[randomUUID(),paciente]);
    const repo=new CitaPostgresRepositorio(pool);
    expect(await repo.eliminarPendientesVencidas(new Date())).toBe(200);
    expect(await repo.eliminarPendientesVencidas(new Date())).toBe(5);
    expect((await pool.query("SELECT 1 FROM citas WHERE estado='VENCIDA'")).rowCount).toBeGreaterThanOrEqual(205);
  });
  async function historica(fecha:Date,pagadoEn:Date|null){
    const id=randomUUID(),pago=randomUUID(),doctor=await usuario('Odontologo');
    await pool.query("INSERT INTO citas(id,paciente_id,odontologo_id,fecha,duracion_minutos,estado) VALUES($1,$2,$3,$4,30,'CONFIRMADA')",[id,paciente,doctor,fecha]);
    await pool.query("INSERT INTO pagos(id,cita_id,monto,estado,tipo,pagado_en) VALUES($1,$2,10,'APROBADO','ADELANTO',$3)",[pago,id,pagadoEn]);return {id,pago,doctor};
  }
  it('la clínica devuelve el adelanto aun fuera de ambos beneficios',async()=>{
    const h=await historica(new Date(Date.now()+86400000),new Date(Date.now()-3*86400000));
    await expect(gestion.cancelar(h.id,paciente,'Paciente','No corresponde',true)).rejects.toMatchObject({codigo:'ESTADO_INVALIDO'});
    expect((await api(`/citas/${h.id}/cancelar`,recepcion,'Recepcion',{motivo:'Cancelación por clínica',porClinica:true})).status).toBe(200);
    expect((await pool.query('SELECT monto FROM devoluciones WHERE cita_id=$1',[h.id])).rows[0].monto).toBe('10.00');
  });
  it('cancela sin devolución fuera del plazo y protege el pago',async()=>{
    const h=await historica(new Date(Date.now()+86400000),new Date(Date.now()-3*86400000));
    await gestion.cancelar(h.id,paciente,'Paciente','Fuera de plazo',false);
    expect((await pool.query('SELECT 1 FROM devoluciones WHERE cita_id=$1',[h.id])).rowCount).toBe(0);
    await expect(pool.query('UPDATE pagos SET monto=100 WHERE id=$1',[h.pago])).rejects.toMatchObject({code:'23514'});
  });
  it('registra inasistencia una sola vez, sin devolución, y deniega al paciente',async()=>{
    const h=await historica(new Date(Date.now()-3600000),new Date(Date.now()-3*86400000));
    expect((await api(`/citas/${h.id}/inasistencia`,paciente,'Paciente',{})).status).toBe(403);
    for(let i=0;i<2;i++)expect((await api(`/citas/${h.id}/inasistencia`,recepcion,'Recepcion',{})).status).toBe(200);
    expect((await pool.query("SELECT id FROM eventos_cita WHERE cita_id=$1 AND tipo='INASISTENCIA'",[h.id])).rowCount).toBe(1);
    expect((await pool.query('SELECT 1 FROM devoluciones WHERE cita_id=$1',[h.id])).rowCount).toBe(0);
  });
  it('los saldos no inventan el primer pago de datos antiguos',async()=>{
    const h=await historica(futura(),null);
    await operaciones.registrar({citaId:h.id,monto:20,metodo:'EFECTIVO',tipo:'SALDO'});
    expect((await pool.query('SELECT primer_pago_en FROM citas WHERE id=$1',[h.id])).rows[0].primer_pago_en).toBeNull();
    await expect(gestion.reprogramar(h.id,paciente,'Paciente',new Date(futura().getTime()+3600000),h.doctor)).rejects.toMatchObject({codigo:'ESTADO_INVALIDO'});
  });
  it('el cobro manual confirma el mismo adelanto sin dejar un segundo pago pendiente',async()=>{
    const r=await nueva();await operaciones.registrar({citaId:r.cita.id,monto:10,metodo:'EFECTIVO'});
    expect((await pool.query('SELECT estado FROM citas WHERE id=$1',[r.cita.id])).rows[0].estado).toBe('CONFIRMADA');
    const pagos=(await pool.query('SELECT estado,tipo,metodo FROM pagos WHERE cita_id=$1',[r.cita.id])).rows;
    expect(pagos).toEqual([{estado:'APROBADO',tipo:'ADELANTO',metodo:'EFECTIVO'}]);
  });
  it('bloquea cuentas desactivadas aunque tengan un token anterior',async()=>{
    const u=await usuario('Paciente');await pool.query('UPDATE usuarios SET activo=false WHERE id=$1',[u]);
    expect((await api('/devoluciones',u,'Paciente')).status).toBe(401);
  });
  it('exige aceptación de versión vigente y conserva un único registro',async()=>{
    const p=await usuario('Paciente');await pool.query('UPDATE usuarios SET politica_version=NULL,politica_aceptada_en=NULL WHERE id=$1',[p]);
    const doctor=await usuario('Odontologo');const solicitud={pacienteId:p,odontologoId:doctor,fecha:futura(),duracionMinutos:30,servicio:'Consulta general'};
    await expect(gestion.crearCita(solicitud)).rejects.toMatchObject({codigo:'POLITICA_PENDIENTE'});
    expect((await api('/usuarios/me/politica',p,'Paciente',{version:'anterior',acepta:true})).status).toBe(400);
    for(let n=0;n<2;n++)expect((await api('/usuarios/me/politica',p,'Paciente',{version:VERSION_POLITICA,acepta:true})).status).toBe(200);
    const a=(await pool.query('SELECT * FROM aceptaciones_politica WHERE usuario_id=$1',[p])).rows;expect(a).toHaveLength(1);expect(a[0].registrada_por).toBe(p);
    await expect(gestion.crearCita(solicitud)).resolves.toBeDefined();
  });
  it('mantiene operativo el flujo antiguo de reservas y protege el pago anónimo',async()=>{
    const doctor=await usuario('Odontologo');
    const creada=await api('/reservas',paciente,'Paciente',{odontologoId:doctor,fecha:futura().toISOString(),duracionMinutos:30});
    expect(creada.status).toBe(201);
    expect((await fetch(base+'/pagos/qr',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({citaId:creada.body.reservaId,referenciaQr:'CIP-PRUEBA'})})).status).toBe(401);
    expect((await api('/pagos/qr',paciente,'Paciente',{citaId:creada.body.reservaId,referenciaQr:'CIP-PRUEBA'})).status).toBe(200);
    expect((await api(`/reservas/${creada.body.reservaId}/confirmar`,paciente,'Paciente',{pagoId:(await pool.query('SELECT id FROM pagos WHERE cita_id=$1',[creada.body.reservaId])).rows[0].id})).status).toBe(200);
  });
  it('la API de citas devuelve límites y separa próximos e historial antes de paginar',async()=>{
    const r=await api('/citas/mis-citas?seccion=proximas',paciente,'Paciente');expect(r.status).toBe(200);expect(r.body.length).toBeLessThanOrEqual(50);
    expect(r.body.every((c:any)=>c.acciones && ['PENDIENTE_PAGO','TEMPORAL','CONFIRMADA'].includes(c.estado))).toBe(true);
    const h=await api('/citas/mis-citas?seccion=historial',paciente,'Paciente');expect(h.body.some((c:any)=>c.estado==='CANCELADA')).toBe(true);
  });
  it('resume creación, pago y modificación sin mostrar los eventos técnicos repetidos',async()=>{
    const r=await nueva();await operaciones.pagarCita(paciente,r.cita.id,'CIP-PRUEBA');
    await gestion.reprogramar(r.cita.id,paciente,'Paciente',new Date(r.cita.fecha.getTime()+1800000),r.doctor);
    const resumen=await api(`/citas/${r.cita.id}/eventos?vista=resumen`,paciente,'Paciente');
    expect(resumen.status).toBe(200);
    expect(resumen.body.map((e:any)=>e.tipo)).toEqual(['CREACION','PAGO','MODIFICACION']);
    expect(resumen.body[1].despues.estado).toBe('APROBADO');
    const auditoria=await api(`/citas/${r.cita.id}/eventos`,paciente,'Paciente');
    expect(auditoria.body.some((e:any)=>e.tipo==='ESTADO')).toBe(true);
    expect(auditoria.body.filter((e:any)=>e.tipo==='PAGO')).toHaveLength(2);
  });
  it('no cancela silenciosamente sin devolución si otro proceso acaba de aprobar el pago',async()=>{
    const r=await nueva();let entrar!:()=>void,liberar!:()=>void;
    const dentro=new Promise<void>(res=>{entrar=res;}),espera=new Promise<void>(res=>{liberar=res;});
    const lento=new OperacionesReservaPostgres(pool,{...pasarela,validarPago:async referencia=>{entrar();await espera;return {aprobado:true,referencia,mensaje:'Simulado'};}},{generar:randomUUID});
    const pago=lento.pagarCita(paciente,r.cita.id,'CIP-PRUEBA');await dentro;
    const cancelacion=gestion.cancelar(r.cita.id,paciente,'Paciente','Antes del pago',false,false,'PENDIENTE_PAGO').catch(e=>e);
    liberar();await pago;expect(await cancelacion).toMatchObject({codigo:'ESTADO_INVALIDO'});
    expect((await pool.query('SELECT estado FROM citas WHERE id=$1',[r.cita.id])).rows[0].estado).toBe('CONFIRMADA');
  });
  it('serializa pago y vencimiento; una validación tardía no deja pago aprobado ni comprobante',async()=>{
    const r=await nueva();await pool.query("UPDATE citas SET expira_en=clock_timestamp()+interval '1 second' WHERE id=$1",[r.cita.id]);
    let entrar!:()=>void,liberar!:()=>void;const dentro=new Promise<void>(res=>{entrar=res;}),espera=new Promise<void>(res=>{liberar=res;});
    const lento=new OperacionesReservaPostgres(pool,{...pasarela,validarPago:async referencia=>{entrar();await espera;return {aprobado:true,referencia,mensaje:'Simulado'};}},{generar:randomUUID});
    const pago=lento.pagarCita(paciente,r.cita.id,'CIP-PRUEBA').catch(e=>e);await dentro;await new Promise(res=>setTimeout(res,1100));
    const repo=new CitaPostgresRepositorio(pool);expect(await repo.eliminarPendientesVencidas(new Date())).toBe(0);liberar();
    expect(await pago).toMatchObject({codigo:'RESERVA_VENCIDA'});expect(await repo.eliminarPendientesVencidas(new Date())).toBe(1);
    expect((await pool.query('SELECT estado FROM pagos WHERE cita_id=$1',[r.cita.id])).rows[0].estado).toBe('ANULADO');
    expect((await pool.query('SELECT 1 FROM comprobantes WHERE cita_id=$1',[r.cita.id])).rowCount).toBe(0);
  });
});
