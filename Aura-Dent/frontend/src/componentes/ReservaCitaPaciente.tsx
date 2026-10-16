import { useCallback, useEffect, useState } from 'react';
import { crearCita, obtenerMisCitas, pagarCita } from '../api/citas';
import { listarOdontologos, Odontologo } from '../api/odontologos';
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
  const [paso, setPaso] = useState(1);
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
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [odontologoId, setOdontologoId] = useState<string | null>(null);

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

  useEffect(() => {
    listarOdontologos()
      .then(setOdontologos)
      .catch(() => undefined);
  }, []);

  async function confirmarReserva() {
    setError(null);
    setMensaje(null);
    if (!odontologoId) {
      setError('Selecciona un odontólogo.');
      return;
    }
    if (!dia || !hora) {
      setError('Selecciona la fecha y la hora de tu cita.');
      return;
    }
    try {
      const cita = await crearCita(
        new Date(`${dia}T${hora}`).toISOString(),
        servicio,
        30,
        odontologoId
      );
      setDia('');
      setHora('');
      abrirPago(cita);
      await cargar();
      setPaso(1);
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
      const resumen = `¡Reserva Confirmada!\\n\\nServicio: ${citaEnPago.servicio}\\nFecha: ${formatear(citaEnPago.fecha)}\\nEstado: Confirmada`;
      setCitaEnPago(null);
      setMensaje(resumen);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcesandoPago(false);
    }
  }

  const generarSlots = () => {
    const slots: { hora: string; ocupado: boolean }[] = [];
    const fecha = new Date(`${dia}T00:00:00`);
    const diaSemana = fecha.getDay(); // 0 = Domingo, 6 = Sábado

    // Domingos y feriados: cerrado
    if (diaSemana === 0) return slots;

    const rangos = [
      { inicio: '08:00', fin: '12:00' }
    ];
    // Lunes a viernes: tarde adicional 14:00 - 20:00
    if (diaSemana !== 6) {
      rangos.push({ inicio: '14:00', fin: '20:00' });
    }

    for (const { inicio, fin } of rangos) {
      let actual = new Date(`${dia}T${inicio}`);
      const finFecha = new Date(`${dia}T${fin}`);
      while (actual < finFecha) {
        const horaStr = actual.toTimeString().slice(0, 5);
        const ocupado = citas.some(c => {
          if (c.estado === 'CANCELADA') return false;
          const fechaCita = new Date(c.fecha);
          const diaCita = new Date(
            fechaCita.getTime() - fechaCita.getTimezoneOffset() * 60000
          )
            .toISOString()
            .slice(0, 10);
          const horaCita = new Date(
            fechaCita.getTime() - fechaCita.getTimezoneOffset() * 60000
          )
            .toISOString()
            .slice(11, 16);
          return diaCita === dia && horaCita === horaStr;
        });
        slots.push({ hora: horaStr, ocupado });
        actual.setMinutes(actual.getMinutes() + 30);
      }
    }
    return slots;
  };

  return (
    <div className="reserva">
      <style>{`
        .reserva-pasos {
          display: flex;
          justify-content: space-between;
          margin-bottom: 32px;
          position: relative;
        }
        .reserva-pasos::before {
          content: '';
          position: absolute;
          top: 15px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--gris-claro);
          z-index: 1;
        }
        .paso {
          position: relative;
          z-index: 2;
          background: #fff;
          border: 2px solid var(--gris-claro);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          color: var(--gris);
          transition: all 0.3s ease;
        }
        .paso.activo {
          border-color: var(--verde);
          background: var(--verde);
          color: #fff;
          box-shadow: 0 0 0 4px rgba(10, 57, 34, 0.1);
        }
        .reserva-contenedor-pasos {
          position: relative;
          min-height: 300px;
          margin-bottom: 32px;
        }
        .paso-animado {
          animation: slideIn 0.4s ease-out both;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .grid-servicios {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }
        .tarjeta-servicio {
          padding: 16px;
          border: 1px solid var(--borde);
          border-radius: var(--radio-suave);
          cursor: pointer;
          transition: all 0.2s ease;
          background: #fff;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .tarjeta-servicio:hover {
          border-color: var(--verde);
          background: var(--sage);
        }
        .tarjeta-servicio.seleccionado {
          border-color: var(--verde);
          background: var(--mint);
          box-shadow: 0 0 0 2px var(--verde);
        }
        .servicio-nombre {
          font-weight: 600;
          color: var(--verde);
        }
        .servicio-precio {
          font-size: 13px;
          color: var(--gris);
        }
        .calendario-contenedor {
          display: flex;
          justify-content: center;
          margin: 24px 0;
        }
        .input-fecha-moderno {
          padding: 12px;
          font-size: 16px;
          border: 2px solid var(--borde);
          border-radius: var(--radio-boton);
          cursor: pointer;
          transition: border-color 0.3s ease;
        }
        .input-fecha-moderno:focus {
          border-color: var(--verde);
        }
        .grid-horarios-adaptado {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
          margin-top: 16px;
        }
        .slot-hora-adaptado {
          padding: 10px;
          border-radius: 8px;
          border: 1px solid var(--borde);
          background: #fff;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          text-align: center;
          color: #000000;
        }
        .slot-hora-adaptado:hover:not(.ocupado) {
          border-color: var(--verde);
          background: var(--sage);
        }
        .slot-hora-adaptado.seleccionado {
          background: var(--verde);
          color: #fff;
          border-color: var(--verde);
        }
        .slot-hora-adaptado.ocupado {
          background: var(--gris-claro);
          color: var(--gris);
          cursor: not-allowed;
          opacity: 0.6;
          text-decoration: line-through;
        }
        .campo-odontologo {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .campo-odontologo label {
          font-weight: 600;
          color: var(--grafito);
          font-size: 14px;
        }
        .campo-odontologo select {
          padding: 10px 12px;
          border: 1px solid var(--borde);
          border-radius: var(--radio-boton);
          font-size: 14px;
          background: #fff;
          cursor: pointer;
        }
        .acciones-paso {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
          gap: 12px;
        }
        .paso-titulo {
          text-align: center;
          margin-bottom: 20px;
          color: var(--verde);
        }
      `}</style>

      <div className="reserva-pasos">
        <div className={`paso ${paso >= 1 ? 'activo' : ''}`}>1</div>
        <div className={`paso ${paso >= 2 ? 'activo' : ''}`}>2</div>
        <div className={`paso ${paso >= 3 ? 'activo' : ''}`}>3</div>
        <div className={`paso ${paso >= 4 ? 'activo' : ''}`}>4</div>
      </div>

      <div className="reserva-contenedor-pasos">
        {paso === 1 && (
          <div className="paso-animado fade-in">
            <h3 className="paso-titulo">Selecciona el servicio</h3>
            <div className="grid-servicios">
              {CATALOGO_SERVICIOS.map((item) => (
                <div 
                  key={item.nombre} 
                  className={`tarjeta-servicio ${servicio === item.nombre ? 'seleccionado' : ''}`}
                  onClick={() => { setServicio(item.nombre); setPaso(2); }}
                >
                  <span className="servicio-nombre">{item.nombre}</span>
                  <span className="servicio-precio">{formatearSoles(item.precio)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="paso-animado fade-in">
            <h3 className="paso-titulo">Selecciona el odontólogo</h3>
            <label className="campo-odontologo">
              Odontólogo
              <select
                value={odontologoId ?? ''}
                onChange={(e) => {
                  setOdontologoId(e.target.value || null);
                  if (e.target.value) setPaso(3);
                }}
                required
              >
                <option value="">Seleccionar odontólogo</option>
                {odontologos.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombres} {o.apellidos}
                  </option>
                ))}
              </select>
            </label>
            <div className="acciones-paso">
              <button type="button" className="boton-secundario" onClick={() => setPaso(1)}>Volver</button>
              {odontologoId && <button type="button" className="boton-confirmar" onClick={() => setPaso(3)}>Siguiente</button>}
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className="paso-animado fade-in">
            <h3 className="paso-titulo">Elige la fecha</h3>
            <div className="calendario-contenedor">
              <input
                type="date"
                className="input-fecha-moderno"
                style={{
                  border: '2px solid var(--verde)',
                  padding: '12px 20px',
                  borderRadius: 'var(--radio-boton)',
                  fontSize: '1.1rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 4px 12px rgba(10, 57, 34, 0.1)',
                  appearance: 'none',
                  WebkitAppearance: 'none'
                }}
                value={dia}
                min={hoyLocal()}
                onChange={(evento) => {
                  setDia(evento.target.value);
                  if (evento.target.value) setPaso(4);
                }}
                required
              />
            </div>
            <div className="acciones-paso">
              <button type="button" className="boton-secundario" onClick={() => setPaso(2)}>Volver</button>
              {dia && <button type="button" className="boton-confirmar" onClick={() => setPaso(4)}>Siguiente</button>}
            </div>
          </div>
        )}

        {paso === 4 && (
          <div className="paso-animado fade-in">
            <h3 className="paso-titulo">Elige la hora</h3>
            <div className="grid-horarios-adaptado">
              {generarSlots().map((slot) => (
                <button
                  key={slot.hora}
                  type="button"
                  className={`slot-hora-adaptado ${slot.ocupado ? 'ocupado' : ''} ${hora === slot.hora ? 'seleccionado' : ''}`}
                  disabled={slot.ocupado}
                  onClick={() => setHora(slot.hora)}
                >
                  {slot.hora}
                </button>
              ))}
            </div>
            <div className="acciones-paso">
              <button type="button" className="boton-secundario" onClick={() => setPaso(3)}>Volver</button>
              <button 
                type="button" 
                className="boton-confirmar" 
                disabled={!hora}
                onClick={confirmarReserva}
              >
                Confirmar Reserva
              </button>
            </div>
          </div>
        )}
      </div>

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
