import { useCallback, useEffect, useState } from 'react';
import { anularComprobante, listarComprobantesAdmin } from '../../api/recepcion';
import { formatearSoles } from '../../catalogo_servicios';
import { formatearFechaCorta } from '../../formato';
import { Comprobante } from '../../tipos';

export function ComprobantesAdmin() {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [anulandoId, setAnulandoId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setComprobantes(await listarComprobantesAdmin());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function manejarAnular(comprobante: Comprobante) {
    if (
      !window.confirm(
        `¿Anular el comprobante ${comprobante.serie}-${String(comprobante.correlativo).padStart(6, '0')}?`
      )
    ) {
      return;
    }
    setAnulandoId(comprobante.id);
    setError(null);
    setMensaje(null);
    try {
      await anularComprobante(comprobante.id);
      setMensaje('Comprobante anulado correctamente.');
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAnulandoId(null);
    }
  }

  return (
    <section className="panel">
      <div className="encabezado-seccion">
        <div>
          <h1>Comprobantes</h1>
          <p className="subtitulo">Consulta todos los comprobantes electrónicos emitidos.</p>
        </div>
        <button type="button" className="boton-secundario" onClick={cargar}>
          Actualizar
        </button>
      </div>

      {mensaje && <p className="exito">{mensaje}</p>}
      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p className="subtitulo">Cargando comprobantes...</p>
      ) : comprobantes.length === 0 ? (
        <p className="subtitulo">Aún no hay comprobantes emitidos.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Serie - Correlativo</th>
                <th>Tipo</th>
                <th>Pago</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Emitido</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comprobantes.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>
                      {c.serie}-{String(c.correlativo).padStart(6, '0')}
                    </strong>
                  </td>
                  <td>{c.tipo === 'FACTURA' ? 'Factura' : 'Boleta'}</td>
                  <td>{c.pagoId}</td>
                  <td>{formatearSoles(c.total)}</td>
                  <td>
                    <span className={`estado ${c.estado.toLowerCase()}`}>
                      {c.estado === 'EMITIDO' ? 'Emitido' : 'Anulado'}
                    </span>
                  </td>
                  <td>{formatearFechaCorta(c.emitidoEn)}</td>
                  <td>
                    <div className="tabla-acciones">
                      {c.estado === 'EMITIDO' ? (
                        <button
                          type="button"
                          className="boton-peligro"
                          onClick={() => manejarAnular(c)}
                          disabled={anulandoId === c.id}
                        >
                          {anulandoId === c.id ? 'Anulando...' : 'Anular'}
                        </button>
                      ) : (
                        <span className="dato-secundario">—</span>
                      )}
                    </div>
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
