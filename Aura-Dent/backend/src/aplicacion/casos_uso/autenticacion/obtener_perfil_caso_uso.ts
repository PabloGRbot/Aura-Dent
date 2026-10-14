import { Usuario } from '../../../dominio/modelos/usuario';
import { ObtenerPerfilPuerto } from '../../../dominio/puertos/entrada/autenticacion_puerto';
import { UsuarioRepositorioPuerto } from '../../../dominio/puertos/salida/usuario_repositorio_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class ObtenerPerfilCasoUso implements ObtenerPerfilPuerto {
  constructor(private readonly usuarioRepositorio: UsuarioRepositorioPuerto) {}

  async obtenerPerfil(usuarioId: string): Promise<Usuario> {
    const usuario = await this.usuarioRepositorio.buscarPorId(usuarioId);
    if (!usuario) {
      throw new ErrorAplicacion('Usuario no encontrado', 'USUARIO_NO_ENCONTRADO');
    }
    return usuario;
  }
}
