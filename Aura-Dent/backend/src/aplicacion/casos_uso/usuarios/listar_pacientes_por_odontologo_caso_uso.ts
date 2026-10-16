import { Usuario } from '../../../dominio/modelos/usuario';
import { ListarPacientesPorOdontologoPuerto } from '../../../dominio/puertos/entrada/gestion_usuarios_puerto';
import { UsuarioRepositorioPuerto } from '../../../dominio/puertos/salida/usuario_repositorio_puerto';

export class ListarPacientesPorOdontologoCasoUso implements ListarPacientesPorOdontologoPuerto {
  constructor(private readonly usuarioRepositorio: UsuarioRepositorioPuerto) {}

  async listarPorOdontologo(odontologoId: string): Promise<Usuario[]> {
    return this.usuarioRepositorio.listarPacientesPorOdontologo(odontologoId);
  }
}
