import { FormEvent, useCallback, useEffect, useState } from 'react';
import { crearCita, obtenerMisCitas, pagarCita } from '../api/citas';
import { ADELANTO_RESERVA, CATALOGO_SERVICIOS, formatearSoles } from '../catalogo_servicios';
import { Cita } from '../tipos';
import { QrSimulado } from './QrSimulado';

function hoyLocal(): string {
  const ahora = new Date();
  const desplazado = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return desplazado.toISOString().slice(0, 10);
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

const ETIQUETA_ESTADO: Record<Cita['estado'], string> = {
  TEMPORAL: 'Temporal',
  PENDIENTE_PAGO: 'Pendiente de pago',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  ATENDIDA: 'Atendida'
};

export function ReservaCitaPaciente() {
  const [dia, setDia] = useState('');
  const [hora, setHora] = useState('');
  const [servicio, setServicio] = useState(CATALOGO_SERVICIOS[0].nombre);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [citaEnPago, setCitaEnPago] = useState<Cita | null>(null);
  const [referencia, setReferencia] = useState('');
  const [procesandoPago, setProcesandoPago] = useState(false);

  function abrirPago(cita: Cita) {
    setCitaEnPago(cita);
    setReferencia(cita.pago?.referenciaQr ?? '');
    setError(null);
    setMensaje(null);
  }

  const cargar = useCallback(async () => {
    try {
      setCitas(await obtenerMisCitas());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    if (!dia || !hora) {
      setError('Selecciona la fecha y la hora de tu cita.');
      return;
    }
    try {
      const cita = await crearCita(new Date(`${dia}T${hora}`).toISOString(), servicio);
      setDia('');
      setHora('');
      abrirPago(cita);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function confirmarPago() {
    if (!citaEnPago?.pago) {
      return;
    }
    setProcesandoPago(true);
    setError(null);
    try {
      await pagarCita(citaEnPago.id, referencia.trim());
      setCitaEnPago(null);
      setMensaje('Pago simulado registrado. ¡Tu cita quedó confirmada!');
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcesandoPago(false);
    }
  }

  return (
    <div className="reserva">
      <form className="reserva-form" onSubmit={manejarEnvio}>
        <label>
          Servicio
          <select value={servicio} onChange={(evento) => setServicio(evento.target.value)}>
            {CATALOGO_SERVICIOS.map((item) => (
              <option key={item.nombre} value={item.nombre}>
                {item.nombre} · {formatearSoles(item.precio)}
              </option>
            ))}
          </select>
        </label>
        <label className="campo-fecha">
          Fecha
          <input
            type="date"
            value={dia}
            min={hoyLocal()}
            onChange={(evento) => setDia(evento.target.value)}
            required
          />
        </label>
        <label className="campo-hora">
          Hora
          <input
            type="time"
            value={hora}
            onChange={(evento) => setHora(evento.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={!dia || !hora}>
          Registrar cita
        </button>
      </form>

      <p className="nota-pago">
        Para garantizar la cita se abona un adelanto de {formatearSoles(ADELANTO_RESERVA)} mediante
        QR/CIP (pago simulado).
      </p>

      {mensaje && <p className="exito">{mensaje}</p>}
      {error && <p className="error">{error}</p>}

      <h3 className="reserva-titulo">Mis citas</h3>
      {cargando ? (
        <p className="subtitulo">Cargando...</p>
      ) : citas.length === 0 ? (
        <p className="subtitulo">Todavía no tienes citas registradas.</p>
      ) : (
        <ul className="lista-citas">
          {citas.map((cita) => (
            <li key={cita.id} className="cita">
              <div className="cita-datos">
                <span className="cita-fecha">{formatear(cita.fecha)}</span>
                <span className="cita-servicio">{cita.servicio ?? 'Consulta general'}</span>
              </div>
              <div className="cita-estado">
                <span className={`estado ${cita.estado.toLowerCase()}`}>
                  {ETIQUETA_ESTADO[cita.estado]}
                </span>
                {cita.estado === 'PENDIENTE_PAGO' && (
                  <button
                    type="button"
                    className="boton-pagar"
                    onClick={() => abrirPago(cita)}
                  >
                    Pagar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {citaEnPago?.pago && (
        <div className="modal-fondo" onClick={() => setCitaEnPago(null)}>
          <div className="modal" onClick={(evento) => evento.stopPropagation()}>
            <h3>Pago de la reserva</h3>
            <p className="subtitulo">
              Escanea el QR o usa el código CIP para garantizar tu cita.
            </p>

            <QrSimulado
              contenido={`AURADENT|PAGO|${citaEnPago.pago.referenciaQr ?? citaEnPago.id}`}
            />

            <div className="pago-detalle">
              <span>Monto</span>
              <strong>{formatearSoles(citaEnPago.pago.monto)}</strong>
            </div>
            <div className="pago-detalle">
              <span>Servicio</span>
              <strong>{citaEnPago.servicio ?? 'Consulta general'}</strong>
            </div>

            <label className="campo-nota">
              Código CIP de tu pago (de la app bancaria)
              <input
                value={referencia}
                onChange={(evento) => setReferencia(evento.target.value)}
                placeholder="CIP000000000000"
              />
            </label>

            <div className="modal-acciones">
              <button type="button" className="boton-secundario" onClick={() => setCitaEnPago(null)}>
                Cerrar
              </button>
              <button
                type="button"
                onClick={confirmarPago}
                disabled={procesandoPago || !referencia.trim()}
              >
                {procesandoPago ? 'Procesando...' : 'Pagar con QR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
