import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerAgenda } from '../api/agenda';
import { listarCitasRecepcion, listarPagosRecepcion } from '../api/recepcion';
import { listarUsuarios } from '../api/usuarios';
import { ChatIaWidget } from '../componentes/ChatIaWidget';
import { ReservaCitaPaciente } from '../componentes/ReservaCitaPaciente';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { CitaAgenda, PagoDetalle, Rol, Usuario } from '../tipos';

interface Accion {
  titulo: string;
  detalle: string;
  ruta?: string;
}

interface ContenidoPanel {
  titulo: string;
  descripcion: string;
  acciones: Accion[];
}

const CONTENIDO: Record<Rol, ContenidoPanel> = {
  Paciente: {
    titulo: 'Tu salud dental, en orden',
    descripcion: 'Reserva citas, revisa tus próximas atenciones y consulta tu historial.',
    acciones: [
      {
        titulo: 'Reservar una cita',
        detalle: 'Elige servicio, fecha y hora disponible.',
        ruta: '/paciente/mis-citas'
      },
      {
        titulo: 'Mis próximas citas',
        detalle: 'Revisa y da seguimiento a tus reservas.',
        ruta: '/paciente/mis-citas'
      },
      {
        titulo: 'Mi historial',
        detalle: 'Consulta los tratamientos que ya recibiste.',
        ruta: '/paciente/historial'
      }
    ]
  },
  Odontologo: {
    titulo: 'Tu agenda clínica',
    descripcion: 'Revisa las citas asignadas y registra la evolución de tus pacientes.',
    acciones: [
      {
        titulo: 'Mi agenda',
        detalle: 'Toma citas confirmadas y revisa las asignadas.',
        ruta: '/odontologo/mi-agenda'
      },
      {
        titulo: 'Registrar nota clínica',
        detalle: 'Anota el diagnóstico y procedimiento al finalizar la consulta.',
        ruta: '/odontologo/mi-agenda'
      },
      {
        titulo: 'Notas clínicas',
        detalle: 'Consulta el historial de atenciones que registraste.',
        ruta: '/odontologo/notas'
      },
      {
        titulo: 'Pacientes',
        detalle: 'Revisa los pacientes con citas en la clínica.',
        ruta: '/odontologo/pacientes'
      }
    ]
  },
  Recepcion: {
    titulo: 'Gestión de agenda y pagos',
    descripcion: 'Administra las reservas del día y verifica el estado de los pagos.',
    acciones: [
      {
        titulo: 'Agenda general',
        detalle: 'Revisa todas las reservas y su estado de confirmación.',
        ruta: '/recepcion/agenda'
      },
      {
        titulo: 'Verificar pagos',
        detalle: 'Confirma o rechaza adelantos pendientes por QR/CIP.',
        ruta: '/recepcion/pagos'
      }
    ]
  },
  Administrador: {
    titulo: 'Panel de administración',
    descripcion: 'Gestiona usuarios, roles y la configuración general del sistema.',
    acciones: [
      {
        titulo: 'Pagos y reportes',
        detalle: 'Revisa los ingresos y genera reportes por semana, mes o año.',
        ruta: '/administrador/pagos'
      },
      {
        titulo: 'Gestionar usuarios',
        detalle: 'Crea, edita y elimina cuentas del personal y pacientes.',
        ruta: '/administrador/usuarios'
      },
      {
        titulo: 'Configuración',
        detalle: 'Ajusta los datos del establecimiento y los parámetros de reserva.',
        ruta: '/administrador/configuracion'
      }
    ]
  }
};

const ETIQUETA_CONTEO: { rol: Rol; etiqueta: string }[] = [
  { rol: 'Paciente', etiqueta: 'Pacientes' },
  { rol: 'Odontologo', etiqueta: 'Odontólogos' },
  { rol: 'Recepcion', etiqueta: 'Recepción' },
  { rol: 'Administrador', etiqueta: 'Administradores' }
];

function ResumenAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarUsuarios()
      .then(setUsuarios)
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) {
    return <p className="subtitulo">{error}</p>;
  }

  const conteo = usuarios.reduce<Record<string, number>>((acumulado, usuario) => {
    acumulado[usuario.rol] = (acumulado[usuario.rol] ?? 0) + 1;
    return acumulado;
  }, {});

  return (
    <div className="tarjetas">
      <article className="tarjeta-accion tarjeta-dato">
        <h3>{usuarios.length}</h3>
        <p>Usuarios registrados</p>
      </article>
      {ETIQUETA_CONTEO.map(({ rol, etiqueta }) => (
        <article key={rol} className="tarjeta-accion tarjeta-dato">
          <h3>{conteo[rol] ?? 0}</h3>
          <p>{etiqueta}</p>
        </article>
      ))}
    </div>
  );
}

