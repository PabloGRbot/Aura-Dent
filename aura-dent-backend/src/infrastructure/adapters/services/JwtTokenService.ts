import jwt from "jsonwebtoken";
import { TokenService } from "../../../domain/ports/TokenService";

export class JwtTokenService implements TokenService {
  constructor(
    private secret: string,
    private expiresIn: string = "8h",
  ) {}

  generar(payload: object): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
    } as jwt.SignOptions);
  }

  verificar(token: string): any {
    return jwt.verify(token, this.secret);
  }
}
