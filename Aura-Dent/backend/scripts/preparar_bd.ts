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
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
  referencia_qr VARCHAR(120)
);

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
  moneda: 'PEN'
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
    rol: 'Paciente'
  }
];

const PASSWORD_DEMO = 'demo1234';

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
        `INSERT INTO usuarios (id, nombres, apellidos, email, password_hash, dni_ce, fecha_nacimiento, alergias, rol)
          VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, $7)
          ON CONFLICT (email) DO NOTHING`,
        [
          usuario.id,
          usuario.nombres,
          usuario.apellidos,
          usuario.email,
          passwordHash,
          usuario.dniCe,
          usuario.rol
        ]
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
