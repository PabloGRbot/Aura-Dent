import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { registrar } from '../api/autenticacion';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { RUTA_INICIO_POR_ROL, RUTA_RESERVA_PACIENTE } from '../navegacion';

interface FormularioRegistro {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  confirmar: string;
  dniCe: string;
  fechaNacimiento: string;
  alergias: string;
}

const FORMULARIO_VACIO: FormularioRegistro = {
  nombres: '',
  apellidos: '',
  email: '',
  password: '',
  confirmar: '',
  dniCe: '',
  fechaNacimiento: '',
  alergias: ''
};

export function Registro() {
  const { usuario, iniciarSesion } = useAutenticacion();
  const navegar = useNavigate();
  const [form, setForm] = useState<FormularioRegistro>(FORMULARIO_VACIO);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizarCampo(campo: keyof FormularioRegistro, valor: string) {
    setForm((previo) => ({ ...previo, [campo]: valor }));
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setEnviando(true);
    try {
      const sesion = await registrar({
        nombres: form.nombres,
        apellidos: form.apellidos,
        email: form.email,
        password: form.password,
        dniCe: form.dniCe,
        fechaNacimiento: form.fechaNacimiento || null,
        alergias: form.alergias || null
      });
      iniciarSesion(sesion.token, sesion.usuario);
      navegar(RUTA_RESERVA_PACIENTE, { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (usuario) {
    return <Navigate to={RUTA_INICIO_POR_ROL[usuario.rol]} replace />;
  }

  return (
    <main className="login">
      <form className="tarjeta tarjeta-registro" onSubmit={manejarEnvio}>
        <h1>Aura-Dent</h1>
        <p className="subtitulo">Crea tu cuenta de paciente</p>

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
        </div>

        <label>
          Correo electrónico
          <input
            type="email"
            value={form.email}
            onChange={(e) => actualizarCampo('email', e.target.value)}
            required
          />
        </label>

        <div className="form-grid">
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
              value={form.fechaNacimiento}
              onChange={(e) => actualizarCampo('fechaNacimiento', e.target.value)}
            />
          </label>
        </div>

        <label>
          Alergias (opcional)
          <input
            value={form.alergias}
            onChange={(e) => actualizarCampo('alergias', e.target.value)}
            placeholder="Ej. penicilina, látex..."
          />
        </label>

        <div className="form-grid">
          <label>
            Contraseña
            <input
              type="password"
              value={form.password}
              onChange={(e) => actualizarCampo('password', e.target.value)}
              required
            />
          </label>
          <label>
            Repetir contraseña
            <input
              type="password"
              value={form.confirmar}
              onChange={(e) => actualizarCampo('confirmar', e.target.value)}
              required
            />
          </label>
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? 'Creando cuenta...' : 'Registrarme'}
        </button>
        <Link className="enlace-centrado" to="/login">
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
        <Link className="enlace-centrado" to="/">
          Volver al inicio
        </Link>
      </form>
    </main>
  );
}
