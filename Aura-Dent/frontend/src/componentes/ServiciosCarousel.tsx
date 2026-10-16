import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOGO_SERVICIOS } from '../catalogo_servicios';

const GAP = 24;
const AUTO_MS = 3000;
const COPIAS = 3;
const PASTELES = ['mint', 'sage', 'sky', 'cream', 'lilac', 'peach'] as const;

export function ServiciosCarousel() {
  const [anchoVista, setAnchoVista] = useState<number>(
    () => (typeof window !== 'undefined' ? window.innerWidth : 900)
  );
  const [posicion, setPosicion] = useState<number>(0);
  const [arrastrando, setArrastrando] = useState(false);
  const [offsetArrastre, setOffsetArrastre] = useState(0);
  const sinTransicionRef = useRef(false);
  const inicioXRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const n = CATALOGO_SERVICIOS.length;
  const totalSlides = n * COPIAS;
  const inicio = n;

  useEffect(() => {
    const onResize = () => setAnchoVista(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const porVista = anchoVista <= 640 ? 1 : 3;
  const paso = anchoVista > 0 ? (anchoVista + GAP) / porVista : 0;

  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const desplazamiento = -posicion * paso + offsetArrastre;

  const detener = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (sinTransicionRef.current) sinTransicionRef.current = false;
  }, []);

  const reanudar = useCallback(() => {
    if (reducedMotion) return;
    detener();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setPosicion((p) => p + 1), AUTO_MS);
  }, [detener, reducedMotion]);

  useEffect(() => {
    reanudar();
    return () => detener();
  }, [reanudar, detener]);

  // Reposicionamiento sin animación al cruzar los límites (rotación infinita real).
  useEffect(() => {
    const p = posicion;
    if (p >= inicio * 2) {
      sinTransicionRef.current = true;
      setPosicion(p - n);
    } else if (p < inicio) {
      sinTransicionRef.current = true;
      setPosicion(p + n);
    }
  }, [posicion, inicio, n]);

  // Desactiva la bandera de transición tras el render instantáneo.
  useEffect(() => {
    if (sinTransicionRef.current && typeof window !== 'undefined') {
      const id = window.requestAnimationFrame(() => {
        sinTransicionRef.current = false;
      });
      return () => window.cancelAnimationFrame(id);
    }
  }, [posicion]);

  const indiceReal = ((posicion - inicio) % n + n) % n;

  const siguiente = useCallback(() => {
    detener();
    setPosicion((p) => p + 1);
    setOffsetArrastre(0);
    setArrastrando(false);
    reanudar();
  }, [detener, reanudar]);

  const anterior = useCallback(() => {
    detener();
    setPosicion((p) => p - 1);
    setOffsetArrastre(0);
    setArrastrando(false);
    reanudar();
  }, [detener, reanudar]);

  const irA = useCallback(
    (pagina: number) => {
      if (pagina < 0 || pagina >= n) return;
      detener();
      setPosicion(inicio + pagina);
      setOffsetArrastre(0);
      setArrastrando(false);
      reanudar();
    },
    [inicio, n, detener, reanudar]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      detener();
      setArrastrando(true);
      setOffsetArrastre(0);
      inicioXRef.current = e.clientX;
    },
    [detener]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!arrastrando) return;
      setOffsetArrastre(e.clientX - inicioXRef.current);
    },
    [arrastrando]
  );

  const onPointerUp = useCallback(() => {
    if (!arrastrando) return;
    setArrastrando(false);
    const umbral = paso * 0.25;
    if (offsetArrastre > umbral) {
      anterior();
    } else if (offsetArrastre < -umbral) {
      siguiente();
    } else {
      setOffsetArrastre(0);
    }
    reanudar();
  }, [arrastrando, offsetArrastre, paso, anterior, siguiente, reanudar]);

  const onPointerLeave = useCallback(() => {
    if (!arrastrando) return;
    setArrastrando(false);
    setOffsetArrastre(0);
    reanudar();
  }, [arrastrando, reanudar]);

  const slides = useMemo(
    () =>
      Array.from({ length: totalSlides }, (_, i) => ({
        indice: i,
        servicio: CATALOGO_SERVICIOS[i % n],
      })),
    [n, totalSlides]
  );

  return (
    <section
      className="carrusel-servicios"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Nuestros servicios"
    >
      <div
        className="carrusel-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onMouseEnter={detener}
        onMouseLeave={reanudar}
        onFocus={() => detener()}
        onBlur={() => reanudar()}
      >
        <div
          className="carrusel-track"
          style={{
            '--pv': porVista,
            '--carrusel-gap': `${GAP}px`,
            transition: sinTransicionRef.current ? 'none' : 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
            transform: `translateX(${desplazamiento}px)`,
          } as unknown as React.CSSProperties}
          onTransitionEnd={() => {
            const p = posicion;
            if (p >= inicio * 2) {
              sinTransicionRef.current = true;
              setPosicion(p - n);
            } else if (p < inicio) {
              sinTransicionRef.current = true;
              setPosicion(p + n);
            }
          }}
        >
          {slides.map((item) => (
            <article
              key={`slide-${item.indice}-${item.servicio.nombre}`}
              className={`carrusel-slide servicio-card pastel-${PASTELES[item.indice % PASTELES.length]}`}
            >
              <div className="servicio-imagen">
                <img
                  src={item.servicio.imagen}
                  alt={`${item.servicio.nombre} en Aura-Dent`}
                  loading="lazy"
                  onError={(evento) => {
                    evento.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="servicio-cuerpo">
                <span className="pill-tag">{item.servicio.categoria}</span>
                <h3>{item.servicio.nombre}</h3>
                <p>{item.servicio.detalle}</p>
                <span className="servicio-meta">Duración estimada · {item.servicio.duracion}</span>
              </div>
            </article>
          ))}
        </div>

        <button
          className="carrusel-control carrusel-control--prev"
          aria-label="Servicio anterior"
          onClick={() => {
            detener();
            anterior();
            reanudar();
          }}
        >
          &#9664;
        </button>
        <button
          className="carrusel-control carrusel-control--next"
          aria-label="Siguiente servicio"
          onClick={() => {
            detener();
            siguiente();
            reanudar();
          }}
        >
          &#9654;
        </button>
      </div>

      <div className="carrusel-puntos" role="tablist" aria-label="Páginas de servicios">
        {CATALOGO_SERVICIOS.map((_, p) => (
          <button
            key={p}
            className={`punto${p === indiceReal ? ' activo' : ''}`}
            role="tab"
            aria-selected={p === indiceReal}
            aria-label={`Ir al servicio ${p + 1} de ${n}`}
            onClick={() => irA(p)}
          />
        ))}
      </div>
    </section>
  );
}
