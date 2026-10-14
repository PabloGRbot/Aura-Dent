import cron from "node-cron";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { NotificarCita } from "../../../application/use-cases/NotificarCita";

/**
 * Tareas programadas (RNF11 y RF17):
 *  - Recordatorios de cita al paciente (diario 08:00).
 *  - Respaldo automático de la base de datos (diario 02:00).
 */
export const iniciarTareasProgramadas = (notificar: NotificarCita): void => {
  console.log(
    "⏰ Tareas programadas activas: recordatorios 08:00, respaldo 02:00",
  );

  // RF17: recordatorios de las citas confirmadas para el día siguiente
  cron.schedule("0 8 * * *", async () => {
    try {
      const enviados = await notificar.recordatoriosManana();
      console.log(`🔔 Recordatorios enviados: ${enviados}`);
    } catch (error: any) {
      console.error("❌ Error al enviar recordatorios:", error.message);
    }
  });

  // RNF11: copia de seguridad diaria de la base de datos
  cron.schedule("0 2 * * *", () => ejecutarRespaldo());
};

function ejecutarRespaldo(): void {
  const dir = path.join(process.cwd(), "db", "backups");
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* ignora */
  }

  const fecha = new Date().toISOString().slice(0, 10);
  const archivo = path.join(dir, `auradent_${fecha}.sql`);

  const dump = process.env.PG_DUMP_PATH || "pg_dump";
  const args = [
    "-h",
    process.env.DB_HOST || "localhost",
    "-p",
    process.env.DB_PORT || "5432",
    "-U",
    process.env.DB_USER || "postgres",
    "-d",
    process.env.DB_NAME || "AuraDent",
    "-f",
    archivo,
  ];

  execFile(
    dump,
    args,
    { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD || "" } },
    (error: any) => {
      if (error) {
        console.warn(
          "⚠️ No se pudo generar el respaldo automático:",
          error.message,
        );
        return;
      }
      console.log("💾 Respaldo generado:", archivo);
    },
  );
}
