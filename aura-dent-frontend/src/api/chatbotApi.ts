import { api } from "./axiosClient";

export const chatbotApi = {
  enviar: async (sesionId: string, mensaje: string) => {
    const { data } = await api.post("/chatbot/chat", { sesionId, mensaje });
    return data;
  },
  listarBase: async () => {
    const { data } = await api.get("/chatbot/base");
    return data;
  },
  crearBase: async (payload: {
    pregunta: string;
    respuesta: string;
    categoria: string;
  }) => {
    const { data } = await api.post("/chatbot/base", payload);
    return data;
  },
  actualizarBase: async (id: number, payload: any) => {
    const { data } = await api.put(`/chatbot/base/${id}`, payload);
    return data;
  },
  desactivarBase: async (id: number) => {
    await api.delete(`/chatbot/base/${id}`);
  },
  bitacora: async () => {
    const { data } = await api.get("/chatbot/bitacora");
    return data;
  },
};
