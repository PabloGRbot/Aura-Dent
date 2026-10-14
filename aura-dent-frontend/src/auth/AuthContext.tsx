import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { authApi } from "../api/authApi";

interface AuthUser {
  id: string;
  rol: number;
  nombres: string;
  correo: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (datos: Partial<AuthUser>) => void;
  estaAutenticado: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const u = localStorage.getItem("usuario");
      return u ? (JSON.parse(u) as AuthUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );

  const login = async (correo: string, password: string) => {
    const data = await authApi.login(correo, password);
    const u: AuthUser = {
      id: data.usuario.id,
      rol: data.usuario.rolId,
      nombres: data.usuario.nombres,
      correo: data.usuario.correo,
    };
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(u));
    setToken(data.token);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setToken(null);
    setUser(null);
  };

  const updateUser = (datos: Partial<AuthUser>) => {
    setUser((actual) => {
      if (!actual) return actual;
      const nuevo = { ...actual, ...datos };
      localStorage.setItem("usuario", JSON.stringify(nuevo));
      return nuevo;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, updateUser, estaAutenticado: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
