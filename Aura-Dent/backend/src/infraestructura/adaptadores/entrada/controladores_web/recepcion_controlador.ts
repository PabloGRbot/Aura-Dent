import { Request, RequestHandler, Response, Router } from 'express';
import { Pago } from '../../../../dominio/modelos/pago';
import { Usuario } from '../../../../dominio/modelos/usuario';
import { CitaMedica } from '../../../../dominio/modelos/cita_medica';
import { MetodoPago, TipoPago } from '../../../../dominio/modelos/pago';
import {
  ConfirmarPagoPuerto,
  ListarCitasTodasPuerto,
  ListarPagosPuerto,
  RechazarPagoPuerto,
  RegistrarPagoManualPuerto,
  SolicitudPagoManual
} from '../../../../dominio/puertos/entrada/gestion_recepcion_puerto';
import {
  CrearUsuarioPuerto,
  ActualizarUsuarioPuerto,
  EliminarUsuarioPuerto,
  ListarUsuariosPuerto,
  ListarUsuariosPorRolPuerto
} from '../../../../dominio/puertos/entrada/gestion_usuarios_puerto';
import { CrearCitaPuerto, SolicitudCita } from '../../../../dominio/puertos/entrada/reserva_cita_puerto';
import { CitaAgendaItem } from '../../../../dominio/puertos/salida/cita_repositorio_puerto';
import { PagoDetalle } from '../../../../dominio/puertos/salida/pago_repositorio_puerto';
import { ErrorAplicacion } from '../../../../compartido/error_aplicacion';
import { autorizar } from '../middlewares/autenticacion_middleware';

const MONTO_ADELANTO = 10;

function generarContrasenaTemporal(): string {
  return `Aura${Math.floor(100000 + Math.random() * 900000)}`;
}

function aCitaDto(item: CitaAgendaItem) {
  return {
    id: item.cita.id,
    pacienteNombre: item.pacienteNombre,
    pacienteDni: item.pacienteDni,
    odontologoId: item.cita.odontologoId,
    fecha: item.cita.fecha,
    duracionMinutos: item.cita.duracionMinutos,
    servicio: item.cita.servicio,
    estado: item.cita.estado
  };
}

