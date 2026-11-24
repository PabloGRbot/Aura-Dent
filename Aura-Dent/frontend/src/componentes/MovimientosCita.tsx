import { useEffect,useRef,useState } from 'react';
import { Evento,listarEventos } from '../api/gestion_citas';
import { Paginador } from './Paginador';
import { ListaMovimientos } from './ListaMovimientos';
export function MovimientosCita({citaId}:{citaId:string}){
  const [abierto,setAbierto]=useState(false),[eventos,setEventos]=useState<Evento[]>([]),[error,setError]=useState(''),[pagina,setPagina]=useState(1);
  const dialogo=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(!abierto){dialogo.current?.close();return;}dialogo.current?.showModal();let vivo=true;
    listarEventos(citaId,pagina).then(e=>{if(vivo){setEventos(e);setError('');}}).catch(e=>{if(vivo)setError(e.message);});return()=>{vivo=false;};
  },[abierto,citaId,pagina]);
  return <><button type="button" className="boton-secundario" onClick={()=>{setPagina(1);setAbierto(true);}}>Ver movimientos</button>
    <dialog className="aura-gestion-dialogo" ref={dialogo} onCancel={()=>setAbierto(false)}><h3>Movimientos de la cita</h3>
      {error&&<p className="error">{error}</p>}<ListaMovimientos eventos={eventos}/>
      {!eventos.length&&!error&&<p>Sin movimientos registrados. Los anteriores a la actualización no se reconstruyen.</p>}
      <Paginador pagina={pagina} cantidad={eventos.length} onCambiar={setPagina}/><button type="button" className="boton-secundario" onClick={()=>setAbierto(false)}>Cerrar</button>
    </dialog></>;
}
