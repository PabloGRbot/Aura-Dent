import { Router } from "express";
import { ChatbotController } from "../controllers/ChatbotController";
import {
  authenticateToken,
  authorizeRole,
  optionalAuth,
} from "../middlewares/authMiddleware";
import { TokenService } from "../../../../domain/ports/TokenService";

export default (
  controller: ChatbotController,
  tokenService: TokenService,
): Router => {
  const router = Router();
  const auth = authenticateToken(tokenService);
  const admin = authorizeRole([4]);

  // Conversación: accesible a cualquier visitante autenticado (y anónimo)
  router.post("/chat", optionalAuth(tokenService), controller.chat);

  // Administración de la base de conocimiento (RF19)
  router.get("/base", auth, admin, controller.listarBase);
  router.post("/base", auth, admin, controller.crearBase);
  router.put("/base/:id", auth, admin, controller.actualizarBase);
  router.delete("/base/:id", auth, admin, controller.desactivarBase);

  // Bitácora de conversaciones (RD07)
  router.get("/bitacora", auth, admin, controller.bitacora);

  return router;
};
