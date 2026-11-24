import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './retoques.css';

export function CampoHora({ value, onChange, required }: { value: string; onChange: (hora: string) => void; required?: boolean }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const [hora, setHora] = useState('08');
  const [minuto, setMinuto] = useState('00');
  const [posicion, setPosicion] = useState({ left: 12, top: 12 });
  const [invalido, setInvalido] = useState(false);
  return <span className="aura-campo-fecha">
    <button type="button" ref={boton} className="aura-fecha-boton" aria-label={'Hora: ' + (value || 'Seleccionar')} aria-haspopup="dialog" onClick={() => {
      const partes = (value || '08:00').split(':'); setHora(partes[0]); setMinuto(partes[1]);
      const r = boton.current!.getBoundingClientRect();
      setPosicion({ left: Math.max(12, Math.min(r.left, window.innerWidth - 292)), top: Math.max(12, Math.min(r.bottom + 8, window.innerHeight - 310)) });
      dialogo.current?.showModal();
    }}>{value || 'Seleccionar hora'} <span aria-hidden="true">⌄</span></button>
    <input className="aura-select-nativo" type="time" value={value} required={required} tabIndex={-1} aria-hidden="true" readOnly={!required}
      onChange={(e) => onChange(e.target.value)} onInvalid={(e) => { e.preventDefault(); setInvalido(true); boton.current?.focus(); }} />
    {invalido && !value && <small role="alert" className="mensaje-campo">Selecciona una hora.</small>}
    {createPortal(<dialog className="aura-fecha-dialogo aura-hora-dialogo" ref={dialogo} style={posicion} aria-modal="true" aria-label="Seleccionar hora">
      <strong>Hora de la cita</strong>
      <div className="aura-hora-columnas">
        <div><small>Hora</small><div role="group" aria-label="Hora">{Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => <button type="button" key={h} aria-pressed={h === hora} onClick={() => setHora(h)}>{h}</button>)}</div></div>
        <div><small>Minuto</small><div role="group" aria-label="Minuto">{Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => <button type="button" key={m} aria-pressed={m === minuto} onClick={() => setMinuto(m)}>{m}</button>)}</div></div>
      </div>
      <div className="modal-acciones"><button type="button" className="boton-secundario" onClick={() => dialogo.current?.close()}>Cancelar</button>
        <button type="button" onClick={() => { onChange(hora + ':' + minuto); setInvalido(false); dialogo.current?.close(); }}>Elegir {hora}:{minuto}</button></div>
    </dialog>, document.body)}
  </span>;
}
