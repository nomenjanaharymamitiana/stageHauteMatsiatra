import React, { useState, useEffect } from "react";
import logoGed from "../assets/WhatsApp Image 2026-09-21 at 11.01.52.jpeg";
import "../styles/theme.css";
import DocumentUploadModal from "../components/DocumentUploadModal";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/documents`;

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("tableau");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // État pour la fenêtre modale de création
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // État pour suivre quel menu 3 points est ouvert
  const [openMenuId, setOpenMenuId] = useState(null);

  // Charger la liste des documents depuis l'API FastAPI
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(Array.isArray(data) ? data : data.documents || []);
      } else {
        console.error("Erreur HTTP :", response.status);
      }
    } catch (error) {
      console.error("Erreur de connexion à l'API :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Fermer le menu déroulant au clic n'importe où ailleurs sur la page
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Action : Supprimer un document
  const handleDelete = async (num_ref) => {
    setOpenMenuId(null);
    if (!window.confirm(`Voulez-vous vraiment supprimer le document ${num_ref} ?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(num_ref)}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setDocuments(documents.filter((doc) => doc.num_ref !== num_ref));
      } else {
        alert("Erreur lors de la suppression du document.");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
    }
  };

  // Action : Modifier
  const handleEdit = (doc) => {
    setOpenMenuId(null);
    alert(`Modification du document ${doc.num_ref}`);
  };

  const toggleMenu = (e, num_ref) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === num_ref ? null : num_ref);
  };

  return (
    <div className="layout-container">
      {/* SIDEBAR SOMBRE */}
      <aside className="sidebar">
        <div>
          <div className="brand-header">
            <img src={logoGed} alt="Logo GED" className="brand-logo-img" />
            <div>
              <h1 className="brand-title">Numérisation</h1>
              <p className="brand-subtitle">District Haute Matsiatra</p>
            </div>
          </div>

          <nav className="nav-menu">
            <button
              className={`nav-item ${activeTab === "tableau" ? "active" : ""}`}
              onClick={() => setActiveTab("tableau")}
            >
              <i className="bi bi-speedometer2"></i> Tableau de bord
            </button>
            <button
              className="nav-item"
              onClick={() => setIsModalOpen(true)}
            >
              <i className="bi bi-file-earmark-plus"></i> Nouveau dossier
            </button>
            <button
              className={`nav-item ${activeTab === "recherche" ? "active" : ""}`}
              onClick={() => setActiveTab("recherche")}
            >
              <i className="bi bi-search"></i> Recherche
            </button>
            <button
              className={`nav-item ${activeTab === "documents" ? "active" : ""}`}
              onClick={() => setActiveTab("documents")}
            >
              <i className="bi bi-folder2-open"></i> Documents
            </button>
            <button
              className={`nav-item ${activeTab === "parametres" ? "active" : ""}`}
              onClick={() => setActiveTab("parametres")}
            >
              <i className="bi bi-gear"></i> Paramètres
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <p style={{ margin: "0 0 4px 0" }}>
            <i className="bi bi-circle-fill" style={{ color: "#10b981", fontSize: "8px" }}></i> Système en ligne
          </p>
          <span style={{ color: "#64748b" }}>Version 1.0</span>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="search-bar">
            <i className="bi bi-search"></i>
            <input type="text" placeholder="Rechercher un dossier, une référence, un titre..." />
          </div>

          <div className="topbar-right">
            <i className="bi bi-bell" style={{ fontSize: "18px", cursor: "pointer" }}></i>
            <div className="user-profile">
              <div className="user-avatar-circle">
                {user?.prenom ? user.prenom.charAt(0).toUpperCase() : "M"}
              </div>
              <div style={{ fontSize: "13px" }}>
                <strong style={{ display: "block", color: "#0f172a" }}>
                  {user?.prenom || "Mamitiana"}
                </strong>
                <span style={{ color: "#64748b", fontSize: "11px" }}>
                  {user?.type_user || "Agent"}
                </span>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}
              title="Déconnexion"
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </header>

        <main className="content-body">
          <div className="greeting-row">
            <div>
              <h2 className="greeting-title">Bonjour {user?.prenom || "Mamitiana"} !</h2>
              <p className="greeting-sub">
                Bienvenue sur le système de numérisation et de gestion des dossiers.
              </p>
            </div>
            <div className="date-box">
              <i className="bi bi-calendar3"></i> {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          {/* CARTES STATISTIQUES */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#1e293b", color: "#fff" }}>
                <i className="bi bi-folder-fill"></i>
              </div>
              <div>
                <span className="stat-title">Total des documents</span>
                <div className="stat-val">{documents.length}</div>
                <span className="stat-trend" style={{ color: "#10b981" }}>
                  <i className="bi bi-arrow-up-short"></i> En base
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#10b981", color: "#fff" }}>
                <i className="bi bi-file-earmark-check-fill"></i>
              </div>
              <div>
                <span className="stat-title">Numérisés</span>
                <div className="stat-val">{documents.length}</div>
                <span className="stat-trend" style={{ color: "#10b981" }}>
                  <i className="bi bi-arrow-up-short"></i> 100%
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#f59e0b", color: "#fff" }}>
                <i className="bi bi-clock-history"></i>
              </div>
              <div>
                <span className="stat-title">En attente</span>
                <div className="stat-val">0</div>
                <span className="stat-trend" style={{ color: "#64748b" }}>À jour</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: "#6366f1", color: "#fff" }}>
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <div>
                <span className="stat-title">Archivés</span>
                <div className="stat-val">{documents.length}</div>
                <span className="stat-trend" style={{ color: "#10b981" }}>Disponibles</span>
              </div>
            </div>
          </div>

          {/* TABLEAU DES DOCUMENTS */}
          <div className="card-box" style={{ overflow: "visible" }}>
            <div className="card-box-header">
              <h3 className="card-box-title">Derniers documents enregistrés</h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  className="quick-access-btn" 
                  style={{ width: "auto", padding: "6px 12px", margin: 0, fontSize: "12px", backgroundColor: "#0f172a", color: "#fff" }}
                  onClick={() => setIsModalOpen(true)}
                >
                  <i className="bi bi-plus-lg"></i> Ajouter un document
                </button>
                <button 
                  className="quick-access-btn" 
                  style={{ width: "auto", padding: "6px 12px", margin: 0, fontSize: "12px" }}
                  onClick={fetchDocuments}
                >
                  <i className="bi bi-arrow-clockwise"></i> Actualiser
                </button>
              </div>
            </div>

            {loading ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Chargement des données...</p>
            ) : documents.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Aucun document enregistré en base.</p>
            ) : (
              <table className="documents-table">
                <thead>
                  <tr>
                    <th>N° Réf</th>
                    <th>Titre</th>
                    <th>Catégorie</th>
                    <th>Format</th>
                    <th>Date Num.</th>
                    <th>Année Réd.</th>
                    <th>Agent (IM)</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.num_ref}>
                      <td style={{ fontWeight: "600" }}>{doc.num_ref}</td>
                      <td>{doc.title}</td>
                      <td>{doc.cat}</td>
                      <td>
                        <span className="badge-status badge-cours">
                          {doc.format ? doc.format.toUpperCase() : "DOC"}
                        </span>
                      </td>
                      <td>{doc.date_num}</td>
                      <td>{doc.annee_redac}</td>
                      <td>{doc.im_dag_rh || "-"}</td>
                      <td style={{ textAlign: "right", position: "relative" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          
                          {/* Bouton Visualiser */}
                          <a
                            href={`${API_BASE_URL}/${encodeURIComponent(doc.num_ref)}/preview`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-visualiser"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              backgroundColor: "#f1f5f9",
                              color: "#0f172a",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "500",
                              textDecoration: "none",
                              border: "1px solid #cbd5e1"
                            }}
                          >
                            <i className="bi bi-eye"></i> Visualiser
                          </a>

                          {/* Bouton 3 Points (...) */}
                          <button
                            onClick={(e) => toggleMenu(e, doc.num_ref)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "4px 8px",
                              fontSize: "16px",
                              color: "#64748b",
                              borderRadius: "4px"
                            }}
                            title="Plus d'options"
                          >
                            <i className="bi bi-three-dots-vertical"></i>
                          </button>

                          {/* Menu déroulant au clic sur les 3 points */}
                          {openMenuId === doc.num_ref && (
                            <div
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "100%",
                                marginTop: "4px",
                                backgroundColor: "#ffffff",
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                                zIndex: 50,
                                width: "140px",
                                textAlign: "left",
                                overflow: "hidden"
                              }}
                            >
                              <a
                                href={`${API_BASE_URL}/${encodeURIComponent(doc.num_ref)}/download`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "8px 12px",
                                  fontSize: "13px",
                                  color: "#334155",
                                  textDecoration: "none",
                                  cursor: "pointer"
                                }}
                              >
                                <i className="bi bi-download" style={{ color: "#0284c7" }}></i> Télécharger
                              </a>

                              <button
                                onClick={() => handleEdit(doc)}
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "8px 12px",
                                  fontSize: "13px",
                                  color: "#334155",
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer"
                                }}
                              >
                                <i className="bi bi-pencil" style={{ color: "#eab308" }}></i> Modifier
                              </button>

                              <button
                                onClick={() => handleDelete(doc.num_ref)}
                                style={{
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "8px 12px",
                                  fontSize: "13px",
                                  color: "#ef4444",
                                  background: "none",
                                  border: "none",
                                  borderTop: "1px solid #f1f5f9",
                                  cursor: "pointer"
                                }}
                              >
                                <i className="bi bi-trash"></i> Supprimer
                              </button>
                            </div>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* COMPOSANT MODALE D'AJOUT DE DOCUMENT */}
      <DocumentUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDocuments}
        user={user} // <-- TRANSMISSION DE LA PROP USER
      />
    </div>
  );
}