import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  crearPacienteRecepcion,
  listarCitasRecepcion,
  listarPacientesRecepcion,
  crearCitaRecepcion,
  DatosCitaPresencial,
  DatosPaciente
} from '../../api/recepcion';
import { listarOdontologos, Odontologo } from '../../api/odontologos';
import { ETIQUETA_ESTADO, formatearFecha } from '../../formato';
import { CitaAgenda } from '../../tipos';
import { CATALOGO_SERVICIOS, formatearSoles } from '../../catalogo_servicios';

export function AgendaRecepcion() {
  const [citas, setCitas] = useState<CitaAgenda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Cita presencial
  const [citaPresencialAbierta, setCitaPresencialAbierta] = useState(false);
  const [pacientes, setPacientes] = useState<{ id: string; nombres: string; apellidos: string; dniCe: string }[]>([]);
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [citaForm, setCitaForm] = useState<DatosCitaPresencial>({
    pacienteId: '',
    fecha: '',
    hora: '',
    duracionMinutos: 30,
    servicio: CATALOGO_SERVICIOS[0]?.nombre ?? '',
    odontologoId: null
  });
  const [citaCargando, setCitaCargando] = useState(false);
  const [citaError, setCitaError] = useState<string | null>(null);
  const [modoPaciente, setModoPaciente] = useState<'registrado' | 'nuevo'>('registrado');
  const [pacienteNuevo, setPacienteNuevo] = useState<DatosPaciente>({
    nombres: '',
    apellidos: '',
    email: '',
    dniCe: '',
    fechaNacimiento: null,
    alergias: null
  });
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

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
    Promise.all([listarPacientesRecepcion(), listarOdontologos()])
      .then(([ps, os]) => {
        setPacientes(ps.map((p) => ({ id: p.id, nombres: p.nombres, apellidos: p.apellidos, dniCe: p.dniCe })));
        setOdontologos(os);
      })
      .catch(() => undefined);
  }, [cargar]);

  const hoyLocal = (): string => {
    const ahora = new Date();
    const desplazado = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
    return desplazado.toISOString().slice(0, 10);
  };

  const abrirCitaPresencial = () => {
    setCitaForm({
      pacienteId: '',
      fecha: hoyLocal(),
      hora: '',
      duracionMinutos: 30,
      servicio: CATALOGO_SERVICIOS[0]?.nombre ?? '',
      odontologoId: null
    });
    setModoPaciente('registrado');
    setPacienteNuevo({
      nombres: '',
      apellidos: '',
      email: '',
      dniCe: '',
      fechaNacimiento: null,
      alergias: null
    });
    setCitaError(null);
    setMensajeExito(null);
    setCitaPresencialAbierta(true);
  };

  const cerrarCitaPresencial = () => setCitaPresencialAbierta(false);

  const manejarCrearCita = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setCitaError(null);
    setMensajeExito(null);
    setCitaCargando(true);
    try {
      if (modoPaciente === 'nuevo') {
        const creado = await crearPacienteRecepcion({
          nombres: pacienteNuevo.nombres,
          apellidos: pacienteNuevo.apellidos,
          email: pacienteNuevo.email,
          dniCe: pacienteNuevo.dniCe,
          fechaNacimiento: pacienteNuevo.fechaNacimiento ?? null,
          alergias: pacienteNuevo.alergias ?? null
        });
        setCitaForm((prev) => ({ ...prev, pacienteId: creado.id }));
        setMensajeExito(
          `Paciente creado. Contraseña temporal: ${creado.passwordTemporal}. Compártela con el paciente.`
        );
      }
      await crearCitaRecepcion({
        ...citaForm,
        fecha: new Date(`${citaForm.fecha}T${citaForm.hora}`).toISOString()
      });
      setCitaPresencialAbierta(false);
      await cargar();
    } catch (e) {
      setCitaError((e as Error).message);
    } finally {
      setCitaCargando(false);
    }
  };

  const filtradas: CitaAgenda[] = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return citas;
    return citas.filter(
      (cita: CitaAgenda) =>
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
        <div className="encabezado-acciones">
          <button type="button" className="boton-secundario" onClick={cargar}>
            Actualizar
          </button>
          <button type="button" className="boton-primario" onClick={abrirCitaPresencial}>
            Nueva cita presencial
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {cargando && <p className="subtitulo">Cargando agenda...</p>}
      {mensajeExito && <p className="exito">{mensajeExito}</p>}

      <label className="campo-busqueda">
        Buscar por paciente o DNI/CE
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Ej. Pablo o 00000004"
        />
      </label>

      {!cargando && filtradas.length === 0 ? (
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
              {filtradas.map((cita: CitaAgenda) => (
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

      {/* Modal cita presencial */}
      {citaPresencialAbierta && (
        <div className="modal-fondo" onClick={cerrarCitaPresencial}>
          <form
            className="modal modal-form"
            onClick={(evento) => evento.stopPropagation()}
            onSubmit={manejarCrearCita}
          >
            <h3>Nueva cita presencial</h3>
            {citaError && <p className="error">{citaError}</p>}
            {mensajeExito && <p className="exito">{mensajeExito}</p>}
            <div className="modo-paciente" style={{ gridColumn: '1 / -1', marginBottom: 10 }}>
              <strong>Tipo de paciente</strong>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
                <input
                  type="radio"
                  name="modoPaciente"
                  value="registrado"
                  checked={modoPaciente === 'registrado'}
                  onChange={() => setModoPaciente('registrado')}
                />
                Paciente registrado
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="radio"
                  name="modoPaciente"
                  value="nuevo"
                  checked={modoPaciente === 'nuevo'}
                  onChange={() => setModoPaciente('nuevo')}
                />
                Paciente nuevo (externo)
              </label>
            </div>
            <div className="form-grid">
              {modoPaciente === 'registrado' ? (
                <label className="ancho-completo">
                  Paciente
                  <select
                    value={citaForm.pacienteId}
                    onChange={(e) =>
                      setCitaForm((prev) => ({ ...prev, pacienteId: e.target.value }))
                    }
                    required
                  >
                    <option value="">Seleccionar paciente</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombres} {p.apellidos} ({p.dniCe})
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <>
                  <label>
                    Nombres
                    <input
                      value={pacienteNuevo.nombres}
                      onChange={(e) =>
                        setPacienteNuevo((prev) => ({ ...prev, nombres: e.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Apellidos
                    <input
                      value={pacienteNuevo.apellidos}
                      onChange={(e) =>
                        setPacienteNuevo((prev) => ({ ...prev, apellidos: e.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={pacienteNuevo.email}
                      onChange={(e) =>
                        setPacienteNuevo((prev) => ({ ...prev, email: e.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    DNI / CE
                    <input
                      value={pacienteNuevo.dniCe}
                      onChange={(e) =>
                        setPacienteNuevo((prev) => ({ ...prev, dniCe: e.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Fecha de nacimiento
                    <input
                      type="date"
                      value={pacienteNuevo.fechaNacimiento ?? ''}
                      onChange={(e) =>
                        setPacienteNuevo((prev) => ({
                          ...prev,
                          fechaNacimiento: e.target.value || null
                        }))}
                      />
                  </label>
                  <label>
                    Alergias
                    <input
                      value={pacienteNuevo.alergias ?? ''}
                      onChange={(e) =>
                        setPacienteNuevo((prev) => ({ ...prev, alergias: e.target.value || null }))
                      }
                    />
                  </label>
                </>
              )}
              <label className="ancho-completo">
                Servicio
                <select
                  value={citaForm.servicio ?? ''}
                  onChange={(e) => setCitaForm((prev) => ({ ...prev, servicio: e.target.value }))}
                  required
                >
                  {CATALOGO_SERVICIOS.map((s) => (
                    <option key={s.nombre} value={s.nombre}>
                      {s.nombre} ({formatearSoles(s.precio)})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Odontólogo (opcional)
                <select
                  value={citaForm.odontologoId ?? ''}
                  onChange={(e) =>
                    setCitaForm((prev) => ({ ...prev, odontologoId: e.target.value || null }))
                  }
                >
                  <option value="">Sin asignar</option>
                  {odontologos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombres} {o.apellidos}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Fecha
                <input
                  type="date"
                  value={citaForm.fecha}
                  onChange={(e) => setCitaForm((prev) => ({ ...prev, fecha: e.target.value }))}
                  min={hoyLocal()}
                  required
                />
              </label>
              <label>
                Hora
                <input
                  type="time"
                  value={citaForm.hora}
                  onChange={(e) => setCitaForm((prev) => ({ ...prev, hora: e.target.value }))}
                  required
                />
              </label>
              <label>
                Duración (min)
                <input
                  type="number"
                  value={citaForm.duracionMinutos}
                  onChange={(e) =>
                    setCitaForm((prev) => ({ ...prev, duracionMinutos: Number(e.target.value) || 30 }))
                  }
                  min="15"
                />
              </label>
            </div>
            <div className="modal-acciones">
              <button type="button" className="boton-secundario" onClick={cerrarCitaPresencial}>
                Cancelar
              </button>
              <button type="submit" disabled={citaCargando}>
                {citaCargando ? 'Registrando...' : 'Registrar cita'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
