export interface EntradaFaq {
  claves: string[];
  pregunta: string;
  respuesta: string;
}

export const FAQ: EntradaFaq[] = [
  {
    claves: ['horario', 'hora', 'abierto', 'abren', 'cierran'],
    pregunta: '¿Cuál es el horario de atención?',
    respuesta:
      'Atendemos de lunes a viernes de 8:00 a 20:00 y los sábados de 8:00 a 14:00. Domingos y feriados permanecemos cerrados.'
  },
  {
    claves: ['direccion', 'ubicacion', 'donde', 'llegar', 'local', 'sede'],
    pregunta: '¿Dónde están ubicados?',
    respuesta:
      'Estamos en Av. Los Álamos 123, Miraflores, Lima. A media cuadra del óvalo, con ingreso directo desde la avenida.'
  },
  {
    claves: ['telefono', 'whatsapp', 'contacto', 'numero', 'llamar', 'celular', 'correo'],
    pregunta: '¿Cómo los contacto?',
    respuesta:
      'Puedes llamarnos al (01) 555-0123 o escribirnos por WhatsApp al +51 987 654 321. También atendemos por correo en contacto@auradent.com.'
  },
  {
    claves: ['servicio', 'tratamiento', 'hacen', 'ofrecen', 'especialidad'],
    pregunta: '¿Qué servicios ofrecen?',
    respuesta:
      'Brindamos consulta general, limpieza dental, blanqueamiento, ortodoncia (brackets y alineadores), endodoncia, implantes, odontopediatría y prótesis dentales.'
  },
  {
    claves: ['precio', 'costo', 'cuanto', 'tarifa', 'cuesta', 'cobran', 'monto'],
    pregunta: '¿Cuánto cuesta la consulta?',
    respuesta:
      'La consulta general cuesta S/ 50 y la limpieza dental S/ 120. El blanqueamiento va desde S/ 350. Para reservar una cita se abona un adelanto de S/ 10 que se descuenta del tratamiento.'
  },
  {
    claves: ['pagar', 'pago', 'yape', 'plin', 'tarjeta', 'efectivo', 'metodo'],
    pregunta: '¿Qué medios de pago aceptan?',
    respuesta:
      'Aceptamos efectivo, tarjetas de débito y crédito, Yape y Plin. El adelanto de la reserva se realiza de forma virtual.'
  },
  {
    claves: ['reservar', 'reservacion', 'cita', 'agendar', 'sacar', 'turno'],
    pregunta: '¿Cómo reservo una cita?',
    respuesta:
      'Inicia sesión como paciente, elige el odontólogo, la fecha y la hora disponible, y confirma con el adelanto de S/ 10. Recibirás la confirmación de tu cita.'
  },
  {
    claves: ['cancelar', 'reprogramar', 'cambiar', 'anular', 'mover'],
    pregunta: '¿Puedo cancelar o reprogramar mi cita?',
    respuesta:
      'Sí. Puedes cancelar o reprogramar desde la sección "Mis citas" hasta 24 horas antes. Si la cita no se confirma con el adelanto en 15 minutos, el cupo se libera automáticamente.'
  },
  {
    claves: ['odontologo', 'doctor', 'doctores', 'dentista', 'especialista', 'personal'],
    pregunta: '¿Quiénes atienden?',
    respuesta:
      'Contamos con odontólogos generales y especialistas en ortodoncia, endodoncia, implantología y odontopediatría. Al reservar eliges al profesional de tu preferencia.'
  },
  {
    claves: ['estacionamiento', 'parqueo', 'auto', 'carro'],
    pregunta: '¿Tienen estacionamiento?',
    respuesta:
      'Sí, contamos con estacionamiento para pacientes frente al local, sujeto a disponibilidad.'
  },
  {
    claves: ['seguro', 'cobertura', 'aseguradora', 'convenio', 'eps'],
    pregunta: '¿Trabajan con seguros?',
    respuesta:
      'Trabajamos con las principales aseguradoras y EPS. Consulta tu cobertura al momento de agendar tu cita.'
  },
  {
    claves: ['urgencia', 'emergencia', 'dolor', 'sangrado'],
    pregunta: '¿Atienden urgencias?',
    respuesta:
      'Sí, atendemos urgencias dentro del horario de atención. Si tienes dolor intenso o sangrado, llámanos al (01) 555-0123 para darte prioridad.'
  }
];

export const SUGERENCIAS_FAQ: string[] = [
  '¿Cuál es el horario de atención?',
  '¿Dónde están ubicados?',
  '¿Qué servicios ofrecen?',
  '¿Cuánto cuesta la consulta?',
  '¿Cómo reservo una cita?',
  '¿Qué medios de pago aceptan?'
];

export const RESPUESTA_POR_DEFECTO =
  'Solo puedo ayudarte con información del establecimiento: horarios, ubicación, servicios, precios, medios de pago, cómo reservar y contacto. ¿Sobre cuál de estos quieres saber?';

export function responderPregunta(consulta: string): string {
  const texto = consulta
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const entrada = FAQ.find((item) => item.claves.some((clave) => texto.includes(clave)));
  return entrada ? entrada.respuesta : RESPUESTA_POR_DEFECTO;
}
