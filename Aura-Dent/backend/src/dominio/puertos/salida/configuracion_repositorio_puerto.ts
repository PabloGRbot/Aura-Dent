export interface ConfiguracionRepositorioPuerto {
  obtenerTodos(): Promise<Record<string, string>>;
  guardarVarios(valores: Record<string, string>): Promise<void>;
}
