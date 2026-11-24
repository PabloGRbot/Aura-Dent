-- No se asignan fechas ficticias a los registros anteriores.
ALTER TABLE usuarios ADD COLUMN activo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE usuarios ADD COLUMN politica_version TEXT;
ALTER TABLE usuarios ADD COLUMN politica_aceptada_en TIMESTAMPTZ;
ALTER TABLE citas ADD COLUMN creado_en TIMESTAMPTZ;
ALTER TABLE citas ALTER COLUMN creado_en SET DEFAULT now();
ALTER TABLE citas ADD COLUMN fecha_original TIMESTAMPTZ;
ALTER TABLE citas ADD COLUMN primer_pago_en TIMESTAMPTZ;
ALTER TABLE citas ADD COLUMN cancelada_en TIMESTAMPTZ;
ALTER TABLE citas ADD COLUMN politica_version TEXT;
ALTER TABLE citas ADD COLUMN precio_referencial NUMERIC(10,2);
ALTER TABLE pagos ADD COLUMN creado_en TIMESTAMPTZ;
ALTER TABLE pagos ALTER COLUMN creado_en SET DEFAULT now();
-- Solo se recupera información que ya estaba registrada.
UPDATE citas c SET primer_pago_en = p.fecha FROM
  (SELECT cita_id, min(pagado_en) fecha FROM pagos WHERE estado = 'APROBADO' GROUP BY cita_id) p
  WHERE c.id = p.cita_id;

CREATE TABLE devoluciones (
  id UUID PRIMARY KEY,
  cita_id UUID NOT NULL UNIQUE REFERENCES citas(id),
  monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  estado TEXT NOT NULL CHECK (estado IN ('PENDIENTE_ENTREGA', 'ENTREGADA')),
  solicitada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  solicitada_por UUID REFERENCES usuarios(id),
  entregada_en TIMESTAMPTZ,
  entregada_por UUID REFERENCES usuarios(id),
  referencia TEXT,
  motivo TEXT NOT NULL
);
CREATE TABLE eventos_cita (
  id BIGSERIAL PRIMARY KEY,
  cita_id UUID NOT NULL REFERENCES citas(id),
  tipo TEXT NOT NULL,
  ocurrido_en TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  actor_id UUID REFERENCES usuarios(id),
  actor_rol TEXT NOT NULL,
  motivo TEXT,
  operacion TEXT NOT NULL,
  antes JSONB,
  despues JSONB
);
CREATE INDEX idx_eventos_cita_fecha ON eventos_cita(cita_id, ocurrido_en, id);
CREATE INDEX idx_pagos_cita ON pagos(cita_id, pagado_en, id);
CREATE INDEX idx_pagos_cobros_fecha ON pagos(pagado_en) INCLUDE(monto) WHERE estado = 'APROBADO';
CREATE INDEX idx_citas_paciente_fecha ON citas(paciente_id, fecha DESC, id);
CREATE INDEX idx_comprobantes_pago ON comprobantes(pago_id);
CREATE INDEX idx_comprobantes_cita ON comprobantes(cita_id);
CREATE INDEX idx_notas_cita_fecha ON notas_clinicas(cita_id, creado_en);
CREATE INDEX idx_usuarios_rol_nombre ON usuarios(rol, apellidos, nombres, id) WHERE activo;
CREATE INDEX idx_devoluciones_entregadas ON devoluciones(entregada_en) INCLUDE(monto) WHERE estado = 'ENTREGADA';
CREATE INDEX idx_devoluciones_pendientes ON devoluciones(solicitada_en) INCLUDE(monto) WHERE estado = 'PENDIENTE_ENTREGA';

CREATE FUNCTION registrar_evento_cita(cid UUID, evento TEXT, anterior JSONB, siguiente JSONB)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO eventos_cita(cita_id,tipo,actor_id,actor_rol,motivo,operacion,antes,despues)
  VALUES(cid,evento,nullif(current_setting('aura.actor_id',true),'')::uuid,
    coalesce(nullif(current_setting('aura.actor_rol',true),''),'Sistema'),
    nullif(current_setting('aura.motivo',true),''),
    coalesce(nullif(current_setting('aura.operacion',true),''),txid_current()::text),anterior,siguiente);
