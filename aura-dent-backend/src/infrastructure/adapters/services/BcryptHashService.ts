import bcrypt from "bcrypt";
import { HashService } from "../../../domain/ports/HashService";

export class BcryptHashService implements HashService {
  private readonly saltRounds = 10;

  async hashear(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparar(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
