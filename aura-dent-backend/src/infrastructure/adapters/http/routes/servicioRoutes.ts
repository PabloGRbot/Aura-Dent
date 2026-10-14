import { Router } from "express";
import { ServicioController } from "../controllers/ServicioController";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/authMiddleware";
import { TokenService } from "../../../../domain/ports/TokenService";

export default (
  controller: ServicioController,
  tokenService: TokenService,
): Router => {
  const router = Router();
  const auth = authenticateToken(tokenService);
  const admin = authorizeRole([4]);

  // Público para que el paciente vea el catálogo
  router.get("/", controller.listar);

  // Solo admin
  router.post("/", auth, admin, controller.crear);
  router.put("/:id", auth, admin, controller.actualizar);
  router.delete("/:id", auth, admin, controller.desactivar);

  return router;
};
