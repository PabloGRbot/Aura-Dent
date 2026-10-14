import { useEffect, useMemo, useState } from 'react';
import { obtenerMisCitas } from '../api/citas';
import { formatearFecha } from '../formato';
import { Cita } from '../tipos';

const ETIQUETA_ESTADO: Record<Cita['estado'], string> = {
  TEMPORAL: 'Temporal',
  PENDIENTE_PAGO: 'Pendiente de pago',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  ATENDIDA: 'Atendida'
};

export function HistorialPaciente() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerMisCitas()
      .then(setCitas)
      .catch((e) => setError((e as Error).message))
      .finally(() => setCargando(false));
  }, []);

  const historial = useMemo(() => {
    const ahora = Date.now();
    return citas
      .filter(
        (cita) =>
          cita.estado === 'ATENDIDA' ||
          (cita.estado !== 'TEMPORAL' && new Date(cita.fecha).getTime() < ahora)
      )
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [citas]);

  const ultimaVisita = historial[0];
  const serviciosDistintos = new Set(historial.map((cita) => cita.servicio ?? 'Consulta general'))
    .size;

  return (
    <section className="panel">
      <div className="encabezado-seccion">
        <div>
          <h1>Mi historial</h1>
          <p className="subtitulo">Revisa las atenciones y tratamientos que ya recibiste.</p>
        </div>
      </div>

      {cargando ? (
        <p className="subtitulo">Cargando tu historial...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : historial.length === 0 ? (
        <p className="subtitulo">Aún no registras atenciones finalizadas.</p>
      ) : (
        <>
          <div className="tarjetas">
            <article className="tarjeta-accion tarjeta-dato">
              <h3>{historial.length}</h3>
              <p>Atenciones registradas</p>
            </article>
            <article className="tarjeta-accion tarjeta-dato">
              <h3>{serviciosDistintos}</h3>
              <p>Tratamientos distintos</p>
            </article>
            {ultimaVisita && (
              <article className="tarjeta-accion tarjeta-dato">
                <h3 className="dato-fecha">{formatearFecha(ultimaVisita.fecha)}</h3>
                <p>Última visita</p>
              </article>
            )}
          </div>

          <ol className="linea-tiempo">
            {historial.map((cita) => (
              <li key={cita.id} className="linea-tiempo-item">
                <span className="linea-tiempo-punto" aria-hidden="true" />
                <div className="linea-tiempo-contenido">
                  <div className="linea-tiempo-encabezado">
                    <span className="cita-servicio">
                      {cita.servicio ?? 'Consulta general'}
                    </span>
                    <span className={`estado ${cita.estado.toLowerCase()}`}>
                      {ETIQUETA_ESTADO[cita.estado]}
                    </span>
                  </div>
                  <span className="cita-fecha">{formatearFecha(cita.fecha)}</span>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
