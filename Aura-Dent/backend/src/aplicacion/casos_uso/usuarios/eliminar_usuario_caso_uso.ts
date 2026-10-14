import { EliminarUsuarioPuerto } from '../../../dominio/puertos/entrada/gestion_usuarios_puerto';
import { UsuarioRepositorioPuerto } from '../../../dominio/puertos/salida/usuario_repositorio_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class EliminarUsuarioCasoUso implements EliminarUsuarioPuerto {
  constructor(private readonly usuarioRepositorio: UsuarioRepositorioPuerto) {}

  async eliminar(id: string): Promise<void> {
    const usuario = await this.usuarioRepositorio.buscarPorId(id);
    if (!usuario) {
      throw new ErrorAplicacion('Usuario no encontrado', 'USUARIO_NO_ENCONTRADO');
    }

    try {
      await this.usuarioRepositorio.eliminar(id);
    } catch (error) {
      if ((error as { code?: string }).code === '23503') {
        throw new ErrorAplicacion(
          'No se puede eliminar: el usuario tiene citas u otros registros asociados',
          'USUARIO_EN_USO'
        );
      }
      throw error;
    }
  }
}
