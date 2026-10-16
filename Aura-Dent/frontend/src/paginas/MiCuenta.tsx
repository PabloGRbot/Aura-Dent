import { FormEvent, useEffect, useState } from 'react';
import { actualizarMiPerfil, DatosPerfil } from '../api/autenticacion';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { NOMBRE_ROL } from '../navegacion';
import { Usuario } from '../tipos';

const FORM_VACIO: Omit<DatosPerfil, 'password'> & { password: string } = {
  nombres: '',
  apellidos: '',
  email: '',
  dniCe: '',
  fechaNacimiento: null,
  alergias: null,
  password: ''
};

function desdeUsuario(usuario: Usuario) {
  return {
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    dniCe: usuario.dniCe ?? '',
    fechaNacimiento: usuario.fechaNacimiento ? usuario.fechaNacimiento.slice(0, 10) : null,
    alergias: usuario.alergias ?? null,
    password: ''
  };
}

export function MiCuenta() {
  const { usuario, actualizarUsuario } = useAutenticacion();
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (usuario) {
      setForm(desdeUsuario(usuario));
    }
  }, [usuario]);

  if (!usuario) {
    return null;
  }

  function actualizarCampo(campo: keyof typeof FORM_VACIO, valor: string) {
    setForm((previo) => ({ ...previo, [campo]: valor }));
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      const datos: DatosPerfil = {
        nombres: form.nombres,
        apellidos: form.apellidos,
        email: form.email,
        dniCe: form.dniCe,
        fechaNacimiento: form.fechaNacimiento || null,
        alergias: form.alergias || null,
        password: form.password ? form.password : undefined
      };
      const actualizado = await actualizarMiPerfil(datos);
      actualizarUsuario(actualizado);
      setForm(desdeUsuario(actualizado));
      setMensaje('Cuenta actualizada correctamente.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="panel">
      <h1>Mi cuenta</h1>
      <p className="subtitulo">
        Actualiza tus datos personales y de contacto ({NOMBRE_ROL[usuario.rol]}).
      </p>

      {mensaje && <p className="exito">{mensaje}</p>}
      {error && <p className="error">{error}</p>}

      <form className="modal-form" onSubmit={manejarEnvio}>
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
            Nueva contraseña (opcional)
            <input
              type="password"
              value={form.password}
              onChange={(e) => actualizarCampo('password', e.target.value)}
              placeholder="Dejar vacío para no cambiar"
            />
          </label>
        </div>

        <div className="modal-acciones">
          <button type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </section>
  );
}
