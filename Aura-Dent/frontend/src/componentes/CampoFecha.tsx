import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './retoques.css';
import { Selector } from './Selector';

function fechaTexto(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

export function CampoFecha({ value, min, max, onChange, etiqueta = 'Fecha', limpiar = false, id, disabled, ...aria }: {
  value: string; min?: string; max?: string; onChange: (fecha: string) => void; etiqueta?: string; limpiar?: boolean;
  id?: string; disabled?: boolean; 'aria-invalid'?: boolean; 'aria-describedby'?: string;
}) {
  const hoy = fechaTexto(new Date());
  const inicial = value || (min && min > hoy ? min : max && max < hoy ? max : hoy);
  const boton = useRef<HTMLButtonElement>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const [mes, setMes] = useState(inicial.slice(0, 7));
  const [anioEdit, setAnioEdit] = useState(inicial.slice(0, 4));
  const [posicion, setPosicion] = useState({ left: 12, top: 12 });
  const [foco, setFoco] = useState(inicial);
  const inicio = new Date(`${mes}-01T12:00:00`);
  const dias = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0).getDate();
  const huecos = (inicio.getDay() + 6) % 7;
  const diaTabulable = foco.slice(0, 7) === mes ? foco : mes === min?.slice(0, 7) ? min : `${mes}-01`;
  useEffect(() => setAnioEdit(mes.slice(0, 4)), [mes]);
  useEffect(() => {
    const cerrar = () => dialogo.current?.close();
    window.addEventListener('resize', cerrar);
    return () => window.removeEventListener('resize', cerrar);
  }, []);

  function abrir() {
    setMes(inicial.slice(0, 7));
    setFoco(inicial);
    const rect = boton.current!.getBoundingClientRect();
    const ancho = Math.min(304, window.innerWidth - 24);
    const alto = Math.min(520, window.innerHeight - 24);
    const debajo = rect.bottom + 8;
    setPosicion({
      left: Math.max(12, Math.min(rect.left, window.innerWidth - ancho - 12)),
      top: Math.max(12, debajo + alto <= window.innerHeight ? debajo : Math.min(rect.top - alto - 8, window.innerHeight - alto - 12))
    });
    dialogo.current?.showModal();
    requestAnimationFrame(() => {
      (dialogo.current?.querySelector<HTMLButtonElement>(`[data-fecha="${inicial}"]:not(:disabled)`)
        ?? dialogo.current?.querySelector<HTMLButtonElement>('[data-fecha]:not(:disabled)'))?.focus();
    });
  }

  function moverMes(cambio: number) {
    setMes(fechaTexto(new Date(inicio.getFullYear(), inicio.getMonth() + cambio, 1, 12)).slice(0, 7));
  }

  function aplicarAnio() {
    const numero = Number(anioEdit);
    if (!Number.isInteger(numero) || numero < 1 || numero > 9999) { setAnioEdit(mes.slice(0, 4)); return; }
    const candidato = String(numero).padStart(4, '0') + mes.slice(4);
    setMes(min && candidato < min.slice(0, 7) ? min.slice(0, 7) : max && candidato > max.slice(0, 7) ? max.slice(0, 7) : candidato);
  }

  return (
    <span className="aura-campo-fecha">
      <button type="button" id={id} disabled={disabled} ref={boton} className="aura-fecha-boton" aria-haspopup="dialog" {...aria}
        aria-label={`${etiqueta}: ${value ? new Date(value + 'T12:00:00').toLocaleDateString('es-PE') : 'Seleccionar fecha'}`}
        onClick={abrir}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18" /></svg>
        <span>{value ? new Date(value + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Seleccionar fecha'}</span>
        <span aria-hidden="true">⌄</span>
      </button>
      {createPortal(<dialog className="aura-fecha-dialogo" ref={dialogo} style={posicion} aria-modal="true" aria-labelledby={tituloId}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          if (e.target === e.currentTarget && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) dialogo.current?.close();
        }}>
        <div className="aura-fecha-cabecera">
          <button type="button" aria-label="Mes anterior" disabled={Boolean(min && mes <= min.slice(0, 7)) || mes === '0001-01'} onClick={() => moverMes(-1)}>‹</button>
          <strong id={tituloId}>{inicio.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}</strong>
          <button type="button" aria-label="Mes siguiente" disabled={Boolean(max && mes >= max.slice(0, 7)) || mes === '9999-12'} onClick={() => moverMes(1)}>›</button>
        </div>
        <div className="aura-fecha-navegacion">
          <Selector value={mes.slice(5)} aria-label="Mes" onChange={(e) => setMes(mes.slice(0, 5) + e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{new Date(2000, i, 1).toLocaleDateString('es-PE', { month: 'long' })}</option>)}
          </Selector>
          <input type="number" aria-label="Año" value={anioEdit} min="1" max="9999" onChange={(e) => setAnioEdit(e.target.value)} onBlur={aplicarAnio}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); aplicarAnio(); } }} />
        </div>
        <div className="aura-fecha-semana" aria-hidden="true">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i}>{d}</span>)}</div>
        <div className="aura-fecha-dias" role="group" aria-label="Días del mes">
          {Array.from({ length: huecos }, (_, i) => <span key={`h-${i}`} />)}
          {Array.from({ length: dias }, (_, i) => {
            const fecha = `${mes}-${String(i + 1).padStart(2, '0')}`;
            return <button type="button" key={fecha} data-fecha={fecha} disabled={Boolean((min && fecha < min) || (max && fecha > max))}
              className={value === fecha ? 'aura-seleccionado' : ''} aria-pressed={value === fecha}
              aria-current={fecha === hoy ? 'date' : undefined}
              tabIndex={fecha === diaTabulable ? 0 : -1}
              aria-label={new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', { dateStyle: 'full' })}
              onFocus={() => setFoco(fecha)}
              onClick={() => { dialogo.current?.close(); onChange(fecha); }}
              onKeyDown={(e) => {
                const saltos: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
                if (!(e.key in saltos)) return;
                e.preventDefault();
                const siguiente = i + 1 + saltos[e.key];
                if (siguiente < 1 || siguiente > dias) return;
                dialogo.current?.querySelector<HTMLButtonElement>(`[data-fecha="${mes}-${String(siguiente).padStart(2, '0')}"]:not(:disabled)`)?.focus();
              }}>{i + 1}</button>;
          })}
        </div>
        <div className="aura-fecha-pie">
          {limpiar ? <button type="button" onClick={() => { dialogo.current?.close(); onChange(''); }}>Borrar fecha</button> : <small>Elige una fecha para continuar</small>}
          <button type="button" onClick={() => dialogo.current?.close()}>Cerrar</button>
        </div>
      </dialog>, document.body)}
    </span>
  );
}
