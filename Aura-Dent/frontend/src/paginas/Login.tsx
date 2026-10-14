import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { login } from '../api/autenticacion';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { RUTA_INICIO_POR_ROL } from '../navegacion';

export function Login() {
  const { usuario, iniciarSesion } = useAutenticacion();
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    try {
      const sesion = await login(email, password);
      iniciarSesion(sesion.token, sesion.usuario);
      navegar(RUTA_INICIO_POR_ROL[sesion.usuario.rol], { replace: true });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (usuario) {
    return <Navigate to={RUTA_INICIO_POR_ROL[usuario.rol]} replace />;
  }

  return (
    <main className="login">
      <form className="tarjeta" onSubmit={manejarEnvio}>
        <h1>Aura-Dent</h1>
        <p className="subtitulo">Accede a tu panel</p>
        <label>
          Correo
          <input
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Entrar</button>
        <Link className="enlace-centrado" to="/registro">
          ¿No tienes cuenta? Regístrate como paciente
        </Link>
        <Link className="enlace-centrado" to="/" >
          Volver al inicio
        </Link>
      </form>
    </main>
  );
}
