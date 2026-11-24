import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { obtenerMisCitas } from '../api/citas';
import { ModalPagoCita } from '../componentes/ModalPagoCita';
import { AccionesCita } from '../componentes/AccionesCita';
import { LimitesCita } from '../componentes/PoliticaCitas';
import { Paginador } from '../componentes/Paginador';
import { Devoluciones } from '../componentes/Devoluciones';
import { ETIQUETA_ESTADO, formatearFecha } from '../formato';
import { Cita } from '../tipos';

export function MisCitas() {
  const ubicacion=useLocation(),navegar=useNavigate();
  const [citas,setCitas]=useState<Cita[]>([]),[cargando,setCargando]=useState(true),[error,setError]=useState(''),[mensaje,setMensaje]=useState('');
  const [citaEnPago,setCitaEnPago]=useState<Cita|null>(null),[pagina,setPagina]=useState(1),[historial,setHistorial]=useState(false),[version,setVersion]=useState(0);
  const cargar=useCallback(async()=>{try{setCitas(await obtenerMisCitas(pagina,historial?'historial':'proximas'));setError('');}catch(e){setError((e as Error).message);}finally{setCargando(false);}},[pagina,historial]);
  useEffect(()=>{void cargar();},[cargar]);
  useEffect(()=>{const t=window.setInterval(()=>{
    if(citas.some(c=>['TEMPORAL','PENDIENTE_PAGO'].includes(c.estado)&&c.expiraEn&&new Date(c.expiraEn).getTime()<=Date.now())){setCitaEnPago(null);void cargar();}
  },1000);return()=>clearInterval(t);},[citas,cargar]);
  const pagarCitaId=(ubicacion.state as {pagarCitaId?:string}|null)?.pagarCitaId;
  useEffect(()=>{const cita=citas.find(c=>c.id===pagarCitaId&&c.acciones?.puedePagar);if(cita){setCitaEnPago(cita);navegar(ubicacion.pathname,{replace:true});}},[pagarCitaId,citas,navegar,ubicacion.pathname]);
  const esHistorial=(c:Cita)=>['CANCELADA','VENCIDA','ATENDIDA','NO_ASISTIO'].includes(c.estado)||new Date(c.fecha).getTime()<=Date.now();
  const visibles=citas.filter(c=>esHistorial(c)===historial);
  function cambiado(){void cargar();setVersion(v=>v+1);}
  return <section className="panel mis-citas">
    <h1>Mis citas</h1><p className="subtitulo">Revisa tus reservas, sus plazos y tus movimientos.</p>
    <div className="reporte-tabs"><button type="button" className={`reporte-tab${!historial?' activo':''}`} onClick={()=>{setPagina(1);setHistorial(false);}}>Próximas citas</button><button type="button" className={`reporte-tab${historial?' activo':''}`} onClick={()=>{setPagina(1);setHistorial(true);}}>Historial de reservas</button></div>
    {cargando?<p>Cargando…</p>:<><ul className="lista-citas">{visibles.map(cita=><li key={cita.id} className="cita">
      <div className="cita-datos"><span className="cita-fecha">{formatearFecha(cita.fecha)}</span><span className="cita-servicio">{cita.servicio ?? 'Consulta general'}</span>
        {cita.estado==='CONFIRMADA'&&<LimitesCita acciones={cita.acciones}/>}</div>
      <div className="cita-estado"><span className={`estado ${cita.estado.toLowerCase()}`}>{ETIQUETA_ESTADO[cita.estado]}</span>
        {cita.acciones?.puedePagar&&<button type="button" className="boton-pagar" onClick={()=>setCitaEnPago(cita)}>Pagar</button>}
        <AccionesCita cita={cita} alCambiar={cambiado}/></div>
    </li>)}</ul>{!visibles.length&&!error&&<p className="subtitulo">No hay citas en esta sección de la página.</p>}<Paginador pagina={pagina} cantidad={citas.length} onCambiar={setPagina}/></>}
    {mensaje&&<p className="exito" role="status">{mensaje}</p>}{error&&<p className="error" role="alert">{error}</p>}
    <Devoluciones key={version}/>
    {citaEnPago&&<ModalPagoCita cita={citaEnPago} onCerrar={()=>setCitaEnPago(null)} onPagado={texto=>{setMensaje(texto);setCitaEnPago(null);cambiado();}}/>}
  </section>;
}
