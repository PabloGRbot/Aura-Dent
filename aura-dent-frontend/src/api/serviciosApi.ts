import { api } from "./axiosClient";
import type { Servicio } from "../types";

export const serviciosApi = {
  listar: async (): Promise<Servicio[]> => {
    const { data } = await api.get("/servicios");
    return data;
  },
  crear: async (payload: Partial<Servicio>) => {
    const { data } = await api.post("/servicios", payload);
    return data;
  },
  actualizar: async (id: number, payload: Partial<Servicio>) => {
    const { data } = await api.put(`/servicios/${id}`, payload);
    return data;
  },
  desactivar: async (id: number) => {
    await api.delete(`/servicios/${id}`);
  },
};
