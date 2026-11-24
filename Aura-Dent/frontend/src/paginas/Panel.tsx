import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { peticion } from '../api/cliente';
import { obtenerConfiguracion } from '../api/configuracion';
import { ChatIaWidget } from '../componentes/ChatIaWidget';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { Rol } from '../tipos';
interface ResumenPanel {usuarios:{rol:string;cantidad:number}[];citas:{estado:string;cantidad:number}[];pagos:{estado:string;cantidad:number}[]}

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

function ResumenAdmin() {
  const [conteo,setConteo]=useState<Record<string,number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    peticion<ResumenPanel>('/api/panel/resumen')
      .then(r=>setConteo(Object.fromEntries(r.usuarios.map(u=>[u.rol,u.cantidad]))))
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) {
    return <p className="subtitulo">{error}</p>;
  }

  return (
    <div className="tarjetas">
      <article className="tarjeta-accion tarjeta-dato">
        <h3>{Object.values(conteo).reduce((s,n)=>s+n,0)}</h3>
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

function ResumenOdontologo({ usuarioId: _usuarioId }: { usuarioId: string }) {
  const [conteo,setConteo]=useState<Record<string,number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    peticion<ResumenPanel>('/api/panel/resumen')
      .then(r=>setConteo(Object.fromEntries(r.citas.map(c=>[c.estado,c.cantidad]))))
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) {
    return <p className="subtitulo">{error}</p>;
  }

  return (
    <div className="tarjetas">
      <article className="tarjeta-accion tarjeta-dato">
        <h3>{Object.values(conteo).reduce((s,n)=>s+n,0)}</h3>
        <p>Citas asignadas</p>
      </article>
      <article className="tarjeta-accion tarjeta-dato">
        <h3>{conteo.CONFIRMADA ?? 0}</h3>
        <p>Citas confirmadas</p>
      </article>
      <article className="tarjeta-accion tarjeta-dato">
        <h3>{conteo.ATENDIDA ?? 0}</h3>
        <p>Atenciones finalizadas</p>
      </article>
    </div>
  );
}

function ResumenRecepcion() {
  const [citas,setCitas]=useState<Record<string,number>>({});
  const [pagos,setPagos]=useState<Record<string,number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    peticion<ResumenPanel>('/api/panel/resumen')
      .then(r => {
        setCitas(Object.fromEntries(r.citas.map(c=>[c.estado,c.cantidad])));
        setPagos(Object.fromEntries(r.pagos.map(p=>[p.estado,p.cantidad])));
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) {
    return <p className="subtitulo">{error}</p>;
  }

  const porConfirmar=citas.PENDIENTE_PAGO ?? 0;
  const confirmadas=citas.CONFIRMADA ?? 0;
  const pagosPendientes=pagos.PENDIENTE ?? 0;

  return (
    <div className="tarjetas">
      <article className="tarjeta-accion tarjeta-dato">
        <h3>{Object.values(citas).reduce((s,n)=>s+n,0)}</h3>
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

      {usuario.rol === 'Paciente' && <ChatIaWidget />}

    </section>
  );
}
