import { Pool, PoolClient } from 'pg';
import { randomUUID } from 'crypto';
import { ErrorAplicacion } from '../../../../compartido/error_aplicacion';
import { VERSION_POLITICA, accionesCita } from '../../../../dominio/servicios/politica_citas';
import { SolicitudCita, SolicitudReserva } from '../../../../dominio/puertos/entrada/reserva_cita_puerto';
import { CitaPostgresRepositorio } from './cita_postgres_repositorio';
import { PagoPostgresRepositorio } from './pago_postgres_repositorio';
import { UsuarioPostgresRepositorio } from './usuario_postgres_repositorio';
import { CrearCitaCasoUso } from '../../../../aplicacion/casos_uso/reserva_citas/crear_cita_caso_uso';
import { CrearReservaTemporalCasoUso } from '../../../../aplicacion/casos_uso/reserva_citas/crear_reserva_temporal_caso_uso';
import { ValidacionReservaServicio } from '../../../../dominio/servicios/validacion_reserva_servicio';
import { GeneradorIdUuid } from '../../../../compartido/generador_id';
import { PasarelaPagoPuerto } from '../../../../dominio/puertos/salida/pasarela_pago_puerto';
import { conTransaccion, contextoOperacion } from './contexto_operacion';
import { CitaMedica } from '../../../../dominio/modelos/cita_medica';
import { Pago } from '../../../../dominio/modelos/pago';
import { Disponibilidad } from '../../../../dominio/modelos/disponibilidad';
import { AgregarNotaCasoUso } from '../../../../aplicacion/casos_uso/agenda/agregar_nota_caso_uso';
import { AsignarCitaCasoUso } from '../../../../aplicacion/casos_uso/agenda/asignar_cita_caso_uso';
import { NotaPostgresRepositorio } from './nota_postgres_repositorio';

const SERVICIOS: Record<string,{duracion:number;precio:number}> = {
  'Consulta general':{duracion:30,precio:50},'Limpieza dental':{duracion:45,precio:120},
  'Ortodoncia':{duracion:45,precio:350},'Blanqueamiento':{duracion:60,precio:350},
  'Endodoncia':{duracion:60,precio:400},'Implantes':{duracion:90,precio:1500},'Odontopediatría':{duracion:45,precio:80}
};
export function paginacion(pagina: unknown, limite: unknown) {
  const p = Number(pagina ?? 1), l = Number(limite ?? 50);
  if (!Number.isInteger(p)||p<1||!Number.isInteger(l)||l<1||l>100) throw new ErrorAplicacion('Paginación inválida (máximo 100).','DATOS_INVALIDOS');
  return { pagina:p, limite:l, offset:(p-1)*l };
}
export function citaDto(cita: CitaMedica, pago: unknown = null) {
  const acciones = accionesCita(cita);
  return { ...cita, estado:acciones.estadoEfectivo, pago, acciones };
}
function datosPolitica(f: any) {
  return { estado:f.estado,fecha:new Date(f.fecha),fechaOriginal:f.fecha_original ? new Date(f.fecha_original):null,
    primerPagoEn:f.primer_pago_en ? new Date(f.primer_pago_en):null,expiraEn:f.expira_en ? new Date(f.expira_en):null };
}

export class GestionCitasPostgres {
  constructor(private readonly pool: Pool, private readonly pasarela: PasarelaPagoPuerto) {}
  async agregar(doctor:string,id:string,contenido:string) {
    return conTransaccion(this.pool,async c=>{
      await this.bloquear(c,id,doctor);
      return new AgregarNotaCasoUso(new CitaPostgresRepositorio(this.pool,c),new NotaPostgresRepositorio(this.pool,c),new GeneradorIdUuid()).agregar(doctor,id,contenido);
    });
  }
  async asignar(doctor:string,id:string) {
    return conTransaccion(this.pool,async c=>{
      await this.bloquear(c,id,doctor);
      if(!(await c.query("SELECT 1 FROM usuarios WHERE id=$1 AND activo AND rol='Odontologo'",[doctor])).rowCount)throw new ErrorAplicacion('Odontólogo inválido.','NO_AUTORIZADO');
      return new AsignarCitaCasoUso(new CitaPostgresRepositorio(this.pool,c)).asignar(doctor,id);
    });
  }

