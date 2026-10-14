import { Request, Response } from "express";
import { ConfirmarPagoSimulado } from "../../../../application/use-cases/ConfirmarPagoSimulado";
import { ListarPagos } from "../../../../application/use-cases/ListarPagos";
import { NotificarCita } from "../../../../application/use-cases/NotificarCita";

export class PagoController {
  constructor(
    private confirmarUC: ConfirmarPagoSimulado,
    private listarUC: ListarPagos,
    private notificarUC?: NotificarCita,
  ) {}

  // POST /api/pagos/simular
  simular = async (req: Request, res: Response): Promise<void> => {
    try {
      const { codigoReserva, metodoPago } = req.body;
      if (!codigoReserva) {
        res.status(400).json({ error: "Falta el código de reserva" });
        return;
      }
      const resultado = await this.confirmarUC.ejecutar(
        codigoReserva,
        metodoPago || "tarjeta_demo",
      );

      // RF17 (deseable): confirmación por correo sin bloquear la respuesta
      if (this.notificarUC && resultado?.cita?.id) {
        this.notificarUC
          .confirmacion(resultado.cita.id)
          .catch((e) => console.error("Error notificando confirmación:", e));
      }

      res.json(resultado);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // GET /api/pagos
  listar = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.listarUC.todos());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // GET /api/pagos/cita/:citaId
  porCita = async (req: Request, res: Response): Promise<void> => {
    try {
      const pago = await this.listarUC.porCita(req.params.citaId);
      if (!pago) {
        res.status(404).json({ error: "No hay pago para esta cita" });
        return;
      }
      res.json(pago);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