function ResumenOdontologo({ usuarioId }: { usuarioId: string }) {
  const [agenda, setAgenda] = useState<CitaAgenda[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerAgenda()
      .then(setAgenda)
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) {
    return <p className="subtitulo">{error}</p>;
  }

  const mias = agenda.filter((cita) => cita.odontologoId === usuarioId);
  const disponibles = agenda.filter((cita) => !cita.odontologoId);
  const atendidas = mias.filter((cita) => cita.estado === 'ATENDIDA');

  return (
    <div className="tarjetas">
      <article className="tarjeta-accion tarjeta-dato">
        <h3>{mias.length}</h3>
        <p>Citas asignadas</p>
      </article>
      <article className="tarjeta-accion tarjeta-dato">
        <h3>{disponibles.length}</h3>
        <p>Disponibles para tomar</p>
      </article>
      <article className="tarjeta-accion tarjeta-dato">
        <h3>{atendidas.length}</h3>
        <p>Atenciones finalizadas</p>
      </article>
    </div>
  );
}

function ResumenRecepcion() {
  const [citas, setCitas] = useState<CitaAgenda[]>([]);
  const [pagos, setPagos] = useState<PagoDetalle[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listarCitasRecepcion(), listarPagosRecepcion()])
      .then(([citasData, pagosData]) => {
        setCitas(citasData);
        setPagos(pagosData);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) {
    return <p className="subtitulo">{error}</p>;
  }

  const porConfirmar = citas.filter((cita) => cita.estado === 'PENDIENTE_PAGO').length;
  const confirmadas = citas.filter((cita) => cita.estado === 'CONFIRMADA').length;
  const pagosPendientes = pagos.filter((pago) => pago.estado === 'PENDIENTE').length;

  return (
    <div className="tarjetas">
      <article className="tarjeta-accion tarjeta-dato">
        <h3>{citas.length}</h3>
        <p>Citas registradas</p>
      </article>
      <article className="tarjeta-accion tarjeta-dato">
        <h3>{porConfirmar}</h3>
        <p>Pendientes de pago</p>
      </article>
      <article className="tarjeta-accion tarjeta-dato">
        <h3>{confirmadas}</h3>
        <p>Citas confirmadas</p>
      </article>
      <article className="tarjeta-accion tarjeta-dato">
        <h3>{pagosPendientes}</h3>
        <p>Pagos por verificar</p>
      </article>
    </div>
  );
}

export function Panel() {
  const { usuario } = useAutenticacion();

  if (!usuario) {
    return null;
  }

  const panel = CONTENIDO[usuario.rol];

  return (
    <section className="panel">
      <h1>Hola, {usuario.nombres}</h1>
      <p className="subtitulo">{panel.titulo}</p>
      <p className="texto">{panel.descripcion}</p>

      {usuario.rol === 'Administrador' && <ResumenAdmin />}

      {usuario.rol === 'Odontologo' && <ResumenOdontologo usuarioId={usuario.id} />}

      {usuario.rol === 'Recepcion' && <ResumenRecepcion />}

      <div className="tarjetas">
        {panel.acciones.map((accion) =>
          accion.ruta ? (
            <Link key={accion.titulo} to={accion.ruta} className="tarjeta-accion">
              <h3>{accion.titulo}</h3>
              <p>{accion.detalle}</p>
            </Link>
          ) : (
            <article key={accion.titulo} className="tarjeta-accion">
              <h3>{accion.titulo}</h3>
              <p>{accion.detalle}</p>
            </article>
          )
        )}
      </div>

      {usuario.rol === 'Paciente' && <ReservaCitaPaciente />}

      {usuario.rol === 'Paciente' && <ChatIaWidget />}

      {usuario.rol !== 'Paciente' && (
        <div className="panel-ubicacion">
          <h2>Ubicación de la clínica</h2>
          <p className="texto">
            Av. Los Álamos 123, Miraflores, Lima. Referencia para citas presenciales y
            coordinación de la agenda diaria.
          </p>
          <div className="mapa-contenedor-pequeno">
            <iframe
              className="mapa-iframe"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3900.857953121273!2d-77.03035868465102!3d-12.123570791414038!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c818cd4c5f2b%3A0x82c27f1a16cfa4ab!2sMiraflores%2C%20Lima%2C%20Per%C3%BA!5e0!3m2!1ses!2spe!4v1700000000000!5m2!1ses!2spe"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              title="Ubicación de Aura-Dent en Miraflores, Lima"
            />
          </div>
        </div>
      )}
    </section>
  );
}
