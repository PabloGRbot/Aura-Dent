export interface TokenService {
  generar(payload: object): string;
  verificar(token: string): any;
}
