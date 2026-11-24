import { FormEvent, useState } from 'react';
import { ArrowLeft, Sparkles, UserPlus } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { registrar } from '../api/autenticacion';
import { FechaFormulario } from '../componentes/FechaFormulario';
import { ModalTerminos } from '../componentes/ModalTerminos';
import { PoliticaCitas } from '../componentes/PoliticaCitas';
import { BlobDecorativo } from '../componentes/ui/BlobDecorativo';
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
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [verTerminos, setVerTerminos] = useState(false);
  const [versionPolitica, setVersionPolitica] = useState('');

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
    if (!aceptaTerminos) {
      setError('Debes aceptar los Términos y Condiciones');
      return;
    }

    if (form.fechaNacimiento) {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const nacimiento = new Date(form.fechaNacimiento); nacimiento.setHours(0, 0, 0, 0);
      if (nacimiento > hoy) {
        setError('La fecha de nacimiento no puede ser futura');
        return;
      }
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
        alergias: form.alergias || null,
        aceptaTerminos: true,
        versionPolitica
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
    <main className="relative min-h-screen bg-canvas flex items-center justify-center p-6 overflow-hidden">
      <BlobDecorativo />

      <form
        className="relative z-10 w-full max-w-2xl bg-soft-meadow rounded-card p-8 sm:p-10 animate-aparecer-arriba"
        onSubmit={manejarEnvio}
      >
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-hi-yellow text-deep-ink">
            <Sparkles size={20} />
          </span>
          <h1 className="font-hedvig text-heading font-bold text-deep-ink">Aura-Dent</h1>
        </div>
        <p className="font-inter text-body-sm text-slate-text text-center mb-8">
          Crea tu cuenta de paciente
        </p>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Nombres</label>
              <input
                className="input-pill"
                value={form.nombres}
                onChange={(e) => actualizarCampo('nombres', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="input-label">Apellidos</label>
              <input
                className="input-pill"
                value={form.apellidos}
                onChange={(e) => actualizarCampo('apellidos', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="input-label">Correo electrónico</label>
            <input
              type="email"
              className="input-pill"
              value={form.email}
              onChange={(e) => actualizarCampo('email', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">DNI / CE</label>
              <input
                className="input-pill"
                value={form.dniCe}
                onChange={(e) => actualizarCampo('dniCe', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="input-label">Fecha de nacimiento</label>
              <FechaFormulario
                value={form.fechaNacimiento}
                onChange={(e) => actualizarCampo('fechaNacimiento', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Alergias (opcional)</label>
            <input
              className="input-pill"
              value={form.alergias}
              onChange={(e) => actualizarCampo('alergias', e.target.value)}
              placeholder="Ej. penicilina, látex..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Contraseña</label>
              <input
                type="password"
                className="input-pill"
                value={form.password}
                onChange={(e) => actualizarCampo('password', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="input-label">Repetir contraseña</label>
              <input
                type="password"
                className="input-pill"
                value={form.confirmar}
                onChange={(e) => actualizarCampo('confirmar', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-inter text-body-sm text-deep-ink">
            <input
              id="acepta-terminos"
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
              className="w-4 h-4 accent-deep-ink"
            />
            <label htmlFor="acepta-terminos">He leído y acepto los</label>
            <button
              type="button"
              className="font-semibold underline text-deep-ink hover:text-dental-teal"
              onClick={() => setVerTerminos(true)}
            >
              Términos y Condiciones
            </button>
          </div>

          <PoliticaCitas onCargada={setVersionPolitica} />

          {error && (
            <p className="bg-red-100 text-red-700 font-inter text-body-sm rounded-card-sm px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando || !versionPolitica}
            className="btn-primary w-full justify-center disabled:opacity-60"
          >
            <UserPlus size={18} />
            <span>{enviando ? 'Creando cuenta...' : 'Registrarme'}</span>
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-deep-ink/10 flex flex-col items-center gap-3 font-inter text-body-sm">
          <Link className="text-deep-ink font-medium hover:underline" to="/login">
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
          <Link className="inline-flex items-center gap-1.5 text-slate-text hover:text-deep-ink" to="/">
            <ArrowLeft size={15} />
            <span>Volver al inicio</span>
          </Link>
        </div>
      </form>

      <ModalTerminos
        abierto={verTerminos}
        onCerrar={() => setVerTerminos(false)}
        onAceptar={() => {
          setAceptaTerminos(true);
          setVerTerminos(false);
        }}
      />
    </main>
  );
}
