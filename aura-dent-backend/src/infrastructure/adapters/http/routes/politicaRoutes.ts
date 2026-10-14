import { Router } from "express";
import { PoliticaController } from "../controllers/PoliticaController";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/authMiddleware";
import { TokenService } from "../../../../domain/ports/TokenService";

export default (
  controller: PoliticaController,
  tokenService: TokenService,
): Router => {
  const router = Router();
  const auth = authenticateToken(tokenService);
  const admin = authorizeRole([4]);

  // Información pública de la clínica (RD09)
  router.get("/contacto", controller.contacto);
  router.get("/", controller.listar);

  // Administración (matriz CRUD: admin sobre Políticas)
  router.get("/todas", auth, admin, controller.listarTodas);
  router.post("/", auth, admin, controller.crear);
  router.put("/contacto", auth, admin, controller.actualizarContacto);
  router.put("/:id", auth, admin, controller.actualizar);
  router.delete("/:id", auth, admin, controller.desactivar);

  return router;
};
