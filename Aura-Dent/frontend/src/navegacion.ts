import { Rol } from './tipos';

export interface OpcionMenu {
  etiqueta: string;
  ruta: string;
}

export const RUTA_INICIO_POR_ROL: Record<Rol, string> = {
  Paciente: '/paciente',
  Odontologo: '/odontologo',
  Recepcion: '/recepcion',
  Administrador: '/administrador'
};

export const RUTA_RESERVA_PACIENTE = '/paciente/mis-citas';

export const NOMBRE_ROL: Record<Rol, string> = {
  Paciente: 'Paciente',
  Odontologo: 'Odontólogo',
  Recepcion: 'Recepción',
  Administrador: 'Administrador'
};

export const MENU_POR_ROL: Record<Rol, OpcionMenu[]> = {
  Paciente: [
    { etiqueta: 'Inicio', ruta: '/paciente' },
    { etiqueta: 'Mis citas', ruta: '/paciente/mis-citas' },
    { etiqueta: 'Historial', ruta: '/paciente/historial' }
  ],
  Odontologo: [
    { etiqueta: 'Inicio', ruta: '/odontologo' },
    { etiqueta: 'Mi agenda', ruta: '/odontologo/mi-agenda' },
    { etiqueta: 'Notas clínicas', ruta: '/odontologo/notas' },
    { etiqueta: 'Pacientes', ruta: '/odontologo/pacientes' }
  ],
  Recepcion: [
    { etiqueta: 'Inicio', ruta: '/recepcion' },
    { etiqueta: 'Agenda', ruta: '/recepcion/agenda' },
    { etiqueta: 'Pagos', ruta: '/recepcion/pagos' }
  ],
  Administrador: [
    { etiqueta: 'Inicio', ruta: '/administrador' },
    { etiqueta: 'Pagos y reportes', ruta: '/administrador/pagos' },
    { etiqueta: 'Usuarios', ruta: '/administrador/usuarios' },
    { etiqueta: 'Configuración', ruta: '/administrador/configuracion' }
  ]
};
