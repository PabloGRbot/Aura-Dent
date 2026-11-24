import { InputHTMLAttributes, useRef, useState } from 'react';
import { CampoFecha } from './CampoFecha';

/** Conserva el valor y la validación del formulario al usar el calendario compacto. */
export function FechaFormulario({ onChange, onInvalid, id, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const input = useRef<HTMLInputElement>(null);
  const [invalido, setInvalido] = useState(false);
  return <span className="aura-fecha-formulario">
    <CampoFecha id={id} value={String(props.value ?? '')} min={props.min ? String(props.min) : undefined}
      max={props.max ? String(props.max) : undefined} limpiar={!props.required} disabled={props.disabled} etiqueta="Fecha de nacimiento"
      aria-invalid={invalido || props['aria-invalid'] === true || props['aria-invalid'] === 'true'} aria-describedby={props['aria-describedby']}
      onChange={(fecha) => {
        const elemento = input.current;
        if (!elemento) return;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(elemento, fecha);
        elemento.dispatchEvent(new Event('input', { bubbles: true }));
        elemento.dispatchEvent(new Event('change', { bubbles: true }));
        setInvalido(false);
      }} />
    <input {...props} type="date" ref={input} id={id ? id + '-nativo' : undefined} tabIndex={-1} aria-hidden="true" className="aura-select-nativo"
      onChange={onChange} onInvalid={(e) => { e.preventDefault(); setInvalido(true); input.current?.parentElement?.querySelector('button')?.focus(); onInvalid?.(e); }} />
    {invalido && <small className="mensaje-campo" role="alert">Revisa la fecha seleccionada.</small>}
  </span>;
}
