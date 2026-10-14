import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  actualizarUsuario,
  crearUsuario,
  DatosUsuario,
  eliminarUsuario,
  listarUsuarios
} from '../../api/usuarios';
import { NOMBRE_ROL } from '../../navegacion';
import { Rol, Usuario } from '../../tipos';

const ROLES: Rol[] = ['Paciente', 'Odontologo', 'Recepcion', 'Administrador'];

const FORM_VACIO: DatosUsuario = {
  nombres: '',
  apellidos: '',
  email: '',
  password: '',
  dniCe: '',
  fechaNacimiento: null,
  alergias: null,
  rol: 'Paciente'
};

export function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [form, setForm] = useState<DatosUsuario | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setUsuarios(await listarUsuarios());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function abrirNuevo() {
    setEditandoId(null);
    setForm({ ...FORM_VACIO });
    setError(null);
  }

  function abrirEditar(usuario: Usuario) {
    setEditandoId(usuario.id);
    setForm({
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      password: '',
      dniCe: usuario.dniCe ?? '',
      fechaNacimiento: usuario.fechaNacimiento ? usuario.fechaNacimiento.slice(0, 10) : null,
      alergias: usuario.alergias ?? null,
      rol: usuario.rol
    });
    setError(null);
  }

  function actualizarCampo(campo: keyof DatosUsuario, valor: string) {
    setForm((previo) => (previo ? { ...previo, [campo]: valor } : previo));
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    if (!form) {
      return;
    }
    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      const datos: DatosUsuario = {
        ...form,
        password: form.password ? form.password : undefined,
        fechaNacimiento: form.fechaNacimiento || null,
        alergias: form.alergias || null
      };
      if (editandoId) {
        await actualizarUsuario(editandoId, datos);
        setMensaje('Usuario actualizado correctamente.');
      } else {
        await crearUsuario(datos);
        setMensaje('Usuario creado correctamente.');
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

  async function borrar(usuario: Usuario) {
    if (!window.confirm(`¿Eliminar a ${usuario.nombres} ${usuario.apellidos}?`)) {
      return;
    }
    setError(null);
    setMensaje(null);
    try {
      await eliminarUsuario(usuario.id);
      setMensaje('Usuario eliminado correctamente.');
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="panel">
      <div className="encabezado-seccion">
        <div>
          <h1>Usuarios</h1>
          <p className="subtitulo">Crea, edita y elimina las cuentas del personal y pacientes.</p>
        </div>
        <button type="button" onClick={abrirNuevo}>
          Nuevo usuario
        </button>
      </div>

      {mensaje && <p className="exito">{mensaje}</p>}
      {error && !form && <p className="error">{error}</p>}

      {cargando ? (
        <p className="subtitulo">Cargando usuarios...</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>DNI/CE</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>
                    {usuario.nombres} {usuario.apellidos}
                  </td>
                  <td>{usuario.email}</td>
                  <td>{usuario.dniCe ?? '—'}</td>
                  <td>
                    <span className="badge-rol">{NOMBRE_ROL[usuario.rol]}</span>
                  </td>
                  <td>
                    <div className="tabla-acciones">
                      <button type="button" className="boton-secundario" onClick={() => abrirEditar(usuario)}>
                        Editar
                      </button>
                      <button type="button" className="boton-peligro" onClick={() => borrar(usuario)}>
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
            <h3>{editandoId ? 'Editar usuario' : 'Nuevo usuario'}</h3>

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
                DNI/CE
                <input
                  value={form.dniCe}
                  onChange={(e) => actualizarCampo('dniCe', e.target.value)}
                  required
                />
              </label>
              <label>
                Rol
                <select value={form.rol} onChange={(e) => actualizarCampo('rol', e.target.value)}>
                  {ROLES.map((rol) => (
                    <option key={rol} value={rol}>
                      {NOMBRE_ROL[rol]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Fecha de nacimiento
                <input
                  type="date"
                  value={form.fechaNacimiento ?? ''}
                  onChange={(e) => actualizarCampo('fechaNacimiento', e.target.value)}
                />
              </label>
              <label className="ancho-completo">
                Alergias
                <input
                  value={form.alergias ?? ''}
                  onChange={(e) => actualizarCampo('alergias', e.target.value)}
                  placeholder="Opcional"
                />
              </label>
              <label className="ancho-completo">
                {editandoId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                <input
                  type="password"
                  value={form.password ?? ''}
                  onChange={(e) => actualizarCampo('password', e.target.value)}
                  placeholder={editandoId ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
                  required={!editandoId}
                />
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
