export interface BaseConocimiento {
  id: number;
  pregunta: string;
  respuesta: string;
  categoria: string | null;
  activo: boolean;
}

export interface RegistroBitacora {
  usuarioId: string | null;
  sesionId: string;
  mensajeUsuario: string;
  respuestaIa: string;
  intencion: string;
}

export interface BitacoraEntrada {
  id: number;
  usuarioId: string | null;
  sesionId: string;
  mensajeUsuario: string;
  respuestaIa: string | null;
  intencion: string | null;
  fechaHora: Date;
}

/**
 * Puerto de persistencia para la base de conocimiento del chatbot (RD10)
 * y la bitácora de conversaciones (RD07). Ambas tablas están desacopladas
 * de las tablas operativas de citas y pagos.
 */
export interface ChatbotRepository {
  listarBase(soloActivos?: boolean): Promise<BaseConocimiento[]>;
  buscarBasePorId(id: number): Promise<BaseConocimiento | null>;
  crearBase(data: {
    pregunta: string;
    respuesta: string;
    categoria: string | null;
  }): Promise<BaseConocimiento>;
  actualizarBase(
    id: number,
    data: Partial<Pick<BaseConocimiento, "pregunta" | "respuesta" | "categoria" | "activo">>,
  ): Promise<BaseConocimiento | null>;
  desactivarBase(id: number): Promise<void>;
  registrarBitacora(entrada: RegistroBitacora): Promise<void>;
  listarBitacora(limit?: number): Promise<BitacoraEntrada[]>;
}