function aCitaResultadoDto(cita: CitaMedica, pago: Pago) {
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

function aPagoDto(pago: Pago) {
  return {
    id: pago.id,
    citaId: pago.citaId,
    monto: pago.monto,
    estado: pago.estado,
    moneda: pago.moneda,
    referenciaQr: pago.referenciaQr
  };
}

function aPagoDetalleDto(item: PagoDetalle) {
  return {
    ...aPagoDto(item.pago),
    pacienteNombre: item.pacienteNombre,
    pacienteDni: item.pacienteDni,
    servicio: item.servicio,
    fechaCita: item.fechaCita,
    estadoCita: item.estadoCita
  };
}

function aOdontologoDto(usuario: Usuario) {
  return {
    id: usuario.id,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos
  };
}

function aPacienteDto(usuario: Usuario) {
  return {
    id: usuario.id,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    dniCe: usuario.dniCe,
    rol: usuario.rol,
    odontologoAsignadoId: usuario.odontologoAsignadoId
  };
}

const ESTADOS_ERROR: Record<string, number> = {
  PAGO_NO_ENCONTRADO: 404,
  DATOS_INVALIDOS: 400,
  PACIENTE_NO_ENCONTRADO: 404,
  USUARIO_EN_USO: 409,
  EMAIL_DUPLICADO: 409
};

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function responderError(res: Response, error: unknown): void {
  const codigo = error instanceof ErrorAplicacion ? error.codigo : 'ERROR';
  res.status(ESTADOS_ERROR[codigo] ?? 400).json({ mensaje: (error as Error).message });
}

export function crearRecepcionControlador(
  listarUsuariosPorRol: ListarUsuariosPorRolPuerto,
  listarUsuarios: ListarUsuariosPuerto,
  crearUsuario: CrearUsuarioPuerto,
  actualizarUsuario: ActualizarUsuarioPuerto,
  eliminarUsuario: EliminarUsuarioPuerto,
  crearCita: CrearCitaPuerto,
  listarCitas: ListarCitasTodasPuerto,
  listarPagos: ListarPagosPuerto,
  confirmarPago: ConfirmarPagoPuerto,
  rechazarPago: RechazarPagoPuerto,
  registrarPagoManual: RegistrarPagoManualPuerto,
  autenticar: RequestHandler
): Router {
  const router = Router();
  router.use('/recepcion', autenticar, autorizar('Recepcion', 'Administrador'));

  router.get('/recepcion/odontologos', async (_req: Request, res: Response) => {
    try {
      const odontologos = await listarUsuariosPorRol.listarPorRol('Odontologo');
      res.json(odontologos.map(aOdontologoDto));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.get('/recepcion/pacientes', async (_req: Request, res: Response) => {
    try {
      const usuarios = await listarUsuarios.listar();
      res.json(usuarios.filter((u) => u.rol === 'Paciente').map(aPacienteDto));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.post('/recepcion/pacientes', async (req: Request, res: Response) => {
    try {
      const { nombres, apellidos, email, dniCe, fechaNacimiento, alergias } = req.body;
      const password = generarContrasenaTemporal();
      const usuario = await crearUsuario.crear({
        nombres,
        apellidos,
        email,
        password,
        dniCe,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        alergias: alergias ?? null,
        rol: 'Paciente',
        odontologoAsignadoId: req.body.odontologoAsignadoId ?? null
      });
      res.status(201).json({ ...aPacienteDto(usuario), passwordTemporal: password });
    } catch (error) {
      responderError(res, error);
    }
  });

  router.put('/recepcion/pacientes/:id', async (req: Request, res: Response) => {
    if (!ES_UUID.test(req.params.id)) {
      res.status(404).json({ mensaje: 'Paciente no encontrado' });
      return;
    }
    try {
      const usuario = await actualizarUsuario.actualizar(req.params.id, {
        nombres: req.body.nombres,
        apellidos: req.body.apellidos,
        email: req.body.email,
        dniCe: req.body.dniCe,
        fechaNacimiento: req.body.fechaNacimiento ? new Date(req.body.fechaNacimiento) : null,
        alergias: req.body.alergias ?? null,
        rol: 'Paciente',
        odontologoAsignadoId: req.body.odontologoAsignadoId ?? null
      });
      res.json(aPacienteDto(usuario));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.delete('/recepcion/pacientes/:id', async (req: Request, res: Response) => {
    if (!ES_UUID.test(req.params.id)) {
      res.status(404).json({ mensaje: 'Paciente no encontrado' });
      return;
    }
    try {
      await eliminarUsuario.eliminar(req.params.id);
      res.status(204).send();
    } catch (error) {
      responderError(res, error);
    }
  });

  router.post('/recepcion/citas', async (req: Request, res: Response) => {
    try {
      const { pacienteId, fecha, duracionMinutos, servicio, odontologoId } = req.body;
      const resultado = await crearCita.crearCita({
        pacienteId,
        fecha: new Date(fecha),
        duracionMinutos: duracionMinutos ?? 30,
        servicio: servicio ?? null,
        odontologoId: odontologoId ?? null
      } as unknown as SolicitudCita);
      res.status(201).json(aCitaResultadoDto(resultado.cita, resultado.pago));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.get('/recepcion/citas', async (_req: Request, res: Response) => {
    try {
      const citas = await listarCitas.listar();
      res.json(citas.map(aCitaDto));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.get('/recepcion/pagos', async (_req: Request, res: Response) => {
    try {
      const pagos = await listarPagos.listar();
      res.json(pagos.map(aPagoDetalleDto));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.post('/recepcion/pagos/:id/confirmar', async (req: Request, res: Response) => {
    if (!ES_UUID.test(req.params.id)) {
      res.status(404).json({ mensaje: 'Pago no encontrado' });
      return;
    }
    try {
      const pago = await confirmarPago.confirmar(req.params.id);
      res.json(aPagoDto(pago));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.post('/recepcion/pagos/:id/rechazar', async (req: Request, res: Response) => {
    if (!ES_UUID.test(req.params.id)) {
      res.status(404).json({ mensaje: 'Pago no encontrado' });
      return;
    }
    try {
      const pago = await rechazarPago.rechazar(req.params.id);
      res.json(aPagoDto(pago));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.post('/recepcion/pagos/manual', async (req: Request, res: Response) => {
    try {
      const { citaId, monto, metodo, tipo } = req.body;
      const pago = await registrarPagoManual.registrar({
        citaId,
        monto: Number(monto),
        metodo: metodo as MetodoPago,
        tipo: tipo as TipoPago | undefined
      });
      res.status(201).json(aPagoDto(pago));
    } catch (error) {
      responderError(res, error);
    }
  });

  return router;
}