END $$;

CREATE FUNCTION proteger_agenda() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE doctor UUID;
BEGIN
  -- El mismo bloqueo protege altas, asignaciones y reprogramaciones, incluidas rutas antiguas.
  IF TG_OP='INSERT' OR NEW.fecha IS DISTINCT FROM OLD.fecha OR NEW.odontologo_id IS DISTINCT FROM OLD.odontologo_id THEN
  FOR doctor IN SELECT DISTINCT d FROM unnest(ARRAY[NEW.odontologo_id,
    CASE WHEN TG_OP='UPDATE' THEN OLD.odontologo_id ELSE NULL END]) d WHERE d IS NOT NULL ORDER BY d
  LOOP PERFORM pg_advisory_xact_lock(hashtextextended(doctor::text, 0)); END LOOP;
  END IF;
  IF TG_OP='INSERT' THEN NEW.fecha_original := NEW.fecha; END IF;
  IF TG_OP='UPDATE' THEN
    IF OLD.estado IN ('CANCELADA','VENCIDA','ATENDIDA','NO_ASISTIO') AND
       (NEW.estado <> OLD.estado OR NEW.fecha <> OLD.fecha OR NEW.odontologo_id IS DISTINCT FROM OLD.odontologo_id) THEN
      RAISE EXCEPTION 'La cita finalizada no se puede reactivar' USING ERRCODE='23514';
    END IF;
    NEW.fecha_original := OLD.fecha_original;
    IF OLD.primer_pago_en IS NOT NULL THEN NEW.primer_pago_en := OLD.primer_pago_en; END IF;
  END IF;
  IF NEW.estado='CANCELADA' AND NEW.cancelada_en IS NULL THEN NEW.cancelada_en := now(); END IF;
  IF NEW.estado IN ('CONFIRMADA','TEMPORAL','PENDIENTE_PAGO') AND NEW.odontologo_id IS NOT NULL
     AND (NEW.estado='CONFIRMADA' OR NEW.expira_en IS NULL OR NEW.expira_en > now())
     AND EXISTS(SELECT 1 FROM citas c WHERE c.id<>NEW.id AND c.odontologo_id=NEW.odontologo_id
       AND (c.estado='CONFIRMADA' OR (c.estado IN ('TEMPORAL','PENDIENTE_PAGO') AND (c.expira_en IS NULL OR c.expira_en>now())))
       AND c.fecha < NEW.fecha + make_interval(mins=>NEW.duracion_minutos)
       AND c.fecha + make_interval(mins=>c.duracion_minutos) > NEW.fecha) THEN
    RAISE EXCEPTION 'El odontólogo ya tiene una reserva en ese horario' USING ERRCODE='23P01';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER citas_integridad BEFORE INSERT OR UPDATE ON citas FOR EACH ROW EXECUTE FUNCTION proteger_agenda();

CREATE FUNCTION auditar_cita() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE anterior JSONB; siguiente JSONB; evento TEXT;
BEGIN
  siguiente := jsonb_build_object('estado',NEW.estado,'fecha',NEW.fecha,'odontologoId',NEW.odontologo_id,'pagoId',NEW.pago_id);
  IF TG_OP='INSERT' THEN evento:='CREACION';
  ELSE
    anterior:=jsonb_build_object('estado',OLD.estado,'fecha',OLD.fecha,'odontologoId',OLD.odontologo_id,'pagoId',OLD.pago_id);
    IF anterior=siguiente THEN RETURN NEW; END IF;
    evento:=CASE WHEN NEW.estado='CANCELADA' THEN 'CANCELACION' WHEN NEW.estado='VENCIDA' THEN 'VENCIMIENTO'
      WHEN NEW.estado='NO_ASISTIO' THEN 'INASISTENCIA' WHEN NEW.estado='ATENDIDA' THEN 'ATENCION'
      WHEN NEW.fecha<>OLD.fecha OR NEW.odontologo_id IS DISTINCT FROM OLD.odontologo_id THEN 'MODIFICACION' ELSE 'ESTADO' END;
  END IF;
  PERFORM registrar_evento_cita(NEW.id,evento,anterior,siguiente);
  RETURN NEW;
