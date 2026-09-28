import React, { useState } from "react";

export default function Sidebar({ activeSubTab, setActiveSubTab }) {
  // État pour savoir si le sous-menu "Paramètres" est déroulé
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside style={{ width: "250px", backgroundColor: "#0B2535", color: "#FFF", minHeight: "100vh", padding: "16px" }}>
      <nav>
        {/* BOUTON PRINCIPAL PARAMÈTRES */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 14px",
            backgroundColor: "#007791",
            color: "#FFF",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          <span><i className="bi bi-gear-fill" style={{ marginRight: "8px" }}></i> Paramètres</span>
          <i className={`bi bi-chevron-${isOpen ? "up" : "down"}`}></i>
        </button>

        {/* LISTE DES 3 SOUS-MENUS */}
        {isOpen && (
          <ul style={{ listStyle: "none", paddingLeft: "16px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            
            {/* 1. Paramètres de compte */}
            <li>
              <button
                onClick={() => setActiveSubTab("compte")}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeSubTab === "compte" ? "rgba(255,255,255,0.2)" : "transparent",
                  color: activeSubTab === "compte" ? "#38BDF8" : "#E5E7EB",
                  fontWeight: activeSubTab === "compte" ? "bold" : "normal"
                }}
              >
                <i className="bi bi-person-fill" style={{ marginRight: "8px" }}></i>
                Paramètres de compte
              </button>
            </li>

            {/* 2. Réinitialisation de mot de passe */}
            <li>
              <button
                onClick={() => setActiveSubTab("password")}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeSubTab === "password" ? "rgba(255,255,255,0.2)" : "transparent",
                  color: activeSubTab === "password" ? "#38BDF8" : "#E5E7EB",
                  fontWeight: activeSubTab === "password" ? "bold" : "normal"
                }}
              >
                <i className="bi bi-key-fill" style={{ marginRight: "8px" }}></i>
                Réinitialisation de mot de passe
              </button>
            </li>

            {/* 3. Affichage */}
            <li>
              <button
                onClick={() => setActiveSubTab("affichage")}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeSubTab === "affichage" ? "rgba(255,255,255,0.2)" : "transparent",
                  color: activeSubTab === "affichage" ? "#38BDF8" : "#E5E7EB",
                  fontWeight: activeSubTab === "affichage" ? "bold" : "normal"
                }}
              >
                <i className="bi bi-palette-fill" style={{ marginRight: "8px" }}></i>
                Affichage
              </button>
            </li>

          </ul>
        )}
      </nav>
    </aside>
  );
}