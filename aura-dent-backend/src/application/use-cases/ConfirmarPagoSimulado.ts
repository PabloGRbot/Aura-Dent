import { randomUUID } from "crypto";
import { Cita } from "../../domain/entities/Cita";
import { Pago } from "../../domain/entities/Pago";
import { CitaRepository } from "../../domain/ports/CitaRepository";
import { PagoRepository } from "../../domain/ports/PagoRepository";

export class ConfirmarPagoSimulado {
  constructor(
    private citaRepo: CitaRepository,
    private pagoRepo: PagoRepository,
  ) {}

  async ejecutar(codigoReserva: string, metodoPago: string = "tarjeta_demo") {
    // 1. Buscar la cita por código de reserva
    const cita = await this.citaRepo.buscarPorCodigo(codigoReserva);
    if (!cita) throw new Error("Cita no encontrada");

    // 2. Validar que esté en estado retenido (2)
    if (cita.estadoId !== 2) {
      throw new Error("La cita no está pendiente de pago");
    }

    // 3. Validar que no haya expirado
    if (cita.fechaExpiracion && cita.fechaExpiracion < new Date()) {
      throw new Error("El tiempo de pago ha expirado");
    }

    // 4. Confirmar la cita
    cita.estadoId = 3; // confirmada
    cita.fechaExpiracion = null;
    await this.citaRepo.actualizar(cita);
    await this.citaRepo.registrarHistorial(
      cita.id,
      2,
      3,
      null,
      "Pago confirmado (simulado)",
    );

    // 5. Registrar el pago
    const codigoOperacion =
      "SIM-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const pago = new Pago(
      randomUUID(),
      cita.id,
      20.0, // monto de reserva (podría venir del servicio)
      metodoPago,
      codigoOperacion,
      2, // completado
      new Date(),
    );
    await this.pagoRepo.crear(pago);
    await this.pagoRepo.registrarHistorial(
      pago.id,
      1,
      2,
      "Pago simulado exitoso",
    );

    return {
      mensaje: "Pago confirmado exitosamente",
      cita: {
        id: cita.id,
        codigoReserva: cita.codigoReserva,
        estadoId: cita.estadoId,
        fecha: cita.fecha,
        horaInicio: cita.horaInicio,
        horaFin: cita.horaFin,
      },
      pago: {
        id: pago.id,
        monto: pago.monto,
        metodoPago: pago.metodoPago,
        codigoOperacion: pago.codigoOperacion,
        fechaPago: pago.fechaPago,
      },
    };
  }
}
