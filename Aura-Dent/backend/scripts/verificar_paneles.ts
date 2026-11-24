// Solo lecturas sobre los paneles; el servidor ejecuta su tarea normal de vencimiento lógico.
import { AddressInfo } from 'net';
import { crearServidor } from '../src/infraestructura/configuracion/servidor';
async function principal(){
  const app=crearServidor(),servidor=app.listen(0,'127.0.0.1');await new Promise<void>(r=>servidor.once('listening',r));
  const base=`http://127.0.0.1:${(servidor.address() as AddressInfo).port}/api`,resultados=[];
  try{
    const casos:Record<string,string[]>={
      paciente:['/usuarios/me','/usuarios/me/politica','/citas/mis-citas','/comprobantes/mis-comprobantes','/devoluciones','/odontologos'],
      recepcion:['/usuarios/me','/panel/resumen','/recepcion/citas','/recepcion/pacientes','/recepcion/pagos','/recepcion/comprobantes','/devoluciones'],
      admin:['/usuarios/me','/panel/resumen','/usuarios','/reportes/resumen?periodo=semana','/reportes/resumen?periodo=mes','/reportes/resumen?periodo=anio','/comprobantes','/configuracion'],
      odontologo:['/usuarios/me','/panel/resumen','/citas/agenda','/citas/notas','/odontologo/mis-pacientes']
    };
    for(const [cuenta,rutas] of Object.entries(casos)){
      const login=await fetch(base+'/autenticacion/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:`${cuenta}@auradent.com`,password:'demo1234'})});
      const sesion=await login.json() as {token?:string};if(!sesion.token)throw new Error(`No fue posible verificar la cuenta demo ${cuenta}: ${login.status}`);
      for(const ruta of rutas){const respuesta=await fetch(base+ruta,{headers:{Authorization:`Bearer ${sesion.token}`}});await respuesta.text();resultados.push({cuenta,ruta,estado:respuesta.status});}
    }
    const publica=await fetch(base+'/politica-citas');resultados.push({cuenta:'Anónimo',ruta:'/politica-citas',estado:publica.status});
    console.log(JSON.stringify({resultados,correcto:resultados.every(r=>r.estado===200)},null,2));
    if(resultados.some(r=>r.estado!==200))process.exitCode=1;
  }finally{await new Promise<void>(r=>servidor.close(()=>r()));await app.locals.cerrarConexion();}
}
principal().catch(e=>{console.error(e.message);process.exitCode=1;});
