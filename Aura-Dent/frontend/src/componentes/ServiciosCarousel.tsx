import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { CATALOGO_SERVICIOS, formatearSoles } from '../catalogo_servicios';
import { IlustracionServicio } from './ui/IlustracionServicio';

const AUTO_MS = 4500;

export function ServiciosCarousel() {
  const [indice, setIndice] = useState(0);
  const [anchoVista, setAnchoVista] = useState<number>(
    () => (typeof window !== 'undefined' ? window.innerWidth : 1024)
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const n = CATALOGO_SERVICIOS.length;

  useEffect(() => {
    const onResize = () => setAnchoVista(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const porVista = anchoVista < 640 ? 1 : anchoVista < 1024 ? 2 : 3;
  const maxIndice = Math.max(0, n - porVista);

  const detener = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reanudar = useCallback(() => {
    detener();
    intervalRef.current = setInterval(() => {
      setIndice((prev) => (prev >= maxIndice ? 0 : prev + 1));
    }, AUTO_MS);
  }, [detener, maxIndice]);

  useEffect(() => {
    reanudar();
    return () => detener();
  }, [reanudar, detener]);

  const siguiente = () => {
    detener();
    setIndice((prev) => (prev >= maxIndice ? 0 : prev + 1));
    reanudar();
  };

  const anterior = () => {
    detener();
    setIndice((prev) => (prev <= 0 ? maxIndice : prev - 1));
    reanudar();
  };

  const visibles = useMemo(() => {
    const fin = Math.min(n, indice + porVista);
    return CATALOGO_SERVICIOS.slice(indice, fin);
  }, [indice, porVista, n]);

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Nuestros servicios"
      onMouseEnter={detener}
      onMouseLeave={reanudar}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibles.map((servicio) => (
          <article
            key={servicio.nombre}
            className="bg-soft-meadow rounded-card p-6 flex flex-col justify-between card-hover"
          >
            <div>
              <div className="w-full h-36 rounded-card-sm bg-canvas mb-5 p-3 flex items-center justify-center overflow-hidden">
                <IlustracionServicio categoria={servicio.categoria} nombre={servicio.nombre} />
              </div>

              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="badge badge-yellow">{servicio.categoria}</span>
                <span className="font-inter font-semibold text-body-sm text-deep-ink">
                  {formatearSoles(servicio.precio)}
                </span>
              </div>

              <h3 className="font-hedvig text-heading-sm font-bold text-deep-ink mb-2">
                {servicio.nombre}
              </h3>
              <p className="font-inter text-body-sm text-slate-text leading-relaxed">
                {servicio.detalle}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-deep-ink/10 flex items-center gap-2 font-inter text-caption text-slate-text uppercase tracking-wider">
              <Clock size={14} />
              <span>Duración estimada · {servicio.duracion}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Controles y paginación */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2" role="tablist" aria-label="Páginas de servicios">
          {Array.from({ length: maxIndice + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === indice}
              aria-label={`Página ${i + 1}`}
              onClick={() => {
                detener();
                setIndice(i);
                reanudar();
              }}
              className={`h-2.5 rounded-pill transition-all duration-300 ${
                i === indice ? 'w-8 bg-hi-yellow' : 'w-3 bg-slate-text/30 hover:bg-slate-text/60'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={anterior}
            aria-label="Servicio anterior"
            className="w-10 h-10 rounded-full bg-soft-meadow text-deep-ink flex items-center justify-center hover:bg-hi-yellow transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={siguiente}
            aria-label="Siguiente servicio"
            className="w-10 h-10 rounded-full bg-deep-ink text-white flex items-center justify-center hover:brightness-125 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
