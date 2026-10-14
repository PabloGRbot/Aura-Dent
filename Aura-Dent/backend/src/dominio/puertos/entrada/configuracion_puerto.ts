export type ValoresConfiguracion = Record<string, string>;

export interface ObtenerConfiguracionPuerto {
  obtener(): Promise<ValoresConfiguracion>;
}

export interface ActualizarConfiguracionPuerto {
  actualizar(valores: ValoresConfiguracion): Promise<ValoresConfiguracion>;
}
