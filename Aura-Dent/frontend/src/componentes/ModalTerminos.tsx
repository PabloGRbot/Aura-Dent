import { ACTUALIZACION_TERMINOS, TERMINOS_Y_CONDICIONES } from '../terminos';

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onAceptar?: () => void;
}

export function ModalTerminos({ abierto, onCerrar, onAceptar }: Props) {
  if (!abierto) {
    return null;
  }

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal modal-form" onClick={(evento) => evento.stopPropagation()}>
        <h3>Términos y Condiciones de uso</h3>
        <p className="terminos-actualizacion">Última actualización: {ACTUALIZACION_TERMINOS}</p>

        <div className="terminos-cuerpo">
          {TERMINOS_Y_CONDICIONES.map((clausula) => (
            <section key={clausula.titulo}>
              <h4>{clausula.titulo}</h4>
              <p>{clausula.texto}</p>
            </section>
          ))}
        </div>

        <div className="modal-acciones">
          <button type="button" className="boton-secundario" onClick={onCerrar}>
            Cerrar
          </button>
          {onAceptar && (
            <button type="button" onClick={onAceptar}>
              Aceptar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
