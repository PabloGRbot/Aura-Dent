import { Link } from 'react-router-dom';
import { CATALOGO_SERVICIOS } from '../catalogo_servicios';
import { ChatIaWidget } from '../componentes/ChatIaWidget';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { RUTA_INICIO_POR_ROL } from '../navegacion';

const HORARIOS = [
  { dia: 'Lunes a viernes', hora: '8:00 - 20:00' },
  { dia: 'Sábados', hora: '8:00 - 14:00' },
  { dia: 'Domingos y feriados', hora: 'Cerrado' }
];

const PASTELES = ['mint', 'sage', 'sky', 'cream', 'lilac', 'peach'];

export function InicioPublico() {
  const { usuario } = useAutenticacion();
  const destinoPanel = usuario ? RUTA_INICIO_POR_ROL[usuario.rol] : '/login';
  const textoBoton = usuario ? 'Ir a mi panel' : 'Iniciar sesión';

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
          <p>Lunes a viernes</p>
          <strong>8:00 - 20:00</strong>
          <p>Av. Los Álamos 123, Miraflores</p>
          <p>(01) 555-0123</p>
        </div>
      </section>

      <section className="seccion" id="servicios">
        <div className="seccion-encabezado">
          <h2>Nuestros servicios</h2>
          <p>Tratamientos con profesionales especializados y equipos modernos.</p>
        </div>
        <div className="grid-servicios">
          {CATALOGO_SERVICIOS.map((servicio, indice) => (
            <article
              key={servicio.nombre}
              className={`servicio-card pastel-${PASTELES[indice % PASTELES.length]}`}
              style={{ animationDelay: `${indice * 0.06}s` }}
            >
              <div className="servicio-imagen">
                <img
                  src={servicio.imagen}
                  alt={`${servicio.nombre} en Aura-Dent`}
                  loading="lazy"
                  onError={(evento) => {
                    evento.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="servicio-cuerpo">
                <span className="pill-tag">{servicio.categoria}</span>
                <h3>{servicio.nombre}</h3>
                <p>{servicio.detalle}</p>
                <span className="servicio-meta">Duración estimada · {servicio.duracion}</span>
              </div>
            </article>
          ))}
        </div>
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
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3900.857953121273!2d-77.03035868465102!3d-12.123570791414038!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c818cd4c5f2b%3A0x82c27f1a16cfa4ab!2sMiraflores%2C%20Lima%2C%20Per%C3%BA!5e0!3m2!1ses!2spe!4v1700000000000!5m2!1ses!2spe"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                title="Ubicación de Aura-Dent en Miraflores, Lima"
              />
            </div>
          </article>
        </div>

        <article className="info-card info-card--contacto" id="contacto">
          <h3>Contacto</h3>
          <div className="contacto-grid">
            <p>
              <span className="contacto-etiqueta">Dirección</span>
              Av. Los Álamos 123, Miraflores, Lima
            </p>
            <p>
              <span className="contacto-etiqueta">Teléfono</span>
              (01) 555-0123
            </p>
            <p>
              <span className="contacto-etiqueta">WhatsApp</span>
              +51 987 654 321
            </p>
            <p>
              <span className="contacto-etiqueta">Correo</span>
              contacto@auradent.com
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
