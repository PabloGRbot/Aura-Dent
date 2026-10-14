import { randomUUID } from 'crypto';

export interface GeneradorId {
  generar(): string;
}

export class GeneradorIdUuid implements GeneradorId {
  generar(): string {
    return randomUUID();
  }
}
