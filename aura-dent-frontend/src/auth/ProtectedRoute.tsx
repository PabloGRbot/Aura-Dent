import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface Props {
  children: ReactNode;
  rolesPermitidos?: number[];
}

export const ProtectedRoute = ({ children, rolesPermitidos }: Props) => {
  const { estaAutenticado, user } = useAuth();
  if (!estaAutenticado) return <Navigate to="/login" replace />;
  if (rolesPermitidos && user && !rolesPermitidos.includes(user.rol)) {
    return <Navigate to="/sin-acceso" replace />;
  }
  return <>{children}</>;
};
