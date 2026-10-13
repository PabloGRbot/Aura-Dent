import express from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";

// Adaptadores - persistencia
import { PostgresUsuarioRepository } from "./infrastructure/adapters/persistence/PostgresUsuarioRepository";
import { PostgresPacienteRepository } from "./infrastructure/adapters/persistence/PostgresPacienteRepository";
import { PostgresCitaRepository } from "./infrastructure/adapters/persistence/PostgresCitaRepository";

// Adaptadores - servicios
import { BcryptHashService } from "./infrastructure/adapters/services/BcryptHashService";
import { JwtTokenService } from "./infrastructure/adapters/services/JwtTokenService";

// Casos de uso
import { RegistrarUsuario } from "./application/use-cases/RegistrarUsuario";
import { LoginUsuario } from "./application/use-cases/LoginUsuario";
import { CrearCitaRetenida } from "./application/use-cases/CrearCitaRetenida";

// Controladores
import { AuthController } from "./infrastructure/adapters/http/controllers/AuthController";

// Rutas
import authRoutes from "./infrastructure/adapters/http/routes/authRoutes";

// Middlewares
import { authenticateToken } from "./infrastructure/adapters/http/middlewares/authMiddleware";

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  }),
);

// ---- Pool PostgreSQL ----
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on("connect", () => console.log("✅ PostgreSQL conectado"));
pool.on("error", (err) => console.error("❌ Error PostgreSQL:", err));

// ---- Repositorios ----
const usuarioRepo = new PostgresUsuarioRepository(pool);
const pacienteRepo = new PostgresPacienteRepository(pool);
const citaRepo = new PostgresCitaRepository(pool);

// ---- Servicios ----
const hashService = new BcryptHashService();
const tokenService = new JwtTokenService(
  process.env.JWT_SECRET || "secreto_por_defecto",
  process.env.JWT_EXPIRES || "8h",
);

// ---- Casos de uso ----
const registrarUC = new RegistrarUsuario(
  usuarioRepo,
  pacienteRepo,
  hashService,
);
const loginUC = new LoginUsuario(usuarioRepo, hashService, tokenService);
// (crearCitaUC se usará cuando agregues el módulo de citas)
const crearCitaUC = new CrearCitaRetenida(citaRepo);
void crearCitaUC;

// ---- Controladores ----
const authController = new AuthController(registrarUC, loginUC);

// ---- Middleware de autenticación ----
const auth = authenticateToken(tokenService);

// ---- Rutas ----
app.use("/api/auth", authRoutes(authController));

// ---- Health check ----
app.get("/api/health", async (_req, res) => {
  const inicio = Date.now();
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      uptime: process.uptime(),
      db: "ok",
      latency: Date.now() - inicio,
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({ status: "error", db: "down" });
  }
});

// ---- Ruta protegida de prueba (para verificar el middleware) ----
app.get("/api/yo", auth, (req, res) => {
  res.json({ mensaje: "Estás autenticado", usuario: (req as any).user });
});

// ---- Manejador global de errores ----
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Error no manejado:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  },
);

// ---- Arranque ----
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Aura Dent API escuchando en http://localhost:${PORT}`);
  console.log(`📖 Docs disponibles en http://localhost:${PORT}/api/health`);
});
