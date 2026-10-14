import { useEffect, useState } from 'react';
import { obtenerMisNotas } from '../../api/agenda';
import { formatearFecha } from '../../formato';
import { NotaClinicaDetalle } from '../../tipos';

export function NotasClinicas() {
  const [notas, setNotas] = useState<NotaClinicaDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerMisNotas()
      .then(setNotas)
      .catch((e) => setError((e as Error).message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <section className="panel">
      <h1>Notas clínicas</h1>
      <p className="subtitulo">Historial de las atenciones y procedimientos que has registrado.</p>

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p className="subtitulo">Cargando notas...</p>
      ) : notas.length === 0 ? (
        <p className="subtitulo">Todavía no has registrado notas clínicas.</p>
      ) : (
        <div className="lista-notas lista-notas-ancha">
          {notas.map((nota) => (
            <article key={nota.id} className="nota-item">
              <div className="nota-encabezado">
                <strong>{nota.pacienteNombre}</strong>
                <span className="nota-fecha">{formatearFecha(nota.creadoEn)}</span>
              </div>
              <span className="dato-secundario">{nota.servicio ?? 'Consulta general'}</span>
              <p>{nota.contenido}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
