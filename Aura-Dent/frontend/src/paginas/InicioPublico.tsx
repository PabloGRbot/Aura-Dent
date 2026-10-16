import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerConfiguracion } from '../api/configuracion';
import { ChatIaWidget } from '../componentes/ChatIaWidget';
import { ServiciosCarousel } from '../componentes/ServiciosCarousel';
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
  const diaSemana = ahora.getDay(); // 0 = Domingo, 6 = Sábado
  const esSabado = diaSemana === 6;
  const esDomingo = diaSemana === 0;
  const etiquetaDia = esDomingo ? 'Domingo' : esSabado ? 'Sábado' : 'Lunes a viernes';
  const horarioDia = esDomingo
    ? 'Cerrado'
    : esSabado
    ? '8:00 - 12:00'
    : '8:00 - 12:00 y 14:00 - 20:00';

  return (
    <div className="landing">
      <header className="landing-header">
        <span className="marca">Aura-Dent</span>
        <nav className="landing-nav">
          <a href="#servicios">Servicios</a>
          <a href="#horarios">Horarios</a>
          <a href="#contacto">Contacto</a>
          <Link className="boton-primario" to={destinoPanel}>
            {textoBoton}
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-texto">
          <span className="badge">Clínica dental en Miraflores</span>
          <h1>
            Tu sonrisa, cuidada por <span className="acento">especialistas</span>
          </h1>
          <p>
            Reserva tu cita en línea, gestiona tus tratamientos y consulta a nuestro asistente
            virtual. Tecnología y calidez para tu salud bucal.
          </p>
          <div className="hero-acciones">
            <Link className="boton-primario" to={destinoPanel}>
              {textoBoton}
            </Link>
            {usuario ? (
              <a className="boton-secundario" href="#servicios">
                Ver servicios
              </a>
            ) : (
              <Link className="boton-secundario" to="/registro">
                Crear cuenta
              </Link>
            )}
          </div>
        </div>
        <div className="hero-tarjeta">
          <h3>Atención de hoy</h3>
          <p>{etiquetaDia}</p>
          <strong>{horarioDia}</strong>
          <p>Av. Los Álamos 123, Miraflores</p>
          <p>(01) 555-0123</p>
        </div>
      </section>

      <section className="seccion" id="servicios">
        <div className="seccion-encabezado">
          <h2>Nuestros servicios</h2>
          <p>Tratamientos con profesionales especializados y equipos modernos.</p>
        </div>
        <ServiciosCarousel />
      </section>

      <section className="seccion" id="horarios">
        <div className="seccion-encabezado">
          <h2>Horarios y ubicación</h2>
          <p>Te esperamos con cita previa para una mejor atención.</p>
        </div>
        <div className="info-grid">
          <article className="info-card">
            <h3>Horario de atención</h3>
            <ul className="lista-horarios">
              {HORARIOS.map((item, indice) => {
                const cerrado = item.hora === 'Cerrado';
                return (
                  <li
                    key={item.dia}
                    className={`horario-card ${cerrado ? 'horario-card--cerrado' : 'horario-card--sol'}`}
                    style={{ animationDelay: `${indice * 0.08}s` }}
                  >
                    {cerrado ? (
                      <svg
                        className="horario-icono"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9Z" />
                        <path d="M12 12v6a2 2 0 0 0 4 0" />
                      </svg>
                    ) : (
                      <svg
                        className="horario-icono"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="4.5" />
                        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
                      </svg>
                    )}
                    <span className="horario-dia">{item.dia}</span>
                    <strong className="horario-hora">{item.hora}</strong>
                  </li>
                );
              })}
            </ul>
          </article>

          <article className="info-card info-card--mapa">
            <h3>Ubicación</h3>
            <div className="mapa-contenedor-pequeno">
              <iframe
                className="mapa-iframe"
                src={mapa}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                title="Ubicación de Aura-Dent"
              />
            </div>
          </article>
        </div>

        <article className="info-card info-card--contacto" id="contacto">
          <h3>Contacto</h3>
          <div className="contacto-grid">
            <p>
              <span className="contacto-etiqueta">Dirección</span>
              {direccion}
            </p>
            <p>
              <span className="contacto-etiqueta">Teléfono</span>
              {config.telefono || '(01) 555-0123'}
            </p>
            <p>
              <span className="contacto-etiqueta">WhatsApp</span>
              +51 987 654 321
            </p>
            <p>
              <span className="contacto-etiqueta">Correo</span>
              {config.email_contacto || 'contacto@auradent.com'}
            </p>
          </div>
        </article>
      </section>

      <footer className="pie">
        <span>Aura-Dent · Sistema de gestión de citas odontológicas</span>
        <span>© 2026</span>
      </footer>

      <ChatIaWidget />
    </div>
  );
}
