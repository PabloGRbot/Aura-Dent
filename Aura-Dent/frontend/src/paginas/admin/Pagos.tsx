import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  confirmarPagoRecepcion,
  listarPagosRecepcion,
  rechazarPagoRecepcion
} from '../../api/recepcion';
import { CATALOGO_SERVICIOS, formatearSoles } from '../../catalogo_servicios';
import { ETIQUETA_PAGO, formatearFechaCorta } from '../../formato';
import { PagoDetalle } from '../../tipos';

type Periodo = 'semana' | 'mes' | 'anio';

interface Punto {
  etiqueta: string;
  valor: number;
}

const MESES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic'
];

const ETIQUETA_PERIODO: Record<Periodo, string> = {
  semana: 'Semana',
  mes: 'Mes',
  anio: 'Año'
};

function valorServicio(servicio: string | null): number {
  const encontrado = CATALOGO_SERVICIOS.find((item) => item.nombre === servicio);
  return encontrado ? encontrado.precio : 0;
}

function inicioSemana(fecha: Date): Date {
  const copia = new Date(fecha);
  copia.setHours(0, 0, 0, 0);
  const dia = (copia.getDay() + 6) % 7;
  copia.setDate(copia.getDate() - dia);
  return copia;
}

function construirPuntos(pagos: PagoDetalle[], periodo: Periodo): Punto[] {
  const ahora = new Date();
  const puntos: Punto[] = [];
  const valores: number[] = [];
  const marcos: Array<(fecha: Date) => boolean> = [];

  if (periodo === 'semana') {
    for (let i = 7; i >= 0; i -= 1) {
      const inicio = inicioSemana(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - i * 7));
      const fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 7);
      puntos.push({ etiqueta: `${inicio.getDate()}/${inicio.getMonth() + 1}`, valor: 0 });
      valores.push(0);
      marcos.push((fecha) => fecha >= inicio && fecha < fin);
    }
  } else if (periodo === 'mes') {
    for (let i = 11; i >= 0; i -= 1) {
      const referencia = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const etiqueta =
        referencia.getFullYear() === ahora.getFullYear()
          ? MESES[referencia.getMonth()]
          : `${MESES[referencia.getMonth()]} ${String(referencia.getFullYear()).slice(2)}`;
      puntos.push({ etiqueta, valor: 0 });
      valores.push(0);
      marcos.push(
        (fecha) =>
          fecha.getFullYear() === referencia.getFullYear() &&
          fecha.getMonth() === referencia.getMonth()
      );
    }
  } else {
    for (let i = 4; i >= 0; i -= 1) {
      const anio = ahora.getFullYear() - i;
      puntos.push({ etiqueta: String(anio), valor: 0 });
      valores.push(0);
      marcos.push((fecha) => fecha.getFullYear() === anio);
    }
  }

  pagos.forEach((pago) => {
    if (pago.estado !== 'APROBADO') {
      return;
    }
    const fecha = new Date(pago.fechaCita);
    const indice = marcos.findIndex((coincide) => coincide(fecha));
    if (indice >= 0) {
      valores[indice] += valorServicio(pago.servicio);
    }
  });

  return puntos.map((punto, indice) => ({ ...punto, valor: valores[indice] }));
}

