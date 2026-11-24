// Revisión de interfaz con datos sintéticos e interceptación de API: no modifica la base real.
const {mkdirSync,writeFileSync}=require('fs');
const {join}=require('path');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_BIN||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
  const contexto=await browser.newContext({viewport:{width:1365,height:1000}}),pagina=await contexto.newPage();
  const errores=[],resultados=[],carpeta=join(__dirname,'../.revision');mkdirSync(carpeta,{recursive:true});
  pagina.on('pageerror',e=>errores.push(e.message));
  let rol='Paciente';
  const id='11111111-1111-4111-8111-111111111111',doctor='22222222-2222-4222-8222-222222222222';
  const fecha=new Date(Date.now()+3*86400000).toISOString(),ahora=new Date().toISOString();
  const usuario=()=>({id:rol==='Odontologo'?doctor:id,nombres:'Ana',apellidos:'Prueba',dniCe:'12345678',email:'prueba@example.invalid',rol});
  const acciones={puedePagar:false,puedeCancelar:true,puedeReprogramar:true,puedeSolicitarDevolucion:true,limiteEdicion:fecha,limiteDevolucion48:ahora,finGracia:fecha,soloGracia:false};
  const cita={id,pacienteId:id,odontologoId:doctor,pacienteNombre:'Ana Prueba',pacienteDni:'12345678',fecha,duracionMinutos:30,servicio:'Consulta general',estado:'CONFIRMADA',expiraEn:null,pago:null,acciones};
  const pago={id,citaId:id,monto:10,estado:'APROBADO',moneda:'PEN',metodo:'QR',tipo:'ADELANTO',pagadoEn:ahora,pacienteNombre:'Ana Prueba',pacienteDni:'12345678',fechaCita:fecha,estadoCita:'CONFIRMADA',servicio:'Consulta general'};
  const comprobante={id,pagoId:id,citaId:id,tipo:'BOLETA',serie:'B001',correlativo:1,total:10,subtotal:8.47,igv:1.53,moneda:'PEN',estado:'EMITIDO',emitidoEn:ahora};
  await contexto.addInitScript(()=>{if(location.pathname==='/registro')localStorage.removeItem('auradent_token');else localStorage.setItem('auradent_token','solo-prueba-visual');});
  await pagina.route(/^https?:\/\/[^/]+\/api\//,async r=>{
    const u=new URL(r.request().url()),ruta=u.pathname;
    let datos;
    if(ruta==='/api/usuarios/me')datos=usuario();
    else if(ruta==='/api/politica-citas')datos={version:'2026-10-23',texto:'Puedes cancelar con devolución durante el día del pago antes del inicio o con 48 horas exactas. Las devoluciones se recogen en el consultorio. Los cambios no renuevan los plazos. Los pagos son simulados.'};
    else if(ruta.includes('/politica'))datos={version:'2026-10-23',aceptada:true};
    else if(ruta.includes('/disponibilidad'))datos={intervalos:[{horaInicio:'09:00',horaFin:'09:30',disponible:true},{horaInicio:'09:30',horaFin:'10:00',disponible:false}]};
    else if(ruta.includes('/odontologos'))datos=[{id:doctor,nombres:'Luis',apellidos:'Odontólogo'}];
    else if(ruta.includes('/eventos'))datos=[
      {id:'3',tipo:'MODIFICACION',ocurrido_en:ahora,actor_rol:'Recepcion',actor_nombre:'María Fernanda Responsable de Recepción',motivo:'Cambio de horario solicitado por el paciente para mantener la disponibilidad de su atención.',antes:{fecha:ahora},despues:{fecha}},
      {id:'2',tipo:'DEVOLUCION_SOLICITADA',ocurrido_en:ahora,actor_rol:'Paciente',motivo:'Solicitud de devolución del adelanto para recoger en el consultorio.',antes:null,despues:{}},
      {id:'1',tipo:'CREACION',ocurrido_en:ahora,actor_rol:'Paciente',motivo:null,antes:null,despues:{estado:'PENDIENTE_PAGO'}}];
    else if(ruta==='/api/devoluciones')datos=[{id,cita_id:id,monto:'10',estado:'PENDIENTE_ENTREGA',solicitada_en:ahora,paciente_nombre:'Ana Prueba'}];
    else if(ruta==='/api/reportes/resumen')datos={cobros:10,devolucionesEntregadas:0,flujoNeto:10,devolucionesPendientes:10,pagosAprobados:1,reservas:[{estado:'CONFIRMADA',cantidad:1}],puntos:[{etiqueta:'2026-10-01',cobros:10,devoluciones:0}]};
    else if(ruta==='/api/panel/resumen')datos={usuarios:[{rol:'Paciente',cantidad:1}],citas:[{estado:'CONFIRMADA',cantidad:1}],pagos:[{estado:'APROBADO',cantidad:1}]};
    else if(ruta.includes('/configuracion'))datos={nombre_establecimiento:'Aura-Dent',hora_apertura:'08:00',hora_cierre:'20:00',duracion_cita:'30',adelanto_reserva:'10'};
    else if(ruta.includes('/comprobantes'))datos=[comprobante];
    else if(ruta.includes('/pagos'))datos=[pago];
    else if(ruta.endsWith('/notas'))datos=[{id,citaId:id,odontologoId:doctor,contenido:'Nota sintética de revisión',creadoEn:ahora,pacienteNombre:'Ana Prueba',servicio:'Consulta general'}];
    else if(ruta.includes('/pacientes')||ruta==='/api/usuarios')datos=[{...usuario(),rol:'Paciente',odontologoAsignadoId:doctor}];
    else if(ruta.includes('/citas'))datos=[cita];
    else datos=[];
    await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(datos)});
  });
  await pagina.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
  const base=process.env.URL_REVISION||'http://127.0.0.1:5178';
  try{
    for(const [papel,rutas] of [
      ['Paciente',['/registro','/paciente/registrar-cita','/paciente/mis-citas','/paciente/historial','/paciente/comprobantes','/paciente/mi-cuenta']],
      ['Recepcion',['/recepcion/agenda','/recepcion/pagos','/recepcion/pacientes','/recepcion/comprobantes']],
      ['Administrador',['/administrador','/administrador/pagos','/administrador/usuarios','/administrador/comprobantes']],
      ['Odontologo',['/odontologo/mi-agenda','/odontologo/notas','/odontologo/pacientes']]
    ]){rol=papel;for(const ruta of rutas){await pagina.goto(base+ruta);await pagina.waitForLoadState('networkidle');
      const horizontal=await pagina.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      await pagina.screenshot({path:join(carpeta,ruta.replace(/\//g,'_')+'.png'),fullPage:true});
      console.log(`Revisando ${ruta}`);
      const titulo=await pagina.locator('h1,h3').first().textContent();
      resultados.push({ruta,titulo,desbordeHorizontal:horizontal});
      if(ruta==='/paciente/mis-citas'){
        await pagina.getByRole('button',{name:'Cancelar cita',exact:true}).click();await pagina.getByRole('dialog').waitFor();
        await pagina.screenshot({path:join(carpeta,'cancelar.png'),fullPage:true});await pagina.getByRole('button',{name:'Cerrar',exact:true}).click();
        await pagina.getByRole('button',{name:'Editar cita',exact:true}).click();await pagina.getByRole('dialog').waitFor();
        const etiqueta=await pagina.locator('.aura-editar-fecha > span').first().boundingBox();
        const fechaControl=await pagina.locator('.aura-editar-fecha .aura-fecha-boton').boundingBox();
        assert(fechaControl.x-etiqueta.x-etiqueta.width>=15,'Falta separación entre Fecha y su selector');
        await pagina.screenshot({path:join(carpeta,'editar.png'),fullPage:true});await pagina.getByRole('button',{name:'Cerrar',exact:true}).click();
        await pagina.getByRole('button',{name:'Ver movimientos',exact:true}).click();
        await pagina.locator('.aura-gestion-dialogo[open] .aura-movimiento').last().waitFor();
        await comprobarMovimientos();
        await pagina.screenshot({path:join(carpeta,'movimientos.png'),fullPage:true});await pagina.getByRole('button',{name:'Cerrar',exact:true}).click();
      }
    }}
    rol='Paciente';await pagina.setViewportSize({width:390,height:844});await pagina.goto(base+'/paciente/mis-citas');await pagina.waitForLoadState('networkidle');
    await pagina.screenshot({path:join(carpeta,'mis_citas_movil.png'),fullPage:true});
    resultados.push({ruta:'mis-citas-móvil',desbordeHorizontal:await pagina.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
    await pagina.getByRole('button',{name:'Ver movimientos',exact:true}).click();
    await pagina.locator('.aura-gestion-dialogo[open] .aura-movimiento').last().waitFor();
    await comprobarMovimientos();
    await pagina.screenshot({path:join(carpeta,'movimientos_movil.png'),fullPage:true});
    writeFileSync(join(carpeta,'resultado.json'),JSON.stringify({resultados,errores},null,2));
    console.log(JSON.stringify({pantallas:resultados.length,errores,desbordes:resultados.filter(r=>r.desbordeHorizontal)}));
    if(errores.length||resultados.some(r=>r.desbordeHorizontal))process.exitCode=1;
  }finally{await browser.close();}
  async function comprobarMovimientos(){
    const correcto=await pagina.locator('.aura-gestion-dialogo[open] .aura-movimientos').evaluate(lista=>{
      const items=Array.from(lista.children);
      return items.every((item,i)=>item.scrollWidth<=item.clientWidth+1&&(!i||item.getBoundingClientRect().top>=items[i-1].getBoundingClientRect().bottom));
    });
    assert(correcto,'Los movimientos se superponen o desbordan su tarjeta');
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
