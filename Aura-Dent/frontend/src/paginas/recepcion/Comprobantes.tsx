import { FormEvent, useCallback, useEffect, useState } from 'react';
import { anularComprobante, emitirComprobante, listarComprobantesRecepcion } from '../../api/recepcion';
import { listarPagosRecepcion } from '../../api/recepcion';
import { Comprobante, PagoDetalle } from '../../tipos';

const TIPOS: { valor: 'BOLETA' | 'FACTURA'; etiqueta: string }[] = [
  { valor: 'BOLETA', etiqueta: 'Boleta' },
  { valor: 'FACTURA', etiqueta: 'Factura' }
];

export function ComprobantesRecepcion() {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [pagos, setPagos] = useState<PagoDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [emitirAbierta, setEmitirAbierta] = useState(false);
  const [emitirForm, setEmitirForm] = useState({
    pagoId: '',
    citaId: '',
    tipo: 'BOLETA' as 'BOLETA' | 'FACTURA',
    serie: 'B001',
    rucCliente: '',
    razonSocial: ''
  });
  const [emitirCargando, setEmitirCargando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [cs, ps] = await Promise.all([listarComprobantesRecepcion(), listarPagosRecepcion()]);
      setComprobantes(cs);
      setPagos(ps);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const pagosAprobados = pagos.filter((p) => p.estado === 'APROBADO');

  const abrirEmitir = () => {
    setEmitirForm({
      pagoId: '',
      citaId: '',
      tipo: 'BOLETA',
      serie: 'B001',
      rucCliente: '',
      razonSocial: ''
    });
    setError(null);
    setEmitirAbierta(true);
  };

  const cerrarEmitir = () => setEmitirAbierta(false);

  const manejarEmitir = async (evento: FormEvent) => {
    evento.preventDefault();
    setError(null);
    setEmitirCargando(true);
    try {
      await emitirComprobante({
        pagoId: emitirForm.pagoId,
        citaId: emitirForm.citaId,
        tipo: emitirForm.tipo,
        serie: emitirForm.serie || 'B001',
        rucCliente: emitirForm.rucCliente || null,
        razonSocial: emitirForm.razonSocial || null
      });
      setMensaje('Comprobante emitido correctamente.');
      cerrarEmitir();
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEmitirCargando(false);
    }
  };

  const manejarAnular = async (id: string) => {
    if (!window.confirm('¿Anular este comprobante?')) return;
    try {
      await anularComprobante(id);
      setMensaje('Comprobante anulado.');
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <section className="panel">
      <div className="encabezado-seccion">
        <div>
          <h1>Comprobantes</h1>
          <p className="subtitulo">Boletas y facturas electrónicas emitidas.</p>
        </div>
        <button type="button" className="boton-secundario" onClick={cargar}>
          Actualizar
        </button>
        <button type="button" className="boton-primario" onClick={abrirEmitir}>
          Emitir boleta / factura
        </button>
      </div>

      {mensaje && <p className="exito">{mensaje}</p>}
      {error && !emitirAbierta && <p className="error">{error}</p>}

      <label className="campo-busqueda">
        Pagos aprobados disponibles:
        <select
          className="select-pago"
          onChange={(e) => {
            const pago = pagosAprobados.find((p) => p.id === e.target.value);
            setEmitirForm((prev) => ({
              ...prev,
              pagoId: pago?.id ?? '',
              citaId: pago?.citaId ?? ''
            }));
          }}
        >
          <option value="">Seleccionar pago</option>
          {pagosAprobados.map((p) => (
            <option key={p.id} value={p.id}>
              {p.pacienteNombre} - S/ {p.monto.toFixed(2)} - {p.servicio ?? 'Consulta'}
            </option>
          ))}
        </select>
      </label>

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
                    <strong>{c.serie}-{String(c.correlativo).padStart(6, '0')}</strong>
                  </td>
                  <td>{c.tipo}</td>
                  <td>{c.pagoId}</td>
                  <td>S/ {c.total.toFixed(2)}</td>
                  <td>
                    <span className={`estado ${c.estado.toLowerCase()}`}>
                      {c.estado === 'EMITIDO' ? 'Emitido' : 'Anulado'}
                    </span>
                  </td>
                  <td>{new Date(c.emitidoEn).toLocaleString('es-PE')}</td>
                  <td>
                    <div className="tabla-acciones">
                      {c.estado === 'EMITIDO' && (
                        <button
                          type="button"
                          className="boton-peligro"
                          onClick={() => manejarAnular(c.id)}
                        >
                          Anular
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal emitir */}
      {emitirAbierta && (
        <div className="modal-fondo" onClick={cerrarEmitir}>
          <form
            className="modal modal-form"
            onClick={(evento) => evento.stopPropagation()}
            onSubmit={manejarEmitir}
          >
            <h3>Emitir comprobante</h3>
            {error && <p className="error">{error}</p>}
            <div className="form-grid">
              <label>
                Pago
                <select
                  value={emitirForm.pagoId}
                  onChange={(e) => {
                    const pago = pagosAprobados.find((p) => p.id === e.target.value);
                    setEmitirForm((prev) => ({
                      ...prev,
                      pagoId: pago?.id ?? '',
                      citaId: pago?.citaId ?? ''
                    }));
                  }}
                  required
                >
                  <option value="">Seleccionar pago aprobado</option>
                  {pagosAprobados.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.pacienteNombre} - S/ {p.monto.toFixed(2)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tipo
                <select
                  value={emitirForm.tipo}
                  onChange={(e) => setEmitirForm((prev) => ({ ...prev, tipo: e.target.value as 'BOLETA' | 'FACTURA' }))}
                >
                  {TIPOS.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.etiqueta}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Serie
                <input
                  value={emitirForm.serie}
                  onChange={(e) => setEmitirForm((prev) => ({ ...prev, serie: e.target.value}))}
                />
              </label>
              <label className="ancho-completo">
                RUC del cliente
                <input
                  value={emitirForm.rucCliente}
                  onChange={(e) => setEmitirForm((prev) => ({ ...prev, rucCliente: e.target.value}))}
                  placeholder="Opcional"
                />
              </label>
              <label className="ancho-completo">
                Razón social
                <input
                  value={emitirForm.razonSocial}
                  onChange={(e) => setEmitirForm((prev) => ({ ...prev, razonSocial: e.target.value}))}
                  placeholder="Opcional"
                />
              </label>
            </div>
            <div className="modal-acciones">
              <button type="button" className="boton-secundario" onClick={cerrarEmitir}>
                Cancelar
              </button>
              <button type="submit" disabled={emitirCargando || !emitirForm.pagoId}>
                {emitirCargando ? 'Emistiendo...' : 'Emitir'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
