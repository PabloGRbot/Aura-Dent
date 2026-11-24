import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { crearCita } from '../../api/citas';
import { duracionServicio, hoyLima, obtenerDisponibilidad } from '../../api/gestion_citas';
import { listarOdontologos, Odontologo } from '../../api/odontologos';
import { ADELANTO_RESERVA, CATALOGO_SERVICIOS, formatearSoles } from '../../catalogo_servicios';
import { CampoFecha } from '../../componentes/CampoFecha';
import { PoliticaCitas } from '../../componentes/PoliticaCitas';
import { Selector } from '../../componentes/Selector';

const PASOS = ['Servicio', 'Odontólogo', 'Fecha', 'Hora'];

export function RegistrarCita() {
  const navegar = useNavigate();
  const [paso, setPaso] = useState(1);
  const [dia, setDia] = useState('');
  const [hora, setHora] = useState('');
  const [servicio, setServicio] = useState(CATALOGO_SERVICIOS[0].nombre);
  const [slots, setSlots] = useState<{ hora: string; ocupado: boolean }[]>([]);
  const [consultando, setConsultando] = useState(false);
  const [politicaAceptada, setPoliticaAceptada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [odontologoId, setOdontologoId] = useState<string | null>(null);

  useEffect(() => {
    listarOdontologos()
      .then(setOdontologos)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setHora('');
    setSlots([]);
    if (!dia || !odontologoId) return;
    let activo = true;
    setConsultando(true);
    obtenerDisponibilidad(odontologoId, dia, duracionServicio(servicio))
      .then((d) => {
        if (activo) {
          setSlots(d.intervalos.map((i) => ({ hora: i.horaInicio, ocupado: !i.disponible })));
        }
      })
      .catch((e) => {
        if (activo) setError(e.message);
      })
      .finally(() => {
        if (activo) setConsultando(false);
      });
    return () => {
      activo = false;
    };
  }, [dia, odontologoId, servicio]);

  async function confirmarReserva(): Promise<void> {
    setError(null);
    if (!politicaAceptada) {
      setError('Acepta la política vigente antes de reservar.');
      return;
    }
    if (!odontologoId) {
      setError('Selecciona un odontólogo.');
      return;
    }
    if (!dia || !hora) {
      setError('Selecciona la fecha y la hora de tu cita.');
      return;
    }
    setCreando(true);
    try {
      const cita = await crearCita(
        new Date(`${dia}T${hora}:00-05:00`).toISOString(),
        servicio,
        duracionServicio(servicio),
        odontologoId
      );
      navegar('/paciente/mis-citas', { state: { pagarCitaId: cita.id } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreando(false);
    }
  }

  return (
    <section className="max-w-3xl mx-auto animate-aparecer-arriba">
      <header className="mb-8">
        <span className="badge badge-yellow mb-3">Nueva reserva</span>
        <h1 className="font-hedvig text-heading font-bold text-deep-ink">Reserva tu cita</h1>
      </header>

      {/* Indicador de pasos Ditto */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {PASOS.map((etiqueta, idx) => {
          const numero = idx + 1;
          const activo = paso >= numero;
          const actual = paso === numero;
          return (
            <button
              key={etiqueta}
              type="button"
              onClick={() => numero < paso && setPaso(numero)}
              disabled={numero > paso}
              className={`flex items-center gap-2 rounded-pill px-3 py-2.5 font-inter text-body-sm font-medium transition-all ${
                actual
                  ? 'bg-hi-yellow text-deep-ink'
                  : activo
                  ? 'bg-deep-ink text-white cursor-pointer'
                  : 'bg-soft-meadow text-slate-text cursor-not-allowed'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-caption font-bold shrink-0 ${
                  actual
                    ? 'bg-deep-ink text-hi-yellow'
                    : activo
                    ? 'bg-hi-yellow text-deep-ink'
                    : 'bg-canvas text-slate-text'
                }`}
              >
                {paso > numero ? <Check size={13} /> : numero}
              </span>
              <span className="truncate hidden sm:inline">{etiqueta}</span>
            </button>
          );
        })}
      </div>

      {/* Contenedor del paso */}
      <div className="bg-soft-meadow rounded-card p-6 sm:p-8 mb-6">
        {paso === 1 && (
          <div className="animate-fade-in">
            <h2 className="font-hedvig text-heading-sm font-bold text-deep-ink mb-5">
              1. Selecciona el servicio
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATALOGO_SERVICIOS.map((item) => {
                const seleccionado = servicio === item.nombre;
                return (
                  <button
                    key={item.nombre}
                    type="button"
                    onClick={() => {
                      setServicio(item.nombre);
                      setPaso(2);
                    }}
                    className={`text-left rounded-card-sm p-4 transition-all border-2 flex flex-col justify-between gap-3 ${
                      seleccionado
                        ? 'bg-hi-yellow/35 border-deep-ink'
                        : 'bg-canvas border-transparent hover:border-deep-ink/30'
                    }`}
                  >
                    <div>
                      <span className="eyebrow block mb-1">{item.categoria}</span>
                      <p className="font-hedvig text-subheading font-bold text-deep-ink">
                        {item.nombre}
                      </p>
                    </div>
                    <div className="flex items-center justify-between font-inter text-body-sm">
                      <span className="font-semibold text-deep-ink">
                        {formatearSoles(item.precio)}
                      </span>
                      <span className="text-slate-text flex items-center gap-1 text-caption">
                        <Clock size={12} /> {item.duracion}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="animate-fade-in">
            <h2 className="font-hedvig text-heading-sm font-bold text-deep-ink mb-5">
              2. Selecciona el odontólogo
            </h2>
            <label className="input-label">
              Odontólogo especialista
              <div className="mt-2">
                <Selector
                  buscable
                  onBuscar={(q) => {
                    listarOdontologos(q)
                      .then(setOdontologos)
                      .catch((e) => setError(e.message));
                  }}
                  value={odontologoId ?? ''}
                  onChange={(e) => {
                    setOdontologoId(e.target.value || null);
                    if (e.target.value) setPaso(3);
                  }}
                  required
                >
                  <option value="">Seleccionar odontólogo</option>
                  {odontologos.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombres} {o.apellidos}
                    </option>
                  ))}
                </Selector>
              </div>
            </label>
            <div className="mt-8 flex items-center justify-between gap-3">
              <button type="button" className="btn-secondary" onClick={() => setPaso(1)}>
                <ArrowLeft size={16} />
                <span>Volver</span>
              </button>
              {odontologoId && (
                <button type="button" className="btn-primary" onClick={() => setPaso(3)}>
                  <span>Siguiente</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className="animate-fade-in">
            <h2 className="font-hedvig text-heading-sm font-bold text-deep-ink mb-5">
              3. Elige la fecha
            </h2>
            <div className="flex justify-center my-4">
              <CampoFecha
                value={dia}
                min={hoyLima()}
                onChange={(fecha) => {
                  setDia(fecha);
                  if (fecha) setPaso(4);
                }}
              />
            </div>
            <div className="mt-8 flex items-center justify-between gap-3">
              <button type="button" className="btn-secondary" onClick={() => setPaso(2)}>
                <ArrowLeft size={16} />
                <span>Volver</span>
              </button>
              {dia && (
                <button type="button" className="btn-primary" onClick={() => setPaso(4)}>
                  <span>Siguiente</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {paso === 4 && (
          <div className="animate-fade-in">
            <h2 className="font-hedvig text-heading-sm font-bold text-deep-ink mb-5">
              4. Elige la hora
            </h2>
            {consultando && (
              <p className="font-inter text-body-sm text-slate-text animate-pulse" role="status">
                Consultando horarios disponibles…
              </p>
            )}
            {!consultando && slots.length === 0 && (
              <p
                className="bg-canvas rounded-card-sm p-4 font-inter text-body-sm text-slate-text"
                role="status"
              >
                No hay horarios para este día. Vuelve y elige otra fecha.
              </p>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
              {slots.map((slot) => {
                const seleccionado = hora === slot.hora;
                return (
                  <button
                    key={slot.hora}
                    type="button"
                    disabled={slot.ocupado}
                    aria-pressed={seleccionado}
                    aria-label={`${slot.hora}${slot.ocupado ? ', no disponible' : ''}`}
                    onClick={() => setHora(slot.hora)}
                    className={`rounded-pill py-2.5 px-3 font-inter text-body-sm font-medium transition-all border ${
                      slot.ocupado
                        ? 'bg-soft-meadow text-slate-text/50 border-transparent line-through cursor-not-allowed'
                        : seleccionado
                        ? 'bg-hi-yellow text-deep-ink border-deep-ink font-semibold'
                        : 'bg-canvas text-deep-ink border-deep-ink/20 hover:border-deep-ink'
                    }`}
                  >
                    {slot.hora}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <button type="button" className="btn-secondary" onClick={() => setPaso(3)}>
                <ArrowLeft size={16} />
                <span>Volver</span>
              </button>
              <button
                type="button"
                className="btn-primary disabled:opacity-50"
                disabled={!hora || creando || !politicaAceptada || consultando}
                onClick={confirmarReserva}
              >
                <Sparkles size={16} />
                <span>{creando ? 'Registrando...' : 'Confirmar reserva'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-canvas border border-deep-ink/10 rounded-card p-5 space-y-4">
        <p className="font-inter text-body-sm text-slate-text">
          Para garantizar la cita se abona un adelanto de{' '}
          <strong className="text-deep-ink">{formatearSoles(ADELANTO_RESERVA)}</strong> mediante
          QR/CIP (pago simulado).
        </p>
        <PoliticaCitas requerirAceptacion onAceptada={() => setPoliticaAceptada(true)} />
      </div>

      {error && (
        <p className="mt-4 bg-red-100 text-red-700 font-inter text-body-sm rounded-card-sm px-4 py-3">
          {error}
        </p>
      )}
    </section>
  );
}
