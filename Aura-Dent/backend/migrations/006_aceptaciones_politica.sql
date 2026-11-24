CREATE TABLE aceptaciones_politica (
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  version TEXT NOT NULL,
  aceptada_en TIMESTAMPTZ NOT NULL,
  registrada_por UUID REFERENCES usuarios(id),
  PRIMARY KEY(usuario_id,version)
);
INSERT INTO aceptaciones_politica(usuario_id,version,aceptada_en,registrada_por)
  SELECT id,politica_version,politica_aceptada_en,politica_aceptada_por FROM usuarios
  WHERE politica_version IS NOT NULL AND politica_aceptada_en IS NOT NULL;
CREATE TRIGGER aceptaciones_inmutables BEFORE UPDATE OR DELETE ON aceptaciones_politica FOR EACH ROW EXECUTE FUNCTION impedir_borrado_historial();