export function PagosAdmin() {
  const [pagos, setPagos] = useState<PagoDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setPagos(await listarPagosRecepcion());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const aprobados = useMemo(() => pagos.filter((pago) => pago.estado === 'APROBADO'), [pagos]);
  const totalGanado = useMemo(
    () => aprobados.reduce((total, pago) => total + valorServicio(pago.servicio), 0),
    [aprobados]
  );
  const adelantos = useMemo(
    () => aprobados.reduce((total, pago) => total + pago.monto, 0),
    [aprobados]
  );
  const pendientes = useMemo(
    () => pagos.filter((pago) => pago.estado === 'PENDIENTE').length,
    [pagos]
  );
  const puntos = useMemo(() => construirPuntos(pagos, periodo), [pagos, periodo]);
  const totalPeriodo = useMemo(
    () => puntos.reduce((total, punto) => total + punto.valor, 0),
    [puntos]
  );
  const maximo = Math.max(...puntos.map((punto) => punto.valor), 1);

  async function accion(pago: PagoDetalle, confirmar: boolean) {
    setProcesandoId(pago.id);
    setError(null);
    setMensaje(null);
    try {
      if (confirmar) {
        await confirmarPagoRecepcion(pago.id);
        setMensaje(`Pago de ${pago.pacienteNombre} confirmado.`);
      } else {
        await rechazarPagoRecepcion(pago.id);
        setMensaje(`Pago de ${pago.pacienteNombre} rechazado.`);
      }
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <section className="panel">
      <div className="encabezado-seccion">
        <div>
          <h1>Pagos y reportes</h1>
          <p className="subtitulo">
            Consulta los ingresos por tratamiento y genera reportes por semana, mes o año.
          </p>
        </div>
        <button type="button" className="boton-secundario" onClick={cargar}>
          Actualizar
        </button>
      </div>

      {mensaje && <p className="exito">{mensaje}</p>}
      {error && <p className="error">{error}</p>}

      <div className="tarjetas">
        <article className="tarjeta-accion tarjeta-dato">
          <h3>{formatearSoles(totalGanado)}</h3>
          <p>Total ganado (tratamientos confirmados)</p>
        </article>
        <article className="tarjeta-accion tarjeta-dato">
          <h3>{formatearSoles(adelantos)}</h3>
          <p>Adelantos confirmados</p>
        </article>
        <article className="tarjeta-accion tarjeta-dato">
          <h3>{aprobados.length}</h3>
          <p>Pagos aprobados</p>
        </article>
        <article className="tarjeta-accion tarjeta-dato">
          <h3>{pendientes}</h3>
          <p>Pagos pendientes</p>
        </article>
      </div>

      <div className="reporte">
        <div className="reporte-encabezado">
          <div>
            <h2>Reporte de ingresos</h2>
            <p className="subtitulo">
              Total del período ({ETIQUETA_PERIODO[periodo].toLowerCase()}):{' '}
              <strong>{formatearSoles(totalPeriodo)}</strong>
            </p>
          </div>
          <div className="reporte-tabs">
            {(['semana', 'mes', 'anio'] as Periodo[]).map((opcion) => (
              <button
                key={opcion}
                type="button"
                className={`reporte-tab${periodo === opcion ? ' activo' : ''}`}
                onClick={() => setPeriodo(opcion)}
              >
                {opcion === 'anio' ? 'Año' : ETIQUETA_PERIODO[opcion]}
              </button>
            ))}
          </div>
        </div>

        <div className="grafico">
          {puntos.map((punto, indice) => (
            <div key={`${punto.etiqueta}-${indice}`} className="grafico-columna">
              <span className="grafico-valor">
                {punto.valor > 0 ? formatearSoles(punto.valor) : ''}
              </span>
              <div
                className="grafico-barra"
                style={{
                  height: `${Math.max((punto.valor / maximo) * 160, 6)}px`,
                  animationDelay: `${indice * 0.05}s`
                }}
                title={`${punto.etiqueta}: ${formatearSoles(punto.valor)}`}
              />
              <span className="grafico-etiqueta">{punto.etiqueta}</span>
            </div>
          ))}
        </div>
      </div>

      {cargando ? (
        <p className="subtitulo">Cargando pagos...</p>
      ) : pagos.length === 0 ? (
        <p className="subtitulo">Todavía no hay pagos registrados.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Cita</th>
                <th>Servicio</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((pago) => (
                <tr key={pago.id}>
                  <td>
                    {pago.pacienteNombre}
                    <span className="dato-secundario">{pago.pacienteDni}</span>
                  </td>
                  <td>
                    {formatearFechaCorta(pago.fechaCita)}
                    <span className="dato-secundario">Cita {pago.estadoCita}</span>
                  </td>
                  <td>{pago.servicio ?? 'Consulta general'}</td>
                  <td>{formatearSoles(pago.monto)}</td>
                  <td>
                    <span className={`badge-pago ${pago.estado.toLowerCase()}`}>
                      {ETIQUETA_PAGO[pago.estado]}
                    </span>
                    {pago.referenciaQr && (
                      <span className="dato-secundario">{pago.referenciaQr}</span>
                    )}
                  </td>
                  <td>
                    {pago.estado === 'PENDIENTE' ? (
                      <div className="tabla-acciones">
                        <button
                          type="button"
                          onClick={() => accion(pago, true)}
                          disabled={procesandoId === pago.id}
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          className="boton-peligro"
                          onClick={() => accion(pago, false)}
                          disabled={procesandoId === pago.id}
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <span className="dato-secundario">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
