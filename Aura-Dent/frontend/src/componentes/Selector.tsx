import { Children, isValidElement, ReactNode, SelectHTMLAttributes, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './retoques.css';

interface Opcion { valor: string; texto: string; deshabilitada: boolean }
function textoNodo(nodo: ReactNode): string {
  return Children.toArray(nodo).map((n) => isValidElement<{ children?: ReactNode }>(n) ? textoNodo(n.props.children) : String(n)).join('');
}
function opciones(nodos: ReactNode): Opcion[] {
  return Children.toArray(nodos).flatMap((n) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(n)) return [];
    return n.type === 'option'
      ? [{ valor: String(n.props.value ?? textoNodo(n.props.children)), texto: textoNodo(n.props.children), deshabilitada: Boolean(n.props.disabled) }]
      : opciones(n.props.children);
  });
}

export function Selector({ children, buscable = false, onBuscar, onChange, onInvalid, id, className, ...props }:
  SelectHTMLAttributes<HTMLSelectElement> & { buscable?: boolean; onBuscar?:(texto:string)=>void }) {
  const lista = opciones(children);
  const nativo = useRef<HTMLSelectElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const busqueda = useRef<HTMLInputElement>(null);
  const [filtro, setFiltro] = useState('');
  const [invalido, setInvalido] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState({ left: 12, top: 12, width: 240, maxHeight: 300 });
  const tituloId = useId();
  const seleccion = String(props.value ?? props.defaultValue ?? lista[0]?.valor ?? '');
  const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const visibles = lista.filter((o) => normalizar(o.texto).includes(normalizar(filtro)));

  const posicionar = useCallback(() => {
    if (!dialogo.current?.open || !boton.current) return;
    const rect = boton.current.getBoundingClientRect();
    const viewport = window.visualViewport;
    const arribaViewport = viewport?.offsetTop ?? 0;
    const abajoViewport = arribaViewport + (viewport?.height ?? window.innerHeight);
    const anchoViewport = viewport?.width ?? window.innerWidth;
    const margen = 12, separacion = 6;
    const debajo = Math.max(0, abajoViewport - margen - rect.bottom - separacion);
    const encima = Math.max(0, rect.top - arribaViewport - margen - separacion);
    const altoReal = Math.min(dialogo.current.scrollHeight + 2, 300);
    const abrirDebajo = debajo >= altoReal || debajo >= Math.min(altoReal, 160) || debajo >= encima;
    const maxHeight = Math.max(0, Math.min(300, abrirDebajo ? debajo : encima));
    const siguiente = {
      width: Math.min(Math.max(rect.width, 240), anchoViewport - margen * 2),
      left: Math.max(margen, Math.min(rect.left, anchoViewport - Math.min(Math.max(rect.width, 240), anchoViewport - margen * 2) - margen)),
      top: abrirDebajo ? rect.bottom + separacion : Math.max(arribaViewport + margen, rect.top - Math.min(altoReal, maxHeight) - separacion),
      maxHeight
    };
    setPosicion(actual => Object.keys(siguiente).every(clave => actual[clave as keyof typeof actual] === siguiente[clave as keyof typeof siguiente]) ? actual : siguiente);
  }, []);

  // Mide las opciones reales después de renderizarlas, también si cambia la búsqueda remota.
  useLayoutEffect(() => { if (abierto) posicionar(); });
  useEffect(() => {
    if (!abierto) return;
    window.addEventListener('resize', posicionar);
    window.addEventListener('scroll', posicionar, true);
    window.visualViewport?.addEventListener('resize', posicionar);
    window.visualViewport?.addEventListener('scroll', posicionar);
    return () => {
      window.removeEventListener('resize', posicionar);
      window.removeEventListener('scroll', posicionar, true);
      window.visualViewport?.removeEventListener('resize', posicionar);
      window.visualViewport?.removeEventListener('scroll', posicionar);
    };
  }, [abierto, posicionar]);

  function abrir() {
    setFiltro('');
    onBuscar?.('');
    dialogo.current?.showModal();
    setAbierto(true);
    requestAnimationFrame(() => {
      if (buscable) busqueda.current?.focus({ preventScroll: true });
      else (dialogo.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]:not(:disabled)') ?? dialogo.current?.querySelector<HTMLButtonElement>('[role="option"]:not(:disabled)'))?.focus({ preventScroll: true });
      posicionar();
    });
  }

  function elegir(valor: string) {
    const select = nativo.current;
    if (!select) return;
    select.value = valor;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    setInvalido(false);
    dialogo.current?.close();
  }

  return <span className="aura-selector">
    <button type="button" id={id} ref={boton} className={'aura-selector-boton ' + (className ?? '')}
      disabled={props.disabled} aria-haspopup="listbox" aria-invalid={props['aria-invalid'] || invalido}
      aria-describedby={props['aria-describedby']} aria-label={props['aria-label']}
      onClick={abrir}>
      <span>{lista.find((o) => o.valor === seleccion)?.texto || 'Seleccionar'}</span><span aria-hidden="true">⌄</span>
    </button>
    <select {...props} ref={nativo} id={id ? id + '-nativo' : undefined} className="aura-select-nativo" tabIndex={-1} aria-hidden="true"
      onChange={onChange} onInvalid={(e) => { e.preventDefault(); setInvalido(true); boton.current?.focus(); onInvalid?.(e); }}>{children}</select>
    {invalido && <small className="mensaje-campo" role="alert">Selecciona una opción.</small>}
    {createPortal(<dialog ref={dialogo} className="aura-selector-dialogo" style={posicion} aria-modal="true" aria-labelledby={tituloId} onClose={() => setAbierto(false)}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        if (e.target === e.currentTarget && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dialogo.current?.close();
      }}>
      <span className="aura-sr" id={tituloId}>Seleccionar opción</span>
      {buscable && <input type="search" ref={busqueda} value={filtro} onChange={(e) => {setFiltro(e.target.value);onBuscar?.(e.target.value);}} placeholder="Buscar por nombre…" aria-label="Buscar opciones" />}
      <div className="aura-selector-lista" role="listbox" aria-labelledby={tituloId} onKeyDown={(e) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
        const botones = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
        if (!botones.length) return;
        e.preventDefault();
        const index = botones.indexOf(document.activeElement as HTMLButtonElement);
        const nuevo = e.key === 'Home' ? 0 : e.key === 'End' ? botones.length - 1 : Math.max(0, Math.min(botones.length - 1, index + (e.key === 'ArrowDown' ? 1 : -1)));
        botones[nuevo]?.focus();
      }}>
        {visibles.map((o) => <button type="button" role="option" key={o.valor} disabled={o.deshabilitada} aria-selected={seleccion === o.valor}
          onClick={() => elegir(o.valor)}><span>{o.texto}</span>{seleccion === o.valor && <span aria-hidden="true">✓</span>}</button>)}
        {!visibles.length && <p role="status">No hay coincidencias.</p>}
      </div>
      <button type="button" className="aura-selector-cerrar" onClick={() => dialogo.current?.close()}>Cerrar</button>
    </dialog>, document.body)}
  </span>;
}
