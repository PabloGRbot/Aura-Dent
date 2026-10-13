import { Usuario } from "../../domain/entities/Usuario";
import { UsuarioRepository } from "../../domain/ports/UsuarioRepository";
import { HashService } from "../../domain/ports/HashService";
import { TokenService } from "../../domain/ports/TokenService";

export interface LoginResult {
  token: string;
  usuario: {
    id: string;
    rolId: number;
    nombres: string;
    correo: string;
  };
}

export class LoginUsuario {
  constructor(
    private usuarioRepo: UsuarioRepository,
    private hashService: HashService,
    private tokenService: TokenService,
  ) {}

  async ejecutar(correo: string, password: string): Promise<LoginResult> {
    const usuario = await this.usuarioRepo.buscarPorCorreo(correo);
    if (!usuario) {
      throw new Error("Credenciales inválidas");
    }

    if (!usuario.activo) {
      throw new Error("Usuario desactivado");
    }

    const valido = await this.hashService.comparar(
      password,
      usuario.passwordHash,
    );
    if (!valido) {
      throw new Error("Credenciales inválidas");
    }

    const token = this.tokenService.generar({
      id: usuario.id,
      rol: usuario.rolId,
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        rolId: usuario.rolId,
        nombres: usuario.nombres,
        correo: usuario.correo,
      },
    };
  }
}
