ALTER TABLE usuarios ADD COLUMN politica_aceptada_por UUID REFERENCES usuarios(id);
ALTER TABLE notas_clinicas ADD COLUMN eliminado_en TIMESTAMPTZ;
CREATE INDEX idx_citas_estado_fecha ON citas(estado,fecha,id);
CREATE INDEX idx_citas_agenda_fecha ON citas(fecha,id) WHERE estado IN ('CONFIRMADA','ATENDIDA');
CREATE INDEX idx_usuarios_odontologo ON usuarios(odontologo_asignado_id,apellidos,nombres,id) WHERE activo AND rol='Paciente';

CREATE FUNCTION preservar_fecha_original() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Una fecha anterior conocida al primer cambio es un dato real, no una reconstrucción histórica.
  IF OLD.fecha_original IS NULL AND NEW.fecha IS DISTINCT FROM OLD.fecha THEN NEW.fecha_original:=OLD.fecha; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER zz_citas_fecha_original BEFORE UPDATE ON citas FOR EACH ROW EXECUTE FUNCTION preservar_fecha_original();

CREATE FUNCTION auditar_nota() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM registrar_evento_cita(NEW.cita_id,CASE WHEN NEW.eliminado_en IS NOT NULL THEN 'NOTA_RETIRADA' WHEN TG_OP='INSERT' THEN 'NOTA_CREADA' ELSE 'NOTA_EDITADA' END,
    NULL,jsonb_build_object('notaId',NEW.id));
  RETURN NEW;
END $$;
CREATE TRIGGER notas_auditoria AFTER INSERT OR UPDATE ON notas_clinicas FOR EACH ROW EXECUTE FUNCTION auditar_nota();
CREATE TRIGGER notas_no_borrar BEFORE DELETE ON notas_clinicas FOR EACH ROW EXECUTE FUNCTION impedir_borrado_historial();
