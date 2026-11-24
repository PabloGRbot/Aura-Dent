import { useEffect, useState } from 'react';
import { aceptarPolitica, estadoPolitica, obtenerPolitica, Politica, fechaLima } from '../api/gestion_citas';

export function PoliticaCitas({requerirAceptacion=false,onAceptada,onCargada,pacienteId}:{requerirAceptacion?:boolean;onAceptada?:()=>void;onCargada?:(version:string)=>void;pacienteId?:string}) {
  const [politica,setPolitica]=useState<Politica|null>(null);
  const [aceptada,setAceptada]=useState(false),[procesando,setProcesando]=useState(false),[error,setError]=useState('');
  useEffect(()=>{let activo=true;setAceptada(false);
    obtenerPolitica().then(p=>{if(activo){setPolitica(p);onCargada?.(p.version);}}).catch(e=>{if(activo)setError(e.message);});
    if(requerirAceptacion&&!pacienteId) estadoPolitica().then(e=>{if(activo){setAceptada(e.aceptada);if(e.aceptada)onAceptada?.();}}).catch(e=>{if(activo)setError(e.message);});
    return()=>{activo=false;};
  },[requerirAceptacion,pacienteId]);
  async function aceptar(){if(!politica)return;setProcesando(true);setError('');try{await aceptarPolitica(politica.version,pacienteId);setAceptada(true);onAceptada?.();}catch(e){setError((e as Error).message);}finally{setProcesando(false);}}
  return <div className="politica-citas">
    <details><summary>Política de citas, cambios y devoluciones</summary><p>{politica?.texto ?? 'Cargando política…'}</p>{politica&&<small>Versión {politica.version} · Horarios de Lima</small>}</details>
    <p className="dato-secundario">Devolución: durante el día del pago antes del inicio, o con al menos 48 horas exactas de anticipación. Para citas de mañana, el beneficio puede terminar hoy a las 23:59 de Lima. Recogida en el consultorio.</p>
    {requerirAceptacion&&!aceptada&&<label><input type="checkbox" checked={false} disabled={!politica||procesando} onChange={()=>void aceptar()}/> {pacienteId?'El paciente ha leído y aceptado esta política.':'He leído y acepto la política vigente.'}</label>}
    {requerirAceptacion&&aceptada&&<small>Política aceptada.</small>}
    {error&&<p className="error" role="alert">{error}</p>}
  </div>;
}
export function LimitesCita({acciones}:{acciones?:{limiteEdicion:string|null;limiteEdicionSiPagaAhora?:string|null;limiteDevolucion48:string;finGracia:string|null;soloGracia:boolean}}){
  if(!acciones)return null;
  const limite=acciones.limiteEdicion??acciones.limiteEdicionSiPagaAhora;
  return <p className="dato-secundario">{limite&&<>{acciones.limiteEdicion?'Cambios':'Si pagas ahora, cambios y beneficio del día de pago'} hasta {fechaLima(new Date(new Date(limite).getTime()-1).toISOString())} de Lima (antes del inicio). </>}
    Devolución ordinaria hasta {fechaLima(acciones.limiteDevolucion48)}; también durante el día del pago antes del inicio. {acciones.soloGracia?'Esta cita cercana depende del beneficio del día del pago.':''}</p>;
}
