import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Configuracion, guardarConfiguracion, obtenerConfiguracion } from '../../api/configuracion';

interface CampoConfig {
  clave: string;
  etiqueta: string;
  tipo: 'text' | 'number';
}

const CAMPOS: CampoConfig[] = [
  { clave: 'nombre_establecimiento', etiqueta: 'Nombre del establecimiento', tipo: 'text' },
  { clave: 'direccion', etiqueta: 'Dirección', tipo: 'text' },
  { clave: 'telefono', etiqueta: 'Teléfono', tipo: 'text' },
  { clave: 'email_contacto', etiqueta: 'Email de contacto', tipo: 'text' },
  { clave: 'horario_semana', etiqueta: 'Horario (lunes a viernes)', tipo: 'text' },
  { clave: 'horario_sabado', etiqueta: 'Horario (sábados)', tipo: 'text' },
  { clave: 'duracion_cita', etiqueta: 'Duración de cita (minutos)', tipo: 'number' },
  { clave: 'adelanto_reserva', etiqueta: 'Adelanto de reserva (S/)', tipo: 'number' },
  { clave: 'moneda', etiqueta: 'Moneda', tipo: 'text' }
];

export function ConfiguracionAdmin() {
  const [valores, setValores] = useState<Configuracion>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setValores(await obtenerConfiguracion());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function actualizar(clave: string, valor: string) {
    setValores((previo) => ({ ...previo, [clave]: valor }));
  }

  async function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      setValores(await guardarConfiguracion(valores));
      setMensaje('Configuración guardada correctamente.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <section className="panel">
        <h1>Configuración</h1>
        <p className="subtitulo">Cargando...</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h1>Configuración</h1>
      <p className="subtitulo">Ajusta los datos del establecimiento y los parámetros de reserva.</p>

      {mensaje && <p className="exito">{mensaje}</p>}
      {error && <p className="error">{error}</p>}

      <form className="form-config" onSubmit={manejarEnvio}>
        <div className="form-grid">
          {CAMPOS.map((campo) => (
            <label key={campo.clave}>
              {campo.etiqueta}
              <input
                type={campo.tipo}
                min={campo.tipo === 'number' ? 0 : undefined}
                value={valores[campo.clave] ?? ''}
                onChange={(e) => actualizar(campo.clave, e.target.value)}
              />
            </label>
          ))}
        </div>
        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>
    </section>
  );
}
