import jwt from 'jsonwebtoken';
import { ContenidoToken, TokenPuerto } from '../../../../dominio/puertos/salida/token_puerto';
import { variablesEntorno } from '../../../configuracion/variables_entorno';

export class TokenJwt implements TokenPuerto {
  constructor(
    private readonly secreto: string = variablesEntorno.jwt.secreto,
    private readonly expiraEn: string = variablesEntorno.jwt.expiraEn
  ) {}

  generar(contenido: ContenidoToken): string {
    return jwt.sign(contenido, this.secreto, { expiresIn: this.expiraEn } as jwt.SignOptions);
  }

  verificar(token: string): ContenidoToken {
    return jwt.verify(token, this.secreto) as ContenidoToken;
  }
}
