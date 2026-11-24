import { Router, RequestHandler, Response } from 'express';
import { Pool } from 'pg';
import { GestionCitasPostgres, paginacion } from '../../salida/base_datos_postgres/gestion_citas_postgres';
import { autorizar, SolicitudAutenticada } from '../middlewares/autenticacion_middleware';
import { TEXTO_POLITICA, VERSION_POLITICA } from '../../../../dominio/servicios/politica_citas';
import { ErrorAplicacion } from '../../../../compartido/error_aplicacion';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function idValido(id:string) { if(!uuid.test(id)) throw new ErrorAplicacion('Identificador inválido.','DATOS_INVALIDOS'); }
function texto(valor:unknown,nombre:string) { if(typeof valor!=='string'||!valor.trim()||valor.length>500) throw new ErrorAplicacion(`${nombre} es obligatorio (máximo 500 caracteres).`,'DATOS_INVALIDOS'); return valor.trim(); }
export function errorGestion(res:Response,error:unknown) {
  const e=error as any;
  const estados:Record<string,number>={NO_AUTORIZADO:403,CITA_NO_ENCONTRADA:404,PACIENTE_NO_ENCONTRADO:404,ESTADO_INVALIDO:409,POLITICA_PENDIENTE:409,RESERVA_VENCIDA:410,'23P01':409,'23514':409,'40P01':409,'55P03':409,'22P02':400};
  res.status(estados[e.codigo ?? e.code] ?? 400).json({mensaje:e.code==='40P01' ? 'La cita cambió durante la operación. Actualiza e inténtalo de nuevo.':e.message});
}
export function crearGestionCitasControlador(pool:Pool,gestion:GestionCitasPostgres,autenticar:RequestHandler) {
  const r=Router();
  r.get('/panel/resumen',autenticar,autorizar('Administrador','Recepcion','Odontologo'),async(req,res)=>{try{
    const a=req as SolicitudAutenticada;
    const usuarios=a.rol==='Administrador' ? (await pool.query('SELECT rol,count(*)::int cantidad FROM usuarios WHERE activo GROUP BY rol')).rows:[];
    const citas=(await pool.query(`SELECT CASE WHEN estado IN ('TEMPORAL','PENDIENTE_PAGO') AND expira_en<=now() THEN 'VENCIDA' ELSE estado END estado,count(*)::int cantidad FROM citas
      WHERE ($1::uuid IS NULL OR odontologo_id=$1) GROUP BY 1`,[a.rol==='Odontologo'?a.usuarioId:null])).rows;
    const pagos=a.rol!=='Odontologo' ? (await pool.query('SELECT estado,count(*)::int cantidad FROM pagos GROUP BY estado')).rows:[];
    res.json({usuarios,citas,pagos});
  }catch(e){errorGestion(res,e);}});
  r.get('/politica-citas',(_req,res)=>res.json({version:VERSION_POLITICA,texto:TEXTO_POLITICA}));
  r.get('/usuarios/me/politica',autenticar,async(req,res)=>{try{res.json(await gestion.politica((req as SolicitudAutenticada).usuarioId!));}catch(e){errorGestion(res,e);}});
  r.post('/usuarios/me/politica',autenticar,async(req,res)=>{try{
    if(req.body.acepta!==true) throw new ErrorAplicacion('Debes aceptar la política.','DATOS_INVALIDOS');
    res.json(await gestion.aceptarPolitica((req as SolicitudAutenticada).usuarioId!,req.body.version));
  }catch(e){errorGestion(res,e);}});
  r.post('/usuarios/:id/politica',autenticar,autorizar('Recepcion','Administrador'),async(req,res)=>{try{
    idValido(req.params.id);
    if(req.body.acepta!==true) throw new ErrorAplicacion('Debes registrar la aceptación del paciente.','DATOS_INVALIDOS');
    res.json(await gestion.aceptarPolitica(req.params.id,req.body.version));
  }catch(e){errorGestion(res,e);}});
  r.get('/citas/disponibilidad',autenticar,async(req,res)=>{try{
    idValido(String(req.query.odontologoId));
    if(req.query.excluir) idValido(String(req.query.excluir));
    res.json(await gestion.disponibilidad(String(req.query.odontologoId),String(req.query.dia),Number(req.query.duracion ?? 30),req.query.excluir ? String(req.query.excluir):undefined));
  }catch(e){errorGestion(res,e);}});
  r.post('/citas/:id/cancelar',autenticar,autorizar('Paciente','Recepcion','Administrador'),async(req,res)=>{try{
    idValido(req.params.id);const a=req as SolicitudAutenticada;
    res.json(await gestion.cancelar(req.params.id,a.usuarioId!,a.rol!,texto(req.body.motivo,'Motivo'),req.body.solicitarDevolucion===true,req.body.porClinica===true,req.body.estadoEsperado));
  }catch(e){errorGestion(res,e);}});
  r.post('/citas/:id/reprogramar',autenticar,autorizar('Paciente','Recepcion','Administrador'),async(req,res)=>{try{
    idValido(req.params.id);idValido(req.body.odontologoId);const a=req as SolicitudAutenticada;
    res.json(await gestion.reprogramar(req.params.id,a.usuarioId!,a.rol!,new Date(req.body.fecha),req.body.odontologoId));
  }catch(e){errorGestion(res,e);}});
  r.post('/citas/:id/inasistencia',autenticar,autorizar('Recepcion','Administrador'),async(req,res)=>{try{
    idValido(req.params.id);res.json(await gestion.inasistencia(req.params.id));
  }catch(e){errorGestion(res,e);}});
  r.get('/citas/:id/eventos',autenticar,async(req,res)=>{try{
    idValido(req.params.id); const a=req as SolicitudAutenticada;
    const cita=(await pool.query('SELECT paciente_id,odontologo_id FROM citas WHERE id=$1',[req.params.id])).rows[0];
    if(!cita) throw new ErrorAplicacion('Cita no encontrada.','CITA_NO_ENCONTRADA');
    if(a.rol==='Paciente' && cita.paciente_id!==a.usuarioId || a.rol==='Odontologo' && cita.odontologo_id!==a.usuarioId) throw new ErrorAplicacion('No puedes consultar esta cita.','NO_AUTORIZADO');
    const p=paginacion(req.query.pagina,req.query.limite);
    const resumen=req.query.vista==='resumen';
    const orden=resumen?'ASC':'DESC';
    const eventos=(await pool.query(`SELECT e.id,e.tipo,e.ocurrido_en,e.actor_id,e.actor_rol,e.motivo,e.antes,e.despues,
      u.nombres||' '||u.apellidos actor_nombre FROM eventos_cita e LEFT JOIN usuarios u ON u.id=e.actor_id
      WHERE e.cita_id=$1 AND (NOT $4::boolean OR e.tipo IN
        ('CREACION','MODIFICACION','CANCELACION','VENCIMIENTO','INASISTENCIA','ATENCION','DEVOLUCION_SOLICITADA','DEVOLUCION_ENTREGADA')
        OR (e.tipo='PAGO' AND e.despues->>'estado'='APROBADO' AND e.antes->>'estado' IS DISTINCT FROM 'APROBADO'))
      ORDER BY e.ocurrido_en ${orden},e.id ${orden} LIMIT $2 OFFSET $3`,[req.params.id,p.limite,p.offset,resumen])).rows;
    res.json(a.rol==='Paciente' ? eventos.map(e=>({...e,actor_id:undefined,actor_nombre:undefined,motivo:e.actor_rol==='Paciente'?e.motivo:null})):eventos);
  }catch(e){errorGestion(res,e);}});
  r.get('/devoluciones',autenticar,autorizar('Paciente','Recepcion','Administrador'),async(req,res)=>{try{
    const a=req as SolicitudAutenticada,p=paginacion(req.query.pagina,req.query.limite);
    res.json((await pool.query(`SELECT d.*,u.nombres||' '||u.apellidos paciente_nombre FROM devoluciones d JOIN citas c ON c.id=d.cita_id JOIN usuarios u ON u.id=c.paciente_id
      WHERE ($1::uuid IS NULL OR c.paciente_id=$1) ORDER BY d.solicitada_en DESC,d.id DESC LIMIT $2 OFFSET $3`,[a.rol==='Paciente'?a.usuarioId:null,p.limite,p.offset])).rows);
  }catch(e){errorGestion(res,e);}});
  r.post('/devoluciones/:id/entregar',autenticar,autorizar('Recepcion','Administrador'),async(req,res)=>{try{
    idValido(req.params.id);res.json(await gestion.entregar(req.params.id,(req as SolicitudAutenticada).usuarioId!,texto(req.body.referencia,'Referencia de entrega')));
  }catch(e){errorGestion(res,e);}});
  r.get('/reportes/resumen',autenticar,autorizar('Administrador'),async(req,res)=>{try{
    const periodo=String(req.query.periodo ?? 'mes');
    if(!['semana','mes','anio'].includes(periodo)) throw new ErrorAplicacion('Periodo inválido.','DATOS_INVALIDOS');
    const unidad=periodo==='semana'?'week':periodo==='anio'?'year':'month';
    const n=periodo==='semana'?8:periodo==='anio'?5:12;
    const interval=periodo==='semana'?'1 week':periodo==='anio'?'1 year':'1 month';
    const {rows}=await pool.query(`WITH limites AS (
      SELECT date_trunc($1,now() AT TIME ZONE 'America/Lima')-($2::int-1)*$3::interval desde,
             date_trunc($1,now() AT TIME ZONE 'America/Lima')+$3::interval hasta),
      cobros AS (SELECT date_trunc($1,pagado_en AT TIME ZONE 'America/Lima') periodo,sum(monto) monto,count(*) cantidad
        FROM pagos,limites WHERE estado='APROBADO' AND pagado_en>=desde AT TIME ZONE 'America/Lima' AND pagado_en<hasta AT TIME ZONE 'America/Lima' GROUP BY 1),
      entregas AS (SELECT date_trunc($1,entregada_en AT TIME ZONE 'America/Lima') periodo,sum(monto) monto
        FROM devoluciones,limites WHERE estado='ENTREGADA' AND entregada_en>=desde AT TIME ZONE 'America/Lima' AND entregada_en<hasta AT TIME ZONE 'America/Lima' GROUP BY 1)
      SELECT to_char(s,'YYYY-MM-DD') etiqueta,coalesce(c.monto,0)::float8 cobros,coalesce(e.monto,0)::float8 devoluciones,coalesce(c.cantidad,0)::int cantidad
      FROM limites,generate_series(desde,hasta-$3::interval,$3::interval) s LEFT JOIN cobros c ON c.periodo=s LEFT JOIN entregas e ON e.periodo=s ORDER BY s`,[unidad,n,interval]);
    const pendientes=(await pool.query(`SELECT coalesce(sum(monto),0)::float8 monto FROM devoluciones WHERE estado='PENDIENTE_ENTREGA'`)).rows[0].monto;
    const reservas=(await pool.query(`SELECT CASE WHEN estado IN ('TEMPORAL','PENDIENTE_PAGO') AND expira_en<=now() THEN 'VENCIDA' ELSE estado END estado,count(*)::int cantidad FROM citas GROUP BY 1`)).rows;
    const sinFecha=(await pool.query("SELECT count(*)::int cantidad,coalesce(sum(monto),0)::float8 monto FROM pagos WHERE estado='APROBADO' AND pagado_en IS NULL")).rows[0];
    const centimos=(valor:number)=>Math.round(valor*100);
    const cobros=rows.reduce((s,r)=>s+centimos(r.cobros),0)/100,entregadas=rows.reduce((s,r)=>s+centimos(r.devoluciones),0)/100;
    res.json({periodo,puntos:rows,cobros,devolucionesEntregadas:entregadas,flujoNeto:(centimos(cobros)-centimos(entregadas))/100,devolucionesPendientes:pendientes,reservas,cobrosSinFecha:sinFecha,pagosAprobados:rows.reduce((s,r)=>s+r.cantidad,0)});
  }catch(e){errorGestion(res,e);}});
  return r;
}
