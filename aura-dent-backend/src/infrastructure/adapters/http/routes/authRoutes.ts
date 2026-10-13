import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

export default (controller: AuthController): Router => {
  const router = Router();

  router.post("/registro", controller.registro);
  router.post("/login", controller.login);

  return router;
};
