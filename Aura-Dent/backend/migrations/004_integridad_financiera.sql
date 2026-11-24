-- Si existía un pago aprobado sin fecha, un saldo posterior no prueba la fecha del primero.
CREATE FUNCTION preservar_primer_pago_desconocido() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.primer_pago_en IS NULL AND EXISTS(SELECT 1 FROM pagos WHERE cita_id=NEW.id AND estado='APROBADO' AND pagado_en IS NULL) THEN
    NEW.primer_pago_en:=NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER zzz_citas_pago_desconocido BEFORE UPDATE ON citas FOR EACH ROW EXECUTE FUNCTION preservar_primer_pago_desconocido();

CREATE FUNCTION proteger_pago_aprobado() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.estado='APROBADO' AND
    ROW(NEW.estado,NEW.monto,NEW.moneda,NEW.tipo,NEW.metodo,NEW.cita_id) IS DISTINCT FROM
    ROW(OLD.estado,OLD.monto,OLD.moneda,OLD.tipo,OLD.metodo,OLD.cita_id) THEN
    RAISE EXCEPTION 'El pago aprobado es histórico; registre una devolución separada' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER pagos_importe_historico BEFORE UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION proteger_pago_aprobado();
