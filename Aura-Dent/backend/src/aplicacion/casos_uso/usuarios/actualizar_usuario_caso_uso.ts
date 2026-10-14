import { Usuario } from '../../../dominio/modelos/usuario';
import {
  ActualizarUsuarioPuerto,
  SolicitudActualizarUsuario
} from '../../../dominio/puertos/entrada/gestion_usuarios_puerto';
import { UsuarioRepositorioPuerto } from '../../../dominio/puertos/salida/usuario_repositorio_puerto';
import { HasheadorPuerto } from '../../../dominio/puertos/salida/hasheador_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class ActualizarUsuarioCasoUso implements ActualizarUsuarioPuerto {
  constructor(
    private readonly usuarioRepositorio: UsuarioRepositorioPuerto,
    private readonly hasheador: HasheadorPuerto
  ) {}

  async actualizar(id: string, solicitud: SolicitudActualizarUsuario): Promise<Usuario> {
    const usuario = await this.usuarioRepositorio.buscarPorId(id);
    if (!usuario) {
      throw new ErrorAplicacion('Usuario no encontrado', 'USUARIO_NO_ENCONTRADO');
    }

    if (solicitud.email && solicitud.email.trim().toLowerCase() !== usuario.email) {
      const email = solicitud.email.trim().toLowerCase();
      const existente = await this.usuarioRepositorio.buscarPorEmail(email);
      if (existente && existente.id !== id) {
        throw new ErrorAplicacion('El email ya está registrado', 'EMAIL_DUPLICADO');
      }
      usuario.email = email;
    }

    if (solicitud.nombres !== undefined) {
      usuario.nombres = solicitud.nombres.trim();
    }
    if (solicitud.apellidos !== undefined) {
      usuario.apellidos = solicitud.apellidos.trim();
    }
    if (solicitud.dniCe !== undefined) {
      usuario.dniCe = solicitud.dniCe.trim();
    }
    if (solicitud.fechaNacimiento !== undefined) {
      usuario.fechaNacimiento = solicitud.fechaNacimiento;
    }
    if (solicitud.alergias !== undefined) {
      usuario.alergias = solicitud.alergias;
    }
    if (solicitud.rol !== undefined) {
      usuario.rol = solicitud.rol;
    }
    if (solicitud.password) {
      if (solicitud.password.length < 6) {
        throw new ErrorAplicacion(
          'La contraseña debe tener al menos 6 caracteres',
          'DATOS_INVALIDOS'
        );
      }
      usuario.passwordHash = await this.hasheador.hashear(solicitud.password);
    }

    try {
      await this.usuarioRepositorio.actualizar(usuario);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ErrorAplicacion('El email o DNI/CE ya están registrados', 'DUPLICADO');
      }
      throw error;
    }

    return usuario;
  }
}
