import { Cita } from '../tipos';
import { peticion } from './cliente';
export interface Politica {version:string;texto:string}
export interface Intervalo {horaInicio:string;horaFin:string;disponible:boolean}
export interface Devolucion {id:string;cita_id:string;monto:string;estado:'PENDIENTE_ENTREGA'|'ENTREGADA';solicitada_en:string;entregada_en:string|null;paciente_nombre:string;referencia:string|null}
export interface Evento {id:string;tipo:string;ocurrido_en:string;actor_rol:string;actor_id?:string;actor_nombre?:string;motivo:string|null;antes:Record<string,unknown>|null;despues:Record<string,unknown>}
export interface Resumen {cobros:number;devolucionesEntregadas:number;flujoNeto:number;devolucionesPendientes:number;pagosAprobados:number;cobrosSinFecha?:{cantidad:number;monto:number};reservas:{estado:string;cantidad:number}[];puntos:{etiqueta:string;cobros:number;devoluciones:number}[]}
export const obtenerPolitica=()=>peticion<Politica>('/api/politica-citas');
export const estadoPolitica=()=>peticion<{version:string;aceptada:boolean}>('/api/usuarios/me/politica');
export const aceptarPolitica=(version:string,pacienteId?:string)=>peticion(pacienteId?`/api/usuarios/${pacienteId}/politica`:'/api/usuarios/me/politica',{method:'POST',body:JSON.stringify({version,acepta:true})});
export const obtenerDisponibilidad=(doctor:string,dia:string,duracion:number,excluir?:string)=>peticion<{intervalos:Intervalo[]}>(`/api/citas/disponibilidad?${new URLSearchParams({odontologoId:doctor,dia,duracion:String(duracion),...(excluir?{excluir}:{})})}`);
export const cancelarCita=(id:string,solicitarDevolucion:boolean,motivo:string,porClinica=false,estadoEsperado?:string)=>peticion<Cita>(`/api/citas/${id}/cancelar`,{method:'POST',body:JSON.stringify({solicitarDevolucion,motivo,porClinica,estadoEsperado})});
export const reprogramarCita=(id:string,fecha:string,odontologoId:string)=>peticion<Cita>(`/api/citas/${id}/reprogramar`,{method:'POST',body:JSON.stringify({fecha,odontologoId})});
export const registrarInasistencia=(id:string)=>peticion(`/api/citas/${id}/inasistencia`,{method:'POST'});
export const listarEventos=(id:string,pagina=1)=>peticion<Evento[]>(`/api/citas/${id}/eventos?pagina=${pagina}&vista=resumen`);
export const listarDevoluciones=(pagina=1)=>peticion<Devolucion[]>(`/api/devoluciones?pagina=${pagina}`);
export const entregarDevolucion=(id:string,referencia:string)=>peticion(`/api/devoluciones/${id}/entregar`,{method:'POST',body:JSON.stringify({referencia})});
export const obtenerResumen=(periodo:string)=>peticion<Resumen>(`/api/reportes/resumen?periodo=${periodo}`);
export const duracionServicio=(servicio:string)=>({'Consulta general':30,'Limpieza dental':45,'Ortodoncia':45,'Blanqueamiento':60,'Endodoncia':60,'Implantes':90,'Odontopediatría':45}[servicio] ?? 30);
export const hoyLima=()=>new Date(Date.now()-5*3600000).toISOString().slice(0,10);
export const fechaLima=(f:string)=>new Date(f).toLocaleString('es-PE',{timeZone:'America/Lima',dateStyle:'short',timeStyle:'short'});
