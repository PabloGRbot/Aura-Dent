import { Router } from "express";
import { OdontologoController } from "../controllers/OdontologoController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { TokenService } from "../../../../domain/ports/TokenService";

export default (
  controller: OdontologoController,
  tokenService: TokenService,
): Router => {
  const router = Router();
  const auth = authenticateToken(tokenService);

  router.get("/", auth, controller.listar);
  router.get("/:id", auth, controller.obtener);

  return router;
};
