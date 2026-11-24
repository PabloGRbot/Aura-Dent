-- Añade vencimiento explícito a las citas pendientes de pago.
ALTER TABLE citas ADD COLUMN IF NOT EXISTS expira_en TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_citas_expiracion
  ON citas (expira_en)
  WHERE estado IN ('TEMPORAL', 'PENDIENTE_PAGO');

CREATE INDEX IF NOT EXISTS idx_citas_paciente_estado
  ON citas (paciente_id, estado);

CREATE INDEX IF NOT EXISTS idx_citas_odontologo_fecha
  ON citas (odontologo_id, fecha);

CREATE INDEX IF NOT EXISTS idx_pagos_estado
  ON pagos (estado);
