import { Router } from "express";
import { UsuarioController } from "../controllers/UsuarioController";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/authMiddleware";
import { TokenService } from "../../../../domain/ports/TokenService";

export default (
  controller: UsuarioController,
  tokenService: TokenService,
): Router => {
  const router = Router();
  const auth = authenticateToken(tokenService);
  const admin = authorizeRole([4]);

  router.get("/", auth, admin, controller.listar);
  router.put("/perfil", auth, controller.actualizarPerfil);
  router.get("/:id", auth, controller.obtener);
  router.post("/", auth, admin, controller.crear);
  router.patch("/:id/rol", auth, admin, controller.cambiarRol);
  router.delete("/:id", auth, admin, controller.desactivar);

  return router;
};
