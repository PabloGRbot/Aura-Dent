import * as dotenv from 'dotenv';

dotenv.config();

export const variablesEntorno = {
  puerto: Number(process.env.PORT ?? 3000),
  postgres: {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    puerto: Number(process.env.POSTGRES_PORT ?? 5432),
    usuario: process.env.POSTGRES_USER ?? 'postgres',
    contrasena: process.env.POSTGRES_PASSWORD ?? 'postgres',
    baseDatos: process.env.POSTGRES_DB ?? 'auradent',
    ssl: process.env.POSTGRES_SSL === 'true'
  },
  jwt: {
    secreto: process.env.JWT_SECRET ?? 'cambia-este-secreto-en-produccion',
    expiraEn: process.env.JWT_EXPIRA_EN ?? '8h'
  },
  correo: {
    host: process.env.CORREO_HOST ?? 'smtp.gmail.com',
    puerto: Number(process.env.CORREO_PORT ?? 587),
    usuario: process.env.CORREO_USER ?? '',
    contrasena: process.env.CORREO_PASSWORD ?? '',
    remitente: process.env.CORREO_REMITENTE ?? 'no-reply@auradent.com'
  },
  pagoQr: {
    urlBase: process.env.PAGO_QR_URL ?? 'http://localhost:4000',
    apiKey: process.env.PAGO_QR_API_KEY ?? ''
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    modelo: process.env.GEMINI_MODELO ?? 'gemini-3.5-flash'
  }
};
