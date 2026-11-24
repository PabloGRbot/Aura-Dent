import { accionesCita,finDiaLima } from '../../src/dominio/servicios/politica_citas';
const cita={estado:'CONFIRMADA',fecha:new Date('2026-11-03T15:00:00Z'),fechaOriginal:new Date('2026-11-03T15:00:00Z'),primerPagoEn:new Date('2026-11-02T16:00:00Z')};
describe('Política de citas en Lima',()=>{
  it('permite cancelar con devolución hoy para mañana',()=>expect(accionesCita(cita,new Date('2026-11-02T23:00:00Z')).puedeSolicitarDevolucion).toBe(true));
  it('conserva el beneficio a las 23:59:59 de Lima',()=>expect(accionesCita(cita,new Date('2026-11-03T04:59:59.999Z')).puedeReprogramar).toBe(true));
  it('termina al cambiar de día, aunque no hayan transcurrido 24 horas',()=>{const a=accionesCita(cita,new Date('2026-11-03T05:00:00Z'));expect(a.puedeReprogramar).toBe(false);expect(a.puedeSolicitarDevolucion).toBe(false);expect(a.puedeCancelar).toBe(true);});
  it.each([[-1,true],[0,true],[1,false]])('evalúa 48 horas exactas, desviación %s ms',(delta,esperado)=>{
    const c={...cita,primerPagoEn:new Date('2026-10-01T12:00:00Z')};
    expect(accionesCita(c,new Date(c.fecha.getTime()-48*3600000+Number(delta))).puedeSolicitarDevolucion).toBe(esperado);
  });
  it('ningún cambio renueva el límite original',()=>{
    const a=accionesCita({...cita,fecha:new Date('2026-12-30T15:00:00Z')},new Date('2026-11-03T06:00:00Z'));
    expect(a.puedeSolicitarDevolucion).toBe(false);expect(a.limiteDevolucion48.toISOString()).toBe('2026-11-01T15:00:00.000Z');
  });
  it('mover antes aplica el límite más temprano',()=>expect(accionesCita({...cita,fecha:new Date('2026-11-02T22:00:00Z')}).limiteDevolucion48.toISOString()).toBe('2026-10-31T22:00:00.000Z'));
  it('no permite editar sin fecha de pago comprobable',()=>expect(accionesCita({...cita,primerPagoEn:null},new Date('2026-11-02T16:01:00Z')).puedeReprogramar).toBe(false));
  it('el inicio de la cita termina la gracia',()=>{const a=accionesCita(cita,cita.fecha);expect(a.puedeCancelar).toBe(false);expect(a.puedeSolicitarDevolucion).toBe(false);});
  it.each(['CANCELADA','VENCIDA','ATENDIDA','NO_ASISTIO'])('no reactiva %s',estado=>{const a=accionesCita({...cita,estado},new Date('2026-11-02T16:01:00Z'));expect(a.puedePagar||a.puedeCancelar||a.puedeReprogramar||a.puedeSolicitarDevolucion).toBe(false);});
  it('el pago deja de estar disponible exactamente al vencer',()=>{
    const c={estado:'PENDIENTE_PAGO',fecha:new Date('2026-12-01T15:00:00Z'),expiraEn:new Date('2026-11-02T16:15:00Z')};
    expect(accionesCita(c,new Date('2026-11-02T16:14:59.999Z')).puedePagar).toBe(true);
    expect(accionesCita(c,c.expiraEn).estadoEfectivo).toBe('VENCIDA');
  });
  it('no inventa vencimiento de reservas antiguas',()=>expect(accionesCita({estado:'PENDIENTE_PAGO',fecha:cita.fecha},new Date('2026-11-02T16:00:00Z')).puedePagar).toBe(true));
  it('usa medianoche de Lima independiente de la zona del servidor',()=>expect(finDiaLima(new Date('2026-11-02T02:00:00Z')).toISOString()).toBe('2026-11-02T05:00:00.000Z'));
});
