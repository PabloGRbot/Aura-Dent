export interface RegistroClinico {
  id: string;
  fecha: Date;
  diagnostico: string;
  tratamiento: string;
  observaciones?: string;
}

export class HistorialClinico {
  private registros: RegistroClinico[] = [];

  constructor(public readonly pacienteId: string) {}

  agregarRegistro(registro: RegistroClinico): void {
    this.registros.push(registro);
  }

  obtenerRegistros(): RegistroClinico[] {
    return [...this.registros];
  }
}
