import { Usuario } from '../../../dominio/modelos/usuario';
import { ListarUsuariosPuerto } from '../../../dominio/puertos/entrada/gestion_usuarios_puerto';
import { UsuarioRepositorioPuerto } from '../../../dominio/puertos/salida/usuario_repositorio_puerto';

export class ListarUsuariosCasoUso implements ListarUsuariosPuerto {
  constructor(private readonly usuarioRepositorio: UsuarioRepositorioPuerto) {}

  listar(): Promise<Usuario[]> {
    return this.usuarioRepositorio.listar();
  }
}
