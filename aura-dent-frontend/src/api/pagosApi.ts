import { api } from "./axiosClient";

export const pagosApi = {
  listar: async () => {
    const { data } = await api.get("/pagos");
    return data;
  },
  porCita: async (citaId: string) => {
    const { data } = await api.get(`/pagos/cita/${citaId}`);
    return data;
  },
};
