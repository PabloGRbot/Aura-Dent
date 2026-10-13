import { randomUUID } from "crypto";
import { Usuario } from "../../domain/entities/Usuario";
import { Paciente } from "../../domain/entities/Paciente";
import { UsuarioRepository } from "../../domain/ports/UsuarioRepository";
import { PacienteRepository } from "../../domain/ports/PacienteRepository";
import { HashService } from "../../domain/ports/HashService";

export interface RegistrarUsuarioDTO {
  nombres: string;
  apellidos: string;
  documento: string;
  telefono: string;
  correo: string;
  password: string;
}

export class RegistrarUsuario {
  constructor(
    private usuarioRepo: UsuarioRepository,
    private pacienteRepo: PacienteRepository,
    private hashService: HashService,
  ) {}

  async ejecutar(data: RegistrarUsuarioDTO): Promise<Usuario> {
    if (await this.usuarioRepo.buscarPorCorreo(data.correo)) {
      throw new Error("El correo ya está registrado");
    }
    if (await this.usuarioRepo.buscarPorDocumento(data.documento)) {
      throw new Error("El documento ya está registrado");
    }

    const hash = await this.hashService.hashear(data.password);

    const usuario = new Usuario(
      randomUUID(),
      1, // Rol Paciente
      data.nombres,
      data.apellidos,
      data.documento,
      data.telefono,
      data.correo,
      hash,
      true,
    );

    const creado = await this.usuarioRepo.crear(usuario);

    // Crear registro de Paciente asociado
    const paciente = new Paciente(randomUUID(), creado.id, null, null, null);
    await this.pacienteRepo.crear(paciente);

    return creado;
  }
}
