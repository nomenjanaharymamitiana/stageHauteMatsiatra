import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";      // Pour RH et DAG
import DashboardRSI from "./pages/DashboardRSI"; // Pour RSI

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  // Si non connecté -> Afficher la page de Login
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Récupération du rôle
  const userRole = user.type_user || user.role;

  // 1. Si l'utilisateur est RSI -> Afficher le Dashboard RSI
  if (userRole === "RSI") {
    return <DashboardRSI user={user} onLogout={handleLogout} />;
  }

  // 2. Si l'utilisateur est DAG ou RH -> Afficher le Dashboard commun
  return <Dashboard user={user} onLogout={handleLogout} />;
}