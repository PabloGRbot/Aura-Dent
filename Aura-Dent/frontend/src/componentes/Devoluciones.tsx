import { useCallback, useEffect, useState } from 'react';
import { listarDevoluciones, entregarDevolucion, Devolucion, fechaLima } from '../api/gestion_citas';
import { formatearSoles } from '../catalogo_servicios';
import { useConfirmacion } from './Confirmacion';
import { Paginador } from './Paginador';
import { MovimientosCita } from './MovimientosCita';
export function Devoluciones({personal=false,alCambiar}:{personal?:boolean;alCambiar?:()=>void}){
  const [filas,setFilas]=useState<Devolucion[]>([]),[error,setError]=useState(''),[pagina,setPagina]=useState(1),[referencias,setReferencias]=useState<Record<string,string>>({});
  const confirmar=useConfirmacion();
  const cargar=useCallback(()=>listarDevoluciones(pagina).then(setFilas).catch(e=>setError(e.message)),[pagina]);
  useEffect(()=>{void cargar();},[cargar]);
  function entregar(d:Devolucion){confirmar({titulo:'Registrar entrega en consultorio',descripcion:`Confirma que entregaste ${formatearSoles(d.monto)} a ${d.paciente_nombre}. Esta acción se conserva en auditoría.`,accion:'Registrar entrega'},async()=>{try{await entregarDevolucion(d.id,referencias[d.id]);await cargar();alCambiar?.();}catch(e){setError((e as Error).message);}});}
  return <section className="devoluciones"><h2>{personal?'Devoluciones en consultorio':'Mis devoluciones'}</h2>{error&&<p className="error">{error}</p>}
    {!filas.length?<p className="dato-secundario">No hay solicitudes en esta página.</p>:<ul className="lista-citas">{filas.map(d=><li className="cita" key={d.id}><div><strong>{formatearSoles(d.monto)} · {d.estado==='ENTREGADA'?'Entregada':'Pendiente de recoger'}</strong><p>{personal?`${d.paciente_nombre} · `:''}{fechaLima(d.solicitada_en)}</p>{d.entregada_en&&<small>Entregada: {fechaLima(d.entregada_en)} · {d.referencia}</small>}</div>
      {personal&&d.estado==='PENDIENTE_ENTREGA'&&<div><label>Referencia de entrega<input value={referencias[d.id]??''} maxLength={500} onChange={e=>setReferencias({...referencias,[d.id]:e.target.value})}/></label><button type="button" disabled={!referencias[d.id]?.trim()} onClick={()=>entregar(d)}>Registrar entrega</button></div>}{personal&&<MovimientosCita citaId={d.cita_id}/>}</li>)}</ul>}
    <Paginador pagina={pagina} cantidad={filas.length} onCambiar={setPagina}/></section>;
}
