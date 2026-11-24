import { useEffect, useRef, useState } from 'react';
import { Cita } from '../tipos';
import { cancelarCita, reprogramarCita, registrarInasistencia, obtenerDisponibilidad, listarEventos, Evento, Intervalo, hoyLima, fechaLima } from '../api/gestion_citas';
import { listarOdontologos, Odontologo } from '../api/odontologos';
import { CampoFecha } from './CampoFecha';
import { Selector } from './Selector';
import { LimitesCita } from './PoliticaCitas';
import { Paginador } from './Paginador';
import { ListaMovimientos } from './ListaMovimientos';

type CitaGestion=Pick<Cita,'id'|'estado'|'fecha'|'duracionMinutos'|'odontologoId'|'acciones'>;
export function AccionesCita({cita,personal=false,alCambiar}:{cita:CitaGestion;personal?:boolean;alCambiar:()=>void}) {
  const [modal,setModal]=useState<'cancelar'|'editar'|'eventos'|null>(null),[error,setError]=useState(''),[ocupado,setOcupado]=useState(false);
  const [motivo,setMotivo]=useState(''),[devolver,setDevolver]=useState(true),[clinica,setClinica]=useState(false);
  const [dia,setDia]=useState(''),[hora,setHora]=useState(''),[doctor,setDoctor]=useState(cita.odontologoId ?? '');
  const [doctores,setDoctores]=useState<Odontologo[]>([]),[slots,setSlots]=useState<Intervalo[]>([]),[eventos,setEventos]=useState<Evento[]>([]),[pagina,setPagina]=useState(1);
  const dialogo=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(modal){dialogo.current?.showModal();setError('');}else dialogo.current?.close();},[modal]);
  useEffect(()=>{if(modal==='editar')listarOdontologos().then(setDoctores).catch(e=>setError(e.message));},[modal]);
  useEffect(()=>{setSlots([]);setHora('');if(modal!=='editar'||!doctor||!dia)return;let vivo=true;
    obtenerDisponibilidad(doctor,dia,cita.duracionMinutos,cita.id).then(d=>{if(vivo)setSlots(d.intervalos);}).catch(e=>{if(vivo)setError(e.message);});return()=>{vivo=false;};
  },[modal,doctor,dia,cita.id,cita.duracionMinutos]);
  useEffect(()=>{if(modal==='eventos')listarEventos(cita.id,pagina).then(setEventos).catch(e=>setError(e.message));},[modal,cita.id,pagina]);
  async function ejecutar(tarea:()=>Promise<unknown>){if(ocupado)return;setOcupado(true);setError('');try{await tarea();setModal(null);alCambiar();}catch(e){setError((e as Error).message);alCambiar();}finally{setOcupado(false);}}
  const a=cita.acciones;
  return <>
    <span className="cita-acciones">
      {a?.puedeReprogramar&&<button type="button" className="boton-secundario" onClick={()=>setModal('editar')}>Editar cita</button>}
      {(a?.puedeCancelar||personal&&cita.estado==='CONFIRMADA')&&<button type="button" className="boton-secundario" onClick={()=>{setMotivo('');setDevolver(true);setClinica(false);setModal('cancelar');}}>{['TEMPORAL','PENDIENTE_PAGO'].includes(cita.estado)?'Cancelar reserva':'Cancelar cita'}</button>}
      {personal&&cita.estado==='CONFIRMADA'&&Date.now()>=new Date(cita.fecha).getTime()+cita.duracionMinutos*60000&&<button type="button" className="boton-secundario" disabled={ocupado} onClick={()=>void ejecutar(()=>registrarInasistencia(cita.id))}>Registrar inasistencia</button>}
      <button type="button" className="boton-secundario" onClick={()=>{setPagina(1);setModal('eventos');}}>Ver movimientos</button>
    </span>
    <dialog ref={dialogo} className="aura-gestion-dialogo" onCancel={e=>{if(ocupado)e.preventDefault();else setModal(null);}}>
      <h3>{modal==='editar'?'Editar cita':modal==='eventos'?'Movimientos de la cita':'Cancelar cita'}</h3>
      {modal!=='eventos'&&<p>{fechaLima(cita.fecha)}</p>}
      {modal==='cancelar'&&<>
        <p>El horario quedará libre y la reserva se conservará en el historial.</p>
        <label>Motivo<textarea value={motivo} maxLength={500} onChange={e=>setMotivo(e.target.value)} /></label>
        {personal&&<label><input type="checkbox" checked={clinica} onChange={e=>setClinica(e.target.checked)}/> Cancelación por la clínica (devuelve el adelanto aprobado).</label>}
        {a?.puedeSolicitarDevolucion&&!clinica&&<label><input type="checkbox" checked={devolver} onChange={e=>setDevolver(e.target.checked)}/> Solicitar devolución del adelanto para recogerlo en el consultorio.</label>}
        {cita.estado==='CONFIRMADA'&&!a?.puedeSolicitarDevolucion&&!clinica&&<p className="aviso-sin-horarios">Esta cancelación está fuera del plazo de devolución: se pierde el adelanto.</p>}
      </>}
      {modal==='editar'&&<>
        <LimitesCita acciones={a}/>
        <label>Odontólogo<Selector buscable onBuscar={q=>{listarOdontologos(q).then(setDoctores).catch(e=>setError(e.message));}} value={doctor} onChange={e=>setDoctor(e.target.value)}>{doctores.map(d=><option key={d.id} value={d.id}>{d.nombres} {d.apellidos}</option>)}</Selector></label>
        <label className="aura-editar-fecha"><span>Fecha</span><CampoFecha value={dia} min={hoyLima()} onChange={setDia}/></label>
        <label>Hora<Selector value={hora} onChange={e=>setHora(e.target.value)}><option value="">Selecciona un horario disponible</option>{slots.filter(s=>s.disponible).map(s=><option key={s.horaInicio} value={s.horaInicio}>{s.horaInicio} – {s.horaFin}</option>)}</Selector></label>
        <p className="dato-secundario">Se mantienen el servicio y el adelanto. Los cambios no renuevan los plazos de devolución.</p>
      </>}
      {modal==='eventos'&&<><ListaMovimientos eventos={eventos}/>{!eventos.length&&<p>No hay movimientos registrados; las operaciones anteriores a esta actualización no se reconstruyen.</p>}<Paginador pagina={pagina} cantidad={eventos.length} onCambiar={setPagina}/></>}
      {error&&<p className="error" role="alert">{error}</p>}
      <div className="modal-acciones"><button type="button" className="boton-secundario" disabled={ocupado} onClick={()=>setModal(null)}>Cerrar</button>
        {modal==='cancelar'&&<button type="button" disabled={ocupado||!motivo.trim()} onClick={()=>void ejecutar(()=>cancelarCita(cita.id,!!a?.puedeSolicitarDevolucion&&devolver,motivo,clinica,cita.estado))}>{ocupado?'Guardando…':(a?.puedeSolicitarDevolucion&&devolver||clinica)?'Cancelar y solicitar devolución':'Cancelar sin devolución'}</button>}
        {modal==='editar'&&<button type="button" disabled={ocupado||!hora||!dia||!doctor} onClick={()=>void ejecutar(()=>reprogramarCita(cita.id,new Date(`${dia}T${hora}:00-05:00`).toISOString(),doctor))}>{ocupado?'Guardando…':'Guardar cambios'}</button>}
      </div>
    </dialog>
  </>;
}
