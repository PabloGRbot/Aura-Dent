import { Rol } from '../../modelos/usuario';

export interface ContenidoToken {
  sub: string;
  rol: Rol;
}

export interface TokenPuerto {
  generar(contenido: ContenidoToken): string;
  verificar(token: string): ContenidoToken;
}
