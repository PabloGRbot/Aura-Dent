export interface Servicio {
  nombre: string;
  categoria: string;
  detalle: string;
  duracion: string;
  imagen: string;
  precio: number;
}

export const ADELANTO_RESERVA = 10;

export const CATALOGO_SERVICIOS: Servicio[] = [
  {
    nombre: 'Consulta general',
    categoria: 'Diagnóstico',
    detalle:
      'Evaluación integral de tu salud bucal con un plan de tratamiento personalizado y precios claros.',
    duracion: '30 min',
    imagen:
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/Consultation_dentaire_A_l%27h%C3%B4pital_Laquintinie_de_Douala_24.jpg/960px-Consultation_dentaire_A_l%27h%C3%B4pital_Laquintinie_de_Douala_24.jpg",
    precio: 50
  },
  {
    nombre: 'Limpieza dental',
    categoria: 'Prevención',
    detalle:
      'Profilaxis profesional, control de placa bacteriana y técnicas de higiene para prevenir caries y sarro.',
    duracion: '45 min',
    imagen:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Dental_hygienist_at_work.jpg/960px-Dental_hygienist_at_work.jpg',
    precio: 120
  },
  {
    nombre: 'Ortodoncia',
    categoria: 'Alineación',
    detalle:
      'Brackets y alineadores transparentes para corregir la posición dental en niños, jóvenes y adultos.',
    duracion: '45 min',
    imagen:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/006_fixed_orthodontic_appliance.JPG/960px-006_fixed_orthodontic_appliance.JPG',
    precio: 350
  },
  {
    nombre: 'Blanqueamiento',
    categoria: 'Estética',
    detalle:
      'Aclaramiento dental seguro con resultados visibles desde la primera sesión y seguimiento profesional.',
    duracion: '60 min',
    imagen:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d2/Man_demonstrating_the_results_of_teeth-whitening.jpg/960px-Man_demonstrating_the_results_of_teeth-whitening.jpg',
    precio: 350
  },
  {
    nombre: 'Endodoncia',
    categoria: 'Especialidad',
    detalle:
      'Tratamiento de conducto que elimina la infección y alivia el dolor conservando tu pieza dental.',
    duracion: '60 min',
    imagen:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Dental_root_canal_treatment_process.jpg/960px-Dental_root_canal_treatment_process.jpg',
    precio: 400
  },
  {
    nombre: 'Implantes',
    categoria: 'Rehabilitación',
    detalle:
      'Reemplazo de piezas dentales perdidas con implantes fijos de titanio y coronas de alta estética.',
    duracion: '90 min',
    imagen:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1d/Dental-implant-illustration.jpg/960px-Dental-implant-illustration.jpg',
    precio: 1500
  },
  {
    nombre: 'Odontopediatría',
    categoria: 'Niños',
    detalle:
      'Atención especializada y cercana para los más pequeños, enfocada en prevención y hábitos saludables.',
    duracion: '40 min',
    imagen:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Child_during_dental_checkup_in_clinic_with_dentist_examining_teeth.jpg/960px-Child_during_dental_checkup_in_clinic_with_dentist_examining_teeth.jpg',
    precio: 80
  }
];

export function formatearSoles(monto: number | string): string {
  return `S/ ${Number(monto).toFixed(2)}`;
}
