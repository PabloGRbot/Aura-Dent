export interface IntervaloDisponibilidad {
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}

export class Disponibilidad {
  constructor(
    public readonly odontologoId: string,
    public readonly fecha: Date,
    public readonly intervalos: IntervaloDisponibilidad[]
  ) {}

  horasDisponibles(): IntervaloDisponibilidad[] {
    return this.intervalos.filter((intervalo) => intervalo.disponible);
  }
}
