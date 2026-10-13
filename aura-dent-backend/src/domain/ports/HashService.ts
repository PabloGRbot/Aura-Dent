export interface HashService {
  hashear(password: string): Promise<string>;
  comparar(password: string, hash: string): Promise<boolean>;
}
