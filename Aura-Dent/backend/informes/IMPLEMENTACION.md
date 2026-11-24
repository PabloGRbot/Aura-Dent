# Citas, trazabilidad y rendimiento

Política implementada: `2026-10-23`. Se conservan los cuatro pasos de reserva, sus indicadores circulares y el diseño general.

## Reglas y datos

- Reservas sin pagar: vencen a los 15 minutos y pasan a `VENCIDA`; cancelar pasa a `CANCELADA`. Se conservan citas y pagos, anulando únicamente los pagos pendientes.
- Cambios múltiples durante el día del primer pago, antes de medianoche de Lima y del inicio. Se mantienen servicio, duración y adelanto.
- Devolución del adelanto aprobado durante ese mismo día antes del inicio, o cuando quedan al menos 48 horas exactas. Se usa la fecha más temprana entre la cita original y actual. Cambiar la cita no renueva beneficios.
- La elegibilidad queda registrada al solicitar la devolución; recogerla después no la recalcula. Recepción registra la entrega con referencia. Una cancelación por la clínica permite devolver fuera del plazo; la inasistencia, registrada después del horario, no genera devolución.
- Los pagos son simulados. Saldos y pagos únicos no se convierten automáticamente en adelantos reembolsables.
- Reservas antiguas sin vencimiento conservan ese dato vacío. No se inventan eventos, precios ni fechas. Un saldo posterior no concede un nuevo día de cambios si la fecha del primer pago es desconocida.
- Se conserva la aceptación expresa de cada versión de política, incluso si se recoge presencialmente. Los usuarios se desactivan y sus tokens anteriores dejan de autorizar operaciones.
- Odontopediatría ocupa un bloque de 45 minutos para mantener la cuadrícula de 15 minutos, aunque su referencia clínica publicada sea de 40 minutos.

## Migraciones e integridad

Se creó un respaldo PostgreSQL custom en `.respaldos/` (ignorado por Git), se restauró en otra base y se verificaron conteos coincidentes: 30 citas, 27 pagos, 16 usuarios, 7 comprobantes y 3 notas. La base de verificación se retiró al terminar.

Las migraciones numeradas se registran en `migraciones`, se serializan con un bloqueo y se ejecutan individualmente en transacciones. `db:migrate` no ejecuta semillas; `db:setup` se reserva para instalaciones demo.

Los eventos se guardan dentro de las transacciones. Incluyen actor, rol, motivo, operación y datos operativos anteriores/nuevos, sin copiar contenido clínico ni credenciales. Eventos y aceptaciones no admiten edición o borrado mediante la aplicación.

La creación de cita/pago, confirmación, cambios, cancelación, devolución y atención comparten transacción y conexión. Hay protección de solapamientos y bloqueos por odontólogo. Los correlativos se incrementan atómicamente; la emisión manual también se serializa por cita.

El proceso de vencimiento corre cada 60 segundos, hasta 200 reservas por ejecución, con `SKIP LOCKED` y sin ejecuciones superpuestas por instancia. Disponibilidad ignora vencidas aunque el proceso aún no haya registrado el cambio. Las consultas normales no disparan limpiezas globales.

## API y paneles

| Función | Ruta |
|---|---|
| Política pública | `GET /api/politica-citas` |
| Consultar / aceptar versión | `GET /api/usuarios/me/politica`, `POST /api/usuarios/me/politica` |
| Aceptación presencial | `POST /api/usuarios/:id/politica` (personal) |
| Disponibilidad | `GET /api/citas/disponibilidad?odontologoId=...&dia=YYYY-MM-DD&duracion=30` |
| Cancelar | `POST /api/citas/:id/cancelar`, con motivo, solicitarDevolucion y porClinica |
| Reprogramar | `POST /api/citas/:id/reprogramar`, con fecha ISO y odontologoId |
| Inasistencia | `POST /api/citas/:id/inasistencia` (personal) |
| Auditoría | `GET /api/citas/:id/eventos` |
| Devoluciones / entrega | `GET /api/devoluciones`, `POST /api/devoluciones/:id/entregar`, con referencia |
| Reportes | `GET /api/reportes/resumen?periodo=mes` (también semana o anio) |
| Conteos | `GET /api/panel/resumen`, filtrado por rol |

`DELETE /api/citas/:id` conserva compatibilidad y cancela lógicamente reservas sin pago aprobado. El flujo anterior de reservas/QR sigue operativo con autenticación y propiedad de la cita. La IA mantiene consultas públicas.

Listados: `pagina` desde 1, `limite` 50 por defecto y máximo 100, orden estable. Pacientes/usuarios/agenda/pagos aceptan `q`; pacientes admiten `odontologoFiltro`. “Mis citas” acepta `seccion=proximas|historial|atendidas`, aplicada antes de paginar. Los selectores buscan en el servidor y las citas incluyen acciones y límites calculados allí.

Cada paciente accede solo a sus citas, movimientos y devoluciones. El odontólogo consulta movimientos de citas asignadas; recepción y administración gestionan las operaciones de la clínica.

## Reportes y verificación

Los cobros usan `pagos.monto` y `pagado_en`; las devoluciones, la fecha de entrega. No se multiplica el precio del catálogo por cada pago. Los cobros antiguos sin fecha se identifican aparte. PostgreSQL agrega importes y el navegador recibe puntos del gráfico y una página de detalle. “Mis citas” utiliza dos consultas acotadas sin N+1. Se añadieron índices y filtros por intervalos; se mantiene autovacuum sin `VACUUM FULL`, particiones o servicios adicionales.

Desde `backend`:

```powershell
npm run db:backup
npm run db:migrate
$env:PROBAR_POSTGRES='1'
npm test -- --runInBand
node -r ts-node/register/transpile-only scripts/verificar_paneles.ts
npm run db:benchmark
```

`POSTGRES_BIN` configura la carpeta de ejecutables de PostgreSQL. Los respaldos son privados y permanecen fuera de Git. Las pruebas de integración crean esquemas propios y los retiran al terminar.

La revisión sobre la base local realizó 27 lecturas de paneles, todas con respuesta 200. La revisión visual usa Edge/Playwright con API sintética: 18 pantallas/variantes y diálogos de cancelar/editar, sin crear citas reales. Se revisaron capturas de escritorio y móvil y se corrigió el texto estrecho en móvil. Resultados en `frontend/.revision/`, ignorado por Git. El script admite `PLAYWRIGHT_MODULE`, `BROWSER_BIN` y `URL_REVISION`.

`rendimiento.json` contiene hardware, muestras y planes `EXPLAIN (ANALYZE, BUFFERS)`: medición local, caché caliente y 20 muestras secuenciales por escenario. No representa carga de usuarios concurrentes ni latencia de producción. Los esquemas sintéticos de 100.000 y 1.000.000 de citas abarcan tres años y se retiran al terminar.

La reversión funcional debe usar una migración posterior que conserve datos; restaurar el respaldo sobre operaciones nuevas requiere conciliarlas previamente.
