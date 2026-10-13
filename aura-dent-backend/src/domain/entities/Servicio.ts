export class Servicio {
  constructor(
    public id: number,
    public nombre: string,
    public descripcion: string | null,
    public precio: number,
    public duracionMinutos: number,
    public montoReserva: number,
    public especialidadId: number | null,
    public activo: boolean = true,
  ) {}
}
