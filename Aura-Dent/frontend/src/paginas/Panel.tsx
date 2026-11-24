import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  History,
  Settings,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { peticion } from '../api/cliente';
import { obtenerConfiguracion } from '../api/configuracion';
import { ChatIaWidget } from '../componentes/ChatIaWidget';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { Rol } from '../tipos';

interface ResumenPanel {
  usuarios: { rol: string; cantidad: number }[];
  citas: { estado: string; cantidad: number }[];
  pagos: { estado: string; cantidad: number }[];
}

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
        ruta: '/paciente/registrar-cita'
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
        titulo: 'Comprobantes',
        detalle: 'Consulta las boletas y facturas electrónicas emitidas.',
        ruta: '/administrador/comprobantes'
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

function iconoAccion(titulo: string) {
  const t = titulo.toLowerCase();
  if (t.includes('cita') || t.includes('agenda')) return <Calendar size={20} />;
  if (t.includes('historial')) return <History size={20} />;
  if (t.includes('nota')) return <ClipboardList size={20} />;
  if (t.includes('paciente') || t.includes('usuario')) return <Users size={20} />;
  if (t.includes('pago')) return <CreditCard size={20} />;
  if (t.includes('comprobante')) return <FileText size={20} />;
  return <Settings size={20} />;
}

function TarjetaDato({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <article className="bg-soft-meadow rounded-card p-6 flex flex-col justify-between gap-2">
      <span className="font-hedvig text-heading-lg font-bold text-deep-ink leading-none">
        {valor}
      </span>
      <p className="font-inter text-body-sm text-slate-text">{etiqueta}</p>
    </article>
  );
}

function ResumenAdmin() {
  const [conteo, setConteo] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    peticion<ResumenPanel>('/api/panel/resumen')
      .then((r) => setConteo(Object.fromEntries(r.usuarios.map((u) => [u.rol, u.cantidad]))))
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) {
    return <p className="font-inter text-body-sm text-red-600 mb-6">{error}</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      <TarjetaDato
        valor={Object.values(conteo).reduce((s, n) => s + n, 0)}
        etiqueta="Usuarios registrados"
      />
      {ETIQUETA_CONTEO.map(({ rol, etiqueta }) => (
        <TarjetaDato key={rol} valor={conteo[rol] ?? 0} etiqueta={etiqueta} />
      ))}
    </div>
  );
}

function ResumenOdontologo({ usuarioId: _usuarioId }: { usuarioId: string }) {
  const [conteo, setConteo] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    peticion<ResumenPanel>('/api/panel/resumen')
      .then((r) => setConteo(Object.fromEntries(r.citas.map((c) => [c.estado, c.cantidad]))))
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) {
    return <p className="font-inter text-body-sm text-red-600 mb-6">{error}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <TarjetaDato
        valor={Object.values(conteo).reduce((s, n) => s + n, 0)}
        etiqueta="Citas asignadas"
      />
      <TarjetaDato valor={conteo.CONFIRMADA ?? 0} etiqueta="Citas confirmadas" />
      <TarjetaDato valor={conteo.ATENDIDA ?? 0} etiqueta="Atenciones finalizadas" />
    </div>
  );
}

function ResumenRecepcion() {
  const [citas, setCitas] = useState<Record<string, number>>({});
  const [pagos, setPagos] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    peticion<ResumenPanel>('/api/panel/resumen')
      .then((r) => {
        setCitas(Object.fromEntries(r.citas.map((c) => [c.estado, c.cantidad])));
        setPagos(Object.fromEntries(r.pagos.map((p) => [p.estado, p.cantidad])));
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) {
    return <p className="font-inter text-body-sm text-red-600 mb-6">{error}</p>;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <TarjetaDato
        valor={Object.values(citas).reduce((s, n) => s + n, 0)}
        etiqueta="Citas registradas"
      />
      <TarjetaDato valor={citas.PENDIENTE_PAGO ?? 0} etiqueta="Pendientes de pago" />
      <TarjetaDato valor={citas.CONFIRMADA ?? 0} etiqueta="Citas confirmadas" />
      <TarjetaDato valor={pagos.PENDIENTE ?? 0} etiqueta="Pagos por verificar" />
    </div>
  );
}

export function Panel() {
  const { usuario } = useAutenticacion();
  const [, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    obtenerConfiguracion()
      .then(setConfig)
      .catch(() => undefined);
  }, []);

  if (!usuario) {
    return null;
  }

  const panel = CONTENIDO[usuario.rol];

  return (
    <section className="animate-aparecer-arriba">
      <header className="mb-8">
        <span className="badge badge-yellow mb-3">{panel.titulo}</span>
        <h1 className="font-hedvig text-heading sm:text-heading-lg font-bold text-deep-ink">
          Hola, {usuario.nombres}
        </h1>
        <p className="font-inter text-subheading text-slate-text mt-2 max-w-2xl">
          {panel.descripcion}
        </p>
      </header>

      {usuario.rol === 'Administrador' && <ResumenAdmin />}
      {usuario.rol === 'Odontologo' && <ResumenOdontologo usuarioId={usuario.id} />}
      {usuario.rol === 'Recepcion' && <ResumenRecepcion />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {panel.acciones.map((accion) =>
          accion.ruta ? (
            <Link
              key={accion.titulo}
              to={accion.ruta}
              className="group bg-soft-meadow rounded-card p-6 flex flex-col justify-between gap-6 card-hover"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-canvas text-deep-ink group-hover:bg-hi-yellow transition-colors">
                    {iconoAccion(accion.titulo)}
                  </span>
                  <ArrowUpRight
                    size={18}
                    className="text-slate-text group-hover:text-deep-ink transition-colors"
                  />
                </div>
                <h3 className="font-hedvig text-heading-sm font-bold text-deep-ink mb-1.5">
                  {accion.titulo}
                </h3>
                <p className="font-inter text-body-sm text-slate-text leading-relaxed">
                  {accion.detalle}
                </p>
              </div>
            </Link>
          ) : (
            <article
              key={accion.titulo}
              className="bg-soft-meadow rounded-card p-6 flex flex-col justify-between gap-4"
            >
              <div>
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-canvas text-deep-ink mb-4">
                  {iconoAccion(accion.titulo)}
                </span>
                <h3 className="font-hedvig text-heading-sm font-bold text-deep-ink mb-1.5">
                  {accion.titulo}
                </h3>
                <p className="font-inter text-body-sm text-slate-text leading-relaxed">
                  {accion.detalle}
                </p>
              </div>
            </article>
          )
        )}
      </div>

      {usuario.rol === 'Paciente' && <ChatIaWidget />}
    </section>
  );
}