END $$;
CREATE TRIGGER citas_auditoria AFTER INSERT OR UPDATE ON citas FOR EACH ROW EXECUTE FUNCTION auditar_cita();

CREATE FUNCTION auditar_pago() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE anterior JSONB; cita citas%ROWTYPE;
BEGIN
  SELECT * INTO cita FROM citas WHERE id=NEW.cita_id FOR UPDATE;
  IF NEW.estado='APROBADO' THEN
    IF cita.estado IN ('CANCELADA','VENCIDA','NO_ASISTIO') OR
      (cita.estado IN ('TEMPORAL','PENDIENTE_PAGO') AND cita.expira_en<=now()) THEN
      RAISE EXCEPTION 'La reserva ya no admite pagos' USING ERRCODE='23514';
    END IF;
    IF TG_OP='UPDATE' AND OLD.estado='APROBADO' THEN NEW.pagado_en:=OLD.pagado_en; END IF;
    UPDATE citas SET primer_pago_en=coalesce(primer_pago_en,NEW.pagado_en) WHERE id=NEW.cita_id;
  END IF;
  IF TG_OP='UPDATE' THEN
    anterior:=jsonb_build_object('pagoId',OLD.id,'estado',OLD.estado,'monto',OLD.monto,'pagadoEn',OLD.pagado_en);
    IF OLD.estado=NEW.estado AND OLD.monto=NEW.monto THEN RETURN NEW; END IF;
    IF OLD.estado='APROBADO' AND NEW.estado<>'APROBADO' THEN
      RAISE EXCEPTION 'Un pago aprobado se conserva; registre una devolución' USING ERRCODE='23514';
    END IF;
  END IF;
  PERFORM registrar_evento_cita(NEW.cita_id,'PAGO',anterior,
    jsonb_build_object('pagoId',NEW.id,'estado',NEW.estado,'monto',NEW.monto,'pagadoEn',NEW.pagado_en));
  RETURN NEW;
END $$;
CREATE TRIGGER pagos_auditoria BEFORE INSERT OR UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION auditar_pago();

CREATE FUNCTION auditar_devolucion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM registrar_evento_cita(NEW.cita_id,CASE WHEN NEW.estado='ENTREGADA' THEN 'DEVOLUCION_ENTREGADA' ELSE 'DEVOLUCION_SOLICITADA' END,
    CASE WHEN TG_OP='UPDATE' THEN jsonb_build_object('estado',OLD.estado) ELSE NULL END,
    jsonb_build_object('devolucionId',NEW.id,'estado',NEW.estado,'monto',NEW.monto));
  RETURN NEW;
END $$;
CREATE TRIGGER devoluciones_auditoria AFTER INSERT OR UPDATE ON devoluciones FOR EACH ROW EXECUTE FUNCTION auditar_devolucion();

CREATE FUNCTION impedir_borrado_historial() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'El historial se conserva; utilice estados' USING ERRCODE='23514'; END $$;
CREATE TRIGGER citas_no_borrar BEFORE DELETE ON citas FOR EACH ROW EXECUTE FUNCTION impedir_borrado_historial();
CREATE TRIGGER pagos_no_borrar BEFORE DELETE ON pagos FOR EACH ROW EXECUTE FUNCTION impedir_borrado_historial();
CREATE TRIGGER eventos_inmutables BEFORE UPDATE OR DELETE ON eventos_cita FOR EACH ROW EXECUTE FUNCTION impedir_borrado_historial();
CREATE TRIGGER devoluciones_no_borrar BEFORE DELETE ON devoluciones FOR EACH ROW EXECUTE FUNCTION impedir_borrado_historial();
