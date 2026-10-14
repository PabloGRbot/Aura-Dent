import { useCallback, useEffect, useState } from 'react';
import {
  confirmarPagoRecepcion,
  listarPagosRecepcion,
  rechazarPagoRecepcion
} from '../../api/recepcion';
import { formatearSoles } from '../../catalogo_servicios';
import { ETIQUETA_PAGO, formatearFechaCorta } from '../../formato';
import { PagoDetalle } from '../../tipos';

export function PagosRecepcion() {
  const [pagos, setPagos] = useState<PagoDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setPagos(await listarPagosRecepcion());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

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
        <button type="button" className="boton-secundario" onClick={cargar}>
          Actualizar
        </button>
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
    </section>
  );
}
