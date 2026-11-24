import { randomUUID } from 'crypto';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { Pool } from 'pg';
import { OperacionesReservaPostgres } from '../../src/infraestructura/adaptadores/salida/base_datos_postgres/operaciones_reserva_postgres';
import { CitaPostgresRepositorio } from '../../src/infraestructura/adaptadores/salida/base_datos_postgres/cita_postgres_repositorio';
import { variablesEntorno } from '../../src/infraestructura/configuracion/variables_entorno';
import { PasarelaPagoPuerto } from '../../src/dominio/puertos/salida/pasarela_pago_puerto';

// Opt-in: usa un esquema temporal propio; nunca inserta ni elimina datos de public.
const suite = process.env.PROBAR_POSTGRES === '1' ? describe : describe.skip;
suite('Eliminar reservas con PostgreSQL', () => {
  const esquema = `aura_prueba_reservas_${process.pid}_${Date.now()}`;
  let admin: Pool;
  let pool: Pool;
  const paciente = randomUUID(), otro = randomUUID(), odontologo = randomUUID();
  const ids = { generar: () => randomUUID() };
  const pasarela: PasarelaPagoPuerto = {
    generarQr: async () => 'CIP-PRUEBA',
    validarPago: async (referencia) => ({ aprobado: true, referencia, mensaje: 'Simulado' })
  };
  let operaciones: OperacionesReservaPostgres;
  let secuencia = 0;

  beforeAll(async () => {
    const c = variablesEntorno.postgres;
    const conexion = { host: c.host, port: c.puerto, user: c.usuario, password: c.contrasena, database: c.baseDatos,
      ssl: c.ssl ? { rejectUnauthorized: false } : false, connectionTimeoutMillis: 5000 };
    admin = new Pool(conexion);
    await admin.query(`CREATE SCHEMA "${esquema}"`);
    pool = new Pool({ ...conexion, options: `-c search_path=${esquema}` });
    const script = await readFile(join(__dirname, '../../scripts/preparar_bd.ts'), 'utf8');
    const sql = script.match(/const ESQUEMA = `([\s\S]*?)`;/)?.[1];
    if (!sql) throw new Error('Esquema de instalación no encontrado');
    await pool.query(sql);
    for(const archivo of (await readdir(join(__dirname,'../../migrations'))).filter(n=>n.endsWith('.sql')).sort()) await pool.query(await readFile(join(__dirname,'../../migrations',archivo),'utf8'));
    for (const [id, rol] of [[paciente, 'Paciente'], [otro, 'Paciente'], [odontologo, 'Odontologo']]) {
      await pool.query('INSERT INTO usuarios (id,nombres,apellidos,email,password_hash,dni_ce,rol) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [id, 'Prueba', 'Temporal', `${id}@prueba.local`, 'no-login', id.slice(0, 8), rol]);
    }
    operaciones = new OperacionesReservaPostgres(pool, pasarela, ids);
  });

  afterAll(async () => {
    await pool?.end();
    if (admin && /^aura_prueba_reservas_\d+_\d+$/.test(esquema)) await admin.query(`DROP SCHEMA "${esquema}" CASCADE`);
    await admin?.end();
  });

  async function reserva(estado = 'PENDIENTE_PAGO', estadoPago = 'PENDIENTE') {
    const citaId = randomUUID(), pagoId = randomUUID();
    const fecha = new Date(Date.now() + (48 + secuencia++) * 3600_000);
    await pool.query('INSERT INTO citas (id,paciente_id,odontologo_id,fecha,duracion_minutos,servicio,estado) VALUES ($1,$2,$3,$4,30,$5,$6)',
      [citaId, paciente, odontologo, fecha, 'Prueba', estado]);
    await pool.query("INSERT INTO pagos (id,cita_id,monto,estado,moneda,metodo,tipo,referencia_qr) VALUES ($1,$2,10,$3,'PEN','QR','ADELANTO','CIP-PRUEBA')", [pagoId, citaId, estadoPago]);
    return { citaId, pagoId, fecha };
  }

  it('elimina una pendiente anterior sin expiración y libera el horario', async () => {
    const { citaId, fecha } = await reserva();
    const citas = new CitaPostgresRepositorio(pool);
    expect(await citas.existeConflicto(odontologo, fecha, 30)).toBe(true);
    await operaciones.eliminar(paciente, citaId);
    expect((await citas.buscarPorId(citaId))?.estado).toBe('CANCELADA');
    expect((await pool.query('SELECT estado FROM pagos WHERE cita_id=$1', [citaId])).rows[0].estado).toBe('ANULADO');
    expect((await pool.query("SELECT id FROM eventos_cita WHERE cita_id=$1 AND tipo='CANCELACION'",[citaId])).rowCount).toBe(1);
    await operaciones.eliminar(paciente,citaId);
    expect((await pool.query("SELECT id FROM eventos_cita WHERE cita_id=$1 AND tipo='CANCELACION'",[citaId])).rowCount).toBe(1);
    expect(await citas.existeConflicto(odontologo, fecha, 30)).toBe(false);
  });

  it('rechaza eliminar una reserva ajena y conserva su pago', async () => {
    const { citaId } = await reserva();
    await expect(operaciones.eliminar(otro, citaId)).rejects.toMatchObject({ codigo: 'NO_AUTORIZADO' });
    expect((await pool.query('SELECT id FROM pagos WHERE cita_id=$1', [citaId])).rowCount).toBe(1);
  });

  it.each(['CONFIRMADA', 'ATENDIDA'])('conserva las citas %s', async (estado) => {
    const { citaId } = await reserva(estado);
    await expect(operaciones.eliminar(paciente, citaId)).rejects.toMatchObject({ codigo: 'RESERVA_PROTEGIDA' });
  });

  it.each(['APROBADO', 'RECHAZADO'])('conserva las pendientes con pago %s', async (estado) => {
    const { citaId } = await reserva('PENDIENTE_PAGO', estado);
    await expect(operaciones.eliminar(paciente, citaId)).rejects.toMatchObject({ codigo: 'RESERVA_PROTEGIDA' });
    expect((await pool.query('SELECT id FROM citas WHERE id=$1', [citaId])).rowCount).toBe(1);
  });

  it('protege citas con notas clínicas y comprobantes', async () => {
    const nota = await reserva();
    await pool.query('INSERT INTO notas_clinicas (id,cita_id,odontologo_id,contenido) VALUES ($1,$2,$3,$4)', [randomUUID(), nota.citaId, odontologo, 'Prueba temporal']);
    await expect(operaciones.eliminar(paciente, nota.citaId)).rejects.toMatchObject({ codigo: 'RESERVA_PROTEGIDA' });
    const comprobante = await reserva();
    await pool.query("INSERT INTO comprobantes (id,pago_id,cita_id,tipo,serie,correlativo,subtotal,igv,total) VALUES ($1,$2,$3,'BOLETA','TEST',1,10,0,10)", [randomUUID(), comprobante.pagoId, comprobante.citaId]);
    await expect(operaciones.eliminar(paciente, comprobante.citaId)).rejects.toMatchObject({ codigo: 'RESERVA_PROTEGIDA' });
  });

  it('si el pago obtiene el bloqueo primero, la eliminación espera y se rechaza', async () => {
    const { citaId } = await reserva();
    let liberar!: () => void, entrar!: () => void;
    const espera = new Promise<void>((r) => { liberar = r; });
    const dentro = new Promise<void>((r) => { entrar = r; });
    const conEspera = new OperacionesReservaPostgres(pool, { ...pasarela, validarPago: async (referencia) => {
      entrar(); await espera; return { aprobado: true, referencia, mensaje: 'Simulado' };
    } }, ids);
    const pago = conEspera.pagarCita(paciente, citaId, 'CIP-PRUEBA');
    await dentro;
    const eliminacion = operaciones.eliminar(paciente, citaId).catch((e: unknown) => e);
    liberar();
    await pago;
    expect(await eliminacion).toMatchObject({ codigo: 'RESERVA_PROTEGIDA' });
    expect((await pool.query('SELECT estado FROM citas WHERE id=$1', [citaId])).rows[0].estado).toBe('CONFIRMADA');
  });

  it('si se elimina primero, el pago no puede aprobar una reserva inexistente', async () => {
    const { citaId } = await reserva();
    await operaciones.eliminar(paciente, citaId);
    await expect(operaciones.pagarCita(paciente, citaId, 'CIP-PRUEBA')).rejects.toMatchObject({ codigo: 'ESTADO_INVALIDO' });
  });
});
