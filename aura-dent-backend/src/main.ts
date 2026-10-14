import express from "express";
import { Pool, types } from "pg";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";

// Persistencia
import { PostgresUsuarioRepository } from "./infrastructure/adapters/persistence/PostgresUsuarioRepository";
import { PostgresPacienteRepository } from "./infrastructure/adapters/persistence/PostgresPacienteRepository";
import { PostgresCitaRepository } from "./infrastructure/adapters/persistence/PostgresCitaRepository";
import { PostgresServicioRepository } from "./infrastructure/adapters/persistence/PostgresServicioRepository";
import { PostgresOdontologoRepository } from "./infrastructure/adapters/persistence/PostgresOdontologoRepository";
import { PostgresPagoRepository } from "./infrastructure/adapters/persistence/PostgresPagoRepository";
import { PostgresChatbotRepository } from "./infrastructure/adapters/persistence/PostgresChatbotRepository";
import { PostgresDisponibilidadRepository } from "./infrastructure/adapters/persistence/PostgresDisponibilidadRepository";
import { PostgresPoliticaRepository } from "./infrastructure/adapters/persistence/PostgresPoliticaRepository";

// Servicios
import { BcryptHashService } from "./infrastructure/adapters/services/BcryptHashService";
import { JwtTokenService } from "./infrastructure/adapters/services/JwtTokenService";
import { OpenAiService } from "./infrastructure/adapters/services/OpenAiService";
import { EmailNotificacionService } from "./infrastructure/adapters/services/EmailNotificacionService";
import { iniciarTareasProgramadas } from "./infrastructure/adapters/jobs/scheduler";

// Casos de uso
import { RegistrarUsuario } from "./application/use-cases/RegistrarUsuario";
import { LoginUsuario } from "./application/use-cases/LoginUsuario";
import { CrearCitaRetenida } from "./application/use-cases/CrearCitaRetenida";
import { ListarCitasPaciente } from "./application/use-cases/ListarCitasPaciente";
import { CancelarCita } from "./application/use-cases/CancelarCita";
import { ReprogramarCita } from "./application/use-cases/ReprogramarCita";
import { ListarAgendaOdontologo } from "./application/use-cases/ListarAgendaOdontologo";
import { MarcarCitaAtendida } from "./application/use-cases/MarcarCitaAtendida";
import { GestionGlobalCitas } from "./application/use-cases/GestionGlobalCitas";
import { GestionarServicios } from "./application/use-cases/GestionarServicios";
import { GestionarUsuarios } from "./application/use-cases/GestionarUsuarios";
import { GestionarPacientes } from "./application/use-cases/GestionarPacientes";
import { GestionarOdontologos } from "./application/use-cases/GestionarOdontologos";
import { ActualizarPerfil } from "./application/use-cases/ActualizarPerfil";
import { ConfirmarPagoSimulado } from "./application/use-cases/ConfirmarPagoSimulado";
import { ListarPagos } from "./application/use-cases/ListarPagos";
import { ConversarConChatbot } from "./application/use-cases/ConversarConChatbot";
import { GestionarBaseConocimiento } from "./application/use-cases/GestionarBaseConocimiento";
import { ListarBitacoraChatbot } from "./application/use-cases/ListarBitacoraChatbot";
import { GestionarDisponibilidad } from "./application/use-cases/GestionarDisponibilidad";
import { GestionarPoliticas } from "./application/use-cases/GestionarPoliticas";
import { NotificarCita } from "./application/use-cases/NotificarCita";

// Controladores
import { AuthController } from "./infrastructure/adapters/http/controllers/AuthController";
import { CitaController } from "./infrastructure/adapters/http/controllers/CitaController";
import { ServicioController } from "./infrastructure/adapters/http/controllers/ServicioController";
import { UsuarioController } from "./infrastructure/adapters/http/controllers/UsuarioController";
import { PacienteController } from "./infrastructure/adapters/http/controllers/PacienteController";
import { OdontologoController } from "./infrastructure/adapters/http/controllers/OdontologoController";
import { PagoController } from "./infrastructure/adapters/http/controllers/PagoController";
import { ChatbotController } from "./infrastructure/adapters/http/controllers/ChatbotController";
import { DisponibilidadController } from "./infrastructure/adapters/http/controllers/DisponibilidadController";
import { PoliticaController } from "./infrastructure/adapters/http/controllers/PoliticaController";

// Rutas
import authRoutes from "./infrastructure/adapters/http/routes/authRoutes";
import citaRoutes from "./infrastructure/adapters/http/routes/citaRoutes";
import servicioRoutes from "./infrastructure/adapters/http/routes/servicioRoutes";
import usuarioRoutes from "./infrastructure/adapters/http/routes/usuarioRoutes";
import pacienteRoutes from "./infrastructure/adapters/http/routes/pacienteRoutes";
import odontologoRoutes from "./infrastructure/adapters/http/routes/odontologoRoutes";
import pagoRoutes from "./infrastructure/adapters/http/routes/pagoRoutes";
import chatbotRoutes from "./infrastructure/adapters/http/routes/chatbotRoutes";
import disponibilidadRoutes from "./infrastructure/adapters/http/routes/disponibilidadRoutes";
import politicaRoutes from "./infrastructure/adapters/http/routes/politicaRoutes";

dotenv.config();

// Las columnas DATE se devuelven como 'YYYY-MM-DD' (string) para evitar
// desfases de zona horaria al serializar al frontend.
types.setTypeParser(1082, (v) => v);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on("connect", () => console.log("✅ PostgreSQL conectado"));
pool.on("error", (err) => console.error("❌ Error PostgreSQL:", err));

