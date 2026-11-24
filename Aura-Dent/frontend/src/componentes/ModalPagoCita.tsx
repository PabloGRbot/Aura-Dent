import { useEffect, useId, useState } from 'react';
import { pagarCita } from '../api/citas';
import { formatearSoles } from '../catalogo_servicios';
import { Cita } from '../tipos';
import { QrSimulado } from './QrSimulado';
import { PoliticaCitas, LimitesCita } from './PoliticaCitas';

interface Props {
  cita: Cita;
  onCerrar: () => void;
  onPagado: (mensaje: string) => void;
}

function formatear(fechaIso: string): string {
  return new Date(fechaIso).toLocaleString('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function ModalPagoCita({ cita, onCerrar, onPagado }: Props) {
  const tituloId = useId();
  const [referencia, setReferencia] = useState(cita.pago?.referenciaQr ?? '');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segundosRestantes, setSegundosRestantes] = useState(() => calcularSegundos(cita.expiraEn));

  useEffect(() => {
    const actualizar = () => setSegundosRestantes(calcularSegundos(cita.expiraEn));
    actualizar();
    const intervalo = window.setInterval(actualizar, 1000);
    return () => window.clearInterval(intervalo);
  }, [cita.expiraEn]);

  const vencida = cita.expiraEn !== null && segundosRestantes <= 0;

  async function confirmar(): Promise<void> {
    if (!referencia.trim() || vencida) {
      return;
    }
    setProcesando(true);
    setError(null);
    try {
      await pagarCita(cita.id, referencia.trim());
      const resumen = `¡Reserva Confirmada!\n\nServicio: ${cita.servicio ?? 'Consulta general'}\nFecha: ${formatear(cita.fecha)}\nEstado: Confirmada`;
      onPagado(resumen);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="modal-fondo modal-pago-fondo" onClick={onCerrar}>
      <div className="modal modal-pago" role="dialog" aria-modal="true" aria-labelledby={tituloId} onClick={(evento) => evento.stopPropagation()}>
        <div className="modal-pago-cuerpo">
        <h3 id={tituloId}>Pago de la reserva</h3>
        <p className="subtitulo">Pago simulado: usa una referencia de prueba. No envíes dinero real.</p>
        <details className="pago-condiciones">
          <summary>Ver plazos de cambios y devolución</summary>
          <LimitesCita acciones={cita.acciones}/>
          <PoliticaCitas />
        </details>

        <QrSimulado contenido={`AURADENT|PAGO|${cita.pago?.referenciaQr ?? cita.id}`} />

        <div className="pago-detalle">
          <span>Monto</span>
          <strong>{formatearSoles(cita.pago?.monto ?? 0)}</strong>
        </div>
        <div className={`pago-detalle ${vencida ? 'error' : ''}`}>
          <span>Tiempo para confirmar</span>
          <strong>
            {cita.expiraEn === null
              ? 'Reserva anterior sin vencimiento'
              : vencida
                ? 'Reserva vencida'
                : formatearCuentaRegresiva(segundosRestantes)}
          </strong>
        </div>
        <div className="pago-detalle">
          <span>Servicio</span>
          <strong>{cita.servicio ?? 'Consulta general'}</strong>
        </div>

        <label className="campo-nota">
          Referencia de prueba del pago simulado
          <input
            value={referencia}
            onChange={(evento) => setReferencia(evento.target.value)}
            placeholder="CIP000000000000"
          />
        </label>

        {error && <p className="error">{error}</p>}
        </div>

        <div className="modal-acciones">
          <button type="button" className="boton-secundario" onClick={onCerrar}>
            Cerrar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={procesando || vencida || !referencia.trim()}
          >
            {procesando ? 'Procesando...' : 'Simular pago'}
          </button>
        </div>
      </div>
    </div>
  );
}

function calcularSegundos(expiraEn: string | null): number {
  if (!expiraEn) return 0;
  return Math.max(0, Math.ceil((new Date(expiraEn).getTime() - Date.now()) / 1000));
}

function formatearCuentaRegresiva(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const restantes = segundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(restantes).padStart(2, '0')}`;
}
