import { Request, RequestHandler, Response, Router } from 'express';
import { CitaMedica } from '../../../../dominio/modelos/cita_medica';
import { Pago } from '../../../../dominio/modelos/pago';
import { accionesCita } from '../../../../dominio/servicios/politica_citas';
import { paginacion } from '../../salida/base_datos_postgres/gestion_citas_postgres';
import {
  ConfirmarCitaPuerto,
  CrearCitaPuerto,
  CrearReservaTemporalPuerto,
  ListarCitasPacientePuerto,
  PagarCitaPuerto
} from '../../../../dominio/puertos/entrada/reserva_cita_puerto';
import { EliminarReservaPuerto } from '../../../../dominio/puertos/entrada/reserva_cita_puerto';
import { ListarUsuariosPorRolPuerto } from '../../../../dominio/puertos/entrada/gestion_usuarios_puerto';
import { ErrorAplicacion } from '../../../../compartido/error_aplicacion';
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
    estado: accionesCita(cita).estadoEfectivo,
    pagoId: cita.pagoId,
    expiraEn: cita.expiraEn,
    fechaOriginal:cita.fechaOriginal,
    primerPagoEn:cita.primerPagoEn,
    acciones:accionesCita(cita),
    pago: aPagoDto(pago)
  };
}

function responderError(res: Response, error: unknown): void {
  const e = error as Error;
  const codigo = e instanceof ErrorAplicacion ? e.codigo : (e as Error & {code?:string}).code ?? 'ERROR';
  res.status(ESTADOS_ERROR[codigo] ?? 400).json({ mensaje: e.message });
}

const ESTADOS_ERROR: Record<string, number> = {
  PAGO_NO_ENCONTRADO: 404,
  DATOS_INVALIDOS: 400,
  PACIENTE_NO_ENCONTRADO: 404,
  USUARIO_EN_USO: 409,
  EMAIL_DUPLICADO: 409,
  RESERVA_VENCIDA: 410,
  RESERVA_NO_ENCONTRADA: 404,
  NO_AUTORIZADO: 403,
  CITA_NO_ENCONTRADA: 404,
  RESERVA_PROTEGIDA: 409,
  ESTADO_INVALIDO: 409,
  POLITICA_PENDIENTE:409,
  '23P01':409,
  '23514':409,
  '55P03':409,
  '40P01':409,
};

export function crearCitasControlador(
  crearReservaTemporal: CrearReservaTemporalPuerto,
  confirmarCita: ConfirmarCitaPuerto,
  crearCita: CrearCitaPuerto,
  listarCitas: ListarCitasPacientePuerto,
  pagarCita: PagarCitaPuerto,
  autenticar: RequestHandler,
  listarUsuariosPorRol: ListarUsuariosPorRolPuerto,
  eliminarReserva: EliminarReservaPuerto
): Router {
  const router = Router();

  router.delete('/citas/:id', autenticar, autorizar('Paciente'), async (req, res) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      res.status(400).json({ mensaje: 'Identificador de reserva inválido.' });
      return;
    }
    try {
      await eliminarReserva.eliminar((req as SolicitudAutenticada).usuarioId!, req.params.id);
      res.status(204).send();
    } catch (error) { responderError(res, error); }
  });

  function aOdontologoDto(usuario: { id: string; nombres: string; apellidos: string }) {
    return { id: usuario.id, nombres: usuario.nombres, apellidos: usuario.apellidos };
  }

  router.post('/reservas', autenticar, autorizar('Paciente'), async (req: Request, res: Response) => {
    try {
      const { usuarioId } = req as SolicitudAutenticada;
      const { odontologoId, fecha, duracionMinutos } = req.body;
      const reserva = await crearReservaTemporal.crearReservaTemporal({
        pacienteId: usuarioId as string,
        odontologoId,
        fecha: new Date(fecha),
        duracionMinutos
      });
      res.status(201).json(reserva);
    } catch (error) {
      res.status(409).json({ mensaje: (error as Error).message });
    }
  });

  router.post(
    '/reservas/:id/confirmar',
    autenticar,
    autorizar('Paciente'),
    async (req: Request, res: Response) => {
    try {
      const { usuarioId } = req as SolicitudAutenticada;
      const cita = await confirmarCita.confirmarCita(req.params.id, req.body.pagoId, usuarioId);
      res.json(cita);
    } catch (error) {
      responderError(res, error);
    }
    }
  );

  router.post(
    '/citas',
    autenticar,
    autorizar('Paciente'),
    async (req: Request, res: Response) => {
      try {
        const { usuarioId } = req as SolicitudAutenticada;
        const { fecha, duracionMinutos, servicio, odontologoId } = req.body;
        const resultado = await crearCita.crearCita({
          pacienteId: usuarioId as string,
          fecha: new Date(fecha),
          duracionMinutos: duracionMinutos ?? DURACION_POR_DEFECTO,
          servicio: servicio ?? null,
          odontologoId: odontologoId ?? null
        });
        res.status(201).json(aCitaDto(resultado.cita, resultado.pago));
      } catch (error) {
        responderError(res, error);
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
        const p=paginacion(req.query.pagina,req.query.limite);
        const citas = await listarCitas.listarPorPaciente(usuarioId as string,p.pagina,p.limite,String(req.query.seccion ?? ''));
        res.json(citas.map((item) => aCitaDto(item.cita, item.pago)));
      } catch (error) {
        res.status(500).json({ mensaje: (error as Error).message });
      }
    }
  );

  router.get('/odontologos', autenticar, async (_req: Request, res: Response) => {
    try {
      const odontologos = await listarUsuariosPorRol.listarPorRol('Odontologo');
      res.json(odontologos.map(aOdontologoDto));
    } catch (error) {
      responderError(res, error);
    }
  });

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
        responderError(res, error);
      }
    }
  );

  return router;
}
