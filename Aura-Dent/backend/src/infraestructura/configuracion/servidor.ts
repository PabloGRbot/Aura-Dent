import cors from 'cors';
import express, { Express } from 'express';
import { ConsultarDisponibilidadCasoUso } from '../../aplicacion/casos_uso/asistente_ia/consultar_disponibilidad_caso_uso';
import { ResponderConsultaCasoUso } from '../../aplicacion/casos_uso/asistente_ia/responder_consulta_caso_uso';
import { LoginCasoUso } from '../../aplicacion/casos_uso/autenticacion/login_caso_uso';
import { ObtenerPerfilCasoUso } from '../../aplicacion/casos_uso/autenticacion/obtener_perfil_caso_uso';
import { AgregarNotaCasoUso } from '../../aplicacion/casos_uso/agenda/agregar_nota_caso_uso';
import { ActualizarNotaCasoUso } from '../../aplicacion/casos_uso/agenda/actualizar_nota_caso_uso';
import { EliminarNotaCasoUso } from '../../aplicacion/casos_uso/agenda/eliminar_nota_caso_uso';
import { AsignarCitaCasoUso } from '../../aplicacion/casos_uso/agenda/asignar_cita_caso_uso';
import { ListarAgendaCasoUso } from '../../aplicacion/casos_uso/agenda/listar_agenda_caso_uso';
import { ListarNotasCitaCasoUso } from '../../aplicacion/casos_uso/agenda/listar_notas_cita_caso_uso';
import { ListarNotasOdontologoCasoUso } from '../../aplicacion/casos_uso/agenda/listar_notas_odontologo_caso_uso';
import { ActualizarConfiguracionCasoUso } from '../../aplicacion/casos_uso/configuracion/actualizar_configuracion_caso_uso';
import { ObtenerConfiguracionCasoUso } from '../../aplicacion/casos_uso/configuracion/obtener_configuracion_caso_uso';
import { ValidarPagoQrCasoUso } from '../../aplicacion/casos_uso/pagos/validar_pago_qr_caso_uso';
import { ConfirmarPagoCasoUso } from '../../aplicacion/casos_uso/recepcion/confirmar_pago_caso_uso';
import { RegistrarPagoManualCasoUso } from '../../aplicacion/casos_uso/recepcion/registrar_pago_manual_caso_uso';
import { ListarCitasTodasCasoUso } from '../../aplicacion/casos_uso/recepcion/listar_citas_todas_caso_uso';
import { ListarPagosCasoUso } from '../../aplicacion/casos_uso/recepcion/listar_pagos_caso_uso';
import { RechazarPagoCasoUso } from '../../aplicacion/casos_uso/recepcion/rechazar_pago_caso_uso';
import { ConfirmarCitaCasoUso } from '../../aplicacion/casos_uso/reserva_citas/confirmar_cita_caso_uso';
import { ListarUsuariosPorRolCasoUso } from '../../aplicacion/casos_uso/usuarios/listar_usuarios_por_rol_caso_uso';
import { ListarPacientesPorOdontologoCasoUso } from '../../aplicacion/casos_uso/usuarios/listar_pacientes_por_odontologo_caso_uso';
import { ActualizarUsuarioCasoUso } from '../../aplicacion/casos_uso/usuarios/actualizar_usuario_caso_uso';
import { CrearUsuarioCasoUso } from '../../aplicacion/casos_uso/usuarios/crear_usuario_caso_uso';
import { EliminarUsuarioCasoUso } from '../../aplicacion/casos_uso/usuarios/eliminar_usuario_caso_uso';
import { EmitirComprobanteCasoUso } from '../../aplicacion/casos_uso/comprobantes/emitir_comprobante_caso_uso';
import { ListarComprobantesCasoUso } from '../../aplicacion/casos_uso/comprobantes/listar_comprobantes_caso_uso';
import { ListarComprobantesPacienteCasoUso } from '../../aplicacion/casos_uso/comprobantes/listar_comprobantes_paciente_caso_uso';
import { ObtenerComprobanteCasoUso } from '../../aplicacion/casos_uso/comprobantes/obtener_comprobante_caso_uso';
import { AnularComprobanteCasoUso } from '../../aplicacion/casos_uso/comprobantes/anular_comprobante_caso_uso';
import { CrearCitaCasoUso } from '../../aplicacion/casos_uso/reserva_citas/crear_cita_caso_uso';
import { CrearReservaTemporalCasoUso } from '../../aplicacion/casos_uso/reserva_citas/crear_reserva_temporal_caso_uso';
import { ListarCitasPacienteCasoUso } from '../../aplicacion/casos_uso/reserva_citas/listar_citas_paciente_caso_uso';
import { ListarUsuariosCasoUso } from '../../aplicacion/casos_uso/usuarios/listar_usuarios_caso_uso';
import { PagarCitaCasoUso } from '../../aplicacion/casos_uso/reserva_citas/pagar_cita_caso_uso';
import { ValidacionReservaServicio } from '../../dominio/servicios/validacion_reserva_servicio';
import { GeneradorIdUuid } from '../../compartido/generador_id';
import { ComprobantePostgresRepositorio } from '../adaptadores/salida/base_datos_postgres/comprobante_postgres_repositorio';
import { crearComprobantesControlador } from '../adaptadores/entrada/controladores_web/comprobantes_controlador';
import { crearOdontologoControlador } from '../adaptadores/entrada/controladores_web/odontologo_controlador';
import { crearChatControlador } from '../adaptadores/entrada/chat_ia_widget/chat_controlador';
import { crearAgendaControlador } from '../adaptadores/entrada/controladores_web/agenda_controlador';
import { crearAutenticacionControlador } from '../adaptadores/entrada/controladores_web/autenticacion_controlador';
import { crearCitasControlador } from '../adaptadores/entrada/controladores_web/citas_controlador';
import { crearConfiguracionControlador } from '../adaptadores/entrada/controladores_web/configuracion_controlador';
import { crearPagosControlador } from '../adaptadores/entrada/controladores_web/pagos_controlador';
import { crearRecepcionControlador } from '../adaptadores/entrada/controladores_web/recepcion_controlador';
import { crearUsuariosControlador } from '../adaptadores/entrada/controladores_web/usuarios_controlador';
import { crearAutenticador } from '../adaptadores/entrada/middlewares/autenticacion_middleware';
import { CitaPostgresRepositorio } from '../adaptadores/salida/base_datos_postgres/cita_postgres_repositorio';
import { ConfiguracionPostgresRepositorio } from '../adaptadores/salida/base_datos_postgres/configuracion_postgres_repositorio';
import { crearConexionPostgres } from '../adaptadores/salida/base_datos_postgres/conexion_postgres';
import { NotaPostgresRepositorio } from '../adaptadores/salida/base_datos_postgres/nota_postgres_repositorio';
import { PagoPostgresRepositorio } from '../adaptadores/salida/base_datos_postgres/pago_postgres_repositorio';
import { UsuarioPostgresRepositorio } from '../adaptadores/salida/base_datos_postgres/usuario_postgres_repositorio';
import { GeminiAdaptador } from '../adaptadores/salida/gemini/gemini_adaptador';
import { PasarelaQrSimuladaAdaptador } from '../adaptadores/salida/pasarela_pagos_qr/pasarela_qr_simulada_adaptador';
import { HasheadorBcrypt } from '../adaptadores/salida/seguridad/hasheador_bcrypt';
import { TokenJwt } from '../adaptadores/salida/seguridad/token_jwt';
import { CorreoAdaptador } from '../adaptadores/salida/servicio_notificaciones/correo_adaptador';

