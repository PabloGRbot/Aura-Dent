import { Router } from "express";
import { CitaController } from "../controllers/CitaController";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/authMiddleware";
import { TokenService } from "../../../../domain/ports/TokenService";

export default (
  controller: CitaController,
  tokenService: TokenService,
): Router => {
  const router = Router();
  const auth = authenticateToken(tokenService);

  const paciente = authorizeRole([1]);
  const odontologo = authorizeRole([3]);
  const recepcion = authorizeRole([2, 4]);
  const admin = authorizeRole([4]);

  // Paciente
  router.post("/reservar", auth, paciente, controller.reservar);
  router.get("/mis-citas", auth, paciente, controller.misCitas);
  router.post("/:id/cancelar", auth, paciente, controller.cancelar);
  router.post("/:id/reprogramar", auth, paciente, controller.reprogramar);

  // Odontólogo
  router.get("/agenda", auth, odontologo, controller.agenda);
  router.post("/:id/atender", auth, odontologo, controller.marcarAtendida);

  // Recepción / Admin
  router.get("/admin/todas", auth, recepcion, controller.listarTodas);

  return router;
};
