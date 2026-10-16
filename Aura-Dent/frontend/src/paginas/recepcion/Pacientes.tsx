import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
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

export function PacientesRecepcion() {
  const [pacientes, setPacientes] = useState<PacienteRecepcion[]>([]);
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [odontologoSeleccionado, setOdontologoSeleccionado] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [passwordTemporal, setPasswordTemporal] = useState<string | null>(null);
  const [form, setForm] = useState<DatosPaciente | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    try {
      setPacientes(await listarPacientesRecepcion());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    listarOdontologos()
      .then(setOdontologos)
      .catch(() => undefined);
  }, [cargar]);

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

  function abrirNuevo() {
    setEditandoId(null);
    setForm({ ...FORM_VACIO });
    setError(null);
    setPasswordTemporal(null);
  }

  function abrirEditar(paciente: PacienteRecepcion) {
    setEditandoId(paciente.id);
    setForm({
      nombres: paciente.nombres,
      apellidos: paciente.apellidos,
      email: paciente.email,
      dniCe: paciente.dniCe,
      fechaNacimiento: null,
      alergias: null,
      odontologoAsignadoId: paciente.odontologoAsignadoId ?? null
    });
    setError(null);
    setPasswordTemporal(null);
  }

  function actualizarCampo(campo: keyof DatosPaciente, valor: string | null) {
    setForm((previo) => (previo ? { ...previo, [campo]: valor } : previo));
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    if (!form) return;
    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      const datos: DatosPaciente = {
        ...form,
        fechaNacimiento: form.fechaNacimiento || null,
        alergias: form.alergias || null,
        odontologoAsignadoId: form.odontologoAsignadoId ?? null
      };
      if (editandoId) {
        await actualizarPacienteRecepcion(editandoId, datos);
        setMensaje('Paciente actualizado correctamente.');
      } else {
        const creado = await crearPacienteRecepcion(datos);
        setMensaje('Paciente registrado correctamente.');
        setPasswordTemporal(creado.passwordTemporal);
      }
      setForm(null);
      setEditandoId(null);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(paciente: PacienteRecepcion) {
    if (!window.confirm(`¿Eliminar a ${paciente.nombres} ${paciente.apellidos}?`)) return;
    setError(null);
    setMensaje(null);
    try {
      await eliminarPacienteRecepcion(paciente.id);
      setMensaje('Paciente eliminado correctamente.');
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="panel">
      <div className="encabezado-seccion">
        <div>
          <h1>Pacientes</h1>
          <p className="subtitulo">
            Registra y gestiona a los pacientes que llegan de forma presencial.
          </p>
        </div>
        <button type="button" className="boton-secundario" onClick={abrirNuevo}>
          Nuevo paciente
        </button>
      </div>

      {mensaje && <p className="exito">{mensaje}</p>}
      {passwordTemporal && (
        <p className="exito">
          Contraseña temporal generada: <strong>{passwordTemporal}</strong>. Entrégasela al paciente.
        </p>
      )}
      {error && !form && <p className="error">{error}</p>}

      <label className="campo-busqueda">
        Buscar por nombre o DNI/CE
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Ej. Pablo o 00000004"
        />
      </label>

      <label className="campo-busqueda">
        Filtrar por odontólogo
        <select
          value={odontologoSeleccionado ?? ''}
          onChange={(e) => setOdontologoSeleccionado(e.target.value || null)}
        >
          <option value="">Todos los odontólogos</option>
          {odontologos.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombres} {o.apellidos}
            </option>
          ))}
        </select>
      </label>

      {cargando ? (
        <p className="subtitulo">Cargando pacientes...</p>
      ) : filtrados.length === 0 ? (
        <p className="subtitulo">No se encontraron pacientes.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>DNI/CE</th>
                <th>Odontólogo asignado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((paciente) => (
                <tr key={paciente.id}>
                  <td>{paciente.nombres} {paciente.apellidos}</td>
                  <td>{paciente.email}</td>
                  <td>{paciente.dniCe}</td>
                  <td>
                    {paciente.odontologoAsignadoId
                      ? odontologos.find((o) => o.id === paciente.odontologoAsignadoId)?.nombres ??
                        'Asignado'
                      : '—'}
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
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="modal-fondo" onClick={() => setForm(null)}>
          <form
            className="modal modal-form"
            onClick={(evento) => evento.stopPropagation()}
            onSubmit={manejarEnvio}
          >
            <h3>{editandoId ? 'Editar paciente' : 'Nuevo paciente'}</h3>
            {error && <p className="error">{error}</p>}
            <div className="form-grid">
              <label>
                Nombres
                <input
                  value={form.nombres}
                  onChange={(e) => actualizarCampo('nombres', e.target.value)}
                  required
                />
              </label>
              <label>
                Apellidos
                <input
                  value={form.apellidos}
                  onChange={(e) => actualizarCampo('apellidos', e.target.value)}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => actualizarCampo('email', e.target.value)}
                  required
                />
              </label>
              <label>
                DNI / CE
                <input
                  value={form.dniCe}
                  onChange={(e) => actualizarCampo('dniCe', e.target.value)}
                  required
                />
              </label>
              <label>
                Fecha de nacimiento
                <input
                  type="date"
                  value={form.fechaNacimiento ?? ''}
                  onChange={(e) => actualizarCampo('fechaNacimiento', e.target.value)}
                />
              </label>
              <label>
                Alergias
                <input
                  value={form.alergias ?? ''}
                  onChange={(e) => actualizarCampo('alergias', e.target.value)}
                  placeholder="Opcional"
                />
              </label>
              <label className="ancho-completo">
                Odontólogo asignado
                <select
                  value={form.odontologoAsignadoId ?? ''}
                  onChange={(e) =>
                    actualizarCampo('odontologoAsignadoId', e.target.value || null)
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
            </div>
            <div className="modal-acciones">
              <button type="button" className="boton-secundario" onClick={() => setForm(null)}>
                Cancelar
              </button>
              <button type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
