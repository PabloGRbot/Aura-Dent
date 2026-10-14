import { Usuario } from "../../domain/entities/Usuario";
import { UsuarioRepository } from "../../domain/ports/UsuarioRepository";
import { HashService } from "../../domain/ports/HashService";

/**
 * RP02: edición del perfil del usuario autenticado (nombres, teléfono, correo
 * y contraseña). Mantiene la unicidad del correo y cifra la nueva contraseña.
 */
export class ActualizarPerfil {
  constructor(
    private usuarioRepo: UsuarioRepository,
    private hashService: HashService,
  ) {}

  async ejecutar(
    usuarioId: string,
    data: {
      nombres?: string;
      apellidos?: string;
      telefono?: string;
      correo?: string;
      passwordNueva?: string;
    },
  ): Promise<Usuario> {
    const usuario = await this.usuarioRepo.buscarPorId(usuarioId);
    if (!usuario) throw new Error("Usuario no encontrado");

    if (data.correo && data.correo !== usuario.correo) {
      const existente = await this.usuarioRepo.buscarPorCorreo(data.correo);
      if (existente) throw new Error("El correo ya está registrado");
      usuario.correo = data.correo;
    }

    if (data.nombres?.trim()) usuario.nombres = data.nombres.trim();
    if (data.apellidos?.trim()) usuario.apellidos = data.apellidos.trim();
    if (data.telefono !== undefined) usuario.telefono = data.telefono;

    if (data.passwordNueva?.trim()) {
      if (data.passwordNueva.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
      }
      usuario.passwordHash = await this.hashService.hashear(
        data.passwordNueva,
      );
    }

    return this.usuarioRepo.actualizar(usuario);
  }
}
