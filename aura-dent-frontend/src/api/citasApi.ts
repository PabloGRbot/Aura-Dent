import { api } from "./axiosClient";
import type { Cita } from "../types";

export const citasApi = {
  reservar: async (payload: {
    servicioId: number;
    odontologoId: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
  }) => {
    const { data } = await api.post("/citas/reservar", payload);
    return data;
  },
  misCitas: async (): Promise<Cita[]> => {
    const { data } = await api.get("/citas/mis-citas");
    return data;
  },
  cancelar: async (id: string, motivo: string) => {
    const { data } = await api.post(`/citas/${id}/cancelar`, { motivo });
    return data;
  },
  reprogramar: async (
    id: string,
    payload: { fecha: string; horaInicio: string; horaFin: string },
  ) => {
    const { data } = await api.post(`/citas/${id}/reprogramar`, payload);
    return data;
  },
  agendaOdontologo: async (
    odontologoId: string,
    fecha: string,
  ): Promise<Cita[]> => {
    const { data } = await api.get("/citas/agenda", {
      params: { odontologoId, fecha },
    });
    return data;
  },
  marcarAtendida: async (id: string) => {
    const { data } = await api.post(`/citas/${id}/atender`);
    return data;
  },
  listarTodas: async (): Promise<Cita[]> => {
    const { data } = await api.get("/citas/admin/todas");
    return data;
  },
};
