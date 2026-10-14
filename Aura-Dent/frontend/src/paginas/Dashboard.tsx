import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { Rol } from '../tipos';

const PANEL: Record<Rol, { titulo: string; acciones: string[] }> = {
  Paciente: {
    titulo: 'Tu salud dental, en orden',
    acciones: ['Reservar una cita', 'Ver mis próximas citas', 'Consultar mi historial']
  },
  Recepcion: {
    titulo: 'Gestión de agenda y pagos',
    acciones: ['Revisar agenda del día', 'Verificar pagos', 'Reprogramar citas']
  },
  Odontologo: {
    titulo: 'Tu agenda clínica',
    acciones: ['Ver citas de hoy', 'Registrar diagnóstico']
  },
  Administrador: {
    titulo: 'Panel de administración',
    acciones: ['Gestionar usuarios', 'Administrar roles', 'Configuración del sistema']
  }
};

export function Dashboard() {
  const { usuario } = useAutenticacion();

  if (!usuario) {
    return null;
  }

  const panel = PANEL[usuario.rol];

  return (
    <section className="dashboard">
      <h1>Hola, {usuario.nombres}</h1>
      <p className="subtitulo">{panel.titulo}</p>
      <div className="tarjetas">
        {panel.acciones.map((accion) => (
          <article key={accion} className="tarjeta-accion">
            {accion}
          </article>
        ))}
      </div>
    </section>
  );
}
