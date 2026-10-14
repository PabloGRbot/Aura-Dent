import { randomUUID } from "crypto";
import { Usuario } from "../../domain/entities/Usuario";
import { Paciente } from "../../domain/entities/Paciente";
import { Odontologo } from "../../domain/entities/Odontologo";
import { UsuarioRepository } from "../../domain/ports/UsuarioRepository";
import { PacienteRepository } from "../../domain/ports/PacienteRepository";
import { OdontologoRepository } from "../../domain/ports/OdontologoRepository";
import { HashService } from "../../domain/ports/HashService";

export class GestionarUsuarios {
  constructor(
    private usuarioRepo: UsuarioRepository,
    private pacienteRepo: PacienteRepository,
    private odontologoRepo: OdontologoRepository,
    private hashService: HashService,
  ) {}

  async listar(): Promise<Usuario[]> {
    return this.usuarioRepo.listar();
  }

  async obtener(id: string): Promise<Usuario> {
    const u = await this.usuarioRepo.buscarPorId(id);
    if (!u) throw new Error("Usuario no encontrado");
    return u;
  }

  async crear(data: {
    nombres: string;
    apellidos: string;
    documento: string;
    telefono: string;
    correo: string;
    password: string;
    rolId: number;
    numeroColegiatura?: string;
  }): Promise<Usuario> {
    if (await this.usuarioRepo.buscarPorCorreo(data.correo)) {
      throw new Error("El correo ya está registrado");
    }
    if (await this.usuarioRepo.buscarPorDocumento(data.documento)) {
      throw new Error("El documento ya está registrado");
    }

    const hash = await this.hashService.hashear(data.password);
    const usuario = new Usuario(
      randomUUID(),
      data.rolId,
      data.nombres,
      data.apellidos,
      data.documento,
      data.telefono,
      data.correo,
      hash,
      true,
    );
    const creado = await this.usuarioRepo.crear(usuario);

    // Crear registro asociado según el rol
    if (data.rolId === 1) {
      await this.pacienteRepo.crear(
        new Paciente(randomUUID(), creado.id, null, null, null),
      );
    } else if (data.rolId === 3 && data.numeroColegiatura) {
      await this.odontologoRepo.crear(
        new Odontologo(randomUUID(), creado.id, data.numeroColegiatura),
      );
    }

    return creado;
  }

  async cambiarRol(id: string, rolId: number): Promise<Usuario> {
    const u = await this.obtener(id);
    u.rolId = rolId;
    return this.usuarioRepo.actualizar(u);
  }

  async desactivar(id: string): Promise<void> {
    return this.usuarioRepo.desactivar(id);
  }
}