// Repositorios
const usuarioRepo = new PostgresUsuarioRepository(pool);
const pacienteRepo = new PostgresPacienteRepository(pool);
const citaRepo = new PostgresCitaRepository(pool);
const servicioRepo = new PostgresServicioRepository(pool);
const odontologoRepo = new PostgresOdontologoRepository(pool);
const pagoRepo = new PostgresPagoRepository(pool);
const chatbotRepo = new PostgresChatbotRepository(pool);
const disponibilidadRepo = new PostgresDisponibilidadRepository(pool);
const politicaRepo = new PostgresPoliticaRepository(pool);

// Servicios
const hashService = new BcryptHashService();
const tokenService = new JwtTokenService(
  process.env.JWT_SECRET || "secreto_por_defecto",
  process.env.JWT_EXPIRES || "8h",
);
const aiService = new OpenAiService(
  process.env.OPENAI_KEY || "",
  process.env.OPENAI_ENDPOINT ||
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  process.env.OPENAI_MODEL || "gemini-3.5-flash-lite",
);
console.log(
  aiService.estaConfigurado()
    ? `🤖 Chatbot IA: LLM activo (${process.env.OPENAI_MODEL || "gemini-3.5-flash-lite"})`
    : "🤖 Chatbot IA: modo local (sin API key) — responde desde la base de conocimiento",
);
const notificacionService = new EmailNotificacionService();

// Casos de uso
const registrarUC = new RegistrarUsuario(
  usuarioRepo,
  pacienteRepo,
  hashService,
);
const loginUC = new LoginUsuario(usuarioRepo, hashService, tokenService);
const crearCitaUC = new CrearCitaRetenida(citaRepo, pacienteRepo);
const listarCitasUC = new ListarCitasPaciente(citaRepo, pacienteRepo);
const cancelarCitaUC = new CancelarCita(citaRepo);
const reprogramarCitaUC = new ReprogramarCita(citaRepo);
const agendaUC = new ListarAgendaOdontologo(citaRepo, odontologoRepo);
const marcarAtendidaUC = new MarcarCitaAtendida(citaRepo, odontologoRepo);
const gestionGlobalUC = new GestionGlobalCitas(citaRepo);
const gestionServiciosUC = new GestionarServicios(servicioRepo);
const gestionUsuariosUC = new GestionarUsuarios(
  usuarioRepo,
  pacienteRepo,
  odontologoRepo,
  hashService,
);
const gestionPacientesUC = new GestionarPacientes(
  pacienteRepo,
  usuarioRepo,
  hashService,
);
const gestionOdontologosUC = new GestionarOdontologos(odontologoRepo);
const actualizarPerfilUC = new ActualizarPerfil(usuarioRepo, hashService);
const confirmarPagoUC = new ConfirmarPagoSimulado(citaRepo, pagoRepo);
const listarPagosUC = new ListarPagos(pagoRepo);
const conversarChatUC = new ConversarConChatbot(chatbotRepo, aiService);
const baseConocimientoUC = new GestionarBaseConocimiento(chatbotRepo);
const bitacoraUC = new ListarBitacoraChatbot(chatbotRepo);
const disponibilidadUC = new GestionarDisponibilidad(disponibilidadRepo);
const politicasUC = new GestionarPoliticas(politicaRepo);
const notificarCitaUC = new NotificarCita(citaRepo, notificacionService);

// Controladores
const authController = new AuthController(registrarUC, loginUC);
const citaController = new CitaController(
  crearCitaUC,
  listarCitasUC,
  cancelarCitaUC,
  reprogramarCitaUC,
  agendaUC,
  marcarAtendidaUC,
  gestionGlobalUC,
);
const servicioController = new ServicioController(gestionServiciosUC);
const usuarioController = new UsuarioController(
  gestionUsuariosUC,
  actualizarPerfilUC,
);
const pacienteController = new PacienteController(gestionPacientesUC);
const odontologoController = new OdontologoController(gestionOdontologosUC);
const pagoController = new PagoController(
  confirmarPagoUC,
  listarPagosUC,
  notificarCitaUC,
);
const chatbotController = new ChatbotController(
  conversarChatUC,
  baseConocimientoUC,
  bitacoraUC,
);
const disponibilidadController = new DisponibilidadController(
  disponibilidadUC,
);
const politicaController = new PoliticaController(politicasUC);

// Rutas
app.use("/api/auth", authRoutes(authController));
app.use("/api/citas", citaRoutes(citaController, tokenService));
app.use("/api/servicios", servicioRoutes(servicioController, tokenService));
app.use("/api/usuarios", usuarioRoutes(usuarioController, tokenService));
app.use("/api/pacientes", pacienteRoutes(pacienteController, tokenService));
app.use(
  "/api/odontologos",
  odontologoRoutes(odontologoController, tokenService),
);
app.use("/api/pagos", pagoRoutes(pagoController, tokenService));
app.use("/api/chatbot", chatbotRoutes(chatbotController, tokenService));
app.use(
  "/api/disponibilidad",
  disponibilidadRoutes(disponibilidadController, tokenService),
);
app.use("/api/politicas", politicaRoutes(politicaController, tokenService));

// Health
app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "ok", version: "1.0.0" });
  } catch {
    res.status(503).json({ status: "error", db: "down" });
  }
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Aura Dent API escuchando en http://localhost:${PORT}`);
  console.log(`📖 Health: http://localhost:${PORT}/api/health`);
});

// RNF11 + RF17: tareas programadas (recordatorios y respaldo)
iniciarTareasProgramadas(notificarCitaUC);
