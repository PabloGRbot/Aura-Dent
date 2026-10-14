import { useCallback, useEffect, useMemo, useState } from 'react';
import { listarCitasRecepcion } from '../../api/recepcion';
import { ETIQUETA_ESTADO, formatearFecha } from '../../formato';
import { CitaAgenda } from '../../tipos';

export function AgendaRecepcion() {
  const [citas, setCitas] = useState<CitaAgenda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    try {
      setCitas(await listarCitasRecepcion());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) {
      return citas;
    }
    return citas.filter(
      (cita) =>
        cita.pacienteNombre.toLowerCase().includes(termino) ||
        cita.pacienteDni.toLowerCase().includes(termino)
    );
  }, [citas, busqueda]);

  return (
    <section className="panel">
      <div className="encabezado-seccion">
        <div>
          <h1>Agenda general</h1>
          <p className="subtitulo">
            Revisa todas las reservas de la clínica y su estado de confirmación.
          </p>
        </div>
        <button type="button" className="boton-secundario" onClick={cargar}>
          Actualizar
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p className="subtitulo">Cargando agenda...</p>
      ) : (
        <>
          <label className="campo-busqueda">
            Buscar por paciente o DNI/CE
            <input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Ej. Pablo o 00000004"
            />
          </label>

          {filtradas.length === 0 ? (
            <p className="subtitulo">No hay citas que coincidan con la búsqueda.</p>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Fecha</th>
                    <th>Servicio</th>
                    <th>Odontólogo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((cita) => (
                    <tr key={cita.id}>
                      <td>
                        {cita.pacienteNombre}
                        <span className="dato-secundario">{cita.pacienteDni}</span>
                      </td>
                      <td className="capitalizar">{formatearFecha(cita.fecha)}</td>
                      <td>{cita.servicio ?? 'Consulta general'}</td>
                      <td>{cita.odontologoId ? 'Asignado' : 'Sin asignar'}</td>
                      <td>
                        <span className={`estado ${cita.estado.toLowerCase()}`}>
                          {ETIQUETA_ESTADO[cita.estado]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
