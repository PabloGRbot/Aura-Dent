import { Request, RequestHandler, Response, Router } from 'express';
import { CitaMedica } from '../../../../dominio/modelos/cita_medica';
import { Pago } from '../../../../dominio/modelos/pago';
import {
  ConfirmarCitaPuerto,
  CrearCitaPuerto,
  CrearReservaTemporalPuerto,
  ListarCitasPacientePuerto,
  PagarCitaPuerto
} from '../../../../dominio/puertos/entrada/reserva_cita_puerto';
import { autorizar, SolicitudAutenticada } from '../middlewares/autenticacion_middleware';

const DURACION_POR_DEFECTO = 30;

function aPagoDto(pago: Pago | null) {
  if (!pago) {
    return null;
  }
  return {
    id: pago.id,
    citaId: pago.citaId,
    monto: pago.monto,
    estado: pago.estado,
    moneda: pago.moneda,
    referenciaQr: pago.referenciaQr
  };
}

function aCitaDto(cita: CitaMedica, pago: Pago | null = null) {
  return {
    id: cita.id,
    pacienteId: cita.pacienteId,
    odontologoId: cita.odontologoId,
    fecha: cita.fecha,
    duracionMinutos: cita.duracionMinutos,
    servicio: cita.servicio,
    estado: cita.estado,
    pagoId: cita.pagoId,
    pago: aPagoDto(pago)
  };
}

export function crearCitasControlador(
  crearReservaTemporal: CrearReservaTemporalPuerto,
  confirmarCita: ConfirmarCitaPuerto,
  crearCita: CrearCitaPuerto,
  listarCitas: ListarCitasPacientePuerto,
  pagarCita: PagarCitaPuerto,
  autenticar: RequestHandler
): Router {
  const router = Router();

  router.post('/reservas', async (req: Request, res: Response) => {
    try {
      const { pacienteId, odontologoId, fecha, duracionMinutos } = req.body;
      const reserva = await crearReservaTemporal.crearReservaTemporal({
        pacienteId,
        odontologoId,
        fecha: new Date(fecha),
        duracionMinutos
      });
      res.status(201).json(reserva);
    } catch (error) {
      res.status(409).json({ mensaje: (error as Error).message });
    }
  });

  router.post('/reservas/:id/confirmar', async (req: Request, res: Response) => {
    try {
      const cita = await confirmarCita.confirmarCita(req.params.id, req.body.pagoId);
      res.json(cita);
    } catch (error) {
      res.status(400).json({ mensaje: (error as Error).message });
    }
  });

  router.post(
    '/citas',
    autenticar,
    autorizar('Paciente'),
    async (req: Request, res: Response) => {
      try {
        const { usuarioId } = req as SolicitudAutenticada;
        const { fecha, duracionMinutos, servicio } = req.body;
        const resultado = await crearCita.crearCita({
          pacienteId: usuarioId as string,
          fecha: new Date(fecha),
          duracionMinutos: duracionMinutos ?? DURACION_POR_DEFECTO,
          servicio: servicio ?? null
        });
        res.status(201).json(aCitaDto(resultado.cita, resultado.pago));
      } catch (error) {
        res.status(400).json({ mensaje: (error as Error).message });
      }
    }
  );

  router.get(
    '/citas/mis-citas',
    autenticar,
    autorizar('Paciente'),
    async (req: Request, res: Response) => {
      try {
        const { usuarioId } = req as SolicitudAutenticada;
        const citas = await listarCitas.listarPorPaciente(usuarioId as string);
        res.json(citas.map((item) => aCitaDto(item.cita, item.pago)));
      } catch (error) {
        res.status(500).json({ mensaje: (error as Error).message });
      }
    }
  );

  router.post(
    '/citas/:id/pagar',
    autenticar,
    autorizar('Paciente'),
    async (req: Request, res: Response) => {
      try {
        const { usuarioId } = req as SolicitudAutenticada;
        const { referenciaQr } = req.body;
        const resultado = await pagarCita.pagarCita(
          usuarioId as string,
          req.params.id,
          referenciaQr
        );
        res.json(aCitaDto(resultado.cita, resultado.pago));
      } catch (error) {
        res.status(400).json({ mensaje: (error as Error).message });
      }
    }
  );

  return router;
}
