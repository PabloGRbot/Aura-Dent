import { useCallback, useEffect, useMemo, useState } from 'react';
import { Selector } from '../../componentes/Selector';
import { FechaFormulario } from '../../componentes/FechaFormulario';
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
import { CampoFecha } from '../../componentes/CampoFecha';
import { obtenerDisponibilidad, Intervalo, duracionServicio, hoyLima, aceptarPolitica, obtenerPolitica } from '../../api/gestion_citas';
import { PoliticaCitas } from '../../componentes/PoliticaCitas';
import { AccionesCita } from '../../componentes/AccionesCita';
import { Paginador } from '../../componentes/Paginador';

export function AgendaRecepcion() {
  const [pagina,setPagina]=useState(1);
  const [intervalos,setIntervalos]=useState<Intervalo[]>([]);
  const [aceptaPolitica,setAceptaPolitica]=useState(false);
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
      setCitas(await listarCitasRecepcion(pagina,busqueda));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [pagina,busqueda]);
  useEffect(()=>{setIntervalos([]);setCitaForm(f=>({...f,hora:''}));if(!citaForm.odontologoId||!citaForm.fecha)return;let vivo=true;
    obtenerDisponibilidad(citaForm.odontologoId,citaForm.fecha,duracionServicio(citaForm.servicio ?? 'Consulta general')).then(d=>{if(vivo)setIntervalos(d.intervalos);}).catch(e=>{if(vivo)setCitaError(e.message);});return()=>{vivo=false;};
  },[citaForm.odontologoId,citaForm.fecha,citaForm.servicio]);

  useEffect(() => {
    cargar();
    Promise.all([listarPacientesRecepcion(), listarOdontologos()])
      .then(([ps, os]) => {
        setPacientes(ps.map((p) => ({ id: p.id, nombres: p.nombres, apellidos: p.apellidos, dniCe: p.dniCe })));
        setOdontologos(os);
      })
      .catch(() => undefined);
  }, [cargar]);

  const hoyLocal = hoyLima;

  const abrirCitaPresencial = () => {
    setAceptaPolitica(false);
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
      if(!aceptaPolitica)throw new Error('Registra la aceptación de la política por el paciente.');
      let pacienteId=citaForm.pacienteId;
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
        pacienteId=creado.id;
        setModoPaciente('registrado');
        setMensajeExito(
          `Paciente creado. Contraseña temporal: ${creado.passwordTemporal}. Compártela con el paciente.`
        );
      }
      const politica=await obtenerPolitica();await aceptarPolitica(politica.version,pacienteId);
      await crearCitaRecepcion({
        ...citaForm,
        pacienteId,
        fecha: new Date(`${citaForm.fecha}T${citaForm.hora}:00-05:00`).toISOString()
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
          onChange={(e) => {setPagina(1);setBusqueda(e.target.value);}}
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
                <th>Estado</th><th>Acciones</th>
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
                  <td><AccionesCita cita={cita} personal alCambiar={()=>void cargar()}/></td>
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
            <fieldset className="modo-paciente">
              <legend>Tipo de paciente</legend>
              <div className="modo-paciente-opciones">
                <label
                  className={`opcion-paciente ${
                    modoPaciente === 'registrado' ? 'activa' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="modoPaciente"
                    value="registrado"
                    checked={modoPaciente === 'registrado'}
                    onChange={() => setModoPaciente('registrado')}
                  />
                  <span className="opcion-paciente-texto">
                    <strong>Paciente registrado</strong>
                    <span>Ya tiene una cuenta en el sistema</span>
                  </span>
                </label>
                <label
                  className={`opcion-paciente ${
                    modoPaciente === 'nuevo' ? 'activa' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="modoPaciente"
                    value="nuevo"
                    checked={modoPaciente === 'nuevo'}
                    onChange={() => setModoPaciente('nuevo')}
                  />
                  <span className="opcion-paciente-texto">
                    <strong>Paciente nuevo (externo)</strong>
                    <span>Registrar sus datos ahora</span>
                  </span>
                </label>
              </div>
            </fieldset>
            <div className="form-grid">
              {modoPaciente === 'registrado' ? (
                <label className="ancho-completo">
                  Paciente
                  <Selector buscable onBuscar={q=>{listarPacientesRecepcion(1,q).then(ps=>setPacientes(ps.map(p=>({...p})))).catch(e=>setCitaError(e.message));}}
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
                  </Selector>
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
                    <FechaFormulario
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
                <Selector
                  value={citaForm.servicio ?? ''}
                  onChange={(e) => setCitaForm((prev) => ({ ...prev, servicio: e.target.value }))}
                  required
                >
                  {CATALOGO_SERVICIOS.map((s) => (
                    <option key={s.nombre} value={s.nombre}>
                      {s.nombre} ({formatearSoles(s.precio)})
                    </option>
                  ))}
                </Selector>
              </label>
              <label>
                Odontólogo
                <Selector buscable required onBuscar={q=>{listarOdontologos(q).then(setOdontologos).catch(e=>setCitaError(e.message));}}
                  value={citaForm.odontologoId ?? ''}
                  onChange={(e) =>
                    setCitaForm((prev) => ({ ...prev, odontologoId: e.target.value || null }))
                  }
                >
                  <option value="">Seleccionar odontólogo</option>
                  {odontologos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombres} {o.apellidos}
                    </option>
                  ))}
                </Selector>
              </label>
              <label>
                Fecha
                <CampoFecha
                  value={citaForm.fecha}
                  onChange={(fecha) => setCitaForm((prev) => ({ ...prev, fecha }))}
                  min={hoyLima()}
                />
              </label>
              <label>
                Hora
                <Selector
                  value={citaForm.hora ?? ''}
                  onChange={(e) => setCitaForm((prev) => ({ ...prev, hora:e.target.value }))}
                  required
                ><option value="">Seleccionar horario disponible</option>{intervalos.filter(i=>i.disponible).map(i=><option key={i.horaInicio} value={i.horaInicio}>{i.horaInicio} – {i.horaFin}</option>)}</Selector>
              </label>
              <label>
                Duración (min)
                <input
                  type="number"
                  value={duracionServicio(citaForm.servicio ?? 'Consulta general')}
                  readOnly
                  onChange={(e) =>
                    setCitaForm((prev) => ({ ...prev, duracionMinutos: Number(e.target.value) || 30 }))
                  }
                  min="15"
                />
              </label>
            </div>
            <PoliticaCitas/><label><input type="checkbox" checked={aceptaPolitica} onChange={e=>setAceptaPolitica(e.target.checked)}/> El paciente ha leído y aceptado la política de citas y devoluciones.</label>
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
      <Paginador pagina={pagina} cantidad={citas.length} onCambiar={setPagina}/>
    </section>
  );
}
