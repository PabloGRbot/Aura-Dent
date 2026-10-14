export class ReservaNoDisponibleExcepcion extends Error {
  constructor(mensaje: string = 'El horario seleccionado ya no está disponible') {
    super(mensaje);
    this.name = 'ReservaNoDisponibleExcepcion';
  }
}
