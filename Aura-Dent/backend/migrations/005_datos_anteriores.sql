CREATE OR REPLACE FUNCTION preservar_primer_pago_desconocido() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM pagos WHERE cita_id=NEW.id AND estado='APROBADO' AND pagado_en IS NULL) THEN
    NEW.primer_pago_en:=NULL;
  END IF;
  RETURN NEW;
END $$;
UPDATE citas SET primer_pago_en=primer_pago_en WHERE primer_pago_en IS NOT NULL
  AND EXISTS(SELECT 1 FROM pagos WHERE cita_id=citas.id AND estado='APROBADO' AND pagado_en IS NULL);
CREATE INDEX idx_pagos_sin_fecha ON pagos(cita_id) INCLUDE(monto) WHERE estado='APROBADO' AND pagado_en IS NULL;
