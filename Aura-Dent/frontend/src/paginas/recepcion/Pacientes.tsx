import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Selector } from '../../componentes/Selector';
import { Paginador } from '../../componentes/Paginador';
import { FechaFormulario } from '../../componentes/FechaFormulario';
import { useConfirmacion } from '../../componentes/Confirmacion';
import {
  actualizarPacienteRecepcion,
  crearPacienteRecepcion,
  eliminarPacienteRecepcion,
  listarPacientesRecepcion,
  PacienteRecepcion,
  DatosPaciente
} from '../../api/recepcion';
import { listarOdontologos, Odontologo } from '../../api/odontologos';

const FORM_VACIO: DatosPaciente = {
  nombres: '',
  apellidos: '',
  email: '',
  dniCe: '',
  fechaNacimiento: null,
  alergias: null,
  odontologoAsignadoId: null
};

type ErroresPaciente = Partial<Record<keyof DatosPaciente, string>>;

function hoyLocal(): string {
  const ahora = new Date();
  const desplazado = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return desplazado.toISOString().slice(0, 10);
}

function validarPaciente(datos: DatosPaciente): ErroresPaciente {
  const errores: ErroresPaciente = {};

  if (!datos.nombres.trim()) {
    errores.nombres = 'Ingresa el nombre del paciente.';
  }
  if (!datos.apellidos.trim()) {
    errores.apellidos = 'Ingresa los apellidos del paciente.';
  }

  const email = datos.email.trim();
  if (!email) {
    errores.email = 'Ingresa el correo electrónico.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errores.email = 'Escribe un correo electrónico válido.';
  }

  if (!datos.dniCe.trim()) {
    errores.dniCe = 'Ingresa el DNI o carné de extranjería.';
  }

  if (datos.fechaNacimiento) {
    const nacimiento = new Date(`${datos.fechaNacimiento}T00:00:00`);
    const hoy = new Date(`${hoyLocal()}T00:00:00`);
    if (Number.isNaN(nacimiento.getTime())) {
      errores.fechaNacimiento = 'Selecciona una fecha válida.';
    } else if (nacimiento > hoy) {
      errores.fechaNacimiento = 'La fecha de nacimiento no puede ser futura.';
    }
  }

  return errores;
}

function iniciales(nombres: string, apellidos: string): string {
  return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}

