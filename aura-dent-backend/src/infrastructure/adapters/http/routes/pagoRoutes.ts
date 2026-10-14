import { Router } from "express";
import { PagoController } from "../controllers/PagoController";
import {
  authenticateToken,
  authorizeRole,
} from "../middlewares/authMiddleware";
import { TokenService } from "../../../../domain/ports/TokenService";

export default (
  controller: PagoController,
  tokenService: TokenService,
): Router => {
  const router = Router();
  const auth = authenticateToken(tokenService);
  const recepcion = authorizeRole([2, 4]);

  // Simulación de pago (el frontend lo llama desde la pantalla de reserva)
  router.post("/simular", auth, controller.simular);

  // Listados
  router.get("/", auth, recepcion, controller.listar);
  router.get("/cita/:citaId", auth, recepcion, controller.porCita);

  return router;
};
