import { useEffect, useState } from 'react';
import { Selector } from '../../componentes/Selector';
import { useNavigate } from 'react-router-dom';
import { crearCita } from '../../api/citas';
import { obtenerDisponibilidad, duracionServicio, hoyLima } from '../../api/gestion_citas';
import { PoliticaCitas } from '../../componentes/PoliticaCitas';
import { listarOdontologos, Odontologo } from '../../api/odontologos';
import { ADELANTO_RESERVA, CATALOGO_SERVICIOS, formatearSoles } from '../../catalogo_servicios';
import { CampoFecha } from '../../componentes/CampoFecha';

export function RegistrarCita() {
  const navegar = useNavigate();
  const [paso, setPaso] = useState(1);
  const [dia, setDia] = useState('');
  const [hora, setHora] = useState('');
  const [servicio, setServicio] = useState(CATALOGO_SERVICIOS[0].nombre);
  const [slots,setSlots]=useState<{hora:string;ocupado:boolean}[]>([]);
  const [consultando,setConsultando]=useState(false);
  const [politicaAceptada,setPoliticaAceptada]=useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [odontologos, setOdontologos] = useState<Odontologo[]>([]);
  const [odontologoId, setOdontologoId] = useState<string | null>(null);

  useEffect(() => {
    listarOdontologos()
      .then(setOdontologos)
      .catch(() => undefined);
  }, []);
  useEffect(()=>{
    setHora('');setSlots([]);if(!dia||!odontologoId)return;
    let activo=true;setConsultando(true);
    obtenerDisponibilidad(odontologoId,dia,duracionServicio(servicio)).then(d=>{if(activo)setSlots(d.intervalos.map(i=>({hora:i.horaInicio,ocupado:!i.disponible})));})
      .catch(e=>{if(activo)setError(e.message);}).finally(()=>{if(activo)setConsultando(false);});
    return()=>{activo=false;};
  },[dia,odontologoId,servicio]);

  async function confirmarReserva(): Promise<void> {
    setError(null);
    if(!politicaAceptada){setError('Acepta la política vigente antes de reservar.');return;}
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

  const generarSlots = () => slots;

  return (
    <div className="reserva">
      <style>{`
        .reserva-pasos {
          display: flex;
          justify-content: space-between;
          margin-bottom: 32px;
          position: relative;
        }
        .reserva-pasos::before {
          content: '';
          position: absolute;
          top: 15px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--gris-claro);
          z-index: 1;
        }
        .paso {
          position: relative;
          z-index: 2;
          background: #fff;
          border: 2px solid var(--gris-claro);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          color: var(--gris);
          transition: all 0.3s ease;
        }
        .paso.activo {
          border-color: var(--verde);
          background: var(--verde);
          color: #fff;
          box-shadow: 0 0 0 4px rgba(10, 57, 34, 0.1);
        }
        .reserva-contenedor-pasos {
          position: relative;
          min-height: 300px;
          margin-bottom: 32px;
        }
        .paso-animado {
          animation: slideIn 0.4s ease-out both;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .grid-servicios {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }
        .tarjeta-servicio {
          padding: 16px;
          border: 1px solid var(--borde);
          border-radius: var(--radio-suave);
          cursor: pointer;
          transition: all 0.2s ease;
          background: #fff;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .tarjeta-servicio:hover {
          border-color: var(--verde);
          background: var(--sage);
        }
        .tarjeta-servicio.seleccionado {
          border-color: var(--verde);
          background: var(--mint);
          box-shadow: 0 0 0 2px var(--verde);
        }
        .servicio-nombre {
          font-weight: 600;
          color: var(--verde);
        }
        .servicio-precio {
          font-size: 13px;
          color: var(--gris);
        }
        .calendario-contenedor {
          display: flex;
          justify-content: center;
          margin: 24px 0;
        }
        .input-fecha-moderno {
          padding: 12px;
          font-size: 16px;
          border: 2px solid var(--borde);
          border-radius: var(--radio-boton);
          cursor: pointer;
          transition: border-color 0.3s ease;
        }
        .input-fecha-moderno:focus {
          border-color: var(--verde);
        }
        .grid-horarios-adaptado {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
          margin-top: 16px;
        }
        .slot-hora-adaptado {
          padding: 10px;
          border-radius: 8px;
          border: 1px solid var(--borde);
          background: #fff;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          text-align: center;
          color: #000000;
        }
        .slot-hora-adaptado:hover:not(.ocupado) {
          border-color: var(--verde);
          background: var(--sage);
        }
        .slot-hora-adaptado.seleccionado {
          background: var(--verde);
          color: #fff;
          border-color: var(--verde);
        }
        .slot-hora-adaptado.ocupado {
          background: var(--gris-claro);
          color: var(--gris);
          cursor: not-allowed;
          opacity: 0.6;
          text-decoration: line-through;
        }
        .campo-odontologo {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .campo-odontologo label {
          font-weight: 600;
          color: var(--grafito);
          font-size: 14px;
        }
        .campo-odontologo select {
          padding: 10px 12px;
          border: 1px solid var(--borde);
          border-radius: var(--radio-boton);
          font-size: 14px;
          background: #fff;
          cursor: pointer;
        }
        .acciones-paso {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
          gap: 12px;
        }
        .paso-titulo {
          text-align: center;
          margin-bottom: 20px;
          color: var(--verde);
        }
      `}</style>

      <div className="reserva-pasos">
        <div className={`paso ${paso >= 1 ? 'activo' : ''}`}>1</div>
        <div className={`paso ${paso >= 2 ? 'activo' : ''}`}>2</div>
        <div className={`paso ${paso >= 3 ? 'activo' : ''}`}>3</div>
        <div className={`paso ${paso >= 4 ? 'activo' : ''}`}>4</div>
      </div>

      <div className="reserva-contenedor-pasos">
        {paso === 1 && (
          <div className="paso-animado fade-in">
            <h3 className="paso-titulo">Selecciona el servicio</h3>
            <div className="grid-servicios">
              {CATALOGO_SERVICIOS.map((item) => (
                <div
                  key={item.nombre}
                  className={`tarjeta-servicio ${servicio === item.nombre ? 'seleccionado' : ''}`}
                  onClick={() => {
                    setServicio(item.nombre);
                    setPaso(2);
                  }}
                >
                  <span className="servicio-nombre">{item.nombre}</span>
                  <span className="servicio-precio">{formatearSoles(item.precio)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="paso-animado fade-in">
            <h3 className="paso-titulo">Selecciona el odontólogo</h3>
            <label className="campo-odontologo">
              Odontólogo
              <Selector buscable onBuscar={q=>{listarOdontologos(q).then(setOdontologos).catch(e=>setError(e.message));}}
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
            </label>
            <div className="acciones-paso">
              <button type="button" className="boton-secundario" onClick={() => setPaso(1)}>
                Volver
              </button>
              {odontologoId && (
                <button type="button" className="boton-confirmar" onClick={() => setPaso(3)}>
                  Siguiente
                </button>
              )}
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className="paso-animado fade-in">
            <h3 className="paso-titulo">Elige la fecha</h3>
            <div className="calendario-contenedor">
              <CampoFecha
                value={dia}
                min={hoyLima()}
                onChange={(fecha) => {
                  setDia(fecha);
                  if (fecha) setPaso(4);
                }}
              />
            </div>
            <div className="acciones-paso">
              <button type="button" className="boton-secundario" onClick={() => setPaso(2)}>
                Volver
              </button>
              {dia && (
                <button type="button" className="boton-confirmar" onClick={() => setPaso(4)}>
                  Siguiente
                </button>
              )}
            </div>
          </div>
        )}

        {paso === 4 && (
          <div className="paso-animado fade-in">
            <h3 className="paso-titulo">Elige la hora</h3>
            {consultando&&<p role="status">Consultando horarios…</p>}
            {!consultando&&generarSlots().length === 0 && (
              <p className="aviso-sin-horarios" role="status">No hay horarios para este día. Vuelve y elige otra fecha.</p>
            )}
            <div className="grid-horarios-adaptado">
              {generarSlots().map((slot) => (
                <button
                  key={slot.hora}
                  type="button"
                  className={`slot-hora-adaptado ${slot.ocupado ? 'ocupado' : ''} ${hora === slot.hora ? 'seleccionado' : ''}`}
                  disabled={slot.ocupado}
                  aria-pressed={hora === slot.hora}
                  aria-label={`${slot.hora}${slot.ocupado ? ', no disponible' : ''}`}
                  onClick={() => setHora(slot.hora)}
                >
                  {slot.hora}
                </button>
              ))}
            </div>
            <div className="acciones-paso">
              <button type="button" className="boton-secundario" onClick={() => setPaso(3)}>
                Volver
              </button>
              <button
                type="button"
                className="boton-confirmar"
                disabled={!hora || creando || !politicaAceptada || consultando}
                onClick={confirmarReserva}
              >
                {creando ? 'Registrando...' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="nota-pago">
        Para garantizar la cita se abona un adelanto de {formatearSoles(ADELANTO_RESERVA)} mediante
        QR/CIP (pago simulado).
      </p>
      <PoliticaCitas requerirAceptacion onAceptada={()=>setPoliticaAceptada(true)}/>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
