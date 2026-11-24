import { useEffect, useState } from 'react';
import { Calendar, Mail, MapPin, Moon, Phone, Sparkles, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { obtenerConfiguracion } from '../api/configuracion';
import { ChatIaWidget } from '../componentes/ChatIaWidget';
import { ServiciosCarousel } from '../componentes/ServiciosCarousel';
import { BlobDecorativo } from '../componentes/ui/BlobDecorativo';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { RUTA_INICIO_POR_ROL } from '../navegacion';

const HORARIOS = [
  { dia: 'Lunes a viernes', hora: '8:00 - 12:00 y 14:00 - 20:00' },
  { dia: 'Sábados', hora: '8:00 - 12:00' },
  { dia: 'Domingos y feriados', hora: 'Cerrado' }
];

const DIRECCION_POR_DEFECTO = 'Av. Los Álamos 123, Miraflores, Lima';
const MAPA_POR_DEFECTO =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3900.857953121273!2d-77.03035868465102!3d-12.123570791414038!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c818cd4c5f2b%3A0x82c27f1a16cfa4ab!2sMiraflores%2C%20Lima%2C%20Per%C3%BA!5e0!3m2!1ses!2spe!4v1700000000000!5m2!1ses!2spe';

export function InicioPublico() {
  const { usuario } = useAutenticacion();
  const [config, setConfig] = useState<Record<string, string>>({});
  const destinoPanel = usuario ? RUTA_INICIO_POR_ROL[usuario.rol] : '/login';
  const textoBoton = usuario ? 'Ir a mi panel' : 'Iniciar sesión';

  useEffect(() => {
    obtenerConfiguracion()
      .then(setConfig)
      .catch(() => undefined);
  }, []);

  const direccion = config.direccion || DIRECCION_POR_DEFECTO;
  const mapa = config.ubicacion_mapa || MAPA_POR_DEFECTO;

  const ahora = new Date();
  const diaSemana = ahora.getDay();
  const esSabado = diaSemana === 6;
  const esDomingo = diaSemana === 0;
  const etiquetaDia = esDomingo ? 'Domingo' : esSabado ? 'Sábado' : 'Lunes a viernes';
  const horarioDia = esDomingo
    ? 'Cerrado'
    : esSabado
    ? '8:00 - 12:00'
    : '8:00 - 12:00 y 14:00 - 20:00';

  return (
    <div className="min-h-screen bg-canvas text-deep-ink">
      {/* Navbar estilo Ditto */}
      <header className="sticky top-0 z-40 bg-soft-meadow/95 backdrop-blur-md border-b border-deep-ink/10">
        <div className="max-w-page mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 font-hedvig text-heading-sm font-bold text-deep-ink">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-hi-yellow text-deep-ink">
              <Sparkles size={18} />
            </span>
            <span>Aura-Dent</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 font-inter font-medium text-body text-deep-ink">
            <a href="#servicios" className="hover:text-dental-teal transition-colors">Servicios</a>
            <a href="#horarios" className="hover:text-dental-teal transition-colors">Horarios</a>
            <a href="#contacto" className="hover:text-dental-teal transition-colors">Contacto</a>
          </nav>

          <div className="flex items-center gap-3">
            {!usuario && (
              <Link to="/registro" className="hidden sm:inline-flex btn-secondary btn-sm">
                Crear cuenta
              </Link>
            )}
            <Link className="btn-primary btn-sm" to={destinoPanel}>
              {textoBoton}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero con blobs orgánicos Ditto */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <BlobDecorativo />
        <div className="relative z-10 max-w-page mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 animate-aparecer-arriba">
            <span className="badge badge-yellow mb-5">Clínica dental en Miraflores</span>
            <h1 className="font-hedvig text-heading-lg sm:text-display font-bold text-deep-ink text-balance mb-6">
              Tu sonrisa, cuidada por especialistas.
            </h1>
            <p className="font-inter text-subheading text-slate-text max-w-xl mb-8 leading-relaxed">
              Reserva tu cita en línea, gestiona tus tratamientos y consulta a nuestro asistente
              virtual. Tecnología y calidez para tu salud bucal.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link className="btn-primary" to={destinoPanel}>
                <Calendar size={18} />
                <span>{textoBoton}</span>
              </Link>
              {usuario ? (
                <a className="btn-secondary" href="#servicios">
                  Ver servicios
                </a>
              ) : (
                <Link className="btn-secondary" to="/registro">
                  Crear cuenta
                </Link>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 animate-aparecer-arriba delay-200">
            <div className="bg-white rounded-card p-8 border border-deep-ink/10">
              <span className="eyebrow block mb-2">Atención de hoy</span>
              <h2 className="font-hedvig text-heading font-bold text-deep-ink mb-1">{etiquetaDia}</h2>
              <p className="font-hedvig text-heading-sm text-dental-teal font-bold mb-6">
                {horarioDia}
              </p>

              <div className="space-y-3 pt-5 border-t border-soft-meadow font-inter text-body-sm text-slate-text">
                <div className="flex items-center gap-3">
                  <MapPin size={17} className="text-deep-ink shrink-0" />
                  <span>{direccion}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={17} className="text-deep-ink shrink-0" />
                  <span>{config.telefono || '(01) 555-0123'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-16 sm:py-20" id="servicios">
        <div className="max-w-page mx-auto px-6">
          <div className="mb-10 max-w-2xl">
            <span className="eyebrow block mb-2">Especialidades</span>
            <h2 className="font-hedvig text-heading sm:text-heading-lg font-bold text-deep-ink">
              Nuestros servicios
            </h2>
            <p className="font-inter text-subheading text-slate-text mt-2">
              Tratamientos con profesionales especializados y equipos modernos.
            </p>
          </div>
          <ServiciosCarousel />
        </div>
      </section>

      {/* Horarios y ubicación */}
      <section className="py-16 sm:py-20" id="horarios">
        <div className="max-w-page mx-auto px-6">
          <div className="mb-10 max-w-2xl">
            <span className="eyebrow block mb-2">Visítanos</span>
            <h2 className="font-hedvig text-heading sm:text-heading-lg font-bold text-deep-ink">
              Horarios y ubicación
            </h2>
            <p className="font-inter text-subheading text-slate-text mt-2">
              Te esperamos con cita previa para una mejor atención.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <article className="bg-soft-meadow rounded-card p-6 sm:p-8">
              <h3 className="font-hedvig text-heading-sm font-bold text-deep-ink mb-5">
                Horario de atención
              </h3>
              <ul className="flex flex-col gap-3">
                {HORARIOS.map((item) => {
                  const cerrado = item.hora === 'Cerrado';
                  return (
                    <li
                      key={item.dia}
                      className={`rounded-card-sm p-4 flex items-center justify-between gap-4 ${
                        cerrado ? 'bg-canvas/70 text-slate-text' : 'bg-canvas text-deep-ink'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-9 h-9 rounded-full flex items-center justify-center ${
                            cerrado ? 'bg-soft-meadow text-slate-text' : 'bg-hi-yellow text-deep-ink'
                          }`}
                        >
                          {cerrado ? <Moon size={16} /> : <Sun size={16} />}
                        </span>
                        <span className="font-inter font-medium text-body-sm">{item.dia}</span>
                      </div>
                      <strong className="font-inter font-semibold text-body-sm text-right">
                        {item.hora}
                      </strong>
                    </li>
                  );
                })}
              </ul>
            </article>

            <article className="bg-soft-meadow rounded-card p-6 sm:p-8 flex flex-col">
              <h3 className="font-hedvig text-heading-sm font-bold text-deep-ink mb-5">
                Ubicación
              </h3>
              <div className="flex-1 min-h-[260px] rounded-card-sm overflow-hidden bg-canvas">
                <iframe
                  className="w-full h-full min-h-[260px] border-0"
                  src={mapa}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  title="Ubicación de Aura-Dent"
                />
              </div>
            </article>
          </div>

          <article className="bg-soft-meadow rounded-card p-6 sm:p-8" id="contacto">
            <h3 className="font-hedvig text-heading-sm font-bold text-deep-ink mb-5">Contacto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <span className="eyebrow block mb-1">Dirección</span>
                <p className="font-inter text-body-sm font-medium text-deep-ink flex items-start gap-2">
                  <MapPin size={16} className="shrink-0 mt-0.5 text-dental-teal" />
                  <span>{direccion}</span>
                </p>
              </div>
              <div>
                <span className="eyebrow block mb-1">Teléfono</span>
                <p className="font-inter text-body-sm font-medium text-deep-ink flex items-center gap-2">
                  <Phone size={16} className="shrink-0 text-dental-teal" />
                  <span>{config.telefono || '(01) 555-0123'}</span>
                </p>
              </div>
              <div>
                <span className="eyebrow block mb-1">WhatsApp</span>
                <p className="font-inter text-body-sm font-medium text-deep-ink">+51 987 654 321</p>
              </div>
              <div>
                <span className="eyebrow block mb-1">Correo</span>
                <p className="font-inter text-body-sm font-medium text-deep-ink flex items-center gap-2">
                  <Mail size={16} className="shrink-0 text-dental-teal" />
                  <span>{config.email_contacto || 'contacto@auradent.com'}</span>
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <footer className="border-t border-deep-ink/10 bg-soft-meadow/60 py-8">
        <div className="max-w-page mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 font-inter text-body-sm text-slate-text">
          <span>Aura-Dent · Sistema de gestión de citas odontológicas</span>
          <span>© 2026</span>
        </div>
      </footer>

      <ChatIaWidget />
    </div>
  );
}
