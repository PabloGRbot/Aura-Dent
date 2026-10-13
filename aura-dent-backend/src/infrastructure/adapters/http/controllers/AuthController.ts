import { Request, Response } from "express";
import { RegistrarUsuario } from "../../../../application/use-cases/RegistrarUsuario";
import { LoginUsuario } from "../../../../application/use-cases/LoginUsuario";

export class AuthController {
  constructor(
    private registrarUC: RegistrarUsuario,
    private loginUC: LoginUsuario,
  ) {}

  registro = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuario = await this.registrarUC.ejecutar(req.body);
      res.status(201).json({
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { correo, password } = req.body;
      if (!correo || !password) {
        res.status(400).json({ error: "Correo y contraseña son obligatorios" });
        return;
      }
      const resultado = await this.loginUC.ejecutar(correo, password);
      res.json(resultado);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };
}
