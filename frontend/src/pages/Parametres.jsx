import React, { useState, useEffect } from "react";
import translations from "../locales/translations.json";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1`;

// --- Style pour les inputs lisibles sur fond bleu ---
const inputBlueStyle = {
  width: "100%",
  padding: "8px 12px",
  backgroundColor: "#0B2535", // Fond bleu foncé
  color: "#FFFFFF",            // Texte lisible en blanc
  caretColor: "#FFFFFF",       // Curseur de frappe en blanc
  border: "1px solid #007791",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: "500",
  outline: "none",
  boxSizing: "border-box"
};

const inputDisabledStyle = {
  ...inputBlueStyle,
  backgroundColor: "#081B27", // Bleu plus sombre pour l'état désactivé
  color: "#9CA3AF",            // Texte légèrement grisé
  border: "1px solid #1E3A8A",
  cursor: "not-allowed"
};

export default function Parametres({ 
  user, 
  lang = "fr", 
  activeSubTab = "compte", // "compte", "password" ou "affichage"
  onUpdateUser, 
  onLanguageChange 
}) {
  const t = translations[lang] || translations["fr"];

  // --- États pour le Profil ---
  const [profileData, setProfileData] = useState({
    nom: user?.nom || "",
    prenom: user?.prenom || "Jean",
    im: user?.im || user?.im_dag_rh || "",
    type_user: user?.type_user || "DAG / RH"
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // --- États pour le Mot de passe ---
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // --- États pour les Préférences UI ---
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("ged_theme") === "dark";
  });
  const [selectedLang, setSelectedLang] = useState(lang);

  // --- Messages de notification ---
  const [message, setMessage] = useState({ type: "", text: "" });

  // Effet pour appliquer le mode sombre global
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("ged_theme", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("ged_theme", "light");
    }
  }, [darkMode]);

  // Synchronisation avec les props user
  useEffect(() => {
    if (user) {
      setProfileData({
        nom: user.nom || "",
        prenom: user.prenom || "",
        im: user.im || user.im_dag_rh || "",
        type_user: user.type_user || "DAG / RH"
      });
    }
  }, [user]);

  const showNotification = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || user?.im || user?.im_dag_rh || "";
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-User-IM": token
    };
  };

  // --- Mettre à jour le profil ---
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nom: profileData.nom,
          prenom: profileData.prenom
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        showNotification("success", "Profil mis à jour avec succès !");
        if (onUpdateUser) onUpdateUser(updatedUser);
      } else {
        const errorData = await response.json().catch(() => ({}));
        showNotification("error", errorData.detail || "Échec de la mise à jour du profil.");
      }
    } catch (err) {
      console.error("Erreur mise à jour profil :", err);
      showNotification("success", "Profil enregistré localement.");
      if (onUpdateUser) onUpdateUser({ ...user, ...profileData });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // --- Mettre à jour le mot de passe ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification("error", "Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showNotification("error", "Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/change-password`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          old_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });

      if (response.ok) {
        showNotification("success", "Mot de passe modifié avec succès !");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const errorData = await response.json().catch(() => ({}));
        showNotification("error", errorData.detail || "Échec du changement de mot de passe.");
      }
    } catch (err) {
      console.error("Erreur changement mot de passe :", err);
      showNotification("error", "Erreur de connexion au serveur.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // --- Changement de langue ---
  const handleLanguageSelect = (newLang) => {
    setSelectedLang(newLang);
    if (onLanguageChange) onLanguageChange(newLang);
  };

  return (
    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "10px", padding: "28px", border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      
      {/* Styles CSS injectés pour la couleur du placeholder et du remplissage automatique */}
      <style>{`
        input::placeholder {
          color: #9CA3AF !important;
          opacity: 0.8;
        }
        input:-webkit-autofill {
          -webkit-text-fill-color: #FFFFFF !important;
          -webkit-box-shadow: 0 0 0px 1000px #0B2535 inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* En-tête */}
      <div style={{ marginBottom: "24px", borderBottom: "1px solid #E5E7EB", paddingBottom: "16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0B2535", margin: "0 0 4px 0" }}>
          {activeSubTab === "compte" && "Paramètres de compte"}
          {activeSubTab === "password" && "Réinitialisation de mot de passe"}
          {activeSubTab === "affichage" && "Paramètres d'affichage"}
          {!["compte", "password", "affichage"].includes(activeSubTab) && (t.nav?.settings || "Paramètres du Système")}
        </h2>
        <p style={{ fontSize: "13px", color: "#007791", margin: 0 }}>
          Gérez vos informations personnelles, votre sécurité et l'apparence de l'application.
        </p>
      </div>

      {/* Alerte de notification */}
      {message.text && (
        <div style={{
          padding: "10px 14px",
          borderRadius: "6px",
          marginBottom: "20px",
          fontSize: "13px",
          fontWeight: "600",
          backgroundColor: message.type === "success" ? "#DEF7EC" : "#FDE8E8",
          color: message.type === "success" ? "#03543F" : "#9B1C1C",
          border: `1px solid ${message.type === "success" ? "#84E1BC" : "#F8B4B4"}`
        }}>
          <i className={`bi ${message.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"}`} style={{ marginRight: "8px" }}></i>
          {message.text}
        </div>
      )}

      <div>
        
        {/* ================= 1. SECTION : PARAMÈTRES DE COMPTE ================= */}
        {activeSubTab === "compte" && (
          <div style={{ padding: "20px", backgroundColor: "#F9FAFB", borderRadius: "8px", border: "1px solid #E5E7EB", maxWidth: "600px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0B2535", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="bi bi-person-lines-fill" style={{ color: "#007791" }}></i> Informations du Profil
            </h3>
            
            <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#4B5563", marginBottom: "4px" }}>Prénom</label>
                <input
                  type="text"
                  value={profileData.prenom}
                  onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })}
                  style={inputBlueStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#4B5563", marginBottom: "4px" }}>Nom</label>
                <input
                  type="text"
                  placeholder="Votre nom de famille"
                  value={profileData.nom}
                  onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                  style={inputBlueStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#4B5563", marginBottom: "4px" }}>Identifiant / Matricule (IM)</label>
                <input
                  type="text"
                  disabled
                  value={profileData.im}
                  style={inputDisabledStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#4B5563", marginBottom: "4px" }}>Rôle / Service</label>
                <input
                  type="text"
                  disabled
                  value={profileData.type_user}
                  style={inputDisabledStyle}
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                style={{
                  marginTop: "8px",
                  padding: "9px 16px",
                  backgroundColor: "#0B2535",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <i className="bi bi-save"></i>
                {isUpdatingProfile ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </form>
          </div>
        )}

        {/* ================= 2. SECTION : RÉINITIALISATION DE MOT DE PASSE ================= */}
        {activeSubTab === "password" && (
          <div style={{ padding: "20px", backgroundColor: "#F9FAFB", borderRadius: "8px", border: "1px solid #E5E7EB", maxWidth: "600px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0B2535", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="bi bi-shield-lock-fill" style={{ color: "#007791" }}></i> Sécurité & Mot de passe
            </h3>

            <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#4B5563", marginBottom: "4px" }}>Mot de passe actuel</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  style={inputBlueStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#4B5563", marginBottom: "4px" }}>Nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  style={inputBlueStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#4B5563", marginBottom: "4px" }}>Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  style={inputBlueStyle}
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                style={{
                  marginTop: "8px",
                  padding: "9px 16px",
                  backgroundColor: "#007791",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <i className="bi bi-key-fill"></i>
                {isUpdatingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </button>
            </form>
          </div>
        )}

        {/* ================= 3. SECTION : AFFICHAGE & CONFIGURATION ================= */}
        {activeSubTab === "affichage" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px" }}>

            {/* Apparence */}
            <div style={{ padding: "20px", backgroundColor: "#F9FAFB", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0B2535", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="bi bi-palette-fill" style={{ color: "#007791" }}></i> Apparence & Préférences
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Option Mode Sombre */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                  <div>
                    <strong style={{ display: "block", fontSize: "13px", color: "#111827" }}>Mode Sombre</strong>
                    <span style={{ fontSize: "12px", color: "#6B7280" }}>Basculer le thème visuel de l'interface</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDarkMode(!darkMode)}
                    style={{
                      width: "50px",
                      height: "26px",
                      backgroundColor: darkMode ? "#0B2535" : "#D1D5DB",
                      borderRadius: "13px",
                      border: "none",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background-color 0.2s"
                    }}
                  >
                    <div style={{
                      width: "20px",
                      height: "20px",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "50%",
                      position: "absolute",
                      top: "3px",
                      left: darkMode ? "27px" : "3px",
                      transition: "left 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      color: darkMode ? "#0B2535" : "#6B7280"
                    }}>
                      <i className={`bi ${darkMode ? "bi-moon-fill" : "bi-sun-fill"}`}></i>
                    </div>
                  </button>
                </div>

                {/* Option Langue de l'interface */}
                <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "14px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#4B5563", marginBottom: "8px" }}>
                    Langue de l'application
                  </label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => handleLanguageSelect("fr")}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "6px",
                        border: selectedLang === "fr" ? "2px solid #007791" : "1px solid #D1D5DB",
                        backgroundColor: selectedLang === "fr" ? "#EAF2F5" : "#FFFFFF",
                        color: "#0B2535",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      🇫🇷 Français
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLanguageSelect("mg")}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "6px",
                        border: selectedLang === "mg" ? "2px solid #007791" : "1px solid #D1D5DB",
                        backgroundColor: selectedLang === "mg" ? "#EAF2F5" : "#FFFFFF",
                        color: "#0B2535",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      🇲🇬 Malagasy
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Configuration Réseau */}
            <div style={{ padding: "20px", backgroundColor: "#F9FAFB", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#0B2535", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="bi bi-hdd-network-fill" style={{ color: "#007791" }}></i> Configuration Réseau & Backend
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#4B5563", marginBottom: "4px" }}>
                    Point d'accès API (FastAPI)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={API_BASE_URL}
                    style={inputDisabledStyle}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#4B5563", marginBottom: "4px" }}>
                    Version GED District
                  </label>
                  <input
                    type="text"
                    disabled
                    value="v1.0.0-production (District Haute Matsiatra)"
                    style={inputDisabledStyle}
                  />
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}