  private async bloquear(c: PoolClient, id: string, nuevoDoctor?: string) {
    const previa = await c.query('SELECT odontologo_id FROM citas WHERE id=$1',[id]);
    const doctores = [...new Set([previa.rows[0]?.odontologo_id,nuevoDoctor].filter(Boolean))].sort();
    for(const doctor of doctores) await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[doctor]);
    const {rows} = await c.query('SELECT * FROM citas WHERE id=$1 FOR UPDATE',[id]);
    if(!rows[0]) throw new ErrorAplicacion('Cita no encontrada.','CITA_NO_ENCONTRADA');
    if(rows[0].odontologo_id!==previa.rows[0].odontologo_id) throw new ErrorAplicacion('La cita cambió. Actualiza e inténtalo de nuevo.','ESTADO_INVALIDO');
    return rows[0];
  }
  private propietario(f: any, actor: string, rol: string) {
    if(rol==='Paciente' && f.paciente_id!==actor) throw new ErrorAplicacion('No puedes gestionar una cita ajena.','NO_AUTORIZADO');
  }
  async politica(usuarioId: string) {
    const {rows}=await this.pool.query('SELECT politica_version,politica_aceptada_en FROM usuarios WHERE id=$1 AND activo',[usuarioId]);
    return { version:VERSION_POLITICA, aceptada:rows[0]?.politica_version===VERSION_POLITICA, aceptadaEn:rows[0]?.politica_aceptada_en ?? null };
  }
  async aceptarPolitica(usuarioId: string, version: string) {
    if(version!==VERSION_POLITICA) throw new ErrorAplicacion('Debes aceptar la versión vigente.','DATOS_INVALIDOS');
    await conTransaccion(this.pool,async c=>{
      const actor=contextoOperacion.getStore()?.actorId ?? usuarioId;
      await c.query(`UPDATE usuarios SET politica_version=$2,politica_aceptada_en=now(),politica_aceptada_por=$3 WHERE id=$1 AND activo AND politica_version IS DISTINCT FROM $2`,[usuarioId,version,actor]);
      const resultado=await c.query(`INSERT INTO aceptaciones_politica(usuario_id,version,aceptada_en,registrada_por)
        SELECT id,politica_version,politica_aceptada_en,politica_aceptada_por FROM usuarios WHERE id=$1 AND activo AND politica_version=$2
        ON CONFLICT(usuario_id,version) DO NOTHING`,[usuarioId,version]);
      if(!resultado.rowCount && !(await c.query('SELECT 1 FROM usuarios WHERE id=$1 AND activo',[usuarioId])).rowCount)throw new ErrorAplicacion('Usuario no disponible.','PACIENTE_NO_ENCONTRADO');
    });
    return this.politica(usuarioId);
  }
  private async validarPolitica(c: PoolClient,paciente: string) {
    const {rows}=await c.query('SELECT politica_version FROM usuarios WHERE id=$1 AND activo AND rol=\'Paciente\'',[paciente]);
    if(!rows.length) throw new ErrorAplicacion('Paciente no disponible.','PACIENTE_NO_ENCONTRADO');
    if(rows[0].politica_version!==VERSION_POLITICA) throw new ErrorAplicacion('El paciente debe aceptar la política vigente antes de reservar.','POLITICA_PENDIENTE');
  }
  async crearCita(s: SolicitudCita) {
    return conTransaccion(this.pool,async c=>{
      await this.validarPolitica(c,s.pacienteId);
      const servicio=SERVICIOS[s.servicio ?? 'Consulta general'];
      if(!servicio) throw new ErrorAplicacion('Servicio no válido.','DATOS_INVALIDOS');
      s={...s,duracionMinutos:servicio.duracion,servicio:s.servicio ?? 'Consulta general'};
      if(s.odontologoId) await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[s.odontologoId]);
      await this.validarHorario(c,s.odontologoId ?? null,s.fecha,s.duracionMinutos);
      const caso=new CrearCitaCasoUso(new CitaPostgresRepositorio(this.pool,c),new PagoPostgresRepositorio(this.pool,c),this.pasarela,
        new ValidacionReservaServicio(),new GeneradorIdUuid(),new UsuarioPostgresRepositorio(c));
      const resultado=await caso.crearCita(s);
      await c.query('UPDATE citas SET politica_version=$2,precio_referencial=$3 WHERE id=$1',[resultado.cita.id,VERSION_POLITICA,servicio.precio]);
      return { ...resultado,cita:(await new CitaPostgresRepositorio(this.pool,c).buscarPorId(resultado.cita.id))! };
    });
  }
  async crearReservaTemporal(s: SolicitudReserva) {
    return conTransaccion(this.pool,async c=>{
      await this.validarPolitica(c,s.pacienteId);
      await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[s.odontologoId]);
      await this.validarHorario(c,s.odontologoId,s.fecha,s.duracionMinutos);
      const reserva=await new CrearReservaTemporalCasoUso(new CitaPostgresRepositorio(this.pool,c),new ValidacionReservaServicio(),new GeneradorIdUuid()).crearReservaTemporal(s);
      const referencia=await this.pasarela.generarQr(reserva.monto,reserva.reservaId);
      await new PagoPostgresRepositorio(this.pool,c).guardar(new Pago(randomUUID(),reserva.reservaId,reserva.monto,'PENDIENTE','PEN','QR','ADELANTO',referencia));
      await c.query('UPDATE citas SET politica_version=$2 WHERE id=$1',[reserva.reservaId,VERSION_POLITICA]);
      return reserva;
    });
  }
  async confirmarCita(id:string,pagoId:string,pacienteId?:string) {
    return conTransaccion(this.pool,async c=>{
      const f=await this.bloquear(c,id);
      this.propietario(f,pacienteId ?? '', 'Paciente');
      const {rows}=await c.query("SELECT id FROM pagos WHERE id=$1 AND cita_id=$2 AND estado='APROBADO'",[pagoId,id]);
      if(!rows.length) throw new ErrorAplicacion('Se necesita un pago aprobado de esta cita.','ESTADO_INVALIDO');
      const repo=new CitaPostgresRepositorio(this.pool,c);
      const cita=(await repo.buscarPorId(id))!;
      if(cita.estado==='CONFIRMADA') return cita;
      if(cita.expiraEn && cita.expiraEn<=new Date()) throw new ErrorAplicacion('Reserva vencida.','RESERVA_VENCIDA');
      cita.confirmar(pagoId); await repo.actualizar(cita); return (await repo.buscarPorId(id))!;
    });
  }
  async listarPorPaciente(pacienteId:string,pagina=1,limite=50,seccion='') {
    const p=paginacion(pagina,limite);
    // Dos consultas acotadas, sin N+1; se conserva el contrato CitaConPago.
    if(!['','proximas','historial','atendidas'].includes(seccion))throw new ErrorAplicacion('Sección de citas inválida.','DATOS_INVALIDOS');
    const {rows}=await this.pool.query(`SELECT * FROM citas WHERE paciente_id=$1 AND
      ($4 NOT IN ('proximas','historial','atendidas') OR
       $4='atendidas' AND estado='ATENDIDA' OR
       $4='proximas' AND estado IN ('CONFIRMADA','TEMPORAL','PENDIENTE_PAGO') AND fecha>now() AND (estado='CONFIRMADA' OR expira_en IS NULL OR expira_en>now()) OR
       $4='historial' AND (estado IN ('CANCELADA','VENCIDA','ATENDIDA','NO_ASISTIO') OR fecha<=now() OR estado IN ('TEMPORAL','PENDIENTE_PAGO') AND expira_en<=now()))
      ORDER BY fecha DESC,id DESC LIMIT $2 OFFSET $3`,[pacienteId,p.limite,p.offset,seccion]);
    if(!rows.length) return [];
    const ids=rows.map(r=>r.id);
    const pagos=await this.pool.query(`SELECT DISTINCT ON(cita_id) * FROM pagos WHERE cita_id=ANY($1::uuid[])
        ORDER BY cita_id,(tipo='ADELANTO') DESC,pagado_en ASC NULLS LAST,id`,[ids]);
    const repo=new CitaPostgresRepositorio(this.pool);
    // Conversión reutilizada sin ejecutar una consulta por registro.
    return rows.map(f=>({cita:repo.desdeFila(f),pago:new PagoPostgresRepositorio(this.pool).desdeFilaOpcional(pagos.rows.find(p=>p.cita_id===f.id))}));
  }
  async detalle(c: PoolClient,id:string) {
    const cita=(await new CitaPostgresRepositorio(this.pool,c).buscarPorId(id))!;
    const pago=await new PagoPostgresRepositorio(this.pool,c).buscarPorCitaId(id);
    const dev=await c.query('SELECT * FROM devoluciones WHERE cita_id=$1',[id]);
    const politica=await c.query("SELECT despues FROM eventos_cita WHERE cita_id=$1 AND tipo='POLITICA_CANCELACION' ORDER BY id DESC LIMIT 1",[id]);
    return {...citaDto(cita,pago),devolucion:dev.rows[0] ?? null,resultadoCancelacion:politica.rows[0]?.despues ?? null};
  }
  async cancelar(id:string,actor:string,rol:string,motivo:string,solicitar:boolean,porClinica=false,estadoEsperado?:string) {
    const solicitadaEn=new Date();
    return conTransaccion(this.pool,async c=>{
      const f=await this.bloquear(c,id); this.propietario(f,actor,rol);
      if(porClinica && !['Recepcion','Administrador'].includes(rol)) throw new ErrorAplicacion('Acción no autorizada.','NO_AUTORIZADO');
      if(f.estado==='CANCELADA') return this.detalle(c,id);
      if(estadoEsperado&&f.estado!==estadoEsperado)throw new ErrorAplicacion('El estado de la cita cambió durante la operación. Actualiza para revisar el pago y la devolución.','ESTADO_INVALIDO');
      const a=accionesCita(datosPolitica(f),solicitadaEn);
      if(!a.puedeCancelar && !(porClinica && f.estado==='CONFIRMADA')) throw new ErrorAplicacion('Esta cita ya no se puede cancelar.','ESTADO_INVALIDO');
      const contexto=contextoOperacion.getStore(); if(contexto) contexto.motivo=motivo;
      await c.query("SELECT set_config('aura.motivo',$1,true)",[motivo]);
      if(solicitar && !(a.puedeSolicitarDevolucion || porClinica)) throw new ErrorAplicacion('No corresponde devolución en este plazo. Puedes cancelar sin devolución.','ESTADO_INVALIDO');
      const {rows:adelantos}=await c.query("SELECT coalesce(sum(monto),0) monto FROM pagos WHERE cita_id=$1 AND estado='APROBADO' AND tipo='ADELANTO'",[id]);
      const elegible=(a.puedeSolicitarDevolucion||porClinica)&&Number(adelantos[0].monto)>0;
      if(solicitar && !elegible)throw new ErrorAplicacion('No hay un adelanto aprobado que devolver. Puedes cancelar sin devolución.','ESTADO_INVALIDO');
      if((solicitar || porClinica)&&elegible) {
        await c.query(`INSERT INTO devoluciones(id,cita_id,monto,estado,solicitada_por,motivo,solicitada_en)
          VALUES($1,$2,$3,'PENDIENTE_ENTREGA',$4,$5,$6) ON CONFLICT(cita_id) DO NOTHING`,[randomUUID(),id,adelantos[0].monto,actor,motivo,solicitadaEn]);
      }
      await c.query("UPDATE citas SET estado='CANCELADA' WHERE id=$1",[id]);
      await c.query("UPDATE pagos SET estado='ANULADO' WHERE cita_id=$1 AND estado='PENDIENTE'",[id]);
      await c.query("SELECT registrar_evento_cita($1,'POLITICA_CANCELACION',NULL,$2::jsonb)",[id,JSON.stringify({porClinica,devolucionElegible:elegible,devolucionSolicitada:(solicitar||porClinica)&&elegible,evaluadaEn:solicitadaEn.toISOString()})]);
      return this.detalle(c,id);
    });
  }
  async reprogramar(id:string,actor:string,rol:string,fecha:Date,doctor:string) {
    return conTransaccion(this.pool,async c=>{
      const f=await this.bloquear(c,id,doctor); this.propietario(f,actor,rol);
      if(!accionesCita(datosPolitica(f)).puedeReprogramar) throw new ErrorAplicacion('Solo se puede modificar durante el día del pago, antes del inicio.','ESTADO_INVALIDO');
      await this.validarHorario(c,doctor,fecha,f.duracion_minutos,id);
      await c.query('UPDATE citas SET fecha=$2,odontologo_id=$3 WHERE id=$1',[id,fecha,doctor]);
      return this.detalle(c,id);
    });
  }
  async inasistencia(id:string) {
    return conTransaccion(this.pool,async c=>{
      const f=await this.bloquear(c,id);
      if(f.estado==='NO_ASISTIO') return this.detalle(c,id);
      if(f.estado!=='CONFIRMADA'||new Date(f.fecha).getTime()+f.duracion_minutos*60000>Date.now()) throw new ErrorAplicacion('Registra la ausencia después de terminar el horario de una cita confirmada.','ESTADO_INVALIDO');
      await c.query("UPDATE citas SET estado='NO_ASISTIO' WHERE id=$1",[id]); return this.detalle(c,id);
    });
  }
  async entregar(id:string,actor:string,referencia:string) {
    return conTransaccion(this.pool,async c=>{
      const {rows}=await c.query('SELECT * FROM devoluciones WHERE id=$1 FOR UPDATE',[id]);
      if(!rows[0]) throw new ErrorAplicacion('Devolución no encontrada.','CITA_NO_ENCONTRADA');
      if(rows[0].estado==='ENTREGADA') return rows[0];
      return (await c.query(`UPDATE devoluciones SET estado='ENTREGADA',entregada_en=now(),entregada_por=$2,referencia=$3 WHERE id=$1 RETURNING *`,[id,actor,referencia])).rows[0];
    });
  }
  async disponibilidad(doctor:string,dia:string,duracion=30,excluir?:string,conexion?:PoolClient) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(dia)||!Number.isFinite(new Date(`${dia}T00:00:00-05:00`).getTime())||new Date(`${dia}T12:00:00Z`).toISOString().slice(0,10)!==dia||!Number.isInteger(duracion)||duracion<15||duracion>180) throw new ErrorAplicacion('Fecha o duración inválida.','DATOS_INVALIDOS');
    const c=conexion ?? this.pool;
    if(!(await c.query("SELECT 1 FROM usuarios WHERE id=$1 AND rol='Odontologo' AND activo",[doctor])).rowCount) throw new ErrorAplicacion('Odontólogo no disponible.','DATOS_INVALIDOS');
    const config=(await c.query('SELECT clave,valor FROM configuracion')).rows.reduce((a,r)=>({...a,[r.clave]:r.valor}),{} as Record<string,string>);
    const semanal=new Date(`${dia}T12:00:00Z`).getUTCDay();
    const minutos=(h:string)=>{const [hh,mm]=h.split(':').map(Number);return hh*60+mm;};
    const inicio=minutos(semanal===6 ? config.sabado_apertura ?? '08:00':config.hora_apertura ?? '08:00');
    const fin=minutos(semanal===6 ? config.sabado_cierre ?? '12:00':config.hora_cierre ?? '20:00');
    const almuerzo=[minutos(config.hora_inicio_almuerzo ?? '12:00'),minutos(config.hora_fin_almuerzo ?? '14:00')];
    const base=new Date(`${dia}T00:00:00-05:00`).getTime();
    const citas=await c.query(`SELECT fecha,duracion_minutos FROM citas WHERE odontologo_id=$1 AND id IS DISTINCT FROM $4::uuid
      AND fecha >= $2 AND fecha < $3 AND (estado='CONFIRMADA' OR (estado IN ('TEMPORAL','PENDIENTE_PAGO') AND (expira_en IS NULL OR expira_en>now())))`,[doctor,new Date(base-86400000),new Date(base+86400000),excluir ?? null]);
    const intervalos=[];
    if(!(semanal===0 && config.domingo_cerrado!=='false')) for(let m=inicio;m+duracion<=fin;m+=15) {
      if(semanal!==6 && m<almuerzo[1]&&m+duracion>almuerzo[0]) continue;
      const desde=base+m*60000,hasta=desde+duracion*60000;
      const disponible=desde>Date.now()&&!citas.rows.some(r=>new Date(r.fecha).getTime()<hasta&&new Date(r.fecha).getTime()+r.duracion_minutos*60000>desde);
      const hora=(n:number)=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
      intervalos.push({horaInicio:hora(m),horaFin:hora(m+duracion),disponible});
    }
    return {odontologoId:doctor,fecha:new Date(base),intervalos};
  }
  async consultarDisponibilidad(consulta:{odontologoId:string;fecha:Date}) {
    const dia=new Date(consulta.fecha.getTime()-5*3600000).toISOString().slice(0,10);
    const d=await this.disponibilidad(consulta.odontologoId,dia);
    return new Disponibilidad(d.odontologoId,d.fecha,d.intervalos);
  }
  private async validarHorario(c:PoolClient,doctor:string|null,fecha:Date,duracion:number,excluir?:string) {
    if(!doctor||!Number.isFinite(fecha.getTime())||fecha<=new Date()) throw new ErrorAplicacion('Selecciona odontólogo y fecha futura.','DATOS_INVALIDOS');
    const local=new Date(fecha.getTime()-5*3600000).toISOString();
    const d=await this.disponibilidad(doctor,local.slice(0,10),duracion,excluir,c);
    if(fecha.getUTCSeconds()!==0||fecha.getUTCMilliseconds()!==0||!d.intervalos.some(i=>i.horaInicio===local.slice(11,16)&&i.disponible)) throw new ErrorAplicacion('Horario no disponible para la duración del servicio.','ESTADO_INVALIDO');
  }
}
