import { useEffect, useState } from 'react';
import { listarMisComprobantes } from '../../api/recepcion';
import { formatearSoles } from '../../catalogo_servicios';
import { formatearFechaCorta } from '../../formato';
import { Comprobante } from '../../tipos';

export function ComprobantesPaciente() {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarMisComprobantes()
      .then(setComprobantes)
      .catch((e) => setError((e as Error).message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <section className="panel">
      <div className="encabezado-seccion">
        <div>
          <h1>Mis comprobantes</h1>
          <p className="subtitulo">Boletas y facturas electrónicas de tus atenciones.</p>
        </div>
      </div>

      {cargando ? (
        <p className="subtitulo">Cargando tus comprobantes...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : comprobantes.length === 0 ? (
        <p className="subtitulo">Aún no tienes comprobantes emitidos.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Serie - Correlativo</th>
                <th>Tipo</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Emitido</th>
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
                  <td>{formatearSoles(c.total)}</td>
                  <td>
                    <span className={`estado ${c.estado.toLowerCase()}`}>
                      {c.estado === 'EMITIDO' ? 'Emitido' : 'Anulado'}
                    </span>
                  </td>
                  <td>{formatearFechaCorta(c.emitidoEn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