export function crearServidor(): Express {
  const pool = crearConexionPostgres();
  const generadorId = new GeneradorIdUuid();
  const validacionReserva = new ValidacionReservaServicio();
  const hasheador = new HasheadorBcrypt();
  const token = new TokenJwt();

  const citaRepositorio = new CitaPostgresRepositorio(pool);
  const pagoRepositorio = new PagoPostgresRepositorio(pool);
  const usuarioRepositorio = new UsuarioPostgresRepositorio(pool);
  const configuracionRepositorio = new ConfiguracionPostgresRepositorio(pool);
  const notaRepositorio = new NotaPostgresRepositorio(pool);
  const pasarelaPago = new PasarelaQrSimuladaAdaptador();
  const notificacion = new CorreoAdaptador();

  const crearReservaTemporal = new CrearReservaTemporalCasoUso(
    citaRepositorio,
    validacionReserva,
    generadorId
  );
  const confirmarCita = new ConfirmarCitaCasoUso(
    citaRepositorio,
    usuarioRepositorio,
    notificacion
  );
  const crearCita = new CrearCitaCasoUso(
    citaRepositorio,
    pagoRepositorio,
    pasarelaPago,
    validacionReserva,
    generadorId,
    usuarioRepositorio
  );
  const listarCitas = new ListarCitasPacienteCasoUso(citaRepositorio, pagoRepositorio);
  const pagarCita = new PagarCitaCasoUso(citaRepositorio, pagoRepositorio, pasarelaPago);
  const validarPagoQr = new ValidarPagoQrCasoUso(pagoRepositorio, pasarelaPago, generadorId);
  const consultarDisponibilidad = new ConsultarDisponibilidadCasoUso(citaRepositorio);
  const responderConsulta = new ResponderConsultaCasoUso(new GeminiAdaptador());
  const login = new LoginCasoUso(usuarioRepositorio, hasheador, token);
  const obtenerPerfil = new ObtenerPerfilCasoUso(usuarioRepositorio);
  const listarUsuarios = new ListarUsuariosCasoUso(usuarioRepositorio);
  const crearUsuario = new CrearUsuarioCasoUso(usuarioRepositorio, hasheador, generadorId);
  const actualizarUsuario = new ActualizarUsuarioCasoUso(usuarioRepositorio, hasheador);
  const eliminarUsuario = new EliminarUsuarioCasoUso(usuarioRepositorio);
  const listarUsuariosPorRol = new ListarUsuariosPorRolCasoUso(usuarioRepositorio);
  const registrarPagoManual = new RegistrarPagoManualCasoUso(citaRepositorio, pagoRepositorio, generadorId);
  const comprobanteRepositorio = new ComprobantePostgresRepositorio(pool);
  const emitirComprobante = new EmitirComprobanteCasoUso(comprobanteRepositorio, pagoRepositorio);
  const listarComprobantes = new ListarComprobantesCasoUso(comprobanteRepositorio);
  const listarComprobantesPorPaciente = new ListarComprobantesPacienteCasoUso(comprobanteRepositorio);
  const obtenerComprobante = new ObtenerComprobanteCasoUso(comprobanteRepositorio);
  const anularComprobante = new AnularComprobanteCasoUso(comprobanteRepositorio);
  const obtenerConfiguracion = new ObtenerConfiguracionCasoUso(configuracionRepositorio);
  const actualizarConfiguracion = new ActualizarConfiguracionCasoUso(configuracionRepositorio);
  const listarAgenda = new ListarAgendaCasoUso(citaRepositorio);
  const listarPacientesPorOdontologo = new ListarPacientesPorOdontologoCasoUso(usuarioRepositorio);
  const asignarCita = new AsignarCitaCasoUso(citaRepositorio);
  const agregarNota = new AgregarNotaCasoUso(citaRepositorio, notaRepositorio, generadorId);
  const actualizarNota = new ActualizarNotaCasoUso(notaRepositorio);
  const eliminarNota = new EliminarNotaCasoUso(notaRepositorio);
  const listarNotasCita = new ListarNotasCitaCasoUso(notaRepositorio);
  const listarNotasOdontologo = new ListarNotasOdontologoCasoUso(notaRepositorio);
  const listarCitasTodas = new ListarCitasTodasCasoUso(citaRepositorio);
  const listarPagos = new ListarPagosCasoUso(pagoRepositorio);
  const confirmarPago = new ConfirmarPagoCasoUso(pagoRepositorio, citaRepositorio);
  const rechazarPago = new RechazarPagoCasoUso(pagoRepositorio);
  const autenticar = crearAutenticador(token);

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/salud', (_req, res) => {
    res.json({ estado: 'ok' });
  });

  app.use(
    '/api',
    crearAutenticacionControlador(login, obtenerPerfil, crearUsuario, actualizarUsuario, autenticar)
  );
  app.use(
    '/api',
    crearCitasControlador(
      crearReservaTemporal,
      confirmarCita,
      crearCita,
      listarCitas,
      pagarCita,
      autenticar,
      listarUsuariosPorRol
    )
  );
  app.use(
    '/api',
    crearUsuariosControlador(
      listarUsuarios,
      crearUsuario,
      actualizarUsuario,
      eliminarUsuario,
      autenticar
    )
  );
  app.use('/api', crearConfiguracionControlador(obtenerConfiguracion, actualizarConfiguracion, autenticar));
  app.use(
    '/api',
    crearAgendaControlador(
      listarAgenda,
      asignarCita,
      agregarNota,
      actualizarNota,
      eliminarNota,
      listarNotasCita,
      listarNotasOdontologo,
      autenticar
    )
  );
  app.use('/api', crearRecepcionControlador(
    listarUsuariosPorRol,
    listarUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    crearCita,
    listarCitasTodas,
    listarPagos,
    confirmarPago,
    rechazarPago,
    registrarPagoManual,
    autenticar
  ));
  app.use('/api', crearComprobantesControlador(
    emitirComprobante,
    listarComprobantes,
    listarComprobantesPorPaciente,
    obtenerComprobante,
    anularComprobante,
    autenticar
  ));
  app.use('/api', crearPagosControlador(validarPagoQr));
  app.use('/api', crearOdontologoControlador(listarPacientesPorOdontologo, autenticar));
  app.use('/api', crearChatControlador(consultarDisponibilidad, responderConsulta));

  return app;
}
