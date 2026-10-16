import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { crearConexionPostgres } from '../src/infraestructura/adaptadores/salida/base_datos_postgres/conexion_postgres';
import { variablesEntorno } from '../src/infraestructura/configuracion/variables_entorno';

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  dni_ce VARCHAR(20) NOT NULL UNIQUE,
  fecha_nacimiento DATE,
  alergias TEXT,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('Paciente','Recepcion','Odontologo','Administrador')),
  odontologo_asignado_id UUID REFERENCES usuarios(id),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS odontologo_asignado_id UUID REFERENCES usuarios(id);

CREATE TABLE IF NOT EXISTS citas (
  id UUID PRIMARY KEY,
  paciente_id UUID NOT NULL REFERENCES usuarios(id),
  odontologo_id UUID REFERENCES usuarios(id),
  fecha TIMESTAMPTZ NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  servicio VARCHAR(100),
  estado VARCHAR(30) NOT NULL,
  pago_id UUID
);

ALTER TABLE citas ALTER COLUMN odontologo_id DROP NOT NULL;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS servicio VARCHAR(100);

CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY,
  cita_id UUID NOT NULL REFERENCES citas(id),
  monto NUMERIC(10,2) NOT NULL,
  estado VARCHAR(20) NOT NULL,
  moneda VARCHAR(3) NOT NULL DEFAULT 'PEN',
  metodo VARCHAR(20) NOT NULL DEFAULT 'QR',
  tipo VARCHAR(20) NOT NULL DEFAULT 'UNICO',
  referencia_qr VARCHAR(120),
  pagado_en TIMESTAMPTZ
);
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS metodo VARCHAR(20) NOT NULL DEFAULT 'QR';
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) NOT NULL DEFAULT 'UNICO';
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS pagado_en TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS configuracion (
  clave VARCHAR(60) PRIMARY KEY,
  valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notas_clinicas (
  id UUID PRIMARY KEY,
  cita_id UUID NOT NULL REFERENCES citas(id),
  odontologo_id UUID NOT NULL REFERENCES usuarios(id),
  contenido TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comprobantes (
  id UUID PRIMARY KEY,
  pago_id UUID NOT NULL REFERENCES pagos(id),
  cita_id UUID NOT NULL REFERENCES citas(id),
  tipo VARCHAR(10) NOT NULL,
  serie VARCHAR(10) NOT NULL,
  correlativo INTEGER NOT NULL,
  ruc_cliente VARCHAR(11),
  razon_social VARCHAR(150),
  subtotal NUMERIC(10,2) NOT NULL,
  igv NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  moneda VARCHAR(3) NOT NULL DEFAULT 'PEN',
  estado VARCHAR(20) NOT NULL DEFAULT 'EMITIDO',
  emitido_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  anulado_en TIMESTAMPTZ,
  UNIQUE(serie, tipo, correlativo)
);

CREATE TABLE IF NOT EXISTS series_comprobante (
  tipo VARCHAR(10) NOT NULL,
  serie VARCHAR(10) NOT NULL,
  ultimo_correlativo INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tipo, serie)
);
`;

const CONFIGURACION_DEMO: Record<string, string> = {
  nombre_establecimiento: 'Aura-Dent',
  direccion: 'Av. Los Álamos 123, Miraflores',
  ubicacion_mapa:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3900.857953121273!2d-77.03035868465102!3d-12.123570791414038!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c818cd4c5f2b%3A0x82c27f1a16cfa4ab!2sMiraflores%2C%20Lima%2C%20Per%C3%BA!5e0!3m2!1ses!2spe!4v1700000000000!5m2!1ses!2spe',
  telefono: '(01) 555-0123',
  email_contacto: 'contacto@auradent.com',
  duracion_cita: '30',
  adelanto_reserva: '10',
  moneda: 'PEN',
  hora_apertura: '08:00',
  hora_cierre: '20:00',
  hora_inicio_almuerzo: '12:00',
  hora_fin_almuerzo: '14:00',
  sabado_apertura: '08:00',
  sabado_cierre: '12:00',
  domingo_cerrado: 'true'
};

const USUARIOS_DEMO = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombres: 'Ana',
    apellidos: 'Administradora',
    email: 'admin@auradent.com',
    dniCe: '00000001',
    rol: 'Administrador'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombres: 'Oscar',
    apellidos: 'Odontólogo',
    email: 'odontologo@auradent.com',
    dniCe: '00000002',
    rol: 'Odontologo'
  },
  {
    id: '22222222-2222-2222-2222-222222222223',
    nombres: 'Lucía',
    apellidos: 'Odontóloga Dos',
    email: 'odontologo2@auradent.com',
    dniCe: '00000005',
    rol: 'Odontologo'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nombres: 'Rosa',
    apellidos: 'Recepción',
    email: 'recepcion@auradent.com',
    dniCe: '00000003',
    rol: 'Recepcion'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    nombres: 'Pablo',
    apellidos: 'Paciente',
    email: 'paciente@auradent.com',
    dniCe: '00000004',
    rol: 'Paciente',
    odontologoAsignadoId: '22222222-2222-2222-2222-222222222222'
  },
  {
    id: '44444444-4444-4444-4444-444444444445',
    nombres: 'Carla',
    apellidos: 'Ríos',
    email: 'carla.rios@auradent.com',
    dniCe: '00000006',
    rol: 'Paciente',
    odontologoAsignadoId: '22222222-2222-2222-2222-222222222222'
  },
  {
    id: '44444444-4444-4444-4444-444444444446',
    nombres: 'Diego',
    apellidos: 'Torres',
    email: 'diego.torres@auradent.com',
    dniCe: '00000007',
    rol: 'Paciente',
    odontologoAsignadoId: '22222222-2222-2222-2222-222222222222'
  },
  {
    id: '44444444-4444-4444-4444-444444444447',
    nombres: 'María',
    apellidos: 'Flores',
    email: 'maria.flores@auradent.com',
    dniCe: '00000008',
    rol: 'Paciente',
    odontologoAsignadoId: '22222222-2222-2222-2222-222222222223'
  },
  {
    id: '44444444-4444-4444-4444-444444444448',
    nombres: 'José',
    apellidos: 'Ramírez',
    email: 'jose.ramirez@auradent.com',
    dniCe: '00000009',
    rol: 'Paciente',
    odontologoAsignadoId: '22222222-2222-2222-2222-222222222223'
  }
];

const PASSWORD_DEMO = 'demo1234';

const PAGOS_DEMO = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    citaId: '10000000-0000-0000-0000-000000000001',
    monto: 80,
    estado: 'APROBADO',
    metodo: 'EFECTIVO',
    tipo: 'UNICO',
    referenciaQr: null as string | null,
    diasAtras: 1
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    citaId: '10000000-0000-0000-0000-000000000002',
    monto: 120,
    estado: 'APROBADO',
    metodo: 'YAPE',
    tipo: 'UNICO',
    referenciaQr: 'YAPE-0002',
    diasAtras: 2
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    citaId: '10000000-0000-0000-0000-000000000003',
    monto: 350,
    estado: 'APROBADO',
    metodo: 'TARJETA',
    tipo: 'SALDO',
    referenciaQr: 'CIP-0003',
    diasAtras: 3
  },
  {
    id: '20000000-0000-0000-0000-000000000004',
    citaId: '10000000-0000-0000-0000-000000000004',
    monto: 90,
    estado: 'APROBADO',
    metodo: 'QR',
    tipo: 'UNICO',
    referenciaQr: 'QR-0004',
    diasAtras: 4
  }
];

const COMPROBANTES_DEMO = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    pagoId: '20000000-0000-0000-0000-000000000001',
    citaId: '10000000-0000-0000-0000-000000000001',
    tipo: 'BOLETA',
    serie: 'B001',
    correlativo: 1,
    rucCliente: null as string | null,
    razonSocial: null as string | null,
    subtotal: 65.6,
    igv: 14.4,
    total: 80,
    estado: 'EMITIDO',
    diasAtras: 1,
    anuladoDiasAtras: null as number | null
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    pagoId: '20000000-0000-0000-0000-000000000002',
    citaId: '10000000-0000-0000-0000-000000000002',
    tipo: 'BOLETA',
    serie: 'B001',
    correlativo: 2,
    rucCliente: null as string | null,
    razonSocial: null as string | null,
    subtotal: 98.4,
    igv: 21.6,
    total: 120,
    estado: 'EMITIDO',
    diasAtras: 2,
    anuladoDiasAtras: null as number | null
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    pagoId: '20000000-0000-0000-0000-000000000003',
    citaId: '10000000-0000-0000-0000-000000000003',
    tipo: 'FACTURA',
    serie: 'F001',
    correlativo: 1,
    rucCliente: '20123456789',
    razonSocial: 'Clínica Dental Demo S.A.C.',
    subtotal: 287,
    igv: 63,
    total: 350,
    estado: 'EMITIDO',
    diasAtras: 3,
    anuladoDiasAtras: null as number | null
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    pagoId: '20000000-0000-0000-0000-000000000004',
    citaId: '10000000-0000-0000-0000-000000000004',
    tipo: 'BOLETA',
    serie: 'B001',
    correlativo: 3,
    rucCliente: null as string | null,
    razonSocial: null as string | null,
    subtotal: 73.8,
    igv: 16.2,
    total: 90,
    estado: 'ANULADO',
    diasAtras: 4,
    anuladoDiasAtras: 2
  }
];

const SERIES_DEMO = [
  { tipo: 'BOLETA', serie: 'B001', ultimoCorrelativo: 3 },
  { tipo: 'FACTURA', serie: 'F001', ultimoCorrelativo: 1 }
];

async function asegurarBaseDatos(): Promise<void> {
  const { host, puerto, usuario, contrasena, ssl, baseDatos } = variablesEntorno.postgres;
  const administrador = new Pool({
    host,
    port: puerto,
    user: usuario,
    password: contrasena,
    database: 'postgres',
    ssl: ssl ? { rejectUnauthorized: false } : false
  });

  try {
    const { rows } = await administrador.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      baseDatos
    ]);
    if (rows.length === 0) {
      await administrador.query(`CREATE DATABASE "${baseDatos}"`);
      console.log(`Base de datos "${baseDatos}" creada.`);
    }
  } finally {
    await administrador.end();
  }
}

async function principal(): Promise<void> {
  await asegurarBaseDatos();

  const pool = crearConexionPostgres();
  try {
    await pool.query(ESQUEMA);

    const passwordHash = await bcrypt.hash(PASSWORD_DEMO, 10);

    for (const usuario of USUARIOS_DEMO) {
      await pool.query(
        `INSERT INTO usuarios (id, nombres, apellidos, email, password_hash, dni_ce, fecha_nacimiento, alergias, rol, odontologo_asignado_id)
          VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, $7, $8)
          ON CONFLICT (email) DO UPDATE SET
            nombres = EXCLUDED.nombres,
            apellidos = EXCLUDED.apellidos,
            dni_ce = EXCLUDED.dni_ce,
            rol = EXCLUDED.rol,
            odontologo_asignado_id = EXCLUDED.odontologo_asignado_id`,
        [
          usuario.id,
          usuario.nombres,
          usuario.apellidos,
          usuario.email,
          passwordHash,
          usuario.dniCe,
          usuario.rol,
          usuario.odontologoAsignadoId ?? null
        ]
      );
    }

    const hoy = new Date();
    hoy.setHours(10, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    manana.setHours(11, 0, 0, 0);
    const pasado = new Date(hoy);
    pasado.setDate(pasado.getDate() + 2);
    pasado.setHours(15, 0, 0, 0);

    const citasDemo = [
      {
        id: '10000000-0000-0000-0000-000000000001',
        pacienteId: '44444444-4444-4444-4444-444444444444',
        odontologoId: '22222222-2222-2222-2222-222222222222',
        fecha: hoy.toISOString(),
        duracionMinutos: 30,
        servicio: 'Consulta general',
        estado: 'CONFIRMADA'
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        pacienteId: '44444444-4444-4444-4444-444444444445',
        odontologoId: '22222222-2222-2222-2222-222222222222',
        fecha: manana.toISOString(),
        duracionMinutos: 30,
        servicio: 'Limpieza dental',
        estado: 'CONFIRMADA'
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        pacienteId: '44444444-4444-4444-4444-444444444446',
        odontologoId: '22222222-2222-2222-2222-222222222222',
        fecha: pasado.toISOString(),
        duracionMinutos: 45,
        servicio: 'Blanqueamiento',
        estado: 'CONFIRMADA'
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        pacienteId: '44444444-4444-4444-4444-444444444447',
        odontologoId: '22222222-2222-2222-2222-222222222223',
        fecha: hoy.toISOString(),
        duracionMinutos: 30,
        servicio: 'Consulta general',
        estado: 'CONFIRMADA'
      },
      {
        id: '10000000-0000-0000-0000-000000000005',
        pacienteId: '44444444-4444-4444-4444-444444444448',
        odontologoId: '22222222-2222-2222-2222-222222222223',
        fecha: manana.toISOString(),
        duracionMinutos: 30,
        servicio: 'Empaste',
        estado: 'CONFIRMADA'
      }
    ];

    for (const c of citasDemo) {
      await pool.query(
        `INSERT INTO citas (id, paciente_id, odontologo_id, fecha, duracion_minutos, servicio, estado, pago_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)
          ON CONFLICT (id) DO NOTHING`,
        [c.id, c.pacienteId, c.odontologoId, c.fecha, c.duracionMinutos, c.servicio, c.estado]
      );
    }

    const diasAtras = (dias: number): Date => new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

    for (const pago of PAGOS_DEMO) {
      await pool.query(
        `INSERT INTO pagos (id, cita_id, monto, estado, moneda, metodo, tipo, referencia_qr, pagado_en)
          VALUES ($1, $2, $3, $4, 'PEN', $5, $6, $7, $8)
          ON CONFLICT DO NOTHING`,
        [
          pago.id,
          pago.citaId,
          pago.monto,
          pago.estado,
          pago.metodo,
          pago.tipo,
          pago.referenciaQr,
          diasAtras(pago.diasAtras)
        ]
      );
    }

    for (const comprobante of COMPROBANTES_DEMO) {
      await pool.query(
        `INSERT INTO comprobantes (id, pago_id, cita_id, tipo, serie, correlativo, ruc_cliente,
          razon_social, subtotal, igv, total, moneda, estado, emitido_en, anulado_en)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PEN', $12, $13, $14)
          ON CONFLICT DO NOTHING`,
        [
          comprobante.id,
          comprobante.pagoId,
          comprobante.citaId,
          comprobante.tipo,
          comprobante.serie,
          comprobante.correlativo,
          comprobante.rucCliente,
          comprobante.razonSocial,
          comprobante.subtotal,
          comprobante.igv,
          comprobante.total,
          comprobante.estado,
          diasAtras(comprobante.diasAtras),
          comprobante.anuladoDiasAtras === null ? null : diasAtras(comprobante.anuladoDiasAtras)
        ]
      );
    }

    for (const serie of SERIES_DEMO) {
      await pool.query(
        `INSERT INTO series_comprobante (tipo, serie, ultimo_correlativo)
          VALUES ($1, $2, $3)
          ON CONFLICT (tipo, serie) DO UPDATE
            SET ultimo_correlativo = GREATEST(series_comprobante.ultimo_correlativo, EXCLUDED.ultimo_correlativo)`,
        [serie.tipo, serie.serie, serie.ultimoCorrelativo]
      );
    }

    for (const [clave, valor] of Object.entries(CONFIGURACION_DEMO)) {
      await pool.query(
        `INSERT INTO configuracion (clave, valor) VALUES ($1, $2)
          ON CONFLICT (clave) DO NOTHING`,
        [clave, valor]
      );
    }

    console.log('Base de datos preparada correctamente.');
    console.log(`Usuarios demo (contraseña: ${PASSWORD_DEMO}):`);
    for (const usuario of USUARIOS_DEMO) {
      console.log(`  - ${usuario.rol}: ${usuario.email}`);
    }
  } finally {
    await pool.end();
  }
}

principal().catch((error) => {
  console.error('Error al preparar la base de datos:', error);
  process.exit(1);
});
