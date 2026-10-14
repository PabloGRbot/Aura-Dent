import {
  LoginPuerto,
  SesionAutenticacion
} from '../../../dominio/puertos/entrada/autenticacion_puerto';
import { HasheadorPuerto } from '../../../dominio/puertos/salida/hasheador_puerto';
import { TokenPuerto } from '../../../dominio/puertos/salida/token_puerto';
import { UsuarioRepositorioPuerto } from '../../../dominio/puertos/salida/usuario_repositorio_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class LoginCasoUso implements LoginPuerto {
  constructor(
    private readonly usuarioRepositorio: UsuarioRepositorioPuerto,
    private readonly hasheador: HasheadorPuerto,
    private readonly token: TokenPuerto
  ) {}

  async login(email: string, password: string): Promise<SesionAutenticacion> {
    const usuario = await this.usuarioRepositorio.buscarPorEmail(email);
    if (!usuario) {
      throw new ErrorAplicacion('Credenciales inválidas', 'CREDENCIALES_INVALIDAS');
    }

    const esValida = await this.hasheador.comparar(password, usuario.passwordHash);
    if (!esValida) {
      throw new ErrorAplicacion('Credenciales inválidas', 'CREDENCIALES_INVALIDAS');
    }

    const token = this.token.generar({ sub: usuario.id, rol: usuario.rol });
    return { token, usuario };
  }
}
