import { api } from "./axiosClient";

export const usuarioApi = {
  actualizarPerfil: async (payload: {
    nombres?: string;
    apellidos?: string;
    telefono?: string;
    correo?: string;
    passwordNueva?: string;
  }) => {
    const { data } = await api.put("/usuarios/perfil", payload);
    return data;
  },
};
