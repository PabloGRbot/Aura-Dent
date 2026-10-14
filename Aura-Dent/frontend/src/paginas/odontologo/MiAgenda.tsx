import { useCallback, useEffect, useState } from 'react';
import { asignarCita, crearNota, obtenerAgenda, obtenerNotasCita } from '../../api/agenda';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { ETIQUETA_ESTADO, formatearFecha } from '../../formato';
import { CitaAgenda, NotaClinica } from '../../tipos';

export function MiAgenda() {
  const { usuario } = useAutenticacion();
  const [agenda, setAgenda] = useState<CitaAgenda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [citaActiva, setCitaActiva] = useState<CitaAgenda | null>(null);
  const [notas, setNotas] = useState<NotaClinica[]>([]);
  const [contenido, setContenido] = useState('');
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setAgenda(await obtenerAgenda());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (!usuario) {
    return null;
  }

  const mias = agenda.filter((cita) => cita.odontologoId === usuario.id);
  const disponibles = agenda.filter((cita) => !cita.odontologoId);

  async function tomar(cita: CitaAgenda) {
    setError(null);
    setMensaje(null);
    try {
      await asignarCita(cita.id);
      setMensaje(`Tomaste la cita de ${cita.pacienteNombre}.`);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function abrirNota(cita: CitaAgenda) {
    setCitaActiva(cita);
    setContenido('');
    setNotas([]);
    setError(null);
    setMensaje(null);
    try {
      setNotas(await obtenerNotasCita(cita.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function guardarNota() {
    if (!citaActiva) {
      return;
    }
    setProcesando(true);
    setError(null);
    try {
      await crearNota(citaActiva.id, contenido);
      setContenido('');
      setNotas(await obtenerNotasCita(citaActiva.id));
      setMensaje('Nota registrada. La cita quedó marcada como atendida.');
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <section className="panel">
      <h1>Mi agenda</h1>
      <p className="subtitulo">
        Toma las citas confirmadas y registra la nota clínica al finalizar la atención.
      </p>

      {mensaje && <p className="exito">{mensaje}</p>}
      {error && !citaActiva && <p className="error">{error}</p>}

      {cargando ? (
        <p className="subtitulo">Cargando agenda...</p>
      ) : (
        <>
          <h3 className="reserva-titulo">Citas disponibles para tomar</h3>
          {disponibles.length === 0 ? (
            <p className="subtitulo">No hay citas confirmadas sin asignar.</p>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Fecha</th>
                    <th>Servicio</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {disponibles.map((cita) => (
                    <tr key={cita.id}>
                      <td>{cita.pacienteNombre}</td>
                      <td className="capitalizar">{formatearFecha(cita.fecha)}</td>
                      <td>{cita.servicio ?? 'Consulta general'}</td>
                      <td>
                        <button type="button" onClick={() => tomar(cita)}>
                          Tomar cita
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 className="reserva-titulo">Mis citas asignadas</h3>
          {mias.length === 0 ? (
            <p className="subtitulo">Aún no tienes citas asignadas.</p>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Fecha</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {mias.map((cita) => (
                    <tr key={cita.id}>
                      <td>
                        {cita.pacienteNombre}
                        <span className="dato-secundario">{cita.pacienteDni}</span>
                      </td>
                      <td className="capitalizar">{formatearFecha(cita.fecha)}</td>
                      <td>{cita.servicio ?? 'Consulta general'}</td>
                      <td>
                        <span className={`estado ${cita.estado.toLowerCase()}`}>
                          {ETIQUETA_ESTADO[cita.estado]}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="boton-secundario" onClick={() => abrirNota(cita)}>
                          {cita.estado === 'ATENDIDA' ? 'Ver notas' : 'Nota clínica'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {citaActiva && (
        <div className="modal-fondo" onClick={() => setCitaActiva(null)}>
          <div className="modal modal-form" onClick={(evento) => evento.stopPropagation()}>
            <h3>Nota clínica</h3>
            <p className="subtitulo">
              {citaActiva.pacienteNombre} · {formatearFecha(citaActiva.fecha)}
            </p>
            <p className="dato-secundario">
              Servicio: {citaActiva.servicio ?? 'Consulta general'}
            </p>

            {error && <p className="error">{error}</p>}

            {notas.length > 0 && (
              <div className="lista-notas">
                {notas.map((nota) => (
                  <article key={nota.id} className="nota-item">
                    <p>{nota.contenido}</p>
                    <span className="nota-fecha">{formatearFecha(nota.creadoEn)}</span>
                  </article>
                ))}
              </div>
            )}

            <label className="campo-nota">
              Nueva nota (diagnóstico, procedimiento realizado, indicaciones)
              <textarea
                value={contenido}
                onChange={(evento) => setContenido(evento.target.value)}
                rows={4}
                placeholder="Escribe la evolución o procedimiento realizado..."
              />
            </label>

            <div className="modal-acciones">
              <button type="button" className="boton-secundario" onClick={() => setCitaActiva(null)}>
                Cerrar
              </button>
              <button type="button" onClick={guardarNota} disabled={procesando || !contenido.trim()}>
                {procesando ? 'Guardando...' : 'Guardar nota y finalizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
