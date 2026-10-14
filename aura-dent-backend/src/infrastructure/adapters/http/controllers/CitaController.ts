import { Request, Response } from "express";
import { CrearCitaRetenida } from "../../../../application/use-cases/CrearCitaRetenida";
import { ListarCitasPaciente } from "../../../../application/use-cases/ListarCitasPaciente";
import { CancelarCita } from "../../../../application/use-cases/CancelarCita";
import { ReprogramarCita } from "../../../../application/use-cases/ReprogramarCita";
import { ListarAgendaOdontologo } from "../../../../application/use-cases/ListarAgendaOdontologo";
import { MarcarCitaAtendida } from "../../../../application/use-cases/MarcarCitaAtendida";
import { GestionGlobalCitas } from "../../../../application/use-cases/GestionGlobalCitas";

export class CitaController {
  constructor(
    private crearUC: CrearCitaRetenida,
    private listarPacienteUC: ListarCitasPaciente,
    private cancelarUC: CancelarCita,
    private reprogramarUC: ReprogramarCita,
    private agendaUC: ListarAgendaOdontologo,
    private marcarAtendidaUC: MarcarCitaAtendida,
    private gestionGlobalUC: GestionGlobalCitas,
  ) {}

  // POST /api/citas/reservar
  reservar = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { servicioId, odontologoId, fecha, horaInicio, horaFin } = req.body;

      // Pasamos usuarioId (no pacienteId)
      const cita = await this.crearUC.ejecutar({
        usuarioId: user.id, // <-- el JWT tiene el usuario.id
        odontologoId,
        servicioId: Number(servicioId),
        fecha: new Date(fecha),
        horaInicio,
        horaFin,
      });

      res.status(201).json({
        cita: {
          id: cita.id,
          codigoReserva: cita.codigoReserva,
          fecha: cita.fecha,
          horaInicio: cita.horaInicio,
          horaFin: cita.horaFin,
          estadoId: cita.estadoId,
          fechaExpiracion: cita.fechaExpiracion,
        },
        pago: {
          link: "https://pago-demo.aura-dent.pe/" + cita.codigoReserva,
          qr:
            "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" +
            cita.codigoReserva,
        },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // GET /api/citas/mis-citas
  misCitas = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const citas = await this.listarPacienteUC.ejecutar(user.id);
      res.json(citas);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // POST /api/citas/:id/cancelar
  cancelar = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { motivo } = req.body;
      const cita = await this.cancelarUC.ejecutar(
        req.params.id,
        user.id,
        motivo,
      );
      res.json(cita);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // POST /api/citas/:id/reprogramar
  reprogramar = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { fecha, horaInicio, horaFin } = req.body;
      const cita = await this.reprogramarUC.ejecutar({
        citaId: req.params.id,
        usuarioId: user.id,
        nuevaFecha: new Date(fecha),
        nuevaHoraInicio: horaInicio,
        nuevaHoraFin: horaFin,
      });
      res.json(cita);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // GET /api/citas/agenda?odontologoId=X&fecha=Y
  agenda = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const odontologoId = (req.query.odontologoId as string) || user.id;
      const fecha = req.query.fecha
        ? new Date(req.query.fecha as string)
        : new Date();
      const citas = await this.agendaUC.ejecutar(odontologoId, fecha);
      res.json(citas);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // POST /api/citas/:id/atender
  marcarAtendida = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const cita = await this.marcarAtendidaUC.ejecutar(req.params.id, user.id);
      res.json(cita);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // GET /api/citas/admin/todas
  listarTodas = async (_req: Request, res: Response): Promise<void> => {
    try {
      const citas = await this.gestionGlobalUC.listarTodas();
      res.json(citas);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
