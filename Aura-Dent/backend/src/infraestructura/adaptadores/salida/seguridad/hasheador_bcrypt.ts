import bcrypt from 'bcryptjs';
import { HasheadorPuerto } from '../../../../dominio/puertos/salida/hasheador_puerto';

export class HasheadorBcrypt implements HasheadorPuerto {
  constructor(private readonly rondas: number = 10) {}

  async hashear(valor: string): Promise<string> {
    return bcrypt.hash(valor, this.rondas);
  }

  async comparar(valor: string, valorHasheado: string): Promise<boolean> {
    return bcrypt.compare(valor, valorHasheado);
  }
}
