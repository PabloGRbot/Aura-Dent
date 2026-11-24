import cors from 'cors';
import { randomUUID } from 'crypto';
import { contextoOperacion } from '../adaptadores/salida/base_datos_postgres/contexto_operacion';
import { GestionCitasPostgres } from '../adaptadores/salida/base_datos_postgres/gestion_citas_postgres';
import { crearGestionCitasControlador } from '../adaptadores/entrada/controladores_web/gestion_citas_controlador';
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
import { variablesEntorno } from './variables_entorno';
import { OperacionesReservaPostgres } from '../adaptadores/salida/base_datos_postgres/operaciones_reserva_postgres';

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
  const operacionesReserva = new OperacionesReservaPostgres(pool, pasarelaPago, generadorId);
  const gestionCitas = new GestionCitasPostgres(pool,pasarelaPago);
  const notificacion = new CorreoAdaptador();
  const comprobanteRepositorio = new ComprobantePostgresRepositorio(pool);
  const emitirComprobante = new EmitirComprobanteCasoUso(comprobanteRepositorio, pagoRepositorio);

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
  const pagarCita = operacionesReserva;
  const validarPagoQr = operacionesReserva;
  const consultarDisponibilidad = new ConsultarDisponibilidadCasoUso(citaRepositorio);
  const responderConsulta = new ResponderConsultaCasoUso(new GeminiAdaptador(),configuracionRepositorio);
  const login = new LoginCasoUso(usuarioRepositorio, hasheador, token);
  const obtenerPerfil = new ObtenerPerfilCasoUso(usuarioRepositorio);
  const listarUsuarios = new ListarUsuariosCasoUso(usuarioRepositorio);
  const crearUsuario = new CrearUsuarioCasoUso(usuarioRepositorio, hasheador, generadorId);
  const actualizarUsuario = new ActualizarUsuarioCasoUso(usuarioRepositorio, hasheador);
  const eliminarUsuario = new EliminarUsuarioCasoUso(usuarioRepositorio);
  const listarUsuariosPorRol = new ListarUsuariosPorRolCasoUso(usuarioRepositorio);
  const registrarPagoManual = operacionesReserva;
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
  const confirmarPago = operacionesReserva;
  const rechazarPago = new RechazarPagoCasoUso(pagoRepositorio);
  const autenticar = crearAutenticador(token, pool);

  const app = express();
  app.use(
    cors({
      origin: variablesEntorno.corsOrigenes,
      credentials: false
    })
  );
  app.use(express.json());
  app.use((req,res,next)=>{
    const pagina=Number(req.query.pagina ?? 1),limite=Number(req.query.limite ?? 50);
    if(!Number.isInteger(pagina)||pagina<1||!Number.isInteger(limite)||limite<1||limite>100){res.status(400).json({mensaje:'Paginación inválida (máximo 100).'});return;}
    const odontologoFiltro=String(req.query.odontologoFiltro ?? '');
    if(odontologoFiltro&&!/^[0-9a-f-]{36}$/i.test(odontologoFiltro)){res.status(400).json({mensaje:'Filtro de odontólogo inválido.'});return;}
    contextoOperacion.run({operacion:randomUUID(),pagina,limite,busqueda:String(req.query.q ?? '').slice(0,100),odontologoFiltro:odontologoFiltro||undefined},next);
  });

  let venciendo = false;
  const limpiarReservasVencidas = () => {
    if(venciendo) return;
    venciendo=true;
    void citaRepositorio.eliminarPendientesVencidas(new Date()).catch((error) => {
      console.error('No se pudieron limpiar reservas vencidas:', error);
    }).finally(()=>{venciendo=false;});
  };
  limpiarReservasVencidas();
  const intervaloVencimiento=setInterval(limpiarReservasVencidas, 60_000);
  intervaloVencimiento.unref();
  app.locals.cerrarConexion=async()=>{clearInterval(intervaloVencimiento);await pool.end();};

  app.get('/salud', (_req, res) => {
    res.json({ estado: 'ok' });
  });
  app.use('/api',crearGestionCitasControlador(pool,gestionCitas,autenticar));

  app.use(
    '/api',
    crearAutenticacionControlador(login, obtenerPerfil, crearUsuario, actualizarUsuario, autenticar,gestionCitas)
  );
  app.use(
    '/api',
    crearCitasControlador(
      gestionCitas,
      gestionCitas,
      gestionCitas,
      gestionCitas,
      pagarCita,
      autenticar,
      listarUsuariosPorRol,
      operacionesReserva
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
      gestionCitas,
      gestionCitas,
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
    gestionCitas,
    listarCitasTodas,
    listarPagos,
    confirmarPago,
    operacionesReserva,
    registrarPagoManual,
    autenticar
  ));
  app.use('/api', crearComprobantesControlador(
    operacionesReserva,
    listarComprobantes,
    listarComprobantesPorPaciente,
    obtenerComprobante,
    anularComprobante,
    autenticar
  ));
  app.use('/api', crearPagosControlador(validarPagoQr,autenticar));
  app.use('/api', crearOdontologoControlador(listarPacientesPorOdontologo, autenticar));
  app.use('/api', crearChatControlador(gestionCitas, responderConsulta));

  return app;
}
