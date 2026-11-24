import { createContext, ReactNode, useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './retoques.css';

interface DatosConfirmacion { titulo: string; descripcion: string; accion: string }
type Confirmar = (datos: DatosConfirmacion, tarea: () => Promise<void>) => void;
const Contexto = createContext<Confirmar | null>(null);

export function ProveedorConfirmacion({ children }: { children: ReactNode }) {
  const [datos, setDatos] = useState<DatosConfirmacion | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const tarea = useRef<(() => Promise<void>) | null>(null);
  const bloqueo = useRef(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const descripcionId = useId();
  useEffect(() => {
    if (!datos) return;
    const anterior = document.activeElement as HTMLElement | null;
    dialogo.current?.showModal();
    return () => { dialogo.current?.close(); anterior?.focus(); };
  }, [datos]);
  function cerrar() { if (bloqueo.current) return; dialogo.current?.close(); tarea.current = null; setDatos(null); }
  const confirmar: Confirmar = (solicitud, ejecutar) => {
    if (tarea.current) return;
    tarea.current = ejecutar; setError(''); setDatos(solicitud);
  };
  async function ejecutar() {
    if (bloqueo.current || !tarea.current) return;
    bloqueo.current = true; setOcupado(true);
    try { await tarea.current(); bloqueo.current = false; cerrar(); }
    catch { setError('No se pudo completar la acción. Intenta nuevamente.'); }
    finally { bloqueo.current = false; setOcupado(false); }
  }
  return <Contexto.Provider value={confirmar}>{children}{datos && createPortal(
    <dialog className="modal aura-confirmacion" ref={dialogo} role="alertdialog" aria-modal="true" aria-labelledby={tituloId} aria-describedby={descripcionId}
      aria-busy={ocupado} onCancel={(e) => { e.preventDefault(); cerrar(); }}>
      <span className="aura-confirmacion-icono" aria-hidden="true">!</span>
      <h3 id={tituloId}>{datos.titulo}</h3><p id={descripcionId}>{datos.descripcion}</p>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="modal-acciones"><button type="button" className="boton-secundario" autoFocus disabled={ocupado} onClick={cerrar}>Cancelar</button>
        <button type="button" className="boton-peligro" disabled={ocupado} onClick={() => void ejecutar()}>{ocupado ? 'Procesando…' : datos.accion}</button></div>
    </dialog>, document.body)}</Contexto.Provider>;
}
export function useConfirmacion(): Confirmar {
  const confirmar = useContext(Contexto);
  if (!confirmar) throw new Error('Falta ProveedorConfirmacion');
  return confirmar;
}
