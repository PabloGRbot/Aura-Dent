import { FormEvent, useState } from 'react';
import { ArrowLeft, LogIn, Sparkles } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { login } from '../api/autenticacion';
import { BlobDecorativo } from '../componentes/ui/BlobDecorativo';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { RUTA_INICIO_POR_ROL } from '../navegacion';

export function Login() {
  const { usuario, iniciarSesion } = useAutenticacion();
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const sesion = await login(email, password);
      iniciarSesion(sesion.token, sesion.usuario);
      navegar(RUTA_INICIO_POR_ROL[sesion.usuario.rol], { replace: true });
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
    <main className="relative min-h-screen bg-canvas flex items-center justify-center p-6 overflow-hidden">
      <BlobDecorativo />

      <form
        className="relative z-10 w-full max-w-md bg-soft-meadow rounded-card p-8 sm:p-10 animate-aparecer-arriba"
        onSubmit={manejarEnvio}
      >
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-hi-yellow text-deep-ink">
            <Sparkles size={20} />
          </span>
          <h1 className="font-hedvig text-heading font-bold text-deep-ink">Aura-Dent</h1>
        </div>
        <p className="font-inter text-body-sm text-slate-text text-center mb-8">
          Accede a tu panel de citas y salud bucal
        </p>

        <div className="flex flex-col gap-5">
          <div>
            <label className="input-label" htmlFor="login-email">Correo electrónico</label>
            <input
              id="login-email"
              type="email"
              className="input-pill"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div>
            <label className="input-label" htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              className="input-pill"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="bg-red-100 text-red-700 font-inter text-body-sm rounded-card-sm px-4 py-3">
              {error}
            </p>
          )}

          <button type="submit" disabled={enviando} className="btn-primary w-full justify-center mt-2">
            <LogIn size={18} />
            <span>{enviando ? 'Ingresando...' : 'Entrar'}</span>
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-deep-ink/10 flex flex-col items-center gap-3 font-inter text-body-sm">
          <Link className="text-deep-ink font-medium hover:underline" to="/registro">
            ¿No tienes cuenta? Regístrate como paciente
          </Link>
          <Link className="inline-flex items-center gap-1.5 text-slate-text hover:text-deep-ink" to="/">
            <ArrowLeft size={15} />
            <span>Volver al inicio</span>
          </Link>
        </div>
      </form>
    </main>
  );
}
