export class ErrorAplicacion extends Error {
  constructor(mensaje: string, public readonly codigo: string = 'ERROR_APLICACION') {
    super(mensaje);
    this.name = 'ErrorAplicacion';
  }
}
