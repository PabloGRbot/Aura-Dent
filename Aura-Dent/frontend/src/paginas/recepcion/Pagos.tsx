import { useCallback, useEffect, useState } from 'react';
import {
  confirmarPagoRecepcion,
  listarPagosRecepcion,
  rechazarPagoRecepcion,
  listarCitasRecepcion,
  registrarPagoManual
} from '../../api/recepcion';
import { MetodoPago } from '../../tipos';
import { formatearSoles } from '../../catalogo_servicios';
import { ETIQUETA_PAGO, formatearFechaCorta } from '../../formato';
import { PagoDetalle, CitaAgenda } from '../../tipos';

const METODOS: { valor: MetodoPago; etiqueta: string }[] = [
  { valor: 'EFECTIVO', etiqueta: 'Efectivo' },
  { valor: 'TARJETA', etiqueta: 'Tarjeta' },
  { valor: 'YAPE', etiqueta: 'Yape' },
  { valor: 'PLIN', etiqueta: 'Plin' },
  { valor: 'QR', etiqueta: 'QR / CIP' }
];

export function PagosRecepcion() {
  const [pagos, setPagos] = useState<PagoDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  // Cobro en caja
  const [cobroAbierto, setCobroAbierto] = useState(false);
  const [citas, setCitas] = useState<CitaAgenda[]>([]);
  const [cobroForm, setCobroForm] = useState({
    citaId: '',
    monto: '',
    metodo: 'EFECTIVO' as MetodoPago
  });
  const [cobroCargando, setCobroCargando] = useState(false);
  const [cobroError, setCobroError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setPagos(await listarPagosRecepcion());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarCitas = useCallback(async () => {
    try {
      setCitas(await listarCitasRecepcion());
    } catch (e) {
      setCobroError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    cargar();
    cargarCitas();
  }, [cargar, cargarCitas]);

  async function accion(pago: PagoDetalle, confirmar: boolean) {
    setProcesandoId(pago.id);
    setError(null);
    setMensaje(null);
    try {
      if (confirmar) {
        await confirmarPagoRecepcion(pago.id);
        setMensaje(`Pago de ${pago.pacienteNombre} confirmado. La cita quedó confirmada.`);
      } else {
        await rechazarPagoRecepcion(pago.id);
        setMensaje(`Pago de ${pago.pacienteNombre} rechazado.`);
      }
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcesandoId(null);
    }
  }

  const abrirCobro = () => {
    setCobroForm({ citaId: '', monto: '', metodo: 'EFECTIVO' });
    setCobroError(null);
    setCobroAbierto(true);
  };

  const cerrarCobro = () => setCobroAbierto(false);

  const manejarCobro = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setCobroError(null);
    setCobroCargando(true);
    try {
      await registrarPagoManual({
        citaId: cobroForm.citaId,
        monto: Number(cobroForm.monto),
        metodo: cobroForm.metodo
      });
      setMensaje('Pago en caja registrado correctamente.');
      cerrarCobro();
      await cargar();
    } catch (e) {
      setCobroError((e as Error).message);
    } finally {
      setCobroCargando(false);
    }
  };

  const pendientes = pagos.filter((pago) => pago.estado === 'PENDIENTE').length;

  return (
    <section className="panel">
      <div className="encabezado-seccion">
        <div>
          <h1>Pagos</h1>
          <p className="subtitulo">
            Verifica los adelantos de reserva y confirma los pagos recibidos por QR/CIP.
          </p>
        </div>
        <div className="encabezado-acciones">
          <button type="button" className="boton-secundario" onClick={cargar}>
            Actualizar
          </button>
          <button type="button" className="boton-primario" onClick={abrirCobro}>
            Cobrar en caja
          </button>
        </div>
      </div>

      {mensaje && <p className="exito">{mensaje}</p>}
      {error && <p className="error">{error}</p>}

      {!cargando && (
        <div className="tarjetas">
          <article className="tarjeta-accion tarjeta-dato">
            <h3>{pagos.length}</h3>
            <p>Pagos registrados</p>
          </article>
          <article className="tarjeta-accion tarjeta-dato">
            <h3>{pendientes}</h3>
            <p>Pendientes de verificar</p>
          </article>
        </div>
      )}

      {cargando ? (
        <p className="subtitulo">Cargando pagos...</p>
      ) : pagos.length === 0 ? (
        <p className="subtitulo">Todavía no hay pagos registrados.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Cita</th>
                <th>Servicio</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((pago) => (
                <tr key={pago.id}>
                  <td>
                    {pago.pacienteNombre}
                    <span className="dato-secundario">{pago.pacienteDni}</span>
                  </td>
                  <td>
                    {formatearFechaCorta(pago.fechaCita)}
                    <span className="dato-secundario">Cita {pago.estadoCita}</span>
                  </td>
                  <td>{pago.servicio ?? 'Consulta general'}</td>
                  <td>{formatearSoles(pago.monto)}</td>
                  <td>{pago.metodo}</td>
                  <td>
                    <span className={`badge-pago ${pago.estado.toLowerCase()}`}>
                      {ETIQUETA_PAGO[pago.estado]}
                    </span>
                    {pago.referenciaQr && (
                      <span className="dato-secundario">{pago.referenciaQr}</span>
                    )}
                  </td>
                  <td>
                    {pago.estado === 'PENDIENTE' ? (
                      <div className="tabla-acciones">
                        <button
                          type="button"
                          onClick={() => accion(pago, true)}
                          disabled={procesandoId === pago.id}
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          className="boton-peligro"
                          onClick={() => accion(pago, false)}
                          disabled={procesandoId === pago.id}
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <span className="dato-secundario">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal cobro en caja */}
      {cobroAbierto && (
        <div className="modal-fondo" onClick={cerrarCobro}>
          <form
            className="modal modal-form"
            onClick={(evento) => evento.stopPropagation()}
            onSubmit={manejarCobro}
          >
            <h3>Cobro en caja</h3>
            {cobroError && <p className="error">{cobroError}</p>}
            <div className="form-grid">
              <label>
                Cita
                <select
                  value={cobroForm.citaId}
                  onChange={(e) => setCobroForm((prev) => ({ ...prev, citaId: e.target.value}))}
                  required
                >
                  <option value="">Seleccionar cita</option>
                  {citas.map((cita) => (
                    <option key={cita.id} value={cita.id}>
                      {cita.pacienteNombre} - {formatearFechaCorta(cita.fecha)} - {cita.servicio ?? 'Consulta'}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Monto (S/)
                <input
                  type="number"
                  value={cobroForm.monto}
                  onChange={(e) => setCobroForm((prev) => ({ ...prev, monto: e.target.value}))}
                  min="0"
                  step="0.01"
                  required
                />
              </label>
              <label>
                Método de pago
                <select
                  value={cobroForm.metodo}
                  onChange={(e) => setCobroForm((prev) => ({ ...prev, metodo: e.target.value as MetodoPago }))}
                >
                  {METODOS.map((m) => (
                    <option key={m.valor} value={m.valor}>
                      {m.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-acciones">
              <button type="button" className="boton-secundario" onClick={cerrarCobro}>
                Cancelar
              </button>
              <button type="submit" disabled={cobroCargando || !cobroForm.citaId || !cobroForm.monto}>
                {cobroCargando ? 'Registrando...' : 'Cobrar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
