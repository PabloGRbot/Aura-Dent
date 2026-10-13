import { Request, Response, NextFunction } from "express";
import { TokenService } from "../../../../domain/ports/TokenService";

export const authenticateToken = (tokenService: TokenService) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Token requerido" });
      return;
    }

    try {
      const token = authHeader.slice(7);
      const payload = tokenService.verificar(token);
      (req as any).user = payload;
      next();
    } catch {
      res.status(401).json({ error: "Token inválido o expirado" });
    }
  };
};

export const authorizeRole = (rolesPermitidos: number[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user || !rolesPermitidos.includes(user.rol)) {
      res.status(403).json({ error: "Acceso denegado para este rol" });
      return;
    }
    next();
  };
};
