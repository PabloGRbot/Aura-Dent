import { Router } from "express";
import { DisponibilidadController } from "../controllers/DisponibilidadController";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/authMiddleware";
import { TokenService } from "../../../../domain/ports/TokenService";

export default (
  controller: DisponibilidadController,
  tokenService: TokenService,
): Router => {
  const router = Router();
  const auth = authenticateToken(tokenService);
  const admin = authorizeRole([4]);

  router.delete("/bloque/:id", auth, admin, controller.desactivar);
  router.get("/:odontologoId", auth, controller.listar);
  router.post("/:odontologoId", auth, admin, controller.crear);

  return router;
};
