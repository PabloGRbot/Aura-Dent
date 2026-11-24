export function Paginador({pagina,cantidad,onCambiar,ocupado=false}:{pagina:number;cantidad:number;onCambiar:(p:number)=>void;ocupado?:boolean}){
  if(pagina===1&&cantidad<50)return null;
  return <nav className="aura-paginador" aria-label="Paginación"><button type="button" className="boton-secundario" disabled={ocupado||pagina===1} onClick={()=>onCambiar(pagina-1)}>Anterior</button><span>Página {pagina}</span><button type="button" className="boton-secundario" disabled={ocupado||cantidad<50} onClick={()=>onCambiar(pagina+1)}>Siguiente</button></nav>;
}
