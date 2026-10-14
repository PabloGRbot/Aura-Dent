import { useEffect, useState } from "react";
import { serviciosApi } from "../../api/serviciosApi";
import { citasApi } from "../../api/citasApi";
import { api } from "../../api/axiosClient";
import { hoyLocalISO } from "../../utils/fechas";
import type { Servicio } from "../../types";

export const Agendar = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [odontologos, setOdontologos] = useState<any[]>([]);
  const [servicioSel, setServicioSel] = useState<number | null>(null);
  const [odontologoSel, setOdontologoSel] = useState<string>("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [citaCreada, setCitaCreada] = useState<any>(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [error, setError] = useState("");
  const [pagando, setPagando] = useState(false);

  // Cargar servicios y odontólogos
  useEffect(() => {
    serviciosApi
      .listar()
      .then(setServicios)
      .catch(() => setServicios([]));

    api
      .get("/odontologos")
      .then((r) => {
        setOdontologos(r.data);
        if (r.data[0]) setOdontologoSel(r.data[0].id);
      })
      .catch(() => setOdontologos([]));
  }, []);

  // Cuenta regresiva
  useEffect(() => {
    if (!citaCreada || citaCreada.pagoConfirmado) return;
    const restante = () =>
      Math.max(
        0,
        new Date(citaCreada.cita.fechaExpiracion).getTime() - Date.now(),
      );
    setTiempoRestante(restante());
    const t = setInterval(() => {
      const r = restante();
      setTiempoRestante(r);
      if (r <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [citaCreada]);

  const reservar = async () => {
    setError("");
    if (!servicioSel || !fecha || !hora || !odontologoSel) {
      setError("Completa todos los campos");
      return;
    }
    const serv = servicios.find((s) => s.id === servicioSel)!;
    const [h, m] = hora.split(":").map(Number);
    const finMin = h * 60 + m + serv.duracionMinutos;
    const fin = `${String(Math.floor(finMin / 60)).padStart(2, "0")}:${String(
      finMin % 60,
    ).padStart(2, "0")}`;

    try {
      const data = await citasApi.reservar({
        servicioId: servicioSel,
        odontologoId: odontologoSel,
        fecha,
        horaInicio: hora,
        horaFin: fin,
      });
      setCitaCreada(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al reservar");
    }
  };

  const simularPago = async () => {
    setPagando(true);
    try {
      const r = await api.post("/pagos/simular", {
        codigoReserva: citaCreada.cita.codigoReserva,
        metodoPago: "tarjeta_demo",
      });
      setCitaCreada({
        ...citaCreada,
        pagoConfirmado: true,
        comprobante: r.data.pago,
      });
    } catch (err: any) {
      alert(err.response?.data?.error || "Error al procesar el pago");
    } finally {
      setPagando(false);
    }
  };

  const formato = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const seg = Math.floor((ms % 60000) / 1000);
    return `${min}:${String(seg).padStart(2, "0")}`;
  };

  // ============ PANTALLA DE PAGO CONFIRMADO ============
  if (citaCreada?.pagoConfirmado) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
        <div className="text-center mb-6">
          <div className="text-6xl mb-2">✅</div>
          <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
            ¡Pago confirmado!
          </h2>
          <p className="text-slate-500 mt-1">
            Tu cita fue registrada exitosamente
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl mb-4 space-y-2 text-sm">
          <p>
            <strong>Código:</strong> {citaCreada.cita.codigoReserva}
          </p>
          <p>
            <strong>Fecha:</strong> {citaCreada.cita.fecha}
          </p>
          <p>
            <strong>Hora:</strong> {citaCreada.cita.horaInicio} -{" "}
            {citaCreada.cita.horaFin}
          </p>
          <p>
            <strong>Monto pagado:</strong> S/{" "}
            {citaCreada.comprobante?.monto || "20.00"}
          </p>
          <p>
            <strong>Método:</strong> {citaCreada.comprobante?.metodoPago}
          </p>
          <p>
            <strong>Operación:</strong>{" "}
            {citaCreada.comprobante?.codigoOperacion}
          </p>
        </div>

        <button
          onClick={() => (window.location.href = "/paciente/citas")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold"
        >
          Ver mis citas
        </button>
      </div>
    );
  }

  // ============ PANTALLA DE RESERVA CREADA (PENDIENTE PAGO) ============
  if (citaCreada) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">
          ✅ Reserva temporal creada
        </h2>
        <p className="text-slate-500 mb-4">
          Código:{" "}
          <strong className="text-blue-600">
            {citaCreada.cita.codigoReserva}
          </strong>
        </p>

        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-xl mb-4">
          <p className="text-yellow-800 dark:text-yellow-300 font-semibold">
            ⏱ Tiempo para pagar: {formato(tiempoRestante)}
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
            Si no pagas a tiempo, el turno se libera automáticamente.
          </p>
        </div>

        {citaCreada.pago?.qr && (
          <img
            src={citaCreada.pago.qr}
            alt="QR de pago"
            className="mx-auto w-48 h-48 mb-4"
          />
        )}

        <button
          onClick={simularPago}
          disabled={pagando}
          className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {pagando ? "Procesando..." : "💳 Pagar ahora (simulado)"}
        </button>

        <button
          onClick={() => setCitaCreada(null)}
          className="w-full mt-2 text-slate-500 text-sm hover:underline"
        >
          Cancelar y volver
        </button>
      </div>
    );
  }

  // ============ FORMULARIO DE AGENDAMIENTO ============
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        📅 Agendar cita
      </h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow">
        <label className="block mb-4">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Servicio
          </span>
          <select
            value={servicioSel ?? ""}
            onChange={(e) => setServicioSel(Number(e.target.value))}
            className="w-full mt-1 p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            <option value="">-- Selecciona un servicio --</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} — S/ {s.precio} (Reserva: S/ {s.montoReserva})
              </option>
            ))}
          </select>
        </label>

        <label className="block mb-4">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Odontólogo
          </span>
          <select
            value={odontologoSel}
            onChange={(e) => setOdontologoSel(e.target.value)}
            className="w-full mt-1 p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            {odontologos.length === 0 && (
              <option value="">Cargando odontólogos...</option>
            )}
            {odontologos.map((o) => (
              <option key={o.id} value={o.id}>
                Dr(a). {o.nombres} {o.apellidos} — {o.numero_colegiatura}
              </option>
            ))}
          </select>
        </label>

        <label className="block mb-4">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Fecha
          </span>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            min={hoyLocalISO()}
            className="w-full mt-1 p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </label>

        <label className="block mb-6">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Hora
          </span>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full mt-1 p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </label>

        <button
          onClick={reservar}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold"
        >
          Reservar turno
        </button>
      </div>
    </div>
  );
};
