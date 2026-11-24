// Comprueba geometría y pago con API interceptada, sin modificar reservas reales.
const assert = require('node:assert/strict');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_BIN || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errores = [], resultados = [];
  page.on('pageerror', error => errores.push(error.message));
  const carpeta = join(__dirname, '../.revision');
  mkdirSync(carpeta, { recursive: true });
  const id = '11111111-1111-4111-8111-111111111111';
  const doctor = '22222222-2222-4222-8222-222222222222';
  const usuario = { id, nombres: 'Ana', apellidos: 'Prueba', rol: 'Paciente', email: 'prueba@example.invalid' };
  let pagada = false, pagos = 0;
  const cita = () => ({ id, pacienteId: id, odontologoId: doctor, fecha: new Date(Date.now() + 86400000).toISOString(), duracionMinutos: 30,
    servicio: 'Consulta general', estado: pagada ? 'CONFIRMADA' : 'PENDIENTE_PAGO', expiraEn: new Date(Date.now() + 900000).toISOString(),
    pago: { id, citaId: id, monto: 10, referenciaQr: 'CIP-PRUEBA', estado: 'PENDIENTE' },
    acciones: { puedePagar: !pagada, puedeCancelar: true, puedeReprogramar: false, puedeSolicitarDevolucion: false,
      limiteEdicion: null, limiteEdicionSiPagaAhora: new Date(Date.now() + 3600000).toISOString(),
      limiteDevolucion48: new Date(Date.now() - 86400000).toISOString(), finGracia: null, soloGracia: true } });
  await context.addInitScript(() => localStorage.setItem('auradent_token', 'prueba-local'));
  await page.route(/^https?:\/\/[^/]+\/api\//, async route => {
    const ruta = new URL(route.request().url()).pathname;
    let datos = [];
    if (ruta === '/api/usuarios/me') datos = usuario;
    else if (ruta === '/api/usuarios/me/politica') datos = { version: 'prueba', aceptada: true };
    else if (ruta === '/api/politica-citas') datos = { version: 'prueba', texto: 'Política de cambios y devoluciones. '.repeat(40) };
    else if (ruta === '/api/odontologos') datos = [{ id: doctor, nombres: 'Luis', apellidos: 'Odontólogo' }, { id, nombres: 'María', apellidos: 'Odontóloga' }];
    else if (ruta === `/api/citas/${id}/pagar`) { pagada = true; pagos++; datos = cita(); }
    else if (ruta === '/api/citas/mis-citas') datos = [cita()];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(datos) });
  });
  const base = process.env.URL_REVISION || 'http://127.0.0.1:5178';
  try {
    for (const [width, height] of [[1365,768], [1280,600], [390,844], [375,667], [844,390], [320,568]]) {
      await page.setViewportSize({ width, height });
      await page.goto(base + '/paciente/registrar-cita');
      await page.locator('.tarjeta-servicio').first().click();
      const campo = page.locator('.campo-odontologo .aura-selector-boton');
      await campo.click();
      const menu = page.locator('.aura-selector-dialogo[open]');
      await menu.getByRole('option', { name: 'Luis Odontólogo' }).waitFor();
      await page.waitForFunction(() => {
        const campo = document.querySelector('.campo-odontologo .aura-selector-boton')?.getBoundingClientRect();
        const menu = document.querySelector('.aura-selector-dialogo[open]')?.getBoundingClientRect();
        return campo && menu && Math.min(Math.abs(menu.top-campo.bottom), Math.abs(menu.bottom-campo.top)) <= 8;
      });
      const b = await campo.boundingBox(), m = await menu.boundingBox();
      assert(m.y >= 0 && m.y + m.height <= height + 1, 'El selector sale de la pantalla');
      assert(Math.min(Math.abs(m.y-(b.y+b.height)),Math.abs(m.y+m.height-b.y)) <= 8, 'El selector no está junto al campo');
      await page.screenshot({ path: join(carpeta, `selector_${width}x${height}.png`) });
      await menu.getByRole('option', { name: 'Luis Odontólogo' }).click();

      pagada = false;
      await page.goto(base + '/paciente/mis-citas');
      await page.getByRole('button', { name: 'Pagar', exact: true }).click();
      const modal = page.getByRole('dialog', { name: 'Pago de la reserva' });
      const boton = modal.getByRole('button', { name: 'Simular pago', exact: true });
      await boton.waitFor();
      assert.equal(await modal.locator('.subtitulo').evaluate(el => getComputedStyle(el).fontSize), '13px', 'El aviso debe conservar su tamaño compacto dentro del panel');
      for (const expandir of [false, true]) {
        if (expandir) {
          await modal.locator('.pago-condiciones > summary').click();
          await modal.locator('.politica-citas summary').click();
        }
        const r = await boton.boundingBox();
        assert(r.y >= 0 && r.y + r.height <= height, 'El botón de pago no está visible');
        assert(await boton.isEnabled(), 'El pago está bloqueado');
        assert(await boton.evaluate(el => {
          const r=el.getBoundingClientRect();const encima=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
          return encima===el||el.contains(encima);
        }), 'El botón de pago está tapado');
      }
      await page.screenshot({ path: join(carpeta, `pago_${width}x${height}.png`) });
      await boton.click();
      await modal.waitFor({ state: 'detached' });
      resultados.push({ width, height, selectorJuntoAlCampo: true, pagoVisibleYConfirmado: true });
    }
    assert.equal(pagos, 6);
    assert.deepEqual(errores, []);
    writeFileSync(join(carpeta, 'reserva_resultado.json'), JSON.stringify({ resultados, pagos, errores }, null, 2));
    console.log(JSON.stringify({ resultados, pagos, errores }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
