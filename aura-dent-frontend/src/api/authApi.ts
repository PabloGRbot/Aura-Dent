import { api } from "./axiosClient";

export const authApi = {
  login: async (correo: string, password: string) => {
    const { data } = await api.post("/auth/login", { correo, password });
    return data;
  },
  registro: async (payload: {
    nombres: string;
    apellidos: string;
    documento: string;
    telefono: string;
    correo: string;
    password: string;
  }) => {
    const { data } = await api.post("/auth/registro", payload);
    return data;
  },
};
