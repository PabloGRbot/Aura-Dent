import { randomUUID } from "crypto";
import { Paciente } from "../../domain/entities/Paciente";
import { Usuario } from "../../domain/entities/Usuario";
import { PacienteRepository } from "../../domain/ports/PacienteRepository";
import { UsuarioRepository } from "../../domain/ports/UsuarioRepository";
import { HashService } from "../../domain/ports/HashService";

export class GestionarPacientes {
  constructor(
    private pacienteRepo: PacienteRepository,
    private usuarioRepo: UsuarioRepository,
    private hashService: HashService,
  ) {}

  async listar(): Promise<Paciente[]> {
    return this.pacienteRepo.listar();
  }

  async obtener(id: string): Promise<Paciente> {
    const p = await this.pacienteRepo.buscarPorId(id);
    if (!p) throw new Error("Paciente no encontrado");
    return p;
  }

  async crearManual(data: {
    nombres: string;
    apellidos: string;
    documento: string;
    telefono: string;
    correo: string;
    fechaNacimiento?: string;
    direccion?: string;
  }): Promise<Paciente> {
    if (await this.usuarioRepo.buscarPorCorreo(data.correo)) {
      throw new Error("El correo ya está registrado");
    }
    if (await this.usuarioRepo.buscarPorDocumento(data.documento)) {
      throw new Error("El documento ya está registrado");
    }

    // Contraseña temporal = documento
    const hash = await this.hashService.hashear(data.documento);
    const usuario = new Usuario(
      randomUUID(),
      1, // Paciente
      data.nombres,
      data.apellidos,
      data.documento,
      data.telefono,
      data.correo,
      hash,
      true,
    );
    const u = await this.usuarioRepo.crear(usuario);

    const paciente = new Paciente(
      randomUUID(),
      u.id,
      data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
      data.direccion ?? null,
      null,
    );
    return this.pacienteRepo.crear(paciente);
  }
}
