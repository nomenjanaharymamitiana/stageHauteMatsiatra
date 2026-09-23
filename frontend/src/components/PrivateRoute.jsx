import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function PrivateRoute() {
  // Vérifie la présence du token d'authentification dans le stockage local
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  // S'il n'y a pas de token, rediriger immédiatement vers la page de connexion
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si le token existe, afficher la route demandée
  return <Outlet />;
}