export function PacientesRecepcion() {
  const confirmar = useConfirmacion();
  const [pacientes, setPacientes] = useState<PacienteRecepcion[]>([]);
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [odontologoSeleccionado, setOdontologoSeleccionado] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [passwordTemporal, setPasswordTemporal] = useState<string | null>(null);
  const [nombreCreado, setNombreCreado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [form, setForm] = useState<DatosPaciente | null>(null);
  const [erroresCampo, setErroresCampo] = useState<ErroresPaciente>({});
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [pagina,setPagina]=useState(1);

  const cargar = useCallback(async () => {
    try {
      setPacientes(await listarPacientesRecepcion(pagina,busqueda,odontologoSeleccionado ?? ''));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [pagina,busqueda,odontologoSeleccionado]);

  useEffect(() => {
    cargar();
    listarOdontologos()
      .then(setOdontologos)
      .catch(() => undefined);
  }, [cargar]);

  useEffect(() => {
    if (!form) return;

    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape' && !guardando) {
        setForm(null);
        setErroresCampo({});
      }
    }

    window.addEventListener('keydown', alPresionarTecla);
    return () => window.removeEventListener('keydown', alPresionarTecla);
  }, [form, guardando]);

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return pacientes.filter((p) => {
      const coincideTexto =
        p.nombres.toLowerCase().includes(termino) ||
        p.apellidos.toLowerCase().includes(termino) ||
        p.email.toLowerCase().includes(termino) ||
        p.dniCe.includes(termino);
      const coincideOdontologo =
        !odontologoSeleccionado || p.odontologoAsignadoId === odontologoSeleccionado;
      return coincideTexto && coincideOdontologo;
    });
  }, [pacientes, busqueda, odontologoSeleccionado]);

  const hayFiltros = busqueda.trim() !== '' || odontologoSeleccionado !== null;
  const textoConteo = `${pacientes.length} ${
    pacientes.length === 1 ? 'paciente en esta página' : 'pacientes en esta página'
  }`;

  function abrirNuevo() {
    setEditandoId(null);
    setForm({ ...FORM_VACIO });
    setErroresCampo({});
    setError(null);
    setMensaje(null);
    setPasswordTemporal(null);
    setNombreCreado(null);
    setCopiado(false);
  }

  function abrirEditar(paciente: PacienteRecepcion) {
    setEditandoId(paciente.id);
    setForm({
      nombres: paciente.nombres,
      apellidos: paciente.apellidos,
      email: paciente.email,
      dniCe: paciente.dniCe,
      fechaNacimiento: paciente.fechaNacimiento ? paciente.fechaNacimiento.slice(0, 10) : null,
      alergias: paciente.alergias ?? null,
      odontologoAsignadoId: paciente.odontologoAsignadoId ?? null
    });
    setErroresCampo({});
    setError(null);
    setMensaje(null);
    setPasswordTemporal(null);
    setNombreCreado(null);
    setCopiado(false);
  }

  function cerrarFormulario() {
    if (guardando) return;
    setForm(null);
    setErroresCampo({});
  }

  function actualizarCampo(campo: keyof DatosPaciente, valor: string | null) {
    setForm((previo) => (previo ? { ...previo, [campo]: valor } : previo));
    setError(null);
    setErroresCampo((previos) => {
      if (!previos[campo]) return previos;
      const siguientes = { ...previos };
      delete siguientes[campo];
      return siguientes;
    });
  }

  function limpiarFiltros() {
    setBusqueda('');
    setOdontologoSeleccionado(null);
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    if (!form) return;

    const errores = validarPaciente(form);
    setErroresCampo(errores);
    if (Object.keys(errores).length > 0) {
      setError('Revisa los campos marcados antes de continuar.');
      return;
    }

    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      const datos: DatosPaciente = {
        ...form,
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim().toLowerCase(),
        dniCe: form.dniCe.trim(),
        fechaNacimiento: form.fechaNacimiento || null,
        alergias: form.alergias?.trim() ? form.alergias.trim() : null,
        odontologoAsignadoId: form.odontologoAsignadoId ?? null
      };

      if (editandoId) {
        await actualizarPacienteRecepcion(editandoId, datos);
        setMensaje('Paciente actualizado correctamente.');
      } else {
        const creado = await crearPacienteRecepcion(datos);
        setPasswordTemporal(creado.passwordTemporal);
        setNombreCreado(`${datos.nombres} ${datos.apellidos}`);
        setCopiado(false);
      }

      setForm(null);
      setErroresCampo({});
      setEditandoId(null);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function copiarPassword() {
    if (!passwordTemporal) return;
    try {
      await navigator.clipboard.writeText(passwordTemporal);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2200);
    } catch {
      setCopiado(false);
    }
  }

  async function borrar(paciente: PacienteRecepcion) {
    confirmar({ titulo: 'Desactivar paciente', descripcion: 'Se desactivará el acceso de ' + paciente.nombres + ' ' + paciente.apellidos + '. Sus citas e historial se conservarán.', accion: 'Desactivar paciente' }, async () => {
      setError(null);
      setMensaje(null);
      try {
        await eliminarPacienteRecepcion(paciente.id);
        setMensaje('Paciente desactivado. Su historial se conserva.');
        await cargar();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <section className="panel">
      <div className="encabezado-seccion">
        <div>
          <h1>Pacientes</h1>
          <p className="subtitulo">
            Registra y gestiona a los pacientes que llegan de forma presencial.
          </p>
          {!cargando && <span className="encabezado-conteo">{textoConteo}</span>}
        </div>
        <button type="button" className="boton-primario" onClick={abrirNuevo}>
          + Nuevo paciente
        </button>
      </div>

      {mensaje && (
        <p className="exito" role="status">
          {mensaje}
        </p>
      )}
      {error && !form && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="filtros-pacientes">
        <label className="campo-busqueda">
          Buscar paciente
          <input
            value={busqueda}
            onChange={(e) => {setPagina(1);setBusqueda(e.target.value);}}
            placeholder="Nombre, email o DNI/CE"
          />
        </label>
        <label className="campo-filtro">
          Filtrar por odontólogo
          <Selector buscable onBuscar={q=>{listarOdontologos(q).then(setOdontologos).catch(e=>setError(e.message));}}
            value={odontologoSeleccionado ?? ''}
            onChange={(e) => {setPagina(1);setOdontologoSeleccionado(e.target.value || null);}}
          >
            <option value="">Todos los odontólogos</option>
            {odontologos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombres} {o.apellidos}
              </option>
            ))}
          </Selector>
        </label>
        {hayFiltros && (
          <button type="button" className="boton-limpiar" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        )}
      </div>

      {cargando ? (
        <p className="subtitulo">Cargando pacientes...</p>
      ) : filtrados.length === 0 ? (
        <div className="estado-vacio">
          <h3>{pacientes.length === 0 ? 'Aún no hay pacientes registrados' : 'Sin resultados'}</h3>
          <p>
            {pacientes.length === 0
              ? 'Registra al primer paciente presencial para comenzar a gestionar su ficha.'
              : 'Prueba con otro nombre, DNI/CE o cambia el filtro de odontólogo.'}
          </p>
          {pacientes.length === 0 ? (
            <button type="button" onClick={abrirNuevo}>
              Registrar paciente
            </button>
          ) : (
            <button type="button" className="boton-secundario" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>DNI / CE</th>
                <th>Odontólogo asignado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((paciente) => {
                const odontologo = odontologos.find(
                  (o) => o.id === paciente.odontologoAsignadoId
                );
                return (
                  <tr key={paciente.id}>
                    <td>
                      <div className="celda-paciente">
                        <span className="avatar-paciente" aria-hidden="true">
                          {iniciales(paciente.nombres, paciente.apellidos)}
                        </span>
                        <span className="celda-paciente-info">
                          <strong>
                            {paciente.nombres} {paciente.apellidos}
                          </strong>
                          <span>{paciente.email}</span>
                        </span>
                      </div>
                    </td>
                    <td className="dato-dni">{paciente.dniCe}</td>
                    <td>
                      {odontologo ? (
                        <span className="badge-odontologo">
                          {odontologo.nombres} {odontologo.apellidos}
                        </span>
                      ) : (
                        <span className="badge-odontologo sin-asignar">Sin asignar</span>
                      )}
                    </td>
                    <td>
                      <div className="tabla-acciones">
                        <button
                          type="button"
                          className="boton-secundario"
                          onClick={() => abrirEditar(paciente)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="boton-peligro"
                          onClick={() => borrar(paciente)}
                        >
                          Desactivar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="modal-fondo" onClick={cerrarFormulario}>
          <form
            className="modal modal-paciente"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-paciente"
            onClick={(evento) => evento.stopPropagation()}
            onSubmit={manejarEnvio}
          >
            <header className="modal-paciente-cabecera">
              <span className="modal-paciente-icono" aria-hidden="true">
                {editandoId ? '✎' : '+'}
              </span>
              <div>
                <span className="modal-paciente-eyebrow">
                  {editandoId ? 'Ficha del paciente' : 'Recepción · Nuevo ingreso'}
                </span>
                <h2 id="titulo-modal-paciente">
                  {editandoId ? 'Editar paciente' : 'Registrar paciente presencial'}
                </h2>
                <p>
                  {editandoId
                    ? 'Actualiza los datos de contacto y la información clínica.'
                    : 'Completa la ficha para crear la cuenta del paciente en el sistema.'}
                </p>
              </div>
              <button
                type="button"
                className="modal-cerrar"
                aria-label="Cerrar formulario"
                onClick={cerrarFormulario}
              >
                ×
              </button>
            </header>

            <div className="modal-paciente-cuerpo">
              {error && (
                <p className="error error-bloque" role="alert">
                  {error}
                </p>
              )}

              <section className="form-seccion" aria-labelledby="seccion-datos-personales">
                <div className="form-seccion-cabecera">
                  <span className="form-seccion-numero" aria-hidden="true">
                    1
                  </span>
                  <div>
                    <h3 id="seccion-datos-personales">Datos personales</h3>
                    <p>Información básica para identificar y contactar al paciente.</p>
                  </div>
                </div>
                <div className="form-grid form-grid-paciente">
                  <label
                    htmlFor="paciente-nombres"
                    className={erroresCampo.nombres ? 'campo-invalido' : undefined}
                  >
                    <span>
                      Nombres <span className="marca-requerido">*</span>
                    </span>
                    <input
                      id="paciente-nombres"
                      value={form.nombres}
                      onChange={(e) => actualizarCampo('nombres', e.target.value)}
                      placeholder="Ej. María Fernanda"
                      autoComplete="given-name"
                      maxLength={100}
                      autoFocus
                      required
                      aria-invalid={Boolean(erroresCampo.nombres)}
                      aria-describedby={
                        erroresCampo.nombres ? 'error-paciente-nombres' : undefined
                      }
                    />
                    {erroresCampo.nombres && (
                      <span className="mensaje-campo" id="error-paciente-nombres">
                        {erroresCampo.nombres}
                      </span>
                    )}
                  </label>

                  <label
                    htmlFor="paciente-apellidos"
                    className={erroresCampo.apellidos ? 'campo-invalido' : undefined}
                  >
                    <span>
                      Apellidos <span className="marca-requerido">*</span>
                    </span>
                    <input
                      id="paciente-apellidos"
                      value={form.apellidos}
                      onChange={(e) => actualizarCampo('apellidos', e.target.value)}
                      placeholder="Ej. Rojas Paredes"
                      autoComplete="family-name"
                      maxLength={100}
                      required
                      aria-invalid={Boolean(erroresCampo.apellidos)}
                      aria-describedby={
                        erroresCampo.apellidos ? 'error-paciente-apellidos' : undefined
                      }
                    />
                    {erroresCampo.apellidos && (
                      <span className="mensaje-campo" id="error-paciente-apellidos">
                        {erroresCampo.apellidos}
                      </span>
                    )}
                  </label>

                  <label
                    htmlFor="paciente-dni"
                    className={erroresCampo.dniCe ? 'campo-invalido' : undefined}
                  >
                    <span>
                      DNI / CE <span className="marca-requerido">*</span>
                    </span>
                    <input
                      id="paciente-dni"
                      value={form.dniCe}
                      onChange={(e) => actualizarCampo('dniCe', e.target.value)}
                      placeholder="Ej. 12345678"
                      inputMode="numeric"
                      maxLength={20}
                      required
                      aria-invalid={Boolean(erroresCampo.dniCe)}
                      aria-describedby={erroresCampo.dniCe ? 'error-paciente-dni' : undefined}
                    />
                    {erroresCampo.dniCe && (
                      <span className="mensaje-campo" id="error-paciente-dni">
                        {erroresCampo.dniCe}
                      </span>
                    )}
                  </label>

                  <label
                    htmlFor="paciente-nacimiento"
                    className={erroresCampo.fechaNacimiento ? 'campo-invalido' : undefined}
                  >
                    Fecha de nacimiento
                    <FechaFormulario
                      id="paciente-nacimiento"
                      value={form.fechaNacimiento ?? ''}
                      onChange={(e) => actualizarCampo('fechaNacimiento', e.target.value || null)}
                      max={hoyLocal()}
                      aria-invalid={Boolean(erroresCampo.fechaNacimiento)}
                      aria-describedby={
                        erroresCampo.fechaNacimiento ? 'error-paciente-nacimiento' : undefined
                      }
                    />
                    {erroresCampo.fechaNacimiento && (
                      <span className="mensaje-campo" id="error-paciente-nacimiento">
                        {erroresCampo.fechaNacimiento}
                      </span>
                    )}
                  </label>

                  <label
                    htmlFor="paciente-email"
                    className={`ancho-completo ${
                      erroresCampo.email ? 'campo-invalido' : ''
                    }`}
                  >
                    <span>
                      Correo electrónico <span className="marca-requerido">*</span>
                    </span>
                    <input
                      id="paciente-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => actualizarCampo('email', e.target.value)}
                      placeholder="paciente@correo.com"
                      autoComplete="email"
                      maxLength={150}
                      required
                      aria-invalid={Boolean(erroresCampo.email)}
                      aria-describedby={erroresCampo.email ? 'error-paciente-email' : undefined}
                    />
                    {erroresCampo.email && (
                      <span className="mensaje-campo" id="error-paciente-email">
                        {erroresCampo.email}
                      </span>
                    )}
                  </label>
                </div>
              </section>

              <section className="form-seccion" aria-labelledby="seccion-datos-clinicos">
                <div className="form-seccion-cabecera">
                  <span className="form-seccion-numero" aria-hidden="true">
                    2
                  </span>
                  <div>
                    <h3 id="seccion-datos-clinicos">Información clínica</h3>
                    <p>Datos relevantes para una atención odontológica segura.</p>
                  </div>
                </div>
                <div className="form-grid form-grid-paciente">
                  <label htmlFor="paciente-alergias" className="ancho-completo">
                    Alergias conocidas
                    <textarea
                      id="paciente-alergias"
                      value={form.alergias ?? ''}
                      onChange={(e) => actualizarCampo('alergias', e.target.value || null)}
                      placeholder="Ej. penicilina, látex, anestesia local..."
                      rows={3}
                    />
                    <span className="texto-ayuda">
                      Déjalo vacío si el paciente no presenta alergias conocidas.
                    </span>
                  </label>
                </div>
              </section>

              <section className="form-seccion" aria-labelledby="seccion-asignacion">
                <div className="form-seccion-cabecera">
                  <span className="form-seccion-numero" aria-hidden="true">
                    3
                  </span>
                  <div>
                    <h3 id="seccion-asignacion">Asignación</h3>
                    <p>Puedes asignar un odontólogo ahora o dejarlo para más adelante.</p>
                  </div>
                </div>
                <div className="form-grid form-grid-paciente">
                  <label htmlFor="paciente-odontologo" className="ancho-completo">
                    Odontólogo responsable
                    <Selector buscable onBuscar={q=>{listarOdontologos(q).then(setOdontologos).catch(e=>setError(e.message));}}
                      id="paciente-odontologo"
                      value={form.odontologoAsignadoId ?? ''}
                      onChange={(e) =>
                        actualizarCampo('odontologoAsignadoId', e.target.value || null)
                      }
                    >
                      <option value="">Sin asignar por ahora</option>
                      {odontologos.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.nombres} {o.apellidos}
                        </option>
                      ))}
                    </Selector>
                  </label>
                </div>
              </section>
            </div>

            <footer className="modal-paciente-pie">
              <span className="modal-paciente-nota">Los campos con * son obligatorios.</span>
              <div className="modal-acciones">
                <button
                  type="button"
                  className="boton-secundario"
                  onClick={cerrarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}>
                  {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Registrar paciente'}
                </button>
              </div>
            </footer>
          </form>
        </div>
      )}

      {passwordTemporal && (
        <div className="modal-fondo" onClick={() => setPasswordTemporal(null)}>
          <div
            className="modal modal-exito"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-paciente-creado"
            onClick={(evento) => evento.stopPropagation()}
          >
            <span className="modal-exito-icono" aria-hidden="true">
              ✓
            </span>
            <h3 id="titulo-paciente-creado">Paciente registrado</h3>
            <p className="subtitulo">
              Se creó la cuenta de <strong>{nombreCreado}</strong>.
            </p>
            <div className="credencial">
              <span>Contraseña temporal</span>
              <code>{passwordTemporal}</code>
            </div>
            <p className="aviso">
              Compártela con el paciente. Por seguridad, no se volverá a mostrar.
            </p>
            <div className="modal-acciones">
              <button
                type="button"
                className="boton-secundario"
                onClick={() => setPasswordTemporal(null)}
              >
                Cerrar
              </button>
              <button type="button" onClick={copiarPassword}>
                {copiado ? '¡Copiado!' : 'Copiar contraseña'}
              </button>
            </div>
            <button type="button" className="boton-enlace" onClick={abrirNuevo}>
              Registrar otro paciente
            </button>
          </div>
        </div>
      )}
      <Paginador pagina={pagina} cantidad={pacientes.length} onCambiar={setPagina}/>
    </section>
  );
}
