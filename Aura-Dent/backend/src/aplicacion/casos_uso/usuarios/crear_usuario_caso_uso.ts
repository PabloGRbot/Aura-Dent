import { Usuario } from '../../../dominio/modelos/usuario';
import {
  CrearUsuarioPuerto,
  SolicitudCrearUsuario
} from '../../../dominio/puertos/entrada/gestion_usuarios_puerto';
import { UsuarioRepositorioPuerto } from '../../../dominio/puertos/salida/usuario_repositorio_puerto';
import { HasheadorPuerto } from '../../../dominio/puertos/salida/hasheador_puerto';
import { GeneradorId } from '../../../compartido/generador_id';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class CrearUsuarioCasoUso implements CrearUsuarioPuerto {
  constructor(
    private readonly usuarioRepositorio: UsuarioRepositorioPuerto,
    private readonly hasheador: HasheadorPuerto,
    private readonly generadorId: GeneradorId
  ) {}

  async crear(solicitud: SolicitudCrearUsuario): Promise<Usuario> {
    if (!solicitud.nombres?.trim() || !solicitud.apellidos?.trim()) {
      throw new ErrorAplicacion('Nombres y apellidos son obligatorios', 'DATOS_INVALIDOS');
    }
    if (!solicitud.email?.trim()) {
      throw new ErrorAplicacion('El email es obligatorio', 'DATOS_INVALIDOS');
    }
    if (!solicitud.password || solicitud.password.length < 6) {
      throw new ErrorAplicacion('La contraseña debe tener al menos 6 caracteres', 'DATOS_INVALIDOS');
    }
    if (!solicitud.dniCe?.trim()) {
      throw new ErrorAplicacion('El DNI/CE es obligatorio', 'DATOS_INVALIDOS');
    }

    const email = solicitud.email.trim().toLowerCase();
    if (await this.usuarioRepositorio.buscarPorEmail(email)) {
      throw new ErrorAplicacion('El email ya está registrado', 'EMAIL_DUPLICADO');
    }

    const passwordHash = await this.hasheador.hashear(solicitud.password);
    const usuario = new Usuario(
      this.generadorId.generar(),
      solicitud.nombres.trim(),
      solicitud.apellidos.trim(),
      email,
      passwordHash,
      solicitud.dniCe.trim(),
      solicitud.fechaNacimiento,
      solicitud.alergias,
      solicitud.rol
    );

    try {
      await this.usuarioRepositorio.guardar(usuario);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ErrorAplicacion('El email o DNI/CE ya están registrados', 'DUPLICADO');
      }
      throw error;
    }

    return usuario;
  }
}
