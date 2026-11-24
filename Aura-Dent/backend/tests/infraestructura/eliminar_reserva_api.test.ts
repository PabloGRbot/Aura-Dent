import express from 'express';
import { AddressInfo } from 'net';
import { Server } from 'http';
import { crearCitasControlador } from '../../src/infraestructura/adaptadores/entrada/controladores_web/citas_controlador';
import { crearAutenticador } from '../../src/infraestructura/adaptadores/entrada/middlewares/autenticacion_middleware';
import { TokenJwt } from '../../src/infraestructura/adaptadores/salida/seguridad/token_jwt';
import { ErrorAplicacion } from '../../src/compartido/error_aplicacion';

describe('DELETE /api/citas/:id', () => {
  let server: Server;
  let url: string;
  const id = '10000000-0000-4000-8000-000000000001';
  const paciente = '40000000-0000-4000-8000-000000000001';
  const tokens = new TokenJwt('secreto-exclusivo-de-pruebas', '1h');
  const eliminar = { eliminar: jest.fn(async (_paciente: string, _id: string) => {}) };
  const tokenPaciente = tokens.generar({ sub: paciente, rol: 'Paciente' });

  beforeAll(async () => {
    const app = express();
    app.use('/api', crearCitasControlador(
      { crearReservaTemporal: jest.fn() }, { confirmarCita: jest.fn() }, { crearCita: jest.fn() },
      { listarPorPaciente: jest.fn() }, { pagarCita: jest.fn() }, crearAutenticador(tokens),
      { listarPorRol: jest.fn() }, eliminar));
    server = await new Promise<Server>((resolve) => { const instancia = app.listen(0, '127.0.0.1', () => resolve(instancia)); });
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/citas/`;
  });
  beforeEach(() => eliminar.eliminar.mockReset().mockResolvedValue(undefined));
  afterAll(async () => { await new Promise<void>((resolve, reject) => server.close((e) => e ? reject(e) : resolve())); });

  const borrar = (token?: string, citaId = id) => fetch(url + citaId, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });

  it('requiere autenticación', async () => {
    expect((await borrar()).status).toBe(401);
    expect(eliminar.eliminar).not.toHaveBeenCalled();
  });
  it('rechaza otros roles', async () => {
    expect((await borrar(tokens.generar({ sub: paciente, rol: 'Administrador' }))).status).toBe(403);
    expect(eliminar.eliminar).not.toHaveBeenCalled();
  });
  it('valida el identificador antes de consultar la reserva', async () => {
    expect((await borrar(tokenPaciente, 'invalido')).status).toBe(400);
    expect(eliminar.eliminar).not.toHaveBeenCalled();
  });
  it('utiliza al paciente del token y responde 204 al eliminar', async () => {
    expect((await borrar(tokenPaciente)).status).toBe(204);
    expect(eliminar.eliminar).toHaveBeenCalledWith(paciente, id);
  });
  it.each([['NO_AUTORIZADO', 403], ['CITA_NO_ENCONTRADA', 404], ['RESERVA_PROTEGIDA', 409]])('mapea %s a su estado HTTP', async (codigo, estado) => {
    eliminar.eliminar.mockRejectedValueOnce(new ErrorAplicacion('Prueba', codigo as string));
    expect((await borrar(tokenPaciente)).status).toBe(estado);
  });
});
