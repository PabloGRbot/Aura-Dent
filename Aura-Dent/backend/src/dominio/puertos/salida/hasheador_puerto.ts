export interface HasheadorPuerto {
  hashear(valor: string): Promise<string>;
  comparar(valor: string, valorHasheado: string): Promise<boolean>;
}
