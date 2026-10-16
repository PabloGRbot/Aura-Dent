import { Rol, Usuario } from '../../../dominio/modelos/usuario';
import { ListarUsuariosPorRolPuerto } from '../../../dominio/puertos/entrada/gestion_usuarios_puerto';
import { UsuarioRepositorioPuerto } from '../../../dominio/puertos/salida/usuario_repositorio_puerto';

export class ListarUsuariosPorRolCasoUso implements ListarUsuariosPorRolPuerto {
  constructor(private readonly usuarioRepositorio: UsuarioRepositorioPuerto) {}

  async listarPorRol(rol: Rol): Promise<Usuario[]> {
    return this.usuarioRepositorio.listarPorRol(rol);
  }
}
