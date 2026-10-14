import { Router } from "express";
import { PacienteController } from "../controllers/PacienteController";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/authMiddleware";
import { TokenService } from "../../../../domain/ports/TokenService";

export default (
  controller: PacienteController,
  tokenService: TokenService,
): Router => {
  const router = Router();
  const auth = authenticateToken(tokenService);
  const recepcion = authorizeRole([2, 4]);

  router.get("/", auth, recepcion, controller.listar);
  router.post("/", auth, recepcion, controller.crearManual);

  return router;
};
