import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import { Pool, PoolClient } from 'pg';

export const contextoOperacion = new AsyncLocalStorage<{ actorId?: string; rol?: string; operacion: string; motivo?: string; pagina?:number; limite?:number; busqueda?:string; odontologoFiltro?:string }>();
export function parametrosListado() {const c=contextoOperacion.getStore();return [c?.limite ?? 50,((c?.pagina ?? 1)-1)*(c?.limite ?? 50),`%${(c?.busqueda ?? '').replace(/[\\%_]/g,'\\$&')}%`] as const;}
export async function establecerActor(cliente: PoolClient) {
  const c = contextoOperacion.getStore();
  await cliente.query("SELECT set_config('aura.actor_id',$1,true),set_config('aura.actor_rol',$2,true),set_config('aura.operacion',$3,true),set_config('aura.motivo',$4,true)",
    [c?.actorId ?? '', c?.rol ?? 'Sistema', c?.operacion ?? randomUUID(), c?.motivo ?? '']);
}
export async function conTransaccion<T>(pool: Pool, accion: (cliente: PoolClient) => Promise<T>): Promise<T> {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query("SET LOCAL lock_timeout='5s'");
    await establecerActor(cliente);
    const resultado = await accion(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) { await cliente.query('ROLLBACK'); throw error; }
  finally { cliente.release(); }
